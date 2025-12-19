// ============================================================================
// CONNECTION MANAGER
// Handles connection health monitoring, reconnection, and state tracking
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';
import {
  ConnectionState,
  ConnectionHealth,
  ConnectionConfig,
  IConnectionManager,
} from './types';

// Default configuration
const DEFAULT_HEARTBEAT_INTERVAL = 30000; // 30 seconds
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_DELAY_MULTIPLIER = 2;
const DEFAULT_MAX_RECONNECT_DELAY = 60000; // 1 minute

type StateChangeCallback = (state: ConnectionState) => void;

export class ConnectionManager implements IConnectionManager {
  private readonly client: SupabaseClient | null;
  private readonly config: Required<ConnectionConfig>;

  private state: ConnectionState = 'disconnected';
  private lastConnected: number | null = null;
  private lastError: { code: string; message: string; isRetryable: boolean } | null = null;
  private reconnectAttempts = 0;
  private latency: number | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private stateCallbacks: Set<StateChangeCallback> = new Set();
  private isCheckingConnection = false;

  constructor(client: SupabaseClient | null, config: ConnectionConfig = {}) {
    this.client = client;
    this.config = {
      heartbeatInterval: config.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      reconnectDelayMultiplier: config.reconnectDelayMultiplier ?? DEFAULT_RECONNECT_DELAY_MULTIPLIER,
      maxReconnectDelay: config.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY,
    };

    // Start monitoring if client is available
    if (this.client) {
      this.startHeartbeat();
      this.setupNetworkListeners();
    }
  }

  /**
   * Get current connection health status
   */
  getHealth(): ConnectionHealth {
    return {
      state: this.state,
      lastConnected: this.lastConnected,
      lastError: this.lastError,
      reconnectAttempts: this.reconnectAttempts,
      latency: this.latency,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  /**
   * Check if the database connection is healthy
   */
  async checkConnection(): Promise<boolean> {
    if (!this.client) {
      this.setState('disconnected');
      return false;
    }

    if (this.isCheckingConnection) {
      return this.state === 'connected';
    }

    this.isCheckingConnection = true;

    try {
      const startTime = Date.now();

      // Use a lightweight query to check connection
      const { error } = await this.client
        .from('species')
        .select('id')
        .limit(1)
        .maybeSingle();

      const endTime = Date.now();
      this.latency = endTime - startTime;

      if (error) {
        // Check if it's a table not found error (expected if schema not set up)
        // This is still a successful connection
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          this.lastConnected = Date.now();
          this.reconnectAttempts = 0;
          this.lastError = null;
          this.setState('connected');
          return true;
        }

        this.lastError = {
          code: error.code ?? 'UNKNOWN',
          message: error.message ?? 'Connection check failed',
          isRetryable: true,
        };
        this.setState('error');
        return false;
      }

      this.lastConnected = Date.now();
      this.reconnectAttempts = 0;
      this.lastError = null;
      this.setState('connected');
      return true;
    } catch (err) {
      this.lastError = {
        code: 'CONNECTION_ERROR',
        message: err instanceof Error ? err.message : 'Connection check failed',
        isRetryable: true,
      };
      this.setState('error');
      return false;
    } finally {
      this.isCheckingConnection = false;
    }
  }

  /**
   * Attempt to reconnect to the database
   */
  async reconnect(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.warn('[ConnectionManager] Max reconnection attempts reached');
      this.setState('disconnected');
      return false;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;

    // Calculate delay with exponential backoff
    const delay = Math.min(
      1000 * Math.pow(this.config.reconnectDelayMultiplier, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    console.log(
      `[ConnectionManager] Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`
    );

    await this.delay(delay);

    const success = await this.checkConnection();

    if (success) {
      console.log('[ConnectionManager] Reconnection successful');
      this.reconnectAttempts = 0;
    }

    return success;
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Initial connection check
    this.checkConnection();

    // Periodic heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.checkConnection();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop the heartbeat interval
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Set up network event listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[ConnectionManager] Network online, checking connection...');
      this.reconnectAttempts = 0; // Reset on network recovery
      this.reconnect();
    });

    window.addEventListener('offline', () => {
      console.log('[ConnectionManager] Network offline');
      this.setState('disconnected');
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state !== 'connected') {
        console.log('[ConnectionManager] Page visible, checking connection...');
        this.checkConnection();
      }
    });
  }

  /**
   * Update state and notify subscribers
   */
  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;

    console.log(`[ConnectionManager] State changed: ${oldState} -> ${newState}`);

    // Notify all subscribers
    for (const callback of this.stateCallbacks) {
      try {
        callback(newState);
      } catch (err) {
        console.error('[ConnectionManager] Error in state change callback:', err);
      }
    }
  }

  /**
   * Delay for a specified duration
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopHeartbeat();
    this.stateCallbacks.clear();
  }
}

// Create factory function
export function createConnectionManager(
  client: SupabaseClient | null,
  config?: ConnectionConfig
): ConnectionManager {
  return new ConnectionManager(client, config);
}
