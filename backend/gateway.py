"""
Zaraki AI Platform — AI Gateway & Provider Abstraction
Provides decoupled provider adapters, router, and MockProvider for reliable testing
without requiring external third-party API credentials.
"""

import time
import uuid
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger("zaraki.gateway")


class ProviderAdapter(ABC):
    """Abstract Base Class for AI Provider Adapters."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider identifier (e.g. 'mock', 'groq', 'omniroute')."""
        pass

    @abstractmethod
    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute chat completion and return a normalized Zaraki response dictionary."""
        pass


class MockProvider(ProviderAdapter):
    """
    Deterministic mock provider for testing and development.
    Produces realistic responses, token metrics, and reflection of user queries.
    """

    @property
    def name(self) -> str:
        return "mock"

    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "zaraki-auto",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> Dict[str, Any]:
        # Calculate simulated tokens safely without echoing prompt
        prompt_words = sum(len(m.get("content", "").split()) for m in messages)
        prompt_tokens = max(1, int(prompt_words * 1.3))

        # Deterministic clean test response — NEVER echo user prompt or internal RAG context
        content = (
            "I’m currently running in Zaraki offline/mock mode. "
            "Your request was received successfully, but no live AI provider is connected yet."
        )

        completion_tokens = max(1, int(len(content.split()) * 1.3))
        total_tokens = prompt_tokens + completion_tokens

        return {
            "id": f"req_{uuid.uuid4().hex[:12]}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "provider": self.name,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": content,
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
            },
        }


class OmniRouteProvider(ProviderAdapter):
    """Adapter for local OmniRoute AI Gateway (localhost:20128)."""

    def __init__(self, endpoint: str = "http://localhost:20128/v1/chat/completions"):
        self.endpoint = endpoint

    @property
    def name(self) -> str:
        return "omniroute"

    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "auto",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> Dict[str, Any]:
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.endpoint,
                headers={"Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            data["provider"] = self.name
            return data


class GroqProvider(ProviderAdapter):
    """Adapter for direct Groq API."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def name(self) -> str:
        return "groq"

    async def generate_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024,
        **kwargs
    ) -> Dict[str, Any]:
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            data["provider"] = self.name
            return data


class GatewayRouter:
    """
    Decoupled Gateway Router. Selects provider adapter based on configuration,
    requested model, or fallbacks. Uses OmniRoute for real AI when available.
    """

    def __init__(self):
        self.adapters: Dict[str, ProviderAdapter] = {
            "omniroute": OmniRouteProvider(),
            "mock": MockProvider(),
        }

    def register_provider(self, adapter: ProviderAdapter):
        self.adapters[adapter.name] = adapter

    async def route_and_generate(
        self,
        messages: List[Dict[str, str]],
        model: str = "auto",
        preferred_provider: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Routes to the requested or best available provider."""
        # Use auto for OmniRoute if model is default or zaraki-auto
        target_model = "auto" if model in ("zaraki-auto", "auto", "") else model

        # 1. If a specific provider was requested and exists
        if preferred_provider and preferred_provider in self.adapters:
            try:
                adapter = self.adapters[preferred_provider]
                logger.info(f"Gateway routing to preferred provider: {adapter.name} (model: {target_model})")
                return await adapter.generate_chat(messages=messages, model=target_model, **kwargs)
            except Exception as e:
                logger.warning(f"Preferred provider {preferred_provider} failed: {e}, falling back to auto-routing")

        # 2. Try OmniRoute for real AI generation
        if "omniroute" in self.adapters:
            try:
                logger.info(f"Gateway routing to OmniRoute for live AI (model: {target_model})")
                return await self.adapters["omniroute"].generate_chat(messages=messages, model=target_model, **kwargs)
            except Exception as e:
                logger.warning(f"OmniRoute live AI failed: {e}")

        # 3. Fallback to MockProvider
        logger.info(f"Gateway using fallback provider: mock")
        return await self.adapters["mock"].generate_chat(messages=messages, model=target_model, **kwargs)


# Global gateway router instance
gateway_router = GatewayRouter()
