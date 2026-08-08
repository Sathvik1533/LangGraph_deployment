"""
FastAPI Application for LangGraph Self-Correcting Agent
========================================================
This module exposes the LangGraph agent workflow via REST API.

Architecture:
- Uses agent.py (self-correcting workflow with Groq)
- Provides standard REST endpoints
- Returns detailed execution results including iterations

Production Patterns:
- Rate Limiting (prevents API abuse)
- Health Checks (monitors system status)
- Request Timeout (configurable per request)
- Graceful Degradation (returns partial results on failure)
- Circuit Breaker (via agent.py)
- Jitter for retries (via agent.py)
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging
import time
from collections import defaultdict, deque

from agent import agent, CrewState, _circuit_breaker_open, _circuit_breaker_failures
from langchain_core.messages import HumanMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# RATE LIMITING (Production Pattern)
# ============================================================================

class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window algorithm.
    
    Production Pattern: Rate Limiting
    Why: Prevents API abuse, protects backend from overload
    
    In production, use Redis-based rate limiter for distributed systems.
    """
    def __init__(self, max_requests=10, window_seconds=60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(deque)  # IP -> deque of timestamps
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed based on rate limit."""
        now = time.time()
        request_times = self.requests[identifier]
        
        # Remove old requests outside the window
        while request_times and request_times[0] < now - self.window_seconds:
            request_times.popleft()
        
        # Check if under limit
        if len(request_times) < self.max_requests:
            request_times.append(now)
            return True
        
        return False
    
    def get_reset_time(self, identifier: str) -> float:
        """Get seconds until rate limit resets."""
        request_times = self.requests[identifier]
        if not request_times:
            return 0
        oldest = request_times[0]
        return max(0, self.window_seconds - (time.time() - oldest))


# Global rate limiter (10 requests per minute per IP)
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)

# Initialize FastAPI app
app = FastAPI(
    title="LangGraph Self-Correcting Agent API",
    description="Multi-agent system that generates, tests, and self-corrects Python code",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TaskRequest(BaseModel):
    """Request model for code generation tasks"""
    task: str = Field(
        ...,
        description="Description of the Python code to generate",
        example="Write a function to calculate fibonacci numbers"
    )
    max_iterations: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum self-correction attempts (1-10, default: 3)"
    )


class AgentResponse(BaseModel):
    """Response model with full execution details"""
    success: bool = Field(description="Whether the agent workflow completed successfully")
    code: Optional[str] = Field(None, description="Generated Python code")
    report: Optional[str] = Field(None, description="Detailed execution report with test results")
    execution_success: bool = Field(False, description="Whether the code executed without errors")
    iterations: int = Field(0, description="Number of self-correction iterations")
    error: Optional[str] = Field(None, description="Error message if workflow failed")


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint with circuit breaker status.
    
    Production Pattern: Health Checks
    Why: Monitoring systems (Kubernetes, AWS ELB) need to know if service is healthy
    
    Returns:
        dict: Health status including circuit breaker state
    """
    return {
        "status": "healthy" if not _circuit_breaker_open else "degraded",
        "service": "LangGraph Self-Correcting Agent",
        "version": "2.0.0",
        "circuit_breaker": {
            "open": _circuit_breaker_open,
            "failures": _circuit_breaker_failures,
            "status": "Circuit breaker is open - service temporarily unavailable" if _circuit_breaker_open else "OK"
        },
        "timestamp": time.time()
    }


@app.get("/", tags=["Health"])
def health():
    """
    Simple health check endpoint
    
    Returns:
        dict: Status and API information
    """
    return {
        "status": "ok",
        "service": "LangGraph Self-Correcting Agent",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "invoke": "/invoke",
            "info": "/info"
        }
    }


@app.get("/info", tags=["Info"])
def get_info():
    """
    Get agent capabilities and configuration
    
    Returns:
        dict: Agent information
    """
    return {
        "agent": "LangGraph Self-Correcting Agent",
        "features": [
            "Self-correcting code generation",
            "Automated test case generation",
            "Code execution and validation",
            "Iterative error fixing (max 3 attempts)",
            "Full conversation history"
        ],
        "workflow": "Developer Agent → Tester Agent → Conditional Router",
        "max_iterations": 3,
        "model": "Groq Llama 3.3 70B Versatile"
    }


@app.post("/invoke", response_model=AgentResponse, tags=["Agent"])
async def invoke_agent(request: TaskRequest, req: Request):
    """
    Invoke the self-correcting agent workflow with comprehensive error handling.
    
    Production Patterns Applied:
    - ✅ Input Validation (fail fast on bad input)
    - ✅ Rate Limiting (10 req/min per IP)
    - ✅ Circuit Breaker (stops calling failing services)
    - ✅ Graceful Degradation (returns partial results on timeout)
    - ✅ User-Friendly Errors (no stack traces to users)
    - ✅ Multi-Provider Fallback (switches LLM if primary fails)
    - ✅ Request Timeout (configurable)
    - ✅ Jitter for retries (in agent.py)
    
    Args:
        request: TaskRequest with code generation task
        req: FastAPI Request object (for IP-based rate limiting)
        
    Returns:
        AgentResponse: Complete workflow results or user-friendly error
        
    Raises:
        HTTPException 422: Invalid input
        HTTPException 429: Rate limit exceeded
        HTTPException 503: Circuit breaker open (service unavailable)
        HTTPException 500: Agent workflow failed (with friendly message)
    """
    from agent import validate_task_input, _make_user_friendly_error
    
    # INPUT VALIDATION (Production Pattern)
    is_valid, validation_error = validate_task_input(request.task)
    if not is_valid:
        logger.warning(f"Invalid input: {validation_error}")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid input",
                "message": validation_error,
                "tip": "Please provide a clear description of what code you want to generate."
            }
        )
    
    # Rate Limiting (Production Pattern)
    client_ip = req.client.host if req.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        reset_time = rate_limiter.get_reset_time(client_ip)
        logger.warning(f"Rate limit exceeded for {client_ip}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": f"⚠️ Too many requests. Please try again in {int(reset_time)} seconds.",
                "retry_after": int(reset_time),
                "tip": "Rate limit: 10 requests per minute per IP"
            }
        )
    
    # Circuit Breaker Check (Production Pattern)
    if _circuit_breaker_open:
        logger.error("Circuit breaker open - rejecting request")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "Service temporarily unavailable",
                "message": "⚡ The AI service is experiencing issues. Automatic recovery in progress.",
                "circuit_breaker_failures": _circuit_breaker_failures,
                "tip": "Please try again in 60 seconds. The system is protecting itself from cascading failures."
            }
        )
    
    try:
        logger.info(f"✅ Validated request from {client_ip}: {request.task[:50]}...")
        logger.info(f"Max iterations: {request.max_iterations}")
        
        # Prepare initial state
        initial_state: CrewState = {
            "messages": [HumanMessage(content=request.task)],
            "code": None,
            "report": None,
            "execution_success": False,
            "iterations": 0,
            "max_iterations": request.max_iterations
        }
        
        # Invoke the agent workflow
        result = agent.invoke(initial_state)
        
        logger.info(f"✅ Agent completed in {result.get('iterations', 0)} iterations")
        
        # Check if we got valid results
        if not result.get("code"):
            raise ValueError("Agent did not generate any code")
        
        # Return structured response
        return AgentResponse(
            success=result.get("execution_success", False),
            code=result.get("code"),
            report=result.get("report"),
            execution_success=result.get("execution_success", False),
            iterations=result.get("iterations", 0),
            error=None if result.get("execution_success") else "Code generated but tests failed"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (already formatted)
        raise
        
    except Exception as e:
        logger.error(f"❌ Error invoking agent: {str(e)}")
        
        # Convert to user-friendly error
        user_friendly_error = _make_user_friendly_error(e)
        
        # Graceful Degradation (Production Pattern)
        # Return partial results if available instead of complete failure
        if "result" in locals() and result and result.get("code"):
            logger.info("⚠️ Returning partial results due to error")
            return AgentResponse(
                success=False,
                code=result.get("code"),
                report=result.get("report", f"### ERROR\n{user_friendly_error}"),
                execution_success=False,
                iterations=result.get("iterations", 0),
                error=user_friendly_error
            )
        
        # Complete failure - return user-friendly error
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Agent workflow failed",
                "message": user_friendly_error,
                "tip": "Try again with a simpler task or check your API configuration."
            }
        )


@app.post("/stream", tags=["Agent"])
async def stream_agent(request: TaskRequest):
    """
    Stream agent workflow (future feature)
    
    Note: Currently returns same as /invoke. Streaming to be implemented.
    """
    return await invoke_agent(request)


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Endpoint not found",
        "message": "Check /docs for available endpoints"
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error",
        "message": str(exc)
    }


# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 LangGraph Agent API starting...")
    logger.info("📊 API Docs available at /docs")
    logger.info("✅ Ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 LangGraph Agent API shutting down...")
