# NetPost V2 - Test-Driven Development Workflow

## Overview

This document establishes a comprehensive TDD workflow to prevent build cascades and ensure reliable deployments. It implements a "test-first, validate-early" approach that catches issues before they reach Vercel.

## TDD Philosophy for NetPost V2

### Core Principles

1. **Red-Green-Refactor**: Write failing tests first, make them pass, then improve
2. **Fail Fast**: Catch errors at the earliest possible stage
3. **Build Confidence**: Every feature backed by comprehensive tests
4. **Prevent Regressions**: Automated validation prevents breaking existing functionality
5. **Documentation Through Tests**: Tests serve as living documentation

### TDD Cycle Implementation

```
┌─── Write Failing Test (RED)
│    ↓
├─── Write Minimal Code to Pass (GREEN)
│    ↓
├─── Refactor & Improve (REFACTOR)
│    ↓
├─── Run Full Test Suite
│    ↓
└─── Commit if All Tests Pass
```

---

## Project-Specific TDD Structure

### 1. Testing Architecture

```
tests/
├── unit/                   # Unit tests (Jest/Vitest)
│   ├── components/         # React component tests
│   ├── hooks/             # Custom hook tests
│   ├── utils/             # Utility function tests
│   └── services/          # Service layer tests
├── integration/           # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database operation tests
│   └── auth/              # Authentication flow tests
├── e2e/                   # End-to-end tests (Playwright)
│   ├── user-flows/        # Complete user journeys
│   ├── critical-paths/    # Business-critical scenarios
│   └── regression/        # Regression test suites
├── visual/                # Visual regression tests
│   ├── components/        # Component visual tests
│   ├── pages/             # Page layout tests
│   └── responsive/        # Cross-device tests
└── performance/           # Performance tests
    ├── load/              # Load testing
    ├── bundle/            # Bundle size tests
    └── core-vitals/       # Web vitals tests
```

### 2. Test Configuration Setup

#### Vitest Configuration (Web App)
```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/.next/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  }
});
```

#### Jest Configuration (Mobile App)
```javascript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### 3. Test Setup Files

#### Web App Test Setup
```typescript
// apps/web/src/test-setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    route: '/',
    asPath: '/',
    query: {},
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Global test utilities
global.renderWithProviders = (ui, options) => {
  // Add custom render function with providers
};
```

---

## TDD Patterns for NetPost V2 Features

### 1. Component Development Pattern

#### Example: StatusBadge Component TDD

```typescript
// apps/web/src/components/ui/__tests__/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  // RED: Write failing test first
  it('should render active status with correct styling', () => {
    render(<StatusBadge status="active" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveClass('status-active');
    expect(badge).toHaveClass('glass-badge');
  });

  // RED: Test all status variants
  it.each([
    ['active', 'Active', 'status-active'],
    ['draft', 'Draft', 'status-draft'],
    ['sold', 'Sold', 'status-sold'],
    ['pending', 'Pending', 'status-pending']
  ])('should render %s status correctly', (status, text, className) => {
    render(<StatusBadge status={status as any} />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent(text);
    expect(badge).toHaveClass(className);
  });

  // RED: Test icon rendering
  it('should render status icon correctly', () => {
    render(<StatusBadge status="active" />);

    const icon = screen.getByTestId('status-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-icon', 'check-circle');
  });
});
```

```typescript
// apps/web/src/components/ui/StatusBadge.tsx
// GREEN: Minimal implementation to pass tests
import { CheckCircle, Clock, DollarSign, Loader } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'draft' | 'sold' | 'pending';
}

const statusConfig = {
  active: { icon: CheckCircle, label: 'Active', className: 'status-active' },
  draft: { icon: Clock, label: 'Draft', className: 'status-draft' },
  sold: { icon: DollarSign, label: 'Sold', className: 'status-sold' },
  pending: { icon: Loader, label: 'Pending', className: 'status-pending' }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      data-testid="status-badge"
      className={`glass-badge ${config.className}`}
    >
      <Icon
        data-testid="status-icon"
        data-icon={status === 'active' ? 'check-circle' : undefined}
        className="w-3 h-3 mr-1"
      />
      {config.label}
    </span>
  );
}
```

### 2. Hook Development Pattern

#### Example: useInventory Hook TDD

```typescript
// apps/web/src/hooks/__tests__/useInventory.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useInventory } from '../useInventory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('useInventory', () => {
  // RED: Test initial loading state
  it('should start in loading state', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  // RED: Test successful data fetch
  it('should fetch inventory data successfully', async () => {
    const mockData = [
      { id: '1', title: 'Test Item', status: 'active' }
    ];

    // Mock the API response
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockResolvedValue({ data: mockData, error: null })
    } as any);

    const { result } = renderHook(() => useInventory(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
  });

  // RED: Test error handling
  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockRejectedValue(mockError)
    } as any);

    const { result } = renderHook(() => useInventory(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
  });
});
```

```typescript
// apps/web/src/hooks/useInventory.ts
// GREEN: Implementation to pass tests
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}
```

### 3. API Route Testing Pattern

```typescript
// apps/web/src/app/api/inventory/__tests__/route.test.ts
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }),
}));

describe('/api/inventory', () => {
  // RED: Test GET endpoint
  it('should return inventory items', async () => {
    const mockItems = [{ id: '1', title: 'Test' }];

    const request = new NextRequest('http://localhost/api/inventory');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  // RED: Test POST endpoint validation
  it('should validate required fields on POST', async () => {
    const request = new NextRequest('http://localhost/api/inventory', {
      method: 'POST',
      body: JSON.stringify({}), // Missing required fields
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('required');
  });
});
```

---

## Build Validation Pipeline

### 1. Pre-commit Hooks Setup

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci && npm run type-check && npm run build:test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ]
  }
}
```

### 2. GitHub Actions Validation

```yaml
# .github/workflows/test-and-build.yml
name: Test and Build

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Test build process
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: test

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

      - name: Build and start app
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 3. TypeScript Incremental Strict Mode

```typescript
// tsconfig.json - Incremental strictness
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", ".next"]
}
```

---

## TDD Scripts and Commands

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:visual": "playwright test --config playwright.visual.config.ts",
    "test:ci": "npm run test:run && npm run test:integration && npm run test:e2e",
    "tdd": "npm run test:watch",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "build:test": "next build --no-lint",
    "validate": "npm run lint && npm run type-check && npm run test:run"
  }
}
```

### VSCode TDD Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "testing.automaticallyOpenPeekView": "failureInVisibleDocument"
}
```

---

## TDD Workflow Implementation Checklist

### Week 1: Foundation
- [ ] Configure test runners (Vitest, Jest, Playwright)
- [ ] Set up test environments and mocks
- [ ] Create test utilities and helpers
- [ ] Implement basic TDD patterns

### Week 2: Component Testing
- [ ] Write tests for existing components
- [ ] Implement TDD for new components
- [ ] Add visual regression tests
- [ ] Set up coverage monitoring

### Week 3: Integration & API Testing
- [ ] Add integration test suite
- [ ] Test API routes and database operations
- [ ] Implement E2E critical path tests
- [ ] Set up CI/CD validation pipeline

### Week 4: Optimization & Training
- [ ] Optimize test performance
- [ ] Create TDD documentation
- [ ] Train team on TDD practices
- [ ] Establish maintenance procedures

This TDD workflow will catch issues early, prevent build cascades, and give you confidence in your deployments to Vercel.