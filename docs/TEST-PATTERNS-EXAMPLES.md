# NetPost V2 - Test-First Development Patterns

## Overview

This document provides practical, copy-paste TDD patterns specifically for NetPost V2 features. Each pattern follows the Red-Green-Refactor cycle and prevents the build cascade issues you've experienced.

---

## 1. UI Component Test Patterns

### Pattern A: Status Component with Variants

**Use Case**: StatusBadge, PriorityIndicator, PlatformTag, etc.

```typescript
// ❌ RED: Write the test first (component doesn't exist yet)
// apps/web/src/components/ui/__tests__/StatusBadge.test.tsx

import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders active status correctly', () => {
    render(<StatusBadge status="active" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Active');
    expect(badge).toHaveClass('bg-green-500');
  });

  it('renders with correct icon for each status', () => {
    const statuses = [
      { status: 'active', icon: 'check-circle' },
      { status: 'draft', icon: 'edit' },
      { status: 'sold', icon: 'dollar-sign' },
      { status: 'pending', icon: 'clock' }
    ];

    statuses.forEach(({ status, icon }) => {
      render(<StatusBadge status={status as any} />);
      const iconElement = screen.getByTestId(`${icon}-icon`);
      expect(iconElement).toBeInTheDocument();
    });
  });

  it('applies glassmorphism styling', () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('glass-effect');
  });
});
```

```typescript
// ✅ GREEN: Minimal implementation to pass tests
// apps/web/src/components/ui/StatusBadge.tsx

import { CheckCircle, Edit, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'draft' | 'sold' | 'pending';
  className?: string;
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: 'Active',
    className: 'bg-green-500 text-green-50',
    iconTestId: 'check-circle-icon'
  },
  draft: {
    icon: Edit,
    label: 'Draft',
    className: 'bg-yellow-500 text-yellow-50',
    iconTestId: 'edit-icon'
  },
  sold: {
    icon: DollarSign,
    label: 'Sold',
    className: 'bg-blue-500 text-blue-50',
    iconTestId: 'dollar-sign-icon'
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-gray-500 text-gray-50',
    iconTestId: 'clock-icon'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      data-testid="status-badge"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
        'glass-effect backdrop-blur-sm border border-white/20',
        config.className,
        className
      )}
    >
      <Icon data-testid={config.iconTestId} size={12} />
      {config.label}
    </span>
  );
}
```

### Pattern B: Data Display Component

**Use Case**: InventoryCard, ItemSummary, MetricDisplay

```typescript
// ❌ RED: Test first
// apps/web/src/components/inventory/__tests__/InventoryCard.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryCard } from '../InventoryCard';

const mockItem = {
  id: '1',
  title: 'Vintage Watch',
  price: 2500,
  status: 'active' as const,
  imageUrl: '/test-image.jpg',
  platforms: ['ebay', 'chrono24']
};

describe('InventoryCard', () => {
  it('displays item information correctly', () => {
    render(<InventoryCard item={mockItem} />);

    expect(screen.getByText('Vintage Watch')).toBeInTheDocument();
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image.jpg');
  });

  it('shows platform indicators', () => {
    render(<InventoryCard item={mockItem} />);

    expect(screen.getByTestId('platform-ebay')).toBeInTheDocument();
    expect(screen.getByTestId('platform-chrono24')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<InventoryCard item={mockItem} onEdit={onEdit} />);

    fireEvent.click(screen.getByTestId('edit-button'));
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<InventoryCard item={mockItem} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledWith(mockItem.id);
  });
});
```

```typescript
// ✅ GREEN: Implementation
// apps/web/src/components/inventory/InventoryCard.tsx

import { Edit, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  status: 'active' | 'draft' | 'sold' | 'pending';
  imageUrl: string;
  platforms: string[];
}

interface InventoryCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (id: string) => void;
}

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
  const handleEdit = () => onEdit?.(item);
  const handleDelete = () => onDelete?.(item.id);

  return (
    <div className="glass-card rounded-lg p-4 hover:scale-105 transition-transform">
      <div className="relative mb-3">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-32 object-cover rounded-md"
        />
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>
      </div>

      <h3 className="font-medium text-white mb-2">{item.title}</h3>
      <p className="text-2xl font-bold text-primary mb-3">
        ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>

      <div className="flex gap-2 mb-3">
        {item.platforms.map((platform) => (
          <span
            key={platform}
            data-testid={`platform-${platform}`}
            className="px-2 py-1 bg-white/10 rounded text-xs"
          >
            {platform}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="edit-button"
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="flex-1"
        >
          <Edit size={14} />
          Edit
        </Button>
        <Button
          data-testid="delete-button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="flex-1"
        >
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );
}
```

---

## 2. Hook Test Patterns

### Pattern A: Data Fetching Hook

**Use Case**: useInventory, useUserProfile, usePlatforms

```typescript
// ❌ RED: Test first
// apps/web/src/hooks/__tests__/useInventory.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory } from '../useInventory';

// Test helper
const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }))
  }
}));

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('fetches inventory data successfully', async () => {
    const mockData = [
      { id: '1', title: 'Item 1', status: 'active' },
      { id: '2', title: 'Item 2', status: 'draft' }
    ];

    // Setup mock response
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      order: mockOrder,
    } as any);

    const { result } = renderHook(() => useInventory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    const mockError = new Error('Failed to fetch');

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    } as any);

    const { result } = renderHook(() => useInventory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('refetches data when invalidated', async () => {
    const mockData = [{ id: '1', title: 'Item 1' }];

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    } as any);

    const { result } = renderHook(() => useInventory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Should have called the API again
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});
```

```typescript
// ✅ GREEN: Implementation
// apps/web/src/hooks/useInventory.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface InventoryItem {
  id: string;
  title: string;
  status: 'active' | 'draft' | 'sold' | 'pending';
  price: number;
  created_at: string;
  updated_at: string;
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch inventory: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Pattern B: Form Handling Hook

**Use Case**: useItemForm, useSettingsForm, useAuthForm

```typescript
// ❌ RED: Test first
// apps/web/src/hooks/__tests__/useItemForm.test.tsx

import { renderHook, act } from '@testing-library/react';
import { useItemForm } from '../useItemForm';

describe('useItemForm', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useItemForm());

    expect(result.current.values).toEqual({
      title: '',
      description: '',
      price: 0,
      category: '',
      status: 'draft'
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isValid).toBe(false);
  });

  it('updates values correctly', () => {
    const { result } = renderHook(() => useItemForm());

    act(() => {
      result.current.setValue('title', 'Vintage Watch');
    });

    expect(result.current.values.title).toBe('Vintage Watch');
  });

  it('validates required fields', () => {
    const { result } = renderHook(() => useItemForm());

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.title).toBe('Title is required');
    expect(result.current.errors.price).toBe('Price must be greater than 0');
    expect(result.current.isValid).toBe(false);
  });

  it('validates price is positive number', () => {
    const { result } = renderHook(() => useItemForm());

    act(() => {
      result.current.setValue('price', -100);
      result.current.validate();
    });

    expect(result.current.errors.price).toBe('Price must be greater than 0');
  });

  it('clears errors when field becomes valid', () => {
    const { result } = renderHook(() => useItemForm());

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.title).toBeTruthy();

    act(() => {
      result.current.setValue('title', 'Valid Title');
    });

    expect(result.current.errors.title).toBeUndefined();
  });

  it('resets form to initial state', () => {
    const { result } = renderHook(() => useItemForm());

    act(() => {
      result.current.setValue('title', 'Test');
      result.current.setValue('price', 100);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values.title).toBe('');
    expect(result.current.values.price).toBe(0);
    expect(result.current.errors).toEqual({});
  });
});
```

```typescript
// ✅ GREEN: Implementation
// apps/web/src/hooks/useItemForm.ts

import { useState, useCallback } from 'react';

interface ItemFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'active' | 'draft' | 'sold' | 'pending';
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
}

const initialValues: ItemFormData = {
  title: '',
  description: '',
  price: 0,
  category: '',
  status: 'draft',
};

export function useItemForm() {
  const [values, setValues] = useState<ItemFormData>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const setValue = useCallback((field: keyof ItemFormData, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Clear error when field is updated
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!values.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (values.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!values.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0 &&
                 values.title.trim() !== '' &&
                 values.price > 0 &&
                 values.category !== '';

  return {
    values,
    errors,
    isValid,
    setValue,
    validate,
    reset,
  };
}
```

---

## 3. API Route Test Patterns

### Pattern A: CRUD API Testing

```typescript
// ❌ RED: Test first
// apps/web/src/app/api/inventory/__tests__/route.test.ts

import { GET, POST, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Mock Supabase server client
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn(),
  },
};

describe('/api/inventory', () => {
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockReturnValue(mockSupabase as any);
  });

  describe('GET /api/inventory', () => {
    it('returns inventory items for authenticated user', async () => {
      const mockItems = [
        { id: '1', title: 'Item 1', user_id: 'user-1' },
        { id: '2', title: 'Item 2', user_id: 'user-1' },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: mockItems,
        error: null,
      });

      const request = new NextRequest('http://localhost/api/inventory');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockItems);
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest('http://localhost/api/inventory');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('handles database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from().select().eq().order.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const request = new NextRequest('http://localhost/api/inventory');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/inventory', () => {
    it('creates new inventory item', async () => {
      const newItem = {
        title: 'New Item',
        description: 'Description',
        price: 100,
        category: 'electronics',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      mockSupabase.from().insert().select.mockResolvedValue({
        data: [{ id: 'new-id', ...newItem, user_id: 'user-1' }],
        error: null,
      });

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify(newItem),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(newItem.title);
    });

    it('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/inventory', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });
  });
});
```

```typescript
// ✅ GREEN: Implementation
// apps/web/src/app/api/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'draft', 'sold', 'pending']).default('draft'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch inventory items
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createItemSchema.parse(body);

    // Create inventory item
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 4. Integration Test Patterns

### Pattern A: Authentication Flow Testing

```typescript
// apps/web/src/__tests__/integration/auth-flow.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/app/login/page';
import { DashboardPage } from '@/app/dashboard/page';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </QueryClientProvider>
);

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes login flow successfully', async () => {
    // Mock successful login
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    });

    render(<LoginPage />, { wrapper: TestWrapper });

    // Fill login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for navigation
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error for invalid credentials', async () => {
    // Mock login failure
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid credentials'),
    });

    render(<LoginPage />, { wrapper: TestWrapper });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Should not navigate
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

---

## 5. E2E Test Patterns

### Pattern A: Critical User Journey

```typescript
// tests/e2e/critical-paths/item-creation-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Item Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('user can create new inventory item', async ({ page }) => {
    // Navigate to inventory
    await page.click('[data-testid="nav-inventory"]');
    await page.waitForURL('/inventory');

    // Click add item button
    await page.click('[data-testid="add-item-button"]');
    await page.waitForSelector('[data-testid="item-form-modal"]');

    // Fill form
    await page.fill('[data-testid="title-input"]', 'Vintage Rolex Watch');
    await page.fill('[data-testid="description-input"]', 'Beautiful vintage timepiece');
    await page.fill('[data-testid="price-input"]', '2500');
    await page.selectOption('[data-testid="category-select"]', 'jewelry');

    // Upload image (mock)
    await page.setInputFiles('[data-testid="image-upload"]', 'tests/fixtures/test-image.jpg');

    // Submit form
    await page.click('[data-testid="save-item-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="item-card"]:has-text("Vintage Rolex Watch")')).toBeVisible();

    // Verify item appears in list
    await page.waitForSelector('[data-testid="inventory-list"]');
    const itemCard = page.locator('[data-testid="item-card"]:has-text("Vintage Rolex Watch")');
    await expect(itemCard).toBeVisible();
    await expect(itemCard.locator('[data-testid="item-price"]')).toHaveText('$2,500.00');
  });

  test('validates required fields', async ({ page }) => {
    await page.click('[data-testid="nav-inventory"]');
    await page.click('[data-testid="add-item-button"]');

    // Try to submit empty form
    await page.click('[data-testid="save-item-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toHaveText('Title is required');
    await expect(page.locator('[data-testid="price-error"]')).toHaveText('Price must be greater than 0');
    await expect(page.locator('[data-testid="category-error"]')).toHaveText('Category is required');

    // Modal should still be open
    await expect(page.locator('[data-testid="item-form-modal"]')).toBeVisible();
  });
});
```

This comprehensive test pattern library gives you copy-paste examples for every major component type in your NetPost V2 application. Each pattern follows the TDD Red-Green-Refactor cycle and includes proper TypeScript types, error handling, and comprehensive test coverage.