// ============================================================================
// NOTIFICATION BELL - Per-item notification mute toggle
// Mobile-first, accessible, clean UI for muting notifications on individual items
// ============================================================================

import React, { useState, useCallback } from 'react';

interface NotificationBellProps {
  /** Whether notifications are currently muted for this item */
  muted: boolean;
  /** Callback when mute state changes */
  onToggle: (muted: boolean) => void | Promise<void>;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label for accessibility (e.g., "culture LC-241215-001") */
  itemLabel?: string;
  /** Show tooltip on hover (desktop) */
  showTooltip?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * NotificationBell - A clean, mobile-friendly toggle for muting notifications
 *
 * Design principles:
 * - 44px minimum touch target for mobile
 * - Clear visual distinction between muted/unmuted states
 * - Subtle animation for feedback
 * - Accessible with ARIA labels
 * - Matches app's zinc/emerald color scheme
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  muted,
  onToggle,
  size = 'md',
  itemLabel,
  showTooltip = true,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);

  const handleToggle = useCallback(async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onToggle(!muted);
    } catch (error) {
      console.error('Failed to toggle notification mute:', error);
    } finally {
      setIsLoading(false);
    }
  }, [muted, onToggle, disabled, isLoading]);

  // Size configurations
  const sizeConfig = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4', slash: 'w-5 h-5' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5', slash: 'w-6 h-6' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6', slash: 'w-7 h-7' },
  };

  const config = sizeConfig[size];

  const ariaLabel = muted
    ? `Unmute notifications${itemLabel ? ` for ${itemLabel}` : ''}`
    : `Mute notifications${itemLabel ? ` for ${itemLabel}` : ''}`;

  const tooltipText = muted
    ? 'Notifications muted - tap to enable'
    : 'Notifications enabled - tap to mute';

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        onMouseEnter={() => showTooltip && setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
        onFocus={() => showTooltip && setShowTooltipState(true)}
        onBlur={() => setShowTooltipState(false)}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-pressed={muted}
        className={`
          ${config.button}
          relative flex items-center justify-center
          rounded-full
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900
          ${disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'cursor-pointer hover:scale-105 active:scale-95'
          }
          ${muted
            ? 'bg-zinc-800/60 text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-400'
            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }
        `}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className={`${config.icon} animate-spin text-current`}
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Bell icon */}
        <div className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
          {muted ? (
            // Muted bell with slash
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${config.icon}`}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Slash overlay */}
              <svg
                viewBox="0 0 24 24"
                className={`${config.slash} absolute inset-0 -ml-0.5 -mt-0.5`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="4" y1="4" x2="20" y2="20" className="text-zinc-500" />
              </svg>
            </div>
          ) : (
            // Active bell
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`${config.icon}`}
            >
              <path d="M12 2C10.9 2 10 2.9 10 4C10 4.1 10 4.2 10 4.3C7.7 5 6 7.2 6 9.8V15L4 17V18H20V17L18 15V9.8C18 7.2 16.3 5 14 4.3C14 4.2 14 4.1 14 4C14 2.9 13.1 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" />
            </svg>
          )}
        </div>
      </button>

      {/* Tooltip (desktop only) */}
      {showTooltip && showTooltipState && !isLoading && (
        <div
          className="
            absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2.5 py-1.5
            bg-zinc-800 text-zinc-200 text-xs
            rounded-md shadow-lg
            whitespace-nowrap
            pointer-events-none
            animate-in fade-in-0 zoom-in-95 duration-150
            hidden sm:block
          "
          role="tooltip"
        >
          {tooltipText}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-zinc-800" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * NotificationBellCompact - Even smaller variant for dense lists
 * Uses just an icon without the button padding
 */
export const NotificationBellCompact: React.FC<Omit<NotificationBellProps, 'size'>> = (props) => {
  const { muted, onToggle, disabled, className = '' } = props;
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row clicks in lists
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onToggle(!muted);
    } catch (error) {
      console.error('Failed to toggle notification mute:', error);
    } finally {
      setIsLoading(false);
    }
  }, [muted, onToggle, disabled, isLoading]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled || isLoading}
      aria-label={muted ? 'Unmute notifications' : 'Mute notifications'}
      aria-pressed={muted}
      className={`
        p-1.5 -m-1.5
        rounded
        transition-colors duration-150
        focus:outline-none focus:ring-1 focus:ring-emerald-500/50
        ${disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer'
        }
        ${muted
          ? 'text-zinc-600 hover:text-zinc-400'
          : 'text-emerald-500 hover:text-emerald-400'
        }
        ${className}
      `}
    >
      {isLoading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : muted ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M12 2C10.9 2 10 2.9 10 4C10 4.1 10 4.2 10 4.3C7.7 5 6 7.2 6 9.8V15L4 17V18H20V17L18 15V9.8C18 7.2 16.3 5 14 4.3C14 4.2 14 4.1 14 4C14 2.9 13.1 2 12 2ZM12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" />
        </svg>
      )}
    </button>
  );
};

export default NotificationBell;
