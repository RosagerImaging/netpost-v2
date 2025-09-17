# NetPost V2 UI Component Reference

## Purpose

This guide ensures BMad Development agents use the existing UI components from `/ui-preview` to maintain design consistency across the NetPost V2 application.

## 🎨 Design System Overview

### **Color Palette**
```css
--color-bg: #111111;                    /* Main background */
--color-sidebar-bg: #1C1C1E;           /* Sidebar background */
--color-primary-interactive: #00BFFF;   /* Primary brand color (DeepSkyBlue) */
--color-accent: #FFD700;                /* Accent color (Gold) */
--color-primary-text: #E5E5E5;         /* Primary text */
--color-secondary-text: #8E8E93;       /* Secondary text */
```

### **Design Principles**
- **Dark Theme Aesthetic:** Near-black backgrounds with light text
- **Glassmorphism Effects:** Semi-transparent backgrounds with backdrop blur
- **Modern Minimalism:** Clean, uncluttered interfaces
- **Accessibility:** WCAG AA+ compliance with proper contrast ratios

## 🧱 Available UI Components

### **Base Components** (`/ui-preview/packages/ui/src/`)

#### **Button** (`button.tsx`)
```tsx
import { Button } from "@repo/ui";

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
<Button variant="default" size="default">Click me</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="destructive">Delete</Button>
```

#### **Input** (`input.tsx`)
```tsx
import { Input } from "@repo/ui";

<Input
  type="email"
  placeholder="you@example.com"
  className="bg-black/20 border-white/20 text-primary-text"
/>
```

#### **Card** (`card.tsx`)
```tsx
import { Card } from "@repo/ui";

<Card className="bg-white/10 backdrop-blur-md border-white/10">
  <CardContent>Content here</CardContent>
</Card>
```

#### **Other Base Components**
- `Badge` - Status indicators and labels
- `Label` - Form labels with proper typography
- `Select` - Dropdown selections
- `Textarea` - Multi-line text input
- `Table` - Data display tables
- `Checkbox` - Form checkboxes
- `DropdownMenu` - Context menus

### **Page Components** (`/ui-preview/apps/web/components/`)

#### **Shared Components** (`/shared/`)

##### **Sidebar** (`sidebar.tsx`)
```tsx
import Sidebar from "@/components/shared/sidebar";

// Navigation items:
// - Dashboard, Inventory, AI Assistant, Marketplace Integrations, Settings
// - Responsive with mobile menu
// - Collapsible on desktop
<Sidebar />
```

#### **Authentication Components** (`/login-sign-up/`)
- **Login/Signup Forms** with glassmorphism styling
- **Password toggle visibility**
- **Form validation states**
- **Responsive design**

#### **Dashboard Components** (`/dashboard/`)
- `StatCard` - Metric display cards
- `SalesChart` - Chart components
- `RecentActivity` - Activity feed

#### **Inventory Components** (`/inventory/`)
- `ItemEditorForm` - Item editing forms
- `ItemActionsPanel` - Action buttons and controls

#### **Item Detail Editor** (`/item-detail-editor/`)
- `EditorFormLeftColumn` - Form inputs
- `ActionsPanel` - Right column actions
- `ImageGallery` - Image management

## 🎯 Implementation Guidelines for BMad Dev Agents

### **MANDATORY: Always Use Existing Components**

When implementing any UI feature:

1. **✅ DO:** Import and use components from `/ui-preview`
2. **❌ DON'T:** Create new components that duplicate existing functionality
3. **✅ DO:** Extend existing components with additional props if needed
4. **❌ DON'T:** Override core styling that breaks design consistency

### **Import Patterns**

```tsx
// Base components from shared package
import { Button, Input, Card, Label } from "@repo/ui";

// Page-specific components (relative imports within app)
import Sidebar from "@/components/shared/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";

// Utility functions
import { cn } from "@repo/lib";
```

### **Styling Patterns**

#### **Container Layouts**
```tsx
// Main page container
<div className="flex min-h-screen bg-[#111111]">
  <Sidebar />
  <main className="flex-1 p-6">
    {/* Page content */}
  </main>
</div>

// Glassmorphism card
<div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
  {/* Card content */}
</div>
```

#### **Form Patterns**
```tsx
// Standard form layout
<form className="space-y-4">
  <div className="grid w-full items-center gap-1.5">
    <Label htmlFor="field">Field Label</Label>
    <Input
      id="field"
      type="text"
      className="bg-black/20 border-white/20 text-primary-text"
      placeholder="Enter value..."
    />
  </div>
  <Button type="submit" className="w-full">
    Submit
  </Button>
</form>
```

#### **Color Usage**
```tsx
// Text colors
className="text-primary-text"      // Main text: #E5E5E5
className="text-secondary-text"    // Secondary: #8E8E93

// Interactive elements
className="text-primary-interactive" // Links/buttons: #00BFFF
className="hover:text-primary-interactive"

// Backgrounds
className="bg-[#111111]"           // Main background
className="bg-white/10"            // Glassmorphism overlays
className="bg-black/20"            // Input backgrounds
```

## 📁 File Organization Reference

### **UI Preview Structure**
```
ui-preview/
├── packages/ui/src/           # Base component library
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── [other-components].tsx
│
├── apps/web/components/       # Page-specific components
│   ├── shared/               # Reusable layout components
│   │   └── sidebar.tsx
│   ├── dashboard/           # Dashboard-specific
│   ├── inventory/          # Inventory-specific
│   ├── login-sign-up/     # Authentication
│   └── [other-features]/
│
└── apps/web/app/            # Next.js App Router pages
    ├── globals.css         # Design system CSS
    └── [routes]/
```

### **Target Project Structure** (Implement here)
```
apps/web/
├── src/app/
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected app pages
│   └── globals.css       # Copy design system CSS
│
├── components/            # Copy components from ui-preview
│   ├── shared/
│   ├── dashboard/
│   └── [features]/
│
└── lib/                  # Utilities (cn function, etc.)
```

## ✅ Development Checklist

When implementing any UI feature, BMad Dev agents must:

- [ ] **Reference existing components** in `/ui-preview` before coding
- [ ] **Copy exact component code** if component doesn't exist in target
- [ ] **Use established color variables** from globals.css
- [ ] **Follow naming conventions** from existing components
- [ ] **Maintain glassmorphism styling** for modals and cards
- [ ] **Ensure responsive design** matches preview patterns
- [ ] **Test dark theme compatibility** (all components are dark-themed)
- [ ] **Verify accessibility** (keyboard navigation, contrast ratios)

## 🚨 Common Mistakes to Avoid

1. **Creating new color schemes** - Use only the established palette
2. **Light theme styling** - All components must be dark theme compatible
3. **Inconsistent spacing** - Follow existing padding/margin patterns
4. **Custom button styles** - Use Button component variants instead
5. **Breaking glassmorphism** - Maintain backdrop-blur and transparency effects

## 📚 Additional Resources

- **Design tokens:** `/ui-preview/apps/web/app/globals.css`
- **Component examples:** All files in `/ui-preview/apps/web/components/`
- **Tailwind config:** `/ui-preview/tailwind.config.js`
- **Package structure:** `/ui-preview/packages/ui/`

---

**Remember:** The UI preview directory contains the complete, tested design system. Always reference these components to ensure NetPost V2 maintains its professional, consistent visual identity.