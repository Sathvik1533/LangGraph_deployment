# Testing the Interactive Frontend

## 🚀 Quick Start

### 1. Start the Backend

```bash
# Make sure you're in the project directory
cd LangGraph_deployment

# Activate virtual environment (if using one)
# source venv/bin/activate

# Start the FastAPI server
uvicorn app:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 2. Open the Frontend

**Option A: Direct File**
```bash
open index.html
```

**Option B: Simple HTTP Server (Recommended)**
```bash
# Python 3
python3 -m http.server 8080

# Then open: http://localhost:8080
```

### 3. Test the UI

1. **Enter a task**: "Write a function to calculate fibonacci numbers"
2. **Click "Generate Code"** or press `Cmd/Ctrl + Enter`
3. **Watch the magic happen**:
   - Workflow nodes light up with pulse animations
   - Timeline updates in real-time
   - Code appears with typewriter effect (optional)
   - Tests run and results display
   - Confetti celebrates success! 🎉

---

## 🎨 Features to Test

### Workflow Visualization
- [ ] Start node lights up green
- [ ] Developer node pulses purple during code generation
- [ ] Tester node pulses cyan during testing
- [ ] Decision node evaluates results
- [ ] Retry arrow appears if iterations > 1
- [ ] End node shows checkmark on success

### Code Display
- [ ] Syntax highlighting works
- [ ] Copy button copies code to clipboard
- [ ] Download button saves as .py file
- [ ] Code displays correctly

### Timeline
- [ ] Real-time step updates
- [ ] Time duration shows for each step
- [ ] Iteration badge appears on retry
- [ ] Status icons (✓, ⏳, ✗) display correctly

### Reports
- [ ] **Tests tab**: Shows pass/fail with green/red icons
- [ ] **Output tab**: Displays execution output
- [ ] **Metrics tab**: Shows time, iterations, status
- [ ] Bottom summary always visible

### Interactions
- [ ] Quick example buttons populate task input
- [ ] Clear button resets everything
- [ ] New Run button starts fresh
- [ ] Toast notifications appear
- [ ] Confetti on success
- [ ] Shake animation on error

---

## 🧪 Test Cases

### Test 1: Simple Success (1 iteration)
```
Task: "Write a function to reverse a string"
Expected: Success in ~2s, 1 iteration
```

### Test 2: Self-Correction (2+ iterations)
```
Task: "Write a recursive factorial with memoization"
Expected: May require 2-3 iterations to fix recursion errors
```

### Test 3: Edge Cases
```
Task: "Write a function to check if a number is prime"
Expected: Should handle edge cases like negative numbers
```

### Test 4: Error Handling
```
Stop the backend and click Generate
Expected: Red error toast, shake animation on button
```

---

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in console:
```
Access to fetch at 'http://localhost:8000/invoke' from origin 'file://' has been blocked
```

**Solution**: Use the HTTP server method (Option B above) instead of opening the file directly.

### Backend Not Running
```
TypeError: Failed to fetch
```

**Solution**: Make sure FastAPI is running on http://localhost:8000

Check with:
```bash
curl http://localhost:8000/
# Should return: {"status":"ok",...}
```

### API Key Issues
```
RuntimeError: GROQ_API_KEY environment variable not set
```

**Solution**: Check your `.env` file has:
```
GROQ_API_KEY=your_api_key_here
```

---

## 📊 Performance Expectations

| Metric | Expected Value |
|--------|---------------|
| **Total Time** | 2-5 seconds |
| **Developer Step** | 1-2 seconds |
| **Tester Step** | 0.5-1 second |
| **Iterations** | 1-3 (usually 1) |

---

## 🎬 Video Demo Flow

1. Open frontend in browser
2. Click "Fibonacci" quick example
3. Click "Generate Code"
4. Watch workflow animation:
   - Purple pulse on Developer
   - Cyan pulse on Tester
   - Green checkmark on Decision
5. Code appears in center panel
6. Tests show all passing (green checkmarks)
7. Confetti celebration! 🎉
8. Check metrics: ~2s total, 1 iteration

---

## 🚢 Deployment Testing

### Test on Render (Production)

Once deployed, update the API URL in `index.html`:

```javascript
// Line ~520
const API_URL = 'https://your-app-name.onrender.com/invoke';
```

Then test the same workflows to ensure production API works.

---

## ✅ Success Criteria

Your frontend is working correctly if:

- ✅ All workflow nodes animate smoothly
- ✅ API calls succeed and return code
- ✅ Tests display with pass/fail status
- ✅ Confetti plays on success
- ✅ No console errors
- ✅ Mobile responsive (test on phone)
- ✅ Copy/download work
- ✅ All animations are smooth (60fps)

---

## 🎉 Next Steps

Once testing is complete:

1. **Deploy frontend** to Netlify/Vercel (static hosting)
2. **Update API URL** to production backend
3. **Add analytics** (optional)
4. **Share with users**! 

---

**Happy Testing! 🚀**
