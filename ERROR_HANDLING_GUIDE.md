# Error Handling & Validation Guide

## 🛡️ Comprehensive Error Handling System

Your LangGraph agent now has **enterprise-grade error handling** with multiple layers of defense.

---

## 🎯 Problem We Solved

### Before (Typical AI Apps)
```
User: "write fibonacci"
Agent: Generates explanation text instead of code
Tester: Tries to execute text → CRASH
User sees: "Execution Error: invalid syntax line 1"
😞 Bad UX!
```

### After (Your System)
```
User: "write fibonacci"
Agent: Generates explanation text
✅ VALIDATION: Detects it's not code
Agent: Retries with clearer prompt
Agent: Generates actual code
Tester: ✅ Validates it's Python before testing
Tester: Executes successfully
User sees: ✅ Working code + confetti!
😃 Great UX!
```

---

## 📊 Error Handling Layers

### Layer 1: Input Validation (API Level)
**When**: Before agent even starts  
**Where**: `app.py` → `invoke_agent()`  
**Purpose**: Fail fast on bad input

```python
# Examples of what gets caught:
❌ Empty task: ""
❌ Too short: "code"  
❌ Too long: 1000+ characters
❌ No code request: "Tell me about Python"
❌ Dangerous patterns: "eval(__import__('os').system('rm -rf /'))"

✅ Valid: "Write a function to calculate fibonacci numbers"
```

**Error Response**:
```json
{
  "error": "Invalid input",
  "message": "Task too short. Please provide more details (minimum 10 characters).",
  "tip": "Please provide a clear description of what code you want to generate."
}
```

---

### Layer 2: Output Validation (Agent Level)
**When**: After LLM generates code  
**Where**: `agent.py` → `developer_node()`  
**Purpose**: Ensure LLM returned actual code, not text

```python
# Examples of what gets caught:
❌ "Here's how to write fibonacci: First, you need to..."
❌ "I cannot help with that request."
❌ Empty response
❌ Markdown without code: "```\nexplanation\n```"

✅ "def fibonacci(n):\n    if n <= 1:\n        return n\n    ..."
```

**What Happens**:
```python
# Invalid output detected
→ Marks as failed
→ Adds error to state
→ Developer retries with better prompt
→ Eventually gets valid code
```

---

### Layer 3: Inter-Agent Validation
**When**: Before Tester executes Developer's code  
**Where**: `agent.py` → `tester_node()`  
**Purpose**: Don't blindly trust previous agent

```python
# Tester checks:
1. Did Developer return error? → Don't waste time testing
2. Is code actually Python? → Parse and validate
3. Does code have syntax errors? → Catch before execution

# Only if all pass:
→ Generate test cases
→ Execute code
→ Return results
```

**Example**:
```python
Developer returns: "# ERROR: Rate limit exceeded"
Tester sees: Starts with "# ERROR:"
Tester response: "❌ Cannot test - developer failed"
→ Doesn't waste API calls on test generation
→ Fails fast
```

---

### Layer 4: User-Friendly Error Translation
**When**: Any error occurs  
**Where**: `agent.py` → `_make_user_friendly_error()`  
**Purpose**: No technical jargon to users

```python
# Technical Error → User-Friendly Message

"HTTPError: 429 Client Error: Too Many Requests"
→ "⚠️ Rate limit reached. The AI service is busy. Please wait 30 seconds and try again."

"TimeoutError: Request exceeded 30s"
→ "⏱️ Request timed out. Try a simpler task or increase timeout."

"ConnectionError: Failed to establish connection"
→ "🌐 Connection error. Please check your internet connection and try again."

"401 Unauthorized: Invalid API key"
→ "🔑 API key invalid or expired. Please check your GROQ_API_KEY configuration."

"Circuit breaker open"
→ "⚡ Service experiencing issues. Automatic retry in 60 seconds. Please wait."
```

---

### Layer 5: Multi-Provider Fallback
**When**: Primary LLM fails repeatedly  
**Where**: `agent.py` → `get_llm()`  
**Purpose**: Don't depend on single provider

```python
# Fallback Chain:
Primary: Groq (Llama 3.3 70B) - Fastest
    ↓ (if fails 5 times)
Fallback 1: OpenAI (GPT-4) - High quality
    ↓ (if fails 5 times)
Fallback 2: Anthropic (Claude) - Alternative
    ↓ (if all fail)
User-friendly error: "All AI providers unavailable"
```

**Configuration**:
```python
LLM_PROVIDERS = [
    {
        "name": "groq",
        "env_key": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "available": True
    },
    # Add more providers:
    # {
    #     "name": "openai",
    #     "env_key": "OPENAI_API_KEY",
    #     "model": "gpt-4",
    #     "available": False  # Enable when needed
    # }
]
```

---

### Layer 6: Graceful Degradation
**When**: Partial failure during workflow  
**Where**: `app.py` → `invoke_agent()`  
**Purpose**: Return something useful instead of nothing

```python
# Example Scenario:
1. Developer generates code ✅
2. Tester generates test cases ✅
3. Code execution times out ❌

# Without graceful degradation:
→ Total failure
→ User gets nothing
→ "500 Internal Server Error"

# With graceful degradation:
→ Return code + test cases ✅
→ Add note: "Execution timed out"
→ User can still use the code
→ Better than nothing!
```

---

## 🔍 Validation Functions

### Input Validation
```python
def validate_task_input(task: str) -> tuple[bool, Optional[str]]:
    """
    Validates user input before processing.
    
    Checks:
    - Not empty
    - Length 10-1000 characters
    - Contains code-related keywords
    - No dangerous patterns (eval, exec, os.system)
    
    Returns:
        (is_valid, error_message)
    """
```

**Examples**:
```python
✅ ("Write a function to sort a list", True, None)
❌ ("", False, "Task cannot be empty")
❌ ("code", False, "Task too short (minimum 10 characters)")
❌ ("Tell me about Python history...", False, "Task unclear. Please ask for code/function")
❌ ("eval(__import__('os'))", False, "Contains dangerous patterns")
```

### Output Validation
```python
def validate_code_output(code: str) -> tuple[bool, Optional[str]]:
    """
    Validates LLM output is actually Python code.
    
    Checks:
    - Not empty
    - Contains Python keywords (def, class, import)
    - Can be compiled as Python
    - Not just explanation text
    
    Returns:
        (is_valid, error_message)
    """
```

**Examples**:
```python
✅ ("def hello():\n    print('hi')", True, None)
❌ ("Here's how to write code...", False, "Doesn't look like Python code")
❌ ("def broken(\n", False, "Syntax error: unexpected EOF")
```

---

## 📈 Error Flow Diagram

```
User Request
    ↓
[Input Validation]
    ├─ Valid ✅ → Continue
    └─ Invalid ❌ → Return 422 with friendly message
        ↓
[Rate Limiting Check]
    ├─ Under limit ✅ → Continue
    └─ Over limit ❌ → Return 429 "Too busy, wait 30s"
        ↓
[Circuit Breaker Check]
    ├─ Closed ✅ → Continue
    └─ Open ❌ → Return 503 "Service issues, wait 60s"
        ↓
[Developer Agent]
    ├─ Generates code
    ├─ [Output Validation]
    │   ├─ Valid Python ✅ → Continue
    │   └─ Invalid ❌ → Retry with better prompt
    └─ Returns code
        ↓
[Tester Agent]
    ├─ [Inter-Agent Validation]
    │   ├─ Code valid ✅ → Continue
    │   └─ Code invalid ❌ → Return error, don't test
    ├─ Generates tests
    ├─ Executes code
    └─ Returns report
        ↓
[Decision Router]
    ├─ Success ✅ → Return results + confetti!
    ├─ Failed + iterations < max → Retry (back to Developer)
    └─ Failed + iterations >= max → Return partial results
        ↓
[Error Translation]
    └─ All errors → User-friendly messages
```

---

## 🎯 Real-World Error Scenarios

### Scenario 1: Rate Limiting

**What Happens**:
```
User makes 11 requests in 1 minute
→ First 10: ✅ Success
→ Request 11: ❌ Rate limit
```

**User Sees**:
```json
{
  "error": "Rate limit exceeded",
  "message": "⚠️ Too many requests. Please try again in 45 seconds.",
  "retry_after": 45,
  "tip": "Rate limit: 10 requests per minute per IP"
}
```

**NOT** "429 Too Many Requests" with stack trace!

---

### Scenario 2: Invalid Input

**User Enters**: `"code"`

**What Happens**:
```
→ Input validation fails
→ Too short (< 10 characters)
```

**User Sees**:
```json
{
  "error": "Invalid input",
  "message": "Task too short. Please provide more details (minimum 10 characters).",
  "tip": "Please provide a clear description of what code you want to generate."
}
```

---

### Scenario 3: LLM Returns Explanation

**LLM Response**:
```
"To calculate fibonacci numbers, you need to use recursion.
First, handle base cases for n=0 and n=1. Then..."
```

**What Happens**:
```
→ Developer output validation fails
→ Detects no Python keywords
→ Adds error to state
→ Retries with clearer prompt
→ Eventually gets actual code
```

**User Never Knows**: Silent retry, just works!

---

### Scenario 4: API Completely Down

**What Happens**:
```
1. Request to Groq → Timeout
2. Retry with jitter → Timeout
3. Retry again → Timeout
4. Circuit breaker: 5 failures → OPEN
5. Try fallback provider (if configured)
6. If all fail → User-friendly error
```

**User Sees**:
```json
{
  "error": "Service temporarily unavailable",
  "message": "⚡ The AI service is experiencing issues. Automatic recovery in progress.",
  "tip": "Please try again in 60 seconds. The system is protecting itself from cascading failures."
}
```

---

### Scenario 5: Developer Returns Code, Tester Fails

**What Happens**:
```
1. Developer generates code ✅
2. Tester tries to generate tests → Timeout ❌
```

**Without Graceful Degradation**:
```
→ Total failure
→ User gets nothing
```

**With Graceful Degradation**:
```json
{
  "success": false,
  "code": "def fibonacci(n): ...",  // ✅ Code available
  "report": "### TESTING ERROR\n⏱️ Test generation timed out.",
  "error": "Test generation timed out. Try a simpler task.",
  "tip": "The code was generated successfully but couldn't be tested."
}
```

---

## 🔧 Configuration

### Enable Multiple Providers

```python
# In agent.py, update LLM_PROVIDERS:

LLM_PROVIDERS = [
    {
        "name": "groq",
        "env_key": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
        "class": ChatGroq,
        "available": True  # Always enabled
    },
    {
        "name": "openai",
        "env_key": "OPENAI_API_KEY",
        "model": "gpt-4",
        "class": ChatOpenAI,
        "available": True  # Enable fallback
    }
]
```

```bash
# In .env, add backup API key:
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key  # Fallback
```

---

## 📊 Monitoring Error Patterns

### Metrics to Track

```python
# Success vs Failure
success_rate = successful_requests / total_requests * 100

# Validation Failures
input_validation_failures / total_requests * 100
output_validation_failures / total_requests * 100

# Provider Fallbacks
fallback_activations / total_requests * 100

# Error Types
{
  "rate_limit": 15,
  "timeout": 8,
  "connection": 3,
  "validation": 5,
  "circuit_breaker": 2
}
```

### Logs to Watch

```
✅ "Validated request from 192.168.1.1: Write a function..."
⚠️  "Developer output validation failed: Not Python code"
❌ "Rate limit exceeded for 192.168.1.1"
⚡ "Circuit breaker open - trying fallback provider"
✅ "Fallback to openai successful"
```

---

## ✅ Error Handling Checklist

- [x] Input validation before agent starts
- [x] Output validation after each agent
- [x] Inter-agent validation (agents check each other)
- [x] User-friendly error messages (no stack traces)
- [x] Multi-provider fallback support
- [x] Graceful degradation (return partial results)
- [x] Rate limiting with friendly message
- [x] Circuit breaker with auto-recovery
- [x] Request timeout with actionable message
- [x] Comprehensive error translation

---

## 🎉 Result

Your system now handles errors like a **Fortune 500 company's production system**:

- ✅ No cryptic error messages
- ✅ Actionable suggestions for users
- ✅ Multiple layers of validation
- ✅ Automatic fallbacks
- ✅ Graceful degradation
- ✅ Professional UX even during failures

**Users never see**:
- Stack traces
- "500 Internal Server Error"
- "Unexpected error occurred"
- "Something went wrong"

**Users always see**:
- Clear explanation
- What went wrong
- How to fix it
- When to retry

---

**This is production-grade error handling! 🏆**
