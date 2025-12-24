// ============================================================================
// ENTITY LOADER
// Optimized parallel loading of database entities
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import {
  TableConfig,
  EntityLoaderConfig,
  LoadResult,
  QueryResult,
  QueryError,
  IEntityLoader,
} from './types';
import { QueryExecutor } from './QueryExecutor';
import { generateSelectKey } from './RequestDeduplicator';

// Default configuration
const DEFAULT_MAX_CONCURRENT = 10;

// Table priority ordering (higher priority = loaded first in parallel batches)
const TABLE_PRIORITIES: Record<string, number> = {
  // High priority - core lookups needed for other data
  species: 100,
  strains: 95,
  locations: 90,
  location_types: 85,
  location_classifications: 85,
  containers: 80,
  substrate_types: 75,
  grain_types: 70,
  inventory_categories: 65,
  recipe_categories: 60,
  suppliers: 55,

  // Medium priority - main user data
  cultures: 50,
  grows: 45,
  recipes: 40,
  inventory_items: 35,
  prepared_spawn: 30,
  grain_spawn: 28,

  // Lower priority - detail/related data
  flushes: 25,
  inventory_lots: 20,
  purchase_orders: 15,
  user_settings: 10,

  // Lowest priority - observations and transfers
  culture_observations: 5,
  culture_transfers: 5,
  grow_observations: 5,
  grain_spawn_observations: 5,
};

export class EntityLoader implements IEntityLoader {
  private readonly client: SupabaseClient | null;
  private readonly executor: QueryExecutor;
  private readonly preloadedTables: Set<string> = new Set();

  constructor(client: SupabaseClient | null, executor: QueryExecutor) {
    this.client = client;
    this.executor = executor;
  }

  /**
   * Load all tables according to configuration
   * Uses parallel execution with configurable concurrency
   */
  async loadAll(config: EntityLoaderConfig): Promise<LoadResult> {
    const startTime = Date.now();
    const errors: QueryError[] = [];
    const tableResults: LoadResult['tables'] = {};

    if (!this.client) {
      return {
        success: false,
        tables: {},
        totalTime: Date.now() - startTime,
        errors: [
          {
            code: 'NO_CLIENT',
            message: 'Supabase client not configured',
            isRetryable: false,
          },
        ],
      };
    }

    const { tables, parallel = true, maxConcurrent = DEFAULT_MAX_CONCURRENT } = config;

    // Sort tables by priority
    const sortedTables = [...tables].sort((a, b) => {
      const priorityA = TABLE_PRIORITIES[a.name] ?? 0;
      const priorityB = TABLE_PRIORITIES[b.name] ?? 0;
      return priorityB - priorityA;
    });

    if (parallel) {
      // Execute in parallel batches
      for (let i = 0; i < sortedTables.length; i += maxConcurrent) {
        const batch = sortedTables.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((tableConfig) =>
          this.loadTableInternal(tableConfig)
        );

        const batchResults = await Promise.all(batchPromises);

        for (let j = 0; j < batch.length; j++) {
          const tableConfig = batch[j];
          const result = batchResults[j];

          tableResults[tableConfig.name] = {
            data: result.data ?? [],
            error: result.error ?? undefined,
            timing: result.timing.duration,
            cached: result.cached,
          };

          if (result.error) {
            errors.push(result.error);
          }
        }
      }
    } else {
      // Execute sequentially
      for (const tableConfig of sortedTables) {
        const result = await this.loadTableInternal(tableConfig);

        tableResults[tableConfig.name] = {
          data: result.data ?? [],
          error: result.error ?? undefined,
          timing: result.timing.duration,
          cached: result.cached,
        };

        if (result.error) {
          errors.push(result.error);
        }
      }
    }

    const totalTime = Date.now() - startTime;

    // Log performance metrics only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EntityLoader] Loaded ${tables.length} tables in ${totalTime}ms`);
      if (parallel) {
        const sequentialTime = Object.values(tableResults).reduce(
          (sum, r) => sum + r.timing,
          0
        );
        // Avoid NaN when sequentialTime is 0 (all cached)
        const savings = sequentialTime > 0 ? Math.round(((sequentialTime - totalTime) / sequentialTime) * 100) : 0;
        console.log(
          `[EntityLoader] Parallel loading saved ~${savings}% time (${sequentialTime}ms sequential vs ${totalTime}ms parallel)`
        );
      }
    }

    return {
      success: errors.length === 0 || errors.every((e) => !config.tables.find(t => t.name === e.code)?.required),
      tables: tableResults,
      totalTime,
      errors,
    };
  }

  /**
   * Load a single table
   */
  async loadTable<T>(config: TableConfig): Promise<QueryResult<T[]>> {
    return this.loadTableInternal(config) as Promise<QueryResult<T[]>>;
  }

  /**
   * Mark tables for preloading (hints for optimization)
   */
  preload(tables: string[]): void {
    for (const table of tables) {
      this.preloadedTables.add(table);
    }
  }

  /**
   * Internal table loading with caching and transformation
   */
  private async loadTableInternal(config: TableConfig): Promise<QueryResult<unknown[]>> {
    const {
      name,
      orderBy,
      select = '*',
      filter,
      transform,
      cacheTtl,
    } = config;

    const cacheKey = generateSelectKey(name, {
      select,
      order: orderBy,
    });

    return this.executor.execute(
      async (client) => {
        let query = client.from(name).select(select);

        if (orderBy) {
          query = query.order(orderBy.column, {
            ascending: orderBy.ascending ?? true,
          });
        }

        if (filter) {
          query = filter(query);
        }

        const { data, error } = await query;

        // Apply transformation if provided
        if (data && transform) {
          try {
            return {
              data: data.map(transform),
              error: null,
            };
          } catch (transformError) {
            console.error(`[EntityLoader] Transform error for ${name}:`, transformError);
            return { data, error: null };
          }
        }

        return { data, error };
      },
      cacheKey,
      {
        cacheTtl: cacheTtl ?? 60000, // 1 minute default cache
        deduplicate: true,
        retryCount: 2,
      }
    );
  }
}

// ============================================================================
// TABLE CONFIGURATIONS
// Pre-defined configurations for all MycoLab tables
// ============================================================================

export const TABLE_CONFIGS: Record<string, TableConfig> = {
  species: {
    name: 'species',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  strains: {
    name: 'strains',
    orderBy: { column: 'name', ascending: true },
    required: true,
  },
  locations: {
    name: 'locations',
    orderBy: { column: 'name', ascending: true },
    required: true,
  },
  location_types: {
    name: 'location_types',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  location_classifications: {
    name: 'location_classifications',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  suppliers: {
    name: 'suppliers',
    orderBy: { column: 'name', ascending: true },
    required: true,
  },
  containers: {
    name: 'containers',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  substrate_types: {
    name: 'substrate_types',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  inventory_categories: {
    name: 'inventory_categories',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  inventory_items: {
    name: 'inventory_items',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  inventory_lots: {
    name: 'inventory_lots',
    orderBy: { column: 'created_at', ascending: false },
    required: false,
  },
  purchase_orders: {
    name: 'purchase_orders',
    orderBy: { column: 'created_at', ascending: false },
    required: false,
  },
  recipe_categories: {
    name: 'recipe_categories',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  grain_types: {
    name: 'grain_types',
    orderBy: { column: 'name', ascending: true },
    required: false,
  },
  cultures: {
    name: 'cultures',
    orderBy: { column: 'created_at', ascending: false },
    required: true,
    // Exclude archived records from loading
    filter: (query: any) => query.or('is_archived.is.null,is_archived.eq.false'),
  },
  prepared_spawn: {
    name: 'prepared_spawn',
    orderBy: { column: 'prep_date', ascending: false },
    required: false,
    // Exclude archived records from loading
    filter: (query: any) => query.or('is_archived.is.null,is_archived.eq.false'),
  },
  grain_spawn: {
    name: 'grain_spawn',
    orderBy: { column: 'inoculation_date', ascending: false },
    required: false,
    // Exclude archived records from loading
    filter: (query: any) => query.or('is_archived.is.null,is_archived.eq.false'),
  },
  grows: {
    name: 'grows',
    orderBy: { column: 'created_at', ascending: false },
    required: true,
    // Exclude archived records from loading
    filter: (query: any) => query.or('is_archived.is.null,is_archived.eq.false'),
  },
  flushes: {
    name: 'flushes',
    orderBy: { column: 'harvest_date', ascending: false },
    required: true,
  },
  recipes: {
    name: 'recipes',
    orderBy: { column: 'name', ascending: true },
    required: true,
  },
  entity_outcomes: {
    name: 'entity_outcomes',
    orderBy: { column: 'created_at', ascending: false },
    required: false,
  },
  contamination_details: {
    name: 'contamination_details',
    orderBy: { column: 'created_at', ascending: false },
    required: false,
  },
};

/**
 * Get default table configurations for initial data load
 */
export function getDefaultLoadConfig(): EntityLoaderConfig {
  return {
    tables: Object.values(TABLE_CONFIGS),
    parallel: true,
    maxConcurrent: 10,
  };
}

/**
 * Get minimal table configurations for quick load
 */
export function getMinimalLoadConfig(): EntityLoaderConfig {
  const essentialTables = [
    'species',
    'strains',
    'locations',
    'cultures',
    'grows',
    'flushes',
    'recipes',
  ];

  return {
    tables: essentialTables.map((name) => TABLE_CONFIGS[name]).filter(Boolean),
    parallel: true,
    maxConcurrent: 7,
  };
}

// Create factory function
export function createEntityLoader(
  client: SupabaseClient | null,
  executor: QueryExecutor
): EntityLoader {
  return new EntityLoader(client, executor);
}
