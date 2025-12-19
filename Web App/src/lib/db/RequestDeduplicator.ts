// ============================================================================
// REQUEST DEDUPLICATOR
// Prevents duplicate concurrent requests by sharing promises
// ============================================================================

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  refCount: number;
}

const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds

export class RequestDeduplicator {
  private pending: Map<string, PendingRequest<unknown>> = new Map();
  private readonly timeout: number;

  constructor(timeout: number = DEFAULT_REQUEST_TIMEOUT) {
    this.timeout = timeout;

    // Periodically clean up stale requests
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Execute a request, deduplicating concurrent identical requests
   *
   * @param key Unique key for this request type
   * @param requestFn Function that executes the actual request
   * @returns Promise resolving to the request result
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check for existing pending request
    const existing = this.pending.get(key) as PendingRequest<T> | undefined;

    if (existing) {
      // Increment reference count
      existing.refCount++;
      return existing.promise;
    }

    // Create new request
    const promise = this.executeWithCleanup<T>(key, requestFn);

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
      refCount: 1,
    });

    return promise;
  }

  /**
   * Check if a request is currently pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * Get all pending request keys
   */
  getPendingKeys(): string[] {
    return Array.from(this.pending.keys());
  }

  /**
   * Cancel a pending request (removes from tracking, doesn't abort the actual request)
   */
  cancel(key: string): boolean {
    return this.pending.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pending.clear();
  }

  /**
   * Execute request and clean up when done
   */
  private async executeWithCleanup<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await requestFn();
      return result;
    } finally {
      // Clean up after request completes
      this.pending.delete(key);
    }
  }

  /**
   * Clean up stale requests that may have hung
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = now - this.timeout;

    for (const [key, request] of this.pending.entries()) {
      if (request.timestamp < staleThreshold) {
        console.warn(`[Deduplicator] Cleaning up stale request: ${key}`);
        this.pending.delete(key);
      }
    }
  }
}

// Create singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Generate a cache key from a query configuration
 */
export function generateQueryKey(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
  params?: Record<string, unknown>
): string {
  const parts = [table, operation];

  if (params) {
    // Sort keys for consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);

    parts.push(JSON.stringify(sortedParams));
  }

  return parts.join(':');
}

/**
 * Generate a cache key for a select query with ordering
 */
export function generateSelectKey(
  table: string,
  options?: {
    select?: string;
    order?: { column: string; ascending?: boolean };
    filters?: Record<string, unknown>;
    limit?: number;
    offset?: number;
  }
): string {
  const parts = [table, 'select'];

  if (options?.select) {
    parts.push(`select:${options.select}`);
  }

  if (options?.order) {
    parts.push(`order:${options.order.column}:${options.order.ascending ? 'asc' : 'desc'}`);
  }

  if (options?.filters) {
    const sortedFilters = Object.keys(options.filters)
      .sort()
      .map(key => `${key}=${JSON.stringify(options.filters![key])}`)
      .join('&');
    parts.push(`filter:${sortedFilters}`);
  }

  if (options?.limit !== undefined) {
    parts.push(`limit:${options.limit}`);
  }

  if (options?.offset !== undefined) {
    parts.push(`offset:${options.offset}`);
  }

  return parts.join(':');
}
