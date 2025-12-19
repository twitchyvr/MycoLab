// ============================================================================
// DATABASE SERVICE
// Main entry point for optimized database operations
// Integrates query execution, caching, real-time, and batch writing
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IDatabaseService,
  IQueryExecutor,
  IConnectionManager,
  IRealtimeManager,
  IBatchWriter,
  IEntityLoader,
  QueryOptions,
  QueryResult,
  EntityLoaderConfig,
  LoadResult,
  RealtimeEventType,
  RealtimePayload,
  BatchOperation,
  BatchResult,
  ConnectionHealth,
  ConnectionState,
  CacheStats,
} from './types';
import { QueryExecutor, createQueryExecutor } from './QueryExecutor';
import { ConnectionManager, createConnectionManager } from './ConnectionManager';
import { RealtimeManager, createRealtimeManager } from './RealtimeManager';
import { BatchWriter, createBatchWriter } from './BatchWriter';
import { EntityLoader, createEntityLoader, getDefaultLoadConfig } from './EntityLoader';
import { supabase, getCurrentUserId as getSupabaseUserId, ensureSession } from '../supabase';

// ============================================================================
// DATABASE SERVICE IMPLEMENTATION
// ============================================================================

class DatabaseService implements IDatabaseService {
  private _client: SupabaseClient | null = null;
  private _userId: string | null = null;
  private _isInitialized = false;

  // Service instances
  private _queryExecutor: QueryExecutor | null = null;
  private _connectionManager: ConnectionManager | null = null;
  private _realtimeManager: RealtimeManager | null = null;
  private _batchWriter: BatchWriter | null = null;
  private _entityLoader: EntityLoader | null = null;

  // Cached user ID promise to prevent multiple concurrent fetches
  private _userIdPromise: Promise<string | null> | null = null;

  constructor() {
    // Initialize with global supabase client
    this._client = supabase;
  }

  // ============================================================================
  // PROPERTIES
  // ============================================================================

  get client(): SupabaseClient | null {
    return this._client;
  }

  get isConnected(): boolean {
    return this._connectionManager?.getHealth().state === 'connected' || false;
  }

  get userId(): string | null {
    return this._userId;
  }

  // ============================================================================
  // SERVICE ACCESSORS
  // ============================================================================

  get query(): IQueryExecutor {
    if (!this._queryExecutor) {
      this._queryExecutor = createQueryExecutor(this._client, {
        cacheMaxSize: 500,
        cacheTtl: 5 * 60 * 1000, // 5 minutes
      });
    }
    return this._queryExecutor;
  }

  get connection(): IConnectionManager {
    if (!this._connectionManager) {
      this._connectionManager = createConnectionManager(this._client, {
        heartbeatInterval: 30000,
        maxReconnectAttempts: 5,
      });
    }
    return this._connectionManager;
  }

  get realtime(): IRealtimeManager {
    if (!this._realtimeManager) {
      this._realtimeManager = createRealtimeManager(this._client, {
        autoReconnect: true,
        eventDebounce: 100,
      });
    }
    return this._realtimeManager;
  }

  get batch(): IBatchWriter {
    if (!this._batchWriter) {
      this._batchWriter = createBatchWriter(this._client, {
        maxBatchSize: 50,
        flushInterval: 100,
        optimisticUpdates: true,
      });
    }
    return this._batchWriter;
  }

  get loader(): IEntityLoader {
    if (!this._entityLoader) {
      this._entityLoader = createEntityLoader(this._client, this._queryExecutor!);
    }
    return this._entityLoader;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Initialize the database service
   */
  async initialize(): Promise<void> {
    if (this._isInitialized) return;

    console.log('[DatabaseService] Initializing...');

    // Ensure we have a session
    await ensureSession();

    // Get user ID
    this._userId = await this.getCurrentUserId();

    // Initialize all services
    this._queryExecutor = createQueryExecutor(this._client, {
      cacheMaxSize: 500,
      cacheTtl: 5 * 60 * 1000,
    });

    this._connectionManager = createConnectionManager(this._client, {
      heartbeatInterval: 30000,
      maxReconnectAttempts: 5,
    });

    this._realtimeManager = createRealtimeManager(this._client, {
      autoReconnect: true,
      eventDebounce: 100,
    });

    this._batchWriter = createBatchWriter(this._client, {
      maxBatchSize: 50,
      flushInterval: 100,
    });

    this._entityLoader = createEntityLoader(this._client, this._queryExecutor);

    this._isInitialized = true;
    console.log('[DatabaseService] Initialized successfully');
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    console.log('[DatabaseService] Disposing...');

    this._connectionManager?.dispose();
    this._realtimeManager?.dispose();
    this._batchWriter?.dispose();

    this._queryExecutor = null;
    this._connectionManager = null;
    this._realtimeManager = null;
    this._batchWriter = null;
    this._entityLoader = null;

    this._isInitialized = false;
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Set the current user ID
   */
  setUserId(userId: string | null): void {
    this._userId = userId;
    this._userIdPromise = null; // Clear cached promise
  }

  /**
   * Get the current user ID (cached)
   */
  async getCurrentUserId(): Promise<string | null> {
    // Return cached value if available
    if (this._userId) {
      return this._userId;
    }

    // Use cached promise to prevent concurrent fetches
    if (this._userIdPromise) {
      return this._userIdPromise;
    }

    this._userIdPromise = getSupabaseUserId().then((userId) => {
      this._userId = userId;
      return userId;
    });

    return this._userIdPromise;
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Execute a query with default options
   */
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    cacheKey?: string,
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    return this.query.execute(queryFn, cacheKey, options);
  }

  /**
   * Load all entities using parallel execution
   */
  async loadAllEntities(config?: EntityLoaderConfig): Promise<LoadResult> {
    return this.loader.loadAll(config ?? getDefaultLoadConfig());
  }

  /**
   * Subscribe to real-time changes for a table
   */
  subscribeToTable(
    table: string,
    callback: (payload: RealtimePayload) => void,
    event: RealtimeEventType = '*'
  ): string {
    return this.realtime.subscribe(table, event, callback);
  }

  /**
   * Queue a write operation for batching
   */
  async queueWrite(
    operation: Omit<BatchOperation, 'id' | 'createdAt' | 'retryCount'>
  ): Promise<BatchResult> {
    return this.batch.queue(operation);
  }

  /**
   * Invalidate cache for a table
   */
  invalidateTableCache(table: string): void {
    this.query.invalidateCache(new RegExp(`^${table}:`));
  }

  /**
   * Get connection health
   */
  getConnectionHealth(): ConnectionHealth {
    return this.connection.getHealth();
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    return this.connection.onStateChange(callback);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.query.getCacheStats();
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<boolean> {
    return this.connection.reconnect();
  }

  /**
   * Flush all pending batch operations
   */
  async flushBatch(): Promise<BatchResult[]> {
    return this.batch.flush();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let databaseServiceInstance: DatabaseService | null = null;

/**
 * Get the singleton database service instance
 */
export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new DatabaseService();
  }
  return databaseServiceInstance;
}

/**
 * Initialize the database service (call once on app startup)
 */
export async function initializeDatabaseService(): Promise<DatabaseService> {
  const service = getDatabaseService();
  await service.initialize();
  return service;
}

/**
 * Dispose the database service (call on app shutdown)
 */
export function disposeDatabaseService(): void {
  if (databaseServiceInstance) {
    databaseServiceInstance.dispose();
    databaseServiceInstance = null;
  }
}

// Export the DatabaseService class for testing
export { DatabaseService };
