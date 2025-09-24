# NetPost V2 - Design System Bridge

## Overview

This document bridges the gap between the UI specification requirements and the available ShadCN component library, creating a practical implementation guide for consistent, high-quality UI development.

## Design Token System

### Color Palette (CSS Custom Properties)

```css
:root {
  /* Brand Colors */
  --color-primary: #00BFFF;         /* DeepSkyBlue */
  --color-primary-dark: #0099CC;    /* Darker variant */
  --color-primary-light: #33CCFF;   /* Lighter variant */

  --color-accent: #FFD700;          /* Gold */
  --color-accent-dark: #E6C200;     /* Darker gold */
  --color-accent-light: #FFEB66;    /* Lighter gold */

  /* Dark Theme Background System */
  --color-background-primary: #0A0A0B;     /* Near black */
  --color-background-secondary: #1A1A1C;   /* Dark gray */
  --color-background-tertiary: #2A2A2D;    /* Medium dark */

  /* Text Colors */
  --color-text-primary: #F5F5F7;     /* Off-white */
  --color-text-secondary: #B0B0B3;   /* Light gray */
  --color-text-muted: #808083;       /* Medium gray */

  /* Border & Surface */
  --color-border-primary: #3A3A3D;   /* Subtle borders */
  --color-border-secondary: #2A2A2D; /* Lighter borders */

  /* Status Colors */
  --color-success: #34D399;          /* Green */
  --color-warning: #FBBF24;          /* Amber */
  --color-error: #EF4444;            /* Red */
  --color-info: #60A5FA;             /* Blue */

  /* Glassmorphism Effects */
  --glass-background: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-backdrop: blur(10px);
}
```

### Typography Scale (Inter Font System)

```css
:root {
  /* Font Family */
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Menlo', 'Monaco', monospace;

  /* Font Sizes (8-point scale) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Spacing System (8-point grid)

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Animation System

```css
:root {
  /* Timing Functions */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* Durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Transitions */
  --transition-fast: all var(--duration-fast) var(--ease-in-out);
  --transition-normal: all var(--duration-normal) var(--ease-in-out);
  --transition-slow: all var(--duration-slow) var(--ease-in-out);
}
```

---

## Component Mapping & Implementation Guide

### 1. Layout Components

#### Main Dashboard Layout
**Base Component**: `@shadcn/dashboard-01`

**Customizations Needed**:
```tsx
// apps/web/src/components/layout/DashboardLayout.tsx
import { Dashboard01 } from "@shadcn/dashboard-01";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-glass-container">
      <Dashboard01
        sidebarConfig={{
          sections: [
            {
              title: "Main",
              items: [
                { icon: "BarChart3", label: "Dashboard", href: "/" },
                { icon: "Package", label: "Inventory", href: "/inventory" },
                { icon: "Bot", label: "AI Assistant", href: "/ai" },
              ]
            },
            {
              title: "Platforms",
              items: [
                { icon: "ExternalLink", label: "Integrations", href: "/platforms" }
              ]
            }
          ]
        }}
        theme="dark"
        glassEffect={true}
      >
        {children}
      </Dashboard01>
    </div>
  );
}
```

**Required CSS**:
```css
.dashboard-glass-container {
  background: var(--color-background-primary);
  min-height: 100vh;
}

.dashboard-glass-container .sidebar {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
}
```

#### Sidebar Navigation
**Base Component**: `@shadcn/sidebar-01`

**Implementation**:
```tsx
// apps/web/src/components/layout/AppSidebar.tsx
import { Sidebar01 } from "@shadcn/sidebar-01";
import { Package, BarChart3, Bot, Settings, ExternalLink } from "lucide-react";

const navigationSections = [
  {
    title: "Main",
    items: [
      { icon: BarChart3, label: "Dashboard", href: "/", badge: null },
      { icon: Package, label: "Inventory", href: "/inventory", badge: "247" },
      { icon: Bot, label: "AI Assistant", href: "/ai", badge: "new" },
    ]
  },
  {
    title: "Platform",
    items: [
      { icon: ExternalLink, label: "Integrations", href: "/platforms", badge: null },
      { icon: Settings, label: "Settings", href: "/settings", badge: null },
    ]
  }
];

export function AppSidebar() {
  return (
    <Sidebar01
      sections={navigationSections}
      collapsible={true}
      className="app-sidebar-glass"
    />
  );
}
```

### 2. Data Display Components

#### Inventory Table
**Base Component**: `@reui/data-grid-table`

**Implementation**:
```tsx
// apps/web/src/components/inventory/InventoryTable.tsx
import { DataGridTable } from "@reui/data-grid-table";
import { Badge } from "@shadcn/ui/badge";

const columns = [
  {
    id: "image",
    header: "Photo",
    cell: ({ row }) => (
      <img
        src={row.original.imageUrl}
        alt={row.original.title}
        className="w-12 h-12 rounded-lg object-cover glass-border"
      />
    )
  },
  {
    id: "title",
    header: "Title",
    accessorKey: "title",
    sortable: true
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} />
    )
  },
  {
    id: "price",
    header: "Price",
    accessorKey: "price",
    sortable: true,
    cell: ({ value }) => `$${value.toFixed(2)}`
  },
  {
    id: "platforms",
    header: "Platforms",
    cell: ({ row }) => (
      <PlatformIndicators platforms={row.original.platforms} />
    )
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ItemActionMenu item={row.original} />
    )
  }
];

export function InventoryTable({ data, loading }) {
  return (
    <DataGridTable
      data={data}
      columns={columns}
      loading={loading}
      className="inventory-glass-table"
      features={{
        sorting: true,
        filtering: true,
        bulkActions: true,
        pagination: true
      }}
    />
  );
}
```

#### Status Badge System
```tsx
// apps/web/src/components/ui/StatusBadge.tsx
const statusConfig = {
  active: {
    color: "success",
    icon: "CheckCircle",
    label: "Active"
  },
  draft: {
    color: "warning",
    icon: "Clock",
    label: "Draft"
  },
  sold: {
    color: "info",
    icon: "DollarSign",
    label: "Sold"
  },
  pending: {
    color: "muted",
    icon: "Loader",
    label: "Pending"
  }
};

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status];
  const Icon = icons[config.icon];

  return (
    <Badge
      variant={config.color}
      className="status-badge glass-badge"
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
```

### 3. Authentication Components

#### Login Form
**Base Component**: `@shadcn/login-04`

**Implementation**:
```tsx
// apps/web/src/components/auth/LoginForm.tsx
import { Login04 } from "@shadcn/login-04";

export function LoginForm() {
  return (
    <div className="auth-container">
      <Login04
        config={{
          title: "Welcome to NetPost V2",
          subtitle: "Streamline your reselling business with AI",
          socialProviders: ["google", "apple"],
          heroImage: "/images/reselling-hero.jpg",
          theme: "dark-glass"
        }}
        onSubmit={handleLogin}
        className="auth-glass-form"
      />
    </div>
  );
}
```

### 4. Mobile Components (React Native)

#### Mobile Camera Interface
```tsx
// apps/mobile/src/components/camera/CameraInterface.tsx
import { Camera } from 'expo-camera';
import { View, TouchableOpacity } from 'react-native';

export function CameraInterface() {
  return (
    <View className="camera-container">
      <Camera style={styles.camera} ref={cameraRef}>
        <View className="camera-overlay">
          {/* Camera controls */}
          <TouchableOpacity className="capture-button glass-button">
            <CameraIcon />
          </TouchableOpacity>

          <View className="action-buttons">
            <TouchableOpacity className="barcode-button glass-button-small">
              <ScanIcon />
            </TouchableOpacity>
            <TouchableOpacity className="ai-button glass-button-small">
              <BotIcon />
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}
```

---

## CSS Implementation Guide

### Glassmorphism Effects

```css
/* Base glass effect classes */
.glass-container {
  background: var(--glass-background);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: var(--space-2);
}

.glass-button {
  @apply glass-container;
  transition: var(--transition-fast);
  cursor: pointer;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.glass-card {
  @apply glass-container;
  padding: var(--space-6);
  margin-bottom: var(--space-4);
}

/* Status-specific glass effects */
.status-badge.glass-badge {
  @apply glass-container;
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
}

.status-badge.success {
  border-color: var(--color-success);
  color: var(--color-success);
}

.status-badge.warning {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

/* Table glass styling */
.inventory-glass-table {
  background: var(--glass-background);
  border-radius: var(--space-2);
  overflow: hidden;
}

.inventory-glass-table th {
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--glass-border);
}

.inventory-glass-table td {
  border-bottom: 1px solid var(--color-border-secondary);
}

.inventory-glass-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}
```

### Responsive Design Implementation

```css
/* Mobile-first responsive classes */
@media (max-width: 768px) {
  .dashboard-glass-container .sidebar {
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-in-out);
  }

  .dashboard-glass-container .sidebar.open {
    transform: translateX(0);
  }

  .inventory-glass-table {
    font-size: var(--text-sm);
  }

  .glass-card {
    padding: var(--space-4);
  }
}

@media (min-width: 1024px) {
  .dashboard-glass-container {
    display: grid;
    grid-template-columns: 240px 1fr;
  }
}
```

---

## Animation Implementation

### Micro-interactions

```css
/* Button interactions */
@keyframes button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.glass-button:active {
  animation: button-press var(--duration-fast) var(--ease-in-out);
}

/* Loading states */
@keyframes pulse-glass {
  0%, 100% {
    background: var(--glass-background);
    border-color: var(--glass-border);
  }
  50% {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

.loading-glass {
  animation: pulse-glass 2s infinite;
}

/* Status transitions */
.status-badge {
  transition: all var(--duration-normal) var(--ease-in-out);
}

/* Modal appearances */
@keyframes modal-appear {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-glass {
  animation: modal-appear var(--duration-normal) var(--ease-out);
}
```

---

## Implementation Roadmap

### Phase 1: Foundation Setup (Week 1)
1. Install required ShadCN components
2. Set up design token system
3. Create base layout components
4. Implement glassmorphism CSS classes

### Phase 2: Core Components (Week 2)
1. Build inventory table with advanced features
2. Implement authentication flows
3. Create dashboard widgets
4. Add mobile camera interface

### Phase 3: Polish & Animation (Week 3)
1. Add micro-interactions
2. Implement loading states
3. Create status transition animations
4. Test responsive behavior

### Phase 4: Integration (Week 4)
1. Connect components to existing API
2. Add real-time data updates
3. Implement AI integration points
4. Performance optimization

---

## Component Installation Commands

```bash
# Core layout components
npx shadcn@latest add @shadcn/dashboard-01
npx shadcn@latest add @shadcn/sidebar-01

# Data components
npx shadcn@latest add @reui/data-grid-table
npx shadcn@latest add @shadcn/table

# Form & auth components
npx shadcn@latest add @shadcn/login-04
npx shadcn@latest add @shadcn/form

# UI primitives
npx shadcn@latest add @shadcn/badge
npx shadcn@latest add @shadcn/button
npx shadcn@latest add @shadcn/card
npx shadcn@latest add @shadcn/dialog
```

This design system bridges your excellent UI specifications with practical, implementable components while maintaining the high-quality aesthetic you've defined.