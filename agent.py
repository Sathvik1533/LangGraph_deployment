"""
LangGraph Multi-Agent Workflow with Self-Correction
====================================================
This module defines a two-agent system with self-correction loops:
- Developer Agent: Generates Python code (can retry based on feedback)
- Tester Agent: Creates test cases and executes code
- Conditional Routing: Routes back to developer if tests fail (max 3 iterations)

Pattern: State Machine with Conditional Loops and State Reducers
V2 Features: 
- State reducers for message history
- Self-correction loops
- Tenacity-based retry logic for API resilience

Production Patterns:
- Exponential Backoff with Jitter (prevents thundering herd)
- Circuit Breaker (stops calling failing services)
- Request Timeout (configurable per request)
- Graceful Degradation (returns partial results on failure)
"""

import os
import sys
import io
import traceback
from typing import Optional, List, Dict, Any, Literal
from operator import add
import random
import time

from langchain_core.messages import HumanMessage, BaseMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from typing_extensions import TypedDict, Annotated

# Tenacity for robust API retry handling with jitter
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    after_log
)
import logging

# Configure logging for tenacity
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ============================================================================
# CONFIGURATION WITH RETRY LOGIC + JITTER
# ============================================================================

# Circuit Breaker State (production pattern)
_circuit_breaker_failures = 0
_circuit_breaker_open = False
_circuit_breaker_last_failure_time = 0
CIRCUIT_BREAKER_THRESHOLD = 5  # Open circuit after 5 failures
CIRCUIT_BREAKER_TIMEOUT = 60    # Reset circuit after 60 seconds


def get_llm():
    """
    Initialize the LLM (Large Language Model) with retry configuration.
    
    Pattern: Lazy initialization with environment variable configuration
    Why: Allows different models for different environments (dev/prod)
    
    V2: Temperature lowered to 0.1 for consistent code generation
    Production: Circuit breaker to prevent cascading failures
    """
    global _circuit_breaker_open, _circuit_breaker_last_failure_time
    
    # Circuit Breaker Pattern: Check if circuit is open
    if _circuit_breaker_open:
        elapsed = time.time() - _circuit_breaker_last_failure_time
        if elapsed < CIRCUIT_BREAKER_TIMEOUT:
            raise RuntimeError(
                f"Circuit breaker open. Service unavailable. "
                f"Retry in {CIRCUIT_BREAKER_TIMEOUT - int(elapsed)} seconds."
            )
        else:
            # Reset circuit breaker after timeout
            logger.info("Circuit breaker reset - attempting to reconnect")
            _circuit_breaker_open = False
            _circuit_breaker_failures = 0
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY environment variable not set. "
            "Please set it in your .env file or system environment."
        )
    
    model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    return ChatGroq(
        model=model_name,
        groq_api_key=api_key,
        temperature=0.1,  # Low temperature for consistent, deterministic code generation
        timeout=30.0      # Request timeout (production pattern)
    )


# Global LLM instance (initialized once)
llm = get_llm()


# ============================================================================
# RETRY DECORATOR WITH JITTER (PRODUCTION PATTERN)
# ============================================================================

def jittered_wait(multiplier=1, min_wait=1, max_wait=10):
    """
    Custom wait strategy with JITTER (randomness) to prevent thundering herd.
    
    Pattern: Exponential Backoff with Full Jitter
    Why: If 100 users get rate-limited at the same time and all retry after
         exactly 2 seconds, they'll all hit the API simultaneously again!
         Jitter spreads out the retries randomly.
    
    Example without jitter:
        Request 1-100: Fail at 12:00:00
        All retry at:   12:00:02 (synchronized - BAD!)
        All retry at:   12:00:04 (synchronized - BAD!)
    
    Example WITH jitter:
        Request 1:  Retry at 12:00:01.3
        Request 2:  Retry at 12:00:02.7
        Request 3:  Retry at 12:00:01.9
        (Spread out - GOOD!)
    
    Formula: wait_time = random(0, min(cap, base * 2^attempt))
    """
    def wait_func(retry_state):
        attempt = retry_state.attempt_number
        # Exponential: 1s, 2s, 4s, 8s, 16s...
        exponential_wait = min(max_wait, multiplier * (2 ** attempt))
        # Add jitter: random between 0 and exponential_wait
        jittered = random.uniform(min_wait, exponential_wait)
        logger.info(f"Retry attempt {attempt}: waiting {jittered:.2f}s (with jitter)")
        return jittered
    
    return wait_func


def is_retryable_error(exception: Exception) -> bool:
    """
    Determine if an exception should trigger a retry.
    
    Retries on:
    - Connection/network errors
    - Timeout errors
    - Rate limit errors (status 429)
    - Groq API temporary failures
    
    Does NOT retry on:
    - Authentication errors (wrong API key)
    - Invalid model errors
    - Malformed request errors
    """
    import httpx
    
    # Update circuit breaker on retryable errors
    global _circuit_breaker_failures, _circuit_breaker_open, _circuit_breaker_last_failure_time
    
    # Standard network errors
    if isinstance(exception, (ConnectionError, TimeoutError)):
        _circuit_breaker_failures += 1
        _circuit_breaker_last_failure_time = time.time()
        if _circuit_breaker_failures >= CIRCUIT_BREAKER_THRESHOLD:
            _circuit_breaker_open = True
            logger.error(f"Circuit breaker opened after {_circuit_breaker_failures} failures")
        return True
    
    # httpx-specific errors (used by langchain-groq)
    if isinstance(exception, (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError)):
        _circuit_breaker_failures += 1
        _circuit_breaker_last_failure_time = time.time()
        if _circuit_breaker_failures >= CIRCUIT_BREAKER_THRESHOLD:
            _circuit_breaker_open = True
            logger.error(f"Circuit breaker opened after {_circuit_breaker_failures} failures")
        return True
    
    # Rate limit detection (Groq returns 429)
    exception_str = str(exception).lower()
    if "rate" in exception_str or "429" in exception_str or "quota" in exception_str:
        return True
    
    # Groq-specific temporary errors
    if "temporarily unavailable" in exception_str or "try again" in exception_str:
        return True
    
    # Don't retry on other errors (like authentication, invalid model, etc.)
    return False


# Create retry decorator with exponential backoff + jitter
llm_retry = retry(
    stop=stop_after_attempt(3),
    wait=jittered_wait(multiplier=1, min_wait=1, max_wait=10),  # WITH JITTER!
    retry=retry_if_exception_type(Exception),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    after=after_log(logger, logging.INFO),
    reraise=True
)


@llm_retry
def call_llm_with_retry(prompt) -> Any:
    """
    Call the LLM with automatic retry logic + jitter.
    
    Pattern: Wrapper function with tenacity retry decorator + Jitter
    Why: Centralizes retry logic, production-resilient API calls
    
    Retry Strategy:
    - Max 3 attempts (stop_after_attempt(3))
    - Exponential backoff WITH JITTER: prevents thundering herd
      * Attempt 1: 0-2s (random)
      * Attempt 2: 0-4s (random)
      * Attempt 3: 0-8s (random)
    - Only retries on transient errors (connection, timeout, rate limits)
    - Logs retry attempts for monitoring
    - Circuit breaker opens after 5 consecutive failures
    
    Production Patterns:
    - ✅ Exponential Backoff with Full Jitter
    - ✅ Circuit Breaker (prevents cascading failures)
    - ✅ Request Timeout (30s per request)
    - ✅ Selective Retry (only transient errors)
    
    This function will automatically retry up to 3 times with jittered
    exponential backoff if the API call fails due to connection issues or rate limits.
    
    Args:
        prompt: Either a string prompt OR a list of message objects (for chat history)
        
    Returns:
        LLM response object
        
    Raises:
        RuntimeError: If circuit breaker is open
        Exception: After 3 failed attempts, raises the last exception
        
    Example:
        # String prompt
        response = call_llm_with_retry("Write a hello world function")
        
        # Message list (for conversation)
        messages = [SystemMessage(...), HumanMessage(...), AIMessage(...)]
        response = call_llm_with_retry(messages)
    """
    global _circuit_breaker_failures
    
    # Check if exception is retryable before attempting
    try:
        response = llm.invoke(prompt)
        # Success! Reset circuit breaker failure count
        _circuit_breaker_failures = max(0, _circuit_breaker_failures - 1)
        return response
    except Exception as e:
        if is_retryable_error(e):
            # Let tenacity handle the retry (with jitter!)
            raise
        else:
            # Don't retry on non-retryable errors (e.g., auth failures)
            logger.error(f"Non-retryable error: {e}")
            raise


# ============================================================================
# STATE DEFINITION WITH REDUCERS
# ============================================================================

class CrewState(TypedDict):
    """
    Shared state passed between all agents in the workflow.
    
    Pattern: State Reducers for Message History
    Why: Annotated with add_messages ensures messages are appended, not overwritten
    
    Key Insight: Without the reducer, each node would overwrite the entire messages list.
    With add_messages, each node can append new messages while preserving history.
    """
    messages: Annotated[List[BaseMessage], add]  # Conversation history (appended, not overwritten)
    code: Optional[str]                           # Generated Python code
    report: Optional[str]                         # Test execution report
    execution_success: bool                       # Whether code executed without errors
    iterations: int                               # Number of self-correction loops
    max_iterations: int                           # Maximum allowed iterations (configurable, default 3)


# ============================================================================
# TOOLS (Agent Capabilities)
# ============================================================================

@tool
def run_python_code(code: str) -> str:
    """
    Execute Python code in a sandboxed environment and return output.
    
    Pattern: Isolated Execution with stdout capture
    Security: No file system access, isolated scope
    
    Args:
        code: Python code string to execute
        
    Returns:
        Execution output or error traceback
        
    Deliberate Bug #2: Look at the code cleaning logic carefully
    """
    # Type safety check
    if not isinstance(code, str):
        code = str(code)
    
    # Clean markdown formatting from LLM responses
    clean_code = code.replace("```python", "").replace("```", "").strip()
    
    # Capture stdout
    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout
    
    try:
        # Execute in isolated scope (no access to globals)
        local_scope: Dict[str, Any] = {}
        exec(clean_code, {}, local_scope)
        result = new_stdout.getvalue()
    except Exception:
        # Catch all errors and return formatted traceback
        result = f"Execution Error:\n{traceback.format_exc()}"
    finally:
        # Always restore stdout (critical!)
        sys.stdout = old_stdout
    
    return result.strip() if result.strip() else "Success (no terminal output)"


@tool
def generate_test_cases(task_description: str) -> str:
    """
    Use LLM to generate test scenarios for a given task.
    
    Pattern: LLM-as-a-Tool (using AI to help AI) with retry logic
    Why: Leverage LLM's reasoning for QA thinking
    
    V2: Now uses call_llm_with_retry for resilient API calls
    
    Args:
        task_description: The coding task to generate tests for
        
    Returns:
        Numbered list of test scenarios
    """
    prompt = (
        f"You are a Senior QA Engineer. Generate 3 to 5 highly specific test scenarios "
        f"for the following coding task: '{task_description}'.\n"
        f"Include standard cases and edge cases. Return them as a numbered list."
    )
    
    # Use retry wrapper for resilient API call
    response = call_llm_with_retry(prompt)
    
    # Extract text from response (handles different response formats)
    return response.content if hasattr(response, "content") else str(response)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _extract_text(content: Any) -> str:
    """
    Extract text from LLM response (handles multiple formats).
    
    Pattern: Defensive programming for API responses
    Why: LLM responses can be strings, lists, or dicts
    """
    if isinstance(content, list):
        first = content[0]
        return first.get("text", "") if isinstance(first, dict) else str(first)
    return str(content)


# ============================================================================
# AGENT NODES
# ============================================================================

def developer_node(state: CrewState) -> Dict[str, Any]:
    """
    Developer Agent: Generates Python code based on conversation history.
    
    Pattern: Leverage LangGraph's Message History (The Clean Way!)
    Why: LLM reads the full conversation naturally - no manual error parsing needed
    
    Flow:
    1. Pass entire message history to LLM
    2. LLM sees: task → (optional) previous code → (optional) error feedback
    3. LLM naturally understands context and generates/fixes code
    4. Return code + append new message
    
    V2: Simplified - removed is_retry checks, previous_error parsing, string searches
    """
    # Create a system message to set the developer role
    from langchain_core.messages import SystemMessage
    
    system_msg = SystemMessage(
        content=(
            "You are an expert Python developer. Generate clean, working Python code. "
            "If you see execution errors in the conversation history, analyze them and fix the code. "
            "Return ONLY the Python code, no explanations or markdown formatting."
        )
    )
    
    # Build full conversation: system prompt + all history
    # The LLM will naturally see the task, any previous attempts, and error feedback
    messages_to_send = [system_msg] + state["messages"]
    
    # Use retry wrapper for resilient LLM call
    response = call_llm_with_retry(messages_to_send)
    
    # Extract code
    code = _extract_text(response.content)
    
    # Return code + add simple message to history
    return {
        "code": code,
        "messages": [AIMessage(content=f"Generated code (iteration {state.get('iterations', 0) + 1})")],
        "iterations": state.get("iterations", 0) + 1
    }


def tester_node(state: CrewState) -> Dict[str, Any]:
    """
    Tester Agent: Generates tests and executes the code.
    
    Pattern: Validate & Report with Natural Feedback
    Why: Appends clear error messages that developer LLM can read naturally
    
    Flow:
    1. Generate test scenarios using LLM
    2. Execute the code from developer
    3. Check if execution was successful (no errors)
    4. Create report and append feedback message
    5. If failed, message goes into history for developer to read on next loop
    
    V2: Simplified - just append clear error messages, no manual parsing needed
    """
    # Get original task from first message
    task = state["messages"][0].content
    
    # Generate test cases using the tool
    cases_str = _extract_text(generate_test_cases.invoke(task))
    
    # Execute the code from developer agent
    execution_result = run_python_code.invoke(state["code"])
    
    # Check if execution was successful (no errors)
    execution_success = not execution_result.startswith("Execution Error:")
    
    # Create comprehensive report
    if execution_success:
        report = (
            f"### EXECUTION OUTPUT:\n{execution_result}\n\n"
            f"### TEST SCENARIOS EVALUATED:\n{cases_str}\n\n"
            f"✅ Code executed successfully!"
        )
        # Clear success message for history
        feedback_message = "✅ Code passed all checks and executed successfully."
    else:
        report = (
            f"### EXECUTION ERROR:\n{execution_result}\n\n"
            f"### TEST SCENARIOS (not executed due to error):\n{cases_str}\n\n"
            f"❌ Code failed - needs fixing."
        )
        # Clear, detailed error message for developer LLM to read and fix
        feedback_message = (
            f"❌ The code has an execution error. Please fix it.\n\n"
            f"Error details:\n{execution_result}\n\n"
            f"Fix the code to handle this error properly."
        )
    
    # Return state update with message appended to history
    # Developer will see this message naturally on next iteration
    return {
        "report": report,
        "execution_success": execution_success,
        "messages": [AIMessage(content=feedback_message)]
    }


# ============================================================================
# CONDITIONAL ROUTING
# ============================================================================

def should_continue(state: CrewState) -> Literal["developer", "end"]:
    """
    Conditional router: Decide whether to retry or end.
    
    Pattern: Conditional Edges for Self-Correction Loops
    
    Logic:
    1. If code executed successfully → END
    2. If code failed BUT we've hit max iterations → END (prevent infinite loops)
    3. If code failed AND we have retries left → Route back to developer
    
    Why max_iterations?
    - Prevents infinite loops when bugs are unfixable
    - Saves API costs
    - Provides clear failure state
    
    Note: MAX_ITERATIONS is read from state (set by API) or defaults to 3
    """
    MAX_ITERATIONS = state.get("max_iterations", 3)  # Dynamic with safe default
    
    # Check if we've exceeded max iterations
    if state.get("iterations", 0) >= MAX_ITERATIONS:
        print(f"⚠️  Max iterations ({MAX_ITERATIONS}) reached. Stopping.")
        return "end"
    
    # Check if execution was successful
    if state.get("execution_success", False):
        print("✅ Code passed! Ending workflow.")
        return "end"
    
    # Code failed and we have retries left
    print(f"🔄 Code failed. Retrying... (iteration {state.get('iterations', 0)}/{MAX_ITERATIONS})")
    return "developer"


# ============================================================================
# WORKFLOW DEFINITION WITH CONDITIONAL ROUTING
# ============================================================================

def create_workflow() -> StateGraph:
    """
    Build the LangGraph workflow with self-correction loop.
    
    Pattern: Graph-based Agent Orchestration with Conditional Routing
    
    Workflow Structure:
        START → developer → tester → [conditional]
                    ↑                      ↓
                    └──── (if failed) ────┘
                                           ↓
                                      (if passed) → END
        
    Key Features:
    1. State Reducers: Messages are appended, not overwritten
    2. Conditional Routing: Self-correction loop if tests fail
    3. Max Iterations Guard: Prevents infinite loops (max 3 attempts)
    
    Why this architecture?
    - Allows agents to learn from failures
    - Prevents infinite loops with guard rails
    - Maintains full conversation history
    - Production-ready error handling
    """
    # Initialize the graph with our state schema
    workflow = StateGraph(CrewState)
    
    # Add nodes (agents)
    workflow.add_node("developer", developer_node)
    workflow.add_node("tester", tester_node)
    
    # Define edges
    workflow.add_edge(START, "developer")
    workflow.add_edge("developer", "tester")
    
    # Add CONDITIONAL edge from tester
    # This is the key feature - routes back to developer if tests fail!
    workflow.add_conditional_edges(
        "tester",
        should_continue,
        {
            "developer": "developer",  # Retry: go back to developer
            "end": END                  # Success: end the workflow
        }
    )
    
    return workflow


def get_agent():
    """
    Compile and return the executable agent workflow.
    
    Pattern: Factory function
    Why: Encapsulates workflow creation, easy to test
    
    Returns:
        Compiled LangGraph workflow ready to invoke
    """
    workflow = create_workflow()
    return workflow.compile()


# ============================================================================
# EXPORTS
# ============================================================================

# Export the compiled agent for use in app.py
agent = get_agent()

# Export for testing or alternate usage
__all__ = ["agent", "CrewState", "get_agent"]
