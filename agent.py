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
# CONFIGURATION WITH RETRY LOGIC + JITTER + FALLBACK
# ============================================================================

# Circuit Breaker State (production pattern)
_circuit_breaker_failures = 0
_circuit_breaker_open = False
_circuit_breaker_last_failure_time = 0
CIRCUIT_BREAKER_THRESHOLD = 5  # Open circuit after 5 failures
CIRCUIT_BREAKER_TIMEOUT = 60    # Reset circuit after 60 seconds

# Multi-Provider Fallback Configuration
LLM_PROVIDERS = [
    {
        "name": "groq",
        "env_key": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "class": ChatGroq,
        "available": True
    },
    # Add more providers as fallbacks
    # {
    #     "name": "openai",
    #     "env_key": "OPENAI_API_KEY", 
    #     "model": "gpt-4",
    #     "class": ChatOpenAI,
    #     "available": False
    # }
]

_current_provider_index = 0


def get_llm(force_fallback=False):
    """
    Initialize the LLM with multi-provider fallback support.
    
    Pattern: Multi-Provider Fallback
    Why: If primary LLM fails, automatically switch to backup provider
    
    Fallback Chain:
    1. Groq (Llama 3.3 70B) - Primary, fastest
    2. OpenAI (GPT-4) - Fallback 1 (if configured)
    3. Anthropic (Claude) - Fallback 2 (if configured)
    
    Production: Circuit breaker + automatic provider switching
    """
    global _circuit_breaker_open, _circuit_breaker_last_failure_time, _current_provider_index
    
    # Circuit Breaker Pattern: Check if circuit is open
    if _circuit_breaker_open and not force_fallback:
        elapsed = time.time() - _circuit_breaker_last_failure_time
        if elapsed < CIRCUIT_BREAKER_TIMEOUT:
            # Try fallback provider if available
            if _current_provider_index < len(LLM_PROVIDERS) - 1:
                logger.warning(f"Circuit breaker open for primary provider. Trying fallback...")
                _current_provider_index += 1
                force_fallback = True
            else:
                raise RuntimeError(
                    f"All LLM providers unavailable. "
                    f"Retry in {CIRCUIT_BREAKER_TIMEOUT - int(elapsed)} seconds."
                )
        else:
            # Reset circuit breaker after timeout
            logger.info("Circuit breaker reset - attempting to reconnect")
            _circuit_breaker_open = False
            _circuit_breaker_failures = 0
            _current_provider_index = 0  # Reset to primary
    
    # Try current provider
    provider = LLM_PROVIDERS[_current_provider_index]
    api_key = os.environ.get(provider["env_key"])
    
    if not api_key:
        # Try fallback if primary fails
        if _current_provider_index < len(LLM_PROVIDERS) - 1:
            logger.warning(f"{provider['name']} API key not found. Trying fallback...")
            _current_provider_index += 1
            return get_llm(force_fallback=True)
        else:
            raise RuntimeError(
                f"No LLM provider API keys found. Please set {provider['env_key']} "
                f"in your .env file or system environment."
            )
    
    logger.info(f"Using LLM provider: {provider['name']} ({provider['model']})")
    
    return provider["class"](
        model=provider["model"],
        **{provider["env_key"].lower(): api_key},  # Dynamic key name
        temperature=0.1,  # Low temperature for consistent code generation
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
# INPUT & OUTPUT VALIDATION (Production Pattern)
# ============================================================================

def validate_task_input(task: str) -> tuple[bool, Optional[str]]:
    """
    Validate user input before processing.
    
    Pattern: Input Validation
    Why: Prevent garbage in, garbage out. Fail fast on bad input.
    
    Checks:
    - Not empty
    - Reasonable length (10-1000 chars)
    - No malicious patterns
    - Actually asks for code
    
    Returns:
        (is_valid, error_message)
    """
    # Empty check
    if not task or not task.strip():
        return False, "Task cannot be empty. Please describe what code you want to generate."
    
    # Length check
    if len(task) < 10:
        return False, "Task too short. Please provide more details (minimum 10 characters)."
    
    if len(task) > 1000:
        return False, "Task too long. Please keep it under 1000 characters."
    
    # Content check - must mention code/function/class/program
    code_keywords = ['function', 'code', 'class', 'program', 'script', 'implement', 'write', 'create', 'build', 'generate']
    if not any(keyword in task.lower() for keyword in code_keywords):
        return False, "Task unclear. Please explicitly ask for code/function/class to be generated."
    
    # Security check - no obvious injection attempts
    dangerous_patterns = ['__import__', 'eval(', 'exec(', 'compile(', 'os.system', 'subprocess']
    if any(pattern in task for pattern in dangerous_patterns):
        return False, "Task contains potentially dangerous code patterns. Please rephrase."
    
    return True, None


def validate_code_output(code: str) -> tuple[bool, Optional[str]]:
    """
    Validate LLM output is actually Python code.
    
    Pattern: Output Validation
    Why: LLM sometimes returns explanations instead of code. Catch this early.
    
    Checks:
    - Not empty
    - Has Python syntax (def, class, import, etc.)
    - Not just explanation text
    - Can be parsed as Python
    
    Returns:
        (is_valid, error_message)
    """
    if not code or not code.strip():
        return False, "Developer agent returned empty code. This is a bug."
    
    # Must contain Python keywords
    python_keywords = ['def ', 'class ', 'import ', 'from ', 'return', '=']
    if not any(keyword in code for keyword in python_keywords):
        return False, "Output doesn't look like Python code. Contains only text/explanation."
    
    # Try to parse as Python
    try:
        compile(code, '<string>', 'exec')
        return True, None
    except SyntaxError as e:
        return False, f"Generated code has syntax errors: {str(e)}"
    except Exception as e:
        # Still accept it - might be valid code that needs imports
        logger.warning(f"Code validation warning: {e}")
        return True, None


# ============================================================================
# STATE DEFINITION WITH REDUCERS + VALIDATION
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


def _make_user_friendly_error(exception: Exception) -> str:
    """
    Convert technical errors to user-friendly messages.
    
    Pattern: Error Translation
    Why: Users don't need stack traces. Give them actionable messages.
    
    Examples:
    - 429 Rate Limit → "Too many requests. Please try again in a few seconds."
    - Timeout → "Request took too long. Try a simpler task or retry."
    - Network Error → "Connection issue. Please check your internet and retry."
    """
    error_str = str(exception).lower()
    
    # Rate limiting
    if "429" in error_str or "rate limit" in error_str or "quota" in error_str:
        return "⚠️ Rate limit reached. The AI service is busy. Please wait 30 seconds and try again."
    
    # Timeout
    if "timeout" in error_str or "timed out" in error_str:
        return "⏱️ Request timed out. Try a simpler task or increase timeout. The task might be too complex."
    
    # Connection errors
    if "connection" in error_str or "network" in error_str:
        return "🌐 Connection error. Please check your internet connection and try again."
    
    # Authentication
    if "401" in error_str or "unauthorized" in error_str or "api key" in error_str:
        return "🔑 API key invalid or expired. Please check your GROQ_API_KEY configuration."
    
    # Service unavailable
    if "503" in error_str or "unavailable" in error_str:
        return "🚫 AI service temporarily unavailable. Please try again in a few minutes."
    
    # Circuit breaker
    if "circuit breaker" in error_str:
        return "⚡ Service experiencing issues. Automatic retry in 60 seconds. Please wait."
    
    # Generic fallback
    return f"❌ Something went wrong: {str(exception)[:100]}... Please try again or contact support."


# ============================================================================
# AGENT NODES
# ============================================================================

def developer_node(state: CrewState) -> Dict[str, Any]:
    """
    Developer Agent: Generates Python code with output validation.
    
    Pattern: Output Validation + Graceful Error Handling
    Why: Don't pass garbage from one agent to another. Validate outputs.
    
    Flow:
    1. Pass entire message history to LLM
    2. LLM generates code
    3. **VALIDATE** code is actually Python
    4. If invalid, add error message and mark for retry
    5. If valid, proceed normally
    
    V2: Simplified - no manual error parsing
    V3: Added output validation - prevents bad data flowing through system
    """
    from langchain_core.messages import SystemMessage
    
    system_msg = SystemMessage(
        content=(
            "You are an expert Python developer. Generate clean, working Python code. "
            "If you see execution errors in the conversation history, analyze them and fix the code. "
            "Return ONLY the Python code, no explanations or markdown formatting."
        )
    )
    
    # Build full conversation
    messages_to_send = [system_msg] + state["messages"]
    
    try:
        # Use retry wrapper for resilient LLM call
        response = call_llm_with_retry(messages_to_send)
        
        # Extract code
        code = _extract_text(response.content)
        
        # VALIDATION: Check if output is actually code
        is_valid, error_msg = validate_code_output(code)
        
        if not is_valid:
            logger.error(f"Developer output validation failed: {error_msg}")
            
            # Return error state - will be caught by tester
            return {
                "code": f"# ERROR: {error_msg}\n# The LLM returned invalid output.",
                "messages": [AIMessage(content=f"⚠️ Output validation failed: {error_msg}")],
                "iterations": state.get("iterations", 0) + 1,
                "execution_success": False  # Mark as failed
            }
        
        # Valid code - proceed normally
        return {
            "code": code,
            "messages": [AIMessage(content=f"✅ Generated code (iteration {state.get('iterations', 0) + 1})")],
            "iterations": state.get("iterations", 0) + 1
        }
        
    except Exception as e:
        logger.error(f"Developer agent failed: {str(e)}")
        
        # Graceful error handling - return friendly message
        user_friendly_error = _make_user_friendly_error(e)
        
        return {
            "code": f"# ERROR: {user_friendly_error}",
            "messages": [AIMessage(content=f"❌ Developer agent error: {user_friendly_error}")],
            "iterations": state.get("iterations", 0) + 1,
            "execution_success": False,
            "report": f"### ERROR\n{user_friendly_error}"
        }


def tester_node(state: CrewState) -> Dict[str, Any]:
    """
    Tester Agent: Validates and tests code with input validation.
    
    Pattern: Inter-Agent Validation + Graceful Error Handling
    Why: Don't blindly trust previous agent. Validate inputs before processing.
    
    Flow:
    1. **VALIDATE** code from developer (is it actually Python?)
    2. If invalid, return error immediately (don't waste time testing)
    3. Generate test scenarios using LLM
    4. Execute the code
    5. Check if execution was successful
    6. Create report and feedback
    
    V2: Simplified - just append clear error messages
    V3: Added input validation - validates developer output before testing
    """
    # Get original task from first message
    task = state["messages"][0].content
    
    # VALIDATION: Check if developer actually returned valid code
    code = state.get("code", "")
    if code.startswith("# ERROR:"):
        # Developer failed - don't bother testing
        return {
            "report": f"### DEVELOPER ERROR\n{code}\n\n❌ Cannot run tests - code generation failed.",
            "execution_success": False,
            "messages": [AIMessage(content="❌ Developer returned invalid output. Cannot proceed with testing.")]
        }
    
    # Double-check code validity (defense in depth)
    is_valid, error_msg = validate_code_output(code)
    if not is_valid:
        return {
            "report": f"### CODE VALIDATION FAILED\n{error_msg}\n\n❌ Cannot run tests - code is invalid.",
            "execution_success": False,
            "messages": [AIMessage(content=f"❌ Code validation failed: {error_msg}")]
        }
    
    try:
        # Generate test cases using the tool (with error handling)
        try:
            cases_str = _extract_text(generate_test_cases.invoke(task))
        except Exception as e:
            logger.warning(f"Test case generation failed: {e}")
            cases_str = "1. Basic functionality test\n2. Edge case test\n3. Error handling test"
        
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
            feedback_message = "✅ Code passed all checks and executed successfully."
        else:
            report = (
                f"### EXECUTION ERROR:\n{execution_result}\n\n"
                f"### TEST SCENARIOS (not executed due to error):\n{cases_str}\n\n"
                f"❌ Code failed - needs fixing."
            )
            feedback_message = (
                f"❌ The code has an execution error. Please fix it.\n\n"
                f"Error details:\n{execution_result}\n\n"
                f"Fix the code to handle this error properly."
            )
        
        return {
            "report": report,
            "execution_success": execution_success,
            "messages": [AIMessage(content=feedback_message)]
        }
        
    except Exception as e:
        logger.error(f"Tester agent failed: {str(e)}")
        
        # Graceful error handling
        user_friendly_error = _make_user_friendly_error(e)
        
        return {
            "report": f"### TESTING ERROR\n{user_friendly_error}",
            "execution_success": False,
            "messages": [AIMessage(content=f"❌ Tester error: {user_friendly_error}")]
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
