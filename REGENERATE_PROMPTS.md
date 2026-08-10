# 🔄 REGENERATE PROMPTS - Missing Screens

Stitch AI generated Material Design pages (wrong system). Use these prompts to regenerate with correct Neo-Brutalist design.

---

## 🎯 SCREEN 1: CODE GENERATOR (pages/generate.html)

**Copy this ENTIRE prompt into Stitch AI:**

```markdown
# CODE GENERATOR SCREEN - Neo-Brutalist Design

## LOCKED DESIGN SYSTEM (DO NOT DEVIATE)

### Colors
- Background: #FFFFFF (pure white)
- Text primary: #000000 (pure black)
- Text secondary: #64748b (slate)
- Primary accent: #0066FF (electric blue)
- Success: #00FF88 (neon green)
- Error: #FF0055 (hot pink)
- Borders: #000000 (pure black, 3px width)

### Typography
- Display: Space Grotesk Bold, 56px
- H2: Space Grotesk Bold, 32px
- Body: Inter Regular, 16px, line-height 1.6
- Code: JetBrains Mono, 14px, tabular-nums

### Shadows (Hard, NO Blur)
- Cards: 6px 6px 0 #000
- Buttons hover: 8px 8px 0 #000
- Active: 2px 2px 0 #000

### Borders & Radius
- Border width: 3px solid black ONLY
- Border radius: 4px maximum (prefer 0px)

### Spacing
- Section gaps: 64px
- Card padding: 32px
- Component gaps: 24px
- Button height: 56px minimum
- Input height: 48px minimum

---

## LAYOUT STRUCTURE

### Sidebar (Fixed 280px)
```html
<aside class="fixed w-[280px] h-screen border-r-[3px] border-black bg-white">
  <!-- Logo + Title -->
  <div class="p-6 border-b-[3px] border-black">
    <div class="text-2xl font-bold text-black">LangGraph</div>
    <div class="text-sm text-slate-600">Self-Correcting Agent</div>
  </div>
  
  <!-- Navigation -->
  <nav class="p-4">
    <a href="/" class="nav-link">Dashboard</a>
    <a href="/generate" class="nav-link active">Code Generator</a>
    <a href="/workflow" class="nav-link">Workflow</a>
    <a href="/execution" class="nav-link">Execution</a>
    <a href="/history" class="nav-link">History</a>
  </nav>
</aside>
```

**Nav Link Styles:**
- Default: padding 12px 16px, rounded 8px, transition 150ms
- Hover: background #f8f9ff
- Active: background #000, color #fff, border-left 4px solid #0066FF

### Main Content (ml-[280px])
```html
<main class="ml-[280px] p-16 max-w-[1400px]">
  <!-- Hero Header -->
  <section class="mb-16">
    <h1 class="text-[56px] font-bold text-black mb-4">Code Generator</h1>
    <p class="text-lg text-slate-600 max-w-2xl">
      Describe your logic in plain English. LangGraph will architect and write production-ready code.
    </p>
  </section>
  
  <!-- Two Column Grid -->
  <div class="grid grid-cols-[1.5fr_1fr] gap-8">
    <!-- Left: Task Input Card -->
    <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8 rounded-lg">
      <label class="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
        Task Description
      </label>
      <textarea 
        id="taskInput"
        class="w-full h-[200px] p-4 border-[3px] border-black rounded-lg text-base resize-none"
        placeholder="What do you want to build? Example: Create a function that implements a binary search tree..."
      ></textarea>
      
      <!-- Example chips -->
      <div class="flex gap-2 mt-4 flex-wrap">
        <button class="chip">Fibonacci generator</button>
        <button class="chip">Prime number checker</button>
        <button class="chip">REST API template</button>
      </div>
    </div>
    
    <!-- Right: Language + Generate Button -->
    <div class="flex flex-col gap-8">
      <!-- Language Card -->
      <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8 rounded-lg">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-4">
          Target Language
        </h3>
        <div class="flex flex-col gap-3">
          <label class="lang-option active">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🐍</span>
              <span class="font-bold">Python</span>
            </div>
            <input type="radio" name="language" value="python" checked />
          </label>
          <label class="lang-option">
            <div class="flex items-center gap-3">
              <span class="text-2xl">☕</span>
              <span class="font-bold">Java</span>
            </div>
            <input type="radio" name="language" value="java" />
          </label>
          <label class="lang-option">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⚡</span>
              <span class="font-bold">C++</span>
            </div>
            <input type="radio" name="language" value="cpp" />
          </label>
        </div>
      </div>
      
      <!-- Generate Button -->
      <button 
        id="generateBtn"
        class="h-[72px] bg-black text-white border-[3px] border-black shadow-[6px_6px_0_#000] rounded-lg text-xl font-bold hover:shadow-[8px_8px_0_#000] hover:-translate-y-1 active:translate-y-1 active:shadow-[2px_2px_0_#000] transition-all"
      >
        GENERATE CODE
      </button>
    </div>
  </div>
  
  <!-- Code Output (Initially Hidden) -->
  <section id="outputSection" class="mt-16 hidden">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold text-black">Generated Output</h2>
      <div class="flex gap-3">
        <button class="action-btn">
          <span class="material-symbols-outlined">content_copy</span> Copy
        </button>
        <button class="action-btn">
          <span class="material-symbols-outlined">download</span> Download
        </button>
      </div>
    </div>
    
    <div class="bg-black border-[3px] border-white shadow-[6px_6px_0_#00FF88] p-8 rounded-lg">
      <pre class="text-[#00FF88] font-mono text-sm" id="codeBlock">
        # Generated code appears here...
      </pre>
    </div>
  </section>
</main>
```

---

## COMPONENT CSS

```css
/* Chips */
.chip {
  padding: 8px 16px;
  border: 2px solid #000;
  border-radius: 20px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease-out;
}
.chip:hover {
  background: #000;
  color: #fff;
  box-shadow: 4px 4px 0 #000;
}

/* Language Options */
.lang-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 3px solid #e5eeff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms;
}
.lang-option.active {
  border-color: #000;
  background: #000;
  color: #fff;
}
.lang-option:hover:not(.active) {
  border-color: #0066FF;
  background: #f8f9ff;
}

/* Action Buttons */
.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 3px solid #000;
  border-radius: 8px;
  background: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
}
.action-btn:hover {
  background: #000;
  color: #fff;
  box-shadow: 4px 4px 0 #000;
}
```

---

## JAVASCRIPT INTEGRATION

```javascript
// Backend Integration
const generateBtn = document.getElementById('generateBtn');
const taskInput = document.getElementById('taskInput');
const outputSection = document.getElementById('outputSection');
const codeBlock = document.getElementById('codeBlock');

generateBtn.addEventListener('click', async () => {
  const task = taskInput.value.trim();
  const language = document.querySelector('input[name="language"]:checked').value;
  
  if (!task) {
    alert('Please enter a task description');
    return;
  }
  
  // Show loading state
  generateBtn.textContent = 'GENERATING...';
  generateBtn.disabled = true;
  
  try {
    const response = await fetch('/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, language })
    });
    
    const data = await response.json();
    
    // Show output
    outputSection.classList.remove('hidden');
    codeBlock.textContent = data.code;
    
    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    alert('Error generating code: ' + error.message);
  } finally {
    generateBtn.textContent = 'GENERATE CODE';
    generateBtn.disabled = false;
  }
});

// Language selection
document.querySelectorAll('.lang-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
    option.classList.add('active');
    option.querySelector('input').checked = true;
  });
});
```

---

## REQUIREMENTS CHECKLIST
- [ ] Pure black #000 borders (3px)
- [ ] Hard shadows (6px offset, NO blur)
- [ ] Space Grotesk Bold for headings
- [ ] Border radius ≤ 4px
- [ ] All touch targets ≥ 44px
- [ ] Sidebar navigation with active state
- [ ] Button hover: lift + shadow increase
- [ ] Button active: press down effect
- [ ] Keyboard shortcut: Cmd+Enter to generate
- [ ] Focus states visible
- [ ] NO gradients anywhere
- [ ] NO Material Design tokens

Generate complete HTML with inline styles and JavaScript.
```

---

## 🎯 SCREEN 2: HISTORY PAGE (pages/history.html)

**Copy this ENTIRE prompt into Stitch AI:**

```markdown
# HISTORY PAGE - Neo-Brutalist Design

## LOCKED DESIGN SYSTEM (Same as Code Generator)
[Use exact same color/typography/shadow/border tokens as above]

## LAYOUT STRUCTURE

### Same Sidebar (280px)
[Copy exact sidebar from Code Generator]

### Main Content
```html
<main class="ml-[280px] p-16 max-w-[1400px]">
  <!-- Hero Header -->
  <section class="mb-16">
    <h1 class="text-[56px] font-bold text-black mb-4">Generation History</h1>
    <p class="text-lg text-slate-600 max-w-2xl">
      Browse and manage your past code generations.
    </p>
  </section>
  
  <!-- Filter Bar -->
  <div class="flex gap-4 mb-8 flex-wrap">
    <!-- Search -->
    <input 
      type="search"
      placeholder="Search generations..."
      class="flex-1 min-w-[300px] h-[48px] px-4 border-[3px] border-black rounded-lg"
    />
    
    <!-- Language Filters -->
    <button class="filter-chip active">All</button>
    <button class="filter-chip">🐍 Python</button>
    <button class="filter-chip">☕ Java</button>
    <button class="filter-chip">⚡ C++</button>
    
    <!-- Status Filters -->
    <button class="filter-chip">✅ Success</button>
    <button class="filter-chip">❌ Failed</button>
  </div>
  
  <!-- History Cards Grid -->
  <div class="grid grid-cols-1 gap-6">
    <!-- History Card -->
    <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8 rounded-lg hover:shadow-[8px_8px_0_#000] hover:-translate-y-1 transition-all">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-black mb-2">
            Fibonacci Sequence Generator
          </h3>
          <div class="flex gap-4 text-sm text-slate-600">
            <span>🐍 Python</span>
            <span>•</span>
            <span>2 hours ago</span>
            <span>•</span>
            <span>3 iterations</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <span class="status-badge success">✅ Success</span>
          <button class="icon-btn">
            <span class="material-symbols-outlined">visibility</span>
          </button>
          <button class="icon-btn">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
      
      <!-- Code Preview -->
      <div class="bg-black border-[2px] border-white p-4 rounded-lg">
        <pre class="text-[#00FF88] font-mono text-xs line-clamp-3">
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)
        </pre>
      </div>
    </div>
    
    <!-- Repeat for more cards -->
  </div>
  
  <!-- Empty State (if no history) -->
  <div id="emptyState" class="hidden text-center py-24">
    <span class="material-symbols-outlined text-[80px] text-slate-300">history</span>
    <h3 class="text-2xl font-bold text-black mt-6 mb-2">No Generation History</h3>
    <p class="text-slate-600 mb-8">Start by generating your first code</p>
    <a href="/generate" class="inline-block px-8 py-4 bg-black text-white border-[3px] border-black shadow-[6px_6px_0_#000] rounded-lg font-bold hover:shadow-[8px_8px_0_#000] hover:-translate-y-1 transition-all">
      Generate Code
    </a>
  </div>
</main>
```

---

## COMPONENT CSS

```css
/* Filter Chips */
.filter-chip {
  padding: 10px 20px;
  border: 3px solid #e5eeff;
  border-radius: 20px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
}
.filter-chip:hover {
  border-color: #0066FF;
  background: #f8f9ff;
}
.filter-chip.active {
  border-color: #000;
  background: #000;
  color: #fff;
}

/* Status Badge */
.status-badge {
  padding: 6px 12px;
  border: 2px solid #000;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}
.status-badge.success {
  background: #00FF88;
  color: #000;
}
.status-badge.failed {
  background: #FF0055;
  color: #fff;
}

/* Icon Buttons */
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 150ms;
}
.icon-btn:hover {
  background: #000;
  color: #fff;
}
```

---

## JAVASCRIPT INTEGRATION

```javascript
// Load history from localStorage
function loadHistory() {
  const history = JSON.parse(localStorage.getItem('recentGenerations') || '[]');
  const container = document.querySelector('.grid');
  const emptyState = document.getElementById('emptyState');
  
  if (history.length === 0) {
    container.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  container.innerHTML = history.map(item => `
    <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8 rounded-lg hover:shadow-[8px_8px_0_#000] hover:-translate-y-1 transition-all">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-black mb-2">${item.task}</h3>
          <div class="flex gap-4 text-sm text-slate-600">
            <span>${getLanguageEmoji(item.language)} ${item.language}</span>
            <span>•</span>
            <span>${timeAgo(item.timestamp)}</span>
          </div>
        </div>
        <span class="status-badge ${item.success ? 'success' : 'failed'}">
          ${item.success ? '✅ Success' : '❌ Failed'}
        </span>
      </div>
      <div class="bg-black border-[2px] border-white p-4 rounded-lg">
        <pre class="text-[#00FF88] font-mono text-xs line-clamp-3">${item.code}</pre>
      </div>
    </div>
  `).join('');
}

// Filters
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    // Filter logic here
  });
});

loadHistory();
```

---

## REQUIREMENTS CHECKLIST
- [ ] Same sidebar as Code Generator
- [ ] Same design tokens (colors, shadows, borders)
- [ ] Filter chips with active states
- [ ] Status badges (success/failed)
- [ ] Card hover effects (lift + shadow)
- [ ] Empty state with CTA
- [ ] localStorage integration
- [ ] Search functionality
- [ ] Delete confirmation modal
- [ ] NO gradients
- [ ] NO Material Design

Generate complete HTML with inline styles and JavaScript.
```

---

## ✅ AFTER GENERATION

1. Paste Code Generator HTML into `pages/generate.html`
2. Paste History HTML into `pages/history.html`
3. Tell me: "Both screens pasted"
4. I'll integrate with FastAPI backend
