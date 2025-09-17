# Develop UI Features Using Existing Components

## Purpose

Guide development agents to implement UI features using the existing component library from `/ui-preview` to ensure design consistency and avoid duplicate code.

## Prerequisites

- Story file specifies UI implementation requirements
- UI component reference loaded (`ui-component-reference.md`)
- Understanding of NetPost V2 design system

## Task Execution

### Phase 1: Component Analysis

1. **Load UI Component Reference**
   - Read `ui-component-reference.md` from dependencies
   - Understand available components and their usage patterns
   - Review design system colors and styling conventions

2. **Analyze Story Requirements**
   - Identify UI elements needed from acceptance criteria
   - Map story requirements to existing components
   - Note any custom components that may be needed

3. **Check UI Preview Directory**
   - Examine `/ui-preview/apps/web/components/` for relevant page components
   - Review `/ui-preview/packages/ui/src/` for base components
   - Identify reusable patterns from similar features

### Phase 2: Implementation Planning

4. **Component Inventory**
   - List all components needed for the feature
   - Identify which exist in ui-preview vs need creation
   - Plan import statements and file organization

5. **Styling Strategy**
   - Confirm adherence to dark theme design system
   - Plan glassmorphism effects for modals/cards
   - Ensure responsive design patterns

### Phase 3: Implementation

6. **Copy Components from UI Preview**
   ```bash
   # Copy base components to shared UI package
   cp ui-preview/packages/ui/src/[component].tsx packages/ui/src/

   # Copy page-specific components to app
   cp -r ui-preview/apps/web/components/[feature]/ apps/web/components/
   ```

7. **Import Existing Components**
   ```tsx
   // Base components from shared package
   import { Button, Input, Card, Label } from "@repo/ui";

   // Page-specific components (if already exist)
   import { Sidebar } from "@/components/shared/sidebar";
   ```

8. **Apply Design System Standards**
   ```tsx
   // Use established color classes
   className="text-primary-text bg-[#111111]"

   // Glassmorphism pattern
   className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md"

   // Interactive elements
   className="text-primary-interactive hover:text-primary-interactive/90"
   ```

### Phase 4: Integration

9. **File Organization**
   - Place components in appropriate directories
   - Follow existing import/export patterns
   - Update package.json dependencies if needed

10. **Responsive Implementation**
    - Test mobile responsiveness
    - Ensure sidebar collapses appropriately
    - Verify touch-friendly interface elements

### Phase 5: Validation

11. **Design Consistency Check**
    - Compare with ui-preview visual examples
    - Verify color palette adherence
    - Confirm typography consistency

12. **Accessibility Validation**
    - Check keyboard navigation
    - Verify color contrast ratios
    - Test screen reader compatibility

## Component Usage Examples

### **Authentication Forms**
```tsx
// Based on ui-preview/apps/web/app/(auth)/login-sign-up/login-signup-page.txt
<div className="flex min-h-screen items-center justify-center bg-[#111111]">
  <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
    <form className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          type="email"
          id="email"
          placeholder="you@example.com"
          className="bg-black/20 border-white/20 text-primary-text"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  </div>
</div>
```

### **Dashboard Layout**
```tsx
// Based on ui-preview sidebar and layout patterns
<div className="flex min-h-screen bg-[#111111]">
  <Sidebar />
  <main className="flex-1 p-6">
    <div className="grid gap-6">
      <StatCard title="Total Items" value="1,234" />
      <Card className="bg-white/10 border-white/10 p-6">
        <CardContent>
          {/* Dashboard content */}
        </CardContent>
      </Card>
    </div>
  </main>
</div>
```

### **Form Patterns**
```tsx
// Standard form styling from ui-preview
<form className="space-y-4 max-w-md">
  <div className="space-y-2">
    <Label htmlFor="title">Item Title</Label>
    <Input
      id="title"
      type="text"
      placeholder="Enter item title..."
      className="bg-black/20 border-white/20 text-primary-text"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      placeholder="Describe your item..."
      className="bg-black/20 border-white/20 text-primary-text"
    />
  </div>
  <div className="flex gap-2">
    <Button variant="default" className="flex-1">Save</Button>
    <Button variant="outline">Cancel</Button>
  </div>
</form>
```

## Error Prevention Guidelines

### **❌ DON'T:**
- Create new color schemes or themes
- Implement light theme styling
- Create custom button components when Button variants exist
- Use inline styles that override design system
- Break glassmorphism patterns for cards/modals

### **✅ DO:**
- Always reference ui-preview components first
- Copy exact component code when available
- Use established CSS classes and color variables
- Maintain responsive design patterns
- Follow existing naming conventions

## Integration with Development Workflow

### **Story Implementation Process**
1. **Read story requirements** → **Load ui-component-reference.md**
2. **Map UI needs to existing components** → **Copy/import components**
3. **Implement with design system** → **Test consistency**
4. **Update Dev Agent Record** with component usage

### **File List Documentation**
When completing development, include in Dev Agent Record:

```markdown
### UI Components Used

**From UI Preview:**
- `/ui-preview/packages/ui/src/button.tsx` → `packages/ui/src/button.tsx`
- `/ui-preview/apps/web/components/shared/sidebar.tsx` → `apps/web/components/shared/sidebar.tsx`

**Custom Components Created:**
- `apps/web/components/inventory/item-list.tsx` (extends Card component pattern)

**Design System Adherence:**
- Color palette: ✅ All colors from established variables
- Glassmorphism: ✅ Applied to modal and card components
- Typography: ✅ Consistent with design system
- Responsive: ✅ Mobile-first approach maintained
```

## Success Criteria

- [ ] All UI components reference existing ui-preview implementations
- [ ] Design system colors and styling maintained
- [ ] Responsive design patterns followed
- [ ] Glassmorphism effects properly implemented
- [ ] Accessibility standards met
- [ ] Code organization follows established patterns
- [ ] No duplicate component creation

## Integration Notes

- This task should be referenced by development agents for any UI-related story
- Combine with existing development workflows
- Update story Dev Agent Record with component usage details
- Ensure QA agents can verify design consistency during review