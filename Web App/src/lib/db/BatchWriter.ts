// ============================================================================
// BATCH WRITER
// Batches multiple write operations for efficient bulk execution
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import {
  BatchOperation,
  BatchOperationType,
  BatchResult,
  BatchConfig,
  QueryError,
  IBatchWriter,
} from './types';

// Default configuration
const DEFAULT_MAX_BATCH_SIZE = 50;
const DEFAULT_FLUSH_INTERVAL = 100; // 100ms
const DEFAULT_MAX_QUEUE_TIME = 5000; // 5 seconds

type BatchCompleteCallback = (results: BatchResult[]) => void;

export class BatchWriter implements IBatchWriter {
  private readonly client: SupabaseClient | null;
  private readonly config: Required<BatchConfig>;
  private readonly operationQueue: Map<string, BatchOperation> = new Map();
  private readonly callbacks: Set<BatchCompleteCallback> = new Set();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;
  private operationCounter = 0;

  constructor(client: SupabaseClient | null, config: BatchConfig = {}) {
    this.client = client;
    this.config = {
      maxBatchSize: config.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE,
      flushInterval: config.flushInterval ?? DEFAULT_FLUSH_INTERVAL,
      maxQueueTime: config.maxQueueTime ?? DEFAULT_MAX_QUEUE_TIME,
      optimisticUpdates: config.optimisticUpdates ?? true,
    };

    // Start max queue time checker
    this.startQueueTimeChecker();
  }

  /**
   * Queue a write operation
   */
  async queue(
    operation: Omit<BatchOperation, 'id' | 'createdAt' | 'retryCount'>
  ): Promise<BatchResult> {
    const id = `op-${Date.now()}-${++this.operationCounter}`;
    const queuedAt = Date.now();

    const fullOperation: BatchOperation = {
      ...operation,
      id,
      createdAt: queuedAt,
      retryCount: 0,
    };

    this.operationQueue.set(id, fullOperation);

    // Schedule flush
    this.scheduleFlush();

    // If at capacity, flush immediately
    if (this.operationQueue.size >= this.config.maxBatchSize) {
      const results = await this.flush();
      const result = results.find((r) => r.operationId === id);
      if (result) return result;
    }

    // Wait for the operation to complete
    return new Promise((resolve) => {
      const checkResult = () => {
        // Check if operation is still in queue
        if (!this.operationQueue.has(id)) {
          // Operation was processed, return success (optimistic)
          resolve({
            operationId: id,
            success: true,
            timing: {
              queuedAt,
              executedAt: Date.now(),
              completedAt: Date.now(),
            },
          });
        } else {
          // Wait and check again
          setTimeout(checkResult, 50);
        }
      };

      // Set timeout for max queue time
      setTimeout(() => {
        if (this.operationQueue.has(id)) {
          this.operationQueue.delete(id);
          resolve({
            operationId: id,
            success: false,
            error: {
              code: 'QUEUE_TIMEOUT',
              message: 'Operation timed out in queue',
              isRetryable: true,
            },
            timing: {
              queuedAt,
              executedAt: Date.now(),
              completedAt: Date.now(),
            },
          });
        }
      }, this.config.maxQueueTime);

      checkResult();
    });
  }

  /**
   * Flush all pending operations
   */
  async flush(): Promise<BatchResult[]> {
    if (this.isFlushing || this.operationQueue.size === 0) {
      return [];
    }

    this.isFlushing = true;
    this.clearFlushTimer();

    try {
      // Group operations by table and type
      const grouped = this.groupOperations();
      const results: BatchResult[] = [];

      // Execute each group
      for (const [key, operations] of grouped.entries()) {
        const groupResults = await this.executeGroup(key, operations);
        results.push(...groupResults);
      }

      // Notify callbacks
      if (results.length > 0) {
        for (const callback of this.callbacks) {
          try {
            callback(results);
          } catch (err) {
            console.error('[BatchWriter] Error in batch complete callback:', err);
          }
        }
      }

      return results;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get count of pending operations
   */
  getPendingCount(): number {
    return this.operationQueue.size;
  }

  /**
   * Subscribe to batch complete events
   */
  onBatchComplete(callback: BatchCompleteCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Group operations by table and type
   */
  private groupOperations(): Map<string, BatchOperation[]> {
    const grouped = new Map<string, BatchOperation[]>();

    for (const operation of this.operationQueue.values()) {
      const key = `${operation.table}:${operation.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(operation);
    }

    return grouped;
  }

  /**
   * Execute a group of operations
   */
  private async executeGroup(
    key: string,
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const [table, type] = key.split(':') as [string, BatchOperationType];
    const results: BatchResult[] = [];
    const executedAt = Date.now();

    if (!this.client) {
      // No client, mark all as failed
      for (const op of operations) {
        this.operationQueue.delete(op.id);
        results.push({
          operationId: op.id,
          success: false,
          error: {
            code: 'NO_CLIENT',
            message: 'Supabase client not configured',
            isRetryable: false,
          },
          timing: {
            queuedAt: op.createdAt,
            executedAt,
            completedAt: Date.now(),
          },
        });
      }
      return results;
    }

    try {
      // Execute based on operation type
      switch (type) {
        case 'insert':
          return await this.executeBatchInsert(table, operations);
        case 'update':
          return await this.executeBatchUpdate(table, operations);
        case 'upsert':
          return await this.executeBatchUpsert(table, operations);
        case 'delete':
          return await this.executeBatchDelete(table, operations);
        default:
          // Unknown type, mark as failed
          for (const op of operations) {
            this.operationQueue.delete(op.id);
            results.push({
              operationId: op.id,
              success: false,
              error: {
                code: 'UNKNOWN_OPERATION',
                message: `Unknown operation type: ${type}`,
                isRetryable: false,
              },
              timing: {
                queuedAt: op.createdAt,
                executedAt,
                completedAt: Date.now(),
              },
            });
          }
          return results;
      }
    } catch (err) {
      // Catch-all error handler
      for (const op of operations) {
        this.operationQueue.delete(op.id);
        results.push({
          operationId: op.id,
          success: false,
          error: this.normalizeError(err),
          timing: {
            queuedAt: op.createdAt,
            executedAt,
            completedAt: Date.now(),
          },
        });
      }
      return results;
    }
  }

  /**
   * Execute batch insert
   */
  private async executeBatchInsert(
    table: string,
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const executedAt = Date.now();

    // Collect all data to insert
    const dataToInsert = operations.flatMap((op) =>
      Array.isArray(op.data) ? op.data : [op.data]
    );

    try {
      const { data, error } = await this.client!
        .from(table)
        .insert(dataToInsert)
        .select();

      const completedAt = Date.now();

      if (error) {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: false,
            error: this.normalizeError(error),
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      } else {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: true,
            data,
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      }
    } catch (err) {
      const completedAt = Date.now();
      for (const op of operations) {
        this.operationQueue.delete(op.id);
        results.push({
          operationId: op.id,
          success: false,
          error: this.normalizeError(err),
          timing: { queuedAt: op.createdAt, executedAt, completedAt },
        });
      }
    }

    return results;
  }

  /**
   * Execute batch update (each operation separately due to different filters)
   */
  private async executeBatchUpdate(
    table: string,
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    // Updates need to be executed individually due to different IDs/filters
    for (const op of operations) {
      const executedAt = Date.now();
      this.operationQueue.delete(op.id);

      try {
        const data = op.data as Record<string, unknown>;
        const id = data.id as string;

        // Remove id from the update data
        const { id: _, ...updateData } = data;

        const { error } = await this.client!
          .from(table)
          .update(updateData)
          .eq('id', id);

        results.push({
          operationId: op.id,
          success: !error,
          error: error ? this.normalizeError(error) : undefined,
          timing: {
            queuedAt: op.createdAt,
            executedAt,
            completedAt: Date.now(),
          },
        });
      } catch (err) {
        results.push({
          operationId: op.id,
          success: false,
          error: this.normalizeError(err),
          timing: {
            queuedAt: op.createdAt,
            executedAt,
            completedAt: Date.now(),
          },
        });
      }
    }

    return results;
  }

  /**
   * Execute batch upsert
   */
  private async executeBatchUpsert(
    table: string,
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const executedAt = Date.now();

    const dataToUpsert = operations.flatMap((op) =>
      Array.isArray(op.data) ? op.data : [op.data]
    );

    try {
      const { data, error } = await this.client!
        .from(table)
        .upsert(dataToUpsert, {
          onConflict: operations[0]?.options?.onConflict || 'id',
        })
        .select();

      const completedAt = Date.now();

      if (error) {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: false,
            error: this.normalizeError(error),
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      } else {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: true,
            data,
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      }
    } catch (err) {
      const completedAt = Date.now();
      for (const op of operations) {
        this.operationQueue.delete(op.id);
        results.push({
          operationId: op.id,
          success: false,
          error: this.normalizeError(err),
          timing: { queuedAt: op.createdAt, executedAt, completedAt },
        });
      }
    }

    return results;
  }

  /**
   * Execute batch delete
   */
  private async executeBatchDelete(
    table: string,
    operations: BatchOperation[]
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const executedAt = Date.now();

    // Collect all IDs to delete
    const idsToDelete = operations.map((op) => {
      const data = op.data as Record<string, unknown>;
      return data.id as string;
    });

    try {
      const { error } = await this.client!
        .from(table)
        .delete()
        .in('id', idsToDelete);

      const completedAt = Date.now();

      if (error) {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: false,
            error: this.normalizeError(error),
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      } else {
        for (const op of operations) {
          this.operationQueue.delete(op.id);
          results.push({
            operationId: op.id,
            success: true,
            timing: { queuedAt: op.createdAt, executedAt, completedAt },
          });
        }
      }
    } catch (err) {
      const completedAt = Date.now();
      for (const op of operations) {
        this.operationQueue.delete(op.id);
        results.push({
          operationId: op.id,
          success: false,
          error: this.normalizeError(err),
          timing: { queuedAt: op.createdAt, executedAt, completedAt },
        });
      }
    }

    return results;
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Clear the flush timer
   */
  private clearFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Check for operations that have been in queue too long
   */
  private startQueueTimeChecker(): void {
    setInterval(() => {
      const now = Date.now();
      const maxAge = this.config.maxQueueTime;

      for (const [id, op] of this.operationQueue.entries()) {
        if (now - op.createdAt > maxAge) {
          console.warn(`[BatchWriter] Operation ${id} exceeded max queue time, flushing`);
          this.flush();
          break;
        }
      }
    }, 1000);
  }

  /**
   * Normalize error to QueryError
   */
  private normalizeError(error: unknown): QueryError {
    if (!error) {
      return {
        code: 'UNKNOWN',
        message: 'An unknown error occurred',
        isRetryable: false,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      return {
        code: String(err.code ?? 'UNKNOWN'),
        message: String(err.message ?? 'Unknown error'),
        isRetryable: false,
      };
    }

    return {
      code: 'UNKNOWN',
      message: String(error),
      isRetryable: false,
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clearFlushTimer();
    this.operationQueue.clear();
    this.callbacks.clear();
  }
}

// Create factory function
export function createBatchWriter(
  client: SupabaseClient | null,
  config?: BatchConfig
): BatchWriter {
  return new BatchWriter(client, config);
}
