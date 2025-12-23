// ============================================================================
// TIMELINE TAB
// Displays chronological event history for any entity
// Aggregates observations, status changes, transfers, harvests into unified view
// ============================================================================

import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Culture, Grow } from '../../../store/types';
import { useEntityTimeline, type TimelineEvent, type TimelineEventType } from '../useEntityTimeline';

// ============================================================================
// TYPES
// ============================================================================

interface TimelineTabProps {
  entityType: 'culture' | 'grow';
  entity: Culture | Grow;
  onEventClick?: (event: TimelineEvent) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

// ============================================================================
// EVENT TYPE CONFIGURATION
// ============================================================================

const eventTypeConfig: Record<TimelineEventType, { label: string; filterLabel: string }> = {
  created: { label: 'Created', filterLabel: 'Creation' },
  status_change: { label: 'Status Change', filterLabel: 'Status Changes' },
  stage_change: { label: 'Stage Change', filterLabel: 'Stage Changes' },
  observation: { label: 'Observation', filterLabel: 'Observations' },
  contamination: { label: 'Contamination', filterLabel: 'Contamination' },
  transfer_out: { label: 'Transfer', filterLabel: 'Transfers' },
  transfer_in: { label: 'Transfer In', filterLabel: 'Transfers In' },
  harvest: { label: 'Harvest', filterLabel: 'Harvests' },
  amendment: { label: 'Amendment', filterLabel: 'Amendments' },
  archive: { label: 'Archived', filterLabel: 'Archives' },
};

const eventColorClasses: Record<TimelineEvent['color'], { dot: string; bg: string; text: string }> = {
  emerald: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  blue: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  yellow: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  red: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
  purple: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  zinc: { dot: 'bg-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
  green: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
  amber: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

// ============================================================================
// TIMELINE EVENT COMPONENT
// ============================================================================

const TimelineEventItem: React.FC<{
  event: TimelineEvent;
  isLast: boolean;
  onClick?: () => void;
}> = ({ event, isLast, onClick }) => {
  const colors = eventColorClasses[event.color];

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-700" />
      )}

      {/* Timeline dot */}
      <div
        className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-zinc-900 ${colors.dot}`}
      />

      {/* Event content */}
      <div
        className={`
          ${colors.bg} rounded-lg p-3 mb-3
          ${onClick ? 'cursor-pointer hover:bg-opacity-20 transition-colors' : ''}
        `}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{event.icon}</span>
            <span className={`text-sm font-medium ${colors.text}`}>
              {event.title}
            </span>
          </div>
          <span className="text-xs text-zinc-500 whitespace-nowrap">
            {format(event.timestamp, 'h:mm a')}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-zinc-300 mt-1.5 ml-7">
            {event.description}
          </p>
        )}

        {/* Metadata */}
        {event.metadata && (
          <div className="flex flex-wrap gap-3 mt-2 ml-7">
            {event.metadata.healthRating !== undefined && (
              <span className="text-xs text-zinc-400">
                Health: <span className="text-zinc-200">{event.metadata.healthRating}/5</span>
              </span>
            )}
            {event.metadata.colonizationPercent !== undefined && (
              <span className="text-xs text-zinc-400">
                Colonization: <span className="text-zinc-200">{event.metadata.colonizationPercent}%</span>
              </span>
            )}
            {event.metadata.wetWeight !== undefined && (
              <span className="text-xs text-zinc-400">
                Wet: <span className="text-zinc-200">{event.metadata.wetWeight}g</span>
              </span>
            )}
            {event.metadata.dryWeight !== undefined && (
              <span className="text-xs text-zinc-400">
                Dry: <span className="text-zinc-200">{event.metadata.dryWeight}g</span>
              </span>
            )}
            {event.metadata.oldValue && event.metadata.newValue && (
              <span className="text-xs text-zinc-400">
                <span className="text-red-400/70 line-through">{event.metadata.oldValue}</span>
                {' → '}
                <span className="text-emerald-400">{event.metadata.newValue}</span>
              </span>
            )}
            {event.metadata.relatedEntityLabel && (
              <span className="text-xs text-purple-400">
                → {event.metadata.relatedEntityLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FILTER DROPDOWN
// ============================================================================

const FilterDropdown: React.FC<{
  selectedTypes: TimelineEventType[];
  onToggleType: (type: TimelineEventType) => void;
  onClear: () => void;
}> = ({ selectedTypes, onToggleType, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);

  const allTypes: TimelineEventType[] = [
    'observation',
    'status_change',
    'stage_change',
    'transfer_out',
    'harvest',
    'contamination',
    'created',
    'archive',
  ];

  const activeCount = selectedTypes.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          ${activeCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}
          hover:bg-zinc-700 transition-colors
        `}
      >
        <Icons.Filter />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 bg-emerald-500/30 rounded text-xs">
            {activeCount}
          </span>
        )}
        <Icons.ChevronDown />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 py-1">
            {allTypes.map((type) => (
              <button
                key={type}
                onClick={() => onToggleType(type)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-700 transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border ${
                    selectedTypes.includes(type)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-zinc-600'
                  } flex items-center justify-center`}
                >
                  {selectedTypes.includes(type) && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className="text-zinc-300">{eventTypeConfig[type].filterLabel}</span>
              </button>
            ))}

            {activeCount > 0 && (
              <>
                <div className="border-t border-zinc-700 my-1" />
                <button
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors text-left"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TimelineTab: React.FC<TimelineTabProps> = ({
  entityType,
  entity,
  onEventClick,
}) => {
  const [filterTypes, setFilterTypes] = useState<TimelineEventType[]>([]);

  const filter = filterTypes.length > 0 ? { types: filterTypes } : undefined;
  const { timeline, groupedTimeline, isLoading, refresh } = useEntityTimeline(
    entityType,
    entity,
    filter
  );

  const handleToggleType = (type: TimelineEventType) => {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setFilterTypes([]);
  };

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-medium text-zinc-300 mb-1">No timeline events</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Events will appear here as observations, transfers, and status changes are recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter and refresh */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          {timeline.length} event{timeline.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown
            selectedTypes={filterTypes}
            onToggleType={handleToggleType}
            onClear={handleClearFilters}
          />
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh timeline"
          >
            <Icons.Refresh />
          </button>
        </div>
      </div>

      {/* Timeline content */}
      <div className="relative">
        {groupedTimeline.map((group) => (
          <div key={group.date} className="mb-6">
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sm font-medium text-zinc-300">{group.label}</div>
              <div className="flex-1 h-px bg-zinc-800" />
              <div className="text-xs text-zinc-600">
                {group.events.length} event{group.events.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Events */}
            {group.events.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                isLast={index === group.events.length - 1}
                onClick={onEventClick ? () => onEventClick(event) : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineTab;
