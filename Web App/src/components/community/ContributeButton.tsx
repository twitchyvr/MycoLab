// ============================================================================
// CONTRIBUTE BUTTON
// Enticing call-to-action for users to contribute to library entries
// ============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { ContributionModal } from './ContributionModal';

// ============================================================================
// TYPES
// ============================================================================

interface ContributeButtonProps {
  entityType: 'species' | 'strain';
  entityId: string;
  entityName: string;
  // Optional: pre-fill with existing data for corrections
  existingData?: Record<string, any>;
  // Button style variants
  variant?: 'primary' | 'secondary' | 'subtle' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Contribute: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Lightbulb: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Heart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

// ============================================================================
// CONTRIBUTE BUTTON COMPONENT
// ============================================================================

export const ContributeButton: React.FC<ContributeButtonProps> = ({
  entityType,
  entityId,
  entityName,
  existingData,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setShowModal(true);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  // Variant classes
  const variantClasses = {
    primary: `
      bg-gradient-to-r from-emerald-500 to-teal-500
      hover:from-emerald-600 hover:to-teal-600
      text-white font-medium
      shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
      border border-emerald-400/20
    `,
    secondary: `
      bg-zinc-800 hover:bg-zinc-700
      text-emerald-400 hover:text-emerald-300
      border border-zinc-700 hover:border-zinc-600
    `,
    subtle: `
      bg-transparent hover:bg-zinc-800/50
      text-zinc-400 hover:text-emerald-400
      border border-transparent hover:border-zinc-700
    `,
    floating: `
      fixed bottom-6 right-6 z-40
      bg-gradient-to-r from-emerald-500 to-teal-500
      hover:from-emerald-600 hover:to-teal-600
      text-white font-medium
      shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50
      border border-emerald-400/20
      rounded-full !px-5 !py-3
    `,
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center
          rounded-lg transition-all duration-200
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
      >
        <Icons.Lightbulb />
        <span>Contribute</span>
      </button>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <Icons.Users />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Join the Community
              </h3>
              <p className="text-zinc-400 mb-6">
                Sign in to contribute your knowledge and help other cultivators!
                Your contributions will be reviewed and can help improve the library for everyone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
                <a
                  href="/login"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {showModal && (
        <ContributionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
          existingData={existingData}
        />
      )}
    </>
  );
};

// ============================================================================
// CONTRIBUTION STATS (Shows community engagement)
// ============================================================================

interface ContributionStatsProps {
  totalContributions: number;
  pendingReview: number;
  approved: number;
}

export const ContributionStats: React.FC<ContributionStatsProps> = ({
  totalContributions,
  pendingReview,
  approved,
}) => {
  return (
    <div className="flex items-center gap-4 text-sm text-zinc-400">
      <div className="flex items-center gap-1">
        <Icons.Users />
        <span>{totalContributions} contributions</span>
      </div>
      {pendingReview > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <span>{pendingReview} pending review</span>
        </div>
      )}
      {approved > 0 && (
        <div className="flex items-center gap-1 text-emerald-400">
          <span>{approved} approved</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// QUICK CONTRIBUTE ACTIONS (For detail views)
// ============================================================================

interface QuickContributeActionsProps {
  entityType: 'species' | 'strain';
  entityId: string;
  entityName: string;
  onSuggestEdit: () => void;
  onAddPhoto: () => void;
  onReportIssue: () => void;
}

export const QuickContributeActions: React.FC<QuickContributeActionsProps> = ({
  entityType,
  entityId,
  entityName,
  onSuggestEdit,
  onAddPhoto,
  onReportIssue,
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-800/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icons.Heart />
        <h4 className="text-sm font-medium text-emerald-400">Help Improve This Entry</h4>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        Share your knowledge with the community! Contributions are reviewed before being published.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSuggestEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:text-white transition-colors"
        >
          <Icons.Edit />
          Suggest Edit
        </button>
        <button
          onClick={onAddPhoto}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:text-white transition-colors"
        >
          <Icons.Camera />
          Add Photo
        </button>
        <button
          onClick={onReportIssue}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:text-white transition-colors"
        >
          Report Issue
        </button>
      </div>
    </div>
  );
};

export default ContributeButton;
