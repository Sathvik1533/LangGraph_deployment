# AI Workflow Studio — Production Multi-Agent Orchestration Platform

<div align="center">

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-orange.svg)](https://github.com/langchain-ai/langgraph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy on Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg?logo=render&logoColor=white)](https://render.com)
[![OWASP Top 10](https://img.shields.io/badge/Security-OWASP%20LLM%20Top%2010-red.svg)](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

**An enterprise-grade, multi-agent AI system featuring real self-healing test loops, interactive Human-in-the-Loop checkpoints, OWASP LLM Top 10 guardrails, and real-time event streaming.**

[Live Demo](https://langgraph-deployment-qhy0.onrender.com/) • [API Reference](#-api-reference) • [Architecture](#-architecture) • [Quickstart](#-quickstart) • [Security](#-guardrails--security)

</div>

---

## 🌟 Executive Overview

**AI Workflow Studio** is an autonomous code generation, validation, and self-correction platform powered by **LangGraph** and **FastAPI**. Unlike traditional single-pass generative models that produce hallucinated or broken code, AI Workflow Studio orchestrates specialized agent nodes across an isolated execution sandbox to iteratively synthesize, execute, debug, and verify production-ready code.

### 🔑 Key Pillars

- **🔄 Real Self-Correction Loop**: Cyclic state graph evaluates real sandbox runtime test assertions, feeding precise error traces back into the Developer Agent for automated self-healing.
- **👤 Human-in-the-Loop (HITL) Gate**: Configurable pause checkpoint enabling human developers to inspect, modify in-place, request AI revisions, or abort before sandbox execution.
- **🛡️ OWASP LLM Defense Shield**: Comprehensive input/output guardrails trapping prompt injections, system prompt extraction, dangerous OS commands, and PII leaks.
- **⚡ Real-Time SSE Event Stream**: Server-Sent Events (SSE) telemetry pipeline broadcasting live agent lifecycle states, node activations, and state changes to the UI.
- **🌐 Polyglot Execution Sandbox**: First-class generation and sandbox verification across **Python 3.11**, **Java 17**, and **C++ 20**.

---

## 🏗️ Architecture

The engine runs as a compiled **LangGraph StateGraph** with conditional routing, OWASP safety shields, and dynamic checkpointing:

```mermaid
graph TD
    START([🚀 START: User Task & Language]) --> IN_GUARD[🛡️ Input Guardrails: 6 OWASP Scanners]
    IN_GUARD -->|✅ Passed| DEV[🤖 Developer Agent]
    IN_GUARD -->|⛔ Blocked| IN_FAIL([🛡️ Input Guard Intercept])
    
    DEV --> HITL{👤 Human Review Gate?}
    
    HITL -->|Review Mode: Enabled| MODAL[⏸️ Human Inspection & Sign-off]
    MODAL -->|Action: Approve / Edit| TEST[🧪 Sandbox Tester Agent]
    MODAL -->|Action: Request Changes| DEV
    MODAL -->|Action: Abort| ABORT([🛑 Aborted])
    
    HITL -->|Review Mode: Automated| TEST
    
    TEST --> ROUTE{🔀 Router Decision}
    ROUTE -->|✅ All Assertions Pass| OUT_GUARD[🛡️ Output Guardrails: 4 Safety Scanners]
    ROUTE -->|❌ Test Failures & Retries Remain| RETRY_DEV[🔄 Feedback Loop: Defect Trace]
    RETRY_DEV --> DEV
    ROUTE -->|❌ Max Iterations Exceeded| END_FAIL([⚠️ END: Max Attempts Reached])

    OUT_GUARD -->|✅ Passed| END_NODE([🎉 END: Verified Artifact])
    OUT_GUARD -->|⛔ Blocked| OUT_FAIL([🛡️ Output Security Intercept])

    style IN_GUARD fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff
    style DEV fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    style HITL fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff
    style TEST fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    style ROUTE fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fff
    style OUT_GUARD fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff
    style END_NODE fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff
```

### Agent Node Breakdown

| Agent / Component | Primary Responsibility | Isolation & Tooling |
| :--- | :--- | :--- |
| **Input Guardrails** | Pre-execution safety filter with 6 scanners (Prompt Injection LLM01, Sensitive Data LLM02, Excessive Agency LLM06, Unbounded Consumption LLM10, Topic Boundary, Content Safety) | Zero-dependency Pattern Matcher & Regex AST |
| **Developer Agent** | Synthesizes clean, idiomatic source code without markdown conversational filler | Groq LLaMA-3.3-70B / Fallback Engine |
| **Human Review Gate** | Intercepts candidate code for manual review, code editing, or guided AI revisions | LangGraph State Checkpoint |
| **Sandbox Tester** | Compiles and executes test assertions against generated candidate code | Isolated Subprocess with 5s Timeout & Empty Env (`env={}`) |
| **Router Node** | Inspects test verdict, manages iteration counters, and dispatches retry loops | Conditional Edge Resolver |
| **Output Guardrails** | Post-generation safety filter with 4 scanners (Dangerous Code Scan, PII Leak Scan, Code Relevance, Language Correctness) | Safety Lexer, PII Regex & Language Markers |

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+ (Recommended: 3.11)
- Java 17 JRE (optional, for Java verification)
- G++ / GCC 11+ (optional, for C++ verification)

### 1. Clone & Install
```bash
git clone https://github.com/Sathvik1533/LangGraph_deployment.git
cd LangGraph_deployment

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and supply your Groq API key:
# GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Launch Development Server
```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at `http://127.0.0.1:8000` to access the studio.

---

## 🐳 Docker Deployment

### Run via Docker Compose
```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost:8000` with active container healthchecks.

---

## 🧪 Testing & Verification

The repository includes a comprehensive test suite covering agent node execution, guardrails, HITL actions, and API endpoints:

```bash
# Install test requirements
pip install -r requirements-dev.txt

# Run full test suite
pytest tests/ -v

# Run with coverage report
pytest --cov=app --cov=agent --cov=guardrails tests/
```

---

## 📡 API Reference

### Core Endpoints

#### `POST /generate`
Generate code synchronously through the full agent pipeline.
```json
// Request
{
  "task": "Write a Python function to reverse a string and create tests for it.",
  "language": "python",
  "max_iterations": 3,
  "hitl_mode": false
}

// Response (200 OK)
{
  "success": true,
  "code": "def reverse_string(text: str) -> str:\n    return text[::-1]...",
  "filename": "StringReverser.py",
  "report": "All 3 test scenarios evaluated successfully.",
  "execution_success": true,
  "iterations": 1,
  "thread_id": "thread_abc123"
}
```

#### `GET /stream`
Initiate a Server-Sent Events (SSE) stream for real-time live execution telemetry.
```bash
curl -N "http://localhost:8000/stream?task=Implement+binary+search&language=python&mode=live"
```

#### `POST /hitl/action`
Submit a decision at the Human Review Gate.
```json
// Request
{
  "thread_id": "thread_abc123",
  "action": "approve", // "approve" | "edit" | "reject" | "abort"
  "edited_code": null,
  "feedback": "Ensure edge case for empty strings is handled",
  "language": "python"
}
```

#### `GET /guardrails`
Inspect real-time statistics and defense posture of the security shield.

---

## 🛡️ Guardrails & Security

AI Workflow Studio implements **OWASP LLM Top 10** controls across pre-LLM and post-LLM evaluation gates:

```
[User Request] 
      │
      ▼
┌────────────────────────────────────────────────────────┐
│ INPUT GUARDRAILS (InputGuard)                          │
│ 1. Prompt Injection Scanner (LLM01)                    │
│ 2. Sensitive Data & PII Scanner (LLM02)                │
│ 3. Excessive Agency & OS Shield (LLM06)                │
│ 4. Unbounded Consumption & Rate Ceiling (LLM10)        │
│ 5. Topic Boundary Verifier (Coding Domain)             │
│ 6. Content Safety Scanner (Harmful Intent)             │
└──────────────────────────┬─────────────────────────────┘
                           │ Validated
                           ▼
┌────────────────────────────────────────────────────────┐
│ LANGGRAPH MULTI-AGENT WORKFLOW                         │
│ • Developer Agent ➔ Human Review Gate ➔ Sandbox Tester │
└──────────────────────────┬─────────────────────────────┘
                           │ Generated Artifact
                           ▼
┌────────────────────────────────────────────────────────┐
│ OUTPUT GUARDRAILS (OutputGuard)                        │
│ 1. Dangerous Code Scanner (os.system, subprocess, etc.)│
│ 2. PII Leak & Credential Redactor                      │
│ 3. Code Relevance Verifier                             │
│ 4. Language Correctness Validator                      │
└──────────────────────────┬─────────────────────────────┘
                           │ Verified & Safe
                           ▼
[Verified Response & Source Artifact]
```

---

## ⚙️ Verified Production Resilience Patterns

All production resilience patterns described below are backed by verified implementation in source code:

| Production Pattern | Verified Implementation | Source Code Citation |
| :--- | :--- | :--- |
| **Circuit Breaker Shield** | Tracks consecutive provider failures (`CIRCUIT_BREAKER_THRESHOLD = 5`) with auto-cooldown (`CIRCUIT_BREAKER_TIMEOUT = 60s`). Traps downstream API outages before cascading. | [`agent.py:L65-L69`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L65-L69), [`agent.py:L1246-L1253`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1246-L1253), [`app.py:L495-L502`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L495-L502) |
| **Jittered Exponential Backoff** | Backoff decorator with randomized micro-jitter (`min_wait=1s`, `max_wait=10s`) for LLM API retries to prevent thundering herd spikes. | [`agent.py:L1234-L1265`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1234-L1265) |
| **Sliding Window IP Rate Limiter** | In-memory IP rate limiter enforcing 10 requests / minute per client IP, rejecting bursts with HTTP 429 Too Many Requests. | [`app.py:L71-L111`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L71-L111), [`app.py:L698-L699`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L698-L699) |
| **Isolated Execution Timeouts** | Strictly bound execution timeouts: 5-second subprocess execution limit with `env={}` in `run_python_code()`, 30s LLM request timeout, and 60s circuit breaker cooldown. | [`agent.py:L1206`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1206), [`agent.py:L1385-L1415`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1385-L1415) |
| **Thread Session Isolation & State Tracking** | Unique thread ID allocation (`thread_id`) tracking HITL decision states, SSE telemetry logs, and Redis/dict session persistence. | [`app.py:L331-L332`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L331-L332), [`app.py:L730-L785`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L730-L785), [`app.py:L1146`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L1146) |
| **Input Task Pre-Validation** | Sanitizes user prompt task inputs and extracts core task intents prior to graph ingestion. | [`agent.py:L1288`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1288), [`app.py:L1136`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/app.py#L1136) |
| **Conditional Edge State Graph Routing** | Resolves dynamic graph transitions (`should_continue`) based on test verification status and retry counts. | [`agent.py:L1766`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1766), [`agent.py:L1820`](file:///Users/k.sathvik/.gemini/antigravity/scratch/LangGraph_deployment/agent.py#L1820) |

---

## 📂 Project Directory Structure

```
LangGraph_deployment/
├── .github/                     # CI/CD Workflows and GitHub templates
│   ├── workflows/               # Automated testing & deployment actions
│   └── ISSUE_TEMPLATE/          # Bug & feature templates
├── data/                        # Persistent audit history storage
├── docs/                        # Deep technical guides & specifications
├── pages/                       # Multi-page responsive frontend views
│   ├── dashboard.html           # Architecture & telemetry overview
│   ├── generate.html            # Interactive agent workspace
│   ├── workflow.html            # Live SVG graph visualizer
│   └── history.html             # Audit trail & playback engine
├── static/                      # Production stylesheets & client scripts
│   ├── css/shared.css           # Glassmorphic design tokens
│   └── js/                      # Modular client state & SSE controllers
├── tests/                       # Pytest test suite
├── agent.py                     # LangGraph StateGraph & Multi-Agent engine
├── app.py                       # FastAPI application & SSE streaming engine
├── guardrails.py                # OWASP LLM security shield
├── Dockerfile                   # Multi-stage production container
├── docker-compose.yml           # Container orchestration
├── pyproject.toml               # Packaging & tool configurations
└── requirements.txt             # Pinned production dependencies
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.