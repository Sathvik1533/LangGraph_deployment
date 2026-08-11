"""
FastAPI End-to-End TestClient Verification
"""

from fastapi.testclient import TestClient
from app import app


def test_api_generate_java_linked_list():
    client = TestClient(app)
    response = client.post("/generate", json={
        "task": "Create a Java program to implement a linked list",
        "language": "java",
        "max_iterations": 3,
        "hitl_mode": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "LinkedList.java"
    assert "```" not in data["code"]
    assert "public class LinkedList" in data["code"]
    assert "private static class Node" in data["code"]
    assert "public void insert" in data["code"]
    assert "public boolean delete" in data["code"]
    assert "public void display" in data["code"]


def test_api_generate_python_email_validator():
    client = TestClient(app)
    response = client.post("/generate", json={
        "task": "Validate an email address in Python",
        "language": "python",
        "max_iterations": 3,
        "hitl_mode": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["filename"] == "EmailValidator.py"
    assert "```" not in data["code"]
    assert "def validate_email" in data["code"]


def test_api_hitl_action_returns_filename():
    client = TestClient(app)
    # 1. Draft
    draft_res = client.post("/generate", json={
        "task": "Create a Java program to implement a linked list",
        "language": "java",
        "max_iterations": 3,
        "hitl_mode": True
    })
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert draft_data["hitl_status"] == "awaiting_human_review"
    assert draft_data["filename"] == "LinkedList.java"
    thread_id = draft_data["thread_id"]

    # 2. Approve
    action_res = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "approve",
        "language": "java"
    })
    assert action_res.status_code == 200
    action_data = action_res.json()
    assert action_data["filename"] == "LinkedList.java"
    assert action_data["execution_success"] is True
