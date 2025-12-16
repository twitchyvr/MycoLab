// ============================================================================
// OBSERVATION TIMELINE - Unified view of all observations
// Shows observations from cultures and grows in a chronological timeline
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import type { CultureObservation, GrowObservation, Culture, Grow } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface UnifiedObservation {
  id: string;
  date: Date;
  type: CultureObservation['type'] | GrowObservation['type'];
  entityType: 'culture' | 'grow';
  entityId: string;
  entityName: string;
  strainName: string;
  notes: string;
  title?: string;
  healthRating?: number;
  colonizationPercent?: number;
  images?: string[];
}

type FilterType = 'all' | 'culture' | 'grow';
type ObservationType = 'all' | 'general' | 'growth' | 'contamination' | 'harvest' | 'transfer' | 'check' | 'milestone';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Sprout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

// ============================================================================
// OBSERVATION TYPE CONFIG
// ============================================================================

const observationTypeConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.FC }> = {
  general: { label: 'General', color: 'text-zinc-400', bgColor: 'bg-zinc-800', icon: Icons.Check },
  growth: { label: 'Growth', color: 'text-emerald-400', bgColor: 'bg-emerald-950/50', icon: Icons.Sprout },
  contamination: { label: 'Contamination', color: 'text-red-400', bgColor: 'bg-red-950/50', icon: Icons.AlertCircle },
  harvest: { label: 'Harvest', color: 'text-amber-400', bgColor: 'bg-amber-950/50', icon: Icons.Check },
  transfer: { label: 'Transfer', color: 'text-blue-400', bgColor: 'bg-blue-950/50', icon: Icons.Culture },
  check: { label: 'Check', color: 'text-purple-400', bgColor: 'bg-purple-950/50', icon: Icons.Check },
  milestone: { label: 'Milestone', color: 'text-cyan-400', bgColor: 'bg-cyan-950/50', icon: Icons.Check },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

function groupByDate(observations: UnifiedObservation[]): Map<string, UnifiedObservation[]> {
  const groups = new Map<string, UnifiedObservation[]>();

  for (const obs of observations) {
    const dateKey = new Date(obs.date).toDateString();
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(obs);
  }

  return groups;
}

// ============================================================================
// ADD OBSERVATION MODAL
// ============================================================================

interface AddObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cultures: Culture[];
  grows: Grow[];
  strains: any[];
  onAddCultureObservation: (cultureId: string, obs: Omit<CultureObservation, 'id'>) => void;
  onAddGrowObservation: (growId: string, obs: Omit<GrowObservation, 'id'>) => void;
}

const AddObservationModal: React.FC<AddObservationModalProps> = ({
  isOpen,
  onClose,
  cultures,
  grows,
  strains,
  onAddCultureObservation,
  onAddGrowObservation,
}) => {
  const [entityType, setEntityType] = useState<'culture' | 'grow'>('culture');
  const [entityId, setEntityId] = useState('');
  const [observationType, setObservationType] = useState<string>('general');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [healthRating, setHealthRating] = useState<number | undefined>(undefined);
  const [colonizationPercent, setColonizationPercent] = useState<number | undefined>(undefined);

  const activeCultures = cultures.filter(c => c.status !== 'archived' && c.status !== 'depleted');
  const activeGrows = grows.filter(g => g.status === 'active');

  const handleSubmit = () => {
    if (!entityId || !notes) return;

    const timestamp = new Date();

    if (entityType === 'culture') {
      onAddCultureObservation(entityId, {
        date: timestamp,
        type: observationType as CultureObservation['type'],
        notes,
        healthRating,
        images: [],
      });
    } else {
      onAddGrowObservation(entityId, {
        date: timestamp,
        stage: grows.find(g => g.id === entityId)?.currentStage || 'spawning',
        type: observationType as GrowObservation['type'],
        title: title || observationType,
        notes,
        colonizationPercent,
      });
    }

    // Reset form
    setTitle('');
    setNotes('');
    setHealthRating(undefined);
    setColonizationPercent(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">Log Observation</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <Icons.X />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Entity Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => { setEntityType('culture'); setEntityId(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                entityType === 'culture'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <Icons.Culture /> Culture
            </button>
            <button
              onClick={() => { setEntityType('grow'); setEntityId(''); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                entityType === 'grow'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <Icons.Grow /> Grow
            </button>
          </div>

          {/* Entity Selection */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Select {entityType === 'culture' ? 'Culture' : 'Grow'} *
            </label>
            <select
              value={entityId}
              onChange={e => setEntityId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Choose...</option>
              {entityType === 'culture'
                ? activeCultures.map(c => {
                    const strain = strains.find(s => s.id === c.strainId);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.label} - {strain?.name || 'Unknown'}
                      </option>
                    );
                  })
                : activeGrows.map(g => {
                    const strain = strains.find(s => s.id === g.strainId);
                    return (
                      <option key={g.id} value={g.id}>
                        {g.name} - {strain?.name || 'Unknown'}
                      </option>
                    );
                  })}
            </select>
          </div>

          {/* Observation Type */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Observation Type</label>
            <select
              value={observationType}
              onChange={e => setObservationType(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {entityType === 'culture' ? (
                <>
                  <option value="general">General</option>
                  <option value="growth">Growth Progress</option>
                  <option value="contamination">Contamination</option>
                  <option value="transfer">Transfer</option>
                </>
              ) : (
                <>
                  <option value="general">General</option>
                  <option value="growth">Growth Progress</option>
                  <option value="contamination">Contamination</option>
                  <option value="harvest">Harvest</option>
                  <option value="check">Daily Check</option>
                  <option value="milestone">Milestone</option>
                </>
              )}
            </select>
          </div>

          {/* Title (for grows) */}
          {entityType === 'grow' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief observation title..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Health Rating (for cultures) */}
          {entityType === 'culture' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Health Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setHealthRating(healthRating === rating ? undefined : rating)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      healthRating === rating
                        ? rating >= 7 ? 'bg-emerald-500 text-white' :
                          rating >= 4 ? 'bg-amber-500 text-white' :
                          'bg-red-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colonization Percent (for grows) */}
          {entityType === 'grow' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Colonization %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={colonizationPercent || ''}
                onChange={e => setColonizationPercent(parseInt(e.target.value) || undefined)}
                placeholder="e.g., 75"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Notes *</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Describe what you observed..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!entityId || !notes}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            Log Observation
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// OBSERVATION CARD
// ============================================================================

interface ObservationCardProps {
  observation: UnifiedObservation;
  onNavigate?: (entityType: 'culture' | 'grow', entityId: string) => void;
}

const ObservationCard: React.FC<ObservationCardProps> = ({ observation, onNavigate }) => {
  const config = observationTypeConfig[observation.type] || observationTypeConfig.general;
  const IconComponent = config.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <span className={config.color}><IconComponent /></span>
        </div>
        <div className="w-0.5 flex-1 bg-zinc-800 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border border-current/20`}>
                {config.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                observation.entityType === 'culture' ? 'bg-blue-950/50 text-blue-400' : 'bg-emerald-950/50 text-emerald-400'
              }`}>
                {observation.entityType === 'culture' ? <Icons.Culture /> : <Icons.Grow />}
              </span>
            </div>
            <span className="text-xs text-zinc-500">{formatTime(observation.date)}</span>
          </div>

          <button
            onClick={() => onNavigate?.(observation.entityType, observation.entityId)}
            className="text-white font-medium hover:text-emerald-400 transition-colors text-left"
          >
            {observation.entityName}
          </button>
          <p className="text-xs text-zinc-500 mb-2">{observation.strainName}</p>

          {observation.title && observation.title !== observation.type && (
            <p className="text-sm text-zinc-300 font-medium mb-1">{observation.title}</p>
          )}
          <p className="text-sm text-zinc-400">{observation.notes}</p>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-3">
            {observation.healthRating !== undefined && (
              <span className={`text-xs px-2 py-1 rounded ${
                observation.healthRating >= 7 ? 'bg-emerald-950/50 text-emerald-400' :
                observation.healthRating >= 4 ? 'bg-amber-950/50 text-amber-400' :
                'bg-red-950/50 text-red-400'
              }`}>
                Health: {observation.healthRating}/10
              </span>
            )}
            {observation.colonizationPercent !== undefined && (
              <span className="text-xs px-2 py-1 rounded bg-purple-950/50 text-purple-400">
                {observation.colonizationPercent}% colonized
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type Page = 'dashboard' | 'today' | 'observations' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'settings' | 'devlog';

interface ObservationTimelineProps {
  onNavigate?: (page: Page, itemId?: string) => void;
}

export const ObservationTimeline: React.FC<ObservationTimelineProps> = ({ onNavigate }) => {
  const { state, activeStrains, addCultureObservation, addGrowObservation } = useData();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [obsTypeFilter, setObsTypeFilter] = useState<ObservationType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Build unified observation list
  const allObservations = useMemo((): UnifiedObservation[] => {
    const observations: UnifiedObservation[] = [];

    // Culture observations
    state.cultures.forEach(culture => {
      const strain = activeStrains.find(s => s.id === culture.strainId);
      (culture.observations || []).forEach(obs => {
        observations.push({
          id: obs.id,
          date: new Date(obs.date),
          type: obs.type,
          entityType: 'culture',
          entityId: culture.id,
          entityName: culture.label,
          strainName: strain?.name || 'Unknown strain',
          notes: obs.notes,
          healthRating: obs.healthRating,
          images: obs.images,
        });
      });
    });

    // Grow observations
    state.grows.forEach(grow => {
      const strain = activeStrains.find(s => s.id === grow.strainId);
      (grow.observations || []).forEach(obs => {
        observations.push({
          id: obs.id,
          date: new Date(obs.date),
          type: obs.type,
          entityType: 'grow',
          entityId: grow.id,
          entityName: grow.name,
          strainName: strain?.name || 'Unknown strain',
          notes: obs.notes,
          title: obs.title,
          colonizationPercent: obs.colonizationPercent,
        });
      });
    });

    // Sort by date (newest first)
    return observations.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [state.cultures, state.grows, activeStrains]);

  // Apply filters
  const filteredObservations = useMemo(() => {
    let filtered = allObservations;

    if (filterType !== 'all') {
      filtered = filtered.filter(o => o.entityType === filterType);
    }

    if (obsTypeFilter !== 'all') {
      filtered = filtered.filter(o => o.type === obsTypeFilter);
    }

    return filtered;
  }, [allObservations, filterType, obsTypeFilter]);

  // Group by date
  const groupedObservations = useMemo(() => {
    return groupByDate(filteredObservations);
  }, [filteredObservations]);

  const handleEntityNavigate = (entityType: 'culture' | 'grow', entityId: string) => {
    if (onNavigate) {
      // Navigate with item ID for deep-linking support
      onNavigate(entityType === 'culture' ? 'cultures' : 'grows', entityId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Observation Timeline</h2>
          <p className="text-sm text-zinc-500">{allObservations.length} total observations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icons.Plus />
          Log Observation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Icons.Filter />
          <span className="text-sm text-zinc-500">Filter:</span>
        </div>

        {/* Entity Type Filter */}
        <div className="flex gap-1">
          {(['all', 'culture', 'grow'] as FilterType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filterType === type
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {type === 'all' ? 'All' : type === 'culture' ? 'Cultures' : 'Grows'}
            </button>
          ))}
        </div>

        {/* Observation Type Filter */}
        <select
          value={obsTypeFilter}
          onChange={e => setObsTypeFilter(e.target.value as ObservationType)}
          className="px-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Types</option>
          <option value="general">General</option>
          <option value="growth">Growth</option>
          <option value="contamination">Contamination</option>
          <option value="harvest">Harvest</option>
          <option value="transfer">Transfer</option>
          <option value="check">Check</option>
          <option value="milestone">Milestone</option>
        </select>
      </div>

      {/* Timeline */}
      {filteredObservations.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
            <Icons.Calendar />
          </div>
          <h3 className="text-white font-medium mb-1">No observations yet</h3>
          <p className="text-sm text-zinc-500 mb-4">Start logging observations to track your cultures and grows.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Icons.Plus />
            Log First Observation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedObservations.entries()).map(([dateKey, observations]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Icons.Calendar />
                  <span className="text-sm font-medium">{formatRelativeDate(new Date(dateKey))}</span>
                </div>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-500">{observations.length} observation{observations.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="ml-2">
                {observations.map(obs => (
                  <ObservationCard
                    key={obs.id}
                    observation={obs}
                    onNavigate={handleEntityNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Observation Modal */}
      <AddObservationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cultures={state.cultures}
        grows={state.grows}
        strains={activeStrains}
        onAddCultureObservation={addCultureObservation}
        onAddGrowObservation={addGrowObservation}
      />
    </div>
  );
};

export default ObservationTimeline;
