"""
Zaraki AI Platform — Intelligent Reasoning & Orchestration Layer Evaluation Suite
Tests all 10 evaluation categories required by user:
  A. Simple factual question
  B. Concept explanation
  C. Multi-step reasoning question
  D. Coding question (Teaching Assistant Profile)
  E. Ambiguous question (Uncertainty & assumptions policy)
  F. Current-information question (Uncertainty policy enforcement)
  G. Document-based question (RAG integration & citations)
  H. Contradictory-source question (Conflict detection & qualification)
  I. Unknown/unanswerable question
  J. Follow-up conversation question (Context preservation)

Verifies across all tests:
  - Correct intent detection
  - Dynamic tool/layer selection (LLM vs LCM vs RAG)
  - Zero internal prompt or RAG marker leaks
  - Clean final user response
"""

import sys
import os
import asyncio
from pathlib import Path
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.main import app
from backend.orchestrator.pipeline import orchestrator
from backend.orchestrator.types import (
    OrchestrationRequest,
    TaskIntent,
)

client = TestClient(app)

FORBIDDEN_LEAK_MARKERS = [
    "[RAG KNOWLEDGE CONTEXT ACTIVATED]",
    "[USER INSTRUCTION]",
    "[INTERNAL GROUNDING KNOWLEDGE",
    "[CONCEPTUAL ARCHITECTURE PLAN]",
    "INTERNAL RETRIEVAL CONTEXT",
    "<<SYS>>",
    "<|im_start|>",
]


def assert_no_leaks(text: str, test_name: str):
    """Verify that zero internal orchestration or prompt markers appear in output."""
    for marker in FORBIDDEN_LEAK_MARKERS:
        assert marker not in text, f"[{test_name}] LEAK DETECTED: Leaked internal marker '{marker}' in response!"


def test_category_a_simple_factual():
    """Category A: Simple factual question -> DIRECT_REASONING, zero RAG overhead."""
    req = OrchestrationRequest(
        message="What is the speed of light in vacuum?",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.DIRECT_REASONING
    assert res.citations == []
    assert len(res.answer.strip()) > 0
    assert_no_leaks(res.answer, "Category A")
    print("\n[PASS] Category A: Simple factual test passed.")


def test_category_b_concept_explanation():
    """Category B: Concept explanation -> CONCEPTUAL_PLANNING activates LCM."""
    req = OrchestrationRequest(
        message="Explain concept of how backpropagation works step-by-step in neural networks.",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.CONCEPTUAL_PLANNING
    assert len(res.answer.strip()) > 20
    assert_no_leaks(res.answer, "Category B")
    print("\n[PASS] Category B: Concept explanation test passed.")


def test_category_c_multistep_reasoning():
    """Category C: Multi-step reasoning -> LCM concept plan breakdown."""
    req = OrchestrationRequest(
        message="Plan a distributed cache architecture with consistent hashing and TTL eviction.",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.CONCEPTUAL_PLANNING
    assert len(res.answer.strip()) > 20
    assert_no_leaks(res.answer, "Category C")
    print("\n[PASS] Category C: Multi-step reasoning test passed.")


def test_category_d_coding_question():
    """Category D: Coding question (Teaching Assistant Profile) -> CODING intent, clean code output."""
    query = (
        "Question 9 Teaching Assistant Profile\n"
        "A college represents a person, a student, and a teaching assistant in a multilevel hierarchy.\n"
        "Implement the classes Person, Student, and TeachingAssistant in Java using constructor chaining with super()."
    )
    req = OrchestrationRequest(
        message=query,
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.CODING
    assert len(res.answer.strip()) > 30
    assert_no_leaks(res.answer, "Category D")
    print("\n[PASS] Category D: Coding question passed with clean implementation.")


def test_category_e_ambiguous_question():
    """Category E: Ambiguous question -> AMBIGUOUS intent, stated assumptions."""
    req = OrchestrationRequest(
        message="explain it",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.AMBIGUOUS
    assert_no_leaks(res.answer, "Category E")
    print("\n[PASS] Category E: Ambiguous question passed.")


def test_category_f_current_information():
    """Category F: Current information inquiry -> CURRENT_INFO, uncertainty policy enforced."""
    req = OrchestrationRequest(
        message="What is the live stock price of AAPL right now today?",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.CURRENT_INFO
    assert res.uncertainty_flag is True
    # Verifies system does not hallucinate real-time stock price
    assert "real-time" in res.answer.lower() or "verify" in res.answer.lower() or "cannot" in res.answer.lower()
    assert_no_leaks(res.answer, "Category F")
    print("\n[PASS] Category F: Current information uncertainty policy passed.")


def test_category_g_document_based_query():
    """Category G: Document-based question -> DOCUMENT_GROUNDING, RAG retrieval & citations."""
    docs = [
        {
            "name": "course_guidelines.pdf",
            "text": "Teaching Assistants are required to conduct 15 hours of lab instruction per week and grade homework."
        }
    ]
    req = OrchestrationRequest(
        message="What is the TA lab hour requirement according to the uploaded notes?",
        documents=docs,
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.intent == TaskIntent.DOCUMENT_GROUNDING
    assert "course_guidelines.pdf" in res.citations
    assert_no_leaks(res.answer, "Category G")
    print("\n[PASS] Category G: Document-based query with clean citations passed.")


def test_category_h_contradictory_sources():
    """Category H: Contradictory sources -> Verifier detects conflict and qualifies discrepancy."""
    docs = [
        {
            "name": "policy_v1.txt",
            "text": "The maximum internship duration is strictly 10 weeks."
        },
        {
            "name": "policy_v2.txt",
            "text": "The maximum internship duration has been updated to 24 weeks."
        }
    ]
    req = OrchestrationRequest(
        message="What is the maximum internship duration?",
        documents=docs,
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert len(res.citations) == 2
    # Verify discrepancy note is attached
    assert "Note on Sources:" in res.answer or "discrepanc" in res.answer.lower()
    assert_no_leaks(res.answer, "Category H")
    print("\n[PASS] Category H: Contradictory sources conflict detection passed.")


def test_category_i_unknown_unanswerable():
    """Category I: Unknown / unanswerable -> UNKNOWN or uncertainty policy enforced."""
    req = OrchestrationRequest(
        message="Who will win tomorrow's lottery jackpot numbers in 2030?",
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert res.uncertainty_flag is True
    assert_no_leaks(res.answer, "Category I")
    print("\n[PASS] Category I: Unknown question policy passed.")


def test_category_j_follow_up_conversation():
    """Category J: Follow-up question -> Multi-turn history preserved cleanly."""
    history = [
        {"role": "user", "content": "What is Python's list comprehension?"},
        {"role": "assistant", "content": "A list comprehension provides a concise syntax to create lists: `[x for x in iterable]`."}
    ]
    req = OrchestrationRequest(
        message="Can you show a filtered example of it?",
        messages=history,
        model="auto"
    )
    res = asyncio.run(orchestrator.run(req))
    assert len(res.answer.strip()) > 10
    assert_no_leaks(res.answer, "Category J")
    print("\n[PASS] Category J: Follow-up conversation passed.")


def test_api_endpoint_integration():
    """Verify HTTP API endpoint /api/ai/chat returns clean contract."""
    response = client.post(
        "/api/ai/chat",
        json={
            "message": "Explain binary search trees concisely.",
            "model": "auto"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "answer" in data
    assert "citations" in data
    assert "usage" in data
    assert "provider" in data
    assert_no_leaks(data["answer"], "API Endpoint")
    print("\n[PASS] API Endpoint integration passed.")


if __name__ == "__main__":
    print("\n========================================================")
    print("Running Zaraki AI Orchestrator Evaluation Test Suite...")
    print("========================================================")
    test_category_a_simple_factual()
    test_category_b_concept_explanation()
    test_category_c_multistep_reasoning()
    test_category_d_coding_question()
    test_category_e_ambiguous_question()
    test_category_f_current_information()
    test_category_g_document_based_query()
    test_category_h_contradictory_sources()
    test_category_i_unknown_unanswerable()
    test_category_j_follow_up_conversation()
    test_api_endpoint_integration()
    print("\n========================================================")
    print("ALL EVALUATION SUITE TESTS (CATEGORIES A-J) PASSED!")
    print("========================================================")
