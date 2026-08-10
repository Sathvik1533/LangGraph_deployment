# God-Level Stitch AI Prompts for LangGraph Dashboard (2026)

## Design Philosophy: UI Craft + Hallmark + Neo-Brutalism + Taste Skill + Impeccable

**Combined Power of 5 God-Tier Frameworks:**

1. **UI Craft (52 gates)** - Design engineering from Stripe/Linear/Vercel patterns
2. **Hallmark (58 gates)** - Structural variety, anti-slop discipline
3. **Neo-Brutalism 2026** - Hard shadows, thick borders, raw intentionality
4. **Taste Skill v2** - Spacing discipline, generous white space
5. **Impeccable (59 rules)** - Visual hierarchy, accessibility

**What Makes This God-Level:**
- **110 combined anti-slop gates** (zero AI-generated tells)
- **Deterministic 0-100 scoring** (UICraftScore for CI)
- **Raw by design:** Exposed structure, not hidden polish
- **High contrast:** Bold blacks, pure whites, vibrant accents
- **Hard shadows:** 4-8px offset shadows with NO blur
- **Thick borders:** 2-4px solid black borders on everything
- **Oversized typography:** Headlines that command attention
- **Intentional asymmetry:** Broken grids that feel hand-built
- **Geometric shapes:** Squares, rectangles, no soft rounded corners (0-4px max)

**Inspiration Sources:**
- Linear's command palette (sharp, fast, confident)
- Vercel Dashboard (clean data hierarchy, bold CTAs)
- Gumroad (raw blocks, thick borders, offset shadows)
- Stripe Dashboard (precision, no fluff)
- Brutalist Websites Gallery
- UI Craft production demos (90+ scored interfaces)

---

## Global Design System (Neo-Brutalist Edition)

### Typography
- **Headings:** Inter Black (900 weight) or Space Grotesk Bold
- **Body:** Inter Regular/Medium (400/500)
- **Code:** JetBrains Mono (400/700)
- **Sizes:**
  - Display: 64px (hero headlines)
  - H1: 48px (page titles)
  - H2: 32px (section headers)
  - H3: 24px (card headers)
  - Body: 16px (default text)
  - Small: 14px (labels, captions)
  - Code: 14px (monospace blocks)

### Colors (High Contrast Palette)
```css
/* Primary Palette */
--black: #000000 (pure black for borders/text)
--white: #FFFFFF (pure white for backgrounds)
--primary: #0066FF (electric blue, not subtle)
--success: #00FF88 (neon green)
--warning: #FFCC00 (bright yellow)
--error: #FF0055 (hot pink/red)

/* Accent Colors */
--purple: #8B5CF6
--cyan: #00D9FF
--orange: #FF6B35

/* Grays (tinted with primary) */
--gray-50: #F7F9FC
--gray-100: #EDF2F7
--gray-200: #E2E8F0
--gray-800: #1A202C
--gray-900: #0F1419
```

### Shadows (Hard, No Blur)
```css
/* Neo-Brutalist signature: offset box shadows */
--shadow-sm: 2px 2px 0 #000
--shadow-md: 4px 4px 0 #000
--shadow-lg: 6px 6px 0 #000
--shadow-xl: 8px 8px 0 #000

/* Colored shadows for emphasis */
--shadow-primary: 4px 4px 0 #0066FF
--shadow-success: 4px 4px 0 #00FF88
```

### Borders
- **All elements:** 2-3px solid black borders
- **Active/hover states:** 3-4px solid borders
- **NO subtle 1px borders** (too timid)
- **Border radius:** 0px (square) or max 4px (barely rounded)

### Spacing (Generous, Structural)
- **Section gaps:** 64px (more dramatic than 48px)
- **Card padding:** 32px (bold internal space)
- **Component gaps:** 24px (clear separation)
- **Button padding:** 16px 32px (chunky, clickable)
- **Touch targets:** 48px minimum

### Motion
- **Transitions:** 150ms ease-out (snappy, not slow)
- **Hover lifts:** translateY(-4px) + shadow increase
- **NO easing curves** (no cubic-bezier smoothness)
- **NO animations** longer than 300ms
- **Respect prefers-reduced-motion**

### Critical Anti-Patterns (BANNED - 110 Gates)

**UI Craft Critical Violations (-8 points each):**
1. ❌ `purple-cyan-gradient` - NO purple-to-blue gradients
2. ❌ `glassmorphism-stack` - NO backdrop blur on cards
3. ❌ `animate-bounce` - NO bounce/elastic easing
4. ❌ `transition-all` - NO animating all properties
5. ❌ `no-focus-visible` - MUST have focus outlines
6. ❌ Soft shadows with blur-radius > 0
7. ❌ Missing alt text on images
8. ❌ Touch targets < 44px

**Hallmark Major Violations:**
9. ❌ Em-dashes (—) anywhere
10. ❌ "Clean and modern" boilerplate
11. ❌ Nested cards (card inside card)
12. ❌ Gray text on colored backgrounds
13. ❌ Italic headers
14. ❌ Pure black (#000) text (use tinted)
15. ❌ Invented metrics without proof
16. ❌ Lorem ipsum placeholder

**Neo-Brutalist Violations:**
17. ❌ Gradients (solid colors ONLY)
18. ❌ Rounded corners > 4px
19. ❌ Borders < 2px width
20. ❌ Pastel/low contrast colors
21. ❌ Typography < 14px body text
22. ❌ Transparency/opacity < 1

**Taste Skill Violations:**
23. ❌ Section gaps < 64px
24. ❌ Card padding < 32px
25. ❌ Component gaps < 24px
26. ❌ Line height < 1.5 for body
27. ❌ Cramped layouts
28. ❌ Missing white space hierarchy

**Target Score: 90+/100 (Grade A)**

---

## Screen 1: Code Generator Page

### Design Brief
Create a **bold, confident code generator** that feels like a professional developer tool. Think Linear's command palette meets Gumroad's raw block aesthetic. The page should feel hand-built, not templated.

### Visual Language
- **Layout:** Asymmetric 2-column grid (60/40 split, not 50/50)
- **Contrast:** Pure black borders on pure white cards
- **Typography:** Massive headlines (48px+), compact body (16px)
- **Shadows:** Hard 6px offset shadows on all cards
- **Borders:** 3px solid black on everything

### Structure

**Sidebar (Fixed 280px):**
- Logo: "LangGraph" in Space Grotesk Bold, 32px
- Square icon (40px) with 3px black border
- "New Generation" button: Full-width, 56px height, black bg, white text, 4px black border, 6px shadow
- Nav items: 20px height, 3px left border on active (black), bold text
- Footer: System status (Redis/Thread/Circuit) with colored dots (8px circles, 2px black border)

**Main Content:**

1. **Hero Header** (80px bottom margin)
   - Icon: 56px Material Symbol (black)
   - H1: "Code Generator" (Space Grotesk Bold, 56px, letter-spacing -0.02em)
   - Subtitle: 18px, 140% line-height, max-width 600px

2. **Task Input Card** (Asymmetric, 65% width on desktop)
   - White background
   - 3px solid black border
   - 6px hard shadow (4px 4px 0 #000)
   - 32px padding
   - Label: "TASK DESCRIPTION" (12px, uppercase, 0.1em tracking, black)
   - Textarea:
     - 3px solid black border
     - Min-height 180px
     - 20px padding
     - Font: Inter 16px/150%
     - Focus: border-color #0066FF, shadow 4px 4px 0 #0066FF
   - Quick examples: 
     - Inline pills with 2px black border
     - 12px 24px padding
     - Hover: black background, white text, 4px shadow

3. **Language Card** (35% width, sticky top on desktop)
   - Same card style (white, 3px border, 6px shadow)
   - Label: "LANGUAGE" (12px uppercase)
   - Radio options as FULL-WIDTH BLOCKS:
     - 56px height
     - 3px solid black border
     - Emoji + text (Space Grotesk Medium, 18px)
     - Active: black background, white text, 4px shadow
     - Hover (inactive): border-color #0066FF

4. **Generate Button** (Full width below cards)
   - 72px height (huge, unmissable)
   - Black background
   - White text (Space Grotesk Bold, 20px)
   - 3px solid black border
   - 8px shadow (6px 6px 0 #000)
   - Hover: translateY(-2px), shadow 8px 8px 0 #000
   - Loading: replace text with animated dots (no spinner)

5. **Code Output** (Initially hidden)
   - Terminal-style block:
     - Black background (#000000)
     - Lime green text (#00FF88) for code
     - 3px white border
     - 8px shadow (6px 6px 0 #00FF88)
     - JetBrains Mono 16px/160%
   - Header row with action buttons:
     - Copy/Download: 44px height, white bg, 2px black border, 4px shadow
     - Hover: black bg, white text

### Interaction Details
- Card hovers: translateY(-2px) + shadow increase to 8px
- Button clicks: translateY(2px) + shadow decrease to 2px (pressed effect)
- Example chips: instant text fill (no fade animation)
- Code appears: slide-down 200ms ease-out (not fade)

### HTML Structure
```html
<body class="bg-white text-black font-inter">
  <aside class="fixed w-[280px] h-screen border-r-[3px] border-black bg-white">
    <!-- Sidebar -->
  </aside>
  
  <main class="ml-[280px] p-16 max-w-[1400px]">
    <!-- Hero -->
    <section class="mb-20">...</section>
    
    <!-- Grid -->
    <div class="grid grid-cols-[1.5fr_1fr] gap-8">
      <!-- Task Input -->
      <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8">
        ...
      </div>
      
      <!-- Language + Generate -->
      <div class="flex flex-col gap-8 sticky top-8">
        <div class="border-[3px] border-black shadow-[6px_6px_0_#000] bg-white p-8">
          ...
        </div>
        <button class="h-[72px] bg-black text-white border-[3px] border-black shadow-[6px_6px_0_#000]">
          GENERATE CODE
        </button>
      </div>
    </div>
    
    <!-- Output (hidden initially) -->
    <section class="mt-16 hidden" id="output">
      <div class="bg-black border-[3px] border-white shadow-[6px_6px_0_#00FF88] p-8">
        <pre class="text-[#00FF88] font-mono text-base leading-relaxed">
          ...
        </pre>
      </div>
    </section>
  </main>
</body>
```

### Technical Requirements
- Tailwind CSS v4 (use arbitrary values for borders/shadows)
- No external CSS frameworks
- Material Symbols Outlined icons
- FastAPI backend (/invoke endpoint)
- localStorage for recent generations
- Cmd+Enter keyboard shortcut
- Copy/download buttons functional
- Syntax highlighting (green for code, gray for comments)

### Pre-Flight Checklist
- [ ] ALL borders are 2-3px solid black
- [ ] ALL shadows are hard (no blur radius)
- [ ] NO rounded corners > 4px
- [ ] Headlines are 48px+ and bold
- [ ] Buttons are 56px+ height
- [ ] ZERO em-dashes
- [ ] Pure black (#000) and pure white (#FFF) used
- [ ] Touch targets ≥ 48px
- [ ] WCAG AA contrast (easy with black/white)
- [ ] Cards lift on hover (translateY + shadow)
- [ ] NO transition-all (use specific properties)
- [ ] NO gradients anywhere
- [ ] Focus outlines appear INSTANTLY (no delay)
- [ ] All images have alt text
- [ ] Forms use <label>, not placeholder
- [ ] Semantic HTML (button, dialog, not div)
- [ ] prefers-reduced-motion supported
- [ ] NO invented metrics or fake testimonials
- [ ] Different structure from any previous build

**110-Gate God-Level Checklist:**
For full production deployment, validate against complete 110-gate checklist in `GODLEVEL_DESIGN_SYSTEM.md`.

**Target UICraftScore: 90+/100 (Grade A)**
- Anti-slop: ≥ 85
- Token discipline: 100
- A11y static: 100

**UI Craft Integration (Optional):**
```bash
npm install -D ui-craft-detect
npx ui-craft-detect pages/*.html --threshold 80
```

---

## Screen 2: Workflow Visualization

### Design Brief
Create a **technical monitoring dashboard** showing agent execution flow. Think GitHub Actions logs meets a brutalist flowchart. The design should feel like a system diagram, not a polished product page.

### Visual Language
- **Layout:** Split-screen (50/50) with visible divider
- **Flowchart:** Vertical with chunky node blocks
- **Timeline:** Terminal-style event log
- **Colors:** Black, white, neon accent per node type

### Structure

**Left Column: Flow Diagram**
- 5 Node blocks (each 200px wide, variable height):
  1. START - neon green (#00FF88) bg, black text, 3px black border
  2. DEVELOPER - electric blue (#0066FF) bg, white text
  3. TESTER - cyan (#00D9FF) bg, black text
  4. DECISION - purple (#8B5CF6) bg, white text
  5. COMPLETE - neon green bg, black text
- Arrows: Thick 4px black lines with triangle heads
- Active node: 6px offset shadow + scale(1.05)
- Spacing: 32px between nodes

**Right Column: Timeline Log**
- Black background
- Neon green text (#00FF88)
- JetBrains Mono 14px
- Each event: timestamp + icon + message
- Scrollable with custom scrollbar (8px wide, neon green)

### Node Structure
```html
<div class="relative">
  <!-- Node -->
  <div class="w-[200px] p-6 bg-[#00FF88] border-[3px] border-black shadow-[4px_4px_0_#000] text-center">
    <div class="text-4xl mb-2">▶</div>
    <div class="font-bold text-xl">START</div>
    <div class="text-sm mt-2 opacity-70">Initialize workflow</div>
  </div>
  
  <!-- Arrow -->
  <div class="w-[4px] h-[32px] bg-black mx-auto"></div>
</div>
```

---

## Screen 3: Execution Report

### Design Brief
Tabbed dashboard showing test results, logs, and metrics. Think Stripe's data tables meets brutalist information design.

### Visual Language
- **Tabs:** Full-width blocks with 3px borders
- **Metrics:** Large numbers (64px) in bordered boxes
- **Progress bars:** Chunky (16px height) with hard edges
- **Color coding:** Green (#00FF88) for success, hot pink (#FF0055) for errors

### Key Elements
- **Tab buttons:** 60px height, black border, active has black bg + white text
- **Metric cards:** 4-column grid, square blocks with centered numbers
- **Test cards:** Full-width blocks with left border (8px) for status
- **Code output:** Black terminal with lime green text

---

## Screen 4: History Page

### Design Brief
Filterable list of past generations. Think Notion database view meets brutalist table design.

### Visual Language
- **Filter bar:** Horizontal pill buttons with 2px borders
- **History cards:** Stacked blocks with hover lift
- **Action buttons:** Small squares (40px) with black borders
- **Stats:** Grid layout inside each card

### Key Features
- Search bar: 64px height, 3px border, prominent
- Language filters: Emoji + text in bordered pills
- Card hover: 8px shadow + lift
- Delete confirmation: Modal with centered content, 4px border

---

## Implementation Order

**Step 1:** You paste generated HTML  
**Step 2:** I'll review and note what needs backend integration  
**Step 3:** I'll add:
- FastAPI API calls (/invoke, /threads)
- localStorage management
- JavaScript interactivity
- Syntax highlighting
- Error handling
- Keyboard shortcuts

**Step 4:** Individual git commits per page  
**Step 5:** Deploy to Render

---

## Design Resources Used

**Content rephrased for compliance with licensing restrictions. Sources:**

- **UI Craft** by Eduardo Calvo (MIT License)  
  https://github.com/educlopez/ui-craft  
  52 deterministic gates, design engineering system

- **Hallmark** by Nutlope (MIT License)  
  https://github.com/Nutlope/hallmark  
  58 anti-slop gates, structural variety

- **Taste Skill v2** by Leonxlnx (MIT License)  
  https://github.com/Leonxlnx/taste-skill  
  Spacing discipline, anti-patterns

- **Impeccable** by pbakaus (Apache 2.0 License)  
  https://github.com/pbakaus/impeccable  
  59 detector rules, visual quality

- **Neo-Brutalism 2026** - Design movement  
  From neubrutalism.com, onething.design, brutalistwebsites.com

- **Modern Dev Tool Patterns**  
  Observed from Linear, Vercel, Stripe, Retool dashboards

All principles adapted and synthesized into original design specifications for this project.
