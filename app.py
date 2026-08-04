import os
import sys
import io
import traceback
from typing import Optional, List, Dict, Any

from fastapi import FastAPI
from langserve import add_routes

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing_extensions import TypedDict
from pydantic import BaseModel

API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    raise RuntimeError("GOOGLE_API_KEY env var not set. Set it in Render dashboard.")

MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
llm = ChatGoogleGenerativeAI(model=MODEL_NAME, google_api_key=API_KEY)

class CrewState(TypedDict):
    messages: List[HumanMessage]
    code: Optional[str]
    report: Optional[str]

@tool
def run_python_code(code: str) -> str:
    """Execute python code and return stdout or error trace."""
    if not isinstance(code, str):
        code = str(code)
    clean_code = code.replace("```python", "").replace("```", "").strip()
    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout
    try:
        local_scope: Dict[str, Any] = {}
        exec(clean_code, {}, local_scope)
        result = new_stdout.getvalue()
    except Exception:
        result = f"Execution Error:\n{traceback.format_exc()}"
    finally:
        sys.stdout = old_stdout
    return result.strip() if result.strip() else "Success (no terminal output)"

@tool
def generate_test_cases(task_description: str) -> str:
    """Generate specific test scenarios for a given coding task."""
    prompt = (
        f"You are a Senior QA Engineer. Generate 3 to 5 highly specific test scenarios "
        f"for the following coding task: '{task_description}'.\n"
        f"Include standard cases and edge cases. Return them as a numbered list."
    )
    response = llm.invoke(prompt)
    return response.content if hasattr(response, "content") else str(response)

def _extract_text(content: Any) -> str:
    if isinstance(content, list):
        first = content[0]
        return first.get("text", "") if isinstance(first, dict) else str(first)
    return str(content)

def developer_node(state: CrewState):
    task = state["messages"][-1].content
    prompt = f"Write a clean Python script to solve this: {task}. Only return the code, no explanation or markdown formatting."
    response = llm.invoke(prompt)
    return {"code": _extract_text(response.content)}

def tester_node(state: CrewState):
    task = state["messages"][-1].content
    cases_str = _extract_text(generate_test_cases.invoke(task))
    execution_result = run_python_code.invoke({"code": state["code"]})
    report = (
        f"### EXECUTION OUTPUT:\n{execution_result}\n\n"
        f"### TEST SCENARIOS EVALUATED (LLM-generated, not verified against execution):\n{cases_str}"
    )
    return {"report": report}

workflow = StateGraph(CrewState)
workflow.add_node("developer", developer_node)
workflow.add_node("tester", tester_node)
workflow.add_edge(START, "developer")
workflow.add_edge("developer", "tester")
workflow.add_edge("tester", END)
graph_app = workflow.compile()

# --- LangServe needs plain-JSON-friendly input/output, not raw HumanMessage objects ---
class AgentInput(BaseModel):
    task: str

class AgentOutput(BaseModel):
    code: Optional[str] = None
    report: Optional[str] = None

def _to_graph_input(inp: AgentInput) -> dict:
    return {"messages": [HumanMessage(content=inp.task)], "code": None, "report": None}

def _from_graph_output(result: dict) -> AgentOutput:
    return AgentOutput(code=result.get("code"), report=result.get("report"))

agent_runnable = (_to_graph_input | graph_app | _from_graph_output)

app = FastAPI(title="Real-Time Dev/Test Agent")

add_routes(
    app,
    agent_runnable.with_types(input_type=AgentInput, output_type=AgentOutput),
    path="/agent",
)

@app.get("/")
def health():
    return {"status": "ok"}
