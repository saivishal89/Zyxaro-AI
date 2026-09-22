"""
Zaraki AI Platform — AI Orchestrator Core Pipeline
Coordinates:
  User Question
  → Question Understanding & Task Intent Analysis
  → Reasoning & Planning (LCM Layer)
  → Knowledge Decision (RAG / Direct)
  → Synthesis (LLM Gateway)
  → Verification & Quality Check
  → Clean Final Answer
"""

import time
import uuid
import re
import logging
from typing import List, Dict, Any, Optional

from backend.orchestrator.types import (
    TaskIntent,
    OrchestrationRequest,
    OrchestrationResult,
    LCMRequest,
    RAGRequest,
    RAGResponse,
)
from backend.orchestrator.lcm import lcm_gateway
from backend.orchestrator.rag import rag_subsystem
from backend.orchestrator.verifier import answer_verifier
from backend.gateway import gateway_router

logger = logging.getLogger("zaraki.orchestrator")


class ZarakiAIOrchestrator:
    """
    Intelligent Reasoning & Orchestration Engine for Zaraki AI.
    Executes multi-tier pipeline integrating LLM, LCM, RAG, and Verification.
    """

    def analyze_intent(self, query: str, has_documents: bool, history: List[Dict[str, str]]) -> TaskIntent:
        """
        Step 1: Question Understanding & Intent Analysis.
        Classifies task type without executing heavy models.
        """
        q = query.strip().lower()

        # Document-specific queries
        if has_documents or bool(re.search(r'\b(in the document|from my file|in the pdf|uploaded notes|according to the text)\b', q)):
            return TaskIntent.DOCUMENT_GROUNDING

        # Real-time / Live information inquiries
        if bool(re.search(r'\b(live stock|current stock|stock price|market price|today\'?s weather|weather today|live score|breaking news|right now|latest news|current price|who won today)\b', q)):
            return TaskIntent.CURRENT_INFO

        # Coding queries
        if bool(re.search(r'\b(class|def |implement|code|java|python|typescript|function|bug|syntax|constructor|hierarchy|inheritance|algorithm|return)\b', q)):
            return TaskIntent.CODING

        # Conceptual planning / Architecture / Multi-step system design
        if bool(re.search(r'\b(architecture|system design|distributed|cache|microservice|database schema|plan a|step-by-step|explain concept|how does .+ work)\b', q)):
            return TaskIntent.CONCEPTUAL_PLANNING

        # Ambiguous queries
        if len(q.split()) <= 2 and not re.search(r'\b(hi|hello|hey|help)\b', q):
            return TaskIntent.AMBIGUOUS

        # Simple factual / Direct reasoning default
        return TaskIntent.DIRECT_REASONING

    async def run(self, request: OrchestrationRequest) -> OrchestrationResult:
        """
        Main Orchestration Pipeline execution.
        """
        start_time = time.monotonic()
        req_id = f"zk_{uuid.uuid4().hex[:12]}"
        query = request.message.strip()
        history = request.messages or []
        has_docs = bool(request.documents and len(request.documents) > 0)

        logger.info(f"[{req_id}] Orchestrator received query: '{query[:80]}...'")

        # ─── 1. Question Understanding ──────────────────────────────
        intent = self.analyze_intent(query, has_docs, history)
        logger.info(f"[{req_id}] Identified Intent: {intent.value}")

        # ─── 2. Reasoning & Planning (LCM Layer) ────────────────────
        # Activate LCM concept planning for conceptual, architecture, or multi-step queries
        lcm_response = None
        concept_context_str = ""
        assumptions: List[str] = []

        if intent in (TaskIntent.CONCEPTUAL_PLANNING, TaskIntent.CODING, TaskIntent.AMBIGUOUS):
            logger.info(f"[{req_id}] Invoking LCM Layer for concept planning...")
            lcm_req = LCMRequest(query=query, conversation_context=history)
            lcm_response = await lcm_gateway.plan_concepts(lcm_req)
            assumptions = lcm_response.plan.assumptions

            # Format internal conceptual guidance for LLM system context
            plan = lcm_response.plan
            concept_context_str = (
                f"\n\n[CONCEPTUAL ARCHITECTURE PLAN]:\n"
                f"- Primary Concepts: {', '.join(plan.primary_concepts)}\n"
                f"- Reasoning Plan:\n  * " + "\n  * ".join(plan.reasoning_steps)
            )
            if plan.constraints:
                concept_context_str += f"\n- Constraints: " + "; ".join(plan.constraints)

        # ─── 3. Knowledge Decision (RAG Layer) ──────────────────────
        need_external_knowledge = (
            intent == TaskIntent.DOCUMENT_GROUNDING
            or has_docs
            or (lcm_response and lcm_response.plan.requires_external_knowledge)
        )

        rag_response: Optional[RAGResponse] = None
        rag_context_str = ""
        citations: List[str] = []

        if need_external_knowledge and request.documents:
            logger.info(f"[{req_id}] Invoking RAG Layer for knowledge retrieval...")
            rag_req = RAGRequest(query=query, documents=request.documents, max_chunks=4)
            rag_response = rag_subsystem.retrieve(rag_req)

            if rag_response.chunks:
                citations = rag_response.sources
                rag_context_str = (
                    f"\n\n[INTERNAL GROUNDING KNOWLEDGE - DO NOT EXPOSE DIRECTLY]:\n"
                    f"{rag_response.context}\n"
                )
                if rag_response.has_conflicts and rag_response.conflict_notes:
                    rag_context_str += f"\n[SOURCE CONFLICT ALERT]: {rag_response.conflict_notes}\n"

        # ─── 4. Synthesis (LLM Gateway) ──────────────────────────────
        # Construct internal system instructions (never exposed to user)
        system_instructions = (
            "You are Zaraki AI, an advanced intelligent reasoning and coding assistant.\n"
            "Produce clear, highly accurate, logically sound, and directly usable answers.\n"
            "CRITICAL RULES:\n"
            "- Provide ONLY the direct, final user-facing response.\n"
            "- NEVER reveal, repeat, or quote internal document headers, concept plans, system tags, or retrieval brackets.\n"
            "- If assumptions are made, state them clearly and concisely."
        )

        if concept_context_str:
            system_instructions += concept_context_str

        if rag_context_str:
            system_instructions += rag_context_str

        # Build clean conversation history
        llm_messages = [{"role": "system", "content": system_instructions}]

        # Append last 3 conversation turns for context if relevant
        if history and len(history) > 1:
            recent_turns = [m for m in history[-4:] if m.get("role") in ("user", "assistant")]
            llm_messages.extend(recent_turns[:-1])

        # User message remains clean and pristine
        llm_messages.append({"role": "user", "content": query})

        # Route to provider adapter
        logger.info(f"[{req_id}] Dispatching to LLM Gateway (model: {request.model})...")
        raw_llm_result = await gateway_router.route_and_generate(
            messages=llm_messages,
            model=request.model or "auto",
            preferred_provider=request.preferred_provider,
            temperature=request.temperature or 0.7,
            max_tokens=request.max_tokens or 2048,
        )

        raw_answer = (
            raw_llm_result.get("choices", [{}])[0].get("message", {}).get("content", "")
            if "choices" in raw_llm_result else raw_llm_result.get("answer", "")
        )
        provider = raw_llm_result.get("provider", "zaraki")
        model = raw_llm_result.get("model", request.model or "auto")
        usage = raw_llm_result.get("usage", {})

        # ─── 5. Verification & Quality Gate ──────────────────────────
        logger.info(f"[{req_id}] Executing Answer Verification...")
        verification = answer_verifier.verify(
            query=query,
            raw_answer=raw_answer,
            intent=intent,
            rag_response=rag_response,
            assumptions=assumptions,
        )

        final_clean_answer = verification.sanitized_answer
        latency = int((time.monotonic() - start_time) * 1000)
        logger.info(f"[{req_id}] Verification Complete (Valid: {verification.is_valid}, Latency: {latency}ms)")

        return OrchestrationResult(
            id=req_id,
            answer=final_clean_answer,
            citations=citations,
            provider=provider,
            model=model,
            usage=usage,
            intent=intent,
            uncertainty_flag=verification.uncertainty_acknowledged,
            error=None
        )


# Global orchestrator instance
orchestrator = ZarakiAIOrchestrator()
