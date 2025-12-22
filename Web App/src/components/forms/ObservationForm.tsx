// ============================================================================
// CANONICAL OBSERVATION FORM - Single source of truth for logging observations
// Used everywhere in the app: CultureManagement, GrowManagement, ObservationTimeline
// Features: Entity selection, type dropdown, health rating, images support
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from '../common/images/ImageUploader';
import type { Culture, Grow, CultureObservation, GrowObservation } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export type ObservationEntityType = 'culture' | 'grow';

export interface ObservationFormData {
  type: string;
  notes: string;
  healthRating?: number;
  colonizationPercent?: number;
  images: string[];
}

interface ObservationFormProps {
  /** Type of entity being observed */
  entityType: ObservationEntityType;
  /** The entity being observed (for context display) */
  entity?: Culture | Grow;
  /** Entity name for display when entity not provided */
  entityName?: string;
  /** Current form data */
  data: ObservationFormData;
  /** Called when form data changes */
  onChange: (data: Partial<ObservationFormData>) => void;
  /** Called when form is submitted */
  onSubmit: () => void;
  /** Called when cancel button clicked */
  onCancel?: () => void;
  /** Whether form is currently saving */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether to show header with entity info */
  showHeader?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Whether to show cancel button */
  showCancel?: boolean;
  /** Custom submit button label */
  submitLabel?: string;
  /** Storage folder for images */
  imageFolder?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CULTURE_OBSERVATION_TYPES = [
  { value: 'general', label: 'General', description: 'General note or update' },
  { value: 'growth', label: 'Growth', description: 'Growth progress observation' },
  { value: 'contamination', label: 'Contamination', description: 'Contamination detected' },
  { value: 'transfer', label: 'Transfer', description: 'Transfer recorded' },
  { value: 'harvest', label: 'Harvest', description: 'Harvest or sampling' },
];

const GROW_OBSERVATION_TYPES = [
  { value: 'general', label: 'General', description: 'General note or update' },
  { value: 'growth', label: 'Growth', description: 'Colonization or growth progress' },
  { value: 'contamination', label: 'Contamination', description: 'Contamination detected' },
  { value: 'milestone', label: 'Milestone', description: 'Stage transition or pins' },
  { value: 'harvest', label: 'Harvest', description: 'Harvest observation' },
  { value: 'environmental', label: 'Environmental', description: 'Temp, humidity, CO2' },
];

const HEALTH_RATINGS = [
  { value: 1, label: '1', description: 'Critical', color: 'bg-red-500' },
  { value: 2, label: '2', description: 'Poor', color: 'bg-orange-500' },
  { value: 3, label: '3', description: 'Fair', color: 'bg-yellow-500' },
  { value: 4, label: '4', description: 'Good', color: 'bg-lime-500' },
  { value: 5, label: '5', description: 'Excellent', color: 'bg-emerald-500' },
];

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
};

// ============================================================================
// HEALTH RATING COMPONENT
// ============================================================================

interface HealthRatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

const HealthRatingInput: React.FC<HealthRatingInputProps> = ({ value, onChange, compact }) => {
  return (
    <div>
      <label className={`block text-sm text-zinc-400 ${compact ? 'mb-1' : 'mb-2'}`}>
        Health Rating
      </label>
      <div className="flex gap-1">
        {HEALTH_RATINGS.map((rating) => {
          const isSelected = value === rating.value;
          return (
            <button
              key={rating.value}
              type="button"
              onClick={() => onChange(rating.value)}
              title={rating.description}
              className={`
                flex-1 py-2 rounded-lg font-medium text-sm transition-all
                ${isSelected
                  ? `${rating.color} text-white`
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                }
              `}
            >
              {rating.value}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 mt-1">
        {value ? HEALTH_RATINGS.find(r => r.value === value)?.description : 'Select health rating'}
      </p>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ObservationForm: React.FC<ObservationFormProps> = ({
  entityType,
  entity,
  entityName,
  data,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  showHeader = false,
  compact = false,
  showCancel = true,
  submitLabel = 'Save Observation',
  imageFolder = 'observations',
}) => {
  // Get observation types based on entity type
  const observationTypes = useMemo(() => {
    return entityType === 'culture' ? CULTURE_OBSERVATION_TYPES : GROW_OBSERVATION_TYPES;
  }, [entityType]);

  // Determine if this is a contamination observation (affects styling)
  const isContamination = data.type === 'contamination';

  // Handle form submission
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!data.notes.trim() || isLoading) return;
    onSubmit();
  }, [data.notes, isLoading, onSubmit]);

  // Get display name
  const displayName = useMemo(() => {
    if (entityName) return entityName;
    if (entity) {
      if ('label' in entity) return entity.label; // Culture
      if ('name' in entity) return entity.name; // Grow
    }
    return `${entityType === 'culture' ? 'Culture' : 'Grow'}`;
  }, [entity, entityName, entityType]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-${compact ? '3' : '4'}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            entityType === 'culture' ? 'bg-blue-500/20' : 'bg-emerald-500/20'
          }`}>
            <span className="text-lg">
              {entityType === 'culture' ? '🧫' : '🍄'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-white">{displayName}</h3>
            <p className="text-sm text-zinc-400">Log Observation</p>
          </div>
        </div>
      )}

      {/* Observation Type */}
      <div>
        <label className={`block text-sm text-zinc-400 ${compact ? 'mb-1' : 'mb-2'}`}>
          Type *
        </label>
        <select
          value={data.type}
          onChange={(e) => onChange({ type: e.target.value })}
          className={`
            w-full ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg
            bg-zinc-800 border text-white
            focus:outline-none focus:border-emerald-500
            ${isContamination ? 'border-red-500/50' : 'border-zinc-700'}
          `}
        >
          {observationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {isContamination && (
          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-red-950/50 border border-red-800">
            <Icons.Warning />
            <span className="text-xs text-red-400">
              This will mark the {entityType} as contaminated
            </span>
          </div>
        )}
      </div>

      {/* Health Rating (for cultures) */}
      {entityType === 'culture' && (
        <HealthRatingInput
          value={data.healthRating}
          onChange={(value) => onChange({ healthRating: value })}
          compact={compact}
        />
      )}

      {/* Colonization Percent (for grows) */}
      {entityType === 'grow' && (
        <div>
          <label className={`block text-sm text-zinc-400 ${compact ? 'mb-1' : 'mb-2'}`}>
            Colonization %
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={data.colonizationPercent || 0}
              onChange={(e) => onChange({ colonizationPercent: parseInt(e.target.value) })}
              className="flex-1 h-2 rounded-lg appearance-none bg-zinc-700 accent-emerald-500"
            />
            <span className="text-sm font-medium text-white w-12 text-right">
              {data.colonizationPercent || 0}%
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className={`block text-sm text-zinc-400 ${compact ? 'mb-1' : 'mb-2'}`}>
          Notes *
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={
            isContamination
              ? "Describe the contamination: location, color, type (mold, bacteria, etc.)..."
              : "What did you observe? Growth progress, appearance, changes..."
          }
          rows={compact ? 2 : 3}
          required
          className={`
            w-full ${compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'} rounded-lg
            bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500
            focus:outline-none focus:border-emerald-500 resize-none
          `}
        />
      </div>

      {/* Images */}
      {!compact && (
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Icons.Camera />
            <label className="text-sm text-zinc-400">Photos</label>
          </div>
          <ImageUploader
            images={data.images}
            onImagesChange={(images) => onChange({ images })}
            folder={imageFolder}
            maxImages={5}
            label="Add Photos"
            className="w-full"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Document visual changes with photos. Up to 5 images.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`p-${compact ? '2' : '3'} rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm`}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex gap-${compact ? '2' : '3'} pt-2`}>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`
              flex-1 ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg
              bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50
              text-white font-medium transition-colors
            `}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!data.notes.trim() || isLoading}
          className={`
            ${showCancel && onCancel ? 'flex-1' : 'w-full'}
            ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg
            ${isContamination
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-emerald-500 hover:bg-emerald-600'
            }
            disabled:bg-zinc-700 disabled:text-zinc-500
            text-white font-medium transition-colors
            flex items-center justify-center gap-2
          `}
        >
          {isLoading ? (
            <span>Saving...</span>
          ) : (
            <>
              <Icons.Check />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const getDefaultObservationFormData = (entityType: ObservationEntityType): ObservationFormData => ({
  type: 'general',
  notes: '',
  healthRating: entityType === 'culture' ? 5 : undefined,
  colonizationPercent: entityType === 'grow' ? undefined : undefined,
  images: [],
});

// ============================================================================
// MODAL WRAPPER
// ============================================================================

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ObservationEntityType;
  entity?: Culture | Grow;
  entityName?: string;
  onSave: (data: ObservationFormData) => Promise<void>;
  imageFolder?: string;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entity,
  entityName,
  onSave,
  imageFolder,
}) => {
  const [formData, setFormData] = useState<ObservationFormData>(
    getDefaultObservationFormData(entityType)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens with new entity
  React.useEffect(() => {
    if (isOpen) {
      setFormData(getDefaultObservationFormData(entityType));
      setError(null);
    }
  }, [isOpen, entityType]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save observation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Log Observation</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <ObservationForm
            entityType={entityType}
            entity={entity}
            entityName={entityName}
            data={formData}
            onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            error={error}
            showHeader={true}
            imageFolder={imageFolder || `${entityType}-observations`}
          />
        </div>
      </div>
    </div>
  );
};

export default ObservationForm;
