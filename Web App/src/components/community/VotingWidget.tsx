// ============================================================================
// VOTING WIDGET
// Reddit-style upvote/downvote widget for suggestions and photos
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import type { SuggestionVoteCounts } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface VotingWidgetProps {
  entityType: 'suggestion' | 'photo';
  entityId: string;
  // Layout options
  layout?: 'vertical' | 'horizontal' | 'compact';
  // Show score or just buttons
  showScore?: boolean;
  // Callback when vote changes
  onVoteChange?: (voteCounts: SuggestionVoteCounts) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ArrowUp: ({ filled }: { filled?: boolean }) => (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ filled }: { filled?: boolean }) => (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

// ============================================================================
// VOTING WIDGET COMPONENT
// ============================================================================

export const VotingWidget: React.FC<VotingWidgetProps> = ({
  entityType,
  entityId,
  layout = 'vertical',
  showScore = true,
  onVoteChange,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [voteCounts, setVoteCounts] = useState<SuggestionVoteCounts>({
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  // Determine the table based on entity type
  const votesTable = entityType === 'suggestion' ? 'suggestion_votes' : 'photo_votes';
  const idColumn = entityType === 'suggestion' ? 'suggestion_id' : 'photo_id';

  // Fetch vote counts and user's vote
  const fetchVotes = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Get vote counts
      const { data: votes, error: votesError } = await supabase
        .from(votesTable)
        .select('vote_type')
        .eq(idColumn, entityId);

      if (votesError) throw votesError;

      const upvotes = votes?.filter(v => v.vote_type === 'up').length || 0;
      const downvotes = votes?.filter(v => v.vote_type === 'down').length || 0;

      // Get user's vote if authenticated
      let userVote: 'up' | 'down' | null = null;
      if (user && supabase) {
        const { data: userVoteData } = await supabase
          .from(votesTable)
          .select('vote_type')
          .eq(idColumn, entityId)
          .eq('user_id', user.id)
          .single();

        userVote = userVoteData?.vote_type as 'up' | 'down' | null;
      }

      const newCounts: SuggestionVoteCounts = {
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
      };

      setVoteCounts(newCounts);
      onVoteChange?.(newCounts);
    } catch (err) {
      console.error('Failed to fetch votes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, user, votesTable, idColumn, onVoteChange]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // Handle voting
  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || !supabase || isVoting) return;

    setIsVoting(true);

    try {
      // If clicking the same vote type, remove vote
      if (voteCounts.userVote === voteType) {
        const { error } = await supabase
          .from(votesTable)
          .delete()
          .eq(idColumn, entityId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setVoteCounts(prev => ({
          ...prev,
          upvotes: voteType === 'up' ? prev.upvotes - 1 : prev.upvotes,
          downvotes: voteType === 'down' ? prev.downvotes - 1 : prev.downvotes,
          score: voteType === 'up' ? prev.score - 1 : prev.score + 1,
          userVote: null,
        }));
      } else {
        // Upsert vote (insert or update)
        const { error } = await supabase
          .from(votesTable)
          .upsert(
            {
              [idColumn]: entityId,
              user_id: user.id,
              vote_type: voteType,
            },
            {
              onConflict: `${idColumn},user_id`,
            }
          );

        if (error) throw error;

        // Update local state
        setVoteCounts(prev => {
          const wasUpvote = prev.userVote === 'up';
          const wasDownvote = prev.userVote === 'down';

          return {
            ...prev,
            upvotes: voteType === 'up'
              ? prev.upvotes + 1
              : wasUpvote ? prev.upvotes - 1 : prev.upvotes,
            downvotes: voteType === 'down'
              ? prev.downvotes + 1
              : wasDownvote ? prev.downvotes - 1 : prev.downvotes,
            score: voteType === 'up'
              ? prev.score + (wasDownvote ? 2 : 1)
              : prev.score - (wasUpvote ? 2 : 1),
            userVote: voteType,
          };
        });
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      // Refresh to get correct state
      fetchVotes();
    } finally {
      setIsVoting(false);
    }
  };

  // Format score for display
  const formatScore = (score: number): string => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  // Layout classes
  const layoutClasses = {
    vertical: 'flex flex-col items-center gap-1',
    horizontal: 'flex items-center gap-2',
    compact: 'flex items-center gap-0.5',
  };

  const buttonClasses = `
    p-1.5 rounded-lg transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={layoutClasses[layout]}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={!isAuthenticated || isVoting}
        title={isAuthenticated ? 'Upvote' : 'Sign in to vote'}
        className={`
          ${buttonClasses}
          ${voteCounts.userVote === 'up'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'
          }
        `}
      >
        <Icons.ArrowUp filled={voteCounts.userVote === 'up'} />
      </button>

      {/* Score */}
      {showScore && (
        <span
          className={`
            font-medium text-sm min-w-[2rem] text-center
            ${voteCounts.score > 0 ? 'text-emerald-400' :
              voteCounts.score < 0 ? 'text-red-400' : 'text-zinc-400'}
          `}
        >
          {isLoading ? '–' : formatScore(voteCounts.score)}
        </span>
      )}

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={!isAuthenticated || isVoting}
        title={isAuthenticated ? 'Downvote' : 'Sign in to vote'}
        className={`
          ${buttonClasses}
          ${voteCounts.userVote === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
          }
        `}
      >
        <Icons.ArrowDown filled={voteCounts.userVote === 'down'} />
      </button>
    </div>
  );
};

// ============================================================================
// INLINE VOTING (Compact version for lists)
// ============================================================================

interface InlineVotingProps {
  entityType: 'suggestion' | 'photo';
  entityId: string;
  initialScore?: number;
  initialUserVote?: 'up' | 'down' | null;
}

export const InlineVoting: React.FC<InlineVotingProps> = ({
  entityType,
  entityId,
  initialScore = 0,
  initialUserVote = null,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const votesTable = entityType === 'suggestion' ? 'suggestion_votes' : 'photo_votes';
  const idColumn = entityType === 'suggestion' ? 'suggestion_id' : 'photo_id';

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || isVoting) return;

    setIsVoting(true);
    const previousScore = score;
    const previousVote = userVote;

    // Optimistic update
    if (userVote === voteType) {
      setScore(voteType === 'up' ? score - 1 : score + 1);
      setUserVote(null);
    } else {
      const delta = voteType === 'up'
        ? (userVote === 'down' ? 2 : 1)
        : (userVote === 'up' ? -2 : -1);
      setScore(score + delta);
      setUserVote(voteType);
    }

    try {
      if (!supabase) throw new Error('Not connected');

      if (previousVote === voteType) {
        await supabase
          .from(votesTable)
          .delete()
          .eq(idColumn, entityId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from(votesTable)
          .upsert(
            { [idColumn]: entityId, user_id: user.id, vote_type: voteType },
            { onConflict: `${idColumn},user_id` }
          );
      }
    } catch (err) {
      // Revert on error
      setScore(previousScore);
      setUserVote(previousVote);
      console.error('Vote failed:', err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote('up')}
        disabled={!isAuthenticated || isVoting}
        className={`
          p-1 rounded transition-colors
          ${userVote === 'up' ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'}
        `}
      >
        <svg className="w-4 h-4" fill={userVote === 'up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`
        text-xs font-medium min-w-[1.5rem] text-center
        ${score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-zinc-500'}
      `}>
        {score}
      </span>
      <button
        onClick={() => handleVote('down')}
        disabled={!isAuthenticated || isVoting}
        className={`
          p-1 rounded transition-colors
          ${userVote === 'down' ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}
        `}
      >
        <svg className="w-4 h-4" fill={userVote === 'down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};

export default VotingWidget;
