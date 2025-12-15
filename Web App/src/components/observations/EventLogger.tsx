// ============================================================================
// EVENT LOGGER - General Purpose Lab Event Logging
// Log events, observations, notes, photos across the entire lab
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import { format, formatDistanceToNow, startOfDay, endOfDay, subDays } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface LabEvent {
  id: string;
  timestamp: Date;
  category: EventCategory;
  title: string;
  description?: string;
  entityType?: 'culture' | 'grow' | 'location' | 'equipment' | 'general';
  entityId?: string;
  entityName?: string;
  severity?: 'info' | 'success' | 'warning' | 'critical';
  tags?: string[];
  images?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

type EventCategory =
  | 'observation'
  | 'maintenance'
  | 'harvest'
  | 'inoculation'
  | 'transfer'
  | 'contamination'
  | 'environmental'
  | 'supply'
  | 'milestone'
  | 'note'
  | 'other';

type DateFilter = 'today' | 'week' | 'month' | 'all';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

// ============================================================================
// EVENT CATEGORY CONFIG
// ============================================================================

const categoryConfig: Record<EventCategory, { label: string; icon: string; color: string; bgColor: string }> = {
  observation: { label: 'Observation', icon: '👁️', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  maintenance: { label: 'Maintenance', icon: '🔧', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  harvest: { label: 'Harvest', icon: '🌾', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  inoculation: { label: 'Inoculation', icon: '💉', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  transfer: { label: 'Transfer', icon: '🔄', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  contamination: { label: 'Contamination', icon: '⚠️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  environmental: { label: 'Environmental', icon: '🌡️', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  supply: { label: 'Supply', icon: '📦', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  milestone: { label: 'Milestone', icon: '🏆', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  note: { label: 'Note', icon: '📝', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  other: { label: 'Other', icon: '📋', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
};

const severityConfig: Record<string, { color: string; bgColor: string }> = {
  info: { color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  success: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  warning: { color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  critical: { color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// ============================================================================
// QUICK LOG BUTTON
// ============================================================================

interface QuickLogButtonProps {
  category: EventCategory;
  onClick: () => void;
}

const QuickLogButton: React.FC<QuickLogButtonProps> = ({ category, onClick }) => {
  const config = categoryConfig[category];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all ${config.bgColor}`}
    >
      <span className="text-2xl">{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </button>
  );
};

// ============================================================================
// EVENT CARD
// ============================================================================

const EventCard: React.FC<{
  event: LabEvent;
  onView: () => void;
}> = ({ event, onView }) => {
  const config = categoryConfig[event.category];
  const severityStyle = event.severity ? severityConfig[event.severity] : null;

  return (
    <div
      onClick={onView}
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 text-xl`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium text-white">{event.title}</h4>
            {event.severity && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${severityStyle?.bgColor} ${severityStyle?.color}`}>
                {event.severity}
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-zinc-400 line-clamp-2 mb-2">{event.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Icons.Clock />
              {formatDistanceToNow(event.timestamp, { addSuffix: true })}
            </span>
            {event.entityName && (
              <span className="flex items-center gap-1">
                <Icons.Tag />
                {event.entityName}
              </span>
            )}
            {event.tags && event.tags.length > 0 && (
              <span className="flex items-center gap-1">
                {event.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                    {tag}
                  </span>
                ))}
                {event.tags.length > 2 && <span>+{event.tags.length - 2}</span>}
              </span>
            )}
          </div>
        </div>

        {/* Images indicator */}
        {event.images && event.images.length > 0 && (
          <div className="flex-shrink-0 text-zinc-500">
            <Icons.Camera />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ADD EVENT MODAL
// ============================================================================

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: EventCategory;
  onAdd: (event: Omit<LabEvent, 'id' | 'createdAt'>) => void;
  cultures: { id: string; label: string; strainName?: string }[];
  grows: { id: string; name: string; strainName?: string }[];
  locations: { id: string; name: string }[];
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  onAdd,
  cultures,
  grows,
  locations,
}) => {
  const [category, setCategory] = useState<EventCategory>(initialCategory || 'observation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<'culture' | 'grow' | 'location' | 'equipment' | 'general'>('general');
  const [entityId, setEntityId] = useState('');
  const [severity, setSeverity] = useState<'info' | 'success' | 'warning' | 'critical'>('info');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    let entityName: string | undefined;
    if (entityType === 'culture' && entityId) {
      entityName = cultures.find(c => c.id === entityId)?.label;
    } else if (entityType === 'grow' && entityId) {
      entityName = grows.find(g => g.id === entityId)?.name;
    } else if (entityType === 'location' && entityId) {
      entityName = locations.find(l => l.id === entityId)?.name;
    }

    onAdd({
      timestamp: new Date(),
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      entityType: entityType !== 'general' ? entityType : undefined,
      entityId: entityId || undefined,
      entityName,
      severity,
      tags: tags.split(',').map(t => t.trim()).filter(t => t) || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setEntityType('general');
    setEntityId('');
    setSeverity('info');
    setTags('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h3 className="text-lg font-semibold text-white">Log Event</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <Icons.Close />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(categoryConfig) as EventCategory[]).slice(0, 8).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    category === cat
                      ? `${categoryConfig[cat].bgColor} border-${categoryConfig[cat].color.replace('text-', '')}/30`
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-xl">{categoryConfig[cat].icon}</span>
                  <span className="text-xs text-zinc-400">{categoryConfig[cat].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="Brief description of the event..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Details</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
              placeholder="Additional notes, observations, or details..."
            />
          </div>

          {/* Entity Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Link to</label>
              <select
                value={entityType}
                onChange={e => { setEntityType(e.target.value as any); setEntityId(''); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="general">General (no link)</option>
                <option value="culture">Culture</option>
                <option value="grow">Grow</option>
                <option value="location">Location</option>
              </select>
            </div>
            {entityType !== 'general' && (
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Select {entityType}</label>
                <select
                  value={entityId}
                  onChange={e => setEntityId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Choose...</option>
                  {entityType === 'culture' && cultures.map(c => (
                    <option key={c.id} value={c.id}>{c.label} {c.strainName ? `(${c.strainName})` : ''}</option>
                  ))}
                  {entityType === 'grow' && grows.map(g => (
                    <option key={g.id} value={g.id}>{g.name} {g.strainName ? `(${g.strainName})` : ''}</option>
                  ))}
                  {entityType === 'location' && locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Severity</label>
            <div className="flex gap-2">
              {(['info', 'success', 'warning', 'critical'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    severity === sev
                      ? `${severityConfig[sev].bgColor} ${severityConfig[sev].color} border border-current`
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g., urgent, follow-up, keeper"
            />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
          >
            Log Event
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EventLogger: React.FC = () => {
  const { state, getStrain, addCultureObservation, addGrowObservation } = useData();

  // State
  const [events, setEvents] = useState<LabEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialCategory, setInitialCategory] = useState<EventCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Prepare entity lists for the modal
  const cultures = useMemo(() => {
    return state.cultures
      .filter(c => c.status !== 'archived' && c.status !== 'depleted')
      .map(c => ({
        id: c.id,
        label: c.label,
        strainName: c.strainId ? getStrain(c.strainId)?.name : undefined,
      }));
  }, [state.cultures, getStrain]);

  const grows = useMemo(() => {
    return state.grows
      .filter(g => g.status === 'active')
      .map(g => ({
        id: g.id,
        name: g.name,
        strainName: g.strainId ? getStrain(g.strainId)?.name : undefined,
      }));
  }, [state.grows, getStrain]);

  const locations = useMemo(() => {
    return state.locations
      .filter(l => l.isActive)
      .map(l => ({ id: l.id, name: l.name }));
  }, [state.locations]);

  // Convert existing observations to events
  const allEvents = useMemo(() => {
    const combined: LabEvent[] = [...events];

    // Add culture observations
    state.cultures.forEach(culture => {
      const strain = culture.strainId ? getStrain(culture.strainId) : undefined;
      culture.observations?.forEach(obs => {
        combined.push({
          id: `culture-obs-${culture.id}-${obs.id}`,
          timestamp: new Date(obs.date),
          category: obs.type === 'contamination' ? 'contamination' :
                   obs.type === 'transfer' ? 'transfer' :
                   obs.type === 'growth' ? 'observation' : 'observation',
          title: `${obs.type.charAt(0).toUpperCase() + obs.type.slice(1)} - ${culture.label}`,
          description: obs.notes,
          entityType: 'culture',
          entityId: culture.id,
          entityName: `${culture.label} (${strain?.name || 'Unknown'})`,
          severity: obs.type === 'contamination' ? 'critical' : 'info',
          images: obs.images,
          metadata: { healthRating: obs.healthRating },
          createdAt: new Date(obs.date),
        });
      });
    });

    // Add grow observations
    state.grows.forEach(grow => {
      const strain = grow.strainId ? getStrain(grow.strainId) : undefined;
      grow.observations?.forEach(obs => {
        combined.push({
          id: `grow-obs-${grow.id}-${obs.id}`,
          timestamp: new Date(obs.date),
          category: obs.type === 'contamination' ? 'contamination' :
                   obs.type === 'milestone' ? 'milestone' :
                   obs.type === 'environmental' ? 'environmental' : 'observation',
          title: obs.title || `${obs.type} - ${grow.name}`,
          description: obs.notes,
          entityType: 'grow',
          entityId: grow.id,
          entityName: `${grow.name} (${strain?.name || 'Unknown'})`,
          severity: obs.type === 'contamination' ? 'critical' :
                   obs.type === 'milestone' ? 'success' : 'info',
          metadata: { colonizationPercent: obs.colonizationPercent },
          createdAt: new Date(obs.date),
        });
      });
    });

    // Sort by timestamp descending
    return combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events, state.cultures, state.grows, getStrain]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchable = [
          event.title,
          event.description,
          event.entityName,
          ...(event.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const eventDate = event.timestamp;
        if (dateFilter === 'today') {
          if (eventDate < startOfDay(now) || eventDate > endOfDay(now)) return false;
        } else if (dateFilter === 'week') {
          if (eventDate < subDays(now, 7)) return false;
        } else if (dateFilter === 'month') {
          if (eventDate < subDays(now, 30)) return false;
        }
      }

      return true;
    });
  }, [allEvents, searchQuery, categoryFilter, dateFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayEvents = allEvents.filter(e =>
      e.timestamp >= startOfDay(today) && e.timestamp <= endOfDay(today)
    );
    const weekEvents = allEvents.filter(e => e.timestamp >= subDays(today, 7));

    return {
      total: allEvents.length,
      today: todayEvents.length,
      thisWeek: weekEvents.length,
      critical: allEvents.filter(e => e.severity === 'critical').length,
    };
  }, [allEvents]);

  // Add event handler
  const handleAddEvent = (event: Omit<LabEvent, 'id' | 'createdAt'>) => {
    const newEvent: LabEvent = {
      ...event,
      id: `event-${Date.now()}`,
      createdAt: new Date(),
    };

    // If linked to culture/grow, also add as observation
    if (event.entityType === 'culture' && event.entityId) {
      addCultureObservation(event.entityId, {
        date: event.timestamp,
        type: event.category === 'contamination' ? 'contamination' :
              event.category === 'transfer' ? 'transfer' : 'general',
        notes: `${event.title}${event.description ? '\n' + event.description : ''}`,
        images: event.images || [],
      });
    } else if (event.entityType === 'grow' && event.entityId) {
      const grow = state.grows.find(g => g.id === event.entityId);
      addGrowObservation(event.entityId, {
        date: event.timestamp,
        stage: grow?.currentStage || 'spawning',
        type: event.category === 'harvest' ? 'milestone' :  // harvest logged as milestone
              event.category === 'contamination' ? 'contamination' :
              event.category === 'milestone' ? 'milestone' :
              event.category === 'environmental' ? 'environmental' : 'general',
        title: event.title,
        notes: event.description || '',
      });
    }

    setEvents(prev => [newEvent, ...prev]);
  };

  // Quick log handler
  const handleQuickLog = (category: EventCategory) => {
    setInitialCategory(category);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Icons.Clipboard />
            Event Logger
          </h1>
          <p className="text-zinc-400 mt-1">Log observations, notes, and events across your lab</p>
        </div>
        <button
          onClick={() => { setInitialCategory(undefined); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Icons.Plus />
          Log Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Events</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Today</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.today}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-bold text-blue-400">{stats.thisWeek}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Critical</p>
          <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
        </div>
      </div>

      {/* Quick Log Buttons */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Quick Log</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {(['observation', 'harvest', 'inoculation', 'transfer', 'contamination', 'environmental', 'maintenance', 'note'] as EventCategory[]).map(cat => (
            <QuickLogButton key={cat} category={cat} onClick={() => handleQuickLog(cat)} />
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Icons.Search />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Icons.Filter />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as EventCategory | 'all')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.icon} {config.label}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Icons.Clock />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Icons.Clipboard />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
            <p className="text-zinc-400 max-w-md mx-auto mb-6">
              {searchQuery || categoryFilter !== 'all' || dateFilter !== 'all'
                ? 'No events match your current filters.'
                : 'Start logging events to track your lab activities.'}
            </p>
            <button
              onClick={() => { setInitialCategory(undefined); setShowAddModal(true); }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              Log First Event
            </button>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onView={() => {}}
            />
          ))
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        initialCategory={initialCategory}
        onAdd={handleAddEvent}
        cultures={cultures}
        grows={grows}
        locations={locations}
      />
    </div>
  );
};

export default EventLogger;
