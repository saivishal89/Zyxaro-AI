"""
Zaraki AI Platform — Authentication & Policy Middleware
Validates Zaraki API Keys, verifies cryptographic hashes, enforces scope authorization,
rate limiting (RPM), monthly quotas, and records telemetry.
"""

import time
import uuid
from typing import Optional, Dict, Any, List
from collections import defaultdict
import logging

from fastapi import Request, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.database import get_connection
from backend.security import parse_api_key, verify_secret, safe_key_display

logger = logging.getLogger("zaraki.auth")

security_bearer = HTTPBearer(auto_error=False)

# In-memory sliding window for rate limiting: key_id -> list of float timestamps
_rate_limit_tracker: Dict[str, List[float]] = defaultdict(list)


def raise_api_error(status_code: int, code: str, message: str):
    """Raises a standardized JSON error response."""
    raise HTTPException(
        status_code=status_code,
        detail={
            "error": {
                "code": code,
                "message": message,
            }
        },
    )


def extract_raw_api_key(request: Request, bearer_creds: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    """Extract raw key from Authorization: Bearer <key> or X-Zaraki-Key: <key> header."""
    if bearer_creds and bearer_creds.credentials:
        return bearer_creds.credentials.strip()
    
    x_key = request.headers.get("x-zaraki-key")
    if x_key:
        return x_key.strip()
        
    auth_header = request.headers.get("authorization")
    if auth_header:
        parts = auth_header.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        elif len(parts) == 1 and parts[0].startswith("zk_"):
            return parts[0]
            
    return None


async def get_authenticated_key(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> Dict[str, Any]:
    """
    FastAPI dependency that validates the Zaraki API Key.
    Attaches authenticated key record to request and returns key metadata.
    """
    raw_key = extract_raw_api_key(request, bearer)
    if not raw_key:
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_API_KEY",
            "Missing Zaraki API key. Provide via 'Authorization: Bearer zk_...' or 'X-Zaraki-Key: zk_...'"
        )

    parsed = parse_api_key(raw_key)
    if not parsed:
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_API_KEY",
            "Invalid API key format. Expected zk_live_<id>_<secret> or zk_test_<id>_<secret>"
        )

    env, key_id, secret = parsed

    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM api_keys WHERE key_id = ?", (key_id,))
        record = cursor.fetchone()

        if not record:
            raise_api_error(
                status.HTTP_401_UNAUTHORIZED,
                "INVALID_API_KEY",
                "API key not found."
            )

        key_data = dict(record)

        # 1. Cryptographic Secret Hash Verification
        if not verify_secret(secret, key_data["secret_hash"]):
            logger.warning(f"Failed hash verification for key_id: {key_id}")
            raise_api_error(
                status.HTTP_401_UNAUTHORIZED,
                "INVALID_API_KEY",
                "Invalid API key secret."
            )

        # 2. Revocation Check
        if not key_data["is_active"] or key_data["revoked_at"] is not None:
            raise_api_error(
                status.HTTP_401_UNAUTHORIZED,
                "REVOKED_API_KEY",
                f"This API key ({safe_key_display(key_data['prefix'], key_data['last4'])}) has been revoked."
            )

        # 3. Expiration Check
        if key_data["expires_at"]:
            import datetime
            try:
                exp = datetime.datetime.fromisoformat(key_data["expires_at"])
                if datetime.datetime.utcnow() > exp:
                    raise_api_error(
                        status.HTTP_401_UNAUTHORIZED,
                        "EXPIRED_API_KEY",
                        "This API key has expired."
                    )
            except HTTPException:
                raise
            except Exception as e:
                logger.warning(f"Error parsing expires_at: {e}")

        # 4. Rate Limiting Check (Requests Per Minute)
        now = time.time()
        window = _rate_limit_tracker[key_id]
        # Keep only timestamps in the last 60 seconds
        window = [ts for ts in window if now - ts < 60.0]
        _rate_limit_tracker[key_id] = window

        rate_limit = key_data.get("rate_limit_rpm", 60)
        if len(window) >= rate_limit:
            raise_api_error(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "RATE_LIMIT_EXCEEDED",
                f"Rate limit exceeded: {rate_limit} requests/min. Please slow down."
            )

        # 5. Monthly Quota Check
        request_count = key_data.get("request_count", 0)
        monthly_quota = key_data.get("monthly_quota", 10000)
        if request_count >= monthly_quota:
            raise_api_error(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "QUOTA_EXCEEDED",
                f"Monthly request quota of {monthly_quota} requests has been reached."
            )

        # Append timestamp for rate limiter
        window.append(now)

        # Update last_used_at and increment request_count
        conn.execute(
            """
            UPDATE api_keys
            SET last_used_at = CURRENT_TIMESTAMP,
                request_count = request_count + 1
            WHERE key_id = ?
            """,
            (key_id,),
        )
        conn.commit()

        # Attach safe metadata to request.state
        request.state.api_key = key_data
        return key_data

    finally:
        conn.close()


def require_scope(required_scope: str):
    """Dependency factory that verifies key has the necessary scope."""
    async def scope_checker(key_data: Dict[str, Any] = Security(get_authenticated_key)):
        scopes = [s.strip() for s in key_data.get("scopes", "").split(",") if s.strip()]
        if required_scope not in scopes and "*" not in scopes:
            raise_api_error(
                status.HTTP_403_FORBIDDEN,
                "INSUFFICIENT_SCOPE",
                f"API key lacks the required '{required_scope}' scope. Available scopes: {scopes}"
            )
        return key_data
    return scope_checker


def record_usage(key_id: str, endpoint: str, status_code: int, tokens_used: int = 0):
    """Record request telemetry into api_key_usage."""
    try:
        conn = get_connection()
        with conn:
            conn.execute(
                """
                INSERT INTO api_key_usage (id, key_id, endpoint, status_code, tokens_used)
                VALUES (?, ?, ?, ?, ?)
                """,
                (f"usg_{uuid.uuid4().hex[:12]}", key_id, endpoint, status_code, tokens_used),
            )
        conn.close()
    except Exception as e:
        logger.error(f"Failed to record usage telemetry for {key_id}: {e}")
