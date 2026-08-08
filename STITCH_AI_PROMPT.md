# Stitch AI Prompt: LangGraph Self-Correcting Agent UI

## 🎯 Project Overview

Build a **professional, modern frontend** for a **LangGraph-powered self-correcting AI agent** that generates Python code, automatically tests it, and iteratively fixes errors.

**NOT A CHAT INTERFACE!** This is a **workflow visualization platform** showing the agent's internal thinking process.

---

## 🏗️ Backend Architecture (What You're Visualizing)

The backend is a **multi-agent system** with this workflow:

```
User Task → Developer Agent → Tester Agent → Decision Point
                ↑                                    ↓
                └──── (if failed, max 3x) ──────────┘
                                                     ↓
                                           (if passed) → Results
```

**Key Backend Characteristics:**
- **Self-correction loops**: Agent learns from failures and retries (max 3 iterations)
- **Dual-agent architecture**: Developer creates code, Tester validates it
- **Intelligent routing**: Conditional logic decides retry vs. completion
- **Full execution transparency**: Shows test cases, outputs, errors, iterations

**API Endpoint:** `POST /invoke`
```json
// Request
{
  "task": "Write a function to calculate fibonacci numbers"
}

// Response
{
  "success": true,
  "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "report": "### EXECUTION OUTPUT:\n...\n### TEST SCENARIOS:\n...",
  "execution_success": true,
  "iterations": 1
}
```

---

## 🎨 Design Requirements

### ❌ What NOT to Build:
- Generic chat interfaces (like ChatGPT clones)
- Dark terminal-style UIs with green/blue neon text
- Slope/Vercel v0 default templates
- Boring left-sidebar layouts
- Static forms with submit buttons

### ✅ What TO Build:

A **workflow visualization dashboard** that shows:

1. **Live agent state machine** (visual graph showing which node is active)
2. **Step-by-step execution timeline** (like CI/CD pipeline visualization)
3. **Code evolution viewer** (side-by-side diffs when agent fixes code)
4. **Interactive code playground** (user can edit task, see results)
5. **Execution metrics** (iterations, success rate, time per step)

---

## 🖼️ Visual Design Inspirations

### Style References:
- **Vercel's deployment dashboard** - Clean, modern, real-time updates
- **GitHub Actions workflow view** - Step-by-step execution visualization
- **Retool's app builder** - Professional business tool aesthetic
- **Linear's project interface** - Minimalist, smooth animations
- **Stripe's API docs** - Code examples with elegant syntax highlighting

### Color Palette (Modern Professional):
```css
/* Primary Colors */
--primary: #2563eb       /* Blue - main actions */
--success: #10b981       /* Green - passed tests */
--error: #ef4444         /* Red - failed tests */
--warning: #f59e0b       /* Amber - retrying */
--neutral: #64748b       /* Slate - text/borders */

/* Background Layers */
--bg-primary: #ffffff    /* Main background */
--bg-secondary: #f8fafc  /* Cards/sections */
--bg-tertiary: #f1f5f9   /* Subtle contrast */

/* Accents */
--accent-purple: #8b5cf6 /* Developer agent */
--accent-cyan: #06b6d4   /* Tester agent */
--accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

### Typography:
- **Headings**: Inter or Geist (clean, modern)
- **Body**: System font stack (fast, native)
- **Code**: JetBrains Mono or Fira Code (ligatures)

---

## 📐 Layout Structure

### Main View: 3-Panel Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] LangGraph Agent       [Status Badge] [Settings]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │   WORKFLOW       │  │   INPUT & RESULTS                │ │
│  │   VISUALIZER     │  │                                  │ │
│  │                  │  │  Task Input:                     │ │
│  │   ●─────▶●──┐    │  │  [Text area: Enter coding task] │ │
│  │   Dev   Test │    │  │                                  │ │
│  │         │    ▼    │  │  [Generate Code Button]         │ │
│  │         └──Retry  │  │                                  │ │
│  │            (2/3)  │  │  ┌────────────────────────────┐  │ │
│  │                  │  │  │  GENERATED CODE            │  │ │
│  │   Legend:        │  │  │  ----------------------    │  │ │
│  │   ● Active       │  │  │  def fibonacci(n):        │  │ │
│  │   ● Completed    │  │  │      ...                  │  │ │
│  │   ● Error        │  │  │                           │  │ │
│  │                  │  │  └────────────────────────────┘  │ │
│  └──────────────────┘  │                                  │ │
│                        │  ┌────────────────────────────┐  │ │
│  ┌──────────────────┐  │  │  EXECUTION REPORT          │  │ │
│  │   EXECUTION      │  │  │  • Test 1: ✓ Passed       │  │ │
│  │   TIMELINE       │  │  │  • Test 2: ✓ Passed       │  │ │
│  │                  │  │  │  • Output: [1, 1, 2, 3]   │  │ │
│  │  1. Developer ✓  │  │  └────────────────────────────┘  │ │
│  │     └ 1.2s       │  │                                  │ │
│  │  2. Tester ✓     │  │  [Copy Code] [Download] [Share] │ │
│  │     └ 0.8s       │  │                                  │ │
│  │  3. ✓ Success    │  │                                  │ │
│  │                  │  │                                  │ │
│  │  Iterations: 1/3 │  │                                  │ │
│  │  Total: 2.0s     │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 Component Specifications

### 1. Workflow Visualizer (Top Left)
**Component Type:** Animated state machine graph

**Features:**
- **Nodes**: Circle avatars for Developer, Tester, Router
- **Edges**: Animated arrows showing data flow
- **Active state**: Pulsing glow on current node
- **Retry loops**: Curved arrow back to Developer with iteration counter
- **Colors**: Purple for Developer, Cyan for Tester, Green/Red for Router

**Animation:**
```
Idle → Pulsing → Completed (checkmark) → Error (X mark)
```

**Tech Suggestion:** 
- Use React Flow or D3.js for graph
- Framer Motion for smooth transitions
- Real-time updates via WebSocket or polling

---

### 2. Task Input Panel (Top Right)

**Features:**
- Large, comfortable textarea (minimum 3 lines)
- Placeholder with example tasks:
  - "Write a function to sort a list using quicksort"
  - "Create a class for managing a shopping cart"
  - "Build a decorator for timing function execution"
- Auto-resize as user types
- Character count indicator
- "Generate Code" button with loading state
- Quick task templates (dropdowns with common patterns)

**Interaction States:**
- **Idle**: Soft shadow, blue border on focus
- **Loading**: Button shows spinner, disables input
- **Success**: Green checkmark animation
- **Error**: Red shake animation

---

### 3. Code Display (Middle Right)

**Features:**
- Syntax-highlighted code editor (read-only or editable)
- Line numbers
- Copy button (with toast notification)
- Download as .py file
- Diff view when code is revised (shows what changed)
- Tabs if multiple iterations: "Iteration 1", "Iteration 2", "Iteration 3"

**Tech Suggestion:**
- Monaco Editor (VSCode's editor) or Prism.js
- React Diff Viewer for showing changes
- Add "Run in Browser" button (using Pyodide/WASM)

---

### 4. Execution Timeline (Bottom Left)

**Component:** Vertical stepper/timeline

**Structure:**
```
┌─────────────────────────┐
│ 1. Developer Agent      │ ← Active (pulsing)
│    ⏱ 1.2s               │
│    └ "Generating code"  │
├─────────────────────────┤
│ 2. Tester Agent         │ ← Waiting (greyed)
│    ⏱ 0.0s               │
│    └ "Pending"          │
├─────────────────────────┤
│ 3. Decision             │ ← Waiting
│    └ "Evaluating"       │
└─────────────────────────┘
```

**Features:**
- Real-time progress indicators
- Expandable sections (click to see details)
- Time per step
- Success/error icons
- Retry counter badge ("🔄 Retry 2/3")

---

### 5. Execution Report (Bottom Right)

**Features:**
- Tabbed interface:
  - **Tests**: List of test scenarios with pass/fail
  - **Output**: Console output from code execution
  - **Errors**: Stack traces (if any)
  - **Metrics**: Iterations, time, token usage

**Example Test Display:**
```
✓ Test 1: Standard case (n=5)
  Expected: [0, 1, 1, 2, 3]
  Got: [0, 1, 1, 2, 3]
  
✓ Test 2: Edge case (n=0)
  Expected: [0]
  Got: [0]
  
✗ Test 3: Large input (n=1000)
  Error: RecursionError: maximum recursion depth exceeded
```

**Styling:**
- Green checkmarks for passed tests
- Red X for failed tests
- Collapsible error details
- Markdown rendering for formatted reports

---

## 🎬 Animations & Interactions

### Micro-interactions:
1. **Button hover**: Subtle lift (translateY: -2px) with shadow increase
2. **Card hover**: Glow effect on borders
3. **Loading states**: Skeleton screens (not spinners)
4. **Success**: Confetti animation (use react-confetti)
5. **Error**: Gentle shake (use framer-motion)
6. **Code generation**: Typewriter effect (character-by-character reveal)
7. **Node transitions**: Smooth color morphing (300ms ease-in-out)

### Page transitions:
- Fade-in on mount
- Stagger children animations (cards appear one by one)
- No jarring layout shifts

---

## 📱 Responsive Behavior

### Desktop (1440px+):
- 3-column layout as shown above
- Full workflow graph visible

### Tablet (768px - 1439px):
- 2-column layout
- Workflow graph collapses to horizontal stepper
- Timeline moves below code display

### Mobile (< 768px):
- Single column, scrollable
- Workflow becomes compact badges ("Dev ✓ → Test 🔄 → Done")
- Code editor still full-width
- Bottom sheet for execution report

---

## 🔧 Technical Stack Recommendations

### Framework:
- **Next.js 14+ (App Router)** or **Vite + React 18**
- TypeScript for type safety

### UI Libraries:
- **Tailwind CSS** for styling (with custom config for colors above)
- **shadcn/ui** or **Radix UI** for accessible components
- **Framer Motion** for animations
- **Lucide React** for icons

### Code Display:
- **Monaco Editor** (full-featured) or **Prism.js** (lightweight)
- **React Syntax Highlighter** with Dracula or GitHub themes

### State Management:
- **Zustand** or **React Query** for API state
- **WebSocket** or **polling** for real-time updates

### Data Fetching:
```typescript
async function generateCode(task: string) {
  const response = await fetch('http://localhost:8000/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task })
  });
  return response.json();
}
```

---

## 🎯 Key User Flows

### Happy Path (Success on First Try):
1. User types task: "Write a function to reverse a string"
2. Clicks "Generate Code"
3. **Workflow graph**: Developer node lights up (purple pulse)
4. **Timeline**: "Developer Agent" shows "Generating..." with spinner
5. After 1.5s: Code appears in editor with typewriter effect
6. **Workflow graph**: Arrow animates to Tester node (cyan pulse)
7. **Timeline**: "Tester Agent" shows "Testing..." 
8. After 0.8s: Tests pass, green checkmark appears
9. **Report panel**: Shows test results with ✓ marks
10. **Success animation**: Confetti + green success badge
11. **Metrics**: "✓ Success in 2.3s (1 iteration)"

### Error Path (Requires Retry):
1. User types task: "Write a recursive factorial with memoization"
2. Clicks "Generate Code"
3. Developer generates code → Tester runs tests
4. **Error detected**: Stack overflow on large input
5. **Workflow graph**: Red arrow loops back to Developer
6. **Badge appears**: "🔄 Retry 1/3"
7. **Timeline adds step**: "4. Developer Agent (Retry 1)"
8. **Diff view**: Shows what changed in code (added memoization)
9. Tester runs again → Success!
10. **Final badge**: "✓ Success after 2 iterations"

---

## 🎨 Design Polish Details

### Cards & Containers:
```css
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}
```

### Status Badges:
- **Generating**: Blue with pulse animation
- **Testing**: Cyan with spinner
- **Success**: Green with checkmark
- **Error**: Red with X
- **Retrying**: Amber with circular arrow

### Typography Scale:
- H1 (Page title): 2.5rem (40px), bold
- H2 (Section): 1.875rem (30px), semibold
- H3 (Cards): 1.25rem (20px), medium
- Body: 1rem (16px), regular
- Code: 0.875rem (14px), monospace

---

## 📊 Advanced Features (V2 Ideas)

Once basic UI works, consider adding:

1. **History sidebar**: Previous tasks with timestamps
2. **Comparison mode**: Side-by-side view of multiple solutions
3. **Export options**: Share URL, download as Gist, copy as markdown
4. **Playground mode**: Edit generated code and re-test
5. **Analytics dashboard**: Success rate, avg iterations, popular tasks
6. **Dark mode**: Toggle with smooth transition
7. **Voice input**: Speak your coding task
8. **AI suggestions**: "You might also want to generate..."

---

## 🚀 Implementation Steps for Stitch AI

1. **Create Next.js project** with TypeScript + Tailwind
2. **Build layout structure** with 3-panel responsive grid
3. **Implement API integration** with fetch/axios
4. **Create workflow graph component** with React Flow
5. **Build code editor component** with Monaco
6. **Add timeline stepper** with status indicators
7. **Implement animations** with Framer Motion
8. **Add responsive breakpoints** for mobile
9. **Polish micro-interactions** and loading states
10. **Test end-to-end** with real API

---

## 📝 Example Prompt for Stitch AI

**"Build a modern web dashboard for a LangGraph AI agent that generates Python code. The UI should visualize the multi-agent workflow (Developer → Tester → Decision) with an animated state machine graph showing which agent is currently active. Include a large code editor with syntax highlighting, an execution timeline showing each step with time taken, and a detailed report panel showing test results. Use Next.js, TypeScript, Tailwind CSS, shadcn/ui components, Monaco Editor for code display, and Framer Motion for animations. The design should be professional (like Vercel's deployment dashboard), with blue/purple gradients for active states, green for success, and red for errors. No dark terminal aesthetic - keep it clean and modern with white background. The API endpoint is POST /invoke with body {task: string} returning {code, report, execution_success, iterations}. Add smooth animations when the workflow transitions between agents and show a retry counter badge when the agent self-corrects errors."**

---

## ✅ Success Criteria

Your UI should feel like:
- ✓ A **professional business tool**, not a side project
- ✓ A **workflow visualization**, not a chat interface  
- ✓ **GitHub Actions UI** meets **Vercel deployment dashboard**
- ✓ **Informative and delightful**, with smooth animations
- ✓ **Educational**, showing users how the agent thinks

---

**Now paste this into Stitch AI and let it build your frontend! 🚀**


---

## 🎯 COPY-PASTE PROMPT FOR STITCH AI

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
   - Tabs for multiple iterations: "Iteration 1", "Iteration 2", "Iteration 3"
   - Diff view showing what changed when agent fixes code
   - Copy/Download buttons

4. EXECUTION TIMELINE (vertical stepper)
   - Shows: Developer (1.2s) → Tester (0.8s) → Decision
   - Real-time progress with pulsing indicators
   - Expandable for details
   - Retry badges

5. EXECUTION REPORT
   - Tabs: Tests | Output | Errors | Metrics
   - Green checkmarks for passed tests
   - Red X with stack traces for failures
   - Collapsible sections

DESIGN STYLE:
- Clean, modern, professional (like Vercel dashboard or GitHub Actions UI)
- Colors: Blue primary (#2563eb), Purple developer (#8b5cf6), Cyan tester (#06b6d4), Green success (#10b981), Red error (#ef4444)
- White background with subtle shadows
- Smooth animations with Framer Motion
- NO dark terminal aesthetic, NO neon colors, NO generic chat interface

LAYOUT:
- 3-panel desktop: Workflow Graph (left) | Code Display (center) | Timeline + Report (right)
- Responsive: Collapses to vertical stack on mobile
- Typography: Inter/Geist for UI, JetBrains Mono for code

TECH STACK:
- Next.js 14 + TypeScript + Tailwind CSS
- shadcn/ui or Radix UI for components
- Monaco Editor for code display
- Framer Motion for animations
- React Flow or D3.js for workflow graph
- Lucide React for icons

API INTEGRATION:
- Endpoint: POST http://localhost:8000/invoke
- Request: {"task": "Write a function to calculate fibonacci"}
- Response: {"success": true, "code": "...", "report": "...", "execution_success": true, "iterations": 1}

KEY INTERACTIONS:
1. User enters task → Click "Generate"
2. Developer node pulses purple → Code appears with typewriter effect
3. Tester node pulses cyan → Tests run
4. If failed: Red arrow loops back, badge shows "Retry 2/3", diff view shows changes
5. If passed: Green success animation with confetti, show final metrics

INSPIRATION:
- Vercel deployment dashboard (clean, real-time updates)
- GitHub Actions workflow view (step-by-step execution)
- Linear app (minimalist, smooth animations)
- Stripe API docs (elegant code examples)

Build this as a professional workflow visualization tool that makes the AI agent's thinking process transparent and delightful to watch.
```

---

## 📸 Visual Mockup Reference

If Stitch AI asks for more clarity, describe this:

**"Imagine the Vercel deployment dashboard, but instead of showing build steps for a website, it's showing AI agent steps for code generation. The left side has an animated flowchart showing which AI agent is working. The center has a big code editor that updates in real-time. The right side has a timeline like GitHub Actions showing each step completing with checkmarks. When code fails, you see a red arrow loop back and a retry counter. When it succeeds, confetti animation. Clean white background, blue and purple accent colors, smooth animations everywhere."**

---

## 🛠️ Quick Setup After Stitch AI Generates Code

1. **Export project from Stitch AI**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update API endpoint** (in `.env.local`):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run frontend**:
   ```bash
   npm run dev
   ```

5. **Run backend** (in another terminal):
   ```bash
   cd LangGraph_deployment
   uvicorn app:app --reload
   ```

6. **Open browser**: `http://localhost:3000`

---

**You now have everything needed! Copy the prompt above into Stitch AI and watch it build your professional frontend! 🎉**
