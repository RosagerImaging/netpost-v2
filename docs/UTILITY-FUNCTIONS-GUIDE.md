# Utility Functions Guide

Quick reference for new utility functions added during security audit.

---

## Environment Validation

**File:** `apps/web/src/lib/config/env-validation.ts`

### Usage

```typescript
import { validateOrThrow, validateEnvironmentVariables } from '@/lib/config/env-validation';

// At application startup (throws if invalid)
validateOrThrow();

// For custom validation logic
const result = validateEnvironmentVariables();
if (!result.valid) {
  console.error('Missing variables:', result.missing);
}
```

### Features
- Validates all required environment variables
- Provides clear error messages
- Categorizes variables by type
- Fails fast on startup

---

## Concurrency Control

**File:** `apps/web/src/lib/utils/concurrency.ts`

### Batch Execute with Concurrency Limit

```typescript
import { batchExecute } from '@/lib/utils/concurrency';

const users = [/* array of users */];

const results = await batchExecute(
  users,
  async (user) => {
    return await processUser(user);
  },
  {
    concurrency: 5, // Max 5 concurrent operations
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    }
  }
);
```

### Retry with Exponential Backoff

```typescript
import { retryWithBackoff } from '@/lib/utils/concurrency';

const result = await retryWithBackoff(
  async () => {
    return await unstableApiCall();
  },
  {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}: ${error.message}`);
    }
  }
);
```

### Rate Limiter Class

```typescript
import { RateLimiter } from '@/lib/utils/concurrency';

const limiter = new RateLimiter(
  5,    // Max 5 concurrent requests
  1000  // Min 1 second between requests
);

const result = await limiter.execute(async () => {
  return await apiCall();
});
```

---

## Rate Limiting for APIs

**File:** `apps/web/src/lib/utils/rate-limiter.ts`

### Simple Usage

```typescript
import { withRateLimit } from '@/lib/utils/rate-limiter';

// Automatically uses marketplace-specific limits
const listings = await withRateLimit('ebay', userId, async () => {
  return await ebayApi.getListings();
});
```

### Custom Rate Limiter

```typescript
import { TokenBucketRateLimiter } from '@/lib/utils/rate-limiter';

const limiter = new TokenBucketRateLimiter({
  maxRequests: 100,      // 100 requests
  windowMs: 60 * 1000,   // per minute
  minIntervalMs: 100     // min 100ms between requests
});

await limiter.execute('user-123', async () => {
  return await apiCall();
});
```

### Pre-configured Limiters

```typescript
import { marketplaceRateLimiters } from '@/lib/utils/rate-limiter';

// Use pre-configured limiter
const ebayLimiter = marketplaceRateLimiters.ebay;
await ebayLimiter.execute('user-123', async () => {
  return await ebayApi.call();
});
```

---

## Queue Processor Control

**File:** `apps/web/src/lib/queues/sale-event-queue.ts`

### Start Queue Processor

```typescript
import { startQueueProcessor, stopQueueProcessor, isQueueProcessorRunning } from '@/lib/queues/sale-event-queue';

// Start processor (singleton - safe to call multiple times)
startQueueProcessor();

// Check if running
if (isQueueProcessorRunning()) {
  console.log('Processor is running');
}

// Stop processor (for graceful shutdown)
stopQueueProcessor();
```

---

## Circuit Breaker Pattern

**File:** `apps/web/src/lib/polling/sale-poller.ts`

The circuit breaker is built into the polling system. It automatically:

1. **Tracks failures** per marketplace
2. **Opens circuit** after 5 consecutive failures
3. **Resets** after 1 minute timeout
4. **Half-open state** allows limited retry attempts

### States

- **Closed:** Normal operation, all requests allowed
- **Open:** Too many failures, requests blocked
- **Half-open:** Testing if service recovered

### Monitoring

```typescript
// Circuit breaker state is logged automatically
// Watch for these log messages:
// - "Circuit breaker opened for {marketplace}"
// - "Circuit breaker is {state} for {marketplace}"
```

---

## Best Practices

### 1. Always Use Rate Limiting for External APIs

```typescript
// ❌ Bad: No rate limiting
const data = await externalApi.call();

// ✅ Good: With rate limiting
const data = await withRateLimit('marketplace', userId, async () => {
  return await externalApi.call();
});
```

### 2. Use Batch Execute for Multiple Operations

```typescript
// ❌ Bad: Unlimited concurrency
await Promise.all(items.map(item => processItem(item)));

// ✅ Good: Controlled concurrency
await batchExecute(items, processItem, { concurrency: 5 });
```

### 3. Add Retry Logic for Unstable APIs

```typescript
// ❌ Bad: No retry
const result = await unstableApi.call();

// ✅ Good: With exponential backoff
const result = await retryWithBackoff(
  () => unstableApi.call(),
  { maxRetries: 3 }
);
```

### 4. Validate Environment at Startup

```typescript
// In your main application entry point
import { validateOrThrow } from '@/lib/config/env-validation';

// Fail fast if configuration is invalid
validateOrThrow();
```

---

## Common Patterns

### Pattern 1: Polling with Circuit Breaker

```typescript
async function pollWithCircuitBreaker(marketplace: string) {
  const circuitKey = `polling:${marketplace}`;
  
  if (!canExecute(circuitKey)) {
    return { success: false, error: 'Circuit breaker open' };
  }
  
  try {
    const result = await retryWithBackoff(
      () => pollMarketplace(marketplace),
      { maxRetries: 3 }
    );
    recordSuccess(circuitKey);
    return result;
  } catch (error) {
    recordFailure(circuitKey);
    throw error;
  }
}
```

### Pattern 2: Batch Processing with Progress

```typescript
async function processBatch(items: Item[]) {
  return await batchExecute(
    items,
    async (item) => {
      return await withRateLimit('api', item.userId, async () => {
        return await processItem(item);
      });
    },
    {
      concurrency: 5,
      onProgress: (completed, total) => {
        console.log(`Processed ${completed}/${total} items`);
      }
    }
  );
}
```

### Pattern 3: Resilient API Call

```typescript
async function resilientApiCall(marketplace: string, userId: string) {
  return await retryWithBackoff(
    async () => {
      return await withRateLimit(marketplace, userId, async () => {
        return await externalApi.call();
      });
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      onRetry: (attempt, error) => {
        console.warn(`Retry ${attempt}: ${error.message}`);
      }
    }
  );
}
```

---

## Troubleshooting

### Issue: "Circuit breaker is open"

**Cause:** Too many consecutive failures  
**Solution:** Wait 1 minute for reset, or investigate underlying API issues

### Issue: "Rate limit exceeded"

**Cause:** Too many requests in time window  
**Solution:** Increase `windowMs` or decrease `maxRequests` in rate limiter config

### Issue: "Queue processor already running"

**Cause:** Attempted to start processor multiple times  
**Solution:** This is expected behavior - the warning is informational

---

## Performance Tips

1. **Tune concurrency limits** based on your API's capabilities
2. **Use token bucket** for bursty traffic, **sliding window** for strict limits
3. **Monitor circuit breaker** state to detect API issues early
4. **Adjust retry delays** based on API response times
5. **Cleanup rate limiter** state periodically to free memory

---

## Migration Guide

### Before

```typescript
// Old code without protections
const results = await Promise.all(
  users.map(user => processUser(user))
);
```

### After

```typescript
// New code with all protections
const results = await batchExecute(
  users,
  async (user) => {
    return await retryWithBackoff(
      async () => {
        return await withRateLimit('api', user.id, async () => {
          return await processUser(user);
        });
      },
      { maxRetries: 3 }
    );
  },
  { concurrency: 5 }
);
```

---

## Additional Resources

- [Environment Validation Source](../apps/web/src/lib/config/env-validation.ts)
- [Concurrency Utils Source](../apps/web/src/lib/utils/concurrency.ts)
- [Rate Limiter Source](../apps/web/src/lib/utils/rate-limiter.ts)
- [Security Audit Report](../SECURITY-AUDIT-FIXES.md)

