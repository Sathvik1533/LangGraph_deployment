"""
Unit and Integration Tests for Human-in-the-Loop (HITL) Gate & Governance System
"""

import pytest
from fastapi.testclient import TestClient
from app import app, hitl_sessions, hitl_stats


@pytest.fixture
def client():
    return TestClient(app)


def test_hitl_generate_pauses_for_review(client):
    """Test that requesting code generation in HITL mode pauses at Human Review Gate."""
    payload = {
        "task": "Write a function to compute factorial of a number",
        "language": "python",
        "hitl_mode": True
    }
    response = client.post("/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["hitl_status"] == "awaiting_human_review"
    assert data["code"] is not None
    assert data["thread_id"] is not None
    assert "HUMAN-IN-THE-LOOP" in data["report"]


def test_hitl_action_approve(client):
    """Test approving draft code at Human Review Gate passes to sandbox testing."""
    # Step 1: Start HITL session
    gen_res = client.post("/generate", json={
        "task": "Write a function to return maximum of two numbers",
        "language": "python",
        "hitl_mode": True
    })
    thread_id = gen_res.json()["thread_id"]

    # Step 2: Human Approves
    action_res = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "approve"
    })
    assert action_res.status_code == 200
    data = action_res.json()
    assert data["hitl_status"] == "approved"
    assert data["code"] is not None


def test_hitl_action_edit(client):
    """Test human modifying the code in-place before running sandbox tests."""
    # Step 1: Start HITL session
    gen_res = client.post("/generate", json={
        "task": "Write a function to square a number",
        "language": "python",
        "hitl_mode": True
    })
    thread_id = gen_res.json()["thread_id"]

    # Step 2: Human modifies code directly
    custom_code = "def square(n):\n    return n * n\n\nassert square(5) == 25\nprint('Custom code verified')"
    action_res = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "edit",
        "edited_code": custom_code
    })
    assert action_res.status_code == 200
    data = action_res.json()
    assert data["hitl_status"] == "edited"
    assert "square" in data["code"]


def test_hitl_action_reject_with_feedback(client):
    """Test human requesting AI revisions with custom instructions."""
    # Step 1: Start HITL session
    gen_res = client.post("/generate", json={
        "task": "Write a function to sum a list of numbers",
        "language": "python",
        "hitl_mode": True
    })
    thread_id = gen_res.json()["thread_id"]

    # Step 2: Human Rejects with guidance
    action_res = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "reject",
        "feedback": "Please use built-in sum() with type hints"
    })
    assert action_res.status_code == 200
    data = action_res.json()
    assert data["hitl_status"] == "awaiting_human_review"
    assert "REVISED BY AI" in data["report"]


def test_hitl_action_abort(client):
    """Test cancelling/aborting a task safely at the Human Review Gate."""
    gen_res = client.post("/generate", json={
        "task": "Write a task to test abort",
        "language": "python",
        "hitl_mode": True
    })
    thread_id = gen_res.json()["thread_id"]

    action_res = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "abort"
    })
    assert action_res.status_code == 200
    data = action_res.json()
    assert data["hitl_status"] == "aborted"
    assert "ABORTED" in data["report"]


def test_hitl_pending_and_stats(client):
    """Test pending queue and governance metrics endpoints."""
    # Check stats
    stats_res = client.get("/hitl/stats")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert "governance_mode" in stats_data
    assert "stats" in stats_data

    # Check pending
    pending_res = client.get("/hitl/pending")
    assert pending_res.status_code == 200
    pending_data = pending_res.json()
    assert "count" in pending_data
    assert isinstance(pending_data["sessions"], list)


def test_hitl_action_on_completed_run_returns_400(client):
    """Test that submitting a HITL action on an already completed run returns HTTP 400."""
    gen_res = client.post("/generate", json={
        "task": "Write a function to return minimum of two numbers",
        "language": "python",
        "hitl_mode": True
    })
    thread_id = gen_res.json()["thread_id"]

    # First action completes the session
    act1 = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "approve"
    })
    assert act1.status_code == 200

    # Second action on the completed session should return 400
    act2 = client.post("/hitl/action", json={
        "thread_id": thread_id,
        "action": "approve"
    })
    assert act2.status_code == 400
    assert "already completed" in act2.json()["detail"]

