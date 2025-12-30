// ============================================================================
// PROCESS NOTIFICATION QUEUE
// Edge Function that processes pending notifications and sends emails/SMS
// Should be triggered by pg_cron every 5 minutes or via HTTP call
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase.ts';

// =============================================================================
// TYPES
// =============================================================================

interface QueuedNotification {
  id: string;
  user_id: string;
  event_category: string;
  title: string;
  body: string;
  related_table: string | null;
  related_id: string | null;
  priority: number;
  metadata: Record<string, unknown>;
  attempts: number;
}

interface UserChannel {
  channel_type: 'email' | 'sms' | 'push';
  contact_value: string;
  is_enabled: boolean;
  is_verified: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

interface EventPreference {
  event_category: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  enabled: boolean;
}

interface ProcessingResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

async function sendEmail(
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string; provider?: string }> {
  // Try Resend first
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    try {
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
      const fromName = Deno.env.get('FROM_NAME') || 'MycoLab';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      if (response.ok) {
        return { success: true, provider: 'Resend' };
      }

      const errorData = await response.json();
      console.error('Resend error:', errorData);
    } catch (err) {
      console.error('Resend exception:', err);
    }
  }

  // Try SendGrid as fallback
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  if (sendgridKey) {
    try {
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@mycolab.app';
      const fromName = Deno.env.get('FROM_NAME') || 'MycoLab';

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: fromName },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        return { success: true, provider: 'SendGrid' };
      }

      const errorText = await response.text();
      console.error('SendGrid error:', errorText);
    } catch (err) {
      console.error('SendGrid exception:', err);
    }
  }

  // No providers configured
  if (!resendKey && !sendgridKey) {
    return {
      success: false,
      error: 'No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY.'
    };
  }

  return { success: false, error: 'Email delivery failed with all providers' };
}

// =============================================================================
// QUIET HOURS CHECK
// =============================================================================

function isInQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string
): boolean {
  if (!quietStart || !quietEnd) return false;

  try {
    // Get current time in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentTime = formatter.format(now);

    // Parse times as HH:MM
    const current = currentTime.replace(':', '');
    const start = quietStart.replace(':', '');
    const end = quietEnd.replace(':', '');

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return current >= start || current < end;
    }

    return current >= start && current < end;
  } catch {
    return false; // If timezone is invalid, don't block
  }
}

// =============================================================================
// HTML EMAIL TEMPLATE
// =============================================================================

function buildHtmlEmail(title: string, body: string, metadata: Record<string, unknown>): string {
  const entityName = metadata.culture_label || metadata.grow_name || metadata.item_name || '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🍄 MycoLab</h1>
      </div>
      <div style="background: #18181b; padding: 24px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
        <h2 style="color: #10b981; margin-top: 0;">${title}</h2>
        <p style="line-height: 1.6; white-space: pre-wrap;">${body}</p>
        ${entityName ? `<p style="color: #a1a1aa; font-size: 14px; margin-top: 16px;">Related: ${entityName}</p>` : ''}
      </div>
      <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 16px;">
        This notification was sent from MycoLab. Manage your notification preferences in Settings.
      </p>
    </div>
  `;
}

// =============================================================================
// MAIN PROCESSING LOGIC
// =============================================================================

async function processQueue(): Promise<ProcessingResult> {
  const supabase = createSupabaseAdmin();
  const result: ProcessingResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Fetch pending notifications (limit to avoid timeout)
  const { data: notifications, error: fetchError } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .gt('expires_at', new Date().toISOString())
    .lt('attempts', 3)
    .order('priority', { ascending: true })
    .order('scheduled_for', { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error('Failed to fetch notifications:', fetchError);
    result.errors.push(`Fetch error: ${fetchError.message}`);
    return result;
  }

  if (!notifications || notifications.length === 0) {
    console.log('No pending notifications to process');
    return result;
  }

  console.log(`Processing ${notifications.length} pending notifications`);

  // Group notifications by user for efficiency
  const userNotifications = new Map<string, QueuedNotification[]>();
  for (const notif of notifications as QueuedNotification[]) {
    const existing = userNotifications.get(notif.user_id) || [];
    existing.push(notif);
    userNotifications.set(notif.user_id, existing);
  }

  // Process each user's notifications
  for (const [userId, userNotifs] of userNotifications) {
    // Get user's email channel
    const { data: channels } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('channel_type', 'email')
      .eq('is_enabled', true)
      .eq('is_verified', true)
      .single();

    const emailChannel = channels as UserChannel | null;

    // Get user's event preferences
    const { data: preferences } = await supabase
      .from('notification_event_preferences')
      .select('*')
      .eq('user_id', userId);

    const prefMap = new Map<string, EventPreference>();
    if (preferences) {
      for (const pref of preferences as EventPreference[]) {
        prefMap.set(pref.event_category, pref);
      }
    }

    // Process each notification for this user
    for (const notif of userNotifs) {
      result.processed++;

      // Check if user has email configured
      if (!emailChannel) {
        // No verified email, mark as skipped (will expire naturally)
        await supabase
          .from('notification_queue')
          .update({
            status: 'cancelled',
            last_error: 'No verified email channel configured',
            updated_at: new Date().toISOString(),
          })
          .eq('id', notif.id);
        result.skipped++;
        continue;
      }

      // Check event preferences
      const eventPref = prefMap.get(notif.event_category);
      if (eventPref && (!eventPref.enabled || !eventPref.email_enabled)) {
        // User has disabled this notification type
        await supabase
          .from('notification_queue')
          .update({
            status: 'cancelled',
            last_error: 'User disabled email for this event type',
            updated_at: new Date().toISOString(),
          })
          .eq('id', notif.id);
        result.skipped++;
        continue;
      }

      // Check quiet hours
      if (isInQuietHours(
        emailChannel.quiet_hours_start,
        emailChannel.quiet_hours_end,
        emailChannel.timezone
      )) {
        // In quiet hours, skip for now (will be retried later)
        console.log(`Skipping notification ${notif.id} - quiet hours`);
        result.skipped++;
        continue;
      }

      // Mark as queued (in progress)
      await supabase
        .from('notification_queue')
        .update({
          status: 'queued',
          attempts: notif.attempts + 1,
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', notif.id);

      // Send the email
      const htmlBody = buildHtmlEmail(notif.title, notif.body, notif.metadata || {});
      const emailResult = await sendEmail(
        emailChannel.contact_value,
        `[MycoLab] ${notif.title}`,
        notif.body,
        htmlBody
      );

      if (emailResult.success) {
        // Mark as sent
        await supabase
          .from('notification_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', notif.id);

        // Log to delivery log
        await supabase
          .from('notification_delivery_log')
          .insert({
            notification_id: notif.id,
            user_id: userId,
            channel_type: 'email',
            recipient: emailChannel.contact_value,
            status: 'delivered',
            provider: emailResult.provider,
          });

        result.sent++;
        console.log(`Sent notification ${notif.id} to ${emailChannel.contact_value}`);
      } else {
        // Mark as failed (or pending if retries remain)
        const newStatus = notif.attempts + 1 >= 3 ? 'failed' : 'pending';
        await supabase
          .from('notification_queue')
          .update({
            status: newStatus,
            last_error: emailResult.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', notif.id);

        // Log failure
        await supabase
          .from('notification_delivery_log')
          .insert({
            notification_id: notif.id,
            user_id: userId,
            channel_type: 'email',
            recipient: emailChannel.contact_value,
            status: 'failed',
            error_message: emailResult.error,
          });

        result.failed++;
        result.errors.push(`Notification ${notif.id}: ${emailResult.error}`);
        console.error(`Failed to send notification ${notif.id}:`, emailResult.error);
      }
    }
  }

  return result;
}

// =============================================================================
// HTTP HANDLER
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Allow both GET and POST (GET for cron/webhook, POST for manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Optional: Verify authorization for manual triggers
  // For cron jobs, you might use a secret header
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');

  // If CRON_SECRET is set, require it for access
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow service role key
    const supabase = createSupabaseAdmin();
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      // Check if user is admin
      if (error || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify admin status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_admin) {
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    console.log('Starting notification queue processing...');
    const startTime = Date.now();

    const result = await processQueue();

    const duration = Date.now() - startTime;
    console.log(`Queue processing complete in ${duration}ms:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
