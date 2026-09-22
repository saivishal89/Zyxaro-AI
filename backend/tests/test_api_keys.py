"""
Zaraki AI Platform — Comprehensive Test Suite for API Keys & Gateway
Tests:
  1. Key Generation & Cryptographic Hashing
  2. Database Plaintext Secret Audit (Zero secrets stored)
  3. Successful AI Chat via Bearer Token & X-Zaraki-Key header
  4. Invalid API Key (401 INVALID_API_KEY)
  5. Revoked API Key (401 REVOKED_API_KEY)
  6. Expired API Key (401 EXPIRED_API_KEY)
  7. Insufficient Scope (403 INSUFFICIENT_SCOPE)
  8. Rate Limiting Enforced (429 RATE_LIMIT_EXCEEDED)
  9. Monthly Quota Enforced (429 QUOTA_EXCEEDED)
  10. Key Rotation (Atomically revokes old, issues new working key)
  11. Usage Telemetry Recorded
"""

import sys
import os
import asyncio
from pathlib import Path

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_connection, init_db

client = TestClient(app)


def setup_module():
    """Ensure database schema is ready before tests run."""
    init_db()


def test_01_create_key_and_verify_format():
    """Test creating live and test keys, verify structure and single secret return."""
    # 1. Create Live Key
    res_live = client.post(
        "/api/v1/keys",
        json={
            "name": "Production Service",
            "environment": "live",
            "scopes": ["chat", "research"],
            "rate_limit_rpm": 60,
            "monthly_quota": 5000,
        },
    )
    assert res_live.status_code == 201, res_live.text
    data_live = res_live.json()
    assert data_live["environment"] == "live"
    assert data_live["prefix"].startswith("zk_live_")
    assert data_live["key"].startswith("zk_live_")
    assert "secret" not in data_live  # field name is 'key', never leak raw hash or 'secret'
    assert "secret_hash" not in data_live
    assert len(data_live["last4"]) == 4

    # 2. Create Test Key
    res_test = client.post(
        "/api/v1/keys",
        json={
            "name": "Local Sandbox",
            "environment": "test",
            "scopes": ["chat"],
            "rate_limit_rpm": 30,
            "monthly_quota": 1000,
        },
    )
    assert res_test.status_code == 201, res_test.text
    data_test = res_test.json()
    assert data_test["environment"] == "test"
    assert data_test["prefix"].startswith("zk_test_")
    assert data_test["key"].startswith("zk_test_")


def test_02_database_plaintext_secret_audit():
    """Confirm that the raw plaintext secret is NEVER stored in the database."""
    res = client.post(
        "/api/v1/keys",
        json={"name": "Audit Key", "environment": "live", "scopes": ["chat"]},
    )
    assert res.status_code == 201
    res_data = res.json()
    full_key = res_data["key"]
    key_id = res_data["key_id"]
    # Extract raw secret portion
    raw_secret_only = full_key.split(f"_{key_id}_")[-1]

    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
        row = dict(cursor.fetchone())

        # Assert raw secret and full key are NOT present in any column
        for col_name, val in row.items():
            if val is not None:
                assert raw_secret_only not in str(val), f"Plaintext secret found in column {col_name}!"
                assert full_key not in str(val), f"Full key found in column {col_name}!"

        # Assert secret_hash is a salted hex hash
        assert ":" in row["secret_hash"]
        salt, h = row["secret_hash"].split(":")
        assert len(salt) == 32
        assert len(h) == 64
    finally:
        conn.close()


def test_03_list_keys_never_returns_secrets():
    """Verify listing keys returns metadata only."""
    res = client.get("/api/v1/keys")
    assert res.status_code == 200
    keys = res.json()
    assert len(keys) >= 1
    for k in keys:
        assert "key" not in k
        assert "secret" not in k
        assert "secret_hash" not in k
        assert "prefix" in k
        assert "last4" in k


def test_04_successful_chat_bearer_and_x_header():
    """Test AI Gateway chat completion via Bearer token and X-Zaraki-Key header."""
    # Create an active key
    res_create = client.post(
        "/api/v1/keys",
        json={"name": "Chat Key", "environment": "live", "scopes": ["chat"]},
    )
    full_key = res_create.json()["key"]

    payload = {
        "model": "zaraki-auto",
        "messages": [
            {"role": "user", "content": "Explain quantum computing simply"}
        ],
    }

    # 1. Using Authorization: Bearer <key>
    res1 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json=payload,
    )
    assert res1.status_code == 200, res1.text
    data1 = res1.json()
    assert data1["object"] == "chat.completion"
    assert data1["provider"] in ("mock", "omniroute")
    assert len(data1["choices"]) > 0
    assert len(data1["choices"][0]["message"]["content"]) > 0
    assert data1["usage"]["total_tokens"] > 0

    # 2. Using X-Zaraki-Key header
    res2 = client.post(
        "/api/v1/chat",
        headers={"X-Zaraki-Key": full_key},
        json={"messages": [{"role": "user", "content": "Say hello"}]},
    )
    assert res2.status_code == 200, res2.text
    data2 = res2.json()
    assert len(data2["choices"][0]["message"]["content"]) > 0


def test_05_invalid_api_key():
    """Test request with malformed or fake API key."""
    # Malformed format
    res1 = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer not_a_real_key"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert res1.status_code == 401
    assert res1.json()["detail"]["error"]["code"] == "INVALID_API_KEY"

    # Well-formed format but non-existent key_id
    res2 = client.post(
        "/api/v1/chat",
        headers={"Authorization": "Bearer zk_live_deadbeef_AbCdEf12345678901234567890123456"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert res2.status_code == 401
    assert res2.json()["detail"]["error"]["code"] == "INVALID_API_KEY"


def test_06_revoked_api_key():
    """Test revoking an API key and verifying subsequent requests are rejected."""
    # Create key
    res_create = client.post(
        "/api/v1/keys",
        json={"name": "Key to Revoke", "environment": "live", "scopes": ["chat"]},
    )
    key_info = res_create.json()
    full_key = key_info["key"]
    key_id = key_info["id"]

    # Revoke key via DELETE endpoint
    res_del = client.delete(f"/api/v1/keys/{key_id}")
    assert res_del.status_code == 200
    assert res_del.json()["is_active"] is False
    assert res_del.json()["revoked_at"] is not None

    # Attempt to use revoked key
    res_chat = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert res_chat.status_code == 401
    assert res_chat.json()["detail"]["error"]["code"] == "REVOKED_API_KEY"


def test_07_expired_api_key():
    """Test that an expired API key is rejected with EXPIRED_API_KEY."""
    # Create key
    res_create = client.post(
        "/api/v1/keys",
        json={"name": "Expired Key", "environment": "test", "scopes": ["chat"]},
    )
    key_info = res_create.json()
    full_key = key_info["key"]
    key_pk = key_info["id"]

    # Manually set expires_at in the past
    conn = get_connection()
    with conn:
        conn.execute(
            "UPDATE api_keys SET expires_at = '2020-01-01T00:00:00' WHERE id = ?",
            (key_pk,),
        )
    conn.close()

    res_chat = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert res_chat.status_code == 401
    assert res_chat.json()["detail"]["error"]["code"] == "EXPIRED_API_KEY"


def test_08_insufficient_scope():
    """Test that a key lacking the 'chat' scope is rejected with 403 INSUFFICIENT_SCOPE."""
    res_create = client.post(
        "/api/v1/keys",
        json={"name": "Documents Key", "environment": "live", "scopes": ["documents"]},
    )
    full_key = res_create.json()["key"]

    res_chat = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert res_chat.status_code == 403
    assert res_chat.json()["detail"]["error"]["code"] == "INSUFFICIENT_SCOPE"


def test_09_rate_limiting_enforced():
    """Test that exceeding the requests per minute limit triggers 429 RATE_LIMIT_EXCEEDED."""
    res_create = client.post(
        "/api/v1/keys",
        json={
            "name": "Strict Rate Key",
            "environment": "live",
            "scopes": ["chat"],
            "rate_limit_rpm": 2,
        },
    )
    full_key = res_create.json()["key"]

    # 1st request -> 200
    r1 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 1"}]},
    )
    assert r1.status_code == 200

    # 2nd request -> 200
    r2 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 2"}]},
    )
    assert r2.status_code == 200

    # 3rd request (exceeds limit of 2/min) -> 429
    r3 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 3"}]},
    )
    assert r3.status_code == 429
    assert r3.json()["detail"]["error"]["code"] == "RATE_LIMIT_EXCEEDED"


def test_10_quota_enforced():
    """Test that reaching monthly quota returns 429 QUOTA_EXCEEDED."""
    res_create = client.post(
        "/api/v1/keys",
        json={
            "name": "Tiny Quota Key",
            "environment": "live",
            "scopes": ["chat"],
            "rate_limit_rpm": 100,
            "monthly_quota": 2,
        },
    )
    full_key = res_create.json()["key"]

    # 1st request -> OK
    r1 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 1"}]},
    )
    assert r1.status_code == 200

    # 2nd request -> OK
    r2 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 2"}]},
    )
    assert r2.status_code == 200

    # 3rd request -> Quota reached -> 429
    r3 = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Msg 3"}]},
    )
    assert r3.status_code == 429
    assert r3.json()["detail"]["error"]["code"] == "QUOTA_EXCEEDED"


def test_11_key_rotation():
    """Test rotating an API key revokes the old key and issues a working replacement."""
    res_create = client.post(
        "/api/v1/keys",
        json={
            "name": "Rotatable Key",
            "environment": "live",
            "scopes": ["chat", "research"],
            "rate_limit_rpm": 50,
        },
    )
    old_info = res_create.json()
    old_full_key = old_info["key"]
    old_id = old_info["id"]

    # Rotate key
    res_rotate = client.post(f"/api/v1/keys/{old_id}/rotate")
    assert res_rotate.status_code == 200
    new_info = res_rotate.json()
    new_full_key = new_info["key"]

    # Assert new key is different
    assert new_info["key_id"] != old_info["key_id"]
    assert new_full_key != old_full_key
    assert new_info["name"] == old_info["name"]
    assert new_info["scopes"] == old_info["scopes"]

    # Verify old key is now REVOKED
    old_req = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {old_full_key}"},
        json={"messages": [{"role": "user", "content": "Test"}]},
    )
    assert old_req.status_code == 401
    assert old_req.json()["detail"]["error"]["code"] == "REVOKED_API_KEY"

    # Verify new key WORKS
    new_req = client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {new_full_key}"},
        json={"messages": [{"role": "user", "content": "Test with rotated key"}]},
    )
    assert new_req.status_code == 200


def test_12_usage_telemetry_recorded():
    """Verify that requests record entries into api_key_usage."""
    res_create = client.post(
        "/api/v1/keys",
        json={"name": "Telemetry Key", "environment": "live", "scopes": ["chat"]},
    )
    key_info = res_create.json()
    full_key = key_info["key"]
    key_id = key_info["key_id"]

    client.post(
        "/api/v1/chat",
        headers={"Authorization": f"Bearer {full_key}"},
        json={"messages": [{"role": "user", "content": "Test telemetry"}]},
    )

    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM api_key_usage WHERE key_id = ?", (key_id,))
        rows = cursor.fetchall()
        assert len(rows) >= 1
        assert rows[0]["endpoint"] == "/api/v1/chat"
        assert rows[0]["status_code"] == 200
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running Zaraki API Key & Gateway Test Suite...")
    setup_module()
    test_01_create_key_and_verify_format()
    print("[PASS] test_01_create_key_and_verify_format")
    test_02_database_plaintext_secret_audit()
    print("[PASS] test_02_database_plaintext_secret_audit (NO plaintext secrets in DB)")
    test_03_list_keys_never_returns_secrets()
    print("[PASS] test_03_list_keys_never_returns_secrets")
    test_04_successful_chat_bearer_and_x_header()
    print("[PASS] test_04_successful_chat_bearer_and_x_header")
    test_05_invalid_api_key()
    print("[PASS] test_05_invalid_api_key")
    test_06_revoked_api_key()
    print("[PASS] test_06_revoked_api_key")
    test_07_expired_api_key()
    print("[PASS] test_07_expired_api_key")
    test_08_insufficient_scope()
    print("[PASS] test_08_insufficient_scope")
    test_09_rate_limiting_enforced()
    print("[PASS] test_09_rate_limiting_enforced")
    test_10_quota_enforced()
    print("[PASS] test_10_quota_enforced")
    test_11_key_rotation()
    print("[PASS] test_11_key_rotation")
    test_12_usage_telemetry_recorded()
    print("[PASS] test_12_usage_telemetry_recorded")
    print("\nALL 12 TESTS PASSED SUCCESSFULLY!")
