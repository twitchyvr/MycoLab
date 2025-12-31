// ============================================================================
// ADMIN NOTIFICATION CONFIG - Configure email/SMS notification services
// Uses Netlify Functions for email (Resend or SendGrid) and SMS (Twilio) delivery
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

// Icons
const Icons = {
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Mail: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  ExternalLink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Play: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

interface ServiceStatus {
  configured: boolean;
  provider?: string;
  lastTest?: string;
  error?: string;
}

interface CronStatus {
  pgCronEnabled: boolean;
  pgNetEnabled?: boolean;
  cronJobsConfigured: boolean;
  cronJobs: Array<{ name: string; schedule: string; active: boolean }>;
  pendingNotifications: number;
  sentToday?: number;
  failedToday?: number;
  lastNotificationSent: string | null;
  supabaseConfigured: boolean;
  error?: string;
}

interface AdminNotificationConfigProps {
  isConnected: boolean;
}

export const AdminNotificationConfig: React.FC<AdminNotificationConfigProps> = ({ isConnected }) => {
  const { isAdmin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Service status
  const [emailStatus, setEmailStatus] = useState<ServiceStatus>({ configured: false });
  const [smsStatus, setSmsStatus] = useState<ServiceStatus>({ configured: false });
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Test sending
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState<'email' | 'sms' | null>(null);

  // pg_cron status
  const [cronStatus, setCronStatus] = useState<CronStatus>({
    pgCronEnabled: false,
    pgNetEnabled: false,
    cronJobsConfigured: false,
    cronJobs: [],
    pendingNotifications: 0,
    sentToday: 0,
    failedToday: 0,
    lastNotificationSent: null,
    supabaseConfigured: false,
  });
  const [checkingCron, setCheckingCron] = useState(false);
  const [settingUpCron, setSettingUpCron] = useState(false);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendEmailsResult, setSendEmailsResult] = useState<string | null>(null);

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check service status via Netlify Functions
  const checkServiceStatus = async () => {
    setCheckingStatus(true);
    setError(null);

    try {
      // Check email service
      try {
        const emailResponse = await fetch('/api/check-notification-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: 'email' }),
        });
        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          setEmailStatus({ configured: false, error: emailData.error });
        } else {
          setEmailStatus({
            configured: emailData.configured || false,
            provider: emailData.provider,
          });
        }
      } catch (e: any) {
        setEmailStatus({ configured: false, error: 'Could not reach notification service' });
      }

      // Check SMS service
      try {
        const smsResponse = await fetch('/api/check-notification-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service: 'sms' }),
        });
        const smsData = await smsResponse.json();

        if (!smsResponse.ok) {
          setSmsStatus({ configured: false, error: smsData.error });
        } else {
          setSmsStatus({
            configured: smsData.configured || false,
            provider: smsData.provider,
          });
        }
      } catch (e: any) {
        setSmsStatus({ configured: false, error: 'Could not reach notification service' });
      }
    } catch (err: any) {
      setError(`Failed to check service status: ${err.message}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check status on mount
  useEffect(() => {
    if (isAdmin) {
      checkServiceStatus();
    }
  }, [isAdmin]);

  // Send test notification via Netlify Functions
  const sendTestNotification = async (type: 'email' | 'sms') => {
    const recipient = type === 'email' ? testEmail : testPhone;
    if (!recipient) {
      setError(`Please enter a ${type === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    setSendingTest(type);
    setError(null);

    try {
      const response = await fetch('/api/send-test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          recipient,
          message: `This is a test notification from MycoLab sent at ${new Date().toLocaleString()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to send test ${type}`);
      } else if (data.success) {
        setSuccess(`Test ${type} sent successfully!`);
        if (type === 'email') setTestEmail('');
        else setTestPhone('');
      } else {
        setError(data.error || `Failed to send test ${type}`);
      }
    } catch (err: any) {
      setError(`Failed to send test ${type}: ${err.message}`);
    } finally {
      setSendingTest(null);
    }
  };

  // Check pg_cron status via Netlify Function
  const checkCronStatus = async () => {
    setCheckingCron(true);
    setError(null);

    try {
      const response = await fetch('/api/pg-cron-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCronStatus(prev => ({ ...prev, error: data.error || 'Failed to check status' }));
      } else {
        // Handle both old format and new format (with queue stats)
        const queue = data.queue || {};
        setCronStatus({
          pgCronEnabled: data.pgCronEnabled || false,
          pgNetEnabled: data.pgNetEnabled || false,
          cronJobsConfigured: data.cronJobsConfigured || false,
          cronJobs: data.cronJobs || [],
          pendingNotifications: queue.pending ?? data.pendingNotifications ?? 0,
          sentToday: queue.sentToday ?? 0,
          failedToday: queue.failedToday ?? 0,
          lastNotificationSent: queue.lastSent ?? data.lastNotificationSent,
          supabaseConfigured: data.supabaseConfigured || false,
          error: data.error,
        });
      }
    } catch (err: any) {
      setCronStatus(prev => ({ ...prev, error: `Failed to check cron status: ${err.message}` }));
    } finally {
      setCheckingCron(false);
    }
  };

  // Manually trigger the email queue processor via Edge Function
  const triggerEmailQueueProcessor = async () => {
    setSendingEmails(true);
    setError(null);
    setSendEmailsResult(null);

    try {
      // Call the Edge Function directly
      const supabaseUrl = localStorage.getItem('mycolab-supabase-url');
      const supabaseKey = localStorage.getItem('mycolab-supabase-key');

      if (!supabaseUrl) {
        setError('Supabase URL not configured');
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/process-notification-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to process queue');
      } else {
        setSendEmailsResult(
          `Processed: ${data.processed || 0}, Sent: ${data.sent || 0}, ` +
          `Failed: ${data.failed || 0}, Skipped: ${data.skipped || 0} ` +
          `(${data.duration_ms || 0}ms)`
        );
        setSuccess('Email queue processed!');
        // Refresh status
        await checkCronStatus();
      }
    } catch (err: any) {
      setError(`Failed to process email queue: ${err.message}`);
    } finally {
      setSendingEmails(false);
    }
  };

  // Set up cron jobs
  const setupCronJobs = async () => {
    setSettingUpCron(true);
    setError(null);

    try {
      const response = await fetch('/api/pg-cron-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to set up cron jobs');
        if (data.hint) {
          setError(`${data.error}. ${data.hint}`);
        }
      } else {
        setSuccess(data.message || 'Cron jobs configured successfully!');
        // Refresh status
        await checkCronStatus();
      }
    } catch (err: any) {
      setError(`Failed to set up cron jobs: ${err.message}`);
    } finally {
      setSettingUpCron(false);
    }
  };

  // Manually trigger notification check
  const triggerNotificationCheck = async () => {
    setTriggeringCheck(true);
    setError(null);
    setTriggerResult(null);

    try {
      const response = await fetch('/api/pg-cron-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to trigger notification check');
      } else {
        const total = data.totalNotificationsQueued || 0;
        const checks = data.checksRun || [];
        setTriggerResult(
          `Checked: ${checks.map((c: { name: string; notificationsQueued: number }) =>
            `${c.name} (${c.notificationsQueued} queued)`
          ).join(', ')}. Total: ${total} notifications queued.`
        );
        setSuccess('Notification check completed!');
        // Refresh status
        await checkCronStatus();
      }
    } catch (err: any) {
      setError(`Failed to trigger notification check: ${err.message}`);
    } finally {
      setTriggeringCheck(false);
    }
  };

  // Check cron status on mount (if connected)
  useEffect(() => {
    if (isAdmin && isConnected) {
      checkCronStatus();
    }
  }, [isAdmin, isConnected]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-zinc-500">
        You do not have permission to access this section.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-950/30 border border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl"><Icons.Settings /></span>
          <div>
            <p className="text-sm font-medium text-blue-300">Email & SMS Service Configuration</p>
            <p className="text-sm text-zinc-400 mt-1">
              Configure notification services using <strong>Netlify Functions</strong>. Set environment variables in your Netlify dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-300 flex items-start gap-3">
          <Icons.AlertCircle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4 text-emerald-300 flex items-start gap-3">
          <Icons.CheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Service Status Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Email Service */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${emailStatus.configured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                <Icons.Mail />
              </div>
              <div>
                <h3 className="text-white font-medium">Email Service</h3>
                <p className="text-xs text-zinc-500">
                  {emailStatus.provider || 'Resend / SendGrid'}
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              emailStatus.configured
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              {emailStatus.configured ? 'Configured' : 'Not Configured'}
            </div>
          </div>

          {emailStatus.error && (
            <p className="text-xs text-red-400 mb-3">{emailStatus.error}</p>
          )}

          {emailStatus.configured && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Send Test Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={() => sendTestNotification('email')}
                    disabled={sendingTest === 'email' || !testEmail}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    {sendingTest === 'email' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Icons.Send />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {!emailStatus.configured && (
            <div className="text-sm text-zinc-400 space-y-2">
              <p>To enable email notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <strong>Netlify Dashboard</strong> → Site Settings → Environment Variables</li>
                <li>Add: <code className="bg-zinc-800 px-1 rounded">RESEND_API_KEY</code> or <code className="bg-zinc-800 px-1 rounded">SENDGRID_API_KEY</code></li>
                <li>Optional: <code className="bg-zinc-800 px-1 rounded">FROM_EMAIL</code>, <code className="bg-zinc-800 px-1 rounded">FROM_NAME</code></li>
                <li>Redeploy your site</li>
              </ol>
              <div className="flex flex-wrap gap-3 mt-2">
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Get Resend API Key <Icons.ExternalLink />
                </a>
                <a
                  href="https://sendgrid.com/en-us/solutions/email-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  Get SendGrid API Key <Icons.ExternalLink />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* SMS Service - Coming Soon */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-500">
                <Icons.Phone />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-zinc-400 font-medium">SMS Service</h3>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Twilio</p>
              </div>
            </div>
            <div className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-500">
              Unavailable
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg">📱</span>
              <div>
                <p className="text-sm text-amber-300 font-medium">SMS Notifications Coming Soon</p>
                <p className="text-xs text-zinc-400 mt-1">
                  We're working with our telephony provider to enable SMS notifications.
                  This feature will allow urgent alerts (contamination, critical failures) to be sent directly to your phone.
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  In the meantime, email notifications are fully functional and recommended for all alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* pg_cron Background Notifications */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              cronStatus.pgCronEnabled && cronStatus.cronJobsConfigured
                ? 'bg-emerald-500/20 text-emerald-400'
                : cronStatus.pgCronEnabled
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-zinc-800 text-zinc-500'
            }`}>
              <Icons.Clock />
            </div>
            <div>
              <h3 className="text-white font-medium">Background Notifications</h3>
              <p className="text-xs text-zinc-500">
                pg_cron scheduled jobs for email alerts
              </p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            cronStatus.pgCronEnabled && cronStatus.cronJobsConfigured
              ? 'bg-emerald-500/20 text-emerald-400'
              : cronStatus.pgCronEnabled
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-zinc-800 text-zinc-500'
          }`}>
            {cronStatus.pgCronEnabled && cronStatus.cronJobsConfigured
              ? 'Active'
              : cronStatus.pgCronEnabled
                ? 'Extension Enabled'
                : 'Not Configured'}
          </div>
        </div>

        {cronStatus.error && (
          <p className="text-xs text-red-400 mb-3">{cronStatus.error}</p>
        )}

        {/* Status Details */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={cronStatus.supabaseConfigured ? 'text-emerald-400' : 'text-zinc-500'}>
                {cronStatus.supabaseConfigured ? <Icons.Check /> : <Icons.X />}
              </span>
              <span className="text-zinc-400">Supabase Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cronStatus.pgCronEnabled ? 'text-emerald-400' : 'text-zinc-500'}>
                {cronStatus.pgCronEnabled ? <Icons.Check /> : <Icons.X />}
              </span>
              <span className="text-zinc-400">pg_cron Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cronStatus.pgNetEnabled ? 'text-emerald-400' : 'text-zinc-500'}>
                {cronStatus.pgNetEnabled ? <Icons.Check /> : <Icons.X />}
              </span>
              <span className="text-zinc-400">pg_net Extension</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cronStatus.cronJobsConfigured ? 'text-emerald-400' : 'text-zinc-500'}>
                {cronStatus.cronJobsConfigured ? <Icons.Check /> : <Icons.X />}
              </span>
              <span className="text-zinc-400">Cron Jobs Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400"><Icons.Bell /></span>
              <span className="text-zinc-400">{cronStatus.pendingNotifications} Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400"><Icons.Check /></span>
              <span className="text-zinc-400">{cronStatus.sentToday || 0} Sent Today</span>
            </div>
          </div>

          {/* Queue Statistics */}
          {(cronStatus.sentToday !== undefined || cronStatus.failedToday !== undefined) && (
            <div className="flex flex-wrap gap-4 text-xs">
              {cronStatus.failedToday !== undefined && cronStatus.failedToday > 0 && (
                <div className="text-red-400">
                  {cronStatus.failedToday} failed today
                </div>
              )}
            </div>
          )}

          {cronStatus.cronJobs.length > 0 && (
            <div className="bg-zinc-950 rounded-lg p-3 text-xs">
              <p className="text-zinc-500 mb-2">Scheduled Jobs:</p>
              {cronStatus.cronJobs.map((job, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-zinc-300">{job.name}</span>
                  <span className="text-zinc-500">{job.schedule}</span>
                  <span className={job.active ? 'text-emerald-400' : 'text-red-400'}>
                    {job.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {cronStatus.lastNotificationSent && (
            <p className="text-xs text-zinc-500">
              Last notification sent: {new Date(cronStatus.lastNotificationSent).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!cronStatus.pgCronEnabled && (
            <div className="text-sm text-zinc-400 w-full mb-2">
              <p className="mb-2">To enable background notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to <strong>Supabase Dashboard</strong> → Database → Extensions</li>
                <li>Search for <code className="bg-zinc-800 px-1 rounded">pg_cron</code> and enable it</li>
                <li>Click "Setup Cron Jobs" below to configure scheduled tasks</li>
              </ol>
            </div>
          )}

          {cronStatus.pgCronEnabled && !cronStatus.cronJobsConfigured && (
            <button
              onClick={setupCronJobs}
              disabled={settingUpCron}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
            >
              {settingUpCron ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Icons.Database />
              )}
              Setup Cron Jobs
            </button>
          )}

          {cronStatus.cronJobsConfigured && (
            <>
              <button
                onClick={triggerNotificationCheck}
                disabled={triggeringCheck}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
              >
                {triggeringCheck ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Icons.Play />
                )}
                Queue Check
              </button>
              <button
                onClick={triggerEmailQueueProcessor}
                disabled={sendingEmails || cronStatus.pendingNotifications === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
                title={cronStatus.pendingNotifications === 0 ? 'No pending notifications to send' : 'Process and send queued emails'}
              >
                {sendingEmails ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Icons.Send />
                )}
                Send Emails ({cronStatus.pendingNotifications})
              </button>
            </>
          )}

          <button
            onClick={checkCronStatus}
            disabled={checkingCron}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Refresh />
            {checkingCron ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {triggerResult && (
          <div className="mt-3 bg-blue-950/30 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
            <strong>Queue Check:</strong> {triggerResult}
          </div>
        )}

        {sendEmailsResult && (
          <div className="mt-3 bg-emerald-950/30 border border-emerald-800 rounded-lg p-3 text-xs text-emerald-300">
            <strong>Email Sending:</strong> {sendEmailsResult}
          </div>
        )}

        {cronStatus.cronJobsConfigured && (
          <div className="mt-4 bg-emerald-950/30 border border-emerald-800 rounded-lg p-3">
            <p className="text-sm text-emerald-300 font-medium mb-1">✓ Background Notifications Active</p>
            <p className="text-xs text-zinc-400">
              The system checks for expiring cultures, grow stage transitions, low inventory, and harvest-ready grows every 15 minutes,
              then sends queued emails every 5 minutes. Users receive notifications based on their preferences.
            </p>
          </div>
        )}

        {cronStatus.pgCronEnabled && !cronStatus.pgNetEnabled && (
          <div className="mt-4 bg-yellow-950/30 border border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-300 font-medium mb-1">⚠ pg_net Extension Recommended</p>
            <p className="text-xs text-zinc-400">
              Enable the <code className="bg-zinc-800 px-1 rounded">pg_net</code> extension in Supabase Dashboard → Database → Extensions
              for automatic email sending via cron. Without it, you'll need to use the "Send Emails" button manually or set up an external trigger.
            </p>
          </div>
        )}
      </div>

      {/* Refresh Status */}
      <div className="flex justify-center">
        <button
          onClick={checkServiceStatus}
          disabled={checkingStatus}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
        >
          <Icons.Refresh />
          {checkingStatus ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {/* Environment Variables Reference */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-medium mb-3">Environment Variables Reference</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Add these in your <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Netlify Dashboard</a> → Site Settings → Environment Variables
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Email (Resend or SendGrid)</h4>
            <p className="text-xs text-zinc-500 mb-2">Choose one provider. If both are configured, Resend is used as primary with SendGrid as fallback.</p>
            <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono space-y-1">
              <div><span className="text-purple-400">RESEND_API_KEY</span>=<span className="text-zinc-500">your_resend_api_key</span> <span className="text-zinc-600"># recommended</span></div>
              <div><span className="text-zinc-600"># OR</span></div>
              <div><span className="text-purple-400">SENDGRID_API_KEY</span>=<span className="text-zinc-500">your_sendgrid_api_key</span></div>
              <div className="mt-2"><span className="text-purple-400">FROM_EMAIL</span>=<span className="text-zinc-500">noreply@yourdomain.com</span> <span className="text-zinc-600"># optional</span></div>
              <div><span className="text-purple-400">FROM_NAME</span>=<span className="text-zinc-500">MycoLab</span> <span className="text-zinc-600"># optional</span></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2">SMS (Twilio)</h4>
            <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono space-y-1">
              <div><span className="text-purple-400">TWILIO_ACCOUNT_SID</span>=<span className="text-zinc-500">your_account_sid</span></div>
              <div><span className="text-purple-400">TWILIO_AUTH_TOKEN</span>=<span className="text-zinc-500">your_auth_token</span></div>
              <div><span className="text-purple-400">TWILIO_PHONE_NUMBER</span>=<span className="text-zinc-500">+15551234567</span></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-2">Supabase (for verification codes)</h4>
            <div className="bg-zinc-950 rounded-lg p-3 text-xs font-mono space-y-1">
              <div><span className="text-purple-400">SUPABASE_URL</span>=<span className="text-zinc-500">https://your-project.supabase.co</span></div>
              <div><span className="text-purple-400">SUPABASE_SERVICE_KEY</span>=<span className="text-zinc-500">your_service_role_key</span></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Note: Use the <strong>service_role</strong> key (not anon key) for server-side operations. Find it in Supabase → Settings → API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationConfig;
