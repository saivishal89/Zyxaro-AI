"""
Zaraki AI Platform — Answer Verification Layer
Performs post-synthesis quality validation, grounding cross-checks,
contradiction checks, uncertainty policy enforcement, and defense-in-depth sanitization.
"""

from typing import List, Optional
import re
import logging

from backend.orchestrator.types import (
    VerificationResult,
    TaskIntent,
    RAGResponse,
)

logger = logging.getLogger("zaraki.verifier")


def sanitize_internal_markers(text: str) -> str:
    """
    Defense-in-depth: removes any leaked internal prompt or orchestration markers.
    """
    if not text:
        return ""
    cleaned = text
    # Strip paired blocks
    cleaned = re.sub(r'\[RAG KNOWLEDGE CONTEXT ACTIVATED\][\s\S]*?\[USER INSTRUCTION\]:?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][\s\S]*?\[(?:GROUNDING RULES|STRICT INSTRUCTION)\]:[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    # Strip standalone markers
    cleaned = re.sub(r'\[RAG KNOWLEDGE CONTEXT ACTIVATED\][^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[INTERNAL (?:RETRIEVAL|GROUNDING)[^\]]*\][^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'INTERNAL RETRIEVAL CONTEXT:[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Use the following retrieved documents[^\n]*\n*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[USER INSTRUCTION\]:?\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[(?:Document|Source)\s+\d+:[^\]]+\]\s*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[(?:Document|Source)\s*-[^\]]+\]\s*', '', cleaned, flags=re.IGNORECASE)
    # Strip LLM internal wrappers
    cleaned = re.sub(r'<<SYS>>[\s\S]*?<</SYS>>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<<SYS>>|<</SYS>>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<\|im_start\|>system[\s\S]*?<\|im_end\|>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<\|im_start\|>system|<\|im_end\|>', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


class AnswerVerifier:
    """
    Validates model output against the user's intent, retrieved knowledge, and uncertainty policies.
    """

    def verify(
        self,
        query: str,
        raw_answer: str,
        intent: TaskIntent,
        rag_response: Optional[RAGResponse] = None,
        assumptions: Optional[List[str]] = None,
    ) -> VerificationResult:
        """
        Execute comprehensive validation on raw answer before user delivery.
        """
        cleaned_answer = sanitize_internal_markers(raw_answer)
        query_lower = query.lower()
        answer_lower = cleaned_answer.lower()

        # 1. Did we actually answer the question?
        has_content = len(cleaned_answer.strip()) > 10
        addressed = has_content

        # 2. Check Grounding if RAG was utilized
        is_grounded = True
        has_contradictions = False
        critiques: List[str] = []

        if rag_response and rag_response.chunks:
            # Check if key sources or concepts from chunks are present
            chunk_keywords = set()
            for c in rag_response.chunks:
                chunk_keywords.update(re.findall(r'\b[a-zA-Z]{5,}\b', c.content.lower()))

            answer_words = set(re.findall(r'\b[a-zA-Z]{5,}\b', answer_lower))
            overlap = chunk_keywords.intersection(answer_words)

            if not overlap and len(chunk_keywords) > 0:
                is_grounded = False
                critiques.append("Answer has minimal lexical grounding in retrieved document chunks.")

            if rag_response.has_conflicts:
                # Answer should acknowledge the discrepancy or qualify the answer
                if not any(w in answer_lower for w in ["conflict", "differ", "discrepancy", "note", "vary", "range"]):
                    has_contradictions = True
                    critiques.append("Retrieved sources report differing facts, but answer did not address the discrepancy.")
                    cleaned_answer += f"\n\n*Note on Sources:* Discrepancies were found across references ({', '.join(rag_response.sources)})."

        # 3. Uncertainty Policy Enforcement
        uncertainty_acknowledged = False
        is_unknown_inquiry = intent == TaskIntent.UNKNOWN or bool(
            re.search(r'\b(current stock price|today\'s weather in|tomorrow\'s lottery|who won tomorrow)\b', query_lower)
        )

        if is_unknown_inquiry or intent == TaskIntent.CURRENT_INFO:
            uncertainty_markers = ["uncertain", "not have access", "cannot verify", "as of my knowledge", "does not contain", "cannot determine", "real-time"]
            if any(m in answer_lower for m in uncertainty_markers):
                uncertainty_acknowledged = True
            else:
                # If model hallucinated without acknowledging uncertainty on real-time/unknown query
                cleaned_answer = (
                    "I do not have access to real-time or unverifiable information to answer this accurately. "
                    "Please verify with current primary sources."
                )
                uncertainty_acknowledged = True
                critiques.append("Enforced explicit uncertainty policy on real-time inquiry.")

        # 4. Ambiguity handling: Ensure assumptions are transparent
        if intent == TaskIntent.AMBIGUOUS and assumptions:
            if not any(a.lower() in answer_lower for a in assumptions):
                # Prepend stated assumption cleanly
                assumption_text = "Assuming " + "; ".join(assumptions) + ".\n\n"
                if not cleaned_answer.startswith("Assuming"):
                    cleaned_answer = assumption_text + cleaned_answer

        # Overall validity
        is_valid = addressed and (is_grounded or not rag_response)

        return VerificationResult(
            is_valid=is_valid,
            addressed_question=addressed,
            is_grounded=is_grounded,
            has_contradictions=has_contradictions,
            uncertainty_acknowledged=uncertainty_acknowledged,
            critique="; ".join(critiques) if critiques else "Validation passed.",
            sanitized_answer=cleaned_answer
        )


# Global verifier instance
answer_verifier = AnswerVerifier()
