// ============================================================================
// LAB SETUP PROGRESS - Persistent progress indicator for new users
// Shows setup completion status and next steps
// ============================================================================

import React, { useState } from 'react';
import { useData } from '../../store';

interface LabSetupProgressProps {
  onNavigate: (page: string) => void;
  onSetupLocations?: () => void;
  compact?: boolean;
}

const Icons = {
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Circle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M9 3h6v7l5 9H4l5-9V3z"/><path d="M9 3h6"/>
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
};

interface SetupStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
}

export const LabSetupProgress: React.FC<LabSetupProgressProps> = ({
  onNavigate,
  onSetupLocations,
  compact = false,
}) => {
  const { state } = useData();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Check setup progress
  const hasLocations = state.locations.length > 0;
  const hasCultures = state.cultures.length > 0;
  const hasGrows = state.grows.length > 0;

  // Define setup steps
  const steps: SetupStep[] = [
    {
      id: 'locations',
      label: 'Set up lab spaces',
      description: 'Define your grow areas, incubators, and storage',
      icon: <Icons.MapPin />,
      completed: hasLocations,
      action: () => onSetupLocations ? onSetupLocations() : onNavigate('labmapping'),
    },
    {
      id: 'cultures',
      label: 'Add first culture',
      description: 'Create your first spore syringe, LC, or agar plate',
      icon: <Icons.Flask />,
      completed: hasCultures,
      action: () => {
        onNavigate('cultures');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: 'cultures' } }));
        }, 100);
      },
    },
    {
      id: 'grows',
      label: 'Start first grow',
      description: 'Begin tracking your first cultivation project',
      icon: <Icons.Grow />,
      completed: hasGrows,
      action: () => {
        onNavigate('grows');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: 'grows' } }));
        }, 100);
      },
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;
  const isComplete = completedCount === steps.length;
  const nextStep = steps.find(s => !s.completed);

  // Don't show if dismissed or all steps complete
  if (dismissed || isComplete) {
    return null;
  }

  // Compact mode - just shows progress bar and next action
  if (compact) {
    return (
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-400">Lab Setup</span>
          <span className="text-xs text-emerald-400">{completedCount}/{steps.length}</span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {nextStep && (
          <button
            onClick={nextStep.action}
            className="w-full text-left text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Next: {nextStep.label}
            <Icons.ArrowRight />
          </button>
        )}
      </div>
    );
  }

  // Full mode - expandable with all steps
  return (
    <div className="bg-gradient-to-br from-blue-950/30 to-zinc-900/50 border border-blue-800/30 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-zinc-700"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
              {completedCount}/{steps.length}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Lab Setup</p>
            <p className="text-xs text-zinc-500">
              {completedCount === 0
                ? 'Get started with your lab'
                : `${steps.length - completedCount} step${steps.length - completedCount !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="p-1 text-zinc-500 hover:text-zinc-300"
            title="Dismiss"
          >
            <Icons.X />
          </button>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`w-5 h-5 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={step.completed ? undefined : step.action}
              disabled={step.completed}
              className={`w-full p-3 rounded-lg text-left flex items-center gap-3 transition-all ${
                step.completed
                  ? 'bg-emerald-950/30 border border-emerald-800/30'
                  : index === completedCount
                    ? 'bg-zinc-800/50 border border-emerald-600/50 hover:border-emerald-500'
                    : 'bg-zinc-800/30 border border-zinc-700/50 opacity-60'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : index === completedCount
                    ? 'bg-emerald-600/30 text-emerald-400'
                    : 'bg-zinc-700 text-zinc-500'
              }`}>
                {step.completed ? <Icons.Check /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.completed ? 'text-zinc-400 line-through' : 'text-white'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-zinc-500 truncate">{step.description}</p>
              </div>
              {!step.completed && index === completedCount && (
                <span className="text-xs text-emerald-400">
                  <Icons.ArrowRight />
                </span>
              )}
            </button>
          ))}

          {/* Help text */}
          <div className="pt-2 flex items-start gap-2 text-xs text-zinc-500">
            <Icons.Info />
            <span>
              Complete these steps to set up your lab. You can always adjust settings later.
            </span>
          </div>
        </div>
      )}

      {/* Quick action bar when collapsed */}
      {!expanded && nextStep && (
        <div className="px-4 pb-4">
          <button
            onClick={nextStep.action}
            className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 rounded-lg text-sm text-emerald-400 flex items-center justify-center gap-2 transition-colors"
          >
            {nextStep.icon}
            {nextStep.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default LabSetupProgress;
