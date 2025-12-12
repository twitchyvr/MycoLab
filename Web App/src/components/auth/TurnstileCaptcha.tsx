// ============================================================================
// TURNSTILE CAPTCHA COMPONENT
// Cloudflare Turnstile integration for human verification
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TURNSTILE TYPES
// ============================================================================

declare global {
  interface Window {
    turnstile: {
      render: (
        container: string | HTMLElement,
        options: TurnstileOptions
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error: any) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  tabindex?: number;
  action?: string;
  cData?: string;
  retry?: 'auto' | 'never';
  'retry-interval'?: number;
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: any) => void;
  onExpire?: () => void;
  siteKey?: string;
}

// Cloudflare Turnstile test keys (for development)
// See: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_TEST_KEYS = {
  ALWAYS_PASSES: '1x00000000000000000000AA',
  ALWAYS_FAILS: '2x00000000000000000000AB',
  INTERACTIVE: '3x00000000000000000000FF',
};

// Default site key from environment, or use test key for development
const DEFAULT_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || TURNSTILE_TEST_KEYS.ALWAYS_PASSES;

// ============================================================================
// COMPONENT
// ============================================================================

export const TurnstileCaptcha: React.FC<TurnstileCaptchaProps> = ({
  onVerify,
  onError,
  onExpire,
  siteKey = DEFAULT_SITE_KEY,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleVerify = useCallback((token: string) => {
    onVerify(token);
  }, [onVerify]);

  const handleError = useCallback((error: any) => {
    console.error('Turnstile error:', error);
    onError?.(error);
  }, [onError]);

  const handleExpire = useCallback(() => {
    console.log('Turnstile token expired');
    onExpire?.();
  }, [onExpire]);

  useEffect(() => {
    // Wait for Turnstile to load
    const initTurnstile = () => {
      if (!window.turnstile || !containerRef.current) {
        // Retry if turnstile isn't loaded yet
        setTimeout(initTurnstile, 100);
        return;
      }

      // Don't re-render if widget already exists
      if (widgetIdRef.current) {
        return;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'error-callback': handleError,
          'expired-callback': handleExpire,
          theme: 'dark',
          size: 'normal',
          retry: 'auto',
          'refresh-expired': 'auto',
        });
      } catch (err) {
        console.error('Failed to render Turnstile widget:', err);
        handleError(err);
      }
    };

    initTurnstile();

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (err) {
          // Widget may already be removed
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, handleVerify, handleError, handleExpire]);

  // Method to reset the widget (can be called via ref if needed)
  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className="turnstile-container" />
    </div>
  );
};

export default TurnstileCaptcha;
