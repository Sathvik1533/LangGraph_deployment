# 🔖 Quick Reference Guide

**Use this as a cheat sheet when working on the project**

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Test agent directly (no API)
python test_agent.py

# Start API server
uvicorn app:app --reload

# Start API with custom port
uvicorn app:app --host 0.0.0.0 --port 8080

# Test API with curl
curl -X POST http://localhost:8000/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": {"task": "Write a function to add two numbers"}}'

# Start Gradio UI (requires: pip install gradio)
python gradio_ui.py
```

---

## 📂 Project Structure

```
agent.py          → 🧠 Core agent logic (LangGraph workflow)
app.py            → 🌐 FastAPI server (API layer)
requirements.txt  → 📦 Python dependencies
runtime.txt       → 🐍 Python version
.env              → 🔐 Secrets (API keys)

gradio_ui.py      → 🎨 Gradio web interface
index.html        → 🎨 HTML/JS web interface
test_agent.py     → 🧪 Quick testing script

PROJECT_GUIDE.md  → 📚 Complete learning guide
ACTION_PLAN.md    → 🎯 Step-by-step action plan
QUICK_REFERENCE.md→ 🔖 This file
```

---

## 🔄 Data Flow (Simplified)

```
1. User submits task → API receives JSON
2. JSON → LangGraph state (adapter)
3. developer_node → generates code
4. tester_node → tests code
5. LangGraph state → JSON (adapter)
6. API returns JSON → User sees results
```

---

## 🧩 Key Patterns

| Pattern | Where Used | Why |
|---------|------------|-----|
| **State Machine** | `agent.py` workflow | Predictable, debuggable flow |
| **Separation of Concerns** | `agent.py` vs `app.py` | API separate from logic |
| **Adapter** | `_to_graph_input()` | Convert JSON ↔ State |
| **Tool** | `@tool` decorator | Extend LLM capabilities |
| **Type Safety** | Pydantic models | Catch errors early |

---

## 🔧 Key Functions

### In `agent.py`

```python
get_llm()                    # Initialize Groq LLM
run_python_code(code)        # Execute Python safely
generate_test_cases(task)    # Generate test scenarios
developer_node(state)        # Agent: writes code
tester_node(state)           # Agent: tests code
create_workflow()            # Build LangGraph workflow
```

### In `app.py`

```python
_to_graph_input(inp)         # JSON → State
_from_graph_output(result)   # State → JSON
health_check()               # GET / endpoint
agent_info()                 # GET /info endpoint
```

---

## 🐛 The 3 Bugs

| Bug # | Location | Issue | Fix |
|-------|----------|-------|-----|
| **#1** | `get_llm()` | `temperature=0.7` too high | Use `0.1` for consistency |
| **#2** | `run_python_code()` | Removes ``` everywhere | Only remove at start/end |
| **#3** | `tester_node()` | Wrong argument type to tool | Pass string, not dict |

→ See PROJECT_GUIDE.md for detailed explanations

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/info` | Agent capabilities |
| GET | `/docs` | Auto-generated API docs |
| POST | `/agent/invoke` | Run the agent (single task) |
| POST | `/agent/batch` | Run multiple tasks |
| POST | `/agent/stream` | Stream responses |

---

## 📝 Request/Response Format

### Request
```json
{
  "input": {
    "task": "Write a function to calculate factorial"
  }
}
```

### Response
```json
{
  "output": {
    "code": "def factorial(n):\n    return 1 if n == 0 else n * factorial(n-1)",
    "report": "### EXECUTION OUTPUT:\n120\n\n### TEST SCENARIOS:\n..."
  }
}
```

---

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ Yes | - | Your Groq API key |
| `GROQ_MODEL` | ❌ No | `llama-3.3-70b-versatile` | LLM model to use |
| `API_URL` | ❌ No | `http://localhost:8000` | For frontend config |

---

## 🧪 Testing Checklist

```bash
# 1. Test agent directly
python test_agent.py "Write a hello world function"

# 2. Test API health
curl http://localhost:8000/

# 3. Test agent endpoint
curl -X POST http://localhost:8000/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": {"task": "test"}}'

# 4. Check API docs
open http://localhost:8000/docs

# 5. Test UI
# Open index.html in browser OR run gradio_ui.py
```

---

## 🚨 Common Errors

### Error: "GROQ_API_KEY env var not set"
**Solution**: Check `.env` file exists and has correct format:
```
GROQ_API_KEY=gsk_your_key_here
```

### Error: "Module 'agent' not found"
**Solution**: Run from project root (where agent.py is):
```bash
cd /Users/k.sathvik/LangGraph_deployment
python app.py  # or uvicorn app:app
```

### Error: "Connection refused on port 8000"
**Solution**: API not running. Start it:
```bash
uvicorn app:app --reload
```

### Error: "exec() returned no output"
**Solution**: Code probably didn't print anything. This is normal!

---

## 🎨 Frontend Options

### Option 1: Gradio (Easiest)
```bash
pip install gradio
python gradio_ui.py
# Visit: http://localhost:7860
```

### Option 2: HTML (No install needed)
```bash
# Just open index.html in browser
# (May need CORS - see below)
```

### Option 3: Custom React/Vue
```bash
# Use Cursor with the prompt from ACTION_PLAN.md
```

### CORS Fix (for HTML option)
Add to `app.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Groq Models Available

| Model | Best For | Speed | Context |
|-------|----------|-------|---------|
| `llama-3.3-70b-versatile` | General coding | Fast | 32k tokens |
| `llama-3.1-70b-versatile` | Complex reasoning | Fast | 128k tokens |
| `mixtral-8x7b-32768` | Balanced | Very fast | 32k tokens |
| `gemma2-9b-it` | Simple tasks | Blazing fast | 8k tokens |

Change in `.env`:
```
GROQ_MODEL=llama-3.1-70b-versatile
```

---

## 🏗️ Adding a New Agent

```python
# 1. Create node function in agent.py
def reviewer_node(state: CrewState) -> Dict[str, str]:
    code = state["code"]
    # ... do review ...
    return {"report": review_report}

# 2. Add to workflow
workflow.add_node("reviewer", reviewer_node)
workflow.add_edge("developer", "reviewer")  # Insert here
workflow.add_edge("reviewer", "tester")     # Then continue
```

---

## 🔍 Debugging Tips

### 1. Add Print Statements
```python
def developer_node(state: CrewState):
    task = state["messages"][-1].content
    print(f"🔍 Task: {task}")  # Debug
    # ... rest of function
```

### 2. Check State at Each Step
```python
result = agent.invoke(initial_state)
print("Final state:", result)
```

### 3. Test Tools Independently
```python
from agent import run_python_code

code = "print('hello')"
result = run_python_code.invoke(code)
print(result)  # Should print: hello
```

### 4. Check API Response
```bash
# Pretty print JSON
curl http://localhost:8000/agent/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": {"task": "test"}}' | python -m json.tool
```

---

## 📚 Code Comments Legend

When reading the code, look for these comment types:

```python
# Pattern: State Machine
# ↑ Explains what pattern is being used

# Why: Allows sequential agent coordination
# ↑ Explains the reasoning behind the choice

# Think: What happens if an agent doesn't update its field?
# ↑ Questions to test your understanding

# Deliberate Bug #1: ...
# ↑ Marks intentional bugs for learning
```

---

## 🎯 Quick Wins (Easy Changes)

### Change the LLM Model
```python
# In .env
GROQ_MODEL=mixtral-8x7b-32768
```

### Add More Example Tasks
```python
# In gradio_ui.py or index.html
examples = [
    ["Your new example task here"],
    # ...
]
```

### Customize System Prompts
```python
# In agent.py, developer_node()
prompt = f"You are a senior Python developer. Write clean, documented code for: {task}"
```

### Change Code Execution Timeout
```python
# In run_python_code(), add:
import signal
signal.alarm(5)  # 5 second timeout
```

---

## 🚀 Deployment Quick Guide

### Render (Recommended)
1. Push to GitHub
2. New Web Service on Render
3. Connect repo
4. Set `GROQ_API_KEY` env var
5. Build: `pip install -r requirements.txt`
6. Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Local Testing Before Deploy
```bash
# Test production-like setup
PORT=10000 uvicorn app:app --host 0.0.0.0 --port 10000
```

---

## 💡 Next Steps Ideas

Easy:
- [ ] Add more example tasks
- [ ] Customize UI colors/styling
- [ ] Support more Python libraries

Medium:
- [ ] Add code review agent
- [ ] Save task history to file
- [ ] Add "share" button for results

Hard:
- [ ] Multi-language support
- [ ] Streaming responses
- [ ] User authentication

---

## 📞 Getting Help

1. **Check logs**: `uvicorn app:app --reload --log-level debug`
2. **Read errors carefully**: They usually tell you what's wrong
3. **Test in isolation**: Break down the problem
4. **Check API docs**: http://localhost:8000/docs
5. **Read PROJECT_GUIDE.md**: Detailed explanations

---

**Bookmark this page - you'll reference it often! 🔖**
