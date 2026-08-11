"""
Test Suite: Dynamic Task Intent Normalization & Authoritative Target Language Switching
Validates decoupling between raw task wording (e.g. 'Write a Python function...')
and authoritative runtime target language selection (Python -> Java -> C++).
"""

import pytest
from fastapi.testclient import TestClient
from app import app
from agent import (
    extract_task_intent,
    generate_artifact_filename,
    developer_node,
    tester_node,
    CrewState
)
from langchain_core.messages import HumanMessage

client = TestClient(app)


def test_task_intent_extraction_logic():
    """Verify that language prefixes/suffixes are cleanly stripped to yield underlying task intent."""
    raw_1 = "Write a Python function that reverses a string and create tests for it."
    assert extract_task_intent(raw_1) == "Reverse a string and create tests for it"

    raw_2 = "Create a singly linked list in Java with insertion, deletion, and traversal."
    assert extract_task_intent(raw_2) == "Singly linked list with insertion, deletion, and traversal"

    raw_3 = "Write a C++ function to check if a number is prime."
    assert extract_task_intent(raw_3) == "Check if a number is prime"

    raw_4 = "Implement a stack using Python."
    assert extract_task_intent(raw_4) == "Stack"


def test_artifact_filename_derivation():
    """Verify that artifact filename correctly matches target language extension."""
    task = "Write a Python function that reverses a string and create tests for it."
    intent = extract_task_intent(task)

    assert generate_artifact_filename(intent, "python") == "StringReverser.py"
    assert generate_artifact_filename(intent, "java") == "StringReverser.java"
    assert generate_artifact_filename(intent, "cpp") == "StringReverser.cpp"


def test_dynamic_language_switching_in_developer_node():
    """
    Test Step 1-7: Single prompt 'Write a Python function...' executed across
    Python, Java, and C++ with target language authority.
    """
    raw_prompt = "Write a Python function that reverses a string and create tests for it."
    intent = extract_task_intent(raw_prompt)

    # 1. Target: Python
    state_py: CrewState = {
        "messages": [HumanMessage(content=raw_prompt)],
        "task_specification": raw_prompt,
        "task_intent": intent,
        "language": "python",
        "target_language": "python",
        "code": None,
        "filename": "StringReverser.py",
        "report": None,
        "execution_success": False,
        "iterations": 0,
        "max_iterations": 3,
        "hitl_enabled": False
    }
    dev_py = developer_node(state_py)
    assert "def reverse_string" in dev_py["code"]
    assert "class" not in dev_py["code"] or "StringReverser" not in dev_py["code"]
    assert dev_py["filename"] == "StringReverser.py"

    # 2. Target: Java (Without changing prompt text!)
    state_java: CrewState = {
        "messages": [HumanMessage(content=raw_prompt)],
        "task_specification": raw_prompt,
        "task_intent": intent,
        "language": "java",
        "target_language": "java",
        "code": None,
        "filename": "StringReverser.java",
        "report": None,
        "execution_success": False,
        "iterations": 0,
        "max_iterations": 3,
        "hitl_enabled": False
    }
    dev_java = developer_node(state_java)
    assert "public class StringReverser" in dev_java["code"]
    assert "public static String reverseString" in dev_java["code"]
    assert dev_java["filename"] == "StringReverser.java"

    # 3. Target: C++ (Without changing prompt text!)
    state_cpp: CrewState = {
        "messages": [HumanMessage(content=raw_prompt)],
        "task_specification": raw_prompt,
        "task_intent": intent,
        "language": "cpp",
        "target_language": "cpp",
        "code": None,
        "filename": "StringReverser.cpp",
        "report": None,
        "execution_success": False,
        "iterations": 0,
        "max_iterations": 3,
        "hitl_enabled": False
    }
    dev_cpp = developer_node(state_cpp)
    assert "#include <iostream>" in dev_cpp["code"]
    assert "std::string reverseString" in dev_cpp["code"]
    assert dev_cpp["filename"] == "StringReverser.cpp"


def test_sandbox_tester_and_hitl_for_switched_languages():
    """Test Step 8 & 9: Sandbox Tester executing generated Java and C++ artifacts."""
    raw_prompt = "Write a Python function that reverses a string and create tests for it."
    intent = extract_task_intent(raw_prompt)

    # 1. Developer generates C++
    state_cpp: CrewState = {
        "messages": [HumanMessage(content=raw_prompt)],
        "task_specification": raw_prompt,
        "task_intent": intent,
        "language": "cpp",
        "target_language": "cpp",
        "code": None,
        "filename": "StringReverser.cpp",
        "report": None,
        "execution_success": False,
        "iterations": 0,
        "max_iterations": 3,
        "hitl_enabled": True
    }
    dev_cpp = developer_node(state_cpp)
    state_cpp["code"] = dev_cpp["code"]
    state_cpp["iterations"] = 1

    # 2. Sandbox Tester verifies C++ code
    test_res = tester_node(state_cpp)
    assert test_res["execution_success"] is True
    assert "C++" in test_res["report"]


def test_api_generate_endpoint_language_switching():
    """Verify /generate endpoint respects authoritative target_language parameter."""
    raw_prompt = "Write a Python function that reverses a string and create tests for it."

    # Test Java override
    resp = client.post("/generate", json={
        "task": raw_prompt,
        "target_language": "java",
        "language": "java",
        "hitl_mode": False
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["filename"] == "StringReverser.java"
    assert "public class StringReverser" in data["code"]
    assert data["target_language"] == "java"
    assert data["task_intent"] == "Reverse a string and create tests for it"

    # Test C++ override
    resp_cpp = client.post("/generate", json={
        "task": raw_prompt,
        "target_language": "cpp",
        "language": "cpp",
        "hitl_mode": False
    })
    assert resp_cpp.status_code == 200
    data_cpp = resp_cpp.json()
    assert data_cpp["success"] is True
    assert data_cpp["filename"] == "StringReverser.cpp"
    assert "std::string reverseString" in data_cpp["code"]
    assert data_cpp["target_language"] == "cpp"


def test_api_hitl_action_language_switching():
    """Verify HITL review gate pause and resume with target language authority."""
    raw_prompt = "Write a Python function that reverses a string and create tests for it."
    
    # 1. Launch with HITL enabled for Java
    resp = client.post("/generate", json={
        "task": raw_prompt,
        "target_language": "java",
        "language": "java",
        "hitl_mode": True
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["hitl_status"] == "awaiting_human_review"
    assert data["filename"] == "StringReverser.java"
    thread_id = data["thread_id"]

    # 2. Approve via /hitl/action
    action_resp = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "approve",
        "target_language": "java",
        "language": "java"
    })
    assert action_resp.status_code == 200
    action_data = action_resp.json()
    assert action_data["success"] is True
    assert action_data["execution_success"] is True
    assert action_data["hitl_status"] == "approved"
    assert "Java" in action_data["report"] or "JAVA" in action_data["report"]

