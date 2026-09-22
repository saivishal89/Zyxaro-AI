"""
Zaraki AI — FastAPI Backend with OmniRoute AI Gateway
=====================================================
Purpose: Server-side AI proxy that routes through OmniRoute (352+ providers,
         90+ free tiers, ~1.51B free tokens/month) with Groq as a direct fallback.

OmniRoute runs locally on localhost:20128 and provides an OpenAI-compatible
endpoint that auto-routes to free providers — NO API keys needed to start.

Usage:
  1. Start OmniRoute:  omniroute (runs on localhost:20128)
  2. Start backend:    python -m uvicorn backend.main:app --reload --port 3001
  3. Test health:      curl http://localhost:3001/api/ai/health
  4. Test chat:        curl -X POST http://localhost:3001/api/ai/chat \
                         -H "Content-Type: application/json" \
                         -d "{\"message\":\"Say hello in one sentence\"}"

Providers (priority order):
  1. OmniRoute (localhost:20128) — free, auto-routes across 352+ providers
  2. Groq (direct) — fallback if OmniRoute is not running (requires GROQ_API_KEY)
"""

import os
import re
import time
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database import init_db
from backend.gateway import gateway_router, OmniRouteProvider, GroqProvider
from backend.routes.keys import router as keys_router
from backend.routes.chat import router as chat_router
from backend.orchestrator.pipeline import orchestrator
from backend.orchestrator.types import OrchestrationRequest

# ──────────────────────────────────────────────
# Load .env from project root (one level up from /backend)
# ──────────────────────────────────────────────
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("zaraki.backend")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

# Primary: OmniRoute local gateway (FREE — no API key needed)
OMNIROUTE_ENDPOINT = os.getenv("OMNIROUTE_ENDPOINT", "http://localhost:20128/v1/chat/completions")
OMNIROUTE_MODEL = os.getenv("OMNIROUTE_MODEL", "auto")  # auto-routes to best free provider

# Fallback: Direct Groq (requires API key)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


def mask_key(key: str) -> str:
    """Mask an API key for safe logging. Never log full keys."""
    if not key or len(key) < 8:
        return "***EMPTY***"
    return f"{key[:4]}...{key[-4:]}"


# ──────────────────────────────────────────────
# HTTP Client (reusable across requests)
# ──────────────────────────────────────────────
http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the httpx client lifecycle."""
    global http_client
    http_client = httpx.AsyncClient(timeout=60.0)
    logger.info("Zaraki Backend started")
    logger.info(f"OmniRoute endpoint: {OMNIROUTE_ENDPOINT}")
    logger.info(f"OmniRoute model: {OMNIROUTE_MODEL}")
    logger.info(f"GROQ_API_KEY configured (fallback): {'YES' if GROQ_API_KEY else 'NO'}")
    if GROQ_API_KEY:
        logger.info(f"GROQ_API_KEY (masked): {mask_key(GROQ_API_KEY)}")

    # Check if OmniRoute is running
    try:
        probe = await http_client.get("http://localhost:20128/", timeout=5.0)
        if probe.status_code in (200, 301, 302, 401):
            logger.info("✅ OmniRoute is running — primary provider active")
        else:
            logger.warning("⚠️  OmniRoute responded but may not be healthy")
    except Exception:
        logger.warning("⚠️  OmniRoute not detected on localhost:20128 — will use fallback providers")

    # Initialize database
    init_db()

    # Register providers in Gateway
    if GROQ_API_KEY:
        gateway_router.register_provider(GroqProvider(GROQ_API_KEY))
    gateway_router.register_provider(OmniRouteProvider(OMNIROUTE_ENDPOINT))

    yield
    await http_client.aclose()
    logger.info("Zaraki Backend stopped")


# ──────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────
app = FastAPI(
    title="Zaraki AI Backend",
    description="AI Gateway powered by OmniRoute — 352+ providers, 90+ free tiers",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS", "PUT"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Response Sanitizer Helper
# ──────────────────────────────────────────────
def sanitize_answer(text: str | None) -> str:
    """Strip any leaked internal prompt or RAG markers from the response."""
    if not text:
        return ""
    cleaned = text
    cleaned = re.sub(r'\[RAG KNOWLEDGE CONTEXT ACTIVATED\][\s\S]*?\[USER INSTRUCTION\]:?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[RAG KNOWLEDGE CONTEXT ACTIVATED\][^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][\s\S]*?\[(?:GROUNDING RULES|STRICT INSTRUCTION)\]:[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'INTERNAL RETRIEVAL CONTEXT:[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Use the following retrieved documents[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[USER INSTRUCTION\]:?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[(?:Document|Source)\s+\d+:[^\]]+\]\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<<SYS>>[\s\S]*?<</SYS>>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<<SYS>>|<</SYS>>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<\|im_start\|>system[\s\S]*?<\|im_end\|>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<\|im_start\|>system|<\|im_end\|>', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


# ──────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str | None = "Say hello in one sentence."
    messages: list[dict] | None = None
    model: str | None = None  # Override model (e.g. "auto/coding", "auto/fast")
    citations: list[str] | None = None
    documents: list[dict] | None = None


class ProviderStatus(BaseModel):
    provider: str
    configured: bool
    status: str  # SUCCESS | AUTH_FAILED | RATE_LIMITED | NETWORK_ERROR | NOT_CONFIGURED | PROVIDER_ERROR
    model: str | None = None
    latency_ms: int | None = None
    response_preview: str | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    status: str
    providers: list[ProviderStatus]
    timestamp: str


class ChatResponse(BaseModel):
    id: str | None = None
    answer: str | None = None
    text: str | None = None  # for backward compatibility
    citations: list[str] = []
    usage: dict | None = None
    provider: str
    model: str
    tokens: dict | None = None  # for backward compatibility
    latency_ms: int = 0
    error: str | None = None


# ──────────────────────────────────────────────
# Provider Health Checks
# ──────────────────────────────────────────────
async def check_omniroute_health() -> ProviderStatus:
    """Test OmniRoute local gateway connectivity."""
    start = time.monotonic()
    try:
        client = http_client or httpx.AsyncClient(timeout=20.0)
        resp = await client.post(
            OMNIROUTE_ENDPOINT,
            headers={"Content-Type": "application/json"},
            json={
                "model": OMNIROUTE_MODEL,
                "messages": [{"role": "user", "content": "Respond with only: OK"}],
                "max_tokens": 100,
                "temperature": 0.3,
            },
            timeout=20.0,
        )
        latency = int((time.monotonic() - start) * 1000)

        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices") or [{}]
            first_choice = choices[0] if isinstance(choices, list) and choices else {}
            msg = first_choice.get("message") if isinstance(first_choice, dict) else {}
            text = (msg.get("content") or "") if isinstance(msg, dict) else ""
            actual_model = data.get("model", OMNIROUTE_MODEL)
            return ProviderStatus(
                provider="omniroute",
                configured=True,
                status="SUCCESS",
                model=actual_model,
                latency_ms=latency,
                response_preview=text[:50],
            )
        else:
            body = resp.text[:200]
            return ProviderStatus(
                provider="omniroute",
                configured=True,
                status="PROVIDER_ERROR",
                model=OMNIROUTE_MODEL,
                latency_ms=latency,
                error=f"HTTP {resp.status_code}: {body}",
            )
    except httpx.ConnectError:
        latency = int((time.monotonic() - start) * 1000)
        return ProviderStatus(
            provider="omniroute",
            configured=False,
            status="NOT_CONFIGURED",
            latency_ms=latency,
            error="OmniRoute not running — start it with: omniroute",
        )
    except httpx.TimeoutException:
        latency = int((time.monotonic() - start) * 1000)
        return ProviderStatus(
            provider="omniroute",
            configured=True,
            status="NETWORK_ERROR",
            latency_ms=latency,
            error="OmniRoute timed out (15s)",
        )
    except Exception as e:
        latency = int((time.monotonic() - start) * 1000)
        return ProviderStatus(
            provider="omniroute",
            configured=True,
            status="NETWORK_ERROR",
            latency_ms=latency,
            error=f"Connection error: {type(e).__name__}: {str(e)[:100]}",
        )


async def check_groq_health() -> ProviderStatus:
    """Test Groq API connectivity with a minimal request."""
    if not GROQ_API_KEY:
        return ProviderStatus(
            provider="groq",
            configured=False,
            status="NOT_CONFIGURED",
            error="GROQ_API_KEY not set in .env (optional — OmniRoute is primary)",
        )

    start = time.monotonic()
    try:
        client = http_client or httpx.AsyncClient(timeout=30.0)
        resp = await client.post(
            GROQ_ENDPOINT,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": "Respond with only: OK"}],
                "max_tokens": 5,
                "temperature": 0,
            },
        )
        latency = int((time.monotonic() - start) * 1000)

        if resp.status_code == 200:
            data = resp.json()
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return ProviderStatus(
                provider="groq",
                configured=True,
                status="SUCCESS",
                model=GROQ_MODEL,
                latency_ms=latency,
                response_preview=text[:50],
            )
        elif resp.status_code == 401:
            return ProviderStatus(
                provider="groq",
                configured=True,
                status="AUTH_FAILED",
                model=GROQ_MODEL,
                latency_ms=latency,
                error="Invalid API key — check GROQ_API_KEY in .env",
            )
        elif resp.status_code == 429:
            return ProviderStatus(
                provider="groq",
                configured=True,
                status="RATE_LIMITED",
                model=GROQ_MODEL,
                latency_ms=latency,
                error="Rate limit exceeded — wait and retry",
            )
        else:
            body = resp.text[:200]
            return ProviderStatus(
                provider="groq",
                configured=True,
                status="PROVIDER_ERROR",
                model=GROQ_MODEL,
                latency_ms=latency,
                error=f"HTTP {resp.status_code}: {body}",
            )
    except httpx.TimeoutException:
        latency = int((time.monotonic() - start) * 1000)
        return ProviderStatus(
            provider="groq",
            configured=True,
            status="NETWORK_ERROR",
            latency_ms=latency,
            error="Request timed out (60s)",
        )
    except Exception as e:
        latency = int((time.monotonic() - start) * 1000)
        return ProviderStatus(
            provider="groq",
            configured=True,
            status="NETWORK_ERROR",
            latency_ms=latency,
            error=f"Connection error: {type(e).__name__}: {str(e)[:100]}",
        )


# ──────────────────────────────────────────────
# Chat Helper — tries OmniRoute first, falls back to Groq
# ──────────────────────────────────────────────
async def _call_omniroute(messages: list[dict], model: str | None = None, citations: list[str] | None = None) -> ChatResponse | None:
    """Try OmniRoute. Returns None if OmniRoute is unreachable (so caller can fallback)."""
    use_model = model or OMNIROUTE_MODEL
    if use_model in ("zaraki-auto", ""):
        use_model = "auto"
    start = time.monotonic()
    try:
        client = http_client or httpx.AsyncClient(timeout=30.0)
        resp = await client.post(
            OMNIROUTE_ENDPOINT,
            headers={"Content-Type": "application/json"},
            json={
                "model": use_model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 2048,
            },
            timeout=30.0,
        )
        latency = int((time.monotonic() - start) * 1000)

        if resp.status_code == 200:
            data = resp.json()
            req_id = data.get("id") or f"req_{uuid.uuid4().hex[:12]}"
            choices = data.get("choices") or [{}]
            first_choice = choices[0] if isinstance(choices, list) and choices else {}
            msg = first_choice.get("message") if isinstance(first_choice, dict) else {}
            raw_text = (msg.get("content") or "") if isinstance(msg, dict) else ""
            clean_text = sanitize_answer(raw_text)
            usage = data.get("usage", {}) or {}
            actual_model = data.get("model", use_model)

            logger.info(
                f"OmniRoute OK | id={req_id} | model={actual_model} | latency={latency}ms | "
                f"tokens={usage.get('total_tokens', '?')}"
            )

            return ChatResponse(
                id=req_id,
                answer=clean_text,
                text=clean_text,
                citations=citations or [],
                usage=usage,
                provider="omniroute",
                model=actual_model,
                tokens={
                    "prompt": usage.get("prompt_tokens", 0),
                    "completion": usage.get("completion_tokens", 0),
                    "total": usage.get("total_tokens", 0),
                },
                latency_ms=latency,
            )
        else:
            error_body = resp.text[:200]
            logger.warning(f"OmniRoute HTTP {resp.status_code}: {error_body}")
            return ChatResponse(
                id=f"err_{uuid.uuid4().hex[:12]}",
                answer="",
                text="",
                citations=citations or [],
                provider="omniroute",
                model=use_model,
                latency_ms=latency,
                error=f"HTTP {resp.status_code}: {error_body}",
            )

    except httpx.ConnectError:
        logger.warning("OmniRoute not reachable — falling back")
        return None  # Signal caller to use fallback
    except httpx.TimeoutException:
        latency = int((time.monotonic() - start) * 1000)
        logger.warning(f"OmniRoute timed out after {latency}ms")
        return None  # Signal caller to use fallback
    except Exception as e:
        logger.error(f"OmniRoute error: {type(e).__name__}: {e}")
        return None


async def _call_groq(messages: list[dict], citations: list[str] | None = None) -> ChatResponse:
    """Direct Groq call — used as fallback when OmniRoute is unavailable."""
    if not GROQ_API_KEY:
        return ChatResponse(
            id=f"err_{uuid.uuid4().hex[:12]}",
            answer="",
            text="",
            citations=citations or [],
            provider="groq",
            model=GROQ_MODEL,
            latency_ms=0,
            error="No providers available. Start OmniRoute (omniroute) or set GROQ_API_KEY in .env",
        )

    start = time.monotonic()
    try:
        client = http_client or httpx.AsyncClient(timeout=60.0)
        resp = await client.post(
            GROQ_ENDPOINT,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 2048,
            },
        )
        latency = int((time.monotonic() - start) * 1000)

        if resp.status_code != 200:
            error_body = resp.text[:200]
            status_map = {
                401: "AUTH_FAILED: Invalid API key",
                403: "ACCESS_DENIED: Key lacks permissions",
                429: "RATE_LIMITED: Too many requests",
                404: f"INVALID_MODEL: {GROQ_MODEL} not found",
            }
            return ChatResponse(
                id=f"err_{uuid.uuid4().hex[:12]}",
                answer="",
                text="",
                citations=citations or [],
                provider="groq",
                model=GROQ_MODEL,
                latency_ms=latency,
                error=status_map.get(resp.status_code, f"HTTP {resp.status_code}: {error_body}"),
            )

        data = resp.json()
        req_id = data.get("id") or f"req_{uuid.uuid4().hex[:12]}"
        raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        clean_text = sanitize_answer(raw_text)
        usage = data.get("usage", {})

        logger.info(f"Groq fallback OK | id={req_id} | latency={latency}ms | tokens={usage.get('total_tokens', '?')}")

        return ChatResponse(
            id=req_id,
            answer=clean_text,
            text=clean_text,
            citations=citations or [],
            usage=usage,
            provider="groq",
            model=data.get("model", GROQ_MODEL),
            tokens={
                "prompt": usage.get("prompt_tokens", 0),
                "completion": usage.get("completion_tokens", 0),
                "total": usage.get("total_tokens", 0),
            },
            latency_ms=latency,
        )

    except httpx.TimeoutException:
        latency = int((time.monotonic() - start) * 1000)
        return ChatResponse(
            id=f"err_{uuid.uuid4().hex[:12]}",
            answer="",
            text="",
            citations=citations or [],
            provider="groq",
            model=GROQ_MODEL,
            latency_ms=latency,
            error="Request timed out after 60 seconds",
        )
    except Exception as e:
        latency = int((time.monotonic() - start) * 1000)
        logger.error(f"Groq call failed: {type(e).__name__}: {e}")
        return ChatResponse(
            id=f"err_{uuid.uuid4().hex[:12]}",
            answer="",
            text="",
            citations=citations or [],
            provider="groq",
            model=GROQ_MODEL,
            latency_ms=latency,
            error=f"Connection error: {type(e).__name__}",
        )


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.get("/")
async def root():
    return {"service": "zaraki-ai-backend", "version": "0.2.0", "status": "running", "gateway": "omniroute"}


@app.get("/api/ai/health", response_model=HealthResponse)
async def provider_health():
    """
    Diagnostic endpoint: test each configured AI provider.
    Returns per-provider status without exposing API keys.
    """
    omniroute_status = await check_omniroute_health()
    groq_status = await check_groq_health()

    return HealthResponse(
        status="ok",
        providers=[omniroute_status, groq_status],
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    )


@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Intelligent chat endpoint powered by Zaraki AI Orchestrator:
    Task Intent Analysis -> LCM Concept Planning -> RAG Knowledge Retrieval -> Synthesis -> Verification.
    """
    if req.messages:
        user_query = next((m.get("content", "") for m in reversed(req.messages) if m.get("role") == "user"), req.message or "")
        history = [m for m in req.messages if m.get("content") != user_query]
    else:
        user_query = req.message or ""
        history = []

    orch_req = OrchestrationRequest(
        message=user_query,
        messages=history,
        model=req.model or "auto",
        documents=req.documents,
    )

    try:
        res = await orchestrator.run(orch_req)
        merged_citations = list(dict.fromkeys((res.citations or []) + (req.citations or [])))
        return ChatResponse(
            id=res.id,
            answer=res.answer,
            text=res.answer,
            citations=merged_citations,
            usage=res.usage,
            provider=res.provider,
            model=res.model,
            tokens={
                "prompt": res.usage.get("prompt_tokens", 0),
                "completion": res.usage.get("completion_tokens", 0),
                "total": res.usage.get("total_tokens", 0),
            },
            latency_ms=0,
            error=res.error,
        )
    except Exception as e:
        logger.error(f"Orchestration pipeline error: {e}", exc_info=True)
        req_id = f"req_{uuid.uuid4().hex[:12]}"
        return ChatResponse(
            id=req_id,
            answer="I'm currently running in Zaraki offline/mock mode. Your request was received successfully, but no live AI provider is connected yet.",
            text="I'm currently running in Zaraki offline/mock mode. Your request was received successfully, but no live AI provider is connected yet.",
            citations=req.citations or [],
            provider="zaraki-mock",
            model=req.model or "auto",
            latency_ms=0,
            error=None
        )


# Keep the old endpoint for backwards compatibility
@app.post("/api/ai/test", response_model=ChatResponse)
async def test_chat(req: ChatRequest):
    """Legacy endpoint — redirects to /api/ai/chat."""
    return await chat(req)


# ──────────────────────────────────────────────
# Mount API v1 Routers (Keys & Gateway)
# ──────────────────────────────────────────────
app.include_router(keys_router)
app.include_router(chat_router)
