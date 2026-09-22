"""
Zaraki AI Platform — Database Layer
SQLite-based persistence for Users, API Keys, and Usage Metrics.
"""

import os
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger("zaraki.database")

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "zaraki.db"

def get_connection() -> sqlite3.Connection:
    """Obtain a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(str(DB_FILE), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Create schema tables and indices if they do not exist."""
    conn = get_connection()
    try:
        with conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                key_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                secret_hash TEXT NOT NULL,
                prefix TEXT NOT NULL,
                last4 TEXT NOT NULL,
                environment TEXT NOT NULL CHECK(environment IN ('live', 'test')),
                scopes TEXT NOT NULL DEFAULT 'chat',
                is_active INTEGER NOT NULL DEFAULT 1,
                rate_limit_rpm INTEGER NOT NULL DEFAULT 60,
                monthly_quota INTEGER NOT NULL DEFAULT 10000,
                request_count INTEGER NOT NULL DEFAULT 0,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used_at TIMESTAMP NULL,
                revoked_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_api_keys_lookup ON api_keys(key_id, is_active);
            CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

            CREATE TABLE IF NOT EXISTS api_key_usage (
                id TEXT PRIMARY KEY,
                key_id TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                status_code INTEGER NOT NULL,
                tokens_used INTEGER DEFAULT 0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (key_id) REFERENCES api_keys(key_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_ts ON api_key_usage(key_id, timestamp);
            """)

            # Seed a default developer account if empty
            cursor = conn.execute("SELECT id FROM users WHERE id = 'usr_default'")
            if not cursor.fetchone():
                conn.execute(
                    "INSERT INTO users (id, email) VALUES ('usr_default', 'developer@zaraki.ai')"
                )
        logger.info(f"Zaraki Database initialized successfully at: {DB_FILE}")
    finally:
        conn.close()
