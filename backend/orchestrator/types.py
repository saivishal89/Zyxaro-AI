"""
Zaraki AI Orchestrator — Typed Data Contracts
Strict separation of user input, internal instructions, reasoning state,
knowledge retrieval, provider responses, verification, and final user-facing answers.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class TaskIntent(str, Enum):
    DIRECT_REASONING = "direct_reasoning"      # Simple factual, math, general questions
    CONCEPTUAL_PLANNING = "conceptual_planning" # Architecture, concept breakdown, multi-step
    DOCUMENT_GROUNDING = "document_grounding"  # Questions requiring uploaded document context
    CODING = "coding"                          # Code generation, syntax, debugging
    CURRENT_INFO = "current_info"              # Real-time / live information inquiry
    AMBIGUOUS = "ambiguous"                    # Ambiguous prompt requiring clear stated assumptions
    UNKNOWN = "unknown"                        # Unanswerable / out of domain / missing data


# ─── LLM Subsystem Contracts ─────────────────────────────────

class LLMMessage(BaseModel):
    role: str = Field(..., description="system | user | assistant")
    content: str = Field(..., description="Clean message content")


class LLMRequest(BaseModel):
    messages: List[LLMMessage]
    model: str = "auto"
    temperature: float = 0.7
    max_tokens: int = 2048
    stream: bool = False
    preferred_provider: Optional[str] = None


class LLMResponse(BaseModel):
    id: str
    content: str
    model: str
    provider: str
    usage: Dict[str, Any] = Field(default_factory=lambda: {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
    latency_ms: int = 0
    error: Optional[str] = None


# ─── LCM (Large Concept Model) Contracts ─────────────────────

class ConceptNode(BaseModel):
    name: str
    category: str  # entity | abstraction | action | constraint
    description: str
    related_concepts: List[str] = Field(default_factory=list)


class ConceptPlan(BaseModel):
    primary_concepts: List[str]
    concept_nodes: List[ConceptNode] = Field(default_factory=list)
    reasoning_steps: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    requires_external_knowledge: bool = False


class LCMRequest(BaseModel):
    query: str
    conversation_context: List[Dict[str, str]] = Field(default_factory=list)
    known_concepts: Optional[List[str]] = None


class LCMResponse(BaseModel):
    plan: ConceptPlan
    concept_summary: str
    uncertainties: List[str] = Field(default_factory=list)
    is_mock: bool = False


# ─── RAG Knowledge Subsystem Contracts ───────────────────────

class RAGChunk(BaseModel):
    chunk_id: str
    doc_name: str
    content: str
    score: float = 0.0


class RAGRequest(BaseModel):
    query: str
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    max_chunks: int = 5
    min_score: float = 0.1


class RAGResponse(BaseModel):
    context: str = ""
    sources: List[str] = Field(default_factory=list)
    chunks: List[RAGChunk] = Field(default_factory=list)
    scores: List[float] = Field(default_factory=list)
    has_conflicts: bool = False
    conflict_notes: Optional[str] = None


# ─── Verification Layer Contracts ────────────────────────────

class VerificationResult(BaseModel):
    is_valid: bool
    addressed_question: bool
    is_grounded: bool
    has_contradictions: bool
    uncertainty_acknowledged: bool
    critique: str = ""
    sanitized_answer: str


# ─── Orchestrator Overall Request / Result ───────────────────

class OrchestrationRequest(BaseModel):
    message: str
    messages: Optional[List[Dict[str, str]]] = None
    model: Optional[str] = "auto"
    documents: Optional[List[Dict[str, Any]]] = None
    preferred_provider: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048


class OrchestrationResult(BaseModel):
    id: str
    answer: str
    citations: List[str] = Field(default_factory=list)
    provider: str
    model: str
    usage: Dict[str, Any] = Field(default_factory=dict)
    intent: TaskIntent = TaskIntent.DIRECT_REASONING
    uncertainty_flag: bool = False
    error: Optional[str] = None
