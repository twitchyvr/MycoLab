// ============================================================================
// DATABASE SERVICE TYPES
// Type definitions for the optimized database layer
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface QueryOptions {
  /** Cache time-to-live in milliseconds (0 = no cache) */
  cacheTtl?: number;
  /** Whether to deduplicate concurrent identical requests */
  deduplicate?: boolean;
  /** Number of retry attempts on failure */
  retryCount?: number;
  /** Base delay between retries in ms (exponential backoff) */
  retryDelay?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Optional abort signal for cancellation */
  signal?: AbortSignal;
  /** Priority level for request ordering */
  priority?: 'high' | 'normal' | 'low';
}

export interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
  cached: boolean;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
    retryCount: number;
  };
}

export interface QueryError {
  code: string;
  message: string;
  details?: unknown;
  hint?: string;
  isRetryable: boolean;
  originalError?: unknown;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryEstimate: number;
}

export interface CacheOptions {
  /** Maximum number of entries to cache */
  maxSize?: number;
  /** Default TTL in milliseconds */
  defaultTtl?: number;
  /** Eviction strategy */
  evictionStrategy?: 'lru' | 'lfu' | 'ttl';
  /** Enable memory size tracking */
  trackMemory?: boolean;
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ConnectionHealth {
  state: ConnectionState;
  lastConnected: number | null;
  lastError: QueryError | null;
  reconnectAttempts: number;
  latency: number | null;
  isOnline: boolean;
}

export interface ConnectionConfig {
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay multiplier */
  reconnectDelayMultiplier?: number;
  /** Maximum reconnection delay in ms */
  maxReconnectDelay?: number;
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeSubscription {
  id: string;
  table: string;
  event: RealtimeEventType;
  filter?: string;
  callback: (payload: RealtimePayload) => void;
  status: 'pending' | 'active' | 'error' | 'closed';
  createdAt: number;
}

export interface RealtimePayload {
  eventType: RealtimeEventType;
  table: string;
  schema: string;
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
  commitTimestamp: string;
}

export interface RealtimeConfig {
  /** Whether to automatically reconnect on disconnect */
  autoReconnect?: boolean;
  /** Debounce rapid events in milliseconds */
  eventDebounce?: number;
  /** Maximum subscriptions per table */
  maxSubscriptionsPerTable?: number;
}

// ============================================================================
// BATCH WRITE TYPES
// ============================================================================

export type BatchOperationType = 'insert' | 'update' | 'upsert' | 'delete';

export interface BatchOperation {
  id: string;
  table: string;
  type: BatchOperationType;
  data: Record<string, unknown> | Record<string, unknown>[];
  options?: {
    onConflict?: string;
    returning?: boolean;
  };
  priority: number;
  createdAt: number;
  retryCount: number;
}

export interface BatchResult {
  operationId: string;
  success: boolean;
  data?: unknown;
  error?: QueryError;
  timing: {
    queuedAt: number;
    executedAt: number;
    completedAt: number;
  };
}

export interface BatchConfig {
  /** Maximum batch size before auto-flush */
  maxBatchSize?: number;
  /** Flush interval in milliseconds */
  flushInterval?: number;
  /** Maximum wait time for an operation in queue */
  maxQueueTime?: number;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
}

// ============================================================================
// ENTITY LOADER TYPES
// ============================================================================

export interface EntityLoaderConfig {
  /** Tables to load and their configurations */
  tables: TableConfig[];
  /** Whether to load in parallel */
  parallel?: boolean;
  /** Maximum concurrent requests */
  maxConcurrent?: number;
}

export interface TableConfig {
  name: string;
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
  filter?: (query: any) => any;
  transform?: (row: any) => any;
  required?: boolean;
  cacheTtl?: number;
}

export interface LoadResult {
  success: boolean;
  tables: {
    [tableName: string]: {
      data: unknown[];
      error?: QueryError;
      timing: number;
      cached: boolean;
    };
  };
  totalTime: number;
  errors: QueryError[];
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IQueryExecutor {
  execute<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    cacheKey?: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>>;
  invalidateCache(pattern?: string | RegExp): void;
  getCacheStats(): CacheStats;
}

export interface IConnectionManager {
  getHealth(): ConnectionHealth;
  onStateChange(callback: (state: ConnectionState) => void): () => void;
  checkConnection(): Promise<boolean>;
  reconnect(): Promise<boolean>;
}

export interface IRealtimeManager {
  subscribe(
    table: string,
    event: RealtimeEventType,
    callback: (payload: RealtimePayload) => void,
    filter?: string
  ): string;
  unsubscribe(subscriptionId: string): void;
  unsubscribeAll(table?: string): void;
  getSubscriptions(): RealtimeSubscription[];
}

export interface IBatchWriter {
  queue(operation: Omit<BatchOperation, 'id' | 'createdAt' | 'retryCount'>): Promise<BatchResult>;
  flush(): Promise<BatchResult[]>;
  getPendingCount(): number;
  onBatchComplete(callback: (results: BatchResult[]) => void): () => void;
}

export interface IEntityLoader {
  loadAll(config: EntityLoaderConfig): Promise<LoadResult>;
  loadTable<T>(config: TableConfig): Promise<QueryResult<T[]>>;
  preload(tables: string[]): void;
}

// ============================================================================
// DATABASE SERVICE INTERFACE
// ============================================================================

export interface IDatabaseService {
  readonly client: SupabaseClient | null;
  readonly isConnected: boolean;
  readonly userId: string | null;

  // Core services
  query: IQueryExecutor;
  connection: IConnectionManager;
  realtime: IRealtimeManager;
  batch: IBatchWriter;
  loader: IEntityLoader;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): void;

  // User management
  setUserId(userId: string | null): void;
  getCurrentUserId(): Promise<string | null>;
}
