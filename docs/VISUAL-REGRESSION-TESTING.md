# NetPost V2 - Visual Regression Testing & Design Validation

## Overview

This document outlines a comprehensive visual regression testing system to ensure UI implementations match design specifications and catch unintended visual changes during development.

## Testing Strategy

### 1. Multi-Level Visual Validation
- **Component Level**: Individual UI components in isolation
- **Page Level**: Complete screen layouts and user flows
- **Cross-Browser**: Consistency across different browsers
- **Responsive**: Visual validation across different viewport sizes
- **Interaction States**: Hover, focus, active, and error states

### 2. Automated Visual Regression
- **Playwright Visual Testing**: Screenshot comparisons
- **Percy/Chromatic Integration**: Cloud-based visual diffing
- **CI/CD Integration**: Automated validation on pull requests
- **Baseline Management**: Version-controlled reference images

---

## Implementation Plan

### Playwright Visual Testing Setup

```typescript
// tests/visual/playwright.visual.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './visual',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
        isMobile: true,
      },
    },
    {
      name: 'Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
        isMobile: true,
      },
    },
  ],
  expect: {
    // Threshold for visual comparisons (0-1, where 1 is 100% match required)
    threshold: 0.95,
    // Animation handling
    toHaveScreenshot: { animations: 'disabled' },
  },
});
```

### Core Visual Test Suite

```typescript
// tests/visual/core-layouts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core Layout Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('Dashboard - Main View', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for data to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="dashboard-metrics"]');

    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: true,
    });
  });

  test('Dashboard - Sidebar Collapsed', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Collapse sidebar
    await page.click('[data-testid="sidebar-toggle"]');
    await page.waitForTimeout(300); // Allow for transition

    await expect(page).toHaveScreenshot('dashboard-sidebar-collapsed.png', {
      fullPage: true,
    });
  });

  test('Inventory - Table View', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="inventory-table"]');

    await expect(page).toHaveScreenshot('inventory-table.png', {
      fullPage: true,
    });
  });

  test('Inventory - Grid View', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Switch to grid view
    await page.click('[data-testid="view-toggle-grid"]');
    await page.waitForSelector('[data-testid="inventory-grid"]');

    await expect(page).toHaveScreenshot('inventory-grid.png', {
      fullPage: true,
    });
  });
});
```

### Component-Level Visual Tests

```typescript
// tests/visual/components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests', () => {
  test('Status Badges - All Variants', async ({ page }) => {
    await page.goto('/storybook/status-badges');

    const statusBadges = page.locator('[data-testid="status-badge"]');

    // Test each status variant
    const statuses = ['active', 'draft', 'sold', 'pending'];

    for (const status of statuses) {
      const badge = statusBadges.filter({ hasText: status });
      await expect(badge).toHaveScreenshot(`badge-${status}.png`);
    }
  });

  test('Glass Effect Components', async ({ page }) => {
    await page.goto('/storybook/glass-components');

    // Test glass cards
    const glassCard = page.locator('[data-testid="glass-card"]').first();
    await expect(glassCard).toHaveScreenshot('glass-card.png');

    // Test glass buttons in different states
    const glassButton = page.locator('[data-testid="glass-button"]').first();

    // Default state
    await expect(glassButton).toHaveScreenshot('glass-button-default.png');

    // Hover state
    await glassButton.hover();
    await expect(glassButton).toHaveScreenshot('glass-button-hover.png');
  });

  test('Data Table - Various States', async ({ page }) => {
    await page.goto('/storybook/data-table');

    const table = page.locator('[data-testid="data-table"]');

    // Default state
    await expect(table).toHaveScreenshot('data-table-default.png');

    // Loading state
    await page.click('[data-testid="toggle-loading"]');
    await expect(table).toHaveScreenshot('data-table-loading.png');

    // With selection
    await page.click('[data-testid="toggle-loading"]'); // Turn off loading
    await page.click('[data-testid="select-row-0"]');
    await expect(table).toHaveScreenshot('data-table-selection.png');
  });
});
```

### Mobile-Specific Visual Tests

```typescript
// tests/visual/mobile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Visual Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Mobile Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-dashboard.png', {
      fullPage: true,
    });
  });

  test('Mobile Navigation Menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForSelector('[data-testid="mobile-menu"]');

    await expect(page).toHaveScreenshot('mobile-menu-open.png', {
      fullPage: true,
    });
  });

  test('Mobile Inventory Cards', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mobile-inventory-cards.png', {
      fullPage: true,
    });
  });
});
```

### Authentication Flow Visual Tests

```typescript
// tests/visual/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Visual Tests', () => {
  test('Login Page - Desktop', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-desktop.png', {
      fullPage: true,
    });
  });

  test('Login Form - Error States', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Submit empty form to show validation errors
    await page.click('[data-testid="login-submit"]');
    await page.waitForSelector('[data-testid="form-errors"]');

    await expect(page.locator('[data-testid="login-form"]')).toHaveScreenshot('login-form-errors.png');
  });

  test('Signup Flow', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('signup-form.png', {
      fullPage: true,
    });
  });
});
```

### User Flow Visual Tests

```typescript
// tests/visual/user-flows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Flow Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Add New Item Flow', async ({ page }) => {
    // Start from dashboard
    await expect(page).toHaveScreenshot('flow-1-dashboard-start.png');

    // Click add item
    await page.click('[data-testid="add-item-button"]');
    await page.waitForSelector('[data-testid="add-item-modal"]');
    await expect(page).toHaveScreenshot('flow-2-add-item-modal.png');

    // Fill form
    await page.fill('[data-testid="item-title"]', 'Vintage Watch');
    await page.selectOption('[data-testid="item-category"]', 'jewelry');
    await page.fill('[data-testid="item-price"]', '2500');

    await expect(page.locator('[data-testid="add-item-modal"]')).toHaveScreenshot('flow-3-form-filled.png');

    // Submit and verify success
    await page.click('[data-testid="save-item"]');
    await page.waitForSelector('[data-testid="success-toast"]');
    await expect(page).toHaveScreenshot('flow-4-success-state.png');
  });

  test('Inventory Filtering Flow', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Initial state
    await expect(page).toHaveScreenshot('filter-1-initial.png');

    // Apply status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('[data-testid="status-active"]');
    await page.waitForSelector('[data-testid="filtered-results"]');

    await expect(page).toHaveScreenshot('filter-2-active-only.png');

    // Add search term
    await page.fill('[data-testid="search-input"]', 'watch');
    await page.waitForTimeout(500); // Debounce

    await expect(page).toHaveScreenshot('filter-3-search-applied.png');
  });
});
```

### Dark Mode & Theme Testing

```typescript
// tests/visual/theme-testing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Theme Visual Tests', () => {
  test('Dark Mode - All Core Pages', async ({ page }) => {
    // Set dark mode
    await page.goto('/dashboard');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(200);

    // Dashboard
    await expect(page).toHaveScreenshot('dark-dashboard.png', { fullPage: true });

    // Inventory
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dark-inventory.png', { fullPage: true });

    // Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('dark-settings.png', { fullPage: true });
  });

  test('Glassmorphism Effects - Dark Theme', async ({ page }) => {
    await page.goto('/storybook/glass-showcase');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const showcase = page.locator('[data-testid="glass-showcase"]');
    await expect(showcase).toHaveScreenshot('glassmorphism-dark.png');
  });
});
```

### Performance & Accessibility Visual Tests

```typescript
// tests/visual/accessibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility Visual Tests', () => {
  test('Focus States - All Interactive Elements', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Focus on first button and screenshot
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-first-element.png');

    // Continue tabbing through interface
    await page.keyboard.press('Tab');
    await expect(page).toHaveScreenshot('focus-second-element.png');
  });

  test('High Contrast Mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          :root {
            --glass-background: rgba(255, 255, 255, 0.15);
            --glass-border: rgba(255, 255, 255, 0.3);
          }
        }
      `
    });

    await expect(page).toHaveScreenshot('high-contrast-dashboard.png', {
      fullPage: true,
    });
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Testing

on:
  pull_request:
    paths:
      - 'apps/web/**'
      - 'packages/ui/**'
      - 'tests/visual/**'
  push:
    branches: [main]

jobs:
  visual-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Start application
        run: |
          npm run start &
          npx wait-on http://localhost:3000
        env:
          NODE_ENV: production

      - name: Run visual regression tests
        run: npm run test:visual
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

      - name: Upload screenshots to Percy
        run: npx percy exec -- npm run test:visual:percy
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        if: github.event_name == 'pull_request'
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:visual": "playwright test --config=tests/visual/playwright.config.ts",
    "test:visual:update": "playwright test --config=tests/visual/playwright.config.ts --update-snapshots",
    "test:visual:percy": "percy exec -- playwright test --config=tests/visual/percy.config.ts",
    "test:visual:headed": "playwright test --config=tests/visual/playwright.config.ts --headed",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

### Storybook Integration for Component Testing

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../apps/web/src/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Component Stories for Visual Testing

```typescript
// apps/web/src/components/ui/StatusBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0A0A0B' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['active', 'draft', 'sold', 'pending'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    status: 'active',
  },
};

export const Draft: Story = {
  args: {
    status: 'draft',
  },
};

export const Sold: Story = {
  args: {
    status: 'sold',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4" data-testid="status-badge">
      <StatusBadge status="active" />
      <StatusBadge status="draft" />
      <StatusBadge status="sold" />
      <StatusBadge status="pending" />
    </div>
  ),
};
```

---

## Best Practices & Guidelines

### 1. Screenshot Naming Convention
- `[component/page]-[variant]-[viewport].png`
- Example: `dashboard-main-desktop.png`
- Example: `badge-active-mobile.png`

### 2. Test Data Management
```typescript
// tests/fixtures/test-data.ts
export const mockInventoryData = [
  {
    id: '1',
    title: 'Vintage Rolex Submariner',
    status: 'active',
    price: 2500,
    imageUrl: '/test-images/watch-1.jpg',
    platforms: ['ebay', 'chrono24'],
  },
  // ... more consistent test data
];
```

### 3. Visual Test Maintenance
- Update baselines after intentional design changes
- Review visual diffs in PR comments
- Use Percy/Chromatic for team collaboration
- Maintain test data consistency

### 4. Performance Considerations
- Run visual tests in parallel when possible
- Use selective testing for faster feedback
- Cache test fixtures and images
- Optimize screenshot compression

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Set up Playwright visual testing configuration
- [ ] Create basic component visual tests
- [ ] Configure CI/CD pipeline integration
- [ ] Set up Storybook for component isolation

### Week 2: Core Coverage
- [ ] Add comprehensive page-level visual tests
- [ ] Implement responsive viewport testing
- [ ] Create user flow visual validation
- [ ] Set up dark mode testing

### Week 3: Advanced Features
- [ ] Add accessibility visual validation
- [ ] Implement performance visual metrics
- [ ] Set up cross-browser testing
- [ ] Configure Percy/Chromatic integration

### Week 4: Integration & Maintenance
- [ ] Train team on visual testing workflows
- [ ] Document baseline update procedures
- [ ] Set up automated notifications
- [ ] Create maintenance procedures

This comprehensive visual regression testing system will ensure that your NetPost V2 implementation maintains the high design standards you've established while catching any visual regressions early in the development process.