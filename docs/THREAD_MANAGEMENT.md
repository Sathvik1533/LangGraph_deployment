# 🧵 Thread Management - Conversation Persistence

## 🎯 Overview

The system now supports **thread-based conversation management** using Redis checkpointing. Each user or session can have their own isolated thread with persistent state.

---

## 🆔 What is a Thread?

A **thread** is an isolated conversation context with its own:
- ✅ **Thread ID**: Unique identifier (e.g., `thread_abc123`)
- ✅ **Conversation History**: All messages and state
- ✅ **Generated Code**: Persisted code outputs
- ✅ **Execution Results**: Test results and reports
- ✅ **Iteration State**: Self-correction progress

---

## 🚀 Usage

### **1. Create New Thread (Automatic)**

```bash
# No thread_id provided → System generates one
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a fibonacci function"
  }'
```

**Response**:
```json
{
  "success": true,
  "code": "def fibonacci(n): ...",
  "thread_id": "thread_a1b2c3d4e5f6",  // ← Auto-generated
  "checkpointed": true
}
```

---

### **2. Resume Existing Thread**

```bash
# Provide thread_id to continue conversation
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Add error handling to the function",
    "thread_id": "thread_a1b2c3d4e5f6"
  }'
```

**Benefits**:
- Agent remembers previous conversation
- Can reference earlier code
- Maintains context across requests

---

### **3. Named Threads**

```bash
# Give your thread a human-readable name
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a sorting algorithm",
    "thread_id": "user_john_project_sorting",
    "thread_name": "John - Sorting Algorithms"
  }'
```

---

## 📋 Thread Management API

### **List All Threads**

```bash
GET /threads
```

**Response**:
```json
{
  "checkpointing_enabled": true,
  "total_threads": 5,
  "threads": [
    {
      "thread_id": "thread_a1b2c3",
      "checkpoint_key": "checkpoint:thread_a1b2c3:step_1"
    },
    {
      "thread_id": "user_john_session_1",
      "checkpoint_key": "checkpoint:user_john_session_1:step_1"
    }
  ]
}
```

---

### **Get Thread Info**

```bash
GET /threads/{thread_id}
```

**Example**:
```bash
curl http://localhost:8000/threads/thread_a1b2c3
```

**Response**:
```json
{
  "thread_id": "thread_a1b2c3",
  "exists": true,
  "checkpoint_count": 3,
  "checkpoint_keys": [
    "checkpoint:thread_a1b2c3:step_1",
    "checkpoint:thread_a1b2c3:step_2",
    "checkpoint:thread_a1b2c3:step_3"
  ]
}
```

---

### **Delete Thread**

```bash
DELETE /threads/{thread_id}
```

**Example**:
```bash
curl -X DELETE http://localhost:8000/threads/thread_a1b2c3
```

**Response**:
```json
{
  "thread_id": "thread_a1b2c3",
  "deleted": true,
  "checkpoints_deleted": 3
}
```

---

## 🎯 Use Cases

### **1. User Sessions**

```python
# Each user gets their own thread
user_id = "user_123"
thread_id = f"user_{user_id}_session"

# First request
response = requests.post('/invoke', json={
    "task": "Create a user authentication function",
    "thread_id": thread_id
})

# Later requests in same session
response = requests.post('/invoke', json={
    "task": "Add password hashing",
    "thread_id": thread_id  # Same thread
})
```

---

### **2. Project-Based Threads**

```python
# Organize by project
project_id = "proj_sorting_algorithms"
thread_id = f"project_{project_id}"

# All requests for this project use same thread
response = requests.post('/invoke', json={
    "task": "Implement quicksort",
    "thread_id": thread_id,
    "thread_name": "Sorting Algorithms Project"
})
```

---

### **3. Multi-User Application**

```python
from fastapi import FastAPI, Request

@app.post("/generate_code")
async def generate_code(task: str, request: Request):
    # Get user from session/auth
    user_id = request.user.id
    
    # Each user has isolated thread
    thread_id = f"user_{user_id}_workspace"
    
    # Call agent with user's thread
    response = requests.post('http://localhost:8000/invoke', json={
        "task": task,
        "thread_id": thread_id,
        "thread_name": f"User {user_id} Workspace"
    })
    
    return response.json()
```

---

### **4. Resumable Conversations**

```python
# Day 1: Start conversation
response1 = requests.post('/invoke', json={
    "task": "Write a data processing pipeline",
    "thread_id": "pipeline_dev"
})

# Day 2: Resume (agent remembers context)
response2 = requests.post('/invoke', json={
    "task": "Add error handling to the pipeline",
    "thread_id": "pipeline_dev"  # Same thread
})

# Day 3: Continue
response3 = requests.post('/invoke', json={
    "task": "Optimize for performance",
    "thread_id": "pipeline_dev"
})
```

---

## 🔍 How It Works

### **Thread Storage in Redis**

```
Redis Keys:
checkpoint:thread_abc123:step_1  → State after Developer Agent
checkpoint:thread_abc123:step_2  → State after Tester Agent
checkpoint:thread_abc123:step_3  → State after Decision Router

Each checkpoint contains:
- messages: Full conversation history
- code: Generated code
- report: Test results
- iterations: Retry count
- execution_success: Pass/fail status
```

### **Thread Lifecycle**

```
1. Request with thread_id
       ↓
2. Check if thread exists in Redis
       ↓
3a. IF EXISTS:              3b. IF NEW:
    Load previous state         Create new state
    Continue conversation       Start fresh
       ↓
4. Execute workflow
       ↓
5. Save state to Redis with thread_id
       ↓
6. Return result with thread_id
```

---

## 💻 Frontend Integration

### **JavaScript Example**

```javascript
class AgentClient {
    constructor() {
        this.threadId = null;  // Current thread
    }
    
    async startNewConversation(task) {
        // Create new thread (auto-generated ID)
        const response = await fetch('/invoke', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ task })
        });
        
        const data = await response.json();
        this.threadId = data.thread_id;  // Save for next request
        
        console.log('Thread created:', this.threadId);
        return data;
    }
    
    async continueConversation(task) {
        // Continue in same thread
        const response = await fetch('/invoke', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                task,
                thread_id: this.threadId  // Use existing thread
            })
        });
        
        return await response.json();
    }
    
    async listThreads() {
        const response = await fetch('/threads');
        return await response.json();
    }
    
    async deleteThread(threadId) {
        const response = await fetch(`/threads/${threadId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }
}

// Usage
const client = new AgentClient();

// New conversation
const result1 = await client.startNewConversation(
    "Write a calculator function"
);

// Continue conversation
const result2 = await client.continueConversation(
    "Add division with zero check"
);

// List all threads
const threads = await client.listThreads();
```

---

## 🎨 Thread ID Patterns

### **Recommended Naming Conventions**

```python
# User-based
f"user_{user_id}_session"
f"user_{user_id}_{timestamp}"

# Project-based
f"project_{project_id}"
f"project_{project_id}_v{version}"

# Feature-based
f"feature_{feature_name}"
f"task_{task_id}"

# Session-based
f"session_{session_id}"
f"workspace_{workspace_id}"

# Time-based
f"thread_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
```

---

## 🔒 Security Considerations

### **Thread Isolation**

- ✅ Each thread is completely isolated
- ✅ Users cannot access other users' threads
- ✅ Thread IDs should include user identification
- ⚠️ Validate thread ownership before resuming

### **Example: Secure Thread Access**

```python
@app.post("/generate")
async def generate(task: str, thread_id: str, current_user: User):
    # Verify user owns this thread
    if not thread_id.startswith(f"user_{current_user.id}_"):
        raise HTTPException(403, "Unauthorized thread access")
    
    # Proceed with generation
    return agent.invoke(task, config={"thread_id": thread_id})
```

---

## 🐛 Troubleshooting

### **Issue: Thread not resuming**

**Check**:
1. Is Redis checkpointing enabled? (`REDIS_URL` set)
2. Is thread ID correct?
3. Does thread exist? (`GET /threads/{thread_id}`)

**Solution**:
```bash
# List all threads
curl http://localhost:8000/threads

# Check specific thread
curl http://localhost:8000/threads/YOUR_THREAD_ID
```

---

### **Issue: Too many threads in Redis**

**Solution: Cleanup old threads**
```bash
# Delete specific thread
curl -X DELETE http://localhost:8000/threads/old_thread_123

# Or clear all (development only)
redis-cli FLUSHDB
```

---

## 📈 Performance Tips

### **1. Thread Naming**

Use consistent naming for easy filtering:
```python
# Good: Easy to query
thread_id = f"user_{user_id}_session_{session_id}"

# Bad: Hard to manage
thread_id = f"abc123xyz"
```

### **2. Thread Cleanup**

Delete old threads periodically:
```python
import asyncio
import redis.asyncio as aioredis
from datetime import datetime, timedelta

async def cleanup_old_threads(days_old=30):
    redis_client = aioredis.from_url(os.getenv("REDIS_URL"))
    
    # Implementation: Delete threads older than X days
    # (Requires adding timestamps to thread metadata)
    
    await redis_client.close()
```

### **3. Thread Limits**

Implement per-user thread limits:
```python
def get_user_thread_count(user_id):
    # Count threads for user
    threads = list_threads()
    user_threads = [t for t in threads if t.startswith(f"user_{user_id}_")]
    return len(user_threads)

def enforce_thread_limit(user_id, max_threads=10):
    if get_user_thread_count(user_id) >= max_threads:
        raise Exception(f"User has reached thread limit ({max_threads})")
```

---

## ✅ Benefits Summary

| Feature | Without Threads | With Threads |
|---------|----------------|--------------|
| **Context Persistence** | ❌ Lost each request | ✅ Maintained |
| **Conversation Resume** | ❌ Cannot resume | ✅ Resume anytime |
| **Multi-User Support** | ⚠️ Shared state | ✅ Isolated per user |
| **History** | ❌ No history | ✅ Full history |
| **Crash Recovery** | ❌ Lost on crash | ✅ Recoverable |

---

## 📚 API Reference

### **POST /invoke**
- `task` (required): Task description
- `thread_id` (optional): Thread to use/create
- `thread_name` (optional): Human-readable name
- Returns: `AgentResponse` with `thread_id` and `checkpointed`

### **GET /threads**
- Returns: List of all thread IDs

### **GET /threads/{thread_id}**
- Returns: Thread info and checkpoint count

### **DELETE /threads/{thread_id}**
- Returns: Deletion confirmation

---

**Last Updated**: August 9, 2026  
**Status**: Fully Implemented ✅  
**Redis Required**: Yes (for persistence)
