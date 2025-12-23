// ============================================================================
// CULTURE DETAIL MODAL
// Full-featured modal for viewing culture details with tab-based navigation
// Implements the EntityDetailModal pattern for cultures
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { EntityDetailModal, type EntityDetailTab } from './EntityDetailModal';
import { CultureOverviewTab } from './entity-tabs/CultureOverviewTab';
import { TimelineTab } from './entity-tabs/TimelineTab';
import { HistoryTab } from './entity-tabs/HistoryTab';
import { LineageTab } from './entity-tabs/LineageTab';
import { RelatedTab } from './entity-tabs/RelatedTab';
import { useData } from '../../store';
import type { Culture, CultureStatus, Grow } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface CultureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  culture: Culture;

  // Action callbacks
  onLogObservation?: () => void;
  onTransfer?: () => void;
  onEdit?: () => void;
  onDispose?: () => void;
  onNavigateToCulture?: (culture: Culture) => void;
  onNavigateToGrow?: (grow: Grow) => void;
}

// ============================================================================
// ICONS
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
  Lineage: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="6" y1="3" x2="6" y2="15"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  Related: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Share: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
};

const ActionIcons = TabIcons;

// ============================================================================
// CONFIGURATION
// ============================================================================

const cultureTypeConfig: Record<string, { icon: string; label: string }> = {
  liquid_culture: { icon: '💧', label: 'Liquid Culture' },
  agar: { icon: '🧫', label: 'Agar Plate' },
  slant: { icon: '🧪', label: 'Slant' },
  spore_syringe: { icon: '💉', label: 'Spore Syringe' },
};

const cultureStatusConfig: Record<CultureStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  colonizing: { label: 'Colonizing', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ready: { label: 'Ready', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  contaminated: { label: 'Contaminated', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  archived: { label: 'Archived', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  depleted: { label: 'Depleted', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CultureDetailModal: React.FC<CultureDetailModalProps> = ({
  isOpen,
  onClose,
  culture,
  onLogObservation,
  onTransfer,
  onEdit,
  onDispose,
  onNavigateToCulture,
  onNavigateToGrow,
}) => {
  const { getStrain, getCultureLineage } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  // Get derived data
  const strain = getStrain(culture.strainId);
  const lineage = getCultureLineage(culture.id);
  const typeConfig = cultureTypeConfig[culture.type] || cultureTypeConfig.liquid_culture;
  const statusConfig = cultureStatusConfig[culture.status] || cultureStatusConfig.active;

  // Tab configuration
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
      badge: (culture.observations?.length || 0) + (culture.transfers?.length || 0),
    },
    {
      id: 'lineage',
      label: 'Lineage',
      icon: <TabIcons.Lineage />,
      badge: lineage.ancestors.length + lineage.descendants.length || undefined,
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
  ], [culture.observations?.length, culture.transfers?.length, lineage]);

  // Render tab content
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'overview':
        return (
          <CultureOverviewTab
            culture={culture}
            onNavigateToCulture={onNavigateToCulture}
          />
        );

      case 'timeline':
        return (
          <TimelineTab
            entityType="culture"
            entity={culture}
          />
        );

      case 'lineage':
        return (
          <LineageTab
            culture={culture}
            onNavigateToCulture={onNavigateToCulture}
          />
        );

      case 'related':
        return (
          <RelatedTab
            entityType="culture"
            entity={culture}
            onNavigateToCulture={onNavigateToCulture}
            onNavigateToGrow={onNavigateToGrow}
          />
        );

      case 'history':
        return (
          <HistoryTab
            entityType="culture"
            entity={culture}
            onAmend={onEdit}
          />
        );

      default:
        return null;
    }
  }, [activeTab, culture, onNavigateToCulture, onNavigateToGrow, onEdit]);

  // Status badge component
  const statusBadge = (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
      {statusConfig.label}
    </span>
  );

  // Action bar
  const actions = (
    <div className="flex flex-wrap gap-3">
      {onLogObservation && (
        <button
          onClick={onLogObservation}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors min-h-[44px]"
        >
          <ActionIcons.Clipboard />
          <span>Log Observation</span>
        </button>
      )}
      {onTransfer && (
        <button
          onClick={onTransfer}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors min-h-[44px]"
        >
          <ActionIcons.Share />
          <span>Transfer</span>
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors min-h-[44px]"
        >
          <ActionIcons.Edit />
          <span>Edit</span>
        </button>
      )}
      {onDispose && (
        <button
          onClick={onDispose}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg transition-colors min-h-[44px] ml-auto"
        >
          <ActionIcons.Trash />
          <span>Dispose</span>
        </button>
      )}
    </div>
  );

  return (
    <EntityDetailModal
      isOpen={isOpen}
      onClose={onClose}
      entityType="culture"
      entity={culture}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={culture.label}
      subtitle={`${strain?.name || 'Unknown Strain'} • ${typeConfig.label}`}
      icon={typeConfig.icon}
      statusBadge={statusBadge}
      actions={actions}
      size="default"
    >
      {renderTabContent()}
    </EntityDetailModal>
  );
};

export default CultureDetailModal;
