# 🏗️ System Architecture

**Visual guide to understanding how everything connects**

---

## 📊 High-Level Architecture

```
┌─────────────┐
│    User     │  (Web Browser / API Client)
└──────┬──────┘
       │
       │ HTTP Request (JSON)
       │ POST /agent/invoke
       │ {"input": {"task": "..."}}
       ▼
┌─────────────────────────────────────────┐
│           FastAPI Server                │
│              (app.py)                   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  API Layer                       │  │
│  │  • Input validation (Pydantic)   │  │
│  │  • JSON ↔ State transformation   │  │
│  │  • Response formatting           │  │
│  └────────────┬─────────────────────┘  │
└───────────────┼─────────────────────────┘
                │
                │ State Dict
                ▼
┌─────────────────────────────────────────┐
│         LangGraph Workflow              │
│             (agent.py)                  │
│                                         │
│  ┌──────────┐    ┌──────────┐          │
│  │  START   │───▶│Developer │          │
│  └──────────┘    │  Agent   │          │
│                  └────┬─────┘          │
│                       │                 │
│                       │ Generated Code  │
│                       ▼                 │
│                  ┌──────────┐          │
│                  │  Tester  │          │
│                  │  Agent   │          │
│                  └────┬─────┘          │
│                       │                 │
│                       │ Test Report     │
│                       ▼                 │
│                  ┌──────────┐          │
│                  │   END    │          │
│                  └──────────┘          │
└─────────────────────────────────────────┘
                │
                │ Final State
                ▼
┌─────────────────────────────────────────┐
│           Response                      │
│  {"output": {                          │
│    "code": "...",                      │
│    "report": "..."                     │
│  }}                                    │
└─────────────────────────────────────────┘
```

---

## 🔄 Detailed Data Flow

### Phase 1: Request Reception
```
Browser/Client
    ↓
    POST /agent/invoke
    {
      "input": {
        "task": "Write a function to calculate factorial"
      }
    }
    ↓
FastAPI (app.py)
    ↓
AgentInput Validation (Pydantic)
    ✓ task is string
    ✓ task is not empty
```

### Phase 2: Input Transformation
```
AgentInput
    ↓
_to_graph_input()
    ↓
CrewState Dict
{
  "messages": [
    HumanMessage(content="Write a function to calculate factorial")
  ],
  "code": None,
  "report": None
}
```

### Phase 3: Agent Execution
```
LangGraph Workflow (agent.py)

START
    ↓
┌─────────────────────────────────────┐
│     developer_node()                │
│                                     │
│  1. Extract task from messages     │
│     task = "Write function..."     │
│                                     │
│  2. Create prompt                  │
│     "Write clean Python script..." │
│                                     │
│  3. Call Groq LLM                  │
│     llm.invoke(prompt)             │
│          ↓                          │
│     ┌──────────────┐               │
│     │  Groq API    │               │
│     │ llama-3.3-70b│               │
│     └──────┬───────┘               │
│            ↓                        │
│     Generated Code                 │
│                                     │
│  4. Return state update            │
│     {"code": "def factorial..."}   │
└─────────────────────────────────────┘
    ↓
State Updated:
{
  "messages": [...],
  "code": "def factorial(n):\n    ...",  ← Added
  "report": None
}
    ↓
┌─────────────────────────────────────┐
│     tester_node()                   │
│                                     │
│  1. Generate test cases            │
│     generate_test_cases.invoke()   │
│          ↓                          │
│     ┌──────────────┐               │
│     │  Groq API    │               │
│     │ (via Tool)   │               │
│     └──────┬───────┘               │
│            ↓                        │
│     "1. Test with n=0              │
│      2. Test with n=5..."          │
│                                     │
│  2. Execute code                   │
│     run_python_code.invoke()       │
│          ↓                          │
│     exec(code)                     │
│          ↓                          │
│     "120" (output)                 │
│                                     │
│  3. Create report                  │
│     Combine execution + tests      │
│                                     │
│  4. Return state update            │
│     {"report": "### EXECUTION..."}│
└─────────────────────────────────────┘
    ↓
Final State:
{
  "messages": [...],
  "code": "def factorial(n):\n    ...",
  "report": "### EXECUTION OUTPUT:\n120\n\n### TEST SCENARIOS..."
}
    ↓
END
```

### Phase 4: Output Transformation
```
Final State Dict
    ↓
_from_graph_output()
    ↓
AgentOutput (Pydantic)
{
  "code": "def factorial(n): ...",
  "report": "### EXECUTION OUTPUT: ..."
}
```

### Phase 5: Response
```
FastAPI
    ↓
JSON Response
{
  "output": {
    "code": "def factorial(n):\n    return 1 if n == 0 else n * factorial(n-1)",
    "report": "### EXECUTION OUTPUT:\n120\n\n### TEST SCENARIOS EVALUATED:\n..."
  }
}
    ↓
Browser/Client
```

---

## 📦 Component Breakdown

### 1. FastAPI Layer (app.py)

```
app.py
├── API Models
│   ├── AgentInput (request validation)
│   └── AgentOutput (response formatting)
│
├── Transformers
│   ├── _to_graph_input() (JSON → State)
│   └── _from_graph_output() (State → JSON)
│
├── Pipeline
│   └── agent_runnable (Input → Agent → Output)
│
└── Endpoints
    ├── GET /          (health check)
    ├── GET /info      (agent info)
    ├── GET /docs      (auto-generated)
    ├── POST /agent/invoke  (main endpoint)
    ├── POST /agent/batch   (batch processing)
    └── POST /agent/stream  (streaming)
```

**Responsibilities**:
- ✅ Validate input
- ✅ Transform formats
- ✅ Handle HTTP
- ✅ Return responses
- ❌ No business logic!

---

### 2. Agent Layer (agent.py)

```
agent.py
├── Configuration
│   └── get_llm() (Groq setup)
│
├── State
│   └── CrewState (TypedDict)
│       ├── messages: List[HumanMessage]
│       ├── code: Optional[str]
│       └── report: Optional[str]
│
├── Tools
│   ├── run_python_code() (execute Python)
│   └── generate_test_cases() (LLM for tests)
│
├── Agents (Nodes)
│   ├── developer_node() (write code)
│   └── tester_node() (test code)
│
└── Workflow
    ├── create_workflow() (build graph)
    └── get_agent() (compile & return)
```

**Responsibilities**:
- ✅ Agent logic
- ✅ LLM interaction
- ✅ Tool execution
- ✅ State management
- ❌ No HTTP handling!

---

## 🔗 Integration Points

### API ↔ Agent
```python
# In app.py
from agent import agent, CrewState

# Agent is pre-compiled, ready to use
result = agent.invoke(state_dict)
```

### Agent ↔ LLM
```python
# In agent.py
llm = ChatGroq(model="llama-3.3-70b-versatile", ...)

# Multiple calls per request:
# 1. developer_node calls llm (code generation)
# 2. generate_test_cases calls llm (test generation)
```

### Agent ↔ Tools
```python
# Tools are decorated functions
@tool
def run_python_code(code: str) -> str:
    # Execute code safely
    
# Called by agent
result = run_python_code.invoke(code)
```

---

## 🎯 Key Design Decisions

### Decision 1: Separate Files
**Why**: Separation of concerns
```
agent.py  → Business logic (what)
app.py    → API layer (how to expose)
```

**Benefits**:
- Test agents without API
- Reuse agents in different contexts
- Change API without touching logic

---

### Decision 2: Sequential Workflow
**Why**: Predictable, debuggable
```
START → developer → tester → END
```

**Alternative considered**: Parallel agents
**Chosen because**:
- Tester needs developer's code (dependency)
- Sequential is easier to debug
- No concurrency issues

---

### Decision 3: State Dict
**Why**: Shared memory between agents
```python
class CrewState(TypedDict):
    messages: List[HumanMessage]
    code: Optional[str]
    report: Optional[str]
```

**Benefits**:
- Each agent updates what it needs
- Clear data contract
- Type-safe with TypedDict

---

### Decision 4: Adapter Pattern
**Why**: Decouple formats
```python
JSON → _to_graph_input() → State
State → _from_graph_output() → JSON
```

**Benefits**:
- API speaks JSON (web standard)
- Agent speaks State (internal)
- Change one without breaking other

---

## 🔄 State Lifecycle

```
1. Initial State (from _to_graph_input)
   {
     "messages": [HumanMessage(...)],
     "code": None,
     "report": None
   }

2. After developer_node
   {
     "messages": [HumanMessage(...)],
     "code": "def factorial...",  ← Updated
     "report": None
   }

3. After tester_node (Final)
   {
     "messages": [HumanMessage(...)],
     "code": "def factorial...",
     "report": "### EXECUTION..."  ← Updated
   }
```

**Key Point**: State is immutable per node. Each node returns a **new** dict with updates.

---

## 🛠️ Tool Execution Flow

### run_python_code Tool

```
1. Input: code (string)
   "def factorial(n):\n    return 1 if n == 0 else n * factorial(n-1)\nprint(factorial(5))"

2. Clean code (remove markdown)
   "def factorial(n):\n    return 1 if n == 0 else n * factorial(n-1)\nprint(factorial(5))"

3. Capture stdout
   old_stdout = sys.stdout
   sys.stdout = StringIO()

4. Execute in isolated scope
   exec(code, {}, local_scope)

5. Capture output
   result = "120"

6. Restore stdout
   sys.stdout = old_stdout

7. Return
   "120"
```

### generate_test_cases Tool

```
1. Input: task_description
   "Write a function to calculate factorial"

2. Create prompt
   "You are a Senior QA Engineer. Generate 3 to 5 test scenarios..."

3. Call LLM
   response = llm.invoke(prompt)

4. Extract text
   "1. Test with n=0 (base case)\n2. Test with n=5 (normal case)..."

5. Return
   Test scenarios as string
```

---

## 🔐 Security Considerations

### Code Execution Sandbox
```python
# Isolated scope (no access to globals)
local_scope = {}
exec(code, {}, local_scope)
```

**Protected against**:
- File system access (no imports like `os`, `sys`)
- Network access (no `requests`, `socket`)
- System commands (no `subprocess`)

**Still vulnerable to**:
- Infinite loops (no timeout)
- Memory exhaustion
- CPU-intensive operations

**Production recommendation**: Use containers (Docker) for true isolation

---

### API Key Security
```
.env file (not committed)
    ↓
os.environ.get("GROQ_API_KEY")
    ↓
Used only server-side
    ↓
Never exposed to client
```

**Best practices**:
- ✅ .env in .gitignore
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use secrets management in production

---

## 📊 Performance Characteristics

### Latency Breakdown (Typical Request)

```
Total: ~3-7 seconds

├─ API Processing: ~10ms
│  ├─ Input validation: 1ms
│  ├─ Transformation: 1ms
│  └─ Response formatting: 1ms
│
├─ Developer Agent: ~2-4s
│  ├─ Prompt construction: 1ms
│  ├─ LLM call (Groq): 2-4s  ← Majority of time
│  └─ Text extraction: 1ms
│
├─ Tester Agent: ~1-3s
│  ├─ Test generation (LLM): 1-2s
│  ├─ Code execution: 10-100ms
│  └─ Report formatting: 1ms
│
└─ Network overhead: ~50-200ms
```

**Bottleneck**: LLM inference (can't optimize much)

**Optimization opportunities**:
- Cache common tasks
- Parallel test generation & execution
- Stream responses to client

---

## 🚀 Scalability Considerations

### Current Limitations

**Single-threaded**:
- One request at a time per worker
- Use Uvicorn with `--workers N` for concurrency

**Stateless**:
- No session management
- Each request independent

**No persistence**:
- Results not saved
- No task history

### Scaling Strategies

**Horizontal Scaling**:
```
Load Balancer
    ↓
├─ App Instance 1 (Uvicorn worker)
├─ App Instance 2 (Uvicorn worker)
└─ App Instance N (Uvicorn worker)
```

**With Queue**:
```
Client → API → Queue (Redis/RabbitMQ) → Workers → Results
```

**With Caching**:
```
Request → Check Cache → Hit? Return : Generate → Store → Return
```

---

## 🎓 Learning Checkpoints

### Understanding Level 1: Can Trace
- [ ] Follow a request through all components
- [ ] Identify where each transformation happens
- [ ] Name each agent's responsibility

### Understanding Level 2: Can Explain
- [ ] Explain why we separate app.py and agent.py
- [ ] Describe the adapter pattern purpose
- [ ] Explain state management

### Understanding Level 3: Can Modify
- [ ] Add a new agent to the workflow
- [ ] Add a new tool
- [ ] Change the LLM model

### Understanding Level 4: Can Extend
- [ ] Add persistence
- [ ] Implement caching
- [ ] Add authentication

---

## 📚 Related Documentation

- **CODE PATTERNS**: See PROJECT_GUIDE.md → "Core Concepts & Patterns"
- **BUG ANALYSIS**: See PROJECT_GUIDE.md → "The 3 Deliberate Bugs"
- **DEPLOYMENT**: See ACTION_PLAN.md → Phase 7
- **API REFERENCE**: http://localhost:8000/docs (when running)

---

**Next**: Open START_HERE.md to begin your learning journey! 🚀
