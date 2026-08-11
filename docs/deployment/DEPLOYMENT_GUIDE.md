# 🚀 Deployment Guide - LangGraph Self-Correcting Agent

## ✅ Quick Deploy (Without Redis)

**The agent works perfectly fine WITHOUT Redis!** Redis is only needed if you want persistent state storage across server restarts.

### Prerequisites

- Python 3.11+
- Groq API Key ([Get one free here](https://console.groq.com))

---

## 📦 Deploy to Render (Recommended)

### Step 1: Prepare Repository

Your repository is already configured! Just make sure:

✅ `requirements.txt` exists (without Redis dependencies commented out)  
✅ `.env.example` exists  
✅ `app.py` has the web server code

### Step 2: Create Render Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `LangGraph_deployment`

### Step 3: Configure Service

**Build & Start Configuration:**
```
Build Command:    pip install -r requirements.txt
Start Command:    uvicorn app:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
```
GROQ_API_KEY = your_actual_groq_api_key_here
```

**Instance Type:**
- Free tier works fine for testing
- Starter ($7/month) recommended for production

### Step 4: Deploy

Click **"Create Web Service"** and wait 2-3 minutes for deployment.

Your API will be live at: `https://your-app-name.onrender.com`

### Step 5: Test

```bash
curl https://your-app-name.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "LangGraph Self-Correcting Agent",
  "version": "2.0.0"
}
```

---

## 🔴 Adding Redis (Optional - For State Persistence)

### Why Add Redis?

**Without Redis:**
- ✅ Agent works perfectly
- ✅ Generates and tests code
- ✅ Self-correction loops work
- ❌ Thread history lost on restart
- ❌ Can't resume conversations

**With Redis:**
- ✅ All of the above
- ✅ Thread history persists
- ✅ Resume conversations after restart
- ✅ Multi-instance support

### How to Add Redis on Render

1. **Add Redis Instance:**
   - In Render dashboard, click **"New +"** → **"Redis"**
   - Choose free tier (25 MB, perfect for testing)
   - Click **"Create Redis"**

2. **Get Redis URL:**
   - Copy the **Internal Redis URL** (starts with `redis://`)
   - Example: `redis://red-xxxxxxxxxxxxx:6379`

3. **Add Environment Variable:**
   - Go to your Web Service settings
   - Add new environment variable:
     ```
     REDIS_URL = redis://red-xxxxxxxxxxxxx:6379
     ```

4. **Update requirements.txt:**
   
   Uncomment these lines in `requirements.txt`:
   ```python
   # Redis Checkpointing (Optional - for production persistence)
   langgraph-checkpoint-redis>=1.0.0
   redis>=5.0.0
   ```

5. **Redeploy:**
   - Render will automatically redeploy
   - Wait 2-3 minutes

6. **Verify:**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   
   Should show:
   ```json
   {
     "status": "healthy",
     "checkpointing": "redis"
   }
   ```

---

## 🌐 Deploy to Other Platforms

### Railway

1. **Create Project:**
   - Go to [railway.app](https://railway.app)
   - Click **"New Project"** → **"Deploy from GitHub repo"**
   - Select `LangGraph_deployment`

2. **Configure:**
   - Railway auto-detects Python
   - Add environment variable: `GROQ_API_KEY`
   - (Optional) Add Redis: Click **"New"** → **"Database"** → **"Redis"**

3. **Deploy:**
   - Railway automatically deploys
   - Get URL from **"Settings"** → **"Domains"**

### Heroku

1. **Create App:**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment:**
   ```bash
   heroku config:set GROQ_API_KEY=your_key_here
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **(Optional) Add Redis:**
   ```bash
   heroku addons:create heroku-redis:mini
   ```

### Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Launch App:**
   ```bash
   fly launch
   ```

3. **Set Secrets:**
   ```bash
   fly secrets set GROQ_API_KEY=your_key_here
   ```

4. **Deploy:**
   ```bash
   fly deploy
   ```

### Docker

1. **Build Image:**
   ```bash
   docker build -t langgraph-agent .
   ```

2. **Run Container:**
   ```bash
   docker run -p 8000:8000 \
     -e GROQ_API_KEY=your_key_here \
     langgraph-agent
   ```

3. **(Optional) With Redis:**
   ```bash
   docker-compose up
   ```

---

## 🔧 Troubleshooting

### Issue: "langgraph-checkpoint-redis" dependency error

**Solution:** Redis is optional! Remove or comment out these lines in `requirements.txt`:

```python
# langgraph-checkpoint-redis>=1.0.0
# redis>=5.0.0
```

The agent will use in-memory storage instead (perfectly fine for most use cases).

### Issue: Build timeout on Render

**Solution:** Render free tier can be slow. Solutions:
1. Wait longer (first build takes 5-10 minutes)
2. Upgrade to Starter plan ($7/month)
3. Use Railway instead (faster builds on free tier)

### Issue: "Module not found" error

**Solution:** Check Python version:
```bash
python --version  # Should be 3.11+
```

Add `runtime.txt` if missing:
```
python-3.11.7
```

### Issue: API returns 500 errors

**Solution:** Check environment variables:
```bash
# On Render dashboard
echo $GROQ_API_KEY  # Should show your key
```

Test locally first:
```bash
export GROQ_API_KEY=your_key_here
uvicorn app:app --reload
```

### Issue: Slow response times

**Solutions:**
1. Use faster Groq model: `llama-3.3-70b-versatile` (default, fastest)
2. Reduce `max_iterations` in code (default: 3)
3. Use paid hosting tier (more CPU/RAM)

---

## 📊 Production Checklist

### Before Going Live

- [ ] **API Key Security:**
  - ✅ Use environment variables (never hardcode)
  - ✅ Rotate keys periodically
  - ✅ Use separate keys for dev/prod

- [ ] **Error Handling:**
  - ✅ Test invalid inputs
  - ✅ Test network failures
  - ✅ Check error messages are user-friendly

- [ ] **Performance:**
  - ✅ Test with concurrent requests
  - ✅ Monitor response times
  - ✅ Set up health check monitoring

- [ ] **Security:**
  - ✅ Enable HTTPS (automatic on Render/Railway/Heroku)
  - ✅ Add rate limiting (already included in `app.py`)
  - ✅ Review CORS settings if needed

- [ ] **Monitoring:**
  - ✅ Set up uptime monitoring (UptimeRobot, Pingdom)
  - ✅ Configure log aggregation (Render has built-in logs)
  - ✅ Set up error alerts

### Recommended Setup

**Minimum (Free):**
- Render Web Service (Free tier)
- No Redis (in-memory state)
- Works great for demos and testing

**Standard ($7-10/month):**
- Render Web Service (Starter tier)
- Render Redis (Free 25MB or paid)
- Better performance, persistent state

**Production ($20+/month):**
- Render Web Service (Standard tier)
- Render Redis (Paid tier with backups)
- Multiple instances for high availability
- CDN for frontend assets

---

## 🎯 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```

### 2. Generate Code
```bash
curl -X POST https://your-app.onrender.com/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Write a function to check if a string is a palindrome"
  }'
```

### 3. Check Threads (if Redis enabled)
```bash
curl https://your-app.onrender.com/threads
```

### 4. Load Frontend
Open in browser:
```
https://your-app.onrender.com
```

---

## 📈 Scaling Tips

### Vertical Scaling (More Power)
- Upgrade instance type (Starter → Standard → Pro)
- Increases CPU and RAM
- Handles more concurrent requests

### Horizontal Scaling (More Instances)
- Deploy multiple instances
- Requires Redis for shared state
- Load balancer distributes traffic

### Optimization
1. **Cache frequent requests** (add caching layer)
2. **Use faster models** (already using Groq's fastest)
3. **Reduce iteration limit** (trade quality for speed)
4. **Enable CDN** for frontend assets

---

## 🆘 Support

### Getting Help

**Common Issues:**
- Check [Render Docs](https://render.com/docs)
- Review logs in Render dashboard
- Test locally first with `uvicorn app:app --reload`

**Still Stuck?**
1. Check GitHub Issues
2. Create new issue with:
   - Error message
   - Platform (Render/Railway/etc.)
   - Python version
   - Requirements.txt content

---

## ✅ Success Criteria

Your deployment is successful when:

✅ Health endpoint returns `{"status": "healthy"}`  
✅ POST /invoke generates code successfully  
✅ Frontend loads at root URL  
✅ Self-correction loop works (test with intentionally hard task)  
✅ Response times < 10 seconds  
✅ No errors in logs  

**Congratulations! Your LangGraph agent is live! 🎉**

---

**Last Updated:** August 9, 2026  
**Status:** Production Ready  
**Deployment:** Tested on Render, Railway, Heroku  
**Redis:** Optional (recommended for production)
