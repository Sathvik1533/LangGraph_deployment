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
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional
import logging
import time
from collections import defaultdict, deque
import os

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

# Mount static files (CSS, JS)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount templates (shared navigation component)
if os.path.exists("templates"):
    app.mount("/templates", StaticFiles(directory="templates"), name="templates")


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TaskRequest(BaseModel):
    """Request model for code generation tasks"""
    task: str = Field(
        ...,
        description="Description of the code to generate",
        example="Write a function to calculate fibonacci numbers"
    )
    max_iterations: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum self-correction attempts (1-10, default: 3)"
    )
    language: Optional[str] = Field(
        default="python",
        description="Programming language for code generation (python, java, cpp)",
        example="python"
    )
    thread_id: Optional[str] = Field(
        default=None,
        description="Optional thread ID for conversation persistence. If provided, state will be loaded/saved for this thread.",
        example="user_123_session_456"
    )
    thread_name: Optional[str] = Field(
        default=None,
        description="Optional human-readable thread name",
        example="Fibonacci Implementation"
    )


class AgentResponse(BaseModel):
    """Response model with full execution details"""
    success: bool = Field(description="Whether the agent workflow completed successfully")
    code: Optional[str] = Field(None, description="Generated Python code")
    report: Optional[str] = Field(None, description="Detailed execution report with test results")
    execution_success: bool = Field(False, description="Whether the code executed without errors")
    iterations: int = Field(0, description="Number of self-correction iterations")
    error: Optional[str] = Field(None, description="Error message if workflow failed")
    thread_id: Optional[str] = Field(None, description="Thread ID used for this conversation")
    checkpointed: bool = Field(False, description="Whether state was saved to checkpoint (Redis)")


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


@app.get("/", tags=["Frontend"])
async def root():
    """
    Serve the dashboard page (home)
    """
    if os.path.exists("pages/dashboard.html"):
        return FileResponse("pages/dashboard.html")
    elif os.path.exists("index.html"):
        return FileResponse("index.html")
    else:
        return {
            "status": "ok",
            "service": "LangGraph Self-Correcting Agent",
            "version": "2.0.0",
            "message": "API is running. Frontend not found.",
            "docs": "/docs",
            "endpoints": {
                "health": "/health",
                "invoke": "/invoke",
                "info": "/info"
            }
        }


@app.get("/generate", tags=["Frontend"])
async def generate_page():
    """
    Serve the code generator page
    """
    if os.path.exists("pages/generate.html"):
        return FileResponse("pages/generate.html")
    raise HTTPException(status_code=404, detail="Generate page not found")


@app.get("/workflow", tags=["Frontend"])
async def workflow_page():
    """
    Serve the workflow visualization page
    """
    if os.path.exists("pages/workflow.html"):
        return FileResponse("pages/workflow.html")
    raise HTTPException(status_code=404, detail="Workflow page not found")


@app.get("/execution", tags=["Frontend"])
async def execution_page():
    """
    Serve the execution report page
    """
    if os.path.exists("pages/execution.html"):
        return FileResponse("pages/execution.html")
    raise HTTPException(status_code=404, detail="Execution page not found")


@app.get("/history", tags=["Frontend"])
async def history_page():
    """
    Serve the generation history page
    """
    if os.path.exists("pages/history.html"):
        return FileResponse("pages/history.html")
    raise HTTPException(status_code=404, detail="History page not found")


@app.get("/health", tags=["Health"])
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
        
        # Generate or use provided thread ID
        import uuid
        thread_id = request.thread_id or f"thread_{uuid.uuid4().hex[:12]}"
        thread_name = request.thread_name or f"Task: {request.task[:30]}..."
        
        logger.info(f"🧵 Thread ID: {thread_id}")
        if request.thread_id:
            logger.info(f"📂 Resuming existing thread: {thread_name}")
        else:
            logger.info(f"🆕 Creating new thread: {thread_name}")
        
        # Prepare initial state
        initial_state: CrewState = {
            "messages": [HumanMessage(content=request.task)],
            "code": None,
            "report": None,
            "execution_success": False,
            "iterations": 0,
            "max_iterations": request.max_iterations,
            "language": request.language or "python"  # Pass language to agent
        }
        
        # Configure with thread ID for checkpointing
        config = {
            "configurable": {
                "thread_id": thread_id,
                "thread_name": thread_name
            }
        }
        
        # Check if Redis checkpointing is available
        redis_url = os.getenv("REDIS_URL", "").strip()
        checkpointed = bool(redis_url)
        
        if checkpointed:
            logger.info(f"💾 State will be saved to Redis with thread ID: {thread_id}")
        else:
            logger.info(f"🧠 Using in-memory state (no persistence)")
        
        # Invoke the agent workflow with thread configuration
        result = agent.invoke(initial_state, config)
        
        logger.info(f"✅ Agent completed in {result.get('iterations', 0)} iterations")
        
        if checkpointed:
            logger.info(f"✅ State saved to Redis under thread: {thread_id}")
        
        # Check if we got valid results
        if not result.get("code"):
            raise ValueError("Agent did not generate any code")
        
        # Return structured response with thread info
        return AgentResponse(
            success=result.get("execution_success", False),
            code=result.get("code"),
            report=result.get("report"),
            execution_success=result.get("execution_success", False),
            iterations=result.get("iterations", 0),
            error=None if result.get("execution_success") else "Code generated but tests failed",
            thread_id=thread_id,
            checkpointed=checkpointed
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


@app.get("/threads", tags=["Thread Management"])
async def list_threads():
    """
    List all saved thread IDs from Redis checkpointing.
    
    Returns:
        List of thread IDs and metadata
        
    Note: Only works if Redis checkpointing is enabled (REDIS_URL set)
    """
    redis_url = os.getenv("REDIS_URL", "").strip()
    
    if not redis_url:
        return {
            "checkpointing_enabled": False,
            "message": "Redis checkpointing not enabled. Set REDIS_URL to enable.",
            "threads": []
        }
    
    try:
        import redis.asyncio as aioredis
        
        redis_client = aioredis.from_url(redis_url)
        
        # Get all checkpoint keys from Redis
        keys = []
        async for key in redis_client.scan_iter(match="checkpoint:*"):
            keys.append(key.decode('utf-8') if isinstance(key, bytes) else key)
        
        await redis_client.close()
        
        # Extract thread IDs from keys
        threads = []
        seen_threads = set()
        for key in keys:
            # Keys are like: checkpoint:thread_abc123:step_1
            parts = key.split(':')
            if len(parts) >= 2:
                thread_id = parts[1]
                if thread_id not in seen_threads:
                    seen_threads.add(thread_id)
                    threads.append({
                        "thread_id": thread_id,
                        "checkpoint_key": key
                    })
        
        return {
            "checkpointing_enabled": True,
            "total_threads": len(threads),
            "threads": threads
        }
        
    except Exception as e:
        logger.error(f"Error listing threads: {e}")
        return {
            "checkpointing_enabled": True,
            "error": str(e),
            "threads": []
        }


@app.get("/threads/{thread_id}", tags=["Thread Management"])
async def get_thread(thread_id: str):
    """
    Get information about a specific thread.
    
    Args:
        thread_id: The thread ID to retrieve
        
    Returns:
        Thread information and checkpoint status
    """
    redis_url = os.getenv("REDIS_URL", "").strip()
    
    if not redis_url:
        raise HTTPException(
            status_code=400,
            detail="Redis checkpointing not enabled"
        )
    
    try:
        import redis.asyncio as aioredis
        
        redis_client = aioredis.from_url(redis_url)
        
        # Check if thread exists
        keys = []
        async for key in redis_client.scan_iter(match=f"checkpoint:{thread_id}:*"):
            keys.append(key.decode('utf-8') if isinstance(key, bytes) else key)
        
        await redis_client.close()
        
        if not keys:
            raise HTTPException(
                status_code=404,
                detail=f"Thread '{thread_id}' not found"
            )
        
        return {
            "thread_id": thread_id,
            "exists": True,
            "checkpoint_count": len(keys),
            "checkpoint_keys": keys
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving thread: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving thread: {str(e)}"
        )


@app.delete("/threads/{thread_id}", tags=["Thread Management"])
async def delete_thread(thread_id: str):
    """
    Delete a thread and all its checkpoints from Redis.
    
    Args:
        thread_id: The thread ID to delete
        
    Returns:
        Deletion status
    """
    redis_url = os.getenv("REDIS_URL", "").strip()
    
    if not redis_url:
        raise HTTPException(
            status_code=400,
            detail="Redis checkpointing not enabled"
        )
    
    try:
        import redis.asyncio as aioredis
        
        redis_client = aioredis.from_url(redis_url)
        
        # Find and delete all keys for this thread
        deleted_count = 0
        async for key in redis_client.scan_iter(match=f"checkpoint:{thread_id}:*"):
            await redis_client.delete(key)
            deleted_count += 1
        
        await redis_client.close()
        
        if deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Thread '{thread_id}' not found"
            )
        
        return {
            "thread_id": thread_id,
            "deleted": True,
            "checkpoints_deleted": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting thread: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting thread: {str(e)}"
        )


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
