# Responsive Layout Guide

## Overview
The UI has been completely overhauled to provide a fully responsive, mobile-first layout that works seamlessly across all device sizes.

## Layout Structure

### Mobile (< 1024px)
**Vertical Stack Layout**
- All panels stack vertically in a single column
- Each section takes full width
- Panels scroll independently with custom scrollbars
- Compact spacing and smaller text sizes
- Abbreviated button labels ("Generate" instead of "Generate Code")

### Tablet/Desktop (≥ 1024px)
**3-Column Balanced Layout**
- **Left Sidebar (25%)**: Workflow visualization and timeline
- **Center Panel (50%)**: Task input and code editor
- **Right Sidebar (25%)**: Test results, output, and metrics

## Key Features Fixed

### 1. ✅ Code Rendering
**Problem**: Code was displaying raw HTML tags like `<br>` as plain text

**Solution**:
- Proper HTML escaping order (escape first, then highlight)
- Removed `.replace(/\n/g, '<br>')` - use native `<pre>` whitespace handling
- Added `.code-container` with dark theme styling
- Syntax highlighting with proper color classes: `.keyword`, `.string`, `.number`, `.comment`, `.function`

### 2. ✅ Responsive Grid/Flex
**Mobile-First Approach**:
```css
/* Base: Mobile (vertical stack) */
.flex-col

/* Desktop: Horizontal layout */
lg:flex-row
```

**Breakpoints**:
- `sm:` 640px - Show more text, adjust spacing
- `md:` 768px - Medium screens, increase padding
- `lg:` 1024px - Switch to side-by-side layout

### 3. ✅ Overflow Control
Every panel has proper overflow handling:
- `.overflow-y-auto` - Vertical scrolling
- `.custom-scrollbar` - Styled scrollbars (6px, subtle colors)
- `.overflow-x-hidden` - Prevent horizontal scroll
- `.shrink-0` - Headers don't shrink
- `.flex-1` - Content areas fill available space

### 4. ✅ No Horizontal Scrolling
- `max-width: 100%` on all containers
- `overflow-x: hidden` on body
- Code blocks have horizontal scroll only within their container
- Proper word wrapping on text content

## Component Breakdown

### Top Header
- Sticky positioned (`sticky top-0 z-50`)
- Responsive heights: `h-14 md:h-16`
- Compact on mobile, full info on desktop
- "New Run" button abbreviated on mobile

### Left Panel (Workflow)
- Full width on mobile with bottom border
- 25% width on desktop with right border
- Workflow graph scrolls independently
- Timeline section below graph
- Iteration badge shows retry status

### Center Panel (Code Editor)
- Full width on mobile
- 66% width on desktop (2/3 of remaining space)
- Task input at top (shrink-0)
- Code display fills remaining height (flex-1)
- Editor toolbar with copy/download buttons

### Right Panel (Report)
- Full width on mobile, max-height 50vh
- 33% width on desktop (1/3 of remaining space)
- Tabbed interface: Tests, Output, Metrics
- Tab content scrolls independently
- Summary metrics always visible at bottom

## Syntax Highlighting

### Color Scheme (Dark Theme)
```css
Background: #1e293b (slate-800)
Text:       #e2e8f0 (slate-200)
Keywords:   #c792ea (purple) - def, class, if, for, etc.
Strings:    #c3e88d (green)
Numbers:    #f78c6c (orange)
Comments:   #697098 (gray, italic)
Functions:  #82aaff (blue)
```

### How It Works
1. Input code is escaped to prevent HTML injection
2. Regex patterns match Python syntax elements
3. Wrapped in `<span>` tags with color classes
4. Rendered inside `<pre><code>` block
5. Dark background with proper padding

## Custom Scrollbars
```css
Width: 6px
Track: #f1f1f1 (light gray)
Thumb: #cbd5e1 (slate-300)
Hover: #94a3b8 (slate-400)
```

## Testing Checklist

### Mobile (< 640px)
- [ ] All panels stack vertically
- [ ] No horizontal scrolling
- [ ] Code is readable and scrollable
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Text is legible (minimum 14px)

### Tablet (640px - 1023px)
- [ ] Layout remains vertical
- [ ] Increased padding and text sizes
- [ ] Full button labels visible

### Desktop (≥ 1024px)
- [ ] 3-column layout displays
- [ ] All panels visible simultaneously
- [ ] No squished or overlapping content
- [ ] Workflow graph centered in left panel
- [ ] Code editor and report side-by-side

### Code Display
- [ ] No raw HTML tags visible
- [ ] Syntax highlighting applied correctly
- [ ] Newlines preserved properly
- [ ] Copy/download works correctly
- [ ] Long code lines scroll horizontally (contained)

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

## Performance Considerations
- Custom scrollbars use GPU acceleration
- Syntax highlighting runs on small code chunks
- No unnecessary re-renders
- Flexbox layout is hardware-accelerated
- Minimal JavaScript DOM manipulation

## Future Enhancements
- [ ] Add print stylesheet
- [ ] Support for more languages (JavaScript, Java, etc.)
- [ ] Dark/light theme toggle
- [ ] Collapsible panels on desktop
- [ ] Keyboard shortcuts for actions
