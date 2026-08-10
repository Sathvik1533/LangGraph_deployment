# Ultimate Design System: LangGraph Dashboard
## Hallmark + Neo-Brutalism + Taste Skill + Impeccable + Modern Dev Tools

**Last Updated:** August 9, 2026  
**Status:** Production-Ready God-Level Design System

---

## Philosophy: Anti-AI-Slop at Every Layer

This design system refuses every default LLMs were trained on. It combines:

1. **Hallmark's 57 slop-test gates** (structural variety, honest copy, locked tokens)
2. **Neo-Brutalism's visual rebellion** (hard shadows, thick borders, intentional rawness)
3. **Taste Skill's spacing discipline** (48px gaps, 24px cards, no cramping)
4. **Impeccable's 59 detector rules** (no gray text on color, no nested cards, no bounce easing)
5. **Modern Dev Tools aesthetic** (Linear's precision, Vercel's data hierarchy, Stripe's clarity)

**Core Principle:** Two pages built with this system should feel like different sites, not color-swaps of the same template.

---

## Global Design Tokens (Locked System)

### Typography Hierarchy
```css
:root {
  /* Display Fonts (Bold, Roman Only - NO ITALIC HEADERS) */
  --font-display: 'Space Grotesk', sans-serif;  /* 700 weight */
  --font-headline: 'Inter', sans-serif;         /* 600-700 weight */
  --font-body: 'Inter', sans-serif;             /* 400-500 weight */
  --font-code: 'JetBrains Mono', monospace;     /* 400-700 weight */
  
  /* Size Scale (Responsive via clamp) */
  --text-display: clamp(3.5rem, 8vw, 6rem);     /* 56-96px */
  --text-4xl: clamp(2.5rem, 5vw, 4rem);         /* 40-64px */
  --text-3xl: clamp(2rem, 4vw, 3rem);           /* 32-48px */
  --text-2xl: clamp(1.5rem, 3vw, 2rem);         /* 24-32px */
  --text-xl: 1.25rem;                            /* 20px */
  --text-lg: 1.125rem;                           /* 18px */
  --text-base: 1rem;                             /* 16px */
  --text-sm: 0.875rem;                           /* 14px */
  --text-xs: 0.75rem;                            /* 12px */
  
  /* Line Heights */
  --leading-tight: 1.1;    /* Headings */
  --leading-normal: 1.5;   /* Body */
  --leading-relaxed: 1.6;  /* Code blocks */
}
```

### Color System (High Contrast OKLCH)
```css
:root {
  /* Pure Black & White (Neo-Brutalist Foundation) */
  --color-black: #000000;
  --color-white: #FFFFFF;
  
  /* Primary Palette (Electric Blue, Not Subtle) */
  --color-primary: oklch(55% 0.22 260);      /* #0066FF */
  --color-primary-hover: oklch(50% 0.24 260);
  --color-primary-active: oklch(45% 0.26 260);
  
  /* Success (Neon Green) */
  --color-success: oklch(75% 0.25 145);      /* #00FF88 */
  --color-success-bg: oklch(95% 0.08 145);
  
  /* Warning (Bright Yellow) */
  --color-warning: oklch(80% 0.18 90);       /* #FFCC00 */
  --color-warning-bg: oklch(96% 0.06 90);
  
  /* Error (Hot Pink/Red) */
  --color-error: oklch(60% 0.25 10);         /* #FF0055 */
  --color-error-bg: oklch(95% 0.08 10);
  
  /* Paper (Tinted Whites, NOT Pure) */
  --color-paper-1: oklch(99% 0.005 260);     /* Slight blue tint */
  --color-paper-2: oklch(97% 0.008 260);
  --color-paper-3: oklch(95% 0.01 260);
  
  /* Text (Tinted Blacks, NOT Pure) */
  --color-text-primary: oklch(15% 0.01 260); /* #0b1c30 blue-black */
  --color-text-secondary: oklch(45% 0.015 260); /* #64748b slate */
  --color-text-tertiary: oklch(60% 0.01 260);
  
  /* Accent Colors (For Variety) */
  --color-purple: oklch(60% 0.20 290);       /* #8B5CF6 */
  --color-cyan: oklch(70% 0.18 200);         /* #00D9FF */
  --color-orange: oklch(65% 0.20 40);        /* #FF6B35 */
}
```

### Spacing Scale (4pt Base, Generous)
```css
:root {
  /* Component-Level */
  --space-xs: 0.25rem;    /* 4px */
  --space-sm: 0.5rem;     /* 8px */
  --space-md: 1rem;       /* 16px */
  --space-lg: 1.5rem;     /* 24px */
  --space-xl: 2rem;       /* 32px */
  --space-2xl: 3rem;      /* 48px */
  --space-3xl: 4rem;      /* 64px */
  
  /* Layout-Level (Hallmark Standard) */
  --section-gap: 4rem;    /* 64px between major sections */
  --card-padding: 2rem;   /* 32px internal card padding */
  --component-gap: 1.5rem; /* 24px between components */
  
  /* Touch Targets (WCAG AA) */
  --touch-min: 2.75rem;   /* 44px minimum */
  --button-height: 3.5rem; /* 56px for primary buttons */
  --input-height: 3rem;   /* 48px for inputs */
}
```

### Shadows (Hard, No Blur - Neo-Brutalist Signature)
```css
:root {
  /* Offset Shadows (NO BLUR RADIUS) */
  --shadow-sm: 2px 2px 0 var(--color-black);
  --shadow-md: 4px 4px 0 var(--color-black);
  --shadow-lg: 6px 6px 0 var(--color-black);
  --shadow-xl: 8px 8px 0 var(--color-black);
  
  /* Colored Shadows (For Emphasis) */
  --shadow-primary: 4px 4px 0 var(--color-primary);
  --shadow-success: 4px 4px 0 var(--color-success);
  --shadow-error: 4px 4px 0 var(--color-error);
}
```

### Borders (Thick, Always Visible)
```css
:root {
  --border-width-default: 2px;
  --border-width-thick: 3px;
  --border-width-heavy: 4px;
  
  --border-color-default: var(--color-black);
  --border-color-subtle: var(--color-text-tertiary);
  --border-color-accent: var(--color-primary);
  
  /* Radius (Minimal - Square is King) */
  --radius-none: 0;
  --radius-sm: 2px;      /* Barely rounded */
  --radius-md: 4px;      /* Maximum allowed */
  --radius-full: 9999px; /* Pills only */
}
```

### Motion (Fast, No Bounce)
```css
:root {
  /* Durations (Snappy, Not Slow) */
  --dur-instant: 0ms;
  --dur-fast: 150ms;
  --dur-normal: 200ms;
  --dur-slow: 300ms;
  
  /* Easings (NO BOUNCE, NO ELASTIC) */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Transforms (Hover Lifts) */
  --lift-sm: translateY(-2px);
  --lift-md: translateY(-4px);
  --lift-lg: translateY(-6px);
}
```

---

## The 58 Anti-Slop Gates (Hallmark Standard)

Every output MUST pass all 58 gates before shipping. Content rephrased from Hallmark skill for compliance with licensing.

### Category 1: Visual Slop (Gates 1-15)
1. ❌ Radial gradient bloom behind hero
2. ❌ Side-tab accent border (vertical strip on card edge)
3. ❌ Button text-shadow glow
4. ❌ Duplicate copy in different weights on same line
5. ❌ Purple-to-blue mesh gradient
6. ❌ Glassmorphism on structural cards
7. ❌ Fake browser chrome (hand-drawn URL bars)
8. ❌ Invented metrics ("47% conversion increase")
9. ❌ "Trusted by 50,000+ teams" without proof
10. ❌ Generic testimonial quotes (no real attribution)
11. ❌ Logo clouds with fake companies
12. ❌ Bounce/elastic easing on UI state changes
13. ❌ Multiple font families beyond 2+1 rule
14. ❌ Italic headers or display type
15. ❌ Em-dashes (—) anywhere on the page

### Category 2: Layout & Structure (Gates 16-30)
16. ❌ Hero → 3 Features → CTA → Footer (default template)
17. ❌ Centered single-column everything
18. ❌ Nested cards (card inside card inside card)
19. ❌ Gray text on colored backgrounds (contrast fail)
20. ❌ Section numbering labels everywhere (01 · 02 · 03)
21. ❌ Hanging headers (tag-left, heading-right two-column)
22. ❌ Same macrostructure as previous build
23. ❌ Same theme as previous build (without axis change)
24. ❌ Same nav archetype as previous build
25. ❌ Same footer archetype as previous build
26. ❌ Fake screenshots (div-based UI mockups)
27. ❌ Horizontal scroll on mobile
28. ❌ Two-line clickable text (buttons, nav links)
29. ❌ Bare `1fr` grid tracks with images
30. ❌ Display headers without word-wrap

### Category 3: Typography & Copy (Gates 31-45)
31. ❌ "Clean and modern" as a design descriptor
32. ❌ "Revolutionize your workflow" boilerplate
33. ❌ "Get started" as the only CTA verb
34. ❌ Lorem ipsum placeholder text
35. ❌ Fake user names ("Jane Doe", "John Smith")
36. ❌ Inter font as lazy default everywhere
37. ❌ System fonts without intentional choice
38. ❌ Uppercase body copy (all-caps paragraphs)
39. ❌ Centered body text blocks > 3 lines
40. ❌ Line length > 75 characters (measure)
41. ❌ Headings > 90 characters without size adjustment
42. ❌ Hero headline > 7 words (without justification)
43. ❌ Missing focus outlines on interactive elements
44. ❌ Focus ring with animation delay
45. ❌ Missing disabled state styling

### Category 4: Color & Contrast (Gates 46-58)
46. ❌ WCAG contrast < 4.5:1 for text
47. ❌ WCAG contrast < 3:1 for large text
48. ❌ Pure black (#000) or pure gray (#808080) text
49. ❌ Inline OKLCH values (not using tokens)
50. ❌ Mid-render token improvisation
51. ❌ More than 3 font families on one page
52. ❌ Missing `prefers-reduced-motion` support
53. ❌ Animating layout properties (width, height, margin)
54. ❌ Soft shadows with blur radius > 0
55. ❌ Border radius > 8px (too rounded)
56. ❌ Touch targets < 44px height
57. ❌ Missing hover states on interactive elements
58. ❌ Missing error/success states on forms

---

## Component Patterns (Production-Ready)

### Buttons (8-State System)
```css
.btn {
  /* Base State */
  height: var(--button-height);
  padding: 0 var(--space-xl);
  font-family: var(--font-headline);
  font-size: var(--text-lg);
  font-weight: 600;
  border: var(--border-width-thick) solid var(--color-black);
  border-radius: var(--radius-md);
  transition: all var(--dur-fast) var(--ease-out);
  cursor: pointer;
}

.btn-primary {
  background: var(--color-black);
  color: var(--color-white);
  box-shadow: var(--shadow-lg);
}

/* Hover - Lift + Shadow Increase */
.btn-primary:hover, .btn-primary.is-hover {
  transform: var(--lift-md);
  box-shadow: var(--shadow-xl);
}

/* Focus - Visible Ring (NO ANIMATION DELAY) */
.btn-primary:focus-visible, .btn-primary.is-focus {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

/* Active - Press Down Effect */
.btn-primary:active, .btn-primary.is-active {
  transform: translateY(2px);
  box-shadow: var(--shadow-sm);
}

/* Disabled - Reduced Opacity */
.btn-primary:disabled, .btn-primary.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: var(--shadow-md);
}

/* Loading State */
.btn-primary[data-state="loading"], .btn-primary.is-loading {
  position: relative;
  color: transparent;
}
.btn-primary[data-state="loading"]::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-white);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Success State */
.btn-primary[data-state="success"], .btn-primary.is-success {
  background: var(--color-success);
  border-color: var(--color-black);
  color: var(--color-black);
}

/* Error State */
.btn-primary[data-state="error"], .btn-primary.is-error {
  background: var(--color-error);
  border-color: var(--color-black);
  color: var(--color-white);
  animation: shake 0.3s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* Reduced Motion Override */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition-duration: 0ms;
  }
  .btn-primary:hover {
    transform: none;
  }
  .btn-primary[data-state="loading"]::after {
    animation: none;
    opacity: 0.6;
  }
}
```

### Cards (Neo-Brutalist Style)
```css
.card {
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  border-radius: var(--radius-md);
  padding: var(--card-padding);
  box-shadow: var(--shadow-lg);
  transition: all var(--dur-fast) var(--ease-out);
}

.card:hover {
  transform: var(--lift-sm);
  box-shadow: var(--shadow-xl);
}

/* NO NESTED CARDS (Gate 18) */
.card .card {
  /* This should NEVER exist */
  border: 3px solid var(--color-error);
  outline: 3px solid var(--color-error);
}
```

### Navigation (N5: Floating Pill Archetype)
```css
.nav {
  position: fixed;
  top: var(--space-lg);
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  
  display: flex;
  align-items: center;
  gap: var(--space-md);
  
  background: var(--color-white);
  border: var(--border-width-thick) solid var(--color-black);
  border-radius: var(--radius-full);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-lg);
}

.nav-link {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--dur-fast) var(--ease-out);
}

.nav-link:hover {
  background: var(--color-paper-2);
  color: var(--color-primary);
}

.nav-link.active {
  background: var(--color-black);
  color: var(--color-white);
}
```

---

## Macrostructure Catalog (Hallmark Standard)

**Rule:** Never use the same macrostructure twice in a row. Rotate deliberately through these 21 patterns.

### Editorial Cluster
1. **Specimen** - Left-margin labels + huge serif + asymmetric spans
2. **Atelier** - Two-column rhythm + portfolio grid
3. **Newsprint** - Dense text columns + editorial hierarchy
4. **Long Document** - Chapter-based + sidebar TOC
5. **Manifesto** - Statement typography + minimal sections
6. **Almanac** - Index-led + reference structure
7. **Garden** - Organic flow + hand-built illustrations
8. **Riso** - Print aesthetic + bold blocks
9. **Sport** - Dynamic angles + performance data
10. **Carnival** - Playful asymmetry + color blocks
11. **Grid** - Swiss precision + modular layout

### Modern-Minimal Cluster
12. **Coral** - Clean data hierarchy + subtle accents
13. **Cobalt** - Technical precision + monospace pairing

### Atmospheric Cluster
14. **Bloom** - Dark mode + organic shapes
15. **Midnight** - Late-night aesthetic + neon accents
16. **Terminal** - Monospace everything + hacker vibes
17. **Aurora** - Gradient washes + ethereal
18. **Lumen** - High-contrast serif + elegant

### Playful Cluster
19. **Hum** - Rounded sans + warm humanist

### Flexible
20. **Bento Grid** - Tiled layout + irregular spans
21. **Marquee Hero** - Full-width statement + scrolling sections

---

## Pre-Flight Checklist (Before Shipping)

Run this checklist for EVERY page:

### ✅ Typography
- [ ] Max 2 fonts (display + body) or 3 with intentional outlier
- [ ] NO italic headers anywhere
- [ ] Headlines ≤ 7 words or size-adjusted if longer
- [ ] Body measure ≤ 75 characters
- [ ] Line height 1.5+ for body, 1.1-1.2 for headings

### ✅ Color & Contrast
- [ ] All text ≥ 4.5:1 contrast (WCAG AA)
- [ ] Large text ≥ 3:1 contrast
- [ ] NO pure black (#000) or pure gray
- [ ] All colors reference tokens (no inline hex/OKLCH)
- [ ] Accent color used consistently

### ✅ Spacing & Layout
- [ ] Section gaps = 48-64px
- [ ] Card padding = 24-32px
- [ ] Touch targets ≥ 44px
- [ ] NO horizontal scroll on mobile
- [ ] NO nested cards

### ✅ Interaction States
- [ ] All 8 states implemented: default, hover, focus, active, disabled, loading, error, success
- [ ] Focus outlines visible (≥ 3px, ≥ 3:1 contrast)
- [ ] Focus ring appears instantly (NO animation delay)
- [ ] Hover states lift + shadow increase
- [ ] Active states press down

### ✅ Motion & Animation
- [ ] Transitions ≤ 300ms
- [ ] Only transform/opacity animated
- [ ] NO bounce or elastic easing
- [ ] `prefers-reduced-motion` support (≤150ms opacity crossfade)
- [ ] NO animation on focus rings

### ✅ Anti-Slop Checks
- [ ] ZERO em-dashes (—) anywhere
- [ ] Different macrostructure from last build
- [ ] Different theme (or differs on ≥1 axis)
- [ ] NO invented metrics or fake testimonials
- [ ] NO "clean and modern" / "revolutionize" boilerplate
- [ ] NO Inter font as lazy default
- [ ] NO purple-to-blue gradients
- [ ] NO side-tab borders
- [ ] NO fake browser chrome
- [ ] NO section numbering (01 · 02 · 03) unless intentional

### ✅ Structure & Stamping
- [ ] Stamp comment at top of CSS with macrostructure name
- [ ] `tokens.css` file exported
- [ ] `.hallmark/log.json` updated with new entry
- [ ] `design.md` refreshed if system-managed project

---

## Implementation Guidelines

### When to Use This System
- **New pages:** Always (use full macrostructure rotation)
- **Redesigns:** Audit first, then apply (preserve content, replace visual layer)
- **Components:** Use tokens + 8-state discipline (skip macrostructure)
- **Existing projects:** Read pre-flight signals, preserve fonts/palette if established

### File Structure
```
project/
├── .hallmark/
│   ├── log.json (macrostructure rotation history)
│   └── preflight.json (cached scan results)
├── tokens.css (all design tokens)
├── design.md (optional: locked system for multi-page projects)
└── styles/
    ├── globals.css (framework entry + base rules)
    ├── components.css (reusable patterns)
    └── pages/
        ├── dashboard.css
        ├── generate.css
        ├── workflow.css
        └── execution.css
```

### Token Usage (MANDATORY)
```css
/* ❌ WRONG - Inline values */
.card {
  background: #ffffff;
  border: 2px solid #000000;
  box-shadow: 4px 4px 0 #000000;
}

/* ✅ CORRECT - Token references */
.card {
  background: var(--color-white);
  border: var(--border-width-default) solid var(--color-black);
  box-shadow: var(--shadow-md);
}
```

---

## Content Provenance & Attribution

Design principles synthesized and adapted from multiple sources for original application:

**Sources (content rephrased for licensing compliance):**
- Hallmark anti-slop design skill (Nutlope/hallmark, MIT License, GitHub)
- Neo-brutalism design movement principles (multiple public design resources)
- Taste Skill v2 design framework (Leonxlnx/taste-skill, MIT License, GitHub)
- Impeccable detector rules (pbakaus/impeccable, Apache 2.0 License, GitHub)
- Modern dev tool UI patterns observed from Linear, Vercel, Stripe, Retool public interfaces
- 2026 web design trends from public design community resources

All principles have been synthesized into an original, project-specific design system for LangGraph Dashboard.

---

## Version History

**v1.0.0** (2026-08-09)
- Initial comprehensive design system
- Combined Hallmark + Neo-Brutalism + Taste Skill + Impeccable
- 58 anti-slop gates implemented
- 21 macrostructure catalog defined
- Production-ready component patterns
- Pre-flight checklist established

**Next Steps:**
1. Apply to all 4 dashboard pages (generate, workflow, execution, history)
2. Generate with Stitch AI using this system as foundation
3. Integrate with LangGraph FastAPI backend
4. Deploy to production

---

**End of Ultimate Design System Document**
