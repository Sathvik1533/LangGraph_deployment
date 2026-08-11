"""
Global Pytest Configuration & Shared Fixtures
==============================================
Provides initialized test clients, rate limiter reset hooks,
and mock environments for testing the LangGraph agent system.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure root directory is on Python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app, rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Reset rate limiter state before and after each test."""
    rate_limiter.requests.clear()
    yield
    rate_limiter.requests.clear()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)
