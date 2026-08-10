# Stitch AI Prompts for LangGraph Multi-Page Dashboard

## Design System Foundation

**Global Requirements (Apply to ALL pages):**

### Typography
- **UI Font:** Inter (400, 500, 600, 700 weights)
- **Code Font:** JetBrains Mono (400, 500 weights)
- **Icons:** Material Symbols Outlined (not filled by default)
- **NO Arial, NO system defaults**
- Tint all blacks/grays (never pure #000 or #808080)

### Colors (Taste Skill Compliant)
```
Primary: #2563eb (blue, not purple)
Success: #10b981 (emerald)
Warning: #f59e0b (amber)
Error: #ef4444 (red)
Background: #f8f9ff (subtle blue tint)
Surface: #ffffff (white cards)
Text Primary: #0b1c30 (blue-black, NOT pure black)
Text Secondary: #64748b (slate, NOT gray-500)
Border: #e5eeff (blue-tinted, NOT gray)
```

### Spacing Rules (Taste Skill V2)
- **Section gaps:** 48px minimum (generous breathing room)
- **Card padding:** 24px (never less than 16px)
- **Component gaps:** 16-24px (avoid 8px cramped spacing)
- **Line height:** 1.5 for body, 1.2 for headings
- **Max content width:** 1200px centered
- **Touch targets:** 44px minimum (a11y compliant)

### Layout Variance (DESIGN_VARIANCE: 6/10)
- Avoid pure centered layouts
- Use asymmetric grids where appropriate
- Cards can have varied heights
- Break the 3-column monotony

### Motion (MOTION_INTENSITY: 4/10)
- Hover transitions: 0.2s ease
- Card lifts: translateY(-2px) + shadow increase
- NO bounce/elastic easing (dated)
- Respect prefers-reduced-motion
- Use cubic-bezier for custom easing, never ease-in-out on everything

### Anti-Slop Rules (CRITICAL)
1. **ZERO em-dashes (—) ANYWHERE** (headlines, body, buttons, captions)
2. **NO purple-to-blue gradients** (AI tell)
3. **NO nested cards** (card inside card inside card)
4. **NO gray text on colored backgrounds** (contrast fail)
5. **NO fake "Jane Doe" names** (use real context)
6. **NO Inter as lazy default** (use thoughtfully or pick different font)
7. **NO side-tab borders** (the vertical accent line on cards)
8. **NO dark glows on buttons** (inset shadow antipattern)

### Accessibility (WCAG AA Minimum)
- Contrast ratio: 4.5:1 for text, 3:1 for large text
- All interactive elements focusable
- Semantic HTML (nav, main, section, article, aside)
- ARIA labels where needed
- Keyboard navigation support

---

## Prompt 1: Code Generator Page (pages/generate.html)

### Brief
Create a professional code generator interface for an AI-powered LangGraph agent that generates Python, Java, and C++ code. The page should feel like a high-end developer tool (think Vercel Dashboard meets Linear's polish). Users describe what they want, select a language, click generate, and see beautifully syntax-highlighted code with action buttons.

### Design Language
- **Visual Density:** 5/10 (balanced - not cramped, not wasteful)
- **Motion Intensity:** 4/10 (smooth hovers, subtle transitions)
- **Layout Variance:** 6/10 (asymmetric form layout, card depth variation)
- **Mood:** Confident, professional, developer-focused

### Layout Structure
```
[240px Fixed Sidebar] [Main Content Area - flex-1 with max-width 1200px]
```

**Sidebar Navigation (matches dashboard.html):**
- Logo area: "LangGraph" with schema icon (rounded blue square)
- "New Generation" button (primary, full-width)
- Nav items:
  - Dashboard (link to /)
  - Code Generator (active state) ← THIS PAGE
  - Workflow (link to /workflow)
  - Execution (link to /execution)
  - History (link to /history)
- Footer: Production status panel (Redis, Thread, Circuit Breaker status)

**Main Content Sections:**

1. **Page Header** (48px bottom margin)
   - Material icon "auto_awesome" (40px size)
   - H1: "Code Generator" (text-4xl font-semibold)
   - Subtitle: "Describe your code and let AI generate it in your preferred language"

2. **Task Input Card** (white bg, 24px padding, 16px bottom margin)
   - Label: "What do you want to build?"
   - Large textarea (min-height 120px) with:
     - Placeholder: Multi-line example text (line breaks with \n)
     - Border: 2px solid #e5eeff
     - Focus state: blue ring, lifted border color
     - Vertical resize allowed
   - Quick Examples section:
     - Label: "Quick Examples" (text-sm semibold, 64748b color)
     - Horizontal flex wrap of chips:
       - "Fibonacci", "Prime Check", "Reverse String", "Binary Search"
       - Chips: white bg, 1px border, rounded-full, hover lifts with blue border

3. **Language Selection Card** (white bg, 24px padding, 16px bottom margin)
   - Label: "Select Language"
   - Horizontal toggle buttons (NOT radio inputs):
     - Python (🐍 emoji + text) - DEFAULT ACTIVE
     - Java (☕ emoji + text)
     - C++ (⚡ emoji + text)
   - Active state: #2563eb background, white text, 2px border
   - Inactive: white bg, #e5eeff border, hover blue tint

4. **Generate Button** (full width, 16px padding vertical, 16px bottom margin)
   - Primary blue background (#2563eb)
   - Icon: "magic_button" (Material Symbol)
   - Text: "Generate Code"
   - Loading state: spinner animation + "Generating..." text
   - Large touch target (56px height minimum)

5. **Generated Code Section** (initially hidden, shows after generation)
   - Header row:
     - Icon + "Generated Code" title + language badge
     - Action buttons: Copy, Download, View Report (secondary style)
   - Code display:
     - Dark terminal theme: #1e293b background, #e2e8f0 text
     - JetBrains Mono font, 14px size, 1.6 line-height
     - 24px padding, 8px border-radius
     - Max height: calc(100vh - 500px) with overflow-y scroll
     - Syntax highlighting spans (keyword, string, number, comment, function classes)

### Key Interactions
- Click example chips → fills textarea
- Language button toggle → changes active state + updates badge
- Cmd/Ctrl+Enter in textarea → triggers generate
- Generate button → shows spinner, disables button, makes API call
- Success → scrolls to code section smoothly
- Copy button → copies code, shows toast "Copied to clipboard"
- Download → creates file with .py/.java/.cpp extension

### Technical Requirements
- Tailwind CSS v4 via CDN
- Material Symbols Outlined font loaded
- Fetch navigation from /templates/navigation.html
- API endpoint: POST /invoke
- localStorage: save recent generations, current thread
- Toast notifications for feedback
- Smooth scroll behavior
- Custom scrollbar styling (webkit-scrollbar)

### Color-Coded Language Badges
- Python: emerald-100 bg, emerald-700 text
- Java: orange-100 bg, orange-700 text  
- C++: blue-100 bg, blue-700 text

### Empty State
Show helpful prompt examples and language selection before first generation.

### Pre-Flight Checklist
- [ ] ZERO em-dashes anywhere
- [ ] Proper spacing (48px section gaps, 24px card padding)
- [ ] All hover states have 0.2s transition
- [ ] Focus states visible (blue ring)
- [ ] Touch targets ≥44px
- [ ] Contrast WCAG AA
- [ ] No nested cards
- [ ] No purple gradients
- [ ] Real placeholder text (not Lorem Ipsum)
- [ ] Semantic HTML (main, section tags)

---

## Prompt 2: Workflow Visualization Page (pages/workflow.html)

### Brief
Create a real-time workflow visualization showing a self-correcting LangGraph agent's execution flow. Left side shows a vertical flowchart of agent nodes (START → Developer → Tester → Decision → COMPLETE). Right side shows a live timeline of execution events. The design should feel like a sophisticated developer tool dashboard (think GitHub Actions meets Retool's polish).

### Design Language
- **Visual Density:** 6/10 (information-rich but scannable)
- **Motion Intensity:** 5/10 (pulse animations, fade-ins, active states)
- **Layout Variance:** 7/10 (split-screen, asymmetric node sizes, flowing arrows)
- **Mood:** Technical, precise, real-time monitoring

### Layout Structure
```
[240px Fixed Sidebar] [Main Content: 2-column grid, equal width]
```

**Main Content Grid:**
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 24px;
height: calc(100vh - 180px);
```

### Left Column: Workflow Diagram

**Container:**
- White background card
- 32px padding
- Vertical flex column (center aligned)
- 24px gap between elements
- Overflow-y scroll (custom scrollbar)

**Node Structure (5 nodes total):**

1. **START Node**
   - Icon: "play_circle" (32px)
   - Title: "START"
   - Description: "Initialize workflow" (text-xs, 70% opacity)
   - Colors: emerald theme (#10b981 border, #f0fdf4 bg, #059669 text)
   - Min-width: 200px, padding 20px 24px
   - Rounded: 12px
   - Border: 2px solid

2. **Arrow** (between each node)
   - Material icon "arrow_downward" (32px)
   - Color: #cbd5e1 (neutral gray)
   - Margin: 4px vertical

3. **Developer Agent Node**
   - Icon: "code"
   - Title: "Developer Agent"
   - Description: "Generate code"
   - Colors: purple theme (#8b5cf6 border, #f5f3ff bg, #7c3aed text)

4. **Tester Agent Node**
   - Icon: "science"
   - Title: "Tester Agent"
   - Description: "Run validation tests"
   - Colors: cyan theme (#06b6d4 border, #f0fdfa bg, #0891b2 text)

5. **Decision Router Node**
   - Icon: "fork_right"
   - Title: "Decision Router"
   - Description: "Evaluate results"
   - Colors: blue theme (#2563eb border, #eff6ff bg, #1d4ed8 text)

6. **COMPLETE Node**
   - Icon: "check_circle"
   - Title: "COMPLETE"
   - Description: "Workflow finished"
   - Colors: emerald theme (same as START)

**Node States:**
- **Active:** scale(1.05), border-width 3px, box-shadow large, pulse animation
- **Completed:** opacity 0.7
- **Idle:** default appearance

**Loop Indicator** (shows during retries):
- Badge below decision node
- Orange/amber theme
- Text: "↻ Self-Correction Loop Active"
- Only visible when iterations > 1

### Right Column: Execution Timeline

**Container:**
- White background card
- 24px padding
- Header with "Execution Timeline" title + step counter badge
- Overflow-y scroll

**Timeline Structure:**
- Vertical line (2px solid #e5eeff) on left
- Each item:
  - Position relative, 32px left padding, 20px bottom padding
  - Border-left: 2px solid #e5eeff
  - Before pseudo-element: 10px circle dot at left: -6px
  - Fade-in animation (0.3s ease-out)

**Timeline Item States:**
- **Active:** blue dot (#2563eb) with pulsing shadow
- **Completed:** green dot (#10b981)
- **Error:** red dot (#ef4444)
- **Retry:** amber dot (#f59e0b)

**Item Content:**
- Event text (font-medium, primary color)
- Timestamp (text-xs, secondary color, 4px margin-top)

**Empty State** (before any execution):
- Center-aligned content
- Large "pending_actions" icon (64px, 30% opacity)
- Message: "No workflow execution yet"
- Subtext: "Generate code to see the workflow in action"
- Primary button link to /generate

### Key Interactions
- Real-time updates from localStorage.lastGeneration
- Nodes light up sequentially as workflow progresses
- Timeline auto-scrolls to bottom on new events
- Smooth fade-in animations for new timeline items
- Pulse animation on active node
- Step counter updates with each event

### Data Source
- localStorage.getItem('lastGeneration')
- Parse execution data: iterations, execution_success, code, report
- Replay workflow based on iterations count
- Show retry loops if iterations > 1

### Responsive Behavior
- Mobile (< 768px): Stack columns vertically
- Timeline max-height adjusts to viewport

### Pre-Flight Checklist
- [ ] ZERO em-dashes
- [ ] 48px gaps between major sections
- [ ] Smooth animations (no bounce easing)
- [ ] Color-coded by agent type (not monotone)
- [ ] Active states clearly visible
- [ ] Auto-scroll timeline works
- [ ] Empty state has clear CTA
- [ ] Custom scrollbar styling
- [ ] Semantic HTML structure
- [ ] WCAG AA contrast on all text

---

## Prompt 3: Execution Report Page (pages/execution.html)

### Brief
Create a comprehensive execution report dashboard showing test results, output logs, and performance metrics from code generation runs. The page should feel like a professional CI/CD dashboard (think GitHub Actions + Vercel Analytics polish). Users can tab between Tests, Output, and Metrics views to inspect different aspects of the execution.

### Design Language
- **Visual Density:** 7/10 (data-rich, dashboard-style)
- **Motion Intensity:** 3/10 (subtle tab transitions, progress bars)
- **Layout Variance:** 5/10 (grid-based metrics, clear hierarchy)
- **Mood:** Analytical, precise, trustworthy

### Layout Structure
```
[240px Fixed Sidebar] [Main Content - max-width 1200px centered]
```

### Page Header
- Icon: "analytics" (40px)
- H1: "Execution Report"
- Subtitle: "Detailed test results, output logs, and performance metrics"

### Tabbed Interface

**Tab Bar:**
- Horizontal flex layout
- Border-bottom: 2px solid #e5eeff
- 24px bottom margin
- Tab buttons:
  - Padding: 12px 24px
  - Font: 14px semibold
  - Default: transparent bg, #64748b text
  - Hover: #f8f9ff bg, #2563eb text
  - Active: #2563eb text, 3px bottom border #2563eb
  - Icon + text (check_circle, terminal, speed icons)

**Tab Transition:**
- Fade-in animation (0.3s ease-out)
- Only active tab content visible

### Tab 1: Tests View

**Summary Card** (first element):
- Header: "Test Summary" + status badge (✓ All Passed / ✗ Some Failed)
- 3-column stat grid:
  - Success Rate (large % number, colored green/red)
  - Tests passed/total (24px font)
  - Iterations (24px font)
- Progress bar:
  - 8px height, rounded
  - Background: #e5eeff
  - Fill: linear-gradient emerald (#10b981 → #059669)
  - Animated width transition
  - Shows success percentage

**Test Case Cards** (list below summary):
- Each test as a separate card
- Left border (4px): green for passed, red for failed
- Header row:
  - Icon (check_circle or cancel, 24px, colored)
  - Test name (font-semibold)
  - Description (text-sm, secondary color)
  - Status badge (right-aligned)
- Error section (if failed):
  - Red alert box (#fef2f2 bg, #fecaca border)
  - Monospace error text (text-xs, #991b1b color)

**Empty State:**
- Large "science" icon (64px, 30% opacity)
- Message: "No test results available"
- Subtext: "Generate code to see test execution results"
- Primary button to /generate

### Tab 2: Output View

**Output Card:**
- Header: "Execution Output" + Copy button
- Terminal-style display:
  - Background: #1e293b (dark slate)
  - Text: #e2e8f0 (light)
  - Font: JetBrains Mono 13px
  - Padding: 20px
  - Line-height: 1.6
  - Border-radius: 8px
  - Max-height: calc(100vh - 400px)
  - Overflow-y: auto
  - Custom scrollbar (dark theme)

**Content:**
- Pre-formatted text from execution report
- Preserve line breaks and spacing
- Escape HTML entities
- Show stdout, stderr, execution results

**Empty State:**
- Large "terminal" icon
- Message: "No output logs available"
- Subtext: "Execute code to see output logs"

### Tab 3: Metrics View

**Metrics Grid** (2x2 on desktop, 1 column on mobile):
- Grid: repeat(auto-fit, minmax(200px, 1fr))
- 20px gap

**Metric Cards** (4 total):

1. **Execution Time**
   - Icon: "timer" (32px, #2563eb)
   - Value: "2.5s" (32px font, blue)
   - Label: "Execution Time" (13px, secondary)

2. **Iterations**
   - Icon: "loop" (32px, #8b5cf6)
   - Value: "2" (32px font, purple)
   - Label: "Iterations"

3. **Success Rate**
   - Icon: "check_circle" or "error" (32px)
   - Value: "100%" or "0%" (32px font, colored)
   - Label: "Success Rate"
   - Color: green if success, red if fail

4. **Lines of Code**
   - Icon: "code" (32px, #06b6d4)
   - Value: "45" (32px font, cyan)
   - Label: "Lines of Code"

**Performance Details Card** (below grid):
- Title: "Performance Details"
- 3 progress sections:
  1. Code Generation → ✓ Complete (100% green bar)
  2. Test Execution → ✓ Complete (100% green bar)
  3. Validation → ✓ Passed / ✗ Failed (100% or 50% bar, colored)
- Each section:
  - Label + badge (left/right justified)
  - Progress bar (8px height, rounded, animated)
  - 16px vertical spacing

**Empty State:**
- Large "speed" icon
- Message: "No performance metrics available"
- Subtext: "Generate code to see performance data"

### Key Interactions
- Tab switching with smooth fade transition
- Copy output button → clipboard + toast
- Load data from localStorage.lastGeneration
- Parse test results from report string
- Calculate metrics from execution data
- Real-time updates on new generation
- Smooth scroll within output terminal

### Data Parsing
- Parse report text for test cases (basic regex)
- Extract: execution_success, iterations, code length
- Estimate execution time (iterations × 2.5s average)
- Show actual test names or generic labels

### Pre-Flight Checklist
- [ ] ZERO em-dashes
- [ ] Tab transitions smooth (no jank)
- [ ] Progress bars animated
- [ ] Color-coded metrics (not all gray)
- [ ] Terminal scrollbar styled
- [ ] Empty states helpful
- [ ] Copy button works
- [ ] WCAG AA contrast (especially on dark terminal)
- [ ] Touch targets ≥44px
- [ ] Responsive grid on mobile

---

## Prompt 4: History Page (pages/history.html)

### Brief
Create a powerful history management interface showing all past code generations with real-time filtering, search, and batch actions. The page should feel like a polished file manager or email client (think Notion's table view meets Gmail's list polish). Users can search, filter by language/status, view details, download code, or delete items.

### Design Language
- **Visual Density:** 6/10 (list-heavy but scannable)
- **Motion Intensity:** 4/10 (card lifts on hover, smooth filters)
- **Layout Variance:** 5/10 (list layout with grid stats, varied card heights)
- **Mood:** Organized, efficient, powerful

### Layout Structure
```
[240px Fixed Sidebar] [Main Content - max-width 1400px centered]
```

### Page Header

**Header Row:**
- Left side:
  - Icon: "history" (40px)
  - H1: "Generation History"
  - Subtitle: "View and manage your code generation history"
- Right side:
  - "Clear All" button (secondary style, destructive red on hover)

### Filter Bar Card (white bg, 24px padding, 16px bottom margin)

**Layout:** Horizontal flex, 12px gap, wrap on small screens

**Search Box:**
- Flex: 1 (takes available space)
- Min-width: 300px
- Display: flex, align-items center, 12px gap
- Padding: 10px 16px
- Border: 2px solid #e5eeff
- Rounded: 8px
- Icon: "search" (Material Symbol, 20px, #64748b)
- Input:
  - Flex: 1
  - No border, no outline
  - Font: 14px
  - Placeholder: "Search by task description..."
  - Real-time filter on keyup

**Filter Chips:**
- All Languages (default active)
- 🐍 Python
- ☕ Java
- ⚡ C++
- Success Only (with check_circle icon)

**Chip Style:**
- Padding: 8px 16px
- Border: 2px solid #e5eeff
- Rounded: 20px (pill shape)
- Background: white
- Font: 13px semibold
- Gap: 6px (icon + text)
- Transition: 0.2s ease
- Hover: #f8f9ff bg, #2563eb border
- Active: #2563eb bg, white text, white icon

### History List

**Container:**
- Vertical stack with 16px gaps
- Each item clickable (cursor pointer)

**History Card:**

**Layout:**
- White background
- 1px border #e5eeff
- 12px border-radius
- 24px padding
- Hover: border-color #2563eb, translateY(-2px), blue shadow
- Transition: 0.2s ease

**Header Section:**
- Display: flex, justify-between, align-start
- Left side:
  - Large code icon (28px, #2563eb)
  - Task description (font-semibold, text-lg, truncate at 50 chars)
  - Timestamp formatted (e.g., "2 hours ago" or "Jan 15, 2026")
- Right side:
  - Status badge (✓ Success green or ✗ Failed red)
  - Language badge (color-coded: Python emerald, Java orange, C++ blue)
  - Action icon buttons (view, download, delete)

**Code Preview** (if code exists):
- Background: #f8f9ff
- Border: 1px solid #e5eeff
- Rounded: 6px
- Padding: 12px
- Font: JetBrains Mono 12px
- Color: #434655
- Overflow: hidden
- Text-overflow: ellipsis
- White-space: nowrap
- Show first 100 characters
- Margin-top: 12px

**Stats Grid** (below preview):
- Display: grid
- Template: repeat(auto-fit, minmax(150px, 1fr))
- Gap: 16px
- Padding-top: 16px
- Border-top: 1px solid #e5eeff

**Stat Items** (4 per card):
1. **Language**
   - Label: "Language" (text-xs, #64748b)
   - Value: "Python" (text-base, semibold, #0b1c30)

2. **Status**
   - Label: "Status"
   - Value: "Passed" or "Failed" (colored)

3. **Lines**
   - Label: "Lines"
   - Value: "45"

4. **Date**
   - Label: "Date"
   - Value: "Jan 15, 2026"

**Action Buttons** (icon buttons, 36px square):
- View (visibility icon)
- Download (download icon)
- Delete (delete icon)
- Style: 1px border #e5eeff, white bg
- Hover: #f8f9ff bg, #2563eb border
- Click stops propagation (doesn't trigger card click)

### Key Interactions

**Search:**
- Real-time filter on input keyup
- Case-insensitive match on task text or code
- Shows filtered count

**Filter Chips:**
- Click toggles active state
- Updates visual chips (only one language active at a time)
- Re-filters list immediately
- "Success Only" can combine with language filter

**Card Click:**
- Saves item to localStorage.lastGeneration
- Navigates to /generate page
- User sees code pre-loaded

**Download Button:**
- Creates Blob with code content
- Filename: generation_{index}.py/.java/.cpp
- Triggers browser download

**Delete Button:**
- Shows confirm dialog: "Delete this generation from history?"
- Removes from localStorage.recentGenerations array
- Removes from DOM with fade-out
- Shows toast: "Generation deleted"

**Clear All Button:**
- Shows confirm dialog: "Clear all generation history? This cannot be undone."
- Clears localStorage.recentGenerations and localStorage.lastGeneration
- Shows empty state
- Toast: "History cleared"

### Empty State (no results)

**Center-aligned:**
- Large "history" icon (64px, 30% opacity, #64748b)
- Message: "No results found" (16px)
- Subtext: "Try adjusting your filters" (14px, secondary)

**Empty State (no history at all):**
- Large "history" icon
- Message: "No generation history yet"
- Subtext: "Start generating code to build your history"
- Primary button to /generate

### Language Badge Colors
- Python: bg-emerald-100, text-emerald-700, font-bold, uppercase, text-xs
- Java: bg-orange-100, text-orange-700
- C++: bg-blue-100, text-blue-700

### Date Formatting Logic
```javascript
- Less than 1 minute: "Just now"
- Less than 60 minutes: "X min ago"
- Less than 24 hours: "X hour(s) ago"
- Older: date.toLocaleDateString() e.g., "1/15/2026"
```

### Data Management
- Load: JSON.parse(localStorage.getItem('recentGenerations') || '[]')
- Save: localStorage.setItem('recentGenerations', JSON.stringify(array))
- Max items: 20 (auto-trim older entries on new generation)
- Each item: { task, language, success, timestamp, code, report }

### Pre-Flight Checklist
- [ ] ZERO em-dashes
- [ ] Search works in real-time
- [ ] Filter chips toggle correctly
- [ ] Card hover lifts (translateY -2px)
- [ ] Action buttons stop propagation
- [ ] Confirm dialogs before destructive actions
- [ ] Empty states helpful
- [ ] Color-coded language badges
- [ ] Touch targets ≥44px
- [ ] WCAG AA contrast everywhere
- [ ] Responsive grid on mobile
- [ ] Custom scrollbar styling

---

## Final Implementation Notes

### After Receiving Stitch AI HTML:

1. **Replace placeholder API calls** with actual FastAPI endpoints:
   - POST /invoke for code generation
   - GET /threads for thread management

2. **Connect localStorage:**
   - recentGenerations array
   - lastGeneration object
   - currentThreadId

3. **Add shared navigation:**
   - Fetch from /templates/navigation.html
   - Set active nav item per page

4. **Implement JavaScript functions:**
   - copyToClipboard()
   - downloadFile()
   - showToast()
   - formatDate()
   - cleanCode()
   - syntaxHighlight()

5. **Apply syntax highlighting** in code displays:
   - Use <span> elements with classes
   - Support Python, Java, C++ highlighting
   - Dark theme in code blocks

6. **Run Taste Skill Pre-Flight Check:**
   - Scan for em-dashes (search for —)
   - Verify spacing (48px sections, 24px cards)
   - Check contrast ratios
   - Validate touch targets
   - Test motion with prefers-reduced-motion
   - Confirm no nested cards
   - Verify no purple gradients
   - Check no gray text on colored backgrounds

7. **Test Responsiveness:**
   - Mobile breakpoints (<768px)
   - Tablet (768px - 1024px)
   - Desktop (>1024px)

8. **Commit Strategy:**
   - Individual commits per page
   - One commit per logical change
   - Push after each commit (GitHub contribution graph)

### Quality Standards
- Clean, semantic HTML5
- Tailwind CSS v4 classes only
- No inline styles except for dynamic values
- Custom scrollbar styling for code blocks
- Smooth animations (no jank)
- Accessible (ARIA, keyboard nav, focus states)
- Production-ready code (no TODOs or placeholders)
