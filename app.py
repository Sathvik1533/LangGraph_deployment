"""
FastAPI Application for LangGraph Self-Correcting Agent
========================================================
This module exposes the LangGraph agent workflow via REST API.

Architecture:
- Uses agent.py (self-correcting workflow with Groq)
- Provides standard REST endpoints
- Returns detailed execution results including iterations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging

from agent import agent, CrewState
from langchain_core.messages import HumanMessage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.get("/", tags=["Health"])
def health_check():
    """
    Health check endpoint
    
    Returns:
        dict: Status and API information
    """
    return {
        "status": "ok",
        "service": "LangGraph Self-Correcting Agent",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "invoke": "/invoke",
            "health": "/",
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
async def invoke_agent(request: TaskRequest):
    """
    Invoke the self-correcting agent workflow
    
    Args:
        request: TaskRequest with code generation task
        
    Returns:
        AgentResponse: Complete workflow results including code, report, and iterations
        
    Example:
        ```json
        {
            "task": "Write a function to check if a number is prime"
        }
        ```
    """
    try:
        logger.info(f"Received task: {request.task}")
        
        # Prepare initial state
        initial_state: CrewState = {
            "messages": [HumanMessage(content=request.task)],
            "code": None,
            "report": None,
            "execution_success": False,
            "iterations": 0
        }
        
        # Invoke the agent workflow
        result = agent.invoke(initial_state)
        
        logger.info(f"Agent completed in {result.get('iterations', 0)} iterations")
        
        # Return structured response
        return AgentResponse(
            success=True,
            code=result.get("code"),
            report=result.get("report"),
            execution_success=result.get("execution_success", False),
            iterations=result.get("iterations", 0),
            error=None
        )
        
    except Exception as e:
        logger.error(f"Error invoking agent: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Agent workflow failed: {str(e)}"
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
