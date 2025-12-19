// ============================================================================
// QUERY CACHE
// In-memory cache with TTL, LRU eviction, and memory tracking
// ============================================================================

import { CacheEntry, CacheOptions, CacheStats } from './types';

const DEFAULT_MAX_SIZE = 500;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly evictionStrategy: 'lru' | 'lfu' | 'ttl';
  private readonly trackMemory: boolean;

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.defaultTtl = options.defaultTtl ?? DEFAULT_TTL;
    this.evictionStrategy = options.evictionStrategy ?? 'lru';
    this.trackMemory = options.trackMemory ?? false;
  }

  /**
   * Get a cached value by key
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access tracking
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + (ttl ?? this.defaultTtl),
      hits: 0,
      lastAccessed: now,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidate(pattern?: string | RegExp): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }

    let count = 0;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Remove a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear expired entries
   */
  prune(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      evictions: this.stats.evictions,
      memoryEstimate: this.trackMemory ? this.estimateMemory() : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Evict entries based on strategy
   */
  private evict(): void {
    switch (this.evictionStrategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'lfu':
        this.evictLFU();
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldest: { key: string; lastAccessed: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = { key, lastAccessed: entry.lastAccessed };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
      this.stats.evictions++;
    }
  }

  /**
   * Evict least frequently used entry
   */
  private evictLFU(): void {
    let leastUsed: { key: string; hits: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!leastUsed || entry.hits < leastUsed.hits) {
        leastUsed = { key, hits: entry.hits };
      }
    }

    if (leastUsed) {
      this.cache.delete(leastUsed.key);
      this.stats.evictions++;
    }
  }

  /**
   * Evict entries closest to expiration
   */
  private evictTTL(): void {
    let soonest: { key: string; expiresAt: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!soonest || entry.expiresAt < soonest.expiresAt) {
        soonest = { key, expiresAt: entry.expiresAt };
      }
    }

    if (soonest) {
      this.cache.delete(soonest.key);
      this.stats.evictions++;
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemory(): number {
    let total = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Key size
      total += key.length * 2; // UTF-16

      // Entry metadata
      total += 48; // Approximate object overhead + numbers

      // Data size (rough estimation)
      total += this.estimateDataSize(entry.data);
    }

    return total;
  }

  /**
   * Estimate size of data (rough approximation)
   */
  private estimateDataSize(data: unknown): number {
    if (data === null || data === undefined) return 0;
    if (typeof data === 'boolean') return 4;
    if (typeof data === 'number') return 8;
    if (typeof data === 'string') return data.length * 2;

    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.estimateDataSize(item), 16);
    }

    if (typeof data === 'object') {
      let size = 32; // Object overhead
      for (const [key, value] of Object.entries(data)) {
        size += key.length * 2 + this.estimateDataSize(value);
      }
      return size;
    }

    return 8;
  }
}

// Create singleton instance with sensible defaults
export const queryCache = new QueryCache({
  maxSize: 500,
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  evictionStrategy: 'lru',
  trackMemory: false,
});
