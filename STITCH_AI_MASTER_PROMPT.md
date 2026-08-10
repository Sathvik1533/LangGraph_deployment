# STITCH AI MASTER PROMPT: GOD-LEVEL UI GENERATION
## Combined: User's Design Bible + UI Craft + Hallmark + Neo-Brutalism + Taste Skill

**Copy this ENTIRE document into Stitch AI before generating ANY screen.**

---

## 🔒 MANDATORY HIERARCHY (Priority Order)

1. **User's Design Bible** (Operational UX, institutional intelligence)
2. **UI Craft** (52 deterministic gates, 90+ score target)
3. **Hallmark** (58 anti-slop gates, structural variety)
4. **Neo-Brutalism** (Hard shadows, thick borders, pure black/white)
5. **Taste Skill** (Spacing discipline, 64px sections, 44px touch)

**When conflicts arise: Higher number = higher priority**

---

## ⚡ CONSTITUTIONAL LAW (From User's Design Bible)

**Implementation quality ALWAYS takes priority over visual novelty.**

Every frontend decision consumes from four finite budgets:
- **Cognitive budget** — maintainability
- **Rendering budget** — GPU/layout cycles
- **Maintenance budget** — 6-month understandability
- **Accessibility budget** — keyboard, screen reader, 200% zoom

**Any animation, abstraction, or visual that cannot justify its budget is REJECTED.**

---

## 🎨 LOCKED DESIGN TOKENS (EXACT VALUES ONLY)

### Typography (From User's Bible + UI Craft)

```css
/* Fonts - EXACTLY THESE, NO SUBSTITUTIONS */
--font-display: 'Space Grotesk', sans-serif;   /* 700 only, NEVER Inter/Roboto */
--font-body: system-ui;                         /* -apple-system, BlinkMacSystemFont */
--font-code: 'JetBrains Mono', monospace;      /* 400, 700 - tabular-nums */

/* Font Sizes */
--text-display: clamp(2.8rem, 5vw, 4.5rem);   /* Hero only */
--text-h1: clamp(1.8rem, 3vw, 2.8rem);
--text-h2: clamp(1.4rem, 2.2vw, 2rem);
--text-base: 16px;                             /* Body text */
--text-sm: 14px;                               /* MINIMUM for body */
--text-xs: 12px;                               /* Labels only */

/* Line Heights */
--leading-tight: 1.1;                          /* Display */
--leading-snug: 1.3;                           /* H1-H3 */
--leading-normal: 1.6;                         /* Body MINIMUM */

/* Font Features (MANDATORY) */
font-variant-numeric: tabular-nums;            /* ALL numbers */
text-wrap: balance;                            /* ALL headings */
# DESIGN BIBLE: LOCKED CONSISTENCY RULES FOR STITCH AI
## LangGraph Dashboard - Zero Deviation Allowed

**Purpose:** Copy-paste this ENTIRE document into Stitch AI before every screen generation to enforce absolute consistency.

---

## 🔒 LOCKED DESIGN TOKENS (Never Change These)

### Typography Tokens (Exact Values)
```css
/* Font Families - EXACTLY THESE 3, NO MORE */
--font-display: 'Space Grotesk', sans-serif;  /* Weight: 700 only */
--font-body: 'Inter', sans-serif;              /* Weights: 400, 500, 600 */
--font-code: 'JetBrains Mono', monospace;     /* Weights: 400, 700 */

/* Font Sizes - EXACT PIXEL VALUES */
--text-display: 64px;   /* Hero headlines only */
--text-4xl: 56px;       /* Page titles (H1) */
--text-3xl: 48px;       /* Section headers (H2) */
--text-2xl: 32px;       /* Card headers (H3) */
--text-xl: 24px;        /* Subheadings (H4) */
--text-lg: 18px;        /* Large body text */
--text-base: 16px;      /* Default body text */
--text-sm: 14px;        /* Small text, labels */
--text-xs: 12px;        /* Tiny labels only */

/* Line Heights - EXACT RATIOS */
--leading-tight: 1.1;   /* Display headings */
--leading-snug: 1.3;    /* H1-H3 */
--leading-normal: 1.5;  /* Body text (MINIMUM) */
--leading-relaxed: 1.6; /* Long-form content */
--leading-loose: 1.75;  /* Code blocks */

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Color Tokens (Exact OKLCH Values)
```css
/* Black & White - PURE VALUES ONLY */
--color-black: #000000;        /* Pure black for borders */
--color-white: #FFFFFF;        /* Pure white for backgrounds */

/* Primary Palette - EXACT OKLCH */
--color-primary: oklch(55% 0.22 260);        /* #0066FF electric blue */
--color-primary-hover: oklch(50% 0.24 260);
--color-primary-active: oklch(45% 0.26 260);
--color-primary-bg: oklch(95% 0.08 260);     /* Light blue background */

/* Success - EXACT NEON GREEN */
--color-success: oklch(75% 0.25 145);        /* #00FF88 */
--color-success-bg: oklch(95% 0.08 145);
--color-success-border: #000000;

/* Warning - EXACT BRIGHT YELLOW */
--color-warning: oklch(80% 0.18 90);         /* #FFCC00 */
--color-warning-bg: oklch(96% 0.06 90);
--color-warning-border: #000000;

/* Error - EXACT HOT PINK */
--color-error: oklch(60% 0.25 10);           /* #FF0055 */
--color-error-bg: oklch(95% 0.08 10);
--color-error-border: #000000;

/* Paper (Tinted Whites) - EXACT OKLCH */
--color-paper-1: oklch(99% 0.005 260);       /* Barely tinted */
--color-paper-2: oklch(97% 0.008 260);
--color-paper-3: oklch(95% 0.01 260);

/* Text (Tinted Blacks) - EXACT OKLCH */
--color-text-primary: oklch(15% 0.01 260);   /* #0b1c30 blue-black */
--color-text-secondary: oklch(45% 0.015 260); /* #64748b slate */
--color-text-tertiary: oklch(60% 0.01 260);

/* Accent Colors - EXACT OKLCH */
--color-purple: oklch(60% 0.20 290);         /* #8B5CF6 */
--color-cyan: oklch(70% 0.18 200);           /* #00D9FF */
--color-orange: oklch(65% 0.20 40);          /* #FF6B35 */
```

### Spacing Tokens (Exact Pixel Values)
```css
/* Component-Level - 4px BASE GRID */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

/* Layout-Level - LOCKED MINIMUMS */
--section-gap: 64px;      /* Between major sections */
--card-padding: 32px;     /* Internal card padding */
--component-gap: 24px;    /* Between components */

/* Touch Targets - WCAG AA MINIMUMS */
--touch-min: 44px;        /* Minimum touch target */
--button-height: 56px;    /* Primary button height */
--input-height: 48px;     /* Input field height */
```

### Shadow Tokens (Hard Shadows ONLY)
```css
/* Offset Shadows - NO BLUR RADIUS EVER */
--shadow-sm: 2px 2px 0 #000000;
--shadow-md: 4px 4px 0 #000000;
--shadow-lg: 6px 6px 0 #000000;
--shadow-xl: 8px 8px 0 #000000;

/* Colored Shadows */
--shadow-primary: 4px 4px 0 oklch(55% 0.22 260);
--shadow-success: 4px 4px 0 oklch(75% 0.25 145);
--shadow-error: 4px 4px 0 oklch(60% 0.25 10);
--shadow-warning: 4px 4px 0 oklch(80% 0.18 90);
```

### Border Tokens
```css
/* Border Widths - 2-4px ONLY, NO 1px */
--border-width-default: 2px;
--border-width-thick: 3px;
--border-width-heavy: 4px;

/* Border Colors - BLACK OR ACCENT ONLY */
--border-color-default: #000000;
--border-color-primary: oklch(55% 0.22 260);
--border-color-success: oklch(75% 0.25 145);
--border-color-error: oklch(60% 0.25 10);

/* Border Radius - SQUARE IS KING */
--radius-none: 0px;       /* Preferred */
--radius-sm: 2px;         /* Barely rounded */
--radius-md: 4px;         /* MAXIMUM allowed */
--radius-full: 9999px;    /* Pills only */
```

### Motion Tokens
```css
/* Durations - FAST ONLY */
--dur-instant: 0ms;
--dur-fast: 150ms;
--dur-normal: 200ms;
--dur-slow: 300ms;        /* MAXIMUM */

/* Easings - NO CUBIC-BEZIER */
--ease-linear: linear;
--ease-out: ease-out;
--ease-in: ease-in;
--ease-in-out: ease-in-out;

/* Transforms */
--lift-sm: translateY(-2px);
--lift-md: translateY(-4px);
--lift-lg: translateY(-6px);
--press: translateY(2px);
```

---

## 🎨 COMPONENT SPECIFICATIONS (Exact Patterns)

### Button Component (8 States)
```html
<button class="btn-primary">
  Button Text
</button>
```

**CSS Rules (EXACT):**
```css
.btn-primary {
  /* Base State */
  height: 56px;
  padding: 0 32px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 700;
  background: #000000;
  color: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 4px;
  box-shadow: 6px 6px 0 #000000;
  cursor: pointer;
  transition-property: transform, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

/* Hover */
.btn-primary:hover {
  transform: translateY(-4px);
  box-shadow: 8px 8px 0 #000000;
}

/* Focus */
.btn-primary:focus-visible {
  outline: 3px solid oklch(55% 0.22 260);
  outline-offset: 2px;
}

/* Active */
.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 2px 2px 0 #000000;
}

/* Disabled */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

### Card Component
```html
<div class="card">
  <h3 class="card-header">Card Title</h3>
  <p class="card-body">Card content</p>
</div>
```

**CSS Rules (EXACT):**
```css
.card {
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 4px;
  padding: 32px;
  box-shadow: 6px 6px 0 #000000;
  transition-property: transform, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 8px 8px 0 #000000;
}

.card-header {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  color: oklch(15% 0.01 260);
  margin-bottom: 16px;
}

.card-body {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: oklch(45% 0.015 260);
}
```

### Input Component
```html
<div class="input-wrapper">
  <label class="input-label" for="input-id">Label Text</label>
  <input type="text" id="input-id" class="input" placeholder="Placeholder text">
  <span class="input-error" id="input-id-error">Error message</span>
</div>
```

**CSS Rules (EXACT):**
```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: oklch(15% 0.01 260);
}

.input {
  height: 48px;
  padding: 0 24px;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 4px;
  transition-property: border-color, box-shadow;
  transition-duration: 150ms;
}

.input:focus {
  outline: none;
  border-color: oklch(55% 0.22 260);
  box-shadow: 0 0 0 3px oklch(55% 0.22 260 / 0.2);
}

.input[aria-invalid="true"] {
  border-color: oklch(60% 0.25 10);
  box-shadow: 4px 4px 0 oklch(60% 0.25 10);
}

.input-error {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: oklch(60% 0.25 10);
  display: none;
}

.input[aria-invalid="true"] ~ .input-error {
  display: block;
}
```

---

## 📐 LAYOUT RULES (Exact Structure)

### Page Container
```html
<body class="bg-white text-black font-inter min-h-screen">
  <aside class="sidebar">...</aside>
  <main class="main-content">...</main>
</body>
```

**Measurements:**
- Sidebar: 280px fixed width
- Main content: margin-left 280px on desktop, 0 on mobile
- Max-width: 1400px centered
- Padding: 64px horizontal, 80px top

### Section Spacing
```css
/* Between major sections: 64px MINIMUM */
.section + .section {
  margin-top: 64px;
}

/* Inside sections: 32px between groups */
.section-group + .section-group {
  margin-top: 32px;
}

/* Inside cards: 24px between elements */
.card > * + * {
  margin-top: 24px;
}
```

### Grid Systems
```css
/* Two-column layout */
.grid-2col {
  display: grid;
  grid-template-columns: 1.5fr 1fr; /* Asymmetric */
  gap: 32px;
}

/* Three-column layout */
.grid-3col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* Four-column layout */
.grid-4col {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* Mobile: all columns stack */
@media (max-width: 768px) {
  .grid-2col,
  .grid-3col,
  .grid-4col {
    grid-template-columns: 1fr;
  }
}
```

---

## 🚫 ABSOLUTE PROHIBITIONS (110 Gates)

### Visual Prohibitions (NEVER ALLOW)
```
❌ Purple-to-blue gradients
❌ ANY gradients (solid colors ONLY)
❌ Glassmorphism / backdrop-filter
❌ Soft shadows (blur-radius > 0)
❌ Border radius > 4px
❌ Border width < 2px
❌ Subtle 1px borders
❌ Pastel colors
❌ Low contrast colors
❌ Opacity < 1 on cards
❌ Radial gradient blooms
❌ Side-tab accent borders
❌ Button text-shadow glow
❌ Fake browser chrome
❌ Decorative gradient blobs
```

### Interaction Prohibitions
```
❌ Bounce easing (animate-bounce)
❌ Elastic easing
❌ transition-all (use specific properties)
❌ Transitions > 300ms
❌ Cubic-bezier easing (use linear/ease-out)
❌ Focus ring with animation delay
❌ Missing focus outlines
❌ Touch targets < 44px
❌ Missing hover states
❌ Missing disabled states
❌ Missing loading states
❌ Missing error states
```

### Code Prohibitions
```
❌ Inline hex colors (use CSS variables)
❌ Inline styles (style="...")
❌ Random z-index values (use scale)
❌ Off-scale spacing values
❌ Off-scale border radius
❌ setTimeout for animations
❌ Placeholder as label
❌ div with onClick (use <button>)
❌ Missing alt text on images
❌ Modal without <dialog>
❌ Emoji in aria-labels
❌ Positive tabIndex values
❌ outline: none without replacement
```

### Content Prohibitions
```
❌ Em-dashes (—) anywhere
❌ "Clean and modern" boilerplate
❌ "Revolutionize your workflow"
❌ "Get started" as only CTA
❌ Lorem ipsum placeholder
❌ Fake user names ("Jane Doe")
❌ Invented metrics ("47% conversion")
❌ Fake testimonials
❌ Generic quotes without attribution
❌ Logo clouds with fake companies
❌ "Trusted by 50,000+ teams" without proof
```

### Typography Prohibitions
```
❌ Italic headers
❌ ALL CAPS section headings
❌ Centered body text > 3 lines
❌ Line length > 75 characters
❌ Line height < 1.5 for body
❌ Font size < 14px for body
❌ More than 3 font families
❌ Inter as lazy default everywhere
❌ Duplicate copy in different weights
```

### Layout Prohibitions
```
❌ Nested cards (card inside card)
❌ Gray text on colored backgrounds
❌ Hero → 3 Features → CTA → Footer template
❌ Centered single-column everything
❌ Horizontal scroll on mobile
❌ Two-line clickable text
❌ Same macrostructure as previous page
❌ Section numbering (01 · 02 · 03)
❌ Hanging headers (tag-left, heading-right)
```

---

## ✅ MANDATORY FEATURES (Must Have All)

### Accessibility (WCAG AA)
```
✅ All text ≥ 4.5:1 contrast ratio
✅ Large text ≥ 3:1 contrast ratio
✅ All images have alt text
✅ All form inputs have <label>
✅ Error messages with aria-describedby
✅ Focus outlines ≥ 3px, ≥ 3:1 contrast
✅ Focus outlines appear INSTANTLY
✅ Touch targets ≥ 44px height
✅ Keyboard navigation works everywhere
✅ Screen reader accessible
✅ prefers-reduced-motion support
```

### Interaction States
```
✅ Default state
✅ Hover state (lift + shadow increase)
✅ Focus state (outline, instant)
✅ Active state (press down)
✅ Disabled state (opacity 0.5)
✅ Loading state (spinner/skeleton)
✅ Error state (red border + message)
✅ Success state (green border + icon)
```

### Semantic HTML
```
✅ Use <button> for clickable elements
✅ Use <dialog> for modals
✅ Use <label> for form fields
✅ Use <nav> for navigation
✅ Use <main> for main content
✅ Use <aside> for sidebar
✅ Use <article> for content blocks
✅ Use <section> for page sections
✅ Use <header> for headers
✅ Use <footer> for footers
```

### Motion Support
```
✅ All transitions ≤ 300ms
✅ Only transform/opacity animated
✅ @media (prefers-reduced-motion: reduce) implemented
✅ Reduced motion: ≤ 10ms transitions
✅ No bounce or elastic easing
✅ No layout property animations (width/height/margin)
```

---

## 🎯 CONSISTENCY CHECKLIST (Run Before Generation)

### Before Generating HTML, Confirm:
- [ ] I have read ALL locked tokens above
- [ ] I will use EXACT color values (not similar)
- [ ] I will use EXACT spacing values (not close)
- [ ] I will use EXACT font sizes (not approximate)
- [ ] I will use ONLY Space Grotesk, Inter, JetBrains Mono
- [ ] I will use 2-4px borders ONLY (no 1px)
- [ ] I will use hard shadows ONLY (no blur)
- [ ] I will use border-radius ≤ 4px ONLY
- [ ] I will implement ALL 8 interaction states
- [ ] I will use semantic HTML ONLY
- [ ] I will add alt text to ALL images
- [ ] I will use <label> for ALL form inputs
- [ ] I will support prefers-reduced-motion
- [ ] I will avoid ALL 110 prohibited patterns

### After Generating HTML, Verify:
- [ ] Zero inline styles (style="...")
- [ ] Zero inline hex colors
- [ ] Zero gradients anywhere
- [ ] Zero soft shadows
- [ ] Zero transitions > 300ms
- [ ] Zero border-radius > 4px
- [ ] Zero borders < 2px
- [ ] Zero font sizes < 14px for body
- [ ] Zero em-dashes (—)
- [ ] Zero boilerplate ("clean and modern")
- [ ] Zero nested cards
- [ ] Zero divs with onClick
- [ ] Zero missing alt text
- [ ] Zero placeholder-as-label
- [ ] All touch targets ≥ 44px
- [ ] All text contrast ≥ 4.5:1

---

## 📝 COPY-PASTE TEMPLATE FOR STITCH AI

**Use this exact template when prompting Stitch AI:**

```
You are generating production-ready HTML using a locked design system.

DESIGN TOKENS (DO NOT DEVIATE):
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code)
- Colors: Pure #000 black, Pure #FFF white, oklch(55% 0.22 260) primary
- Spacing: 64px sections, 32px cards, 24px components
- Borders: 2-4px solid black ONLY
- Shadows: Hard offset ONLY (4px 4px 0 #000), NO blur
- Radius: 0-4px maximum, prefer 0px
- Motion: 150-300ms, ease-out, NO bounce

110 GATES ENFORCED:
❌ NO gradients (solid colors only)
❌ NO soft shadows (blur-radius must be 0)
❌ NO borders < 2px or > 4px
❌ NO radius > 4px
❌ NO transitions > 300ms
❌ NO transition-all
❌ NO bounce/elastic easing
❌ NO inline styles
❌ NO inline hex colors
❌ NO em-dashes (—)
❌ NO boilerplate ("clean and modern")
❌ NO nested cards
❌ NO placeholder-as-label
❌ NO div with onClick (use <button>)
❌ NO missing alt text
❌ NO touch targets < 44px

MANDATORY:
✅ Semantic HTML (<button>, <label>, <dialog>)
✅ All 8 states (default, hover, focus, active, disabled, loading, error, success)
✅ WCAG AA contrast (4.5:1 text, 3:1 large)
✅ Focus outlines ≥ 3px, appear INSTANTLY
✅ prefers-reduced-motion support
✅ Alt text on ALL images
✅ <label> for ALL inputs

TARGET SCORE: 90+/100 (Grade A)

[THEN ADD YOUR SCREEN-SPECIFIC REQUIREMENTS]
```

---

## 🔐 LOCK CONFIRMATION

By using this document, Stitch AI must:
1. Use EXACT token values (not similar)
2. Follow ALL component patterns (not variations)
3. Avoid ALL 110 prohibited patterns (zero exceptions)
4. Implement ALL mandatory features (100% coverage)
5. Pass ALL consistency checks (before & after)

**No creative interpretation allowed. This is a specification, not inspiration.**

---

**END OF DESIGN BIBLE**
