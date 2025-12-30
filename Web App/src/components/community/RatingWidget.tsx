// ============================================================================
// RATING WIDGET
// Multi-dimensional rating component for species, strains, recipes, suppliers
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import type { EntityRating, EntityRatingSummary, RateableEntityType } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface RatingWidgetProps {
  entityType: RateableEntityType;
  entityId: string;
  showBreakdown?: boolean;
  allowRating?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface RatingDimension {
  key: keyof Pick<EntityRating, 'overallRating' | 'easeOfCultivation' | 'yieldPotential' | 'contaminationResistance' | 'flavorQuality'>;
  label: string;
  description: string;
  dbColumn: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Star: ({ filled, half }: { filled?: boolean; half?: boolean }) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      {half ? (
        <>
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfStar)"
            stroke="currentColor"
            strokeWidth={1.5}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </>
      ) : (
        <path
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      )}
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ============================================================================
// RATING DIMENSIONS
// ============================================================================

const ratingDimensions: RatingDimension[] = [
  {
    key: 'overallRating',
    label: 'Overall',
    description: 'Your overall experience with this species/strain',
    dbColumn: 'overall_rating',
  },
  {
    key: 'easeOfCultivation',
    label: 'Ease of Cultivation',
    description: 'How easy is it to grow successfully?',
    dbColumn: 'ease_of_cultivation',
  },
  {
    key: 'yieldPotential',
    label: 'Yield Potential',
    description: 'How productive is it?',
    dbColumn: 'yield_potential',
  },
  {
    key: 'contaminationResistance',
    label: 'Contamination Resistance',
    description: 'How resistant is it to contamination?',
    dbColumn: 'contamination_resistance',
  },
  {
    key: 'flavorQuality',
    label: 'Flavor Quality',
    description: 'How does it taste?',
    dbColumn: 'flavor_quality',
  },
];

// ============================================================================
// STAR RATING INPUT
// ============================================================================

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`flex gap-0.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onMouseLeave={() => setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          className={`
            ${sizeClasses[size]} transition-colors
            ${(hoverValue || value) >= star ? 'text-amber-400' : 'text-zinc-600'}
            hover:scale-110 transition-transform
          `}
        >
          <Icons.Star filled={(hoverValue || value) >= star} />
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// STAR RATING DISPLAY
// ============================================================================

interface StarRatingDisplayProps {
  value?: number | null;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  value,
  count,
  size = 'md',
  showValue = true,
}) => {
  if (value == null) {
    return <span className="text-zinc-500 text-sm">No ratings yet</span>;
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${sizeClasses[size]} ${value >= star ? 'text-amber-400' : value >= star - 0.5 ? 'text-amber-400' : 'text-zinc-600'}`}
          >
            <Icons.Star filled={value >= star} half={value >= star - 0.5 && value < star} />
          </span>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-zinc-400">
          {value.toFixed(1)}
          {count != null && <span className="text-zinc-500"> ({count})</span>}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// RATING BREAKDOWN
// ============================================================================

interface RatingBreakdownProps {
  summary: EntityRatingSummary;
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({ summary }) => {
  const maxCount = Math.max(...Object.values(summary.distribution));

  return (
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = summary.distribution[star.toString() as keyof typeof summary.distribution];
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 w-3">{star}</span>
            <span className="text-amber-400 w-4">
              <Icons.Star filled />
            </span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-zinc-500 w-8 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// RATING FORM MODAL
// ============================================================================

interface RatingFormProps {
  entityType: RateableEntityType;
  entityId: string;
  existingRating?: EntityRating | null;
  onClose: () => void;
  onSave: () => void;
}

const RatingForm: React.FC<RatingFormProps> = ({
  entityType,
  entityId,
  existingRating,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>({
    overallRating: existingRating?.overallRating || 0,
    easeOfCultivation: existingRating?.easeOfCultivation || 0,
    yieldPotential: existingRating?.yieldPotential || 0,
    contaminationResistance: existingRating?.contaminationResistance || 0,
    flavorQuality: existingRating?.flavorQuality || 0,
  });
  const [reviewTitle, setReviewTitle] = useState(existingRating?.reviewTitle || '');
  const [reviewText, setReviewText] = useState(existingRating?.reviewText || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || !supabase) return;

    setIsSaving(true);
    setError(null);

    try {
      const ratingData = {
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        overall_rating: ratings.overallRating || null,
        ease_of_cultivation: ratings.easeOfCultivation || null,
        yield_potential: ratings.yieldPotential || null,
        contamination_resistance: ratings.contaminationResistance || null,
        flavor_quality: ratings.flavorQuality || null,
        review_title: reviewTitle || null,
        review_text: reviewText || null,
      };

      if (existingRating) {
        const { error: updateError } = await supabase
          .from('entity_ratings')
          .update(ratingData)
          .eq('id', existingRating.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('entity_ratings')
          .insert(ratingData);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      setError(err.message || 'Failed to save rating');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {existingRating ? 'Edit Your Rating' : 'Rate This Entry'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Rating Dimensions */}
          {ratingDimensions.map((dim) => (
            <div key={dim.key}>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                {dim.label}
                {dim.key === 'overallRating' && <span className="text-red-400">*</span>}
              </label>
              <p className="text-xs text-zinc-500 mb-2">{dim.description}</p>
              <StarRatingInput
                value={ratings[dim.key] || 0}
                onChange={(value) => setRatings(prev => ({ ...prev, [dim.key]: value }))}
                size="lg"
              />
            </div>
          ))}

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Review Title (optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this species/strain..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !ratings.overallRating}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : existingRating ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN RATING WIDGET
// ============================================================================

export const RatingWidget: React.FC<RatingWidgetProps> = ({
  entityType,
  entityId,
  showBreakdown = false,
  allowRating = true,
  size = 'md',
}) => {
  const { user, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<EntityRatingSummary | null>(null);
  const [userRating, setUserRating] = useState<EntityRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const fetchRatings = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Get aggregated summary
      const { data: summaryData } = await supabase
        .rpc('get_entity_rating_summary', {
          p_entity_type: entityType,
          p_entity_id: entityId,
        });

      setSummary(summaryData || { totalRatings: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } });

      // Get user's rating (use maybeSingle to handle case where user hasn't rated)
      if (user) {
        const { data: userRatingData } = await supabase
          .from('entity_ratings')
          .select('*')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userRatingData) {
          setUserRating({
            id: userRatingData.id,
            entityType: userRatingData.entity_type,
            entityId: userRatingData.entity_id,
            userId: userRatingData.user_id,
            overallRating: userRatingData.overall_rating,
            easeOfCultivation: userRatingData.ease_of_cultivation,
            yieldPotential: userRatingData.yield_potential,
            contaminationResistance: userRatingData.contamination_resistance,
            flavorQuality: userRatingData.flavor_quality,
            reviewTitle: userRatingData.review_title,
            reviewText: userRatingData.review_text,
            status: userRatingData.status,
            helpfulVotes: userRatingData.helpful_votes || 0,
            unhelpfulVotes: userRatingData.unhelpful_votes || 0,
            createdAt: new Date(userRatingData.created_at),
            updatedAt: new Date(userRatingData.updated_at),
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch ratings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  if (isLoading) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-4 h-4 bg-zinc-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4">
        <StarRatingDisplay
          value={summary?.averageOverall}
          count={summary?.totalRatings}
          size={size}
        />

        {allowRating && isAuthenticated && (
          <button
            onClick={() => setShowRatingForm(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
          >
            <Icons.Edit />
            {userRating ? 'Edit Rating' : 'Rate'}
          </button>
        )}
      </div>

      {/* Breakdown */}
      {showBreakdown && summary && summary.totalRatings > 0 && (
        <div className="mt-4">
          <RatingBreakdown summary={summary} />

          {/* Dimension Averages */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {summary.averageEase != null && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Ease</span>
                <StarRatingDisplay value={summary.averageEase} size="sm" showValue={false} />
              </div>
            )}
            {summary.averageYield != null && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Yield</span>
                <StarRatingDisplay value={summary.averageYield} size="sm" showValue={false} />
              </div>
            )}
            {summary.averageResistance != null && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Resistance</span>
                <StarRatingDisplay value={summary.averageResistance} size="sm" showValue={false} />
              </div>
            )}
            {summary.averageFlavor != null && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Flavor</span>
                <StarRatingDisplay value={summary.averageFlavor} size="sm" showValue={false} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && (
        <RatingForm
          entityType={entityType}
          entityId={entityId}
          existingRating={userRating}
          onClose={() => setShowRatingForm(false)}
          onSave={() => {
            setShowRatingForm(false);
            fetchRatings();
          }}
        />
      )}
    </div>
  );
};

export default RatingWidget;
