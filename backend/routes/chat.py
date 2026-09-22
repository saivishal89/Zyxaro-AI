"""
Zaraki AI Platform — AI Gateway Chat Completion Endpoint
Routes authenticated developer requests into the decoupled AI Gateway.
"""

import time
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status

from backend.auth import require_scope, record_usage
from backend.orchestrator.pipeline import orchestrator
from backend.orchestrator.types import OrchestrationRequest

router = APIRouter(prefix="/api/v1/chat", tags=["AI Gateway"])


class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Explain quantum computing simply")


class ChatCompletionRequest(BaseModel):
    model: str = Field("zaraki-auto", example="zaraki-auto")
    messages: List[ChatMessage]
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(1024, ge=1, le=4096)
    provider: Optional[str] = Field(None, example="mock")


class ChatChoiceMessage(BaseModel):
    role: str
    content: str


class ChatChoice(BaseModel):
    index: int
    message: ChatChoiceMessage
    finish_reason: str


class ChatUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    object: str = "chat.completion"
    created: int
    model: str
    provider: str
    choices: List[ChatChoice]
    usage: ChatUsage


@router.post("", response_model=ChatCompletionResponse, status_code=status.HTTP_200_OK)
async def create_chat_completion(
    req: ChatCompletionRequest,
    key_data: Dict[str, Any] = Depends(require_scope("chat")),
):
    """
    Execute AI chat completion via the Zaraki AI Orchestrator.
    Requires an active Zaraki API key with 'chat' scope.
    """
    user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), req.messages[-1].content if req.messages else "")
    history = [{"role": m.role, "content": m.content} for m in req.messages[:-1]]

    orch_req = OrchestrationRequest(
        message=user_msg,
        messages=history,
        model=req.model,
        preferred_provider=req.provider,
        temperature=req.temperature or 0.7,
        max_tokens=req.max_tokens or 1024,
    )
    result = await orchestrator.run(orch_req)

    response_data = {
        "id": result.id,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": result.model,
        "provider": result.provider,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": result.answer,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": result.usage.get("prompt_tokens", 0),
            "completion_tokens": result.usage.get("completion_tokens", 0),
            "total_tokens": result.usage.get("total_tokens", 0),
        },
    }

    tokens = result.usage.get("total_tokens", 0)
    record_usage(
        key_id=key_data["key_id"],
        endpoint="/api/v1/chat",
        status_code=status.HTTP_200_OK,
        tokens_used=tokens,
    )

    return response_data
