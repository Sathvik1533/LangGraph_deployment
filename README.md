<div align="center">

# 🤖 LangGraph Self-Correcting Agent

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2.0+-orange.svg)](https://github.com/langchain-ai/langgraph)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Groq](https://img.shields.io/badge/Powered%20by-Groq-black.svg)](https://groq.com/)

**Production-ready AI coding assistant with self-correction loops, intelligent error handling, and automatic retries**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-endpoints) • [Deploy](#-deployment)

---

</div>

## 🎯 Overview

A **multi-agent system** built with LangGraph that generates, tests, and automatically fixes code in multiple programming languages (Python, Java, C++). The agent learns from execution failures and iteratively improves code quality through intelligent feedback loops.

### What Makes This Special?

✨ **Self-Healing**: Automatically debugs and fixes failed code (up to 3 iterations)  
🔄 **Smart Routing**: Conditional workflow routing based on execution results  
🌐 **Multi-Language**: Generate code in Python, Java, and C++  
💪 **Resilient**: Exponential backoff retry logic, circuit breaker, rate limiting  
🧠 **Context-Aware**: Thread-based conversation persistence with Redis support  
⚡ **Fast**: Powered by Groq's Llama 3.3 70B Versatile model  
🎨 **Professional UI**: Clean 5-page dashboard with workflow visualization  
🏭 **Production-Ready**: Comprehensive error handling, logging, and monitoring

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **🎨 Multi-Page Dashboard** | Professional 5-page UI (Dashboard, Generator, Workflow, Execution, History) |
| **🌍 Multi-Language Support** | Generate code in Python, Java, and C++ |
| **🔄 Self-Correction Loop** | If code fails tests, routes back to developer agent with error context |
| **🧪 Automated Testing** | Generates test cases using LLM and executes code in sandboxed environment |
| **📊 Workflow Visualization** | Real-time agent execution flow with animated nodes and timeline |
| **🧵 Thread Management** | Conversation persistence with Redis or in-memory storage |
| **🔁 API Retry Logic** | Tenacity-based exponential backoff for transient network failures |
| **🛡️ Circuit Breaker** | Automatic service protection when LLM API is down |
| **⏱️ Rate Limiting** | 10 requests/minute per IP to prevent abuse |
| **💬 Execution Reports** | Detailed test results, output logs, and performance metrics |
| **📚 History Management** | Search, filter, and manage all code generations |
| **🔒 Sandboxed Execution** | Safe code execution with isolated scope |

---

## 📦 Quick Start

### Prerequisites

- Python 3.11 or higher
- [Groq API key](https://console.groq.com) (free tier available)

### Installation

```bash
# Clone the repository
git clone https://github.com/Sathvik1533/LangGraph_deployment.git
cd LangGraph_deployment

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### Run Locally

```bash
# Start the FastAPI server
uvicorn app:app --reload

# Server will start at http://localhost:8000
# Open in browser to access the dashboard
```

### Use the Dashboard

**5-Page Interface:**

1. **Dashboard** (`/`) - Overview with stats and quick actions
2. **Code Generator** (`/generate`) - Generate code in Python, Java, or C++
3. **Workflow** (`/workflow`) - Visualize agent execution flow in real-time
4. **Execution** (`/execution`) - View detailed test results and metrics
5. **History** (`/history`) - Search and manage all code generations

### Test the Agent

**Option 1: Web Dashboard (Recommended)**
```
Visit http://localhost:8000
Navigate to /generate page
Enter task: "Write a function to calculate fibonacci numbers"
Select language and click Generate
```

**Option 2: Interactive API Docs**
```
Visit http://localhost:8000/docs
```

**Option 3: cURL**
```bash
curl -X POST "http://localhost:8000/invoke" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a function to calculate fibonacci numbers",
    "language": "python",
    "max_iterations": 3
  }'
```

**Option 4: Python Script**
```bash
python test_agent.py "Write a function to reverse a list"
```

---

## 🏗️ Architecture

```mermaid
graph LR
    A[START] --> B[Developer Agent]
    B --> C[Tester Agent]
    C --> D{Tests Pass?}
    D -->|Yes| E[END]
    D -->|No & iterations<3| B
    D -->|No & iterations≥3| E
    
    style B fill:#4CAF50
    style C fill:#2196F3
    style D fill:#FF9800
    style E fill:#9C27B0
```

### Workflow Components

| Component | Role | Technology |
|-----------|------|------------|
| **Developer Agent** | Generates Python code based on task description | Groq LLM (Llama 3.3 70B) |
| **Tester Agent** | Creates test cases and executes code | LangChain Tools + Python exec() |
| **Conditional Router** | Routes workflow based on execution results | LangGraph Conditional Edges |
| **State Manager** | Maintains conversation history | LangGraph State Reducers |
| **Retry Handler** | Handles API failures with backoff | Tenacity |

### How It Works

1. **User sends task** → Developer agent receives task description
2. **Code generation** → LLM generates Python code solution
3. **Test execution** → Tester agent creates test cases and executes code
4. **Result evaluation** → Checks if code executed successfully
5. **Conditional routing**:
   - ✅ **Success** → Return code and report to user
   - ❌ **Failure** → Send error feedback to developer agent (repeat from step 2)
6. **Max iterations guard** → Stops after 3 attempts to prevent infinite loops

---

## 📡 API Endpoints

### Frontend Pages

| Endpoint | Description |
|----------|-------------|
| `/` | Dashboard - Home page with stats and quick actions |
| `/generate` | Code Generator - Create code in Python, Java, C++ |
| `/workflow` | Workflow Visualization - Real-time agent execution flow |
| `/execution` | Execution Report - Detailed test results and metrics |
| `/history` | History - View and manage all code generations |

### Core API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | `GET` | Health check with circuit breaker status |
| `/invoke` | `POST` | Execute agent workflow (single request) |
| `/threads` | `GET` | List all thread IDs (Redis checkpointing) |
| `/threads/{id}` | `GET` | Get specific thread information |
| `/threads/{id}` | `DELETE` | Delete thread and checkpoints |
| `/docs` | `GET` | Interactive API documentation (Swagger UI) |
| `/redoc` | `GET` | Alternative API docs (ReDoc) |

### Request Format

```json
{
  "task": "Write a function to check if a number is prime",
  "language": "python",
  "max_iterations": 3,
  "thread_id": "optional_thread_id",
  "thread_name": "Optional Thread Name"
}
```

### Response Format

```json
{
  "success": true,
  "code": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True",
  "report": "### EXECUTION OUTPUT:\nTrue\n\n### TEST SCENARIOS EVALUATED:\n1. Test with n=2 (smallest prime)\n2. Test with n=17 (prime number)\n3. Test with n=1 (edge case)\n4. Test with n=100 (composite number)\n\n✅ Code executed successfully!",
  "execution_success": true,
  "iterations": 1,
  "thread_id": "thread_abc123def456",
  "checkpointed": false
}
```

---

## ⚙️ Configuration

### Thread-Based Conversation Management

The agent supports persistent conversations using thread IDs:

**Automatic Thread Creation:**
```json
{
  "task": "Write a function to sort a list"
}
// Returns: { "thread_id": "thread_abc123...", ... }
```

**Resume Existing Thread:**
```json
{
  "task": "Now make it sort in descending order",
  "thread_id": "thread_abc123..."
}
// Continues the conversation in same context
```

### State Persistence Modes

**1. Development Mode (Default)**
- Uses in-memory state storage (MemorySaver)
- Fast and simple
- State is lost on server restart
- Perfect for testing and development

**2. Production Mode (Optional - Redis)**
- Persistent state storage with Redis
- Survives server restarts
- Enables multi-instance deployments
- Supports conversation resumption across sessions

To enable Redis persistence:
```bash
# Install Redis dependencies (optional)
pip install langgraph-checkpoint-redis redis

# Add to .env
REDIS_URL=redis://localhost:6379
```

**Note:** Redis is NOT required for deployment. The agent works perfectly fine with in-memory storage for most use cases.

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Required
GROQ_API_KEY=gsk_your_api_key_here

# Optional - Model Configuration
GROQ_MODEL=llama-3.3-70b-versatile

# Optional - Redis for State Persistence (Production)
# If not set, uses in-memory storage (development mode)
# REDIS_URL=redis://localhost:6379

# Optional - Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW=60
```

### Available Models

| Model | Context Window | Best For |
|-------|---------------|----------|
| `llama-3.3-70b-versatile` | 8K tokens | General coding tasks (default) |
| `llama-3.1-70b-versatile` | 8K tokens | Alternative high-quality model |
| `mixtral-8x7b-32768` | 32K tokens | Long context tasks |

### Workflow Configuration

Adjust settings in `agent.py`:

```python
# Max self-correction attempts
MAX_ITERATIONS = 3

# API retry settings
llm_retry = retry(
    stop=stop_after_attempt(3),              # Max API retries
    wait=wait_exponential(min=1, max=10),    # Backoff: 1s→2s→4s→8s (max 10s)
    retry=retry_if_exception_type(Exception)
)

# LLM temperature (0.1 for consistent code generation)
temperature = 0.1
```

---

## 🌐 Deployment

### Deploy to Render

1. **Push to GitHub** (already done ✅)

2. **Create Web Service on Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect this repository

3. **Configure Build Settings**:
   ```
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

4. **Set Environment Variable**:
   ```
   GROQ_API_KEY = your_api_key_here
   ```

5. **Deploy** 🚀

### Deploy to Other Platforms

<details>
<summary><b>Heroku</b></summary>

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variable
heroku config:set GROQ_API_KEY=your_api_key_here

# Deploy
git push heroku main
```
</details>

<details>
<summary><b>Railway</b></summary>

1. Connect your GitHub repository
2. Add environment variable: `GROQ_API_KEY`
3. Railway auto-detects Python and deploys
</details>

<details>
<summary><b>Docker</b></summary>

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t langgraph-agent .
docker run -p 8000:8000 -e GROQ_API_KEY=your_key langgraph-agent
```
</details>

---

## 📂 Project Structure

```
LangGraph_deployment/
├── pages/                        # 🎨 Multi-page dashboard
│   ├── dashboard.html            # Home page with stats
│   ├── generate.html             # Code generator interface
│   ├── workflow.html             # Workflow visualization
│   ├── execution.html            # Execution report with tabs
│   └── history.html              # Generation history management
├── static/                       # 📦 Shared assets
│   ├── css/
│   │   └── shared.css            # Professional design system
│   └── js/
│       └── common.js             # Reusable JavaScript utilities
├── templates/                    # 🧩 Shared components
│   └── navigation.html           # Sidebar navigation
├── agent.py                      # 🧠 LangGraph workflow & agent logic
├── app.py                        # 🌐 FastAPI application & API routes
├── test_agent.py                 # 🧪 Testing script
├── verify_setup.py               # ✅ Setup verification script
├── requirements.txt              # 📦 Python dependencies
├── runtime.txt                   # 🐍 Python version specification
├── .env.example                  # 📝 Environment variables template
├── .env                          # 🔒 Your API keys (gitignored)
├── docs/                         # 📚 Comprehensive documentation
│   ├── ARCHITECTURE.md
│   ├── FRONTEND_EXPLAINED.md
│   ├── ERROR_HANDLING_GUIDE.md
│   ├── PRODUCTION_PATTERNS.md
│   ├── THREAD_MANAGEMENT.md
│   └── ...
├── extras/                       # 🎁 Optional components (Gradio UI)
├── MULTI_PAGE_COMPLETION.md      # 📋 Multi-page implementation details
├── TESTING_GUIDE.md              # 🧪 Comprehensive testing guide
└── README.md                     # 📖 This file
```

---

## 🧪 Testing

### Run Test Script

```bash
# Test with default task
python test_agent.py

# Test with custom task
python test_agent.py "Write a function to merge two sorted lists"
```

### Manual Testing

```python
from agent import agent
from langchain_core.messages import HumanMessage

# Invoke the agent
result = agent.invoke({
    "messages": [HumanMessage(content="Write a function to calculate factorial")],
    "code": None,
    "report": None,
    "execution_success": False,
    "iterations": 0
})

print(result["code"])
print(result["report"])
```

---

## 🔬 Technical Deep Dive

### State Reducers

LangGraph's state reducers prevent message history from being overwritten:

```python
from operator import add
from typing_extensions import Annotated

class CrewState(TypedDict):
    messages: Annotated[List[BaseMessage], add]  # Messages are appended, not replaced
    code: Optional[str]
    report: Optional[str]
    execution_success: bool
    iterations: int
```

### Self-Correction Flow

```python
def should_continue(state: CrewState) -> Literal["developer", "end"]:
    """Route back to developer if tests fail, otherwise end"""
    MAX_ITERATIONS = 3
    
    if state.get("iterations", 0) >= MAX_ITERATIONS:
        return "end"  # Prevent infinite loops
    
    if state.get("execution_success", False):
        return "end"  # Success - we're done!
    
    return "developer"  # Failure - retry with error feedback
```

### API Resilience

Tenacity retries transient API failures automatically:

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(Exception)
)
def call_llm_with_retry(prompt):
    return llm.invoke(prompt)
```

**What gets retried:**
- Connection errors
- Timeout errors
- Rate limits (429 errors)
- Temporary service unavailability

**What doesn't get retried:**
- Authentication errors (wrong API key)
- Invalid model errors
- Malformed requests

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) folder:

- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System design and workflow
- **[Thread Management](./docs/THREAD_MANAGEMENT.md)** - Conversation persistence explained
- **[Frontend Explained](./docs/FRONTEND_EXPLAINED.md)** - Complete UI architecture
- **[Error Handling](./docs/ERROR_HANDLING_GUIDE.md)** - Multi-layer error handling strategy
- **[Production Patterns](./docs/PRODUCTION_PATTERNS.md)** - Circuit breaker, rate limiting, jitter
- **[Configuration](./docs/CONFIGURATION_EXPLAINED.md)** - Environment variables explained
- **[FAQ](./docs/QUESTIONS_ANSWERED.md)** - Common questions answered
- **[Multi-Page Implementation](./MULTI_PAGE_COMPLETION.md)** - Dashboard architecture details
- **[Testing Guide](./TESTING_GUIDE.md)** - Comprehensive testing checklist

---

## 📸 Screenshots

### Dashboard - Home Page
<div align="center">
<img src="https://via.placeholder.com/800x450/2563eb/ffffff?text=Dashboard+with+Stats+and+Quick+Actions" alt="Dashboard" width="800"/>
</div>

*Clean home page with statistics, production status panel, and quick action buttons*

### Code Generator
<div align="center">
<img src="https://via.placeholder.com/800x450/10b981/ffffff?text=Code+Generator+with+Multi-Language+Support" alt="Code Generator" width="800"/>
</div>

*Generate code in Python, Java, or C++ with real-time syntax highlighting*

### Workflow Visualization
<div align="center">
<img src="https://via.placeholder.com/800x450/8b5cf6/ffffff?text=Real-Time+Workflow+with+Animated+Nodes" alt="Workflow" width="800"/>
</div>

*Visual representation of agent execution flow with timeline of all steps*

### Execution Report
<div align="center">
<img src="https://via.placeholder.com/800x450/f59e0b/ffffff?text=Detailed+Test+Results+and+Metrics" alt="Execution Report" width="800"/>
</div>

*Comprehensive test results with tabs for Tests, Output, and Metrics*

### History Management
<div align="center">
<img src="https://via.placeholder.com/800x450/06b6d4/ffffff?text=Search+and+Filter+All+Generations" alt="History" width="800"/>
</div>

*Search, filter, and manage all code generations with download/delete actions*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- **[LangGraph](https://github.com/langchain-ai/langgraph)** - Agent orchestration framework
- **[LangChain](https://github.com/langchain-ai/langchain)** - LLM application framework
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[Groq](https://groq.com/)** - Lightning-fast LLM inference
- **[Tenacity](https://github.com/jd/tenacity)** - Retry logic library

---

## 📬 Contact

**Sathvik** - [@Sathvik1533](https://github.com/Sathvik1533)

**Project Link**: [https://github.com/Sathvik1533/LangGraph_deployment](https://github.com/Sathvik1533/LangGraph_deployment)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ using LangGraph and FastAPI

</div>