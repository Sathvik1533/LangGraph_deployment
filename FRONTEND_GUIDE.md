# Frontend Development Guide

## 🎯 What We're Building

A **professional workflow visualization dashboard** (NOT a chat interface) that shows your LangGraph agent's internal thinking process as it generates, tests, and fixes Python code.

---

## 📋 Quick Start

### Option 1: Use Stitch AI (Recommended)

1. **Open Stitch AI**: [stitch.ai](https://stitch.ai) or [v0.dev](https://v0.dev)

2. **Copy-paste this prompt**:

```
Build a professional web dashboard for a LangGraph self-correcting AI agent system that generates and fixes Python code. 

ARCHITECTURE TO VISUALIZE:
- Multi-agent workflow: User Task → Developer Agent → Tester Agent → Conditional Router → Results
- Self-correction loops: If code fails tests, automatically routes back to Developer (max 3 iterations)
- Full transparency: Show which agent is active, execution timeline, test results, code evolution

UI REQUIREMENTS:
1. WORKFLOW VISUALIZER (animated state machine graph)
   - Circle nodes for Developer (purple), Tester (cyan), Router (green/red)
   - Animated arrows showing data flow
   - Pulsing glow on active node
   - Retry counter badge when looping back

2. TASK INPUT PANEL
   - Large comfortable textarea with example prompts
   - "Generate Code" button with loading states
   - Quick template suggestions dropdown

3. CODE DISPLAY
   - Syntax-highlighted editor (Monaco or Prism)
   - Tabs for multiple iterations
   - Diff view showing changes when agent fixes code
   - Copy/Download buttons

4. EXECUTION TIMELINE (vertical stepper)
   - Shows: Developer → Tester → Decision with time taken
   - Real-time progress indicators
   - Retry badges

5. EXECUTION REPORT
   - Tabs: Tests | Output | Errors | Metrics
   - Green checkmarks for passed tests
   - Red X for failures

DESIGN STYLE:
- Clean, modern, professional (like Vercel dashboard or GitHub Actions UI)
- Colors: Blue primary (#2563eb), Purple developer (#8b5cf6), Cyan tester (#06b6d4), Green success (#10b981), Red error (#ef4444)
- White background with subtle shadows
- Smooth animations with Framer Motion
- NO dark terminal aesthetic, NO neon colors, NO generic chat interface

TECH STACK:
- Next.js 14 + TypeScript + Tailwind CSS
- shadcn/ui for components
- Monaco Editor for code display
- Framer Motion for animations
- React Flow for workflow graph

API INTEGRATION:
- Endpoint: POST http://localhost:8000/invoke
- Request: {"task": "Write a function to calculate fibonacci"}
- Response: {"success": true, "code": "...", "report": "...", "execution_success": true, "iterations": 1}

Build this as a professional workflow visualization tool that makes the AI agent's thinking process transparent and delightful.
```

3. **Let it generate** → Stitch will create the full frontend

4. **Download/Export** the generated code

---

### Option 2: Manual Setup

If you want to build manually:

```bash
# Create Next.js app
npx create-next-app@latest langgraph-ui --typescript --tailwind --app

cd langgraph-ui

# Install dependencies
npm install @radix-ui/react-* framer-motion monaco-editor lucide-react react-flow-renderer

# Install shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card tabs textarea badge
```

---

## 🏗️ Key Components to Build

### 1. WorkflowGraph Component
```typescript
// Shows animated state machine
interface WorkflowGraphProps {
  currentNode: 'developer' | 'tester' | 'router';
  iteration: number;
  maxIterations: number;
}
```

### 2. CodeEditor Component
```typescript
// Syntax-highlighted code display
interface CodeEditorProps {
  code: string;
  language: 'python';
  readOnly: boolean;
  onChange?: (code: string) => void;
}
```

### 3. ExecutionTimeline Component
```typescript
// Vertical stepper showing progress
interface TimelineStep {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration: number;
}
```

### 4. TaskInput Component
```typescript
// Large textarea with submit
interface TaskInputProps {
  onSubmit: (task: string) => void;
  loading: boolean;
}
```

---

## 🔌 API Integration

### Fetch Function
```typescript
async function generateCode(task: string) {
  const response = await fetch('http://localhost:8000/invoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate code');
  }
  
  return response.json();
}
```

### Response Type
```typescript
interface AgentResponse {
  success: boolean;
  code: string;
  report: string;
  execution_success: boolean;
  iterations: number;
  error?: string;
}
```

### Usage Example
```typescript
const [loading, setLoading] = useState(false);
const [result, setResult] = useState<AgentResponse | null>(null);

async function handleSubmit(task: string) {
  setLoading(true);
  try {
    const data = await generateCode(task);
    setResult(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}
```

---

## 🎨 Design Tokens

### Colors (Add to Tailwind Config)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'agent-developer': '#8b5cf6',  // Purple
        'agent-tester': '#06b6d4',     // Cyan
        'agent-success': '#10b981',    // Green
        'agent-error': '#ef4444',      // Red
        'agent-warning': '#f59e0b',    // Amber
      }
    }
  }
}
```

### Animations
```css
/* Add to globals.css */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
  50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.8); }
}

.node-active {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## 📱 Responsive Layout

### Desktop (1440px+)
```
┌─────────────────────────────────────────┐
│  [Graph]    [Code/Input]    [Timeline]  │
└─────────────────────────────────────────┘
```

### Tablet (768-1439px)
```
┌─────────────────────┐
│      [Graph]        │
│   [Code/Input]      │
│     [Timeline]      │
└─────────────────────┘
```

### Mobile (<768px)
```
┌─────────┐
│ [Badge] │ (Compact workflow)
│ [Input] │
│ [Code]  │
│ [Report]│
└─────────┘
```

---

## 🎯 User Flow Example

1. **User lands** → See empty state with example tasks
2. **Enter task** → "Write a function to reverse a string"
3. **Click Generate** → Button shows loading spinner
4. **Developer node pulses** → Purple glow, "Generating..." label
5. **Code appears** → Typewriter animation (optional)
6. **Tester node pulses** → Cyan glow, "Testing..." label
7. **Tests pass** → Green checkmark, confetti animation
8. **Show results** → Code in editor, tests in report panel

### Error Flow (Retry)
1. **Tests fail** → Red X appears
2. **Graph shows loop** → Curved arrow back to Developer
3. **Badge updates** → "🔄 Retry 1/3"
4. **New iteration tab** → "Iteration 2" appears
5. **Diff view** → Shows what changed
6. **Eventually passes** → "✓ Success after 2 iterations"

---

## 🧪 Testing Your Frontend

### 1. Test with Mock Data First
```typescript
// Mock response for testing UI
const mockResponse: AgentResponse = {
  success: true,
  code: 'def reverse_string(s):\n    return s[::-1]',
  report: '### EXECUTION OUTPUT:\nSuccess\n### TEST SCENARIOS:\n1. ✓ Test empty string\n2. ✓ Test single char',
  execution_success: true,
  iterations: 1
};
```

### 2. Test API Connection
```bash
# In one terminal, run backend
cd LangGraph_deployment
uvicorn app:app --reload

# In another terminal, test endpoint
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{"task": "Write hello world"}'
```

### 3. Test Frontend
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🚀 Deployment

### Deploy Frontend (Vercel)
```bash
# Push frontend to GitHub
git init
git add .
git commit -m "Initial frontend"
git push origin main

# Deploy to Vercel
npx vercel
```

### Update API URL for Production
```env
# .env.production
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🎨 Advanced Enhancements

Once basic UI works, add:

1. **Real-time updates** → WebSocket connection for live streaming
2. **History sidebar** → Show previous tasks with timestamps
3. **Share functionality** → Generate shareable URLs
4. **Dark mode** → Toggle between light/dark themes
5. **Code playground** → Let users edit and re-run code
6. **Voice input** → Speak your coding task
7. **Analytics** → Track success rates, popular tasks

---

## 📚 Resources

### Design Inspiration
- [Vercel Dashboard](https://vercel.com)
- [GitHub Actions UI](https://github.com/features/actions)
- [Linear App](https://linear.app)
- [Stripe Docs](https://stripe.com/docs/api)

### Component Libraries
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)
- [Framer Motion](https://www.framer.com/motion)
- [React Flow](https://reactflow.dev)

### Code Editors
- [Monaco Editor](https://microsoft.github.io/monaco-editor)
- [CodeMirror](https://codemirror.net)
- [Prism.js](https://prismjs.com)

---

## ❓ FAQ

**Q: Can I use Vue/Angular instead of React?**  
A: Yes! The architecture concepts apply to any framework. Just adapt the component structure.

**Q: Do I need to use Next.js?**  
A: No, you can use Vite + React, Create React App, or any other setup. Next.js is just recommended for easy deployment.

**Q: How do I handle CORS errors?**  
A: The backend (app.py) already has CORS enabled. If you still get errors, check your API URL.

**Q: Can I make the code editor editable?**  
A: Yes! Just set `readOnly: false` in Monaco Editor and add a "Re-run" button.

**Q: How do I add dark mode?**  
A: Use `next-themes` package and toggle between light/dark Tailwind classes.

---

**Ready to build? Copy the Stitch AI prompt above and let's go! 🚀**
