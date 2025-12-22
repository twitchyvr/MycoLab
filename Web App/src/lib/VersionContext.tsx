// ============================================================================
// VERSION CONTEXT
// Detects when app has been rebuilt and requires user to refresh
// Prevents stale session issues with Supabase data loading
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Build time is injected by Vite at build time
declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

const VERSION_STORAGE_KEY = 'mycolab-build-version';
const DISMISSED_KEY = 'mycolab-version-dismissed';

// How often to check for new versions (in milliseconds)
const VERSION_CHECK_INTERVAL = 60 * 1000; // 1 minute (more responsive like Supabase)

interface VersionInfo {
  buildTime: string;
  appVersion: string;
  storedBuildTime: string | null;
  isNewVersion: boolean;
  isDismissed: boolean;
}

interface VersionContextType {
  versionInfo: VersionInfo;
  acknowledgeVersion: () => void;
  forceRefresh: () => void;
  clearSessionAndRefresh: () => void;
}

const VersionContext = createContext<VersionContextType | null>(null);

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return context;
};

interface VersionProviderProps {
  children: React.ReactNode;
}

export const VersionProvider: React.FC<VersionProviderProps> = ({ children }) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(() => {
    const storedBuildTime = localStorage.getItem(VERSION_STORAGE_KEY);
    const dismissedTime = localStorage.getItem(DISMISSED_KEY);

    // Check if this is a new version
    const isNewVersion = storedBuildTime !== null && storedBuildTime !== BUILD_TIME;

    // Check if user dismissed this specific version update
    const isDismissed = dismissedTime === BUILD_TIME;

    return {
      buildTime: BUILD_TIME,
      appVersion: APP_VERSION,
      storedBuildTime,
      isNewVersion,
      isDismissed,
    };
  });

  // On first load, store the current build time
  useEffect(() => {
    const storedBuildTime = localStorage.getItem(VERSION_STORAGE_KEY);

    if (storedBuildTime === null) {
      // First time user - store current build time
      localStorage.setItem(VERSION_STORAGE_KEY, BUILD_TIME);
    }
  }, []);

  /**
   * Proactive version checking - polls the server to detect new deployments
   * while the user has the app open. Uses multiple detection strategies for reliability.
   */
  useEffect(() => {
    // Skip polling in development mode
    if (import.meta.env.DEV) return;

    let isActive = true;
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    // Extract script hashes from the current page on first load
    const getCurrentScriptHashes = (): string => {
      const scripts = document.querySelectorAll('script[src]');
      const hashes = Array.from(scripts)
        .map(s => s.getAttribute('src'))
        .filter(src => src && src.includes('/assets/'))
        .sort()
        .join('|');
      return hashes;
    };

    // Store initial script hashes
    const initialScriptHashes = getCurrentScriptHashes();
    if (initialScriptHashes && !sessionStorage.getItem('mycolab-script-hashes')) {
      sessionStorage.setItem('mycolab-script-hashes', initialScriptHashes);
    }

    const checkForUpdates = async () => {
      if (!isActive) return;

      try {
        // Strategy 1: Fetch index.html and compare script tags (most reliable)
        const response = await fetch(`/?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract script tags from the fetched HTML
        const scriptMatches = html.match(/src="([^"]*\/assets\/[^"]+)"/g);
        const serverScripts = scriptMatches
          ? scriptMatches.map(m => m.replace(/src="|"/g, '')).sort().join('|')
          : '';

        const storedHashes = sessionStorage.getItem('mycolab-script-hashes');

        if (serverScripts && storedHashes && serverScripts !== storedHashes && isActive) {
          console.log('[MycoLab] New version detected - script hashes changed');
          console.log('[MycoLab] Current:', storedHashes.substring(0, 100));
          console.log('[MycoLab] Server:', serverScripts.substring(0, 100));

          setVersionInfo(prev => ({
            ...prev,
            isNewVersion: true,
            isDismissed: false,
          }));
          return; // New version found, stop checking
        }

        // Strategy 2: Also check headers as backup
        const serverEtag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');
        const serverTimestamp = serverEtag || lastModified;

        if (serverTimestamp && isActive) {
          const storedTimestamp = sessionStorage.getItem('mycolab-server-timestamp');

          if (!storedTimestamp) {
            sessionStorage.setItem('mycolab-server-timestamp', serverTimestamp);
          } else if (storedTimestamp !== serverTimestamp) {
            console.log('[MycoLab] New version detected via headers');
            setVersionInfo(prev => ({
              ...prev,
              isNewVersion: true,
              isDismissed: false,
            }));
          }
        }

        // Reset failure counter on success
        consecutiveFailures = 0;

      } catch (error) {
        consecutiveFailures++;
        if (consecutiveFailures <= MAX_FAILURES) {
          console.debug('[MycoLab] Version check failed:', error);
        }
        // After too many failures, reduce logging
      }
    };

    // Initial check after a short delay (let the app settle)
    const initialTimeout = setTimeout(checkForUpdates, 5000);

    // Set up periodic polling
    const intervalId = setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);

    // Check when the window gains focus (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Small delay to avoid race conditions
        setTimeout(checkForUpdates, 500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check on online event (in case user was offline)
    const handleOnline = () => {
      console.log('[MycoLab] Network restored, checking for updates...');
      setTimeout(checkForUpdates, 1000);
    };
    window.addEventListener('online', handleOnline);

    return () => {
      isActive = false;
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  /**
   * User acknowledges the new version (dismisses the modal)
   * This allows them to continue using the app without refreshing
   * (Not recommended, but possible for edge cases)
   */
  const acknowledgeVersion = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, BUILD_TIME);
    setVersionInfo(prev => ({ ...prev, isDismissed: true }));
  }, []);

  /**
   * Force a page refresh
   */
  const forceRefresh = useCallback(() => {
    // Update stored version before refresh
    localStorage.setItem(VERSION_STORAGE_KEY, BUILD_TIME);
    localStorage.removeItem(DISMISSED_KEY);
    window.location.reload();
  }, []);

  /**
   * Clear all session data and refresh
   * This ensures a completely clean state
   */
  const clearSessionAndRefresh = useCallback(() => {
    // Clear Supabase auth tokens
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');

    // Clear any cached auth state
    const keysToRemove = Object.keys(localStorage).filter(key =>
      key.startsWith('sb-') ||
      key.startsWith('supabase') ||
      key.includes('auth')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Update stored version
    localStorage.setItem(VERSION_STORAGE_KEY, BUILD_TIME);
    localStorage.removeItem(DISMISSED_KEY);

    // Hard refresh (bypass cache)
    window.location.href = window.location.origin + window.location.pathname;
  }, []);

  return (
    <VersionContext.Provider value={{ versionInfo, acknowledgeVersion, forceRefresh, clearSessionAndRefresh }}>
      {children}
    </VersionContext.Provider>
  );
};

// ============================================================================
// VERSION UPDATE MODAL
// Blocking modal shown when a new version is detected
// ============================================================================

export const VersionUpdateModal: React.FC = () => {
  const { versionInfo, forceRefresh, clearSessionAndRefresh } = useVersion();
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show if there's a new version and not dismissed
  if (!versionInfo.isNewVersion || versionInfo.isDismissed) {
    return null;
  }

  // Don't render during refresh to prevent Safari crash
  if (isRefreshing) {
    return null;
  }

  // Wrapped refresh handlers to prevent rendering during reload
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Small delay to ensure state update completes before reload
    setTimeout(forceRefresh, 50);
  };

  const handleClearAndRefresh = () => {
    setIsRefreshing(true);
    setTimeout(clearSessionAndRefresh, 50);
  };

  const formatBuildTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch {
      return isoString;
    }
  };

  // Use createPortal to render directly to body, bypassing any transform containment
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Update Available</h2>
              <p className="text-emerald-100 text-sm">Version {versionInfo.appVersion}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-zinc-300">
            A new version of MycoLab has been deployed. Please refresh your browser to ensure
            everything works correctly.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-sm text-amber-200">
                Continuing without refreshing may cause data to not load properly
                or other unexpected behavior.
              </p>
            </div>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-zinc-500 hover:text-zinc-400 flex items-center gap-1"
          >
            {showDetails ? '▼' : '▶'} Technical details
          </button>

          {showDetails && (
            <div className="bg-zinc-800/50 rounded-lg p-3 text-xs font-mono text-zinc-400 space-y-1">
              <div>Current build: {formatBuildTime(versionInfo.buildTime)}</div>
              <div>Your session: {formatBuildTime(versionInfo.storedBuildTime || 'unknown')}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-zinc-800/50 border-t border-zinc-700 space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh Now
          </button>

          <button
            onClick={handleClearAndRefresh}
            className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg font-medium transition-colors text-sm"
          >
            Clear Session & Refresh
          </button>

          <p className="text-xs text-zinc-500 text-center">
            Use "Clear Session" if you experience login issues after refresh
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VersionProvider;
