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

import warnings
warnings.filterwarnings("ignore")
warnings.simplefilter("ignore")

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import json
import asyncio
import logging
import time
import uuid
from collections import defaultdict, deque
import os

from agent import agent, CrewState, _circuit_breaker_open, _circuit_breaker_failures, generate_artifact_filename
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from guardrails import InputGuard, OutputGuard, guardrail_stats

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# LIFESPAN CONTEXT (Modern FastAPI Lifespan Handler)
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 LangGraph Agent API starting...")
    logger.info("📊 API Docs available at /docs")
    logger.info("🛡️ LLM Guardrails Engine: ACTIVE")
    logger.info("   Input Guards: PromptInjection, TopicBoundary, ContentSafety")
    logger.info("   Output Guards: DangerousCode, PIILeak, CodeRelevance, LanguageCorrectness")
    logger.info("🔒 Security Headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection")
    logger.info("🔗 Request ID Tracing: X-Request-ID (UUID)")
    logger.info("✅ Ready to accept requests")
    yield
    logger.info("👋 LangGraph Agent API shutting down...")


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

# Initialize FastAPI app with modern lifespan
app = FastAPI(
    title="LangGraph Self-Correcting Agent API",
    description="Multi-agent system that generates, tests, and self-corrects Python code",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for frontend access (configurable via ALLOWED_ORIGINS env var)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# SECURITY HEADERS MIDDLEWARE (Production Pattern — OWASP Secure Headers)
# ============================================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds production security headers to every response.
    Inspired by OWASP Secure Headers Project."""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)


# ============================================================================
# REQUEST ID TRACING MIDDLEWARE (Production Pattern — Distributed Tracing)
# ============================================================================

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Generates unique X-Request-ID for every request for distributed tracing."""
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

# Mount static files (CSS, JS)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount templates (shared navigation component)
if os.path.exists("templates"):
    app.mount("/templates", StaticFiles(directory="templates"), name="templates")


# ============================================================================
# DISK-BACKED AUDIT LOG HISTORY PERSISTENCE
# ============================================================================

HISTORY_FILE = os.path.join("data", "runs_history.json")

def load_runs_history() -> list:
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_run_to_disk(run_data: dict):
    try:
        os.makedirs("data", exist_ok=True)
        history = load_runs_history()
        run_id = run_data.get("id") or run_data.get("thread_id") or f"run_{int(time.time()*1000)}"
        run_data["id"] = run_id
        if not run_data.get("timestamp"):
            run_data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        history = [r for r in history if r.get("id") != run_id]
        history.insert(0, run_data)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history[:100], f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to save run history to disk: {e}")

class RunRecordModel(BaseModel):
    id: str
    timestamp: Optional[str] = None
    task: str
    language: Optional[str] = "python"
    mode: Optional[str] = "live"
    success: bool
    iterations: int = 1
    code: Optional[str] = ""
    report: Optional[str] = ""
    thread_id: Optional[str] = ""

@app.get("/api/history", tags=["History"])
def get_history_records():
    """Retrieve all persistent audit log history records."""
    return {"runs": load_runs_history()}

@app.post("/api/history", tags=["History"])
def add_history_record(record: RunRecordModel):
    """Add or update a run record in persistent disk storage."""
    run_dict = record.dict()
    save_run_to_disk(run_dict)
    return {"status": "saved", "run": run_dict}

@app.delete("/api/history", tags=["History"])
def clear_history_records():
    """Clear persistent audit log history."""
    try:
        if os.path.exists(HISTORY_FILE):
            os.remove(HISTORY_FILE)
    except Exception as e:
        logger.warning(f"Failed to clear history file: {e}")
    return {"status": "cleared"}


from agent import (
    agent,
    CrewState,
    get_llm_instance,
    get_llm_mode_label,
    _circuit_breaker_open,
    _circuit_breaker_failures,
    CIRCUIT_BREAKER_THRESHOLD,
    validate_code_output,
    generate_artifact_filename,
    extract_task_intent
)

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TaskRequest(BaseModel):
    """Request model for code generation tasks with task intent & language decoupling"""
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
    target_language: Optional[str] = Field(
        default=None,
        description="Authoritative target programming language overriding raw task text"
    )
    task_intent: Optional[str] = Field(
        default=None,
        description="Normalized task intent decoupled from language phrasing"
    )
    hitl_mode: Optional[bool] = Field(
        default=False,
        description="Enable Human-in-the-Loop review gate before running tests"
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


class HITLActionRequest(BaseModel):
    """Request model for Human-in-the-Loop review gate actions"""
    thread_id: str = Field(..., description="Unique thread ID for the paused HITL session")
    action: str = Field("approve", description="Action to take: 'approve', 'edit', 'reject', 'abort'")
    edited_code: Optional[str] = Field(None, description="Modified code by human if action is 'edit'")
    feedback: Optional[str] = Field(None, description="Review feedback if action is 'reject'")
    language: Optional[str] = Field("python", description="Target programming language")
    target_language: Optional[str] = Field(None, description="Authoritative target programming language")
    task_intent: Optional[str] = Field(None, description="Normalized task intent")


class AgentResponse(BaseModel):
    """Response model with full execution details and task intent telemetry"""
    success: bool = Field(description="Whether the agent workflow completed successfully")
    code: Optional[str] = Field(None, description="Generated clean source code")
    filename: Optional[str] = Field(None, description="Dynamic clean source code artifact filename")
    report: Optional[str] = Field(None, description="Detailed execution report with test results")
    execution_success: bool = Field(False, description="Whether the code executed without errors")
    iterations: int = Field(0, description="Number of self-correction iterations")
    error: Optional[str] = Field(None, description="Error message if workflow failed")
    thread_id: Optional[str] = Field(None, description="Thread ID used for this conversation")
    checkpointed: bool = Field(False, description="Whether state was saved to checkpoint (Redis)")
    hitl_status: Optional[str] = Field(None, description="Human-in-the-Loop gate status")
    task_intent: Optional[str] = Field(None, description="Normalized task intent")
    target_language: Optional[str] = Field(None, description="Authoritative target language")
    llm_mode: Optional[str] = Field(None, description="LLM mode: 'groq/llama-3.3-70b-versatile' or 'template-fallback'")


class WorkflowControlRequest(BaseModel):
    """Request model for real-time workflow visualizer control actions"""
    action: str = Field(..., description="Action: 'play', 'pause', 'resume', 'stop', 'reset', 'next', 'speed'")
    thread_id: Optional[str] = Field(None, description="Unique run/thread ID")
    run_id: Optional[str] = Field(None, description="Alias for thread_id")
    scenario: Optional[str] = Field(None, description="Scenario name ('self_fix', 'clean_pass', 'guardrail_block', 'max_retry', 'hitl_gate')")
    speed: Optional[float] = Field(1.0, description="Simulation speed multiplier (0.5, 1.0, 2.0)")
    task: Optional[str] = Field(None, description="User task specification")
    target_language: Optional[str] = Field(None, description="Authoritative target language")

class WorkflowRunState:
    """State Machine Execution Run State tracking backend state machine status"""
    def __init__(self, run_id: str, mode: str = "live", scenario: str = "self_fix", speed: float = 1.0, task: str = "", language: str = "python"):
        self.run_id = run_id
        self.mode = mode
        self.scenario = scenario
        self.speed = max(0.1, min(5.0, float(speed or 1.0)))
        self.task = task
        self.language = language
        self.status = "IDLE"  # IDLE, RUNNING, PAUSED, STOPPED, COMPLETED, FAILED
        self.current_node = "START"
        self.step_mode = False
        self.pause_event = asyncio.Event()
        self.pause_event.set()  # set = running (not paused)
        self.stop_requested = False
        self.history_events: List[Dict[str, Any]] = []

class WorkflowController:
    """Thread-safe controller for real-time workflow state machine execution"""
    def __init__(self):
        self.runs: Dict[str, WorkflowRunState] = {}

    def get_or_create_run(self, run_id: str, mode: str = "live", scenario: str = "self_fix", speed: float = 1.0, task: str = "", language: str = "python") -> WorkflowRunState:
        if run_id not in self.runs:
            self.runs[run_id] = WorkflowRunState(run_id, mode, scenario, speed, task, language)
        else:
            run = self.runs[run_id]
            if mode: run.mode = mode
            if scenario: run.scenario = scenario
            if speed and speed > 0: run.speed = speed
            if task: run.task = task
            if language: run.language = language
        return self.runs[run_id]

    def reset_run(self, run_id: str):
        if run_id in self.runs:
            run = self.runs[run_id]
            run.status = "IDLE"
            run.current_node = "START"
            run.step_mode = False
            run.stop_requested = False
            run.pause_event.set()
            run.history_events.clear()

workflow_controller = WorkflowController()


# In-memory storage for active Human-in-the-Loop review sessions
hitl_sessions: Dict[str, Dict[str, Any]] = {}
hitl_stats: Dict[str, int] = {
    "total_interventions": 0,
    "approved": 0,
    "edited": 0,
    "rejected": 0,
    "aborted": 0
}


@app.post("/api/workflow/control", tags=["Agent"])
async def control_workflow(req: WorkflowControlRequest):
    """
    Control real-time workflow state machine execution.
    Supported actions: 'play', 'pause', 'resume', 'stop', 'reset', 'next', 'speed'
    """
    tid = req.thread_id or req.run_id or "default_run"
    run = workflow_controller.get_or_create_run(
        tid, 
        scenario=req.scenario or "self_fix", 
        speed=req.speed or 1.0, 
        task=req.task or "", 
        language=req.target_language or "python"
    )
    
    act = req.action.lower()
    if act in ["play", "start"]:
        run.status = "RUNNING"
        run.stop_requested = False
        run.step_mode = False
        run.pause_event.set()
    elif act == "pause":
        run.status = "PAUSED"
        run.pause_event.clear()
    elif act == "resume":
        run.status = "RUNNING"
        run.step_mode = False
        run.pause_event.set()
    elif act == "stop":
        run.status = "STOPPED"
        run.stop_requested = True
        run.pause_event.set()
    elif act == "reset":
        workflow_controller.reset_run(tid)
        return {
            "success": True, 
            "action": "reset", 
            "status": "IDLE", 
            "thread_id": tid, 
            "current_node": "START",
            "message": "Workflow state machine reset to IDLE."
        }
    elif act == "next":
        run.status = "RUNNING"
        run.step_mode = True
        run.pause_event.set()
    elif act == "speed":
        run.speed = max(0.1, min(5.0, float(req.speed or 1.0)))

    return {
        "success": True,
        "action": act,
        "status": run.status,
        "thread_id": tid,
        "current_node": run.current_node,
        "speed": run.speed,
        "step_mode": run.step_mode
    }



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
    pages_status = {
        "dashboard": os.path.exists("pages/dashboard.html"),
        "generate": os.path.exists("pages/generate.html"),
        "workflow": os.path.exists("pages/workflow.html"),
        "execution": os.path.exists("pages/execution.html"),
        "history": os.path.exists("pages/history.html")
    }
    
    return {
        "status": "healthy" if not _circuit_breaker_open else "degraded",
        "service": "LangGraph Self-Correcting Agent",
        "version": "3.0.0",
        "pages": pages_status,
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


@app.get("/llm-mode", tags=["Info"])
def llm_mode_endpoint():
    """
    Returns the active LLM mode for the current request.
    Frontend uses this on page load to show the correct badge without
    waiting for a full workflow run to complete.

    Returns:
        dict: { "llm_mode": "groq/llama-3.3-70b-versatile" | "template-fallback",
                "display": "Live LLM: Groq llama-3.3-70b" | "Template Fallback Mode" }
    """
    mode = get_llm_mode_label()
    display = (
        "Live LLM: Groq llama-3.3-70b"
        if mode != "template-fallback"
        else "Template Fallback Mode"
    )
    return {"llm_mode": mode, "display": display}


@app.post("/generate", response_model=AgentResponse, tags=["Agent"])
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
    
    # LLM INPUT GUARDRAILS (Production Pattern — Inspired by LLM Guard & NeMo Guardrails)
    input_report = InputGuard.scan_all(request.task)
    guardrail_stats.record_input_scan(input_report)
    if not input_report.passed:
        logger.warning(f"🛡️ Input guardrail blocked: {input_report.blocked_by}")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Guardrail blocked",
                "message": input_report.reason,
                "blocked_by": input_report.blocked_by,
                "severity": input_report.severity.value,
                "tip": "Please describe a coding task. This platform only generates safe, educational code."
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
                "message": "⚡ The execution engine is experiencing issues. Automatic recovery in progress.",
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
        
        raw_task = request.task
        target_lang = (request.target_language or request.language or "python").lower()
        task_intent = request.task_intent or extract_task_intent(raw_task)
        artifact_filename = generate_artifact_filename(task_intent or raw_task, target_lang)

        logger.info(f"🧵 Thread ID: {thread_id} | Intent: '{task_intent}' | Target Lang: {target_lang.upper()} | Artifact: {artifact_filename}")
        if request.thread_id:
            logger.info(f"📂 Resuming existing thread: {thread_name}")
        else:
            logger.info(f"🆕 Creating new thread: {thread_name}")
        
        # Prepare initial state
        initial_state: CrewState = {
            "messages": [HumanMessage(content=raw_task)],
            "task_specification": raw_task,
            "task_intent": task_intent,
            "language": target_lang,
            "target_language": target_lang,
            "code": None,
            "filename": artifact_filename,
            "report": None,
            "execution_success": False,
            "iterations": 0,
            "max_iterations": request.max_iterations,
            "hitl_enabled": request.hitl_mode
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
        checkpointed = bool(redis_url) or request.hitl_mode

        # ====================================================================
        # HUMAN-IN-THE-LOOP (HITL) GATE INTERCEPTION
        # ====================================================================
        if request.hitl_mode:
            logger.info(f"👤 Human-in-the-Loop Mode enabled for thread: {thread_id}")
            from agent import developer_node
            
            # Step 1: Run Developer Agent to draft initial code
            dev_result = developer_node(initial_state)
            draft_code = dev_result.get("code", "")
            
            # Save session state awaiting human decision
            hitl_sessions[thread_id] = {
                "thread_id": thread_id,
                "task": raw_task,
                "task_intent": task_intent,
                "language": target_lang,
                "target_language": target_lang,
                "code": draft_code,
                "filename": artifact_filename,
                "max_iterations": request.max_iterations,
                "iterations": 1,
                "status": "awaiting_human_review",
                "created_at": time.time()
            }
            hitl_stats["total_interventions"] += 1
            
            logger.info(f"⏸️ Execution paused at Human Review Gate for thread: {thread_id}")
            return AgentResponse(
                success=True,
                code=draft_code,
                filename=artifact_filename,
                report=(
                    "⏸️ [HUMAN-IN-THE-LOOP GATE ACTIVE]\n"
                    "Execution paused after Developer Agent drafted code.\n"
                    "Please review the code: Approve to run Sandbox Tests, Edit code directly, or Reject with guidance."
                ),
                execution_success=False,
                iterations=1,
                error=None,
                thread_id=thread_id,
                checkpointed=True,
                hitl_status="awaiting_human_review",
                task_intent=task_intent,
                target_language=target_lang,
                llm_mode=get_llm_mode_label()
            )

        if checkpointed:
            logger.info(f"💾 State will be saved to Redis with thread ID: {thread_id}")
        else:
            logger.info(f"🧠 Using in-memory state (no persistence)")
        
        # Invoke standard multi-agent self-correcting workflow
        result = agent.invoke(initial_state, config)
        
        logger.info(f"✅ Agent completed in {result.get('iterations', 0)} iterations")
        
        if checkpointed:
            logger.info(f"✅ State saved to Redis under thread: {thread_id}")
        
        # LLM OUTPUT GUARDRAILS (Production Pattern — Inspired by Guardrails AI)
        output_code = result.get("code", "")
        if output_code and not output_code.startswith("// ERROR:") and not output_code.startswith("// GUARDRAIL"):
            output_report = OutputGuard.scan_all(output_code, target_lang)
            guardrail_stats.record_output_scan(output_report)
            if not output_report.passed:
                logger.warning(f"🔒 Output guardrail blocked: {output_report.blocked_by}")
                return AgentResponse(
                    success=False,
                    code=f"// GUARDRAIL BLOCKED: {output_report.reason}",
                    filename=artifact_filename,
                    report=f"### 🛡️ Output Guardrail Alert\n{output_report.reason}\n\nBlocked by: {output_report.blocked_by}\nSeverity: {output_report.severity.value}",
                    execution_success=False,
                    iterations=result.get("iterations", 0),
                    error=output_report.reason,
                    thread_id=thread_id,
                    checkpointed=checkpointed,
                    hitl_status="bypassed",
                    task_intent=task_intent,
                    target_language=target_lang,
                    llm_mode=get_llm_mode_label()
                )
        
        # Check if we got valid results
        if not result.get("code"):
            raise ValueError("Agent did not generate any code")
        
        # Return structured response with thread info
        return AgentResponse(
            success=result.get("execution_success", False),
            code=result.get("code"),
            filename=artifact_filename,
            report=result.get("report"),
            execution_success=result.get("execution_success", False),
            iterations=result.get("iterations", 0),
            error=None if result.get("execution_success") else "Code generated but tests failed",
            thread_id=thread_id,
            checkpointed=checkpointed,
            hitl_status="bypassed",
            task_intent=task_intent,
            target_language=target_lang,
            llm_mode=get_llm_mode_label()
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (already formatted)
        raise
        
    except Exception as e:
        logger.error(f"❌ Error invoking agent: {str(e)}")
        
        # Convert to user-friendly error
        user_friendly_error = _make_user_friendly_error(e)
        fallback_filename = generate_artifact_filename(request.task, request.language or "python")
        
        # Graceful Degradation (Production Pattern)
        if "result" in locals() and result and result.get("code"):
            logger.info("⚠️ Returning partial results due to error")
            return AgentResponse(
                success=False,
                code=result.get("code"),
                filename=fallback_filename,
                report=result.get("report", f"### ERROR\n{user_friendly_error}"),
                execution_success=False,
                iterations=result.get("iterations", 0),
                error=user_friendly_error,
                hitl_status="error",
                task_intent=request.task_intent,
                target_language=request.target_language or request.language
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


# ============================================================================
# HUMAN-IN-THE-LOOP (HITL) INTERACTIVE API ENDPOINTS
# ============================================================================

@app.post("/hitl/action", tags=["Human-in-the-Loop"])
async def handle_hitl_action(req_body: HITLActionRequest):
    """
    Process Human-in-the-Loop action (approve, edit, reject, abort)
    and resume graph execution from checkpoint.
    """
    from agent import tester_node, developer_node
    
    session = hitl_sessions.get(req_body.thread_id)
    target_lang = (req_body.target_language or req_body.language or (session.get("target_language") if session else (session.get("language") if session else "python"))).lower()
    task_desc = session.get("task", "Code Generation") if session else "Code Generation"
    task_intent_val = req_body.task_intent or (session.get("task_intent") if session else extract_task_intent(task_desc))
    artifact_filename = generate_artifact_filename(task_intent_val or task_desc, target_lang)
    
    if not session and req_body.action != "abort":
        session = {
            "thread_id": req_body.thread_id,
            "task": task_desc,
            "task_intent": task_intent_val,
            "language": target_lang,
            "target_language": target_lang,
            "code": req_body.edited_code or "",
            "filename": artifact_filename,
            "iterations": 1,
            "max_iterations": 3
        }

    action = req_body.action.lower()
    
    if action == "abort":
        hitl_stats["aborted"] += 1
        if session:
            session["status"] = "aborted"
        return AgentResponse(
            success=False,
            code=session.get("code") if session else None,
            filename=artifact_filename,
            report="🛑 [WORKFLOW ABORTED]\nHuman reviewer cancelled execution at the review gate.",
            execution_success=False,
            iterations=session.get("iterations", 1) if session else 1,
            error="Aborted by human reviewer",
            thread_id=req_body.thread_id,
            hitl_status="aborted",
            task_intent=task_intent_val,
            target_language=target_lang
        )
        
    elif action == "reject":
        hitl_stats["rejected"] += 1
        feedback_text = req_body.feedback or "Please revise implementation based on requirements."
        
        # Re-invoke developer node with feedback
        state_for_dev: CrewState = {
            "messages": [
                HumanMessage(content=session.get("task", "Code Generation")),
                AIMessage(content=f"Previous Code:\n{session.get('code', '')}"),
                HumanMessage(content=f"Human Reviewer Feedback: {feedback_text}")
            ],
            "task_specification": session.get("task", "Code Generation"),
            "task_intent": task_intent_val,
            "code": session.get("code", ""),
            "report": f"HUMAN REVIEW FEEDBACK:\n{feedback_text}",
            "execution_success": False,
            "iterations": session.get("iterations", 1),
            "max_iterations": session.get("max_iterations", 3),
            "language": target_lang,
            "target_language": target_lang
        }
        
        new_dev_result = developer_node(state_for_dev)
        revised_code = new_dev_result.get("code", "")
        session["code"] = revised_code
        session["iterations"] = session.get("iterations", 1) + 1
        session["status"] = "awaiting_human_review"
        
        return AgentResponse(
            success=True,
            code=revised_code,
            filename=artifact_filename,
            report=f"🔄 [REVISED BY AI BASED ON HUMAN FEEDBACK]\nReviewer Feedback Applied: \"{feedback_text}\"\nPlease review the updated draft.",
            execution_success=False,
            iterations=session["iterations"],
            thread_id=req_body.thread_id,
            hitl_status="awaiting_human_review",
            task_intent=task_intent_val,
            target_language=target_lang
        )
        
    elif action in ["approve", "edit"]:
        if action == "edit":
            hitl_stats["edited"] += 1
            active_code = req_body.edited_code if req_body.edited_code is not None else session.get("code", "")
        else:
            hitl_stats["approved"] += 1
            active_code = session.get("code", "")
            
        session["code"] = active_code
        
        # Step 2: Feed into Sandbox Tester
        state_for_test: CrewState = {
            "messages": [HumanMessage(content=session.get("task", "Code Generation"))],
            "task_specification": session.get("task", "Code Generation"),
            "task_intent": task_intent_val,
            "code": active_code,
            "report": None,
            "execution_success": False,
            "iterations": session.get("iterations", 1),
            "max_iterations": session.get("max_iterations", 3),
            "language": target_lang,
            "target_language": target_lang
        }
        
        test_result = tester_node(state_for_test)
        is_success = test_result.get("execution_success", False)
        
        # If tests failed and iterations remain, do 1 self-correction pass
        final_code = active_code
        if not is_success and state_for_test["iterations"] < state_for_test["max_iterations"]:
            state_for_dev_heal: CrewState = {
                "messages": [HumanMessage(content=session.get("task", "Code Generation"))],
                "task_specification": session.get("task", "Code Generation"),
                "task_intent": task_intent_val,
                "code": active_code,
                "report": test_result.get("report", ""),
                "execution_success": False,
                "iterations": state_for_test["iterations"],
                "max_iterations": state_for_test["max_iterations"],
                "language": target_lang,
                "target_language": target_lang
            }
            heal_dev = developer_node(state_for_dev_heal)
            final_code = heal_dev.get("code", active_code)
            
            # Re-test healed code
            state_for_test["code"] = final_code
            state_for_test["iterations"] += 1
            test_result = tester_node(state_for_test)
            is_success = test_result.get("execution_success", False)
            
        session["status"] = "completed"
        return AgentResponse(
            success=is_success,
            code=final_code,
            filename=artifact_filename,
            report=test_result.get("report", "Verification complete."),
            execution_success=is_success,
            iterations=session.get("iterations", 1),
            error=None if is_success else "Tests failed after review approval",
            thread_id=req_body.thread_id,
            checkpointed=True,
            hitl_status="approved" if action == "approve" else "edited",
            task_intent=task_intent_val,
            target_language=target_lang
        )


@app.get("/hitl/pending", tags=["Human-in-the-Loop"])
def get_pending_hitl_sessions():
    """List all active threads awaiting human review sign-off."""
    pending = [
        {
            "thread_id": s["thread_id"],
            "task": s["task"],
            "language": s["language"],
            "created_at": s["created_at"],
            "iterations": s["iterations"]
        }
        for s in hitl_sessions.values()
        if s.get("status") == "awaiting_human_review"
    ]
    return {"count": len(pending), "sessions": pending}


@app.get("/hitl/stats", tags=["Human-in-the-Loop"])
def get_hitl_stats():
    """Get Human-in-the-Loop governance statistics."""
    return {
        "status": "active",
        "governance_mode": "Human-in-the-Loop (HITL) Gate",
        "stats": hitl_stats,
        "active_pending_count": sum(1 for s in hitl_sessions.values() if s.get("status") == "awaiting_human_review")
    }


@app.post("/stream", tags=["Agent"])
@app.get("/stream", tags=["Agent"])
async def stream_workflow_events(
    request: Optional[TaskRequest] = None,
    task: Optional[str] = Query(None),
    language: Optional[str] = Query("python"),
    target_language: Optional[str] = Query(None),
    task_intent: Optional[str] = Query(None),
    max_iterations: Optional[int] = Query(3),
    hitl_mode: Optional[bool] = Query(False),
    thread_id: Optional[str] = Query(None),
    mode: Optional[str] = Query("live"),
    scenario: Optional[str] = Query(None),
    speed: Optional[float] = Query(1.0)
):
    """
    Stream real-time execution events from the LangGraph multi-agent workflow
    using Server-Sent Events (SSE) with task intent normalization and target language authority.
    Supports interactive simulation state machine with Play, Pause, Resume, Stop, Reset, Next, and Speed controls.
    """
    from agent import validate_task_input, developer_node, tester_node
    
    # Extract request parameters
    task_text = (request.task if request else (task or "")).strip()
    target_lang = (request.target_language if request and request.target_language else (request.language if request and request.language else (target_language if target_language else (language or "python")))).lower()
    task_intent_val = (request.task_intent if request and request.task_intent else (task_intent or extract_task_intent(task_text)))
    artifact_filename = generate_artifact_filename(task_intent_val or task_text, target_lang)

    max_it = request.max_iterations if request and request.max_iterations else (max_iterations or 3)
    hitl = request.hitl_mode if request else (hitl_mode or False)
    tid = request.thread_id if request and request.thread_id else (thread_id or f"thread_{uuid.uuid4().hex[:12]}")
    mode_val = (mode or "live").lower()
    scenario_val = (scenario or "self_fix").lower()
    speed_val = float(speed or 1.0)
    is_simulation = mode_val == "simulation" or "sim_" in tid or scenario_val != "live"


    # Initialize workflow run state in controller
    run_state = workflow_controller.get_or_create_run(
        tid, 
        mode=mode_val, 
        scenario=scenario_val, 
        speed=speed_val, 
        task=task_text, 
        language=target_lang
    )
    run_state.status = "RUNNING"

    lang_labels = {"python": "Python 3.11", "java": "Java 17", "cpp": "C++ 20"}
    target_lang_label = lang_labels.get(target_lang, target_lang.upper())

    async def event_generator():
        timestamp = time.strftime("%H:%M:%S")
        
        async def step_sleep(base_seconds: float = 0.4):
            spd = max(0.1, min(5.0, float(run_state.speed or 1.0)))
            await asyncio.sleep(base_seconds / spd)

        async def check_checkpoint(node_name: str):
            run_state.current_node = node_name
            if run_state.stop_requested:
                run_state.status = "STOPPED"
                raise asyncio.CancelledError("Workflow stopped by user")
            
            if run_state.step_mode:
                run_state.step_mode = False
                run_state.status = "PAUSED"
                run_state.pause_event.clear()

            if not run_state.pause_event.is_set():
                pause_payload = {
                    "run_id": tid,
                    "event": "paused",
                    "node": node_name,
                    "status": "paused",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "thread_id": tid,
                    "message": f"Workflow execution paused at {node_name} node."
                }
                run_state.history_events.append(pause_payload)
                yield f"data: {json.dumps(pause_payload)}\n\n"
                await run_state.pause_event.wait()

            if run_state.stop_requested:
                run_state.status = "STOPPED"
                raise asyncio.CancelledError("Workflow stopped by user")

        def make_event(event_type: str, node: str, status: str, message: str, **kwargs) -> str:
            payload = {
                "run_id": tid,
                "thread_id": tid,
                "event": event_type,
                "node": node,
                "status": status,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "task": task_text,
                "task_intent": task_intent_val,
                "language": target_lang,
                "target_language": target_lang,
                "filename": artifact_filename,
                "message": message
            }
            payload.update(kwargs)
            run_state.history_events.append(payload)
            return f"data: {json.dumps(payload)}\n\n"

        # 1. Validation check
        is_valid, validation_error = validate_task_input(task_text)
        if not is_valid:
            run_state.status = "FAILED"
            yield make_event("error", "START", "failed", validation_error or "Task input validation failed.", error=validation_error, iteration=0)
            return

        # 2. Start Event
        state: CrewState = {
            "messages": [HumanMessage(content=task_text)],
            "task_specification": task_text,
            "task_intent": task_intent_val,
            "language": target_lang,
            "target_language": target_lang,
            "code": None,
            "filename": artifact_filename,
            "report": None,
            "execution_success": False,
            "iterations": 0,
            "max_iterations": max_it,
            "hitl_enabled": hitl
        }

        yield make_event("start", "START", "active", f"Workflow initialized ({mode_val.upper()}). Intent: {task_intent_val} | Target: {target_lang_label}", iteration=0, target_language_label=target_lang_label, state={'task': task_text, 'task_intent': task_intent_val, 'language': target_lang, 'target_language': target_lang, 'filename': artifact_filename, 'max_iterations': max_it, 'mode': mode_val})
        await step_sleep(0.3)

        # 3. Input Guardrails
        async for item in check_checkpoint("guardrail"): yield item
        yield make_event("node_start", "guardrail", "running", "Input Guardrails: Scanning for Prompt Injection, Sensitive Data, and Code Safety...", iteration=0, controls_status="SCANNING")
        await step_sleep(0.3)

        # Execute Guardrails Scan
        input_report = InputGuard.scan_all(task_text)
        guardrail_stats.record_input_scan(input_report)

        prompt_res = next((r for r in input_report.results if "Prompt Injection" in r.scanner), None)
        sensitive_res = next((r for r in input_report.results if "Sensitive" in r.scanner or "PII" in r.scanner or "Pattern" in r.scanner), None)

        controls = {
            "prompt_injection": {
                "name": "LLM01: Prompt Injection Defense",
                "status": "BLOCKED" if (prompt_res and not prompt_res.passed) else "CLEAN",
                "reason": (prompt_res.reason if prompt_res and not prompt_res.passed else "Zero prompt injection or jailbreak patterns detected."),
                "detector": "InputGuard Regex & AST Scanner",
                "action": ("Halted at Security Shield before model invocation" if prompt_res and not prompt_res.passed else "Payload approved for Developer Agent")
            },
            "sensitive_data": {
                "name": "LLM02: Sensitive Data Leak Prevention",
                "status": "BLOCKED" if (sensitive_res and not sensitive_res.passed) else "CLEAN",
                "reason": (sensitive_res.reason if sensitive_res and not sensitive_res.passed else "No credentials, private keys, or PII detected."),
                "detector": "PII & Secret Pattern Redactor",
                "action": ("Halted before model invocation" if sensitive_res and not sensitive_res.passed else "Payload approved for Developer Agent")
            },
            "excessive_agency": {
                "name": "LLM06: Excessive Agency & OS Shield",
                "status": "CLEAN",
                "reason": "Agent constrained within isolated multi-language compiler sandbox.",
                "detector": "Multi-Language Sandbox Envelope",
                "action": "Restricted execution sandbox active"
            },
            "unbounded_consumption": {
                "name": "LLM10: Unbounded Consumption & Rate Boundary",
                "status": "CLEAN",
                "reason": f"Iteration ceiling enforced at {max_it} self-healing loops.",
                "detector": "Rate Limiter & Loop Ceiling Guard",
                "action": "Iteration bounds active"
            }
        }

        # Guardrail block condition (or guardrail_block scenario)
        if not input_report.passed or scenario_val == "guardrail_block":
            reason = input_report.reason if not input_report.passed else "Guardrail Intercept: Prompt Injection pattern detected (LLM01)."
            blocked_by = input_report.blocked_by if not input_report.passed else "prompt_injection"
            if scenario_val == "guardrail_block":
                controls["prompt_injection"]["status"] = "BLOCKED"
                controls["prompt_injection"]["reason"] = reason

            blocked_msg = f"Guardrail Intercept: {reason} (Blocked by {blocked_by})"
            state["code"] = f"// GUARDRAIL BLOCKED: {reason}"
            state["report"] = f"### 🛡️ Input Guardrail Alert\n{reason}\n\nBlocked by: {blocked_by}"
            run_state.status = "FAILED"

            yield make_event("guardrail_block", "guardrail", "failed", blocked_msg, iteration=0, error=reason, security_controls=controls, state={'code': state['code'], 'report': state['report'], 'execution_success': False})
            await step_sleep(0.3)
            yield make_event("workflow_complete", "END", "failed", "Workflow terminated safely by security shield.", iteration=0, code=state['code'], report=state['report'], execution_success=False)
            
            save_run_to_disk({
                "id": tid, "thread_id": tid, "task": task_text, "task_intent": task_intent_val,
                "language": target_lang, "target_language": target_lang, "filename": artifact_filename,
                "mode": mode_val, "success": False, "iterations": 0, "code": state["code"],
                "report": state["report"], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            })
            return

        yield make_event("node_complete", "guardrail", "success", "Input Guardrails passed all security checks cleanly.", iteration=0, security_controls=controls)
        await step_sleep(0.3)

        # 4. Developer Node (Iteration 1)
        async for item in check_checkpoint("developer"): yield item
        yield make_event("node_start", "developer", "running", f"Developer Agent synthesizing {target_lang_label} artifact for intent: {task_intent_val}...", iteration=1)
        await step_sleep(0.3)

        loop = asyncio.get_event_loop()
        dev_res = await loop.run_in_executor(None, developer_node, state)
        draft_code = dev_res.get("code", "")
        state["code"] = draft_code
        state["iterations"] = 1

        yield make_event("node_complete", "developer", "success", f"Developer Agent synthesized {artifact_filename} ({target_lang_label}).", iteration=1, code=draft_code, state={'code': draft_code, 'filename': artifact_filename, 'iterations': 1, 'language': target_lang, 'task_intent': task_intent_val})
        await step_sleep(0.3)

        # 5. Human-in-the-Loop Review Gate
        async for item in check_checkpoint("human_review"): yield item
        if hitl or scenario_val == "hitl_gate":
            hitl_sessions[tid] = {
                "thread_id": tid, "task": task_text, "task_intent": task_intent_val,
                "language": target_lang, "target_language": target_lang, "code": draft_code,
                "filename": artifact_filename, "max_iterations": max_it, "iterations": 1,
                "status": "awaiting_human_review", "created_at": time.time()
            }
            hitl_stats["total_interventions"] += 1
            run_state.status = "PAUSED"
            yield make_event("human_review_required", "human_review", "waiting_for_human", "Paused at Human Review Gate. Awaiting human sign-off.", iteration=1, code=draft_code, state={'code': draft_code, 'filename': artifact_filename, 'status': 'awaiting_human_review', 'thread_id': tid, 'task_intent': task_intent_val, 'target_language': target_lang})
            return

        yield make_event("node_complete", "human_review", "bypassed", "Human Review Gate bypassed (Automated Mode).", iteration=1)
        await step_sleep(0.3)

        # 6. Tester & Self-Healing Feedback Loop
        current_it = 1
        while current_it <= max_it:
            async for item in check_checkpoint("tester"): yield item
            yield make_event("node_start", "tester", "running", f"Sandbox Tester evaluating {target_lang_label} assertions in isolated sandbox (Attempt {current_it}/{max_it})...", iteration=current_it)
            await step_sleep(0.3)

            # Check if simulation failure injection is needed for attempt 1
            force_fail_attempt1 = (is_simulation or scenario_val in ["self_fix", "max_retry"]) and current_it == 1
            if force_fail_attempt1:
                test_res = {
                    "execution_success": False,
                    "report": (
                        f"[SANDBOX ASSERTION FAILURE]\n"
                        f"AssertionError: Test scenario 2 failed for {target_lang.upper()} artifact.\n"
                        f"Expected element traversal matching target spec, but encountered boundary disconnect.\n\n"
                        f"[TRACEBACK LOG]\n"
                        f"File '{artifact_filename}', line 42:\n"
                        f"    assert result == expected; // Missing boundary check on empty collection\n"
                        f"[STATUS] Rejection by Tester Agent. Self-healing loop triggered."
                    )
                }
            elif scenario_val == "max_retry" and current_it < max_it:
                test_res = {
                    "execution_success": False,
                    "report": f"[SANDBOX ASSERTION FAILURE]\nAssertionError: Attempt {current_it} failed in isolated sandbox."
                }
            else:
                test_res = await loop.run_in_executor(None, tester_node, state)

            state["report"] = test_res.get("report", "")
            state["execution_success"] = test_res.get("execution_success", False)
            state["iterations"] = current_it

            if state["execution_success"]:
                yield make_event("test_passed", "tester", "success", f"All sandbox assertions verified cleanly for {target_lang_label} in Attempt {current_it}!", iteration=current_it, code=state["code"], report=state["report"], state={'code': state['code'], 'filename': artifact_filename, 'report': state['report'], 'execution_success': True, 'iterations': current_it, 'target_language': target_lang})
                await step_sleep(0.3)

                async for item in check_checkpoint("router"): yield item
                yield make_event("router_decision", "router", "success", "Router: execution_success = True ➔ Routing to END", decision="END", iteration=current_it)
                await step_sleep(0.3)

                async for item in check_checkpoint("END"): yield item
                run_state.status = "COMPLETED"
                yield make_event("workflow_complete", "END", "completed", f"Workflow completed successfully in {current_it} loop(s).", iteration=current_it, code=state["code"], report=state["report"], execution_success=True, state={'code': state['code'], 'filename': artifact_filename, 'report': state['report'], 'execution_success': True, 'iterations': current_it, 'language': target_lang, 'target_language': target_lang, 'task_intent': task_intent_val})

                save_run_to_disk({
                    "id": tid, "thread_id": tid, "task": task_text, "task_intent": task_intent_val,
                    "language": target_lang, "target_language": target_lang, "filename": artifact_filename,
                    "mode": mode_val, "success": True, "iterations": current_it, "code": state["code"],
                    "report": state["report"], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                })
                break
            else:
                yield make_event("test_failed", "tester", "failed", f"Sandbox assertions failed in Attempt {current_it}. Error traceback captured.", iteration=current_it, code=state["code"], report=state["report"], state={'code': state['code'], 'filename': artifact_filename, 'report': state['report'], 'execution_success': False, 'iterations': current_it, 'target_language': target_lang})
                await step_sleep(0.3)

                async for item in check_checkpoint("router"): yield item
                if current_it < max_it:
                    yield make_event("retry", "router", "retrying", f"Router: Tests failed ➔ Self-Healing Loop triggered (Retry {current_it + 1}/{max_it})", decision="RETRY", iteration=current_it)
                    await step_sleep(0.3)

                    current_it += 1
                    state["iterations"] = current_it

                    async for item in check_checkpoint("developer"): yield item
                    yield make_event("node_start", "developer", "retrying", f"Developer Agent analyzing failure traceback and synthesizing corrected {target_lang_label} code (Attempt {current_it}/{max_it})...", iteration=current_it)
                    await step_sleep(0.3)

                    heal_res = await loop.run_in_executor(None, developer_node, state)
                    state["code"] = heal_res.get("code", state["code"])

                    yield make_event("node_complete", "developer", "success", f"Developer Agent produced self-healed code draft for Attempt {current_it}.", iteration=current_it, code=state["code"], state={'code': state['code'], 'filename': artifact_filename, 'iterations': current_it, 'language': target_lang, 'task_intent': task_intent_val})
                    await step_sleep(0.3)
                else:
                    yield make_event("max_retries_reached", "router", "failed", f"Router: Max retry ceiling ({max_it}) reached. Halting execution loop.", decision="END", iteration=current_it)
                    await step_sleep(0.3)

                    async for item in check_checkpoint("END"): yield item
                    run_state.status = "FAILED"
                    yield make_event("workflow_complete", "END", "failed", f"Workflow completed with test failures after {current_it} attempts.", iteration=current_it, code=state["code"], report=state["report"], execution_success=False, state={'code': state['code'], 'filename': artifact_filename, 'report': state['report'], 'execution_success': False, 'iterations': current_it, 'language': target_lang, 'target_language': target_lang, 'task_intent': task_intent_val})

                    save_run_to_disk({
                        "id": tid, "thread_id": tid, "task": task_text, "task_intent": task_intent_val,
                        "language": target_lang, "target_language": target_lang, "filename": artifact_filename,
                        "mode": mode_val, "success": False, "iterations": current_it, "code": state["code"],
                        "report": state["report"], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                    })
                    break

    return StreamingResponse(event_generator(), media_type="text/event-stream")




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
# GUARDRAILS API ENDPOINTS
# ============================================================================

class GuardrailScanRequest(BaseModel):
    """Request model for testing live guardrail scanners"""
    text: str = Field(..., description="Prompt or code text to scan", example="Ignore previous instructions")
    scan_type: str = Field(default="input", description="input or output scan", example="input")
    task: Optional[str] = Field(default="", description="Original task description", example="")
    language: Optional[str] = Field(default="python", description="Target programming language", example="python")


@app.get("/guardrails", tags=["Guardrails"])
def get_guardrails_status():
    """
    Get current guardrail configuration, scan statistics, and recent blocks.
    
    Production Pattern: Observability
    Returns real-time guardrail shield status and scanner activity.
    """
    return {
        "engine": "LangGraph Guardrails Engine v1.0",
        "inspired_by": [
            "Guardrails AI (https://github.com/guardrails-ai/guardrails)",
            "LLM Guard (https://github.com/protectai/llm-guard)",
            "NeMo Guardrails (https://github.com/NVIDIA/NeMo-Guardrails)"
        ],
        "stats": guardrail_stats.to_dict()
    }


@app.post("/guardrails/scan", tags=["Guardrails"])
def scan_guardrail(request: GuardrailScanRequest):
    """
    Live interactive stress-test endpoint for guardrails.
    Evaluates text against active scanners in memory safely without executing code.
    """
    if request.scan_type == "input":
        report = InputGuard.scan_all(request.text)
        guardrail_stats.record_input_scan(report)
    else:
        report = OutputGuard.scan_all(request.text, expected_language=request.language or "python")
        guardrail_stats.record_output_scan(report)
        
    return {
        "passed": report.passed,
        "blocked_by": report.blocked_by,
        "reason": report.reason,
        "severity": report.severity.value if hasattr(report.severity, "value") else str(report.severity),
        "scans": [
            {
                "guardrail": r.scanner,
                "passed": r.passed,
                "reason": r.reason,
                "severity": r.severity.value if hasattr(r.severity, "value") else str(r.severity)
            }
            for r in report.results
        ],
        "stats": guardrail_stats.to_dict()
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "Check /docs for available endpoints"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc)
        }
    )
