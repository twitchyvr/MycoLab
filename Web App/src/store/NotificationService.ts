// ============================================================================
// NOTIFICATION SERVICE
// Handles email/SMS notification delivery via Supabase Edge Functions
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationCategory,
  NotificationChannelType,
  NotificationDeliveryStatus,
  NotificationDeliveryLog,
  NotificationEventPreference,
  NotificationChannel,
  NotificationPriority,
  AppSettings,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationPayload {
  category: NotificationCategory;
  title: string;
  message: string;
  priority?: NotificationPriority;
  entityType?: 'culture' | 'grow' | 'inventory' | 'recipe';
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryResult {
  success: boolean;
  channelType: NotificationChannelType;
  messageId?: string;
  error?: string;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export class NotificationService {
  private supabase: SupabaseClient | null = null;
  private userId: string | null = null;

  constructor() {
    this.initializeSupabase();
  }

  private initializeSupabase() {
    const url = localStorage.getItem('mycolab-supabase-url');
    const key = localStorage.getItem('mycolab-supabase-key');

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  // ============================================================================
  // SEND NOTIFICATION
  // Main entry point for sending notifications
  // ============================================================================

  async sendNotification(payload: NotificationPayload, settings: AppSettings): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];

    if (!this.userId || !this.supabase) {
      console.warn('NotificationService: No user or Supabase connection');
      return results;
    }

    // Check if we're in quiet hours
    if (this.isInQuietHours(settings)) {
      console.log('NotificationService: In quiet hours, skipping external notifications');
      return results;
    }

    // Get user's notification preferences for this event category
    const preferences = await this.getEventPreferences(payload.category);

    // Send email if enabled
    if (settings.emailNotificationsEnabled && preferences?.emailEnabled) {
      const emailResult = await this.sendEmail(payload, settings);
      results.push(emailResult);
    }

    // Send SMS if enabled and meets urgency threshold
    if (settings.smsNotificationsEnabled && preferences?.smsEnabled) {
      const shouldSendSms = !preferences.smsUrgentOnly ||
        payload.priority === 'urgent' ||
        payload.priority === 'high';

      if (shouldSendSms) {
        const smsResult = await this.sendSms(payload, settings);
        results.push(smsResult);
      }
    }

    // Log all delivery attempts
    for (const result of results) {
      await this.logDelivery(payload, result);
    }

    return results;
  }

  // ============================================================================
  // EMAIL DELIVERY
  // ============================================================================

  private async sendEmail(payload: NotificationPayload, settings: AppSettings): Promise<DeliveryResult> {
    const email = settings.notificationEmail || (await this.getUserEmail());

    if (!email) {
      return {
        success: false,
        channelType: 'email',
        error: 'No email address configured',
      };
    }

    try {
      // Call Supabase Edge Function for email delivery
      // This function should be deployed to handle actual email sending via SendGrid/Resend/etc.
      const { data, error } = await this.supabase!.functions.invoke('send-notification-email', {
        body: {
          to: email,
          subject: payload.title,
          body: payload.message,
          category: payload.category,
          priority: payload.priority,
          entityType: payload.entityType,
          entityId: payload.entityId,
          entityName: payload.entityName,
          metadata: payload.metadata,
        },
      });

      if (error) {
        return {
          success: false,
          channelType: 'email',
          error: error.message,
        };
      }

      return {
        success: true,
        channelType: 'email',
        messageId: data?.messageId,
      };
    } catch (err) {
      return {
        success: false,
        channelType: 'email',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // SMS DELIVERY
  // ============================================================================

  private async sendSms(payload: NotificationPayload, settings: AppSettings): Promise<DeliveryResult> {
    const phoneNumber = settings.phoneNumber;

    if (!phoneNumber) {
      return {
        success: false,
        channelType: 'sms',
        error: 'No phone number configured',
      };
    }

    if (!settings.phoneVerified) {
      return {
        success: false,
        channelType: 'sms',
        error: 'Phone number not verified',
      };
    }

    try {
      // Call Supabase Edge Function for SMS delivery
      // This function should be deployed to handle actual SMS sending via Twilio/etc.
      const { data, error } = await this.supabase!.functions.invoke('send-notification-sms', {
        body: {
          to: phoneNumber,
          message: `[MycoLab] ${payload.title}: ${payload.message}`,
          category: payload.category,
          priority: payload.priority,
          entityType: payload.entityType,
          entityId: payload.entityId,
        },
      });

      if (error) {
        return {
          success: false,
          channelType: 'sms',
          error: error.message,
        };
      }

      return {
        success: true,
        channelType: 'sms',
        messageId: data?.messageId,
      };
    } catch (err) {
      return {
        success: false,
        channelType: 'sms',
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private isInQuietHours(settings: AppSettings): boolean {
    if (!settings.quietHoursStart || !settings.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  private async getEventPreferences(category: NotificationCategory): Promise<NotificationEventPreference | null> {
    if (!this.supabase || !this.userId) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('notification_event_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .eq('event_category', category)
      .single();

    if (error || !data) {
      // Return default preferences if none set
      return {
        id: '',
        userId: this.userId,
        eventCategory: category,
        emailEnabled: true,
        smsEnabled: category === 'contamination', // SMS only for urgent by default
        pushEnabled: true,
        priority: 'normal',
        smsUrgentOnly: true,
        batchIntervalMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return {
      id: data.id,
      userId: data.user_id,
      eventCategory: data.event_category,
      emailEnabled: data.email_enabled,
      smsEnabled: data.sms_enabled,
      pushEnabled: data.push_enabled,
      priority: data.priority,
      smsUrgentOnly: data.sms_urgent_only,
      batchIntervalMinutes: data.batch_interval_minutes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private async getUserEmail(): Promise<string | null> {
    if (!this.supabase) {
      return null;
    }

    const { data: { user } } = await this.supabase.auth.getUser();
    return user?.email || null;
  }

  private async logDelivery(payload: NotificationPayload, result: DeliveryResult): Promise<void> {
    if (!this.supabase || !this.userId) {
      return;
    }

    const status: NotificationDeliveryStatus = result.success ? 'sent' : 'failed';

    await this.supabase.from('notification_delivery_log').insert({
      user_id: this.userId,
      channel_type: result.channelType,
      event_category: payload.category,
      title: payload.title,
      message: payload.message,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      entity_name: payload.entityName,
      status,
      sent_at: result.success ? new Date().toISOString() : null,
      error_code: result.error ? 'DELIVERY_FAILED' : null,
      error_message: result.error,
      provider_message_id: result.messageId,
      metadata: payload.metadata,
    });
  }

  // ============================================================================
  // DELIVERY HISTORY
  // ============================================================================

  async getDeliveryHistory(limit = 50): Promise<NotificationDeliveryLog[]> {
    if (!this.supabase || !this.userId) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('notification_delivery_log')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(row => ({
      id: row.id,
      userId: row.user_id,
      channelType: row.channel_type,
      eventCategory: row.event_category,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      status: row.status,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      errorCode: row.error_code,
      errorMessage: row.error_message,
      retryCount: row.retry_count,
      nextRetryAt: row.next_retry_at ? new Date(row.next_retry_at) : undefined,
      provider: row.provider,
      providerMessageId: row.provider_message_id,
      costCents: row.cost_cents,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    }));
  }

  // ============================================================================
  // VERIFICATION METHODS
  // ============================================================================

  async sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'No Supabase connection' };
    }

    try {
      const { error } = await this.supabase.functions.invoke('send-verification-email', {
        body: { email, userId: this.userId },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async sendSmsVerification(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'No Supabase connection' };
    }

    try {
      const { error } = await this.supabase.functions.invoke('send-verification-sms', {
        body: { phoneNumber, userId: this.userId },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async verifyCode(type: 'email' | 'sms', code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'No Supabase connection' };
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('verify-notification-channel', {
        body: { type, code, userId: this.userId },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: data?.verified === true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// ============================================================================
// CONVENIENCE FUNCTIONS FOR TRIGGERING NOTIFICATIONS
// ============================================================================

export async function notifyContamination(
  growOrCultureName: string,
  entityType: 'culture' | 'grow',
  entityId: string,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'contamination',
      title: 'Contamination Detected',
      message: `Contamination has been detected in ${growOrCultureName}. Immediate action recommended.`,
      priority: 'urgent',
      entityType,
      entityId,
      entityName: growOrCultureName,
    },
    settings
  );
}

export async function notifyHarvestReady(
  growName: string,
  growId: string,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'harvest_ready',
      title: 'Harvest Ready',
      message: `${growName} is ready for harvest!`,
      priority: 'high',
      entityType: 'grow',
      entityId: growId,
      entityName: growName,
    },
    settings
  );
}

export async function notifyStageTransition(
  growName: string,
  growId: string,
  fromStage: string,
  toStage: string,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'stage_transition',
      title: 'Stage Transition Due',
      message: `${growName} is ready to advance from ${fromStage} to ${toStage}.`,
      priority: 'normal',
      entityType: 'grow',
      entityId: growId,
      entityName: growName,
      metadata: { fromStage, toStage },
    },
    settings
  );
}

export async function notifyLowInventory(
  itemName: string,
  itemId: string,
  currentQty: number,
  reorderPoint: number,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'low_inventory',
      title: 'Low Inventory Alert',
      message: `${itemName} is running low (${currentQty} remaining, reorder point: ${reorderPoint}).`,
      priority: 'normal',
      entityType: 'inventory',
      entityId: itemId,
      entityName: itemName,
      metadata: { currentQty, reorderPoint },
    },
    settings
  );
}

export async function notifyCultureExpiring(
  cultureName: string,
  cultureId: string,
  daysUntilExpiry: number,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'culture_expiring',
      title: 'Culture Expiring Soon',
      message: `${cultureName} will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`,
      priority: daysUntilExpiry <= 3 ? 'high' : 'normal',
      entityType: 'culture',
      entityId: cultureId,
      entityName: cultureName,
      metadata: { daysUntilExpiry },
    },
    settings
  );
}

export async function notifyLcAge(
  cultureName: string,
  cultureId: string,
  ageInDays: number,
  settings: AppSettings
): Promise<DeliveryResult[]> {
  return notificationService.sendNotification(
    {
      category: 'lc_age',
      title: 'LC Age Warning',
      message: `${cultureName} is ${ageInDays} days old. Consider transferring or testing viability.`,
      priority: ageInDays > 90 ? 'high' : 'normal',
      entityType: 'culture',
      entityId: cultureId,
      entityName: cultureName,
      metadata: { ageInDays },
    },
    settings
  );
}
