// ============================================================================
// REALTIME MANAGER
// Handles real-time subscriptions for cross-tab and multi-user sync
// ============================================================================

import { SupabaseClient, RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  RealtimeEventType,
  RealtimeSubscription,
  RealtimePayload,
  RealtimeConfig,
  IRealtimeManager,
} from './types';

// Default configuration
const DEFAULT_EVENT_DEBOUNCE = 100; // 100ms
const DEFAULT_MAX_SUBSCRIPTIONS_PER_TABLE = 10;

type SubscriptionCallback = (payload: RealtimePayload) => void;

export class RealtimeManager implements IRealtimeManager {
  private readonly client: SupabaseClient | null;
  private readonly config: Required<RealtimeConfig>;
  private readonly subscriptions: Map<string, RealtimeSubscription> = new Map();
  private readonly channels: Map<string, RealtimeChannel> = new Map();
  private readonly debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly pendingPayloads: Map<string, RealtimePayload[]> = new Map();

  constructor(client: SupabaseClient | null, config: RealtimeConfig = {}) {
    this.client = client;
    this.config = {
      autoReconnect: config.autoReconnect ?? true,
      eventDebounce: config.eventDebounce ?? DEFAULT_EVENT_DEBOUNCE,
      maxSubscriptionsPerTable: config.maxSubscriptionsPerTable ?? DEFAULT_MAX_SUBSCRIPTIONS_PER_TABLE,
    };
  }

  /**
   * Subscribe to real-time changes on a table
   */
  subscribe(
    table: string,
    event: RealtimeEventType,
    callback: SubscriptionCallback,
    filter?: string
  ): string {
    if (!this.client) {
      console.warn('[RealtimeManager] Cannot subscribe: Supabase client not configured');
      return '';
    }

    // Check subscription limit for this table
    const tableSubscriptions = this.getSubscriptionsForTable(table);
    if (tableSubscriptions.length >= this.config.maxSubscriptionsPerTable) {
      console.warn(
        `[RealtimeManager] Max subscriptions (${this.config.maxSubscriptionsPerTable}) reached for table: ${table}`
      );
      return '';
    }

    // Generate subscription ID
    const subscriptionId = `${table}-${event}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription record
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      table,
      event,
      filter,
      callback,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Get or create channel for this table
    const channelKey = filter ? `${table}:${filter}` : table;
    let channel = this.channels.get(channelKey);

    if (!channel) {
      channel = this.createChannel(table, filter);
      this.channels.set(channelKey, channel);
    }

    // The channel is already set up with the handler, just mark subscription as active
    subscription.status = 'active';

    console.log(`[RealtimeManager] Subscribed to ${table}:${event} (${subscriptionId})`);

    return subscriptionId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    subscription.status = 'closed';
    this.subscriptions.delete(subscriptionId);

    console.log(`[RealtimeManager] Unsubscribed from ${subscription.table}:${subscription.event}`);

    // Check if we should clean up the channel
    this.cleanupChannelIfEmpty(subscription.table, subscription.filter);
  }

  /**
   * Unsubscribe from all subscriptions, optionally for a specific table
   */
  unsubscribeAll(table?: string): void {
    const toRemove: string[] = [];

    for (const [id, sub] of this.subscriptions.entries()) {
      if (!table || sub.table === table) {
        sub.status = 'closed';
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.subscriptions.delete(id);
    }

    if (table) {
      // Remove all channels for this table
      for (const [key, channel] of this.channels.entries()) {
        if (key === table || key.startsWith(`${table}:`)) {
          channel.unsubscribe();
          this.channels.delete(key);
        }
      }
      console.log(`[RealtimeManager] Unsubscribed from all ${table} subscriptions`);
    } else {
      // Remove all channels
      for (const channel of this.channels.values()) {
        channel.unsubscribe();
      }
      this.channels.clear();
      console.log('[RealtimeManager] Unsubscribed from all subscriptions');
    }
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscriptions for a specific table
   */
  private getSubscriptionsForTable(table: string): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.table === table);
  }

  /**
   * Create a Supabase channel for a table
   */
  private createChannel(table: string, filter?: string): RealtimeChannel {
    const channelName = filter ? `${table}:${filter}` : `public:${table}`;

    // Build the channel configuration
    const channelConfig = {
      event: '*' as const,
      schema: 'public',
      table,
      filter: filter || undefined,
    };

    const channel = this.client!.channel(channelName)
      .on(
        'postgres_changes',
        channelConfig as any,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          this.handlePayload(table, payload);
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeManager] Channel ${channelName} status: ${status}`);

        if (status === 'SUBSCRIBED') {
          // Update all subscriptions for this channel
          for (const sub of this.getSubscriptionsForTable(table)) {
            if (!filter || sub.filter === filter) {
              sub.status = 'active';
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Mark subscriptions as error
          for (const sub of this.getSubscriptionsForTable(table)) {
            if (!filter || sub.filter === filter) {
              sub.status = 'error';
            }
          }

          // Attempt to reconnect if configured
          if (this.config.autoReconnect) {
            setTimeout(() => {
              console.log(`[RealtimeManager] Attempting to reconnect to ${channelName}`);
              channel.subscribe();
            }, 5000);
          }
        }
      });

    return channel;
  }

  /**
   * Handle incoming realtime payload
   */
  private handlePayload(
    table: string,
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ): void {
    const eventType = payload.eventType as RealtimeEventType;

    const realtimePayload: RealtimePayload = {
      eventType,
      table,
      schema: payload.schema,
      new: payload.new as Record<string, unknown> | null,
      old: payload.old as Record<string, unknown> | null,
      commitTimestamp: payload.commit_timestamp,
    };

    // Apply debouncing
    if (this.config.eventDebounce > 0) {
      this.debouncePayload(table, realtimePayload);
    } else {
      this.dispatchPayload(table, realtimePayload);
    }
  }

  /**
   * Debounce rapid events
   */
  private debouncePayload(table: string, payload: RealtimePayload): void {
    const debounceKey = `${table}:${payload.eventType}`;

    // Add to pending payloads
    if (!this.pendingPayloads.has(debounceKey)) {
      this.pendingPayloads.set(debounceKey, []);
    }
    this.pendingPayloads.get(debounceKey)!.push(payload);

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const payloads = this.pendingPayloads.get(debounceKey) || [];
      this.pendingPayloads.delete(debounceKey);
      this.debounceTimers.delete(debounceKey);

      // Dispatch the most recent payload (or combine them if needed)
      if (payloads.length > 0) {
        // For now, dispatch the last payload
        // Could be extended to batch multiple updates
        this.dispatchPayload(table, payloads[payloads.length - 1]);
      }
    }, this.config.eventDebounce);

    this.debounceTimers.set(debounceKey, timer);
  }

  /**
   * Dispatch payload to all matching subscribers
   */
  private dispatchPayload(table: string, payload: RealtimePayload): void {
    for (const subscription of this.subscriptions.values()) {
      if (
        subscription.table === table &&
        subscription.status === 'active' &&
        (subscription.event === '*' || subscription.event === payload.eventType)
      ) {
        try {
          subscription.callback(payload);
        } catch (err) {
          console.error(
            `[RealtimeManager] Error in subscription callback (${subscription.id}):`,
            err
          );
        }
      }
    }
  }

  /**
   * Clean up channel if no more subscriptions
   */
  private cleanupChannelIfEmpty(table: string, filter?: string): void {
    const channelKey = filter ? `${table}:${filter}` : table;
    const remainingSubs = this.getSubscriptionsForTable(table).filter(
      (s) => s.filter === filter && s.status !== 'closed'
    );

    if (remainingSubs.length === 0) {
      const channel = this.channels.get(channelKey);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelKey);
        console.log(`[RealtimeManager] Cleaned up channel: ${channelKey}`);
      }
    }
  }

  /**
   * Get the count of active channels
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pendingPayloads.clear();

    // Unsubscribe from all channels
    this.unsubscribeAll();
  }
}

// Create factory function
export function createRealtimeManager(
  client: SupabaseClient | null,
  config?: RealtimeConfig
): RealtimeManager {
  return new RealtimeManager(client, config);
}
