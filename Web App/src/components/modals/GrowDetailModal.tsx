// ============================================================================
// GROW DETAIL MODAL
// Full-featured modal for viewing grow details with tabbed navigation
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { EntityDetailModal, EntityDetailTab } from './EntityDetailModal';
import { GrowOverviewTab } from './entity-tabs/GrowOverviewTab';
import { TimelineTab } from './entity-tabs/TimelineTab';
import { HistoryTab } from './entity-tabs/HistoryTab';
import { RelatedTab } from './entity-tabs/RelatedTab';
import { useEntityTimeline } from './useEntityTimeline';
import { useData } from '../../store';
import type { Grow, GrowStage, Culture } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface GrowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  grow: Grow;
  onLogObservation?: () => void;
  onRecordHarvest?: () => void;
  onAdvanceStage?: () => void;
  onMarkContaminated?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onDispose?: () => void;
  onNavigateToCulture?: (culture: Culture) => void;
}

// ============================================================================
// STAGE CONFIG
// ============================================================================

const stageConfig: Record<GrowStage, { label: string; icon: string; color: string; bgColor: string }> = {
  spawning: { label: 'Spawning', icon: '🌱', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  colonization: { label: 'Colonizing', icon: '🔵', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  fruiting: { label: 'Fruiting', icon: '🍄', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  harvesting: { label: 'Harvesting', icon: '✂️', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  completed: { label: 'Complete', icon: '✅', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  contaminated: { label: 'Contaminated', icon: '☠️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  aborted: { label: 'Aborted', icon: '⛔', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
};

// ============================================================================
// TAB ICONS
// ============================================================================

const TabIcons = {
  Overview: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  Timeline: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 8v4l3 3"/>
      <path d="M3.05 11a9 9 0 1 1 .5 4"/>
      <path d="M3 16v-5h5"/>
    </svg>
  ),
  Related: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GrowDetailModal: React.FC<GrowDetailModalProps> = ({
  isOpen,
  onClose,
  grow,
  onLogObservation,
  onRecordHarvest,
  onAdvanceStage,
  onMarkContaminated,
  onComplete,
  onEdit,
  onDispose,
  onNavigateToCulture,
}) => {
  const { getStrain } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  // Get timeline data
  const { timeline } = useEntityTimeline('grow', grow);

  // Derived data
  const strain = getStrain(grow.strainId);
  const config = stageConfig[grow.currentStage];
  const isTerminal = ['completed', 'contaminated', 'aborted'].includes(grow.currentStage);
  const canHarvest = ['fruiting', 'harvesting'].includes(grow.currentStage);

  // Tabs configuration
  const tabs: EntityDetailTab[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Overview',
      icon: <TabIcons.Overview />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <TabIcons.Timeline />,
      badge: timeline.length > 0 ? timeline.length : undefined,
    },
    {
      id: 'related',
      label: 'Related',
      icon: <TabIcons.Related />,
    },
    {
      id: 'history',
      label: 'History',
      icon: <TabIcons.History />,
    },
  ], [timeline.length]);

  // Status badge
  const statusBadge = (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );

  // Render active tab content
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <GrowOverviewTab
            grow={grow}
            onLogObservation={onLogObservation}
            onRecordHarvest={canHarvest ? onRecordHarvest : undefined}
            onAdvanceStage={!isTerminal && grow.currentStage !== 'harvesting' ? onAdvanceStage : undefined}
            onMarkContaminated={!isTerminal ? onMarkContaminated : undefined}
          />
        );

      case 'timeline':
        return (
          <TimelineTab
            entityType="grow"
            entity={grow}
          />
        );

      case 'related':
        return (
          <RelatedTab
            entityType="grow"
            entity={grow}
            onNavigateToCulture={onNavigateToCulture}
          />
        );

      case 'history':
        return (
          <HistoryTab
            entityType="grow"
            entity={grow}
          />
        );

      default:
        return null;
    }
  }, [activeTab, grow, onLogObservation, onRecordHarvest, onAdvanceStage, onMarkContaminated, onNavigateToCulture, canHarvest, isTerminal]);

  // Footer actions
  const actions = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {!isTerminal && onLogObservation && (
          <button
            onClick={onLogObservation}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Log Observation
          </button>
        )}
        {canHarvest && onRecordHarvest && (
          <button
            onClick={onRecordHarvest}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium transition-colors"
          >
            Record Harvest
          </button>
        )}
        {grow.currentStage === 'harvesting' && onComplete && (
          <button
            onClick={onComplete}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg text-sm font-medium transition-colors"
          >
            Complete Grow
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
        )}
        {onDispose && (
          <button
            onClick={onDispose}
            className="px-4 py-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            Dispose
          </button>
        )}
      </div>
    </div>
  );

  return (
    <EntityDetailModal
      isOpen={isOpen}
      onClose={onClose}
      entityType="grow"
      entity={grow}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={grow.name}
      subtitle={strain?.name || 'Unknown strain'}
      icon="🍄"
      statusBadge={statusBadge}
      actions={actions}
      size="wide"
    >
      {renderTabContent()}
    </EntityDetailModal>
  );
};

export default GrowDetailModal;
