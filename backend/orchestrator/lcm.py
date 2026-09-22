"""
Zaraki AI Platform — Large Concept Model (LCM) Subsystem
Defines dedicated LCM interfaces, concept representations, concept relationship graphs,
and an explicit MockLCMAdapter for development/testing until a native LCM runtime is connected.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import re
import logging

from backend.orchestrator.types import (
    LCMRequest,
    LCMResponse,
    ConceptNode,
    ConceptPlan,
)

logger = logging.getLogger("zaraki.lcm")


class BaseLCMAdapter(ABC):
    """
    Abstract Base Class for Large Concept Model (LCM) adapters.
    Responsible for concept-level representation, concept relation graphs,
    and structured concept planning before LLM language generation.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Name/Identifier of the LCM implementation."""
        pass

    @property
    @abstractmethod
    def is_real_model(self) -> bool:
        """Explicit flag indicating if this is an actual trained LCM or a development mock."""
        pass

    @abstractmethod
    async def process_concepts(self, request: LCMRequest) -> LCMResponse:
        """Encode query into concept nodes, plan relationships, and return structured concept plan."""
        pass


class MockLCMAdapter(BaseLCMAdapter):
    """
    Deterministic development & testing LCM adapter.
    Performs rule-based concept extraction, entity-relationship mapping,
    and hierarchical reasoning step planning.
    Explicitly labeled as MOCK (is_real_model = False).
    """

    @property
    def name(self) -> str:
        return "mock-lcm-v1"

    @property
    def is_real_model(self) -> bool:
        return False

    async def process_concepts(self, request: LCMRequest) -> LCMResponse:
        query = request.query.strip()
        concepts: List[ConceptNode] = []
        reasoning_steps: List[str] = []
        constraints: List[str] = []
        assumptions: List[str] = []
        uncertainties: List[str] = []

        # 1. Concept Extraction (Rule-based heuristics for testing)
        words = re.findall(r'\b[A-Za-z0-9_-]{3,}\b', query)
        stopwords = {
            "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
            "this", "that", "these", "those", "from", "with", "have", "more", "some",
            "explain", "describe", "implement", "build", "write", "create", "make",
            "please", "using", "into", "about", "your", "their", "will", "would"
        }
        candidate_keywords = [w for w in words if w.lower() not in stopwords]

        # Detect primary domains
        is_oop = bool(re.search(r'\b(class|inheritance|hierarchy|oop|polymorphism|interface|constructor|super)\b', query, re.I))
        is_architecture = bool(re.search(r'\b(architecture|system|database|cache|distributed|microservice|cluster|api)\b', query, re.I))
        is_algorithm = bool(re.search(r'\b(algorithm|sort|search|binary|complexity|tree|graph|dp)\b', query, re.I))

        if is_oop:
            concepts.append(ConceptNode(
                name="Object-Oriented Hierarchy",
                category="abstraction",
                description="Multilevel inheritance with base, intermediate, and derived types.",
                related_concepts=["Encapsulation", "Constructor Chaining", "Method Overriding"]
            ))
            reasoning_steps.extend([
                "Define base class attributes and explicit constructor initialization.",
                "Derive subclasses invoking super() to satisfy the inheritance contract.",
                "Expose specialized state via cohesive display methods without state leakage."
            ])
            constraints.append("Enforce correct constructor delegation (super calls).")

        elif is_architecture:
            concepts.append(ConceptNode(
                name="System Architecture & Topography",
                category="abstraction",
                description="Structural partition of compute, persistence, caching, and gateway layers.",
                related_concepts=["High Availability", "Horizontal Scaling", "Eventual Consistency"]
            ))
            reasoning_steps.extend([
                "Decompose functional components into isolated responsibilities.",
                "Define explicit data contracts and communication boundaries between layers.",
                "Formulate failure domain isolation, caching policies, and latency budgets."
            ])
            constraints.append("Preserve separation of concerns between storage and orchestration.")

        elif is_algorithm:
            concepts.append(ConceptNode(
                name="Algorithmic Complexity & State Invariant",
                category="abstraction",
                description="Step-wise deterministic state transformation under mathematical bounds.",
                related_concepts=["Time Complexity", "Space Complexity", "Edge Case Validation"]
            ))
            reasoning_steps.extend([
                "Identify boundary conditions and invariants.",
                "Formulate optimal traversal or divide-and-conquer strategy.",
                "Verify termination conditions and edge cases (empty, single-element, overflow)."
            ])

        # Add top candidate keywords as secondary entities
        for kw in candidate_keywords[:4]:
            if not any(c.name.lower() == kw.lower() for c in concepts):
                concepts.append(ConceptNode(
                    name=kw.capitalize(),
                    category="entity",
                    description=f"Domain concept identified in user prompt: {kw}",
                    related_concepts=[]
                ))

        if not reasoning_steps:
            reasoning_steps = [
                f"Analyze direct inquiry: '{query[:80]}...'",
                "Extract salient facts and principles.",
                "Synthesize concise, grounded final explanation."
            ]

        # Check for ambiguity / uncertainty
        if len(candidate_keywords) <= 1 and len(query.split()) < 4:
            uncertainties.append("Query is brief or ambiguous; assumptions must be explicitly qualified.")
            assumptions.append("Assuming standard textbook interpretation of terminology.")

        # Determine if external retrieval is needed
        requires_external = bool(re.search(
            r'\b(current|today|latest|news|price|weather|recent|uploaded|document|notes|file|pdf)\b',
            query,
            re.I
        ))

        plan = ConceptPlan(
            primary_concepts=[c.name for c in concepts],
            concept_nodes=concepts,
            reasoning_steps=reasoning_steps,
            constraints=constraints,
            assumptions=assumptions,
            requires_external_knowledge=requires_external
        )

        concept_summary = f"Identified {len(concepts)} primary concepts ({', '.join(plan.primary_concepts)}). Formulated {len(reasoning_steps)} structured reasoning steps."

        return LCMResponse(
            plan=plan,
            concept_summary=concept_summary,
            uncertainties=uncertainties,
            is_mock=True
        )


class LCMGateway:
    """
    Gateway managing active LCM adapters and dispatching concept planning requests.
    Supports seamless switching between MockLCM and a real future LCM engine.
    """

    def __init__(self, default_adapter: Optional[BaseLCMAdapter] = None):
        self.adapters: Dict[str, BaseLCMAdapter] = {}
        mock = MockLCMAdapter()
        self.register_adapter(mock)
        self.active_adapter_name = default_adapter.name if default_adapter else mock.name

    def register_adapter(self, adapter: BaseLCMAdapter):
        self.adapters[adapter.name] = adapter
        logger.info(f"Registered LCM Adapter: {adapter.name} (Real Model: {adapter.is_real_model})")

    async def plan_concepts(self, request: LCMRequest) -> LCMResponse:
        adapter = self.adapters.get(self.active_adapter_name)
        if not adapter:
            logger.warning(f"LCM adapter {self.active_adapter_name} not found, falling back to mock-lcm-v1")
            adapter = self.adapters["mock-lcm-v1"]
        return await adapter.process_concepts(request)


# Global LCM Gateway instance
lcm_gateway = LCMGateway()
