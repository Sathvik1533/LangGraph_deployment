"""
Dynamic Multi-Agent Workflow Tests
Verifies that arbitrary user tasks (Java Linked List, Python Email Validator, etc.)
flow directly through LangGraph without hardcoded overrides or static falls.
"""

import pytest
from fastapi.testclient import TestClient
from app import app
from agent import DemoLLM, run_python_code
from langchain_core.messages import HumanMessage


@pytest.fixture
def client():
    return TestClient(app)


def test_java_linked_list_generation(client):
    """Test 1: User task 'Java linked list' produces Java code with Node and insertion."""
    res = client.post("/generate", json={
        "task": "Create a Java program to implement a linked list with insertion, deletion and traversal",
        "language": "java",
        "max_iterations": 3,
        "hitl_mode": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    code = data["code"]
    assert "Node" in code or "LinkedList" in code
    assert "insert" in code and "delete" in code
    assert "isPrime" not in code and "is_prime" not in code


def test_python_email_validator_execution(client):
    """Test 2: User task 'Python email validator' produces regex validator that passes sandbox."""
    res = client.post("/generate", json={
        "task": "Write a Python function to validate email addresses",
        "language": "python",
        "max_iterations": 3,
        "hitl_mode": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["execution_success"] is True
    code = data["code"]
    assert "validate_email" in code
    assert "isPrime" not in code and "is_prime" not in code


def test_cpp_stack_generation(client):
    """Test 3: C++ language flows through workflow cleanly."""
    res = client.post("/generate", json={
        "task": "Implement a Stack data structure in C++ with push, pop, and peek",
        "language": "cpp",
        "max_iterations": 3,
        "hitl_mode": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    code = data["code"]
    assert "#include" in code
    assert "main" in code


def test_sse_streaming_events(client):
    """Test 4: SSE streaming endpoint emits structured workflow events."""
    res = client.get("/stream?task=Write+a+Python+function+to+validate+email+addresses&language=python&max_iterations=3")
    assert res.status_code == 200
    lines = [line for line in res.text.split("\n") if line.startswith("data: ")]
    assert len(lines) >= 5
    assert any("start" in line for line in lines)
    assert any("developer" in line for line in lines)
    assert any("tester" in line for line in lines)
    assert any("workflow_complete" in line for line in lines)


def test_human_in_the_loop_cycle(client):
    """Test 5: HITL Gate pauses execution and resumes upon human decision."""
    # 1. Start with HITL enabled
    res = client.post("/generate", json={
        "task": "Create a Java program to implement a linked list",
        "language": "java",
        "max_iterations": 3,
        "hitl_mode": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["hitl_status"] == "awaiting_human_review"
    tid = data["thread_id"]

    # 2. Approve via /hitl/action
    res_action = client.post("/hitl/action", json={
        "thread_id": tid,
        "action": "approve",
        "language": "java"
    })
    assert res_action.status_code == 200
    action_data = res_action.json()
    assert action_data["success"] is True
    assert action_data["hitl_status"] == "approved"
