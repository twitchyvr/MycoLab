// ============================================================================
// GLOBAL ERROR HANDLER
// Catches application errors and displays user-friendly notifications
// ============================================================================

import { useEffect, useCallback } from 'react';
import { useNotifications } from '../../store/NotificationContext';

// Error event detail structure
interface ErrorEventDetail {
  type: 'database' | 'network' | 'auth' | 'validation' | 'unknown';
  message: string;
  technical?: string;
  recoverable?: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Error log entry for potential future reporting
interface ErrorLogEntry {
  timestamp: Date;
  type: string;
  message: string;
  technical?: string;
  url: string;
  userAgent: string;
}

// Keep a rolling buffer of recent errors for potential bug reporting
const errorLog: ErrorLogEntry[] = [];
const MAX_ERROR_LOG_SIZE = 50;

export const logError = (entry: Omit<ErrorLogEntry, 'timestamp' | 'url' | 'userAgent'>) => {
  const fullEntry: ErrorLogEntry = {
    ...entry,
    timestamp: new Date(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  errorLog.push(fullEntry);

  // Keep log size bounded
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  // Store in localStorage for persistence across page reloads
  try {
    const existingLog = localStorage.getItem('sporely-error-log');
    const parsed = existingLog ? JSON.parse(existingLog) : [];
    parsed.push(fullEntry);
    // Keep only last 50 errors
    const trimmed = parsed.slice(-MAX_ERROR_LOG_SIZE);
    localStorage.setItem('sporely-error-log', JSON.stringify(trimmed));
  } catch (e) {
    // localStorage might be full or unavailable
    console.warn('Could not persist error to localStorage:', e);
  }
};

export const getErrorLog = (): ErrorLogEntry[] => {
  try {
    const stored = localStorage.getItem('sporely-error-log');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const clearErrorLog = () => {
  localStorage.removeItem('sporely-error-log');
  errorLog.length = 0;
};

// User-friendly messages for different error types
const getUserFriendlyMessage = (detail: ErrorEventDetail): { title: string; message: string } => {
  switch (detail.type) {
    case 'database':
      return {
        title: 'Sync Issue',
        message: detail.message || 'Your data couldn\'t be saved to the cloud. It\'s stored locally and will sync when the issue is resolved.',
      };
    case 'network':
      return {
        title: 'Connection Problem',
        message: detail.message || 'Unable to reach the server. Please check your internet connection.',
      };
    case 'auth':
      return {
        title: 'Authentication Required',
        message: detail.message || 'Please sign in to continue.',
      };
    case 'validation':
      return {
        title: 'Invalid Input',
        message: detail.message || 'Please check your input and try again.',
      };
    default:
      return {
        title: 'Something Went Wrong',
        message: detail.message || 'An unexpected error occurred. The team has been notified.',
      };
  }
};

export const GlobalErrorHandler: React.FC = () => {
  const { toast } = useNotifications();

  const handleError = useCallback((event: CustomEvent<ErrorEventDetail>) => {
    const detail = event.detail;
    const { title, message } = getUserFriendlyMessage(detail);

    // Log the error for potential reporting
    logError({
      type: detail.type,
      message: detail.message,
      technical: detail.technical,
    });

    // Show user-friendly toast notification
    if (detail.recoverable) {
      toast.warning(title, message);
    } else {
      toast.error(title, message);
    }
  }, [toast]);

  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    const message = event.reason?.message || 'An unexpected error occurred';

    logError({
      type: 'unknown',
      message: 'Unhandled Promise Rejection',
      technical: message,
    });

    // Only show toast for non-network errors to avoid spam during offline
    if (!message.includes('network') && !message.includes('fetch')) {
      toast.error('Unexpected Error', 'Something went wrong. Please try again.');
    }

    // Prevent default browser handling
    event.preventDefault();
  }, [toast]);

  const handleGlobalError = useCallback((event: ErrorEvent) => {
    logError({
      type: 'unknown',
      message: 'JavaScript Error',
      technical: `${event.message} at ${event.filename}:${event.lineno}`,
    });

    // Don't show toast for every JS error - that would be overwhelming
    // The error boundary will catch component errors
  }, []);

  useEffect(() => {
    // Listen for custom app errors
    window.addEventListener('sporely:error', handleError as EventListener);

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Catch global JS errors (for logging, not display)
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('sporely:error', handleError as EventListener);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError, handleUnhandledRejection, handleGlobalError]);

  // This component doesn't render anything - it just sets up listeners
  return null;
};

export default GlobalErrorHandler;
