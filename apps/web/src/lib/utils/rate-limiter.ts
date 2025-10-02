/**
 * Rate limiter for external API calls
 * Prevents hitting rate limits on marketplace APIs
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  minIntervalMs?: number;
}

interface RequestRecord {
  timestamp: number;
  key: string;
}

/**
 * Token bucket rate limiter
 * Allows bursts up to maxRequests, then enforces rate limit
 */
export class TokenBucketRateLimiter {
  private tokens: Map<string, number> = new Map();
  private lastRefill: Map<string, number> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed and consume a token
   */
  async tryAcquire(key: string): Promise<boolean> {
    const now = Date.now();
    
    // Refill tokens based on time elapsed
    this.refillTokens(key, now);

    const currentTokens = this.tokens.get(key) || this.config.maxRequests;

    if (currentTokens > 0) {
      this.tokens.set(key, currentTokens - 1);
      return true;
    }

    return false;
  }

  /**
   * Wait until a token is available, then acquire it
   */
  async acquire(key: string): Promise<void> {
    while (!(await this.tryAcquire(key))) {
      // Calculate wait time until next token
      const waitMs = this.getWaitTime(key);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.acquire(key);
    return fn();
  }

  private refillTokens(key: string, now: number): void {
    const lastRefillTime = this.lastRefill.get(key) || now;
    const timeSinceRefill = now - lastRefillTime;
    const tokensToAdd = Math.floor(
      (timeSinceRefill / this.config.windowMs) * this.config.maxRequests
    );

    if (tokensToAdd > 0) {
      const currentTokens = this.tokens.get(key) || this.config.maxRequests;
      const newTokens = Math.min(
        currentTokens + tokensToAdd,
        this.config.maxRequests
      );
      this.tokens.set(key, newTokens);
      this.lastRefill.set(key, now);
    }
  }

  private getWaitTime(key: string): number {
    const lastRefillTime = this.lastRefill.get(key) || Date.now();
    const timeSinceRefill = Date.now() - lastRefillTime;
    const timeUntilNextToken = Math.max(
      0,
      this.config.windowMs / this.config.maxRequests - timeSinceRefill
    );
    return Math.max(timeUntilNextToken, this.config.minIntervalMs || 0);
  }

  /**
   * Get current token count for a key
   */
  getTokenCount(key: string): number {
    this.refillTokens(key, Date.now());
    return this.tokens.get(key) || this.config.maxRequests;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.tokens.delete(key);
    this.lastRefill.delete(key);
  }
}

/**
 * Sliding window rate limiter
 * More accurate but uses more memory
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  async tryAcquire(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get and clean old requests
    let keyRequests = this.requests.get(key) || [];
    keyRequests = keyRequests.filter((req) => req.timestamp > windowStart);

    if (keyRequests.length < this.config.maxRequests) {
      keyRequests.push({ timestamp: now, key });
      this.requests.set(key, keyRequests);
      return true;
    }

    return false;
  }

  /**
   * Wait until request is allowed
   */
  async acquire(key: string): Promise<void> {
    while (!(await this.tryAcquire(key))) {
      const waitMs = this.getWaitTime(key);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.acquire(key);
    return fn();
  }

  private getWaitTime(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const keyRequests = this.requests.get(key) || [];
    const validRequests = keyRequests.filter((req) => req.timestamp > windowStart);

    if (validRequests.length === 0) {
      return 0;
    }

    // Wait until the oldest request expires
    const oldestRequest = validRequests[0];
    const waitTime = oldestRequest.timestamp + this.config.windowMs - now;
    return Math.max(waitTime, this.config.minIntervalMs || 100);
  }

  /**
   * Get current request count for a key
   */
  getRequestCount(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const keyRequests = this.requests.get(key) || [];
    return keyRequests.filter((req) => req.timestamp > windowStart).length;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Cleanup old requests (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter((req) => req.timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

/**
 * Pre-configured rate limiters for common marketplaces
 */
export const marketplaceRateLimiters = {
  // eBay: 5000 calls per day = ~3.5 calls per minute
  ebay: new TokenBucketRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    minIntervalMs: 200,
  }),

  // Poshmark: Conservative limit
  poshmark: new TokenBucketRateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000,
    minIntervalMs: 100,
  }),

  // Facebook: 200 calls per hour per user
  facebook: new TokenBucketRateLimiter({
    maxRequests: 200,
    windowMs: 60 * 60 * 1000, // 1 hour
    minIntervalMs: 500,
  }),

  // Generic conservative limit for unknown APIs
  default: new TokenBucketRateLimiter({
    maxRequests: 20,
    windowMs: 60 * 1000,
    minIntervalMs: 500,
  }),
};

/**
 * Wrapper function to rate limit any async function
 */
export async function withRateLimit<T>(
  marketplace: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const limiter =
    marketplaceRateLimiters[marketplace as keyof typeof marketplaceRateLimiters] ||
    marketplaceRateLimiters.default;

  const key = `${marketplace}:${userId}`;
  return limiter.execute(key, fn);
}

