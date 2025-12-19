// ============================================================================
// USE DATABASE HOOK
// React hook for database services integration
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getDatabaseService, initializeDatabaseService } from './DatabaseService';
import { loadAllDataOptimized, setupRealtimeSync, createLookupMaps } from './DataLoader';
import type { DataLoaderState, EntityLookupMaps } from './DataLoader';
import type { ConnectionState, ConnectionHealth, RealtimePayload } from './types';
import { supabase } from '../supabase';

// ============================================================================
// HOOK STATE
// ============================================================================

interface UseDatabaseState {
  isLoading: boolean;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: string | null;
  data: Partial<DataLoaderState>;
  loadTime: number | null;
}

interface UseDatabaseResult extends UseDatabaseState {
  // Actions
  refresh: () => Promise<void>;
  reconnect: () => Promise<boolean>;

  // Lookup helpers (O(1))
  lookups: Partial<EntityLookupMaps>;

  // Connection info
  health: ConnectionHealth | null;

  // Cache stats
  cacheStats: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  } | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDatabase(): UseDatabaseResult {
  const [state, setState] = useState<UseDatabaseState>({
    isLoading: true,
    isConnected: false,
    connectionState: 'disconnected',
    error: null,
    data: {},
    loadTime: null,
  });

  const [lookups, setLookups] = useState<Partial<EntityLookupMaps>>({});
  const [health, setHealth] = useState<ConnectionHealth | null>(null);

  const isInitialized = useRef(false);
  const realtimeCleanup = useRef<(() => void) | null>(null);

  // Initialize database service and load data
  const initialize = useCallback(async () => {
    if (!supabase) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: 'Supabase not configured',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Initialize database service
      await initializeDatabaseService();
      const db = getDatabaseService();

      // Load all data with optimized parallel loading
      const result = await loadAllDataOptimized(supabase);

      if (result.success) {
        // Create lookup maps for O(1) lookups
        const maps = createLookupMaps(result.state);
        setLookups(maps);

        setState({
          isLoading: false,
          isConnected: true,
          connectionState: 'connected',
          error: null,
          data: result.state,
          loadTime: result.timing.totalMs,
        });

        console.log(
          `[useDatabase] Loaded ${Object.keys(result.state).length} tables in ${result.timing.totalMs}ms`
        );

        // Log performance improvement
        const sequentialTime = Object.values(result.timing.tables).reduce((a, b) => a + b, 0);
        const savings = Math.round(((sequentialTime - result.timing.totalMs) / sequentialTime) * 100);
        console.log(
          `[useDatabase] Parallel loading saved ~${savings}% (${sequentialTime}ms → ${result.timing.totalMs}ms)`
        );
      } else {
        setState({
          isLoading: false,
          isConnected: false,
          connectionState: 'error',
          error: result.errors.join(', '),
          data: result.state,
          loadTime: result.timing.totalMs,
        });
      }

      // Set up real-time subscriptions
      realtimeCleanup.current = setupRealtimeSync((table, payload) => {
        handleRealtimeUpdate(table, payload);
      });

      // Subscribe to connection state changes
      db.connection.onStateChange((newState) => {
        setState((prev) => ({
          ...prev,
          connectionState: newState,
          isConnected: newState === 'connected',
        }));
      });

      // Update health periodically
      const healthInterval = setInterval(() => {
        setHealth(db.connection.getHealth());
      }, 10000);

      return () => {
        clearInterval(healthInterval);
      };
    } catch (err) {
      setState({
        isLoading: false,
        isConnected: false,
        connectionState: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
        data: {},
        loadTime: null,
      });
    }
  }, []);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback(
    (table: string, payload: RealtimePayload) => {
      console.log(`[useDatabase] Real-time update: ${table} ${payload.eventType}`);

      // Update local state based on the event
      // This is where you would update the specific entity in state
      // For now, we'll just trigger a refresh for simplicity
      // In production, you'd want to handle INSERT/UPDATE/DELETE individually

      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // Could update specific item without full refresh
        // For MVP, just mark as needing refresh
        console.log(`[useDatabase] Entity changed: ${table}`, payload.new);
      } else if (payload.eventType === 'DELETE') {
        console.log(`[useDatabase] Entity deleted: ${table}`, payload.old);
      }
    },
    []
  );

  // Refresh data
  const refresh = useCallback(async () => {
    if (!supabase) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await loadAllDataOptimized(supabase);

      if (result.success) {
        const maps = createLookupMaps(result.state);
        setLookups(maps);

        setState((prev) => ({
          ...prev,
          isLoading: false,
          data: result.state,
          loadTime: result.timing.totalMs,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.errors.join(', '),
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  // Reconnect
  const reconnect = useCallback(async (): Promise<boolean> => {
    const db = getDatabaseService();
    const success = await db.connection.reconnect();

    if (success) {
      await refresh();
    }

    return success;
  }, [refresh]);

  // Get cache stats
  const cacheStats = useMemo(() => {
    try {
      const db = getDatabaseService();
      const stats = db.query.getCacheStats();
      return {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate,
        size: stats.size,
      };
    } catch {
      return null;
    }
  }, [state.data]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      initialize();
    }

    return () => {
      // Cleanup real-time subscriptions
      if (realtimeCleanup.current) {
        realtimeCleanup.current();
      }
    };
  }, [initialize]);

  return {
    ...state,
    refresh,
    reconnect,
    lookups,
    health,
    cacheStats,
  };
}

// ============================================================================
// INDIVIDUAL ENTITY HOOKS
// ============================================================================

/**
 * Hook to get a specific entity by ID with O(1) lookup
 */
export function useEntity<T extends { id: string }>(
  entityType: keyof EntityLookupMaps,
  id: string | undefined | null
): T | undefined {
  const { lookups } = useDatabase();

  return useMemo(() => {
    if (!id || !lookups[entityType]) return undefined;
    return (lookups[entityType] as any).get(id) as T | undefined;
  }, [lookups, entityType, id]);
}

/**
 * Hook to get filtered entities
 */
export function useFilteredEntities<T extends { id: string }>(
  entityType: keyof EntityLookupMaps,
  predicate: (item: T) => boolean
): T[] {
  const { lookups } = useDatabase();

  return useMemo(() => {
    const map = lookups[entityType];
    if (!map) return [];
    return (map as any).filter(predicate) as T[];
  }, [lookups, entityType, predicate]);
}

/**
 * Hook for connection status
 */
export function useConnectionStatus(): {
  isConnected: boolean;
  state: ConnectionState;
  health: ConnectionHealth | null;
} {
  const { isConnected, connectionState, health } = useDatabase();

  return {
    isConnected,
    state: connectionState,
    health,
  };
}
