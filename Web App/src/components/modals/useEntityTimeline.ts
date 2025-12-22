// ============================================================================
// USE ENTITY TIMELINE HOOK
// Aggregates history from multiple database sources into unified timeline
// Sources: observations, stage transitions, transfers, amendments, harvests
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import type {
  Culture,
  Grow,
  CultureObservation,
  GrowObservation,
  CultureTransfer,
  Flush,
} from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export type TimelineEventType =
  | 'created'
  | 'status_change'
  | 'stage_change'
  | 'observation'
  | 'contamination'
  | 'transfer_out'
  | 'transfer_in'
  | 'harvest'
  | 'amendment'
  | 'archive';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  title: string;
  description?: string;
  icon: string;
  color: 'emerald' | 'blue' | 'yellow' | 'red' | 'purple' | 'zinc' | 'green' | 'amber';

  // Additional metadata
  metadata?: {
    oldValue?: string;
    newValue?: string;
    healthRating?: number;
    colonizationPercent?: number;
    wetWeight?: number;
    dryWeight?: number;
    relatedEntityId?: string;
    relatedEntityLabel?: string;
    reason?: string;
  };
}

export interface TimelineGroup {
  date: string;         // ISO date string (YYYY-MM-DD)
  label: string;        // "Today", "Yesterday", "Dec 15, 2024"
  events: TimelineEvent[];
}

export interface UseEntityTimelineResult {
  timeline: TimelineEvent[];
  groupedTimeline: TimelineGroup[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface TimelineFilter {
  types?: TimelineEventType[];
  startDate?: Date;
  endDate?: Date;
  includeMinor?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (eventDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const getIsoDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// ============================================================================
// CULTURE TIMELINE BUILDER
// ============================================================================

const buildCultureTimeline = (culture: Culture): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Created event
  events.push({
    id: `created-${culture.id}`,
    type: 'created',
    timestamp: new Date(culture.createdAt),
    title: 'Culture created',
    description: culture.acquisitionMethod === 'purchased'
      ? 'Purchased from supplier'
      : culture.parentId
        ? 'Created from transfer'
        : 'Created in lab',
    icon: '🌱',
    color: 'emerald',
  });

  // Observations
  if (culture.observations) {
    culture.observations.forEach((obs) => {
      const isContamination = obs.type === 'contamination';

      events.push({
        id: `obs-${obs.id}`,
        type: isContamination ? 'contamination' : 'observation',
        timestamp: new Date(obs.date),
        title: isContamination ? 'Contamination detected' : `${obs.type.charAt(0).toUpperCase() + obs.type.slice(1)} observation`,
        description: obs.notes,
        icon: isContamination ? '⚠️' : '📋',
        color: isContamination ? 'red' : 'zinc',
        metadata: {
          healthRating: obs.healthRating,
        },
      });
    });
  }

  // Transfers (outgoing)
  if (culture.transfers) {
    culture.transfers.forEach((transfer) => {
      events.push({
        id: `transfer-${transfer.id}`,
        type: 'transfer_out',
        timestamp: new Date(transfer.date),
        title: 'Transfer recorded',
        description: `${transfer.quantity} ${transfer.unit} transferred to ${transfer.toType}`,
        icon: '➡️',
        color: 'purple',
        metadata: {
          relatedEntityId: transfer.toId,
        },
      });
    });
  }

  // Status changes would come from stage_transition_history table
  // For now, we infer from current status
  if (culture.status === 'contaminated') {
    // Find the contamination observation date or use updatedAt
    const contamObs = culture.observations?.find(o => o.type === 'contamination');
    const contamDate = contamObs ? new Date(contamObs.date) : new Date(culture.updatedAt);

    events.push({
      id: `status-contam-${culture.id}`,
      type: 'status_change',
      timestamp: contamDate,
      title: 'Status changed to Contaminated',
      icon: '🔴',
      color: 'red',
      metadata: {
        oldValue: 'active',
        newValue: 'contaminated',
      },
    });
  }

  if (culture.status === 'depleted') {
    events.push({
      id: `status-depleted-${culture.id}`,
      type: 'status_change',
      timestamp: new Date(culture.updatedAt),
      title: 'Status changed to Depleted',
      description: 'Culture volume exhausted',
      icon: '💧',
      color: 'amber',
      metadata: {
        oldValue: 'active',
        newValue: 'depleted',
      },
    });
  }

  if (culture.isArchived) {
    events.push({
      id: `archive-${culture.id}`,
      type: 'archive',
      timestamp: new Date(culture.updatedAt),
      title: 'Culture archived',
      icon: '📦',
      color: 'zinc',
    });
  }

  return events;
};

// ============================================================================
// GROW TIMELINE BUILDER
// ============================================================================

const buildGrowTimeline = (grow: Grow): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  // Created event
  events.push({
    id: `created-${grow.id}`,
    type: 'created',
    timestamp: new Date(grow.createdAt),
    title: 'Grow started',
    description: grow.notes,
    icon: '🌱',
    color: 'emerald',
  });

  // Observations
  if (grow.observations) {
    grow.observations.forEach((obs) => {
      const isContamination = obs.type === 'contamination';

      events.push({
        id: `obs-${obs.id}`,
        type: isContamination ? 'contamination' : 'observation',
        timestamp: new Date(obs.date),
        title: isContamination ? 'Contamination detected' : `${obs.type.charAt(0).toUpperCase() + obs.type.slice(1)} logged`,
        description: obs.notes,
        icon: isContamination ? '⚠️' : '📋',
        color: isContamination ? 'red' : 'zinc',
        metadata: {
          colonizationPercent: obs.colonizationPercent,
        },
      });
    });
  }

  // Stage changes - infer from dates if available
  const stageOrder = ['spawning', 'colonization', 'fruiting', 'harvesting', 'completed'];
  const currentStageIndex = stageOrder.indexOf(grow.currentStage);

  if (grow.colonizationStartedAt && currentStageIndex >= 1) {
    events.push({
      id: `stage-colonization-${grow.id}`,
      type: 'stage_change',
      timestamp: new Date(grow.colonizationStartedAt),
      title: 'Entered colonization stage',
      icon: '🔄',
      color: 'blue',
      metadata: { oldValue: 'spawning', newValue: 'colonization' },
    });
  }

  if (grow.fruitingStartedAt && currentStageIndex >= 2) {
    events.push({
      id: `stage-fruiting-${grow.id}`,
      type: 'stage_change',
      timestamp: new Date(grow.fruitingStartedAt),
      title: 'Entered fruiting stage',
      icon: '🍄',
      color: 'green',
      metadata: { oldValue: 'colonization', newValue: 'fruiting' },
    });
  }

  // Harvests (flushes)
  if (grow.flushes) {
    grow.flushes.forEach((flush, index) => {
      events.push({
        id: `harvest-${flush.id}`,
        type: 'harvest',
        timestamp: new Date(flush.harvestDate),
        title: `Flush ${index + 1} harvested`,
        description: flush.notes,
        icon: '🍄',
        color: 'green',
        metadata: {
          wetWeight: flush.wetWeight,
          dryWeight: flush.dryWeight,
        },
      });
    });
  }

  // Status changes
  if (grow.status === 'failed' || grow.currentStage === 'contaminated') {
    // Find contamination observation or use latest date available
    const contamObs = grow.observations?.find(o => o.type === 'contamination');
    const failedDate = contamObs ? new Date(contamObs.date) : new Date(grow.completedAt || grow.createdAt);

    events.push({
      id: `status-failed-${grow.id}`,
      type: 'status_change',
      timestamp: failedDate,
      title: 'Grow marked as failed',
      icon: '❌',
      color: 'red',
      metadata: { newValue: 'failed' },
    });
  }

  if (grow.currentStage === 'completed' && grow.completedAt) {
    events.push({
      id: `status-completed-${grow.id}`,
      type: 'status_change',
      timestamp: new Date(grow.completedAt),
      title: 'Grow completed',
      icon: '✅',
      color: 'emerald',
      metadata: { newValue: 'completed' },
    });
  }

  return events;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useEntityTimeline(
  entityType: 'culture' | 'grow',
  entity: Culture | Grow | null,
  filter?: TimelineFilter
): UseEntityTimelineResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build timeline from entity data
  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!entity) return [];

    let events: TimelineEvent[];

    if (entityType === 'culture') {
      events = buildCultureTimeline(entity as Culture);
    } else {
      events = buildGrowTimeline(entity as Grow);
    }

    // Apply filters
    if (filter) {
      if (filter.types && filter.types.length > 0) {
        events = events.filter(e => filter.types!.includes(e.type));
      }
      if (filter.startDate) {
        events = events.filter(e => e.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        events = events.filter(e => e.timestamp <= filter.endDate!);
      }
    }

    // Sort by timestamp descending (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return events;
  }, [entity, entityType, filter]);

  // Group timeline by date
  const groupedTimeline = useMemo<TimelineGroup[]>(() => {
    const groups = new Map<string, TimelineEvent[]>();

    timeline.forEach((event) => {
      const dateKey = getIsoDateString(event.timestamp);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    // Convert to array and sort by date descending
    return Array.from(groups.entries())
      .map(([date, events]) => ({
        date,
        label: formatDateLabel(new Date(date)),
        events,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timeline]);

  const refresh = useCallback(() => {
    // For now, timeline is built from entity data passed in
    // Future: Could fetch from history tables directly
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  return {
    timeline,
    groupedTimeline,
    isLoading,
    error,
    refresh,
  };
}

export default useEntityTimeline;
