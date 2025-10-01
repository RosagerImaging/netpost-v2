# NetPost V2 - UI Enhancement Tasks

## Project Context
- **Project**: NetPost V2 - AI-Native Reselling Assistant
- **Main File**: `apps/web/src/app/page.tsx` (Next.js 15.5.4 with React 19.1.0)
- **Tech Stack**: TypeScript, Tailwind CSS, Custom CSS-in-JS styling
- **Repository Root**: `/home/optiks/dev/netpost-v2`

## Tasks Overview
- **Total Tasks**: 5 (Tasks 3-7 from recent batch)
- **Status**: All pending implementation

---

## TASKS TO COMPLETE

### 🔄 Task 1: Hero Subcopy Text Optimization
- **ID**: `7515f610-8c4a-43d3-8d13-bdcfe918b7ba`
- **Title**: "p: Empower your reselling workflo"
- **Status**: `to do`
- **Priority**: HIGH (Conversion optimization)

**Task Description**: 
Change hero subcopy text to something shorter, straight to the point, and more likely to help convert customers.

**Current Implementation**:
```typescript
// File: apps/web/src/app/page.tsx (lines 442-444)
<p className="hero-subcopy">
  Empower your reselling workflow with intelligent, channel-aware automation. Publish once, optimize everywhere, and stay in control with NetPost.
</p>
```

**Target Element**:
- **Selector**: `div.jsx-558962fa3b4be12d.hero-shell:nth-child(2) > div.jsx-558962fa3b4be12d.hero-content > p.jsx-558962fa3b4be12d.hero-subcopy`
- **Location**: Hero section, below main headline
- **Bounding Box**: x:136, y:915, w:544, h:97

**Requirements**:
- Make text significantly shorter (current: 25 words → target: ~8-12 words)
- Focus on conversion-oriented language
- Maintain clarity about core value proposition
- Keep existing CSS classes and styling

**Suggested Approach**:
Replace with punchy, benefit-focused copy like:
- "List once, sell everywhere. AI-powered automation that actually converts."
- "Automate your listings. Maximize your sales. Start in minutes."
- "One listing, every marketplace. AI does the rest."

---

### 🔄 Task 2: Shader Effect Bottom Cutoff Fix
- **ID**: `a427e5b3-c421-4961-b853-d185905b0419`
- **Title**: "Colored Container"
- **Status**: `to do`
- **Priority**: MEDIUM (Visual polish)

**Task Description**:
The shader effect (Unicorn Studio animation) is being cut off at the bottom of the hero section.

**Current Implementation**:
```typescript
// File: apps/web/src/app/page.tsx (lines 145-154)
.hero-section {
  position: relative;
  z-index: 0;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  padding-top: clamp(90px, 14vh, 140px);
}
```

**Target Element**:
- **Selector**: `div.jsx-558962fa3b4be12d.min-h-screen:nth-child(2) > section.jsx-558962fa3b4be12d.hero-section:nth-child(2) > div.jsx-558962fa3b4be12d.hero-shell:nth-child(2)`
- **Location**: Hero section container
- **Bounding Box**: x:0, y:651, w:2419, h:549

**Requirements**:
- Increase hero section height to prevent shader cutoff
- Change `overflow: hidden` to `overflow: visible` or adjust container height
- Ensure shader animation (#unicorn-studio div) has sufficient space
- Maintain responsive behavior across screen sizes

**Suggested Approach**:
- Increase `min-height` from `100vh` to `120vh` or `130vh`
- Add `padding-bottom` to create space below content
- Consider adjusting `#unicorn-studio` positioning if needed

---

### 🔄 Task 3: Headline Text Cutoff Fix
- **ID**: `0c9f6dfb-26d3-48be-bd75-b067cb9281c2`
- **Title**: "Background Container"
- **Status**: `to do`
- **Priority**: HIGH (Text visibility)

**Task Description**:
When the screen is maximized, the end of the word "crosslisting" gets cut off in the animated headline.

**Current Implementation**:
```typescript
// File: apps/web/src/app/page.tsx (lines 174-179)
.hero-headline {
  font-family: 'Figtree', sans-serif !important;
  font-weight: 700 !important;
  font-size: clamp(2.5rem, 6.5vw, 6.25rem) !important;
  line-height: clamp(1.02, 1.5vw, 1.1) !important;
  letter-spacing: clamp(-0.018em, -0.12vw, -0.008em) !important;
}
```

**Target Element**:
- **Selector**: `h1.jsx-558962fa3b4be12d.hero-headline > div.stacked-animated-headline.leading-none > div.stacked-headline-line.whitespace-nowrap:nth-child(1)`
- **Location**: Main hero headline, specifically the "CROSSLISTING" line
- **Bounding Box**: x:136, y:651, w:620, h:120

**Requirements**:
- Ensure full text visibility on all screen sizes, especially maximized screens
- Reduce maximum font size or adjust container width
- Maintain responsive scaling
- Preserve animation functionality
- Consider word-break or text wrapping if needed

**Suggested Approach**:
- Reduce max font size from `6.25rem` to `5.5rem` or `5rem`
- Add `max-width: 100%` and `word-break: break-word` to headline
- Adjust viewport width calculation in clamp function
- Test on various screen sizes (1920px+, 2560px+, ultrawide)

---

### 🔄 Task 4: Login Link Emphasis
- **ID**: `bef7310b-9fd1-49e5-8f6a-5e3c29ba0857`
- **Title**: "Link: Login"
- **Status**: `to do`
- **Priority**: LOW (Visual enhancement)

**Task Description**:
Emphasize the login link with a color from the stone family that still allows for enough contrast from the text as well as the background of the navbar.

**Current Implementation**:
```typescript
// File: apps/web/src/app/page.tsx (lines 352-354)
<Button className="btn-secondary px-6 py-2 rounded-lg font-medium" asChild>
  <Link href="/login">Login</Link>
</Button>
```

**CSS Context**:
```css
.btn-secondary {
  background: linear-gradient(135deg, var(--secondary), var(--accent)) !important;
  color: var(--foreground) !important;
  border: none !important;
}
```

**Target Element**:
- **Selector**: `a[href="/login"]`
- **Location**: Navigation bar, right side
- **Bounding Box**: x:1633, y:19, w:83, h:40

**Requirements**:
- Use stone family colors (grays, warm grays, beiges)
- Maintain sufficient contrast ratio (WCAG AA: 4.5:1 minimum)
- Work against glass navbar background
- Preserve existing button styling structure
- Consider hover states

**Stone Color Palette Suggestions**:
- `oklch(0.45 0.02 45)` - Warm stone gray
- `oklch(0.55 0.03 35)` - Light stone beige  
- `oklch(0.40 0.04 50)` - Medium stone brown
- `oklch(0.35 0.02 40)` - Dark stone gray

**Suggested Approach**:
- Create new `.btn-stone` class or modify `.btn-secondary`
- Use stone color for background with appropriate text contrast
- Add subtle hover effect with slightly lighter stone tone

---

### 🔄 Task 5: Logo and NetPost Text Enhancement
- **ID**: `4771cca1-db38-430d-b54b-55e094d6c689`
- **Title**: "Colored Container"  
- **Status**: `to do`
- **Priority**: MEDIUM (Brand visibility)

**Task Description**:
Make the logo and text larger and add a gradient to the "NetPost" text.

**Current Implementation**:
```typescript
// File: apps/web/src/app/page.tsx (lines 330-337)
<div className="flex items-center gap-3">
  <div className="h-11 w-11 feature-icon-primary rounded-xl flex items-center justify-center">
    <span className="text-white font-semibold text-xl">N</span>
  </div>
  <span className="font-bold text-lg md:text-xl" style={{ color: 'var(--foreground)' }}>
    NetPost
  </span>
</div>
```

**Target Element**:
- **Selector**: `nav.jsx-558962fa3b4be12d.glass > div.jsx-558962fa3b4be12d.mx-auto > div.jsx-558962fa3b4be12d.items-center:nth-child(1)`
- **Location**: Navigation bar, left side (logo + text)
- **Bounding Box**: x:594, y:17, w:134, h:44

**Requirements**:
- Increase logo size (currently h-11 w-11, suggest h-12 w-12 or h-13 w-13)
- Increase "NetPost" text size (currently text-lg md:text-xl)
- Add gradient effect to "NetPost" text
- Maintain responsive behavior
- Preserve existing layout and alignment

**Gradient Suggestions**:
- Primary brand gradient: `linear-gradient(135deg, var(--primary), var(--ring))`
- Accent gradient: `linear-gradient(135deg, var(--ring), var(--accent))`
- Custom teal gradient: `linear-gradient(135deg, #0891b2, #06b6d4)`

**Suggested Approach**:
- Increase logo container to `h-12 w-12` or `h-13 w-13`
- Change text size to `text-xl md:text-2xl`
- Add `.text-gradient-primary` class or create new gradient class
- Use `background-clip: text` and `-webkit-text-fill-color: transparent`
- Test on mobile and desktop viewports

---

## Implementation Notes

### File Structure
- **Main Page**: `apps/web/src/app/page.tsx`
- **Components**: `apps/web/src/components/ui/`
- **Styles**: Inline CSS-in-JS within page component

### CSS Variables Available
```css
--primary: oklch(0.5161 0.0791 234.7598);
--ring: oklch(0.5166 0.0931 181.0803);
--secondary: oklch(0.9476 0.0190 192.8095);
--accent: oklch(0.8708 0.0470 189.6325);
--foreground: oklch(0.9851 0 0);
--muted-foreground: oklch(0.7039 0.0189 175.6460);
```

### Testing Requirements
- Test on multiple screen sizes (mobile, tablet, desktop, ultrawide)
- Verify accessibility contrast ratios
- Ensure animations still work after changes
- Check responsive behavior
- Validate TypeScript compilation

### Development Server
- Run: `cd apps/web && npm run dev`
- URL: `http://localhost:3000` (or next available port)
- Hot reload enabled for immediate feedback

---

## Task Completion Checklist

For each task:
- [ ] Implement the requested changes
- [ ] Test on multiple screen sizes
- [ ] Verify no TypeScript errors
- [ ] Check accessibility compliance
- [ ] Take screenshot for verification if possible
