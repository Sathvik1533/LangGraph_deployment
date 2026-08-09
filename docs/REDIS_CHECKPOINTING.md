# 🔴 Redis Checkpointing - Production Persistence

## 🎯 Overview

This project supports **Redis-backed state checkpointing** for production deployments. This enables:

- ✅ **Persistent State**: Workflow state survives server restarts
- ✅ **Human-in-the-Loop**: Pause/resume workflows with user approval
- ✅ **Crash Recovery**: Resume interrupted workflows from last checkpoint
- ✅ **Scalability**: Multiple server instances share state via Redis

---

## 🆚 Development vs Production

### **Development Mode** (Default)
```python
# No REDIS_URL set → Uses MemorySaver
checkpointer = MemorySaver()  # Fast, ephemeral, lost on restart
```

**Benefits**:
- ⚡ Fast (no network calls)
- 🔧 Simple setup (no Redis required)
- 💻 Perfect for local development

**Limitations**:
- ❌ State lost on server restart
- ❌ Cannot share state across instances
- ❌ No persistence

### **Production Mode** (Recommended)
```python
# REDIS_URL set → Uses RedisSaver
redis_client = aioredis.from_url("redis://localhost:6379")
checkpointer = RedisSaver(redis_client)  # Persistent, scalable
```

**Benefits**:
- ✅ State persisted to disk
- ✅ Survives server restarts
- ✅ Shared across multiple instances
- ✅ Enables human-in-the-loop workflows
- ✅ Crash recovery

**Requirements**:
- Redis server (local or cloud)
- Additional dependencies installed

---

## 📦 Installation

### 1. Install Redis Dependencies

```bash
pip install langgraph-checkpoint-redis redis
```

Or update your `requirements.txt` (already included):
```
langgraph-checkpoint-redis>=2.0.0
redis>=5.0.0
```

### 2. Set Up Redis

Choose one of the following:

#### **Option A: Local Redis (Development)**

Install Redis locally:

**macOS**:
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu)**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows**:
Download from: https://redis.io/download

#### **Option B: Redis Cloud (Production)**

Use a managed Redis service:

1. **Upstash** (Free tier available)
   - Sign up: https://upstash.com/
   - Create Redis database
   - Copy connection URL

2. **Redis Cloud**
   - Sign up: https://redis.com/try-free/
   - Create subscription
   - Copy connection string

3. **AWS ElastiCache**
   - Create Redis cluster
   - Use connection endpoint

#### **Option C: Docker (Local Testing)**

```bash
docker run -d -p 6379:6379 redis:latest
```

---

## ⚙️ Configuration

### 1. Set Environment Variable

Add to your `.env` file:

```bash
# Development (local Redis)
REDIS_URL=redis://localhost:6379

# Production (Redis Cloud)
REDIS_URL=redis://user:password@host:port/db

# Upstash Example
REDIS_URL=redis://default:abc123@us-east-1.upstash.io:6379
```

### 2. Agent Automatically Uses Redis

The agent code automatically detects `REDIS_URL` and switches to Redis checkpointing:

```python
# From agent.py
redis_url = os.getenv("REDIS_URL", "").strip()

if redis_url:
    # Production: Redis-backed persistence
    redis_client = aioredis.from_url(redis_url)
    checkpointer = RedisSaver(redis_client)
    logger.info("✅ Redis checkpointing enabled")
else:
    # Development: In-memory checkpointing
    checkpointer = MemorySaver()
    logger.info("🧠 Using in-memory checkpointing")
```

---

## 🔍 Verification

### Check if Redis is Active

When you start the application, look for these log messages:

**With Redis**:
```
INFO:__main__:🔴 Connecting to Redis for persistent checkpointing: redis://localhost:6379
INFO:__main__:✅ Redis checkpointing enabled - state persisted to disk
```

**Without Redis**:
```
INFO:__main__:🧠 Using in-memory checkpointing (development mode)
```

### Test Redis Connection

```bash
# Test if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis info
redis-cli info
```

---

## 📊 How Checkpointing Works

### State Persistence Flow

```
User Request
    ↓
┌───────────────────────────────────────┐
│ Developer Agent generates code        │
│ → State saved to Redis                │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│ Tester Agent runs tests               │
│ → State saved to Redis                │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│ Decision Router evaluates             │
│ → IF FAIL: State saved, loop back     │
│ → IF PASS: State saved, complete      │
└───────────────────────────────────────┘

At each step, the workflow state is:
✅ Saved to Redis (in-memory cache)
✅ Written to disk (persistence)
✅ Available to all server instances
```

### What Gets Checkpointed?

```python
class CrewState(TypedDict):
    messages: List[BaseMessage]      # ← Full conversation history
    code: Optional[str]               # ← Generated code
    report: Optional[str]             # ← Test results
    execution_success: bool           # ← Pass/fail status
    iterations: int                   # ← Retry count
```

**All of this state is persisted to Redis!**

---

## 🎯 Use Cases

### 1. **Human-in-the-Loop Approval**

```python
# Pause workflow for human approval
thread_id = "user_123_workflow"

# Step 1: Generate code
result = agent.invoke(
    initial_state,
    config={"configurable": {"thread_id": thread_id}}
)

# Step 2: Human reviews code
# (workflow state is saved in Redis)

# Step 3: Resume workflow
continued = agent.invoke(
    {"messages": [HumanMessage(content="approved")]},
    config={"configurable": {"thread_id": thread_id}}
)
```

### 2. **Crash Recovery**

If server crashes during workflow execution:

```python
# Before crash:
agent.invoke(state, config={"configurable": {"thread_id": "task_456"}})
# ❌ Server crashes here

# After restart:
# Redis has saved the state - resume from last checkpoint
agent.invoke(
    {},  # Empty state - will load from Redis
    config={"configurable": {"thread_id": "task_456"}}
)
```

### 3. **Load Balancing Across Instances**

```
Request 1 → Server A → Saves state to Redis
Request 2 → Server B → Loads state from Redis
Request 3 → Server C → Loads state from Redis

All servers share the same workflow state!
```

---

## 🔧 Advanced Configuration

### Custom Redis Configuration

```python
from langgraph.checkpoint.redis import RedisSaver
import redis.asyncio as aioredis

# Custom connection with timeouts
redis_client = aioredis.from_url(
    "redis://localhost:6379",
    encoding="utf-8",
    decode_responses=False,
    socket_connect_timeout=5,    # Connection timeout
    socket_timeout=5,             # Operation timeout
    max_connections=10,           # Connection pool size
    retry_on_timeout=True
)

checkpointer = RedisSaver(redis_client)
```

### Redis with Authentication

```bash
# .env
REDIS_URL=redis://username:password@host:port/db
```

### Redis with SSL/TLS

```bash
# .env
REDIS_URL=rediss://host:port  # Note: rediss:// (with extra 's')
```

---

## 🐛 Troubleshooting

### Issue: "Redis checkpointing unavailable"

**Solution**: Install dependencies
```bash
pip install langgraph-checkpoint-redis redis
```

### Issue: "Redis connection failed"

**Check**:
1. Is Redis running? `redis-cli ping`
2. Is URL correct? Check `.env` file
3. Is port open? Default is `6379`
4. Firewall blocking connection?

**Fallback**: System automatically uses MemorySaver if Redis fails

### Issue: "Module 'redis.asyncio' not found"

**Solution**: Update Redis package
```bash
pip install --upgrade redis>=5.0.0
```

---

## 📈 Production Deployment

### Deploy to Render with Redis

1. **Add Redis service** to your Render account
2. **Get Redis URL** from Render dashboard
3. **Set environment variable** in Render:
   ```
   REDIS_URL = redis://red-xxxxx.render.com:6379
   ```
4. **Deploy** - checkpointing automatically enabled!

### Deploy to AWS with ElastiCache

1. Create ElastiCache Redis cluster
2. Get connection endpoint
3. Set `REDIS_URL` in your deployment
4. Ensure security group allows connections

### Monitor Redis Usage

```bash
# Check memory usage
redis-cli info memory

# Check number of keys (checkpoints)
redis-cli dbsize

# View all checkpoint keys
redis-cli keys "checkpoint:*"

# Clear old checkpoints (if needed)
redis-cli FLUSHDB
```

---

## 🎯 Benefits Summary

| Feature | MemorySaver | RedisSaver |
|---------|-------------|------------|
| **Speed** | ⚡ Fastest | 🔵 Fast (network call) |
| **Persistence** | ❌ Lost on restart | ✅ Persisted to disk |
| **Crash Recovery** | ❌ No | ✅ Yes |
| **Multi-Instance** | ❌ No | ✅ Yes (shared state) |
| **Human-in-the-Loop** | ⚠️ Limited | ✅ Full support |
| **Setup Complexity** | ✅ None | ⚠️ Requires Redis |
| **Cost** | ✅ Free | 💰 Redis hosting cost |

---

## 📖 Further Reading

- **LangGraph Checkpointing**: https://langchain-ai.github.io/langgraph/how-tos/persistence/
- **Redis Documentation**: https://redis.io/docs/
- **Upstash (Free Redis)**: https://upstash.com/docs/redis
- **Human-in-the-Loop Pattern**: https://langchain-ai.github.io/langgraph/how-tos/human_in_the_loop/

---

## ✅ Quick Start Checklist

- [ ] Install Redis dependencies: `pip install langgraph-checkpoint-redis redis`
- [ ] Set up Redis (local or cloud)
- [ ] Add `REDIS_URL` to `.env` file
- [ ] Restart application
- [ ] Check logs for "✅ Redis checkpointing enabled"
- [ ] Test workflow execution
- [ ] Verify state persists after server restart

---

**Last Updated**: August 9, 2026  
**Status**: Production Ready ✅  
**Recommendation**: Use Redis for production deployments
