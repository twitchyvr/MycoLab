// ============================================================================
// QUERY EXECUTOR
// Core query execution with retry logic, caching, and request deduplication
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import {
  QueryOptions,
  QueryResult,
  QueryError,
  CacheStats,
  IQueryExecutor,
} from './types';
import { QueryCache } from './QueryCache';
import { RequestDeduplicator } from './RequestDeduplicator';

// Default configuration
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Retryable error codes (Supabase/PostgreSQL)
const RETRYABLE_ERROR_CODES = new Set([
  'PGRST301', // Connection error
  'PGRST500', // Internal server error
  '08000', // Connection exception
  '08003', // Connection does not exist
  '08006', // Connection failure
  '40001', // Serialization failure
  '40P01', // Deadlock detected
  '53000', // Insufficient resources
  '53100', // Disk full
  '53200', // Out of memory
  '53300', // Too many connections
  '57014', // Query canceled
]);

// Network error indicators
const NETWORK_ERROR_MESSAGES = [
  'Failed to fetch',
  'Network request failed',
  'NetworkError',
  'net::',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'socket hang up',
];

export class QueryExecutor implements IQueryExecutor {
  private readonly client: SupabaseClient | null;
  private readonly cache: QueryCache;
  private readonly deduplicator: RequestDeduplicator;

  constructor(
    client: SupabaseClient | null,
    cache?: QueryCache,
    deduplicator?: RequestDeduplicator
  ) {
    this.client = client;
    this.cache = cache ?? new QueryCache();
    this.deduplicator = deduplicator ?? new RequestDeduplicator();
  }

  /**
   * Execute a query with caching, deduplication, and retry logic
   */
  async execute<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const {
      cacheTtl = DEFAULT_CACHE_TTL,
      deduplicate = true,
      retryCount = DEFAULT_RETRY_COUNT,
      retryDelay = DEFAULT_RETRY_DELAY,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    // Check cache first
    if (cacheKey && cacheTtl > 0) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== null) {
        return {
          data: cached,
          error: null,
          cached: true,
          timing: {
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime,
            retryCount: 0,
          },
        };
      }
    }

    // No client available
    if (!this.client) {
      return {
        data: null,
        error: {
          code: 'NO_CLIENT',
          message: 'Supabase client not configured',
          isRetryable: false,
        },
        cached: false,
        timing: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          retryCount: 0,
        },
      };
    }

    // Execute with deduplication
    const executeKey = cacheKey ?? `query-${Date.now()}-${Math.random()}`;

    const executeWithRetry = async (): Promise<QueryResult<T>> => {
      let lastError: QueryError | null = null;
      let attempts = 0;

      while (attempts <= retryCount) {
        try {
          // Execute with timeout
          const result = await this.executeWithTimeout(queryFn, timeout);

          if (result.error) {
            const queryError = this.normalizeError(result.error);

            // Check if retryable
            if (queryError.isRetryable && attempts < retryCount) {
              lastError = queryError;
              attempts++;
              await this.delay(retryDelay * Math.pow(2, attempts - 1)); // Exponential backoff
              continue;
            }

            return {
              data: null,
              error: queryError,
              cached: false,
              timing: {
                startTime,
                endTime: Date.now(),
                duration: Date.now() - startTime,
                retryCount: attempts,
              },
            };
          }

          // Success - cache the result
          if (cacheKey && cacheTtl > 0 && result.data !== null) {
            this.cache.set(cacheKey, result.data, cacheTtl);
          }

          return {
            data: result.data,
            error: null,
            cached: false,
            timing: {
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime,
              retryCount: attempts,
            },
          };
        } catch (err) {
          const queryError = this.normalizeError(err);

          if (queryError.isRetryable && attempts < retryCount) {
            lastError = queryError;
            attempts++;
            await this.delay(retryDelay * Math.pow(2, attempts - 1));
            continue;
          }

          return {
            data: null,
            error: queryError,
            cached: false,
            timing: {
              startTime,
              endTime: Date.now(),
              duration: Date.now() - startTime,
              retryCount: attempts,
            },
          };
        }
      }

      // All retries exhausted
      return {
        data: null,
        error: lastError ?? {
          code: 'MAX_RETRIES',
          message: 'Maximum retry attempts exceeded',
          isRetryable: false,
        },
        cached: false,
        timing: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          retryCount: attempts,
        },
      };
    };

    // Use deduplication if enabled
    if (deduplicate && cacheKey) {
      return this.deduplicator.execute(executeKey, executeWithRetry);
    }

    return executeWithRetry();
  }

  /**
   * Execute a query with timeout
   */
  private async executeWithTimeout<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    timeout: number
  ): Promise<{ data: T | null; error: any }> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query timeout after ${timeout}ms`));
      }, timeout);

      queryFn(this.client!)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  /**
   * Normalize various error types to QueryError
   */
  private normalizeError(error: unknown): QueryError {
    if (!error) {
      return {
        code: 'UNKNOWN',
        message: 'An unknown error occurred',
        isRetryable: false,
      };
    }

    // Handle Supabase/PostgreSQL errors
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;

      const code = String(err.code ?? err.error_code ?? 'UNKNOWN');
      const message = String(err.message ?? err.error_description ?? 'Unknown error');
      const hint = err.hint ? String(err.hint) : undefined;
      const details = err.details;

      return {
        code,
        message,
        hint,
        details,
        isRetryable: this.isRetryable(code, message),
        originalError: error,
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        code: 'STRING_ERROR',
        message: error,
        isRetryable: this.isRetryable('', error),
        originalError: error,
      };
    }

    // Handle Error instances
    if (error instanceof Error) {
      return {
        code: 'ERROR',
        message: error.message,
        isRetryable: this.isRetryable('', error.message),
        originalError: error,
      };
    }

    return {
      code: 'UNKNOWN',
      message: String(error),
      isRetryable: false,
      originalError: error,
    };
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryable(code: string, message: string): boolean {
    // Check error codes
    if (RETRYABLE_ERROR_CODES.has(code)) {
      return true;
    }

    // Check for network errors
    const lowerMessage = message.toLowerCase();
    for (const indicator of NETWORK_ERROR_MESSAGES) {
      if (lowerMessage.includes(indicator.toLowerCase())) {
        return true;
      }
    }

    // Rate limiting
    if (code === '429' || lowerMessage.includes('rate limit')) {
      return true;
    }

    // Timeout errors
    if (lowerMessage.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Delay for a specified duration
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern?: string | RegExp): void {
    this.cache.invalidate(pattern);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
}

// Create factory function for QueryExecutor
export function createQueryExecutor(
  client: SupabaseClient | null,
  options?: {
    cacheMaxSize?: number;
    cacheTtl?: number;
    deduplicationTimeout?: number;
  }
): QueryExecutor {
  const cache = new QueryCache({
    maxSize: options?.cacheMaxSize ?? 500,
    defaultTtl: options?.cacheTtl ?? 5 * 60 * 1000,
    evictionStrategy: 'lru',
  });

  const deduplicator = new RequestDeduplicator(
    options?.deduplicationTimeout ?? 30000
  );

  return new QueryExecutor(client, cache, deduplicator);
}
