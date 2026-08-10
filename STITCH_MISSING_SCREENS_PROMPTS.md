# Stitch AI Prompts for Missing Screens

Use these prompts in Stitch AI to generate the remaining screens with Neo-Brutalist design matching the design bible.

---

## Screen 1: LangGraph Code Generator

```
Design a Neo-Brutalist code generator screen for LangGraph orchestration platform.

LAYOUT STRUCTURE:
- Left sidebar (280px): Navigation with "LANGGRAPH" header, active state on "Code Generator", links to Dashboard, Workflow, Execution, History. Bottom CTA "New Generation" button.
- Main content: Full-width canvas with generous 48-64px gaps between sections
- No right panel

HERO SECTION:
- Large display heading "Code Generator" with magic wand icon
- Subtitle explaining the self-correcting agent capability
- Clear visual hierarchy with 48px vertical spacing

INPUT SECTION:
- Large textarea (6 rows minimum) with label "Task Description"
- Placeholder: "What do you want to build? Example: Create a function that implements..."
- Quick example chips below: "Fibonacci sequence", "Prime checker", "REST API template"
- Clean 4px border radius, 3px black borders

LANGUAGE SELECTOR:
- Radio button cards with emoji flags (🐍 Python, ☕ Java, ⚡ C++)
- Active state: thick border, filled background
- Hover states with transform effects
- 48px minimum touch targets

GENERATE BUTTON:
- Primary blue (#2563eb), large (56px height)
- Icon + text "Generate Code"
- Keyboard shortcut hint "(Cmd+Enter)"
- Loading state with spinner
- Neo-brutalist shadow (6px 6px 0px #000)

OUTPUT SECTION (initially hidden):
- Code editor styled container with terminal aesthetic
- Dark background (#0f172a) with syntax highlighting
- Window chrome with colored dots (red/yellow/green)
- Action buttons: Copy, Download, View Report
- All buttons functional with icons

SPACING RULES:
- Section gaps: 48-64px
- Card padding: 24-32px
- Button padding: 16-24px
- Consistent 8px grid alignment

TYPOGRAPHY:
- Headings: Space Grotesk Bold, 48px display
- Body: Inter 16px, line-height 1.5
- Code: JetBrains Mono 14px
- Labels: Inter 12px, uppercase, tracking-wide

COLORS:
- Background: #f8f9ff (tinted white)
- Primary: #2563eb (blue)
- Surface: white with 0.8 alpha glass effect
- Borders: #e5eeff (light blue tint)
- Text: #0b1c30 (tinted black)
- Code background: #0f172a (slate)

DESIGN GATES ENFORCED:
✓ Hard shadows (no blur): 6px 6px 0px #000
✓ Thick borders: 3px solid black
✓ Bold typography: Space Grotesk 700
✓ Generous spacing: 48px section gaps
✓ Touch targets: 44px minimum
✓ Fast transitions: ≤300ms
✓ No nested cards
✓ No em-dashes
✓ Structural variety (not grid-only)
✓ Functional buttons (not decorative)
✓ Color-coded states (active/hover/disabled)

INTERACTIONS:
- Prompt chips fill textarea on click
- Language selector updates UI state
- Generate button triggers API call
- Copy button uses clipboard API
- Download creates .py/.java/.cpp file
- All hover states have shadow transforms
- Keyboard shortcut Cmd+Enter works

Make every element functional, not decorative. This is for production demo.
```

---

## Screen 2: LangGraph History

```
Design a Neo-Brutalist history/archive screen for LangGraph code generations.

LAYOUT STRUCTURE:
- Left sidebar (280px): Navigation with "History" active state
- Main content: Full-width with filters and card grid
- No right panel needed

HEADER SECTION:
- Large display heading "Generation History"
- Subtitle: "Browse all past code generations with filters"
- Search bar (right-aligned) with icon
- Filter buttons row: "All", "Python", "Java", "C++", "Success", "Failed"

FILTER BAR:
- Horizontal pill buttons with active states
- Count badges on each filter
- Clear all button (text link)
- Sort dropdown: "Newest", "Oldest", "Language"
- 24px spacing between buttons

GRID LAYOUT:
- 3-column grid on desktop, 2 on tablet, 1 on mobile
- 24px gap between cards
- Cards have Neo-brutalist shadows
- Hover state lifts card with shadow transform

HISTORY CARD (each generation):
- Top: Language badge with emoji (🐍 Python)
- Task snippet (truncated to 2 lines)
- Status indicator: Success (green) / Failed (red)
- Timestamp: "2 hours ago"
- Bottom actions: View Code, Delete, Re-run
- 3px black border, 6px shadow

STATUS BADGES:
- Success: #60ff99 (neon green) bg, black border
- Failed: #ffdad6 (red tint) bg, black border
- 12px font size, uppercase, bold

ACTION BUTTONS:
- Icon + text on hover
- Delete has red hover state
- View Code navigates to execution
- Re-run prefills generate page

EMPTY STATE:
- Large icon (history crossed out)
- Message: "No generations yet. Start creating!"
- CTA button to Code Generator
- Centered, 200px+ from top

PAGINATION:
- Bottom of grid: "Page 1 of 10"
- Previous/Next buttons (Neo-brutalist style)
- Disabled state with 50% opacity
- Jump to page input field

SPACING:
- Header to filters: 48px
- Filters to grid: 32px
- Card padding: 24px
- Grid gap: 24px

TYPOGRAPHY:
- Page title: Space Grotesk 48px
- Card titles: Inter 16px semibold
- Task text: Inter 14px regular
- Timestamps: JetBrains Mono 12px
- Badges: Inter 10px uppercase bold

COLORS:
- Background: #f8f9ff
- Cards: white with glass effect
- Borders: #1b1b1b (pure black)
- Primary: #2563eb
- Success: #60ff99
- Error: #ffdad6

DESIGN GATES:
✓ Hard shadows: 6px 6px 0px #000
✓ Thick borders: 3px
✓ No nested cards (cards don't contain cards)
✓ Functional delete (prompts confirmation)
✓ Real timestamps from data
✓ Empty state if no history
✓ Touch targets: 44px
✓ Fast transitions: 200ms
✓ Prefers-reduced-motion support
✓ Accessible focus states

INTERACTIONS:
- Filter buttons toggle on/off (multi-select)
- Search filters in real-time
- Delete confirms before action
- Cards link to detail view
- Re-run button navigates with prefilled data
- Sort updates grid immediately

This screen must work with localStorage data. No fake content.
```

---

## Screen 3: LangGraph Settings (Optional)

```
Design a Neo-Brutalist settings/configuration screen for LangGraph.

LAYOUT:
- Left sidebar: Navigation with "Settings" active
- Main content: Two-column form layout (label left, control right)
- Save button sticky at bottom

SECTIONS:
1. API Configuration
   - GROQ API Key input (password field)
   - Model selection dropdown (Llama 3.3 70B, etc)
   - Temperature slider (0-1)
   - Test Connection button

2. Code Generation
   - Default language (radio buttons)
   - Auto-save toggle
   - Syntax highlighting toggle
   - Max tokens slider

3. Thread Management
   - Thread persistence toggle
   - Auto-delete old threads (days input)
   - Redis connection string

4. Display
   - Dark mode toggle
   - Font size (radio: Small, Medium, Large)
   - Reduced motion toggle

5. Danger Zone
   - Clear all history button (red, requires confirmation)
   - Reset settings button
   - Export data button

FORM CONTROLS:
- Input fields: 48px height, 3px borders
- Toggles: Neo-brutalist switches (not iOS style)
- Sliders: Thick track (8px), large thumb (20px)
- Buttons: 56px height primary, 48px secondary

SPACING:
- Section gaps: 64px
- Row gaps: 24px
- Label to control: 32px horizontal
- Form width: max 800px, centered

COLORS:
- Form background: white cards with shadows
- Danger zone: #ffdad6 background
- Success feedback: #60ff99 toast
- Disabled: 50% opacity

DESIGN GATES:
✓ No nested cards
✓ Functional toggles (update state)
✓ Validation feedback (red borders on error)
✓ Save confirmation toast
✓ Danger actions require confirmation
✓ Keyboard navigation support
✓ Focus visible on all controls

This must connect to backend/localStorage for persistence.
```

---

## Usage Instructions

1. Open Stitch AI
2. Paste **entire prompt** (including all design gates)
3. Generate screen
4. Copy the HTML output
5. Save to appropriate file:
   - Screen 1 → Replace `pages/generate.html`
   - Screen 2 → Replace `pages/history.html`
   - Screen 3 → Create `pages/settings.html`
6. Wire backend integration (I'll do this after you paste)

---

## CRITICAL NOTES

- All prompts include the 110 design gates from `DESIGN_BIBLE_LOCKED.md`
- Neo-Brutalist style matches the master prompt
- Every button must be functional (no decorative elements)
- Use localStorage for data persistence
- Support keyboard shortcuts
- Mobile responsive required
- Prefers-reduced-motion support required

After Stitch generates, notify me and I'll wire the backend JavaScript immediately.
