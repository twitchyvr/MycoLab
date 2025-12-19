// ============================================================================
// ADMIN NOTIFICATION CONFIG - Configure email/SMS notification services
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
};

interface ServiceStatus {
  configured: boolean;
  provider?: string;
  lastTest?: string;
  error?: string;
}

interface AdminNotificationConfigProps {
  isConnected: boolean;
}

export const AdminNotificationConfig: React.FC<AdminNotificationConfigProps> = ({ isConnected }) => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
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

  // Check service status
  const checkServiceStatus = async () => {
    if (!isConnected) {
      setError('Not connected to database');
      return;
    }

    setCheckingStatus(true);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) {
        setError('Supabase client not available');
        return;
      }

      // Check email service
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('check-notification-config', {
          body: { service: 'email' },
        });

        if (emailError) {
          setEmailStatus({ configured: false, error: emailError.message });
        } else {
          setEmailStatus({
            configured: emailData?.configured || false,
            provider: emailData?.provider,
            lastTest: emailData?.lastTest,
          });
        }
      } catch (e: any) {
        setEmailStatus({ configured: false, error: e.message || 'Failed to check email service' });
      }

      // Check SMS service
      try {
        const { data: smsData, error: smsError } = await supabase.functions.invoke('check-notification-config', {
          body: { service: 'sms' },
        });

        if (smsError) {
          setSmsStatus({ configured: false, error: smsError.message });
        } else {
          setSmsStatus({
            configured: smsData?.configured || false,
            provider: smsData?.provider,
            lastTest: smsData?.lastTest,
          });
        }
      } catch (e: any) {
        setSmsStatus({ configured: false, error: e.message || 'Failed to check SMS service' });
      }
    } catch (err: any) {
      setError(`Failed to check service status: ${err.message}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check status on mount
  useEffect(() => {
    if (isConnected && isAdmin) {
      checkServiceStatus();
    }
  }, [isConnected, isAdmin]);

  // Send test notification
  const sendTestNotification = async (type: 'email' | 'sms') => {
    const recipient = type === 'email' ? testEmail : testPhone;
    if (!recipient) {
      setError(`Please enter a ${type === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    setSendingTest(type);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) {
        setError('Supabase client not available');
        return;
      }

      const { data, error: sendError } = await supabase.functions.invoke('send-test-notification', {
        body: {
          type,
          recipient,
          message: `This is a test notification from MycoLab sent at ${new Date().toLocaleString()}`,
        },
      });

      if (sendError) {
        setError(`Failed to send test ${type}: ${sendError.message}`);
      } else if (data?.success) {
        setSuccess(`Test ${type} sent successfully!`);
        if (type === 'email') setTestEmail('');
        else setTestPhone('');
      } else {
        setError(data?.error || `Failed to send test ${type}`);
      }
    } catch (err: any) {
      setError(`Failed to send test ${type}: ${err.message}`);
    } finally {
      setSendingTest(null);
    }
  };

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
              Configure notification services using Supabase Edge Functions. Credentials are stored securely as environment variables.
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
                  {emailStatus.provider || 'SendGrid / Resend'}
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
              <p>To configure email notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Create a Supabase Edge Function named <code className="bg-zinc-800 px-1 rounded">send-notification-email</code></li>
                <li>Add environment variables: <code className="bg-zinc-800 px-1 rounded">SENDGRID_API_KEY</code> or <code className="bg-zinc-800 px-1 rounded">RESEND_API_KEY</code></li>
                <li>Deploy the function</li>
              </ol>
              <a
                href="https://supabase.com/docs/guides/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-2"
              >
                Supabase Edge Functions Docs <Icons.ExternalLink />
              </a>
            </div>
          )}
        </div>

        {/* SMS Service */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${smsStatus.configured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                <Icons.Phone />
              </div>
              <div>
                <h3 className="text-white font-medium">SMS Service</h3>
                <p className="text-xs text-zinc-500">
                  {smsStatus.provider || 'Twilio'}
                </p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              smsStatus.configured
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              {smsStatus.configured ? 'Configured' : 'Not Configured'}
            </div>
          </div>

          {smsStatus.error && (
            <p className="text-xs text-red-400 mb-3">{smsStatus.error}</p>
          )}

          {smsStatus.configured && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Send Test SMS</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={() => sendTestNotification('sms')}
                    disabled={sendingTest === 'sms' || !testPhone}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    {sendingTest === 'sms' ? (
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

          {!smsStatus.configured && (
            <div className="text-sm text-zinc-400 space-y-2">
              <p>To configure SMS notifications:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Create a Supabase Edge Function named <code className="bg-zinc-800 px-1 rounded">send-notification-sms</code></li>
                <li>Add environment variables:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-zinc-800 px-1 rounded">TWILIO_ACCOUNT_SID</code></li>
                    <li><code className="bg-zinc-800 px-1 rounded">TWILIO_AUTH_TOKEN</code></li>
                    <li><code className="bg-zinc-800 px-1 rounded">TWILIO_PHONE_NUMBER</code></li>
                  </ul>
                </li>
                <li>Deploy the function</li>
              </ol>
              <a
                href="https://www.twilio.com/docs/messaging/quickstart"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs mt-2"
              >
                Twilio SMS Quickstart <Icons.ExternalLink />
              </a>
            </div>
          )}
        </div>
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

      {/* Edge Function Templates */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-medium mb-3">Edge Function Templates</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Copy these templates to quickly set up your Supabase Edge Functions for notifications.
        </p>

        <div className="space-y-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <span className="transform group-open:rotate-90 transition-transform">▶</span>
              send-notification-email (SendGrid)
            </summary>
            <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-300 overflow-x-auto">
{`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@mycolab.app'

serve(async (req) => {
  const { to, subject, body, category } = await req.json()

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${SENDGRID_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: 'MycoLab' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  })

  return new Response(JSON.stringify({
    success: response.ok,
    messageId: response.headers.get('x-message-id')
  }))
})`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <span className="transform group-open:rotate-90 transition-transform">▶</span>
              send-notification-sms (Twilio)
            </summary>
            <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-300 overflow-x-auto">
{`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const FROM_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

serve(async (req) => {
  const { to, message } = await req.json()

  const auth = btoa(\`\${ACCOUNT_SID}:\${AUTH_TOKEN}\`)
  const response = await fetch(
    \`https://api.twilio.com/2010-04-01/Accounts/\${ACCOUNT_SID}/Messages.json\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Basic \${auth}\`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: FROM_NUMBER,
        Body: message,
      }),
    }
  )

  const data = await response.json()
  return new Response(JSON.stringify({
    success: response.ok,
    messageId: data.sid
  }))
})`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
              <span className="transform group-open:rotate-90 transition-transform">▶</span>
              check-notification-config
            </summary>
            <pre className="mt-2 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-300 overflow-x-auto">
{`import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { service } = await req.json()

  if (service === 'email') {
    const configured = !!Deno.env.get('SENDGRID_API_KEY') ||
                       !!Deno.env.get('RESEND_API_KEY')
    return new Response(JSON.stringify({
      configured,
      provider: Deno.env.get('SENDGRID_API_KEY') ? 'SendGrid' :
                Deno.env.get('RESEND_API_KEY') ? 'Resend' : null
    }))
  }

  if (service === 'sms') {
    const configured = !!Deno.env.get('TWILIO_ACCOUNT_SID') &&
                       !!Deno.env.get('TWILIO_AUTH_TOKEN') &&
                       !!Deno.env.get('TWILIO_PHONE_NUMBER')
    return new Response(JSON.stringify({
      configured,
      provider: configured ? 'Twilio' : null
    }))
  }

  return new Response(JSON.stringify({ error: 'Invalid service' }), { status: 400 })
})`}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationConfig;
