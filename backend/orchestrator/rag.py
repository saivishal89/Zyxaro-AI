"""
Zaraki AI Platform — RAG Knowledge Subsystem
Provides independent document retrieval, semantic/keyword ranking, conflict detection,
and structured grounding context without polluting user-visible prompts.
"""

from typing import List, Dict, Any, Optional
import re
import math
from collections import Counter
import logging

from backend.orchestrator.types import (
    RAGRequest,
    RAGResponse,
    RAGChunk,
)

logger = logging.getLogger("zaraki.rag")


def tokenize_text(text: str) -> List[str]:
    """Basic alphanumeric word tokenizer."""
    return re.findall(r'\b[a-zA-Z0-9_]{2,}\b', text.lower())


def compute_bm25_score(query_tokens: List[str], chunk_tokens: List[str]) -> float:
    """Lightweight deterministic scoring based on term overlap and density."""
    if not query_tokens or not chunk_tokens:
        return 0.0
    chunk_counts = Counter(chunk_tokens)
    score = 0.0
    for qt in query_tokens:
        if qt in chunk_counts:
            # Term frequency with diminishing returns
            tf = chunk_counts[qt]
            score += math.log(1.0 + tf) * 1.5
    return score / (len(chunk_tokens) ** 0.5 + 1.0)


class RAGSubsystem:
    """
    Independent knowledge retrieval engine.
    Ingests raw document metadata, extracts text segments, ranks relevant chunks,
    detects potential factual contradictions across sources, and returns structured context.
    """

    def retrieve(self, request: RAGRequest) -> RAGResponse:
        """
        Rank and extract relevant chunks from candidate documents.
        Returns structured RAGResponse.
        """
        if not request.documents:
            return RAGResponse(context="", sources=[], chunks=[], scores=[])

        query_tokens = tokenize_text(request.query)
        candidate_chunks: List[RAGChunk] = []

        # Parse documents into chunks if not already chunked
        chunk_idx = 0
        for doc in request.documents:
            doc_name = doc.get("name") or doc.get("docName") or f"Document-{chunk_idx + 1}"
            raw_text = doc.get("text") or doc.get("content") or ""

            if not raw_text.strip():
                continue

            # Split text into sliding window segments of ~300 chars
            paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [raw_text.strip()]

            for p in paragraphs:
                chunk_tokens = tokenize_text(p)
                score = compute_bm25_score(query_tokens, chunk_tokens)
                chunk_idx += 1
                candidate_chunks.append(RAGChunk(
                    chunk_id=f"chk_{chunk_idx}",
                    doc_name=doc_name,
                    content=p,
                    score=round(score, 4)
                ))

        # Sort by relevance score descending
        candidate_chunks.sort(key=lambda x: x.score, reverse=True)
        top_chunks = [c for c in candidate_chunks if c.score >= request.min_score][:request.max_chunks]

        if not top_chunks:
            # If no chunk met threshold, take top 1 if available or return empty
            if candidate_chunks and candidate_chunks[0].score > 0:
                top_chunks = [candidate_chunks[0]]
            else:
                return RAGResponse(context="", sources=[], chunks=[], scores=[])

        # Check for potential contradictions across distinct sources
        has_conflicts = False
        conflict_notes = None
        sources = list(dict.fromkeys(c.doc_name for c in top_chunks))

        if len(sources) >= 2:
            # Check for conflicting numbers or opposing statements (e.g. "X is 10" vs "X is 20")
            numbers_by_source: Dict[str, set] = {}
            for c in top_chunks:
                nums = set(re.findall(r'\b\d+(?:\.\d+)?\b', c.content))
                if nums:
                    numbers_by_source.setdefault(c.doc_name, set()).update(nums)

            # If different sources have mutually disjoint numbers, note potential discrepancy
            all_sets = list(numbers_by_source.values())
            if len(all_sets) >= 2 and not set.intersection(*all_sets):
                has_conflicts = True
                conflict_notes = (
                    f"Sources ({', '.join(sources)}) report differing numerical values or criteria. "
                    "Explicitly highlight source discrepancies rather than assuming a single value."
                )

        # Build clean internal context block for LLM system prompt injection
        context_parts = []
        for i, c in enumerate(top_chunks, 1):
            context_parts.append(f"[{c.doc_name} - Excerpt {i}]\n{c.content}")
        context_str = "\n\n---\n\n".join(context_parts)

        return RAGResponse(
            context=context_str,
            sources=sources,
            chunks=top_chunks,
            scores=[c.score for c in top_chunks],
            has_conflicts=has_conflicts,
            conflict_notes=conflict_notes
        )


# Global RAG Subsystem instance
rag_subsystem = RAGSubsystem()
