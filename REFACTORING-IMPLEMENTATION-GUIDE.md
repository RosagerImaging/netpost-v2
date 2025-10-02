# NetPost V2 - Refactoring Implementation Guide

**Quick Start Guide for Developers**

---

## 🚀 Immediate Actions Required

### 1. Enable Environment Validation (5 minutes)

**File:** `apps/web/src/app/layout.tsx`

Add this import at the very top of the file:

```typescript
// CRITICAL: Validate environment variables before app starts
import '@/lib/config/env-init';

import type { Metadata } from "next";
// ... rest of imports
```

**Why:** Ensures the app won't start with missing configuration.

---

### 2. Add Error Boundaries to Critical Sections (15 minutes)

**File:** `apps/web/src/app/layout.tsx`

Wrap your app with error boundary:

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased netpost-theme gradient-bg`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**File:** `apps/web/src/app/(dashboard)/layout.tsx`

Add error boundary for dashboard:

```typescript
import { ErrorBoundary } from '@/components/error-boundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<DashboardErrorFallback />}>
      {/* existing layout code */}
      {children}
    </ErrorBoundary>
  );
}
```

---

### 3. Fix Build Configuration (ALREADY DONE ✅)

The following changes have been applied to `apps/web/next.config.ts`:

```typescript
typescript: {
  ignoreBuildErrors: false,  // ✅ Now enforcing type safety
},
eslint: {
  ignoreDuringBuilds: false, // ✅ Now enforcing code quality
},
```

**Action Required:** Fix any TypeScript errors that now appear during build.

---

## 📚 New Utilities Available

### Type Guards (`@/lib/utils/type-guards`)

Use these instead of unsafe type assertions:

```typescript
// ❌ OLD WAY (Unsafe)
const user = data as User;

// ✅ NEW WAY (Safe)
import { toAuthUser, isAuthUser } from '@/lib/utils/type-guards';

const user = toAuthUser(data);
if (user) {
  // user is safely typed as AuthUser
}

// Or with type guard
if (isAuthUser(data)) {
  // data is now typed as AuthUser
}
```

**Available Type Guards:**
- `isObject(value)` - Check if value is a non-null object
- `isNonEmptyString(value)` - Check if value is a non-empty string
- `isValidNumber(value)` - Check if value is a valid number
- `isAuthUser(value)` - Check if value is a valid AuthUser
- `toAuthUser(value)` - Safely convert to AuthUser (returns null if invalid)
- `isError(value)` - Check if value is an Error instance
- `getErrorMessage(error)` - Safely extract error message
- `isUUID(value)` - Validate UUID format
- `isEmail(value)` - Validate email format
- `isURL(value)` - Validate URL format
- `assertDefined(value, message)` - Assert value is not null/undefined
- `assertNever(value)` - Exhaustiveness check for switch statements

---

### Error Boundary (`@/components/error-boundary`)

**Basic Usage:**
```typescript
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**With Custom Fallback:**
```typescript
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

**With Error Handler:**
```typescript
<ErrorBoundary 
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error('Error caught:', error);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

**As HOC:**
```typescript
import { withErrorBoundary } from '@/components/error-boundary';

const SafeComponent = withErrorBoundary(MyComponent);
```

**Hook-based (for throwing errors):**
```typescript
import { useErrorHandler } from '@/components/error-boundary';

function MyComponent() {
  const handleError = useErrorHandler();
  
  const doSomething = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error as Error);
    }
  };
}
```

---

## 🔧 Best Practices Going Forward

### 1. Type Safety

**Always validate external data:**
```typescript
// ❌ DON'T
const user = apiResponse.user as User;

// ✅ DO
import { isAuthUser, toAuthUser } from '@/lib/utils/type-guards';

const user = toAuthUser(apiResponse.user);
if (!user) {
  throw new Error('Invalid user data received');
}
```

**Use type guards for narrowing:**
```typescript
// ❌ DON'T
if (error) {
  console.error(error.message); // Error: Property 'message' does not exist
}

// ✅ DO
import { getErrorMessage } from '@/lib/utils/type-guards';

if (error) {
  console.error(getErrorMessage(error)); // Safe!
}
```

---

### 2. Error Handling

**Wrap critical sections with error boundaries:**
```typescript
// ✅ DO
<ErrorBoundary>
  <CriticalFeature />
</ErrorBoundary>
```

**Handle async errors properly:**
```typescript
// ❌ DON'T
useEffect(() => {
  fetchData(); // Unhandled promise rejection
}, []);

// ✅ DO
useEffect(() => {
  const loadData = async () => {
    try {
      await fetchData();
    } catch (error) {
      console.error('Failed to load data:', getErrorMessage(error));
    }
  };
  loadData();
}, []);
```

---

### 3. React Hooks

**Always include all dependencies:**
```typescript
// ❌ DON'T
useEffect(() => {
  doSomething(userId);
}, []); // Missing userId dependency

// ✅ DO
useEffect(() => {
  doSomething(userId);
}, [userId]); // All dependencies included
```

**Memoize expensive computations:**
```typescript
// ❌ DON'T
const expensiveValue = computeExpensiveValue(data);

// ✅ DO
const expensiveValue = useMemo(
  () => computeExpensiveValue(data),
  [data]
);
```

**Memoize callbacks:**
```typescript
// ❌ DON'T
<ChildComponent onClick={() => handleClick(id)} />

// ✅ DO
const handleClickMemo = useCallback(
  () => handleClick(id),
  [id]
);
<ChildComponent onClick={handleClickMemo} />
```

---

## 🧪 Testing New Code

### Type Guards
```typescript
import { isAuthUser, toAuthUser } from '@/lib/utils/type-guards';

describe('Type Guards', () => {
  it('should validate valid user', () => {
    const validUser = { id: '123', email: 'test@example.com' };
    expect(isAuthUser(validUser)).toBe(true);
  });

  it('should reject invalid user', () => {
    const invalidUser = { id: '123' }; // missing email
    expect(isAuthUser(invalidUser)).toBe(false);
  });
});
```

### Error Boundary
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches errors and displays fallback', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

---

## 📋 Checklist for New Features

When adding new features, ensure:

- [ ] All external data is validated with type guards
- [ ] Critical sections are wrapped with error boundaries
- [ ] All `useEffect` hooks have complete dependency arrays
- [ ] Expensive computations are memoized
- [ ] Event handlers are memoized with `useCallback`
- [ ] Components have proper TypeScript types
- [ ] No `any` types are used (use `unknown` and narrow)
- [ ] Error handling is comprehensive
- [ ] Tests are written for new utilities
- [ ] JSDoc comments are added for public APIs

---

## 🆘 Common Issues & Solutions

### Issue: "Type 'unknown' is not assignable to type 'X'"

**Solution:** Use type guards to narrow the type
```typescript
import { isObject, hasProperty } from '@/lib/utils/type-guards';

if (isObject(data) && hasProperty(data, 'id')) {
  // data.id is now accessible
}
```

### Issue: "Object is possibly 'null'"

**Solution:** Use optional chaining and nullish coalescing
```typescript
const name = user?.name ?? 'Unknown';
```

### Issue: "Argument of type 'X' is not assignable to parameter of type 'never'"

**Solution:** Add exhaustiveness check
```typescript
import { assertNever } from '@/lib/utils/type-guards';

switch (type) {
  case 'a': return handleA();
  case 'b': return handleB();
  default: return assertNever(type); // Ensures all cases handled
}
```

---

## 📞 Getting Help

- **Type Safety Issues:** Check `@/lib/utils/type-guards` for available utilities
- **Error Handling:** Review `@/components/error-boundary` documentation
- **Build Errors:** Ensure all TypeScript errors are fixed (no more `ignoreBuildErrors`)
- **Questions:** Refer to `REFACTORING-REPORT.md` for detailed explanations

---

**Last Updated:** 2025-10-02  
**Maintained By:** Development Team

