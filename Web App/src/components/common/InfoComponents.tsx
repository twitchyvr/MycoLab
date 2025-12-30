// ============================================================================
// INFO COMPONENTS - Enhanced informational UI elements
// Provides consistent info display throughout the app
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../../store';
import { useInfoOptional, InfoCategory, InfoPriority, HelpContent } from '../../store/InfoContext';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  help: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>
  ),
  tip: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M9 18h6M10 22h4M12 2v1M12 9a3 3 0 1 0 0 6v0"/>
      <path d="M21 12h1M3 12h1M18.364 5.636l-.707.707M6.343 17.657l-.707.707M5.636 5.636l.707.707M17.657 17.657l.707.707"/>
    </svg>
  ),
  warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  error: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  success: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 12 15 16 10"/>
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  chevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  externalLink: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

// ============================================================================
// INFO POPOVER - Detailed information popup
// ============================================================================

interface InfoPopoverProps {
  title: string;
  content: string | React.ReactNode;
  helpId?: string;                    // Link to help registry
  learnMoreUrl?: string;
  relatedTopics?: string[];
  category?: InfoCategory;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  children?: React.ReactNode;
  icon?: 'info' | 'help' | 'tip';
  showForBeginners?: boolean;
  className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  content,
  helpId,
  learnMoreUrl,
  relatedTopics,
  category = 'general',
  position = 'top',
  trigger = 'hover',
  children,
  icon = 'info',
  showForBeginners = false,
  className = '',
}) => {
  const { state } = useData();
  const infoContext = useInfoOptional();
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check if should show based on experience level
  const experienceLevel = state.settings?.experienceLevel;
  const showTooltips = state.settings?.showTooltips !== false;

  // Check info preferences
  if (infoContext && !infoContext.shouldShow('help', category)) {
    return <>{children}</>;
  }

  if (showForBeginners && experienceLevel !== 'beginner' && experienceLevel !== 'intermediate') {
    return <>{children}</>;
  }

  if (!showTooltips && !children) {
    return null;
  }

  // Get help content from registry if helpId provided
  let helpContent: HelpContent | undefined;
  if (helpId && infoContext) {
    helpContent = infoContext.getHelp(helpId);
  }

  const finalTitle = helpContent?.title || title;
  const finalContent = helpContent?.content || content;
  const finalLearnMoreUrl = helpContent?.learnMoreUrl || learnMoreUrl;
  const finalRelatedTopics = helpContent?.relatedTopics || relatedTopics;

  const IconComponent = Icons[icon];

  const updatePosition = () => {
    if (triggerRef.current && popoverRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          y = triggerRect.top - popoverRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - popoverRect.width - 8;
          y = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
          break;
      }

      // Keep within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - popoverRect.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - popoverRect.height - 8));

      setPopoverPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  // Click outside to close
  useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)
        ) {
          setIsVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger, isVisible]);

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div
        ref={triggerRef}
        className="relative inline-flex items-center cursor-pointer"
        onMouseEnter={() => trigger === 'hover' && setIsVisible(true)}
        onMouseLeave={() => trigger === 'hover' && setIsVisible(false)}
        onClick={handleTrigger}
      >
        {children || (
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-400 transition-colors p-0.5"
            aria-label="Help"
          >
            <IconComponent />
          </button>
        )}
      </div>

      {/* Popover */}
      {isVisible && (
        <div
          ref={popoverRef}
          className="fixed z-50"
          style={{ left: popoverPosition.x, top: popoverPosition.y }}
        >
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl p-4 max-w-sm animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="text-sm font-semibold text-white">{finalTitle}</h4>
              {trigger === 'click' && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-zinc-500 hover:text-zinc-400 -mr-1 -mt-1"
                >
                  <Icons.close />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="text-sm text-zinc-400 leading-relaxed">
              {typeof finalContent === 'string' ? <p>{finalContent}</p> : finalContent}
            </div>

            {/* Learn More Link */}
            {finalLearnMoreUrl && (
              <a
                href={finalLearnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-3"
              >
                Learn more <Icons.externalLink />
              </a>
            )}

            {/* Related Topics */}
            {finalRelatedTopics && finalRelatedTopics.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-xs text-zinc-500 mb-1.5">Related:</p>
                <div className="flex flex-wrap gap-1.5">
                  {finalRelatedTopics.map(topic => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-0.5 bg-zinc-700/50 rounded text-zinc-400"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CONTEXTUAL WARNING - Warning display for issues
// ============================================================================

interface ContextualWarningProps {
  title: string;
  message: string;
  priority?: InfoPriority;
  resolution?: string;
  learnMoreUrl?: string;
  isDismissible?: boolean;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'badge' | 'toast';
  category?: InfoCategory;
  className?: string;
}

export const ContextualWarning: React.FC<ContextualWarningProps> = ({
  title,
  message,
  priority = 'medium',
  resolution,
  learnMoreUrl,
  isDismissible = true,
  onDismiss,
  variant = 'inline',
  category = 'general',
  className = '',
}) => {
  const infoContext = useInfoOptional();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if should show
  if (infoContext && !infoContext.shouldShow('warning', category, priority)) {
    return null;
  }

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Color schemes by priority
  const colorSchemes = {
    low: {
      bg: 'bg-blue-950/30',
      border: 'border-blue-800/50',
      icon: 'text-blue-400',
      text: 'text-blue-300',
      badge: 'bg-blue-500/20 text-blue-400',
    },
    medium: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-800/50',
      icon: 'text-amber-400',
      text: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-400',
    },
    high: {
      bg: 'bg-orange-950/30',
      border: 'border-orange-800/50',
      icon: 'text-orange-400',
      text: 'text-orange-300',
      badge: 'bg-orange-500/20 text-orange-400',
    },
    critical: {
      bg: 'bg-red-950/30',
      border: 'border-red-800/50',
      icon: 'text-red-400',
      text: 'text-red-300',
      badge: 'bg-red-500/20 text-red-400',
    },
  };

  const colors = colorSchemes[priority];

  // Badge variant - minimal
  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${colors.badge} ${className}`}
        title={message}
      >
        <Icons.warning />
        {title}
      </span>
    );
  }

  // Banner variant - full width
  if (variant === 'banner') {
    return (
      <div className={`${colors.bg} border-y ${colors.border} px-4 py-3 ${className}`}>
        <div className="flex items-start gap-3 max-w-6xl mx-auto">
          <div className={`shrink-0 mt-0.5 ${colors.icon}`}>
            <Icons.warning />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-sm ${colors.text}`}>{title}</p>
            <p className="text-sm text-zinc-400 mt-0.5">{message}</p>
            {resolution && (
              <p className="text-xs text-zinc-500 mt-1">💡 {resolution}</p>
            )}
          </div>
          {isDismissible && (
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-400"
            >
              <Icons.close />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline variant - default
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${colors.icon}`}>
          <Icons.warning />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${colors.text}`}>{title}</p>
          <p className="text-sm text-zinc-400 mt-0.5">{message}</p>
          {resolution && (
            <p className="text-xs text-zinc-500 mt-2">💡 {resolution}</p>
          )}
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2"
            >
              Learn more <Icons.externalLink />
            </a>
          )}
        </div>
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-400 shrink-0"
          >
            <Icons.close />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE TIP - Proactive suggestions and tips
// ============================================================================

interface FeatureTipProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  priority?: 'high' | 'medium' | 'low';
  isDismissible?: boolean;
  onDismiss?: () => void;
  onSnooze?: (days: number) => void;
  category?: InfoCategory;
  variant?: 'card' | 'inline' | 'floating';
  className?: string;
}

export const FeatureTip: React.FC<FeatureTipProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  priority = 'medium',
  isDismissible = true,
  onDismiss,
  onSnooze,
  category = 'general',
  variant = 'card',
  className = '',
}) => {
  const infoContext = useInfoOptional();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  // Check if should show
  if (infoContext && !infoContext.shouldShow('tip', category)) {
    return null;
  }

  if (isDismissed) return null;

  const handleDismiss = (permanent = false) => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleSnooze = (days: number) => {
    setIsDismissed(true);
    onSnooze?.(days);
    setShowSnoozeOptions(false);
  };

  const priorityColors = {
    high: 'bg-emerald-950/40 border-emerald-800/50',
    medium: 'bg-blue-950/30 border-blue-800/40',
    low: 'bg-zinc-800/50 border-zinc-700',
  };

  // Floating variant
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 right-4 z-40 animate-in slide-in-from-right duration-300 ${className}`}>
        <div className={`${priorityColors[priority]} border rounded-xl p-4 shadow-xl max-w-sm`}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-amber-400">
              <Icons.tip />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white">{title}</p>
              <p className="text-sm text-zinc-400 mt-1">{message}</p>
              {actionLabel && (
                <button
                  onClick={onAction}
                  className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                >
                  {actionLabel}
                </button>
              )}
            </div>
            {isDismissible && (
              <button
                onClick={() => handleDismiss()}
                className="text-zinc-500 hover:text-zinc-400 shrink-0"
              >
                <Icons.close />
              </button>
            )}
          </div>
          {onSnooze && (
            <div className="mt-3 pt-3 border-t border-zinc-700 flex gap-2">
              <button
                onClick={() => handleSnooze(1)}
                className="text-xs text-zinc-500 hover:text-zinc-400"
              >
                Remind tomorrow
              </button>
              <span className="text-zinc-700">·</span>
              <button
                onClick={() => handleSnooze(7)}
                className="text-xs text-zinc-500 hover:text-zinc-400"
              >
                In a week
              </button>
              <span className="text-zinc-700">·</span>
              <button
                onClick={() => handleDismiss(true)}
                className="text-xs text-zinc-500 hover:text-zinc-400"
              >
                Don't show again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <span className="text-amber-400">
          <Icons.tip />
        </span>
        <span className="text-zinc-400">{message}</span>
        {actionLabel && (
          <button onClick={onAction} className="text-emerald-400 hover:text-emerald-300">
            {actionLabel} →
          </button>
        )}
        {isDismissible && (
          <button onClick={() => handleDismiss()} className="text-zinc-600 hover:text-zinc-500">
            <Icons.close />
          </button>
        )}
      </div>
    );
  }

  // Card variant - default
  return (
    <div className={`${priorityColors[priority]} border rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-amber-400 mt-0.5">
          <Icons.tip />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm text-white">{title}</p>
          <p className="text-sm text-zinc-400 mt-1">{message}</p>
          <div className="flex items-center gap-3 mt-3">
            {actionLabel && (
              <button
                onClick={onAction}
                className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
              >
                {actionLabel} <Icons.chevronRight />
              </button>
            )}
            {onSnooze && (
              <div className="relative">
                <button
                  onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                  className="text-xs text-zinc-500 hover:text-zinc-400"
                >
                  Snooze...
                </button>
                {showSnoozeOptions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-2 min-w-32">
                    <button
                      onClick={() => handleSnooze(1)}
                      className="w-full text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 px-2 py-1.5 rounded"
                    >
                      1 day
                    </button>
                    <button
                      onClick={() => handleSnooze(7)}
                      className="w-full text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 px-2 py-1.5 rounded"
                    >
                      1 week
                    </button>
                    <button
                      onClick={() => handleSnooze(30)}
                      className="w-full text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 px-2 py-1.5 rounded"
                    >
                      1 month
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {isDismissible && (
          <button
            onClick={() => handleDismiss()}
            className="text-zinc-500 hover:text-zinc-400 shrink-0"
          >
            <Icons.close />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// VALIDATION FEEDBACK - Form field validation display
// ============================================================================

interface ValidationFeedbackProps {
  errors?: string[];
  warnings?: string[];
  suggestions?: string[];
  successMessage?: string;
  variant?: 'list' | 'inline' | 'icon';
  className?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  errors = [],
  warnings = [],
  suggestions = [],
  successMessage,
  variant = 'list',
  className = '',
}) => {
  const infoContext = useInfoOptional();

  // Check if should show
  if (infoContext && !infoContext.shouldShow('validation')) {
    return null;
  }

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasSuccess = !!successMessage;

  if (!hasErrors && !hasWarnings && !hasSuggestions && !hasSuccess) {
    return null;
  }

  // Icon variant - just shows an indicator
  if (variant === 'icon') {
    if (hasErrors) {
      return (
        <span className={`text-red-400 ${className}`} title={errors.join(', ')}>
          <Icons.error />
        </span>
      );
    }
    if (hasWarnings) {
      return (
        <span className={`text-amber-400 ${className}`} title={warnings.join(', ')}>
          <Icons.warning />
        </span>
      );
    }
    if (hasSuccess) {
      return (
        <span className={`text-emerald-400 ${className}`} title={successMessage}>
          <Icons.success />
        </span>
      );
    }
    return null;
  }

  // Inline variant - compact display
  if (variant === 'inline') {
    const messages = [
      ...errors.map(e => ({ type: 'error', msg: e })),
      ...warnings.map(w => ({ type: 'warning', msg: w })),
      ...suggestions.map(s => ({ type: 'suggestion', msg: s })),
    ];
    if (hasSuccess) {
      messages.unshift({ type: 'success', msg: successMessage });
    }

    const firstMessage = messages[0];
    if (!firstMessage) return null;

    const colors = {
      error: 'text-red-400',
      warning: 'text-amber-400',
      suggestion: 'text-blue-400',
      success: 'text-emerald-400',
    };

    return (
      <p className={`text-xs ${colors[firstMessage.type as keyof typeof colors]} ${className}`}>
        {firstMessage.msg}
        {messages.length > 1 && ` (+${messages.length - 1} more)`}
      </p>
    );
  }

  // List variant - full display
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Errors */}
      {hasErrors && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <div key={`error-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-red-400 shrink-0 mt-0.5">
                <Icons.error />
              </span>
              <span className="text-red-300">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="space-y-1">
          {warnings.map((warning, i) => (
            <div key={`warning-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-amber-400 shrink-0 mt-0.5">
                <Icons.warning />
              </span>
              <span className="text-amber-300">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {hasSuggestions && (
        <div className="space-y-1">
          {suggestions.map((suggestion, i) => (
            <div key={`suggestion-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-blue-400 shrink-0 mt-0.5">
                <Icons.tip />
              </span>
              <span className="text-blue-300">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success */}
      {hasSuccess && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-emerald-400 shrink-0 mt-0.5">
            <Icons.success />
          </span>
          <span className="text-emerald-300">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INFO BANNER - Dismissible information banner
// ============================================================================

interface InfoBannerProps {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'tip';
  isDismissible?: boolean;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  persistKey?: string;              // LocalStorage key to remember dismissal
  category?: InfoCategory;
  className?: string;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({
  title,
  message,
  type = 'info',
  isDismissible = true,
  onDismiss,
  actionLabel,
  onAction,
  persistKey,
  category = 'general',
  className = '',
}) => {
  const infoContext = useInfoOptional();
  const [isDismissed, setIsDismissed] = useState(() => {
    if (persistKey) {
      return localStorage.getItem(`mycolab-banner-${persistKey}`) === 'dismissed';
    }
    return false;
  });

  // Check if should show
  if (infoContext && !infoContext.shouldShow('info', category)) {
    return null;
  }

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (persistKey) {
      localStorage.setItem(`mycolab-banner-${persistKey}`, 'dismissed');
    }
    onDismiss?.();
  };

  const typeStyles = {
    info: {
      bg: 'bg-blue-950/30',
      border: 'border-blue-800/50',
      icon: 'text-blue-400',
      IconComponent: Icons.info,
    },
    success: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-800/50',
      icon: 'text-emerald-400',
      IconComponent: Icons.success,
    },
    warning: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-800/50',
      icon: 'text-amber-400',
      IconComponent: Icons.warning,
    },
    tip: {
      bg: 'bg-purple-950/30',
      border: 'border-purple-800/50',
      icon: 'text-purple-400',
      IconComponent: Icons.tip,
    },
  };

  const styles = typeStyles[type];
  const { IconComponent } = styles;

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${styles.icon}`}>
          <IconComponent />
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium text-sm text-white">{title}</p>}
          <p className={`text-sm text-zinc-400 ${title ? 'mt-0.5' : ''}`}>{message}</p>
          {actionLabel && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 mt-2"
            >
              {actionLabel} <Icons.chevronRight />
            </button>
          )}
        </div>
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-400 shrink-0"
          >
            <Icons.close />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// GUIDED STEP - Step-by-step guidance indicator
// ============================================================================

interface GuidedStepProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  onStepClick?: () => void;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
}

export const GuidedStep: React.FC<GuidedStepProps> = ({
  stepNumber,
  totalSteps,
  title,
  description,
  isActive = false,
  isCompleted = false,
  onStepClick,
  variant = 'horizontal',
  className = '',
}) => {
  const infoContext = useInfoOptional();

  // Check if guides are enabled
  if (infoContext && !infoContext.shouldShow('guide')) {
    return null;
  }

  // Compact variant - just the step number
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 ${className}`}
        onClick={onStepClick}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            isCompleted
              ? 'bg-emerald-500 text-white'
              : isActive
                ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                : 'bg-zinc-700 text-zinc-400'
          }`}
        >
          {isCompleted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            stepNumber
          )}
        </div>
        <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-zinc-400'}`}>
          {title}
        </span>
      </div>
    );
  }

  // Vertical variant
  if (variant === 'vertical') {
    return (
      <div
        className={`flex gap-4 ${onStepClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onStepClick}
      >
        <div className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              isCompleted
                ? 'bg-emerald-500 text-white'
                : isActive
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                  : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {isCompleted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              stepNumber
            )}
          </div>
          {stepNumber < totalSteps && (
            <div className={`w-0.5 h-8 mt-2 ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
          )}
        </div>
        <div className="flex-1 pb-8">
          <p className={`font-medium ${isActive ? 'text-white' : 'text-zinc-400'}`}>{title}</p>
          {description && (
            <p className="text-sm text-zinc-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  }

  // Horizontal variant - default
  return (
    <div
      className={`flex items-center ${className}`}
      onClick={onStepClick}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
          isCompleted
            ? 'bg-emerald-500 text-white'
            : isActive
              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
              : 'bg-zinc-700 text-zinc-400'
        }`}
      >
        {isCompleted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          stepNumber
        )}
      </div>
      {stepNumber < totalSteps && (
        <div className={`h-0.5 w-12 ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
      )}
    </div>
  );
};

// ============================================================================
// FIELD LABEL WITH HELP - Common pattern for form labels with help icons
// ============================================================================

interface FieldLabelProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helpContent?: string;
  helpTitle?: string;
  helpId?: string;
  forBeginners?: boolean;
  className?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  label,
  htmlFor,
  required = false,
  helpContent,
  helpTitle,
  helpId,
  forBeginners = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {(helpContent || helpId) && (
        <InfoPopover
          title={helpTitle || label}
          content={helpContent || ''}
          helpId={helpId}
          showForBeginners={forBeginners}
          position="right"
        />
      )}
    </div>
  );
};

// ============================================================================
// QUICK INFO - Inline info snippet
// ============================================================================

interface QuickInfoProps {
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warning';
  className?: string;
}

export const QuickInfo: React.FC<QuickInfoProps> = ({
  children,
  type = 'info',
  className = '',
}) => {
  const icons = {
    info: Icons.info,
    tip: Icons.tip,
    warning: Icons.warning,
  };

  const colors = {
    info: 'text-blue-400',
    tip: 'text-amber-400',
    warning: 'text-amber-400',
  };

  const IconComponent = icons[type];

  return (
    <div className={`flex items-start gap-2 text-xs text-zinc-500 ${className}`}>
      <span className={`shrink-0 mt-0.5 ${colors[type]}`}>
        <IconComponent />
      </span>
      <span>{children}</span>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  InfoPopover,
  ContextualWarning,
  FeatureTip,
  ValidationFeedback,
  InfoBanner,
  GuidedStep,
  FieldLabel,
  QuickInfo,
};
