// ============================================================================
// DATABASE MODULE EXPORTS
// Optimized database layer for MycoLab
// ============================================================================

// Types
export type {
  QueryOptions,
  QueryResult,
  QueryError,
  CacheEntry,
  CacheStats,
  CacheOptions,
  ConnectionState,
  ConnectionHealth,
  ConnectionConfig,
  RealtimeEventType,
  RealtimeSubscription,
  RealtimePayload,
  RealtimeConfig,
  BatchOperationType,
  BatchOperation,
  BatchResult,
  BatchConfig,
  EntityLoaderConfig,
  TableConfig,
  LoadResult,
  IQueryExecutor,
  IConnectionManager,
  IRealtimeManager,
  IBatchWriter,
  IEntityLoader,
  IDatabaseService,
} from './types';

// Query Cache
export { QueryCache, queryCache } from './QueryCache';

// Request Deduplicator
export {
  RequestDeduplicator,
  requestDeduplicator,
  generateQueryKey,
  generateSelectKey,
} from './RequestDeduplicator';

// Query Executor
export { QueryExecutor, createQueryExecutor } from './QueryExecutor';

// Connection Manager
export { ConnectionManager, createConnectionManager } from './ConnectionManager';

// Realtime Manager
export { RealtimeManager, createRealtimeManager } from './RealtimeManager';

// Batch Writer
export { BatchWriter, createBatchWriter } from './BatchWriter';

// Entity Loader
export {
  EntityLoader,
  createEntityLoader,
  TABLE_CONFIGS,
  getDefaultLoadConfig,
  getMinimalLoadConfig,
} from './EntityLoader';

// Database Service (main entry point)
export {
  DatabaseService,
  getDatabaseService,
  initializeDatabaseService,
  disposeDatabaseService,
} from './DatabaseService';

// Lookup Maps
export {
  LookupMap,
  IndexedLookupMap,
  EntityStore,
  entityStore,
  useLookupMap,
  useIndexedLookupMap,
  useLookup,
} from './LookupMaps';

// Data Loader (optimized loading for DataContext)
export {
  loadAllDataOptimized,
  loadTablesOptimized,
  setupRealtimeSync,
  createLookupMaps,
  calculateLoadMetrics,
} from './DataLoader';
export type {
  DataLoaderState,
  DataLoaderResult,
  EntityLookupMaps,
  LoadMetrics,
} from './DataLoader';

// React Hooks
export {
  useDatabase,
  useEntity,
  useFilteredEntities,
  useConnectionStatus,
} from './useDatabase';
