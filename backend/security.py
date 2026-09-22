"""
Zaraki AI Platform — Cryptographic Security & Key Utilities
Handles key generation, PBKDF2-SHA256 salted hashing, constant-time verification,
and safe token parsing.
"""

import re
import secrets
import hashlib
import hmac
from typing import Optional, Tuple

KEY_REGEX = re.compile(r"^zk_(live|test)_([a-f0-9]{8})_([A-Za-z0-9_-]{24,})$")
HASH_ITERATIONS = 100_000

def generate_api_key(environment: str = "live") -> Tuple[str, str, str, str, str, str]:
    """
    Generates a cryptographically secure Zaraki API key.
    
    Returns:
        full_key: e.g. 'zk_live_7f83a91c_AbCdEf...'
        key_id: e.g. '7f83a91c' (public lookup identifier)
        secret: the unhashed raw secret (revealed once)
        secret_hash: salt:hash representation stored in DB
        prefix: e.g. 'zk_live_7f83a91c'
        last4: last 4 characters of secret for identification
    """
    if environment not in ("live", "test"):
        raise ValueError("Environment must be 'live' or 'test'")
        
    key_id = secrets.token_hex(4)  # 8 hex chars
    secret = secrets.token_urlsafe(32)  # ~43 chars URL-safe base64
    full_key = f"zk_{environment}_{key_id}_{secret}"
    prefix = f"zk_{environment}_{key_id}"
    last4 = secret[-4:]
    
    secret_hash = hash_secret(secret)
    return full_key, key_id, secret, secret_hash, prefix, last4

def hash_secret(secret: str) -> str:
    """Hash a raw secret using PBKDF2-HMAC-SHA256 with a unique random salt."""
    salt = secrets.token_hex(16)
    key_hash = hashlib.pbkdf2_hmac(
        "sha256",
        secret.encode("utf-8"),
        bytes.fromhex(salt),
        HASH_ITERATIONS
    ).hex()
    return f"{salt}:{key_hash}"

def verify_secret(secret: str, stored_hash: str) -> bool:
    """Constant-time verification of a raw secret against a stored salt:hash string."""
    try:
        parts = stored_hash.split(":")
        if len(parts) != 2:
            return False
        salt, expected_hash = parts
        computed_hash = hashlib.pbkdf2_hmac(
            "sha256",
            secret.encode("utf-8"),
            bytes.fromhex(salt),
            HASH_ITERATIONS
        ).hex()
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False

def parse_api_key(raw_key: str) -> Optional[Tuple[str, str, str]]:
    """
    Parses and validates a raw API key.
    Returns (environment, key_id, secret) if valid, or None if invalid.
    """
    if not raw_key or not isinstance(raw_key, str):
        return None
    match = KEY_REGEX.match(raw_key.strip())
    if not match:
        return None
    env, key_id, secret = match.groups()
    return env, key_id, secret

def safe_key_display(prefix: str, last4: str) -> str:
    """Safe representation for logging and dashboards (e.g. zk_live_7f83a91c_...9a1f)."""
    return f"{prefix}_...{last4}"
