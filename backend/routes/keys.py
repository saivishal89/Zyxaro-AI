"""
Zaraki AI Platform — API Key Management Endpoints
Implements CRUD, revocation, and rotation for Zaraki API keys.
"""

import uuid
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status

from backend.database import get_connection
from backend.security import generate_api_key, safe_key_display

router = APIRouter(prefix="/api/v1/keys", tags=["API Keys"])


class CreateKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, example="My Research App")
    environment: str = Field("live", pattern="^(live|test)$", example="live")
    scopes: List[str] = Field(default=["chat"], example=["chat", "research"])
    rate_limit_rpm: int = Field(60, ge=1, le=1000, example=100)
    monthly_quota: int = Field(10000, ge=1, le=10000000, example=10000)
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)


class KeyMetadataResponse(BaseModel):
    id: str
    key_id: str
    name: str
    prefix: str
    last4: str
    environment: str
    scopes: List[str]
    is_active: bool
    rate_limit_rpm: int
    monthly_quota: int
    request_count: int
    created_at: str
    last_used_at: Optional[str] = None
    revoked_at: Optional[str] = None
    expires_at: Optional[str] = None


class CreateKeyResponse(KeyMetadataResponse):
    key: str  # The full plaintext key — shown ONLY once!
    warning: str = "This secret will only be shown once. Store it securely."


@router.post("", response_model=CreateKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_key(req: CreateKeyRequest):
    """
    Generate a new Zaraki API Key.
    The complete plaintext key is returned ONLY once in this response.
    Only the salted cryptographic hash is persisted.
    """
    user_id = "usr_default"
    full_key, key_id, secret, secret_hash, prefix, last4 = generate_api_key(req.environment)
    key_pk = f"key_{uuid.uuid4().hex[:12]}"
    scopes_str = ",".join(s.strip() for s in req.scopes if s.strip())

    expires_at = None
    if req.expires_in_days:
        expires_at = (
            datetime.datetime.utcnow() + datetime.timedelta(days=req.expires_in_days)
        ).isoformat()

    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO api_keys (
                    id, user_id, key_id, name, secret_hash, prefix, last4,
                    environment, scopes, is_active, rate_limit_rpm, monthly_quota,
                    request_count, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?)
                """,
                (
                    key_pk, user_id, key_id, req.name, secret_hash, prefix, last4,
                    req.environment, scopes_str, req.rate_limit_rpm, req.monthly_quota,
                    expires_at,
                ),
            )
            cursor = conn.execute("SELECT * FROM api_keys WHERE id = ?", (key_pk,))
            row = dict(cursor.fetchone())

        return CreateKeyResponse(
            id=row["id"],
            key_id=row["key_id"],
            name=row["name"],
            prefix=row["prefix"],
            last4=row["last4"],
            environment=row["environment"],
            scopes=[s for s in row["scopes"].split(",") if s],
            is_active=bool(row["is_active"]),
            rate_limit_rpm=row["rate_limit_rpm"],
            monthly_quota=row["monthly_quota"],
            request_count=row["request_count"],
            created_at=str(row["created_at"]),
            last_used_at=str(row["last_used_at"]) if row["last_used_at"] else None,
            revoked_at=str(row["revoked_at"]) if row["revoked_at"] else None,
            expires_at=str(row["expires_at"]) if row["expires_at"] else None,
            key=full_key,
        )
    finally:
        conn.close()


@router.get("", response_model=List[KeyMetadataResponse])
async def list_keys():
    """List all API keys with metadata (secrets and hashes are NEVER returned)."""
    user_id = "usr_default"
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT id, key_id, name, prefix, last4, environment, scopes,
                   is_active, rate_limit_rpm, monthly_quota, request_count,
                   created_at, last_used_at, revoked_at, expires_at
            FROM api_keys
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = [dict(r) for r in cursor.fetchall()]
        return [
            KeyMetadataResponse(
                id=r["id"],
                key_id=r["key_id"],
                name=r["name"],
                prefix=r["prefix"],
                last4=r["last4"],
                environment=r["environment"],
                scopes=[s for s in r["scopes"].split(",") if s],
                is_active=bool(r["is_active"]),
                rate_limit_rpm=r["rate_limit_rpm"],
                monthly_quota=r["monthly_quota"],
                request_count=r["request_count"],
                created_at=str(r["created_at"]),
                last_used_at=str(r["last_used_at"]) if r["last_used_at"] else None,
                revoked_at=str(r["revoked_at"]) if r["revoked_at"] else None,
                expires_at=str(r["expires_at"]) if r["expires_at"] else None,
            )
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/{id}", response_model=KeyMetadataResponse)
async def get_key(id: str):
    """Retrieve metadata for a single key."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT id, key_id, name, prefix, last4, environment, scopes,
                   is_active, rate_limit_rpm, monthly_quota, request_count,
                   created_at, last_used_at, revoked_at, expires_at
            FROM api_keys
            WHERE id = ? OR key_id = ?
            """,
            (id, id),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": {"code": "KEY_NOT_FOUND", "message": f"Key '{id}' not found."}},
            )
        r = dict(row)
        return KeyMetadataResponse(
            id=r["id"],
            key_id=r["key_id"],
            name=r["name"],
            prefix=r["prefix"],
            last4=r["last4"],
            environment=r["environment"],
            scopes=[s for s in r["scopes"].split(",") if s],
            is_active=bool(r["is_active"]),
            rate_limit_rpm=r["rate_limit_rpm"],
            monthly_quota=r["monthly_quota"],
            request_count=r["request_count"],
            created_at=str(r["created_at"]),
            last_used_at=str(r["last_used_at"]) if r["last_used_at"] else None,
            revoked_at=str(r["revoked_at"]) if r["revoked_at"] else None,
            expires_at=str(r["expires_at"]) if r["expires_at"] else None,
        )
    finally:
        conn.close()


@router.delete("/{id}", response_model=KeyMetadataResponse)
async def revoke_key(id: str):
    """Revoke an API key immediately so it can no longer authenticate requests."""
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                "SELECT * FROM api_keys WHERE id = ? OR key_id = ?",
                (id, id),
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"error": {"code": "KEY_NOT_FOUND", "message": f"Key '{id}' not found."}},
                )

            conn.execute(
                """
                UPDATE api_keys
                SET is_active = 0,
                    revoked_at = CURRENT_TIMESTAMP
                WHERE id = ? OR key_id = ?
                """,
                (id, id),
            )
            cursor = conn.execute(
                "SELECT * FROM api_keys WHERE id = ? OR key_id = ?",
                (id, id),
            )
            r = dict(cursor.fetchone())

        return KeyMetadataResponse(
            id=r["id"],
            key_id=r["key_id"],
            name=r["name"],
            prefix=r["prefix"],
            last4=r["last4"],
            environment=r["environment"],
            scopes=[s for s in r["scopes"].split(",") if s],
            is_active=bool(r["is_active"]),
            rate_limit_rpm=r["rate_limit_rpm"],
            monthly_quota=r["monthly_quota"],
            request_count=r["request_count"],
            created_at=str(r["created_at"]),
            last_used_at=str(r["last_used_at"]) if r["last_used_at"] else None,
            revoked_at=str(r["revoked_at"]) if r["revoked_at"] else None,
            expires_at=str(r["expires_at"]) if r["expires_at"] else None,
        )
    finally:
        conn.close()


@router.post("/{id}/rotate", response_model=CreateKeyResponse)
async def rotate_key(id: str):
    """
    Atomically revoke an existing key and issue a new replacement key
    with identical name, environment, scopes, rate limit, and quota.
    """
    conn = get_connection()
    try:
        with conn:
            cursor = conn.execute(
                "SELECT * FROM api_keys WHERE id = ? OR key_id = ?",
                (id, id),
            )
            old_row = cursor.fetchone()
            if not old_row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"error": {"code": "KEY_NOT_FOUND", "message": f"Key '{id}' not found."}},
                )
            old = dict(old_row)

            # Revoke existing key
            conn.execute(
                """
                UPDATE api_keys
                SET is_active = 0,
                    revoked_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (old["id"],),
            )

            # Generate new key
            full_key, new_key_id, secret, secret_hash, prefix, last4 = generate_api_key(old["environment"])
            new_key_pk = f"key_{uuid.uuid4().hex[:12]}"

            conn.execute(
                """
                INSERT INTO api_keys (
                    id, user_id, key_id, name, secret_hash, prefix, last4,
                    environment, scopes, is_active, rate_limit_rpm, monthly_quota,
                    request_count, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, ?)
                """,
                (
                    new_key_pk, old["user_id"], new_key_id, old["name"],
                    secret_hash, prefix, last4, old["environment"], old["scopes"],
                    old["rate_limit_rpm"], old["monthly_quota"], old["expires_at"]
                ),
            )

            cursor = conn.execute("SELECT * FROM api_keys WHERE id = ?", (new_key_pk,))
            row = dict(cursor.fetchone())

        return CreateKeyResponse(
            id=row["id"],
            key_id=row["key_id"],
            name=row["name"],
            prefix=row["prefix"],
            last4=row["last4"],
            environment=row["environment"],
            scopes=[s for s in row["scopes"].split(",") if s],
            is_active=bool(row["is_active"]),
            rate_limit_rpm=row["rate_limit_rpm"],
            monthly_quota=row["monthly_quota"],
            request_count=row["request_count"],
            created_at=str(row["created_at"]),
            last_used_at=str(row["last_used_at"]) if row["last_used_at"] else None,
            revoked_at=str(row["revoked_at"]) if row["revoked_at"] else None,
            expires_at=str(row["expires_at"]) if row["expires_at"] else None,
            key=full_key,
        )
    finally:
        conn.close()
