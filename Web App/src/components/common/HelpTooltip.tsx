// ============================================================================
// HELP TOOLTIP - Contextual help component with knowledge base links
// Provides consistent help throughout the app
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../store';

interface HelpTooltipProps {
  content: string;
  title?: string;
  learnMorePage?: string; // Page to navigate to for more info
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  icon?: 'info' | 'help' | 'tip';
  showForBeginners?: boolean; // Only show for beginner/intermediate users
}

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
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  learnMorePage,
  position = 'top',
  children,
  icon = 'info',
  showForBeginners = false,
}) => {
  const { state } = useData();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if we should show based on experience level
  const experienceLevel = state.settings?.experienceLevel;
  const showTooltips = state.settings?.showTooltips !== false; // Default to true

  // For beginners-only tooltips, check experience level
  if (showForBeginners && experienceLevel !== 'beginner' && experienceLevel !== 'intermediate') {
    // Return children without tooltip for advanced/expert users
    return <>{children}</>;
  }

  // If tooltips are disabled globally, only show icon without popup
  if (!showTooltips && !children) {
    return null;
  }

  const IconComponent = Icons[icon];

  const updatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          y = triggerRect.top - tooltipRect.height - 8;
          break;
        case 'bottom':
          x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - tooltipRect.width - 8;
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
      }

      // Keep tooltip within viewport
      x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));

      setTooltipPosition({ x, y });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  return (
    <div className="inline-flex items-center">
      <div
        ref={triggerRef}
        className="relative inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
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

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-3 max-w-xs">
            {title && (
              <p className="text-sm font-medium text-white mb-1">{title}</p>
            )}
            <p className="text-xs text-zinc-400">{content}</p>
            {learnMorePage && (
              <p className="text-xs text-emerald-400 mt-2">
                → Learn more in {learnMorePage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INLINE HELP - Inline contextual help for forms
// ============================================================================

interface InlineHelpProps {
  children: React.ReactNode;
  forBeginners?: boolean;
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  children,
  forBeginners = false,
}) => {
  const { state } = useData();
  const experienceLevel = state.settings?.experienceLevel;
  const showTooltips = state.settings?.showTooltips !== false;

  // For beginners-only help, check experience level
  if (forBeginners && experienceLevel !== 'beginner' && experienceLevel !== 'intermediate') {
    return null;
  }

  if (!showTooltips) {
    return null;
  }

  return (
    <div className="text-xs text-zinc-500 flex items-start gap-1.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
      <span>{children}</span>
    </div>
  );
};

// ============================================================================
// STEP INDICATOR - Shows current step in a workflow
// ============================================================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  variant?: 'dots' | 'numbers' | 'progress';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  variant = 'dots',
}) => {
  const progress = (currentStep / totalSteps) * 100;

  if (variant === 'progress') {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Step {currentStep} of {totalSteps}</span>
          {stepLabels[currentStep - 1] && (
            <span className="text-zinc-400">{stepLabels[currentStep - 1]}</span>
          )}
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'numbers') {
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i + 1 < currentStep
                  ? 'bg-emerald-500 text-white'
                  : i + 1 === currentStep
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {i + 1 < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`h-0.5 w-8 transition-all ${
                  i + 1 < currentStep ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Default: dots
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i + 1 <= currentStep ? 'bg-emerald-500' : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
};

// ============================================================================
// WHAT'S NEXT - Suggests next steps to the user
// ============================================================================

interface NextStepSuggestion {
  id: string;
  title: string;
  description: string;
  action: () => void;
  icon?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

interface WhatsNextProps {
  suggestions: NextStepSuggestion[];
  title?: string;
  maxItems?: number;
}

export const WhatsNext: React.FC<WhatsNextProps> = ({
  suggestions,
  title = "What's Next?",
  maxItems = 3,
}) => {
  if (suggestions.length === 0) return null;

  const displayItems = suggestions.slice(0, maxItems);

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
      <h4 className="text-sm font-medium text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {displayItems.map((item, index) => (
          <button
            key={item.id}
            onClick={item.action}
            className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-all ${
              item.priority === 'high'
                ? 'bg-emerald-950/30 border border-emerald-800/50 hover:border-emerald-600'
                : 'bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {item.icon && (
              <div className={`shrink-0 ${item.priority === 'high' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {item.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="text-xs text-zinc-500 truncate">{item.description}</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-zinc-600">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HelpTooltip;
