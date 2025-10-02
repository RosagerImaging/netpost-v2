/**
 * Concurrency control utilities
 * Helps prevent API overload by limiting concurrent operations
 */

/**
 * Execute promises with a concurrency limit
 * @param tasks Array of functions that return promises
 * @param limit Maximum number of concurrent operations
 * @returns Promise that resolves when all tasks complete
 */
export async function pLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = task().then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Execute promises in batches with concurrency limit
 * More efficient for large arrays
 */
export async function batchExecute<T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const { concurrency = 5, onProgress } = options;
  const results: R[] = [];
  let completed = 0;

  // Create batches
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    batches.push(items.slice(i, i + concurrency));
  }

  // Process each batch
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map((item) => executor(item))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Batch execution error:', result.reason);
        // Push undefined for failed items to maintain array indices
        results.push(undefined as unknown as R);
      }
      completed++;
      onProgress?.(completed, items.length);
    }
  }

  return results;
}

/**
 * Rate limiter class for controlling request frequency
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  private lastExecutionTime = 0;

  constructor(
    private maxConcurrent: number,
    private minIntervalMs: number = 0
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    this.activeCount++;

    try {
      const result = await fn();
      return result;
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  private async waitForSlot(): Promise<void> {
    // Wait for available slot
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    // Wait for minimum interval
    if (this.minIntervalMs > 0) {
      const now = Date.now();
      const timeSinceLastExecution = now - this.lastExecutionTime;
      if (timeSinceLastExecution < this.minIntervalMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minIntervalMs - timeSinceLastExecution)
        );
      }
      this.lastExecutionTime = Date.now();
    }
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const resolve = this.queue.shift();
      resolve?.();
    }
  }

  getStats() {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
    };
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        );

        onRetry?.(attempt + 1, lastError);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

