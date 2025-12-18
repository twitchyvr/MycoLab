// ============================================================================
// TOAST NOTIFICATION COMPONENT
// Displays temporary notification toasts
// ============================================================================

import React from 'react';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Success: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Error: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ============================================================================
// TOAST STYLES
// ============================================================================

const toastStyles = {
  success: {
    container: 'bg-emerald-950/95 border-emerald-800',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
    message: 'text-emerald-400/80',
  },
  error: {
    container: 'bg-red-950/95 border-red-800',
    icon: 'text-red-400',
    title: 'text-red-300',
    message: 'text-red-400/80',
  },
  warning: {
    container: 'bg-amber-950/95 border-amber-800',
    icon: 'text-amber-400',
    title: 'text-amber-300',
    message: 'text-amber-400/80',
  },
  info: {
    container: 'bg-blue-950/95 border-blue-800',
    icon: 'text-blue-400',
    title: 'text-blue-300',
    message: 'text-blue-400/80',
  },
};

const iconComponents = {
  success: Icons.Success,
  error: Icons.Error,
  warning: Icons.Warning,
  info: Icons.Info,
};

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full sm:w-96 pointer-events-none">
      {toasts.map((toast) => {
        const styles = toastStyles[toast.type];
        const IconComponent = iconComponents[toast.type];

        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              ${styles.container}
              border rounded-lg shadow-lg
              p-4 pr-10
              animate-slide-up
              backdrop-blur-sm
            `}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                <IconComponent />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${styles.title}`}>
                  {toast.title}
                </p>
                {toast.message && (
                  <p className={`text-sm mt-0.5 ${styles.message}`}>
                    {toast.message}
                  </p>
                )}
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={toast.onAction}
                    className={`text-sm mt-2 font-medium ${styles.icon} hover:underline`}
                  >
                    {toast.actionLabel}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors"
                aria-label="Dismiss"
              >
                <Icons.Close />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
