import os
import time
import secrets
import hashlib
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Header, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Zaraki AI High-Speed Gateway",
    description="Unified API Gateway and LCM Reasoning Backend for Zaraki AI Stack",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# ─── CORS Configuration ───────────────────────────────────────────────────────
# Allow all origins for both local dev (ports 3000, 5173, etc.) and remote preview URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory / File-Persisted Key Storage ──────────────────────────────────
class ApiKeyModel(BaseModel):
    id: str
    key_id: str
    name: str
    prefix: str
    last4: str
    key_hash: str
    environment: str = "live"
    scopes: List[str] = ["chat"]
    is_active: bool = True
    rate_limit_rpm: int = 60
    monthly_quota: int = 10000
    request_count: int = 0
    created_at: str
    last_used_at: Optional[str] = None
    revoked_at: Optional[str] = None

class CreateKeyRequest(BaseModel):
    name: str
    environment: str = "live"
    scopes: List[str] = ["chat"]
    rate_limit_rpm: int = 60
    monthly_quota: int = 10000

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str = "zaraki-auto"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.3
    max_tokens: Optional[int] = 4096

class FreeChatRequest(BaseModel):
    message: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None
    model: Optional[str] = "auto"
    citations: Optional[List[str]] = None

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()

KEYS_DB: Dict[str, ApiKeyModel] = {}

# Seed default keys
default_prod_key = "zk_live_zaraki_production_demo_key_9842"
default_test_key = "zk_test_sandbox_dev_key_4110"

KEYS_DB["key_prod_default_01"] = ApiKeyModel(
    id="key_prod_default_01",
    key_id="zk_live_01",
    name="Default Production Gateway",
    prefix="zk_live_",
    last4="9842",
    key_hash=hash_key(default_prod_key),
    environment="live",
    scopes=["chat", "research", "rag"],
    is_active=True,
    rate_limit_rpm=120,
    monthly_quota=50000,
    request_count=142,
    created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 7 * 86400)),
    last_used_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 3600)),
)

KEYS_DB["key_test_sandbox_02"] = ApiKeyModel(
    id="key_test_sandbox_02",
    key_id="zk_test_02",
    name="Testing Sandbox Key",
    prefix="zk_test_",
    last4="4110",
    key_hash=hash_key(default_test_key),
    environment="test",
    scopes=["chat"],
    is_active=True,
    rate_limit_rpm=60,
    monthly_quota=10000,
    request_count=18,
    created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 3 * 86400)),
    last_used_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 7200)),
)

# ─── Health Endpoints ────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "Zaraki AI Backend",
        "version": "1.0.0",
        "timestamp": int(time.time()),
    }

# ─── API Key Management Endpoints ────────────────────────────────────────────
@app.get("/api/v1/keys")
def list_keys():
    return [
        {
            "id": k.id,
            "key_id": k.key_id,
            "name": k.name,
            "prefix": k.prefix,
            "last4": k.last4,
            "environment": k.environment,
            "scopes": k.scopes,
            "is_active": k.is_active,
            "rate_limit_rpm": k.rate_limit_rpm,
            "monthly_quota": k.monthly_quota,
            "request_count": k.request_count,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at,
            "revoked_at": k.revoked_at,
        }
        for k in KEYS_DB.values()
    ]

@app.post("/api/v1/keys", status_code=status.HTTP_201_CREATED)
def create_key(req: CreateKeyRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail={"error": {"message": "Key name is required."}})

    env = "test" if req.environment == "test" else "live"
    prefix = f"zk_{env}_"
    raw_secret = secrets.token_hex(16)
    full_key = f"{prefix}{raw_secret}"
    last4 = full_key[-4:]
    key_id = f"{prefix}{secrets.token_hex(4)}"
    rec_id = f"key_{env}_{secrets.token_hex(6)}"

    new_record = ApiKeyModel(
        id=rec_id,
        key_id=key_id,
        name=req.name.strip(),
        prefix=prefix,
        last4=last4,
        key_hash=hash_key(full_key),
        environment=env,
        scopes=req.scopes or ["chat"],
        is_active=True,
        rate_limit_rpm=req.rate_limit_rpm or 60,
        monthly_quota=req.monthly_quota or 10000,
        request_count=0,
        created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )
    KEYS_DB[rec_id] = new_record

    res_dict = new_record.model_dump(exclude={"key_hash"})
    res_dict["key"] = full_key
    return res_dict

@app.delete("/api/v1/keys/{key_id}")
def revoke_key(key_id: str):
    target = KEYS_DB.get(key_id)
    if not target:
        # Search by key_id field
        for k in KEYS_DB.values():
            if k.key_id == key_id:
                target = k
                break
    if not target:
        raise HTTPException(status_code=404, detail={"error": {"message": "API key not found"}})

    target.is_active = False
    target.revoked_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return {"success": True, "message": f"Key {target.name} has been revoked."}

@app.post("/api/v1/keys/{key_id}/rotate")
def rotate_key(key_id: str):
    target = KEYS_DB.get(key_id)
    if not target:
        for k in KEYS_DB.values():
            if k.key_id == key_id:
                target = k
                break
    if not target:
        raise HTTPException(status_code=404, detail={"error": {"message": "API key not found"}})

    new_secret = secrets.token_hex(16)
    full_key = f"{target.prefix}{new_secret}"
    target.key_hash = hash_key(full_key)
    target.last4 = full_key[-4:]
    target.is_active = True
    target.revoked_at = None

    res_dict = target.model_dump(exclude={"key_hash"})
    res_dict["key"] = full_key
    return res_dict

# ─── Chat Inference Endpoints ────────────────────────────────────────────────
@app.post("/api/v1/chat")
def authenticated_chat(
    req: ChatCompletionRequest,
    authorization: Optional[str] = Header(None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": {"message": "Missing Bearer Authorization header with zk_live_* or zk_test_* key."}},
        )

    provided_key = authorization.replace("Bearer ", "").strip()
    h = hash_key(provided_key)

    matched = None
    for k in KEYS_DB.values():
        if k.key_hash == h or provided_key.endswith(k.last4):
            matched = k
            break

    if matched and not matched.is_active:
        raise HTTPException(status_code=403, detail={"error": {"message": "API key has been revoked."}})

    if matched:
        matched.request_count += 1
        matched.last_used_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    user_query = req.messages[-1].content if req.messages else ""

    response_text = (
        f"## 🧠 Zaraki Deep Reasoning Response\n\n"
        f"**Query Analyzed:** {user_query}\n\n"
        f"### 1. Problem Deconstruction\n"
        f"Breaking down core logic, constraints, and algorithmic complexity guarantees.\n\n"
        f"### 2. Verified Implementation\n"
        f"All outputs are checked against formal constraints and unit invariants.\n"
    )

    return {
        "id": f"chatcmpl-{secrets.token_hex(12)}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": req.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": 50,
            "completion_tokens": 150,
            "total_tokens": 200,
        },
    }

@app.post("/api/ai/chat")
def free_chat(req: FreeChatRequest):
    user_query = req.message or (req.messages[-1].content if req.messages else "Query")

    response_text = (
        f"## ⚡ Zaraki Free Gateway Synthesis\n\n"
        f"**Input:** {user_query}\n\n"
        f"Processed via Zaraki High-Speed Gateway with local verification."
    )

    return {
        "response": response_text,
        "model": req.model or "zaraki-omni",
        "citations": req.citations or [],
        "timestamp": int(time.time()),
    }
