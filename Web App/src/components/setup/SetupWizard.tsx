// ============================================================================
// SETUP WIZARD
// Guides users through Supabase configuration and data migration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Icons
const Icons = {
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Key: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Cloud: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="9 18 15 12 9 6"/></svg>,
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(1);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if already configured
  useEffect(() => {
    const savedUrl = localStorage.getItem('mycolab-supabase-url');
    const savedKey = localStorage.getItem('mycolab-supabase-key');
    if (savedUrl) setSupabaseUrl(savedUrl);
    if (savedKey) setSupabaseKey(savedKey);
  }, []);

  // Test connection
  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult('error');
      setErrorMessage('Please enter both URL and API key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMessage('');

    try {
      // Create a temporary client to test
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(supabaseUrl, supabaseKey);
      
      // Try to query (this will fail if credentials are wrong)
      const { error } = await testClient.from('strains').select('count').limit(1);
      
      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      // Save credentials
      localStorage.setItem('mycolab-supabase-url', supabaseUrl);
      localStorage.setItem('mycolab-supabase-key', supabaseKey);
      
      setTestResult('success');
    } catch (err: any) {
      setTestResult('error');
      setErrorMessage(err.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  };

  // Handle completion
  const handleComplete = () => {
    localStorage.setItem('mycolab-setup-complete', 'true');
    // Force page reload to initialize with new config
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/50 to-teal-950/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl">🍄</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">MycoLab Setup</h1>
              <p className="text-sm text-zinc-400">Configure cloud storage for your data</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? 'bg-emerald-500 text-white' :
                  s === step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {s < step ? <Icons.Check /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-0.5 ${s < step ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>Welcome</span>
            <span>Connect</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Icons.Cloud />
                </div>
                <h2 className="text-lg font-semibold text-white">Welcome to MycoLab!</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                  MycoLab can work offline or sync your data to the cloud using Supabase. 
                  Cloud sync lets you access your lab from any device.
                </p>
              </div>

              <div className="grid gap-4 mt-8">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Icons.Database />
                    Offline Mode
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Data stored locally in your browser. Free, no account needed. 
                    Data stays on this device only.
                  </p>
                </div>
                <div className="bg-emerald-950/30 rounded-xl p-4 border border-emerald-800/50">
                  <h3 className="font-medium text-emerald-400 flex items-center gap-2">
                    <Icons.Cloud />
                    Cloud Sync (Recommended)
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Data synced to Supabase. Access from any device, automatic backups. 
                    Free tier includes 500MB storage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Connect to Supabase</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Enter your Supabase project credentials. You can find these in your{' '}
                  <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    Supabase dashboard
                  </a>{' '}
                  under Settings → API.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Project URL</label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={e => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Anon (Public) Key</label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={e => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Use the "anon public" key, not the secret key.
                  </p>
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`p-4 rounded-lg ${
                  testResult === 'success' 
                    ? 'bg-emerald-950/50 border border-emerald-800' 
                    : 'bg-red-950/50 border border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult === 'success' ? (
                      <>
                        <Icons.Check />
                        <span className="text-emerald-400 font-medium">Connection successful!</span>
                      </>
                    ) : (
                      <>
                        <Icons.X />
                        <span className="text-red-400 font-medium">Connection failed</span>
                      </>
                    )}
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-zinc-400 mt-2">{errorMessage}</p>
                  )}
                </div>
              )}

              <button
                onClick={testConnection}
                disabled={testing || !supabaseUrl || !supabaseKey}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
              >
                {testing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                    Testing...
                  </span>
                ) : (
                  'Test Connection'
                )}
              </button>

              <div className="bg-zinc-800/50 rounded-lg p-4 text-sm">
                <h4 className="font-medium text-white mb-2">Quick Setup Guide:</h4>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">supabase.com</a> and create a free account</li>
                  <li>Create a new project (any name, any region)</li>
                  <li>Go to Settings → API</li>
                  <li>Copy the Project URL and anon key</li>
                  <li>Run the SQL schema in SQL Editor (see schema file in download)</li>
                </ol>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Icons.Check />
              </div>
              <h2 className="text-xl font-semibold text-white">You're All Set!</h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                {testResult === 'success' 
                  ? 'Your MycoLab is connected to the cloud. Your data will sync automatically across all your devices.'
                  : 'MycoLab is set up in offline mode. Your data will be stored locally in your browser.'
                }
              </p>

              <div className="bg-zinc-800/50 rounded-xl p-4 text-left">
                <h3 className="font-medium text-white mb-3">Next Steps:</h3>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Add your strains and cultures in the Culture Library
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Create recipes for your agar, LC, and substrate mixes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    Start tracking your grows from spawn to harvest
                  </li>
                  {testResult !== 'success' && (
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      You can set up cloud sync later in Settings
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-between">
          {step === 1 && (
            <>
              <button
                onClick={onSkip}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('mycolab-setup-complete', 'true');
                    onSkip();
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  Use Offline
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Set Up Cloud
                  <Icons.ChevronRight />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={testResult !== 'success'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
                >
                  Continue
                  <Icons.ChevronRight />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div />
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
                <Icons.ChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
