// ============================================================================
// GROW MANAGEMENT (v3 - Reimagined for Growers)
// Kanban view, inline actions, Today's Focus, mobile-friendly
// ============================================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../../store';
import type { Grow, GrowStage, GrowStatus, GrowObservation, Flush, GrowOutcomeCode } from '../../store/types';
import { StandardDropdown } from '../common/StandardDropdown';
import { ExitSurveyModal, ExitSurveyData } from '../surveys';

// Draft key for localStorage
const GROW_DRAFT_KEY = 'mycolab-grow-draft';

// Stage configurations with enhanced styling
const stageConfig: Record<GrowStage, { label: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
  spawning: { label: 'Spawning', icon: '🌱', color: 'text-purple-400', bgColor: 'bg-purple-950/30', borderColor: 'border-purple-800/50' },
  colonization: { label: 'Colonizing', icon: '🔵', color: 'text-blue-400', bgColor: 'bg-blue-950/30', borderColor: 'border-blue-800/50' },
  fruiting: { label: 'Fruiting', icon: '🍄', color: 'text-emerald-400', bgColor: 'bg-emerald-950/30', borderColor: 'border-emerald-800/50' },
  harvesting: { label: 'Harvesting', icon: '✂️', color: 'text-amber-400', bgColor: 'bg-amber-950/30', borderColor: 'border-amber-800/50' },
  completed: { label: 'Complete', icon: '✅', color: 'text-green-400', bgColor: 'bg-green-950/30', borderColor: 'border-green-800/50' },
  contaminated: { label: 'Contaminated', icon: '☠️', color: 'text-red-400', bgColor: 'bg-red-950/30', borderColor: 'border-red-800/50' },
  aborted: { label: 'Aborted', icon: '⛔', color: 'text-zinc-400', bgColor: 'bg-zinc-800/50', borderColor: 'border-zinc-700' },
};

const stageOrder: GrowStage[] = ['spawning', 'colonization', 'fruiting', 'harvesting', 'completed'];
const activeStages: GrowStage[] = ['spawning', 'colonization', 'fruiting', 'harvesting'];

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Kanban: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="18 15 12 9 6 15"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

// Days active calculator
const daysActive = (startDate: Date, endDate?: Date): number => {
  const end = endDate ? new Date(endDate) : new Date();
  return Math.floor((end.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
};

// ============================================================================
// KANBAN CARD COMPONENT
// ============================================================================
interface GrowCardProps {
  grow: Grow;
  strain: { name: string } | undefined;
  container: { name: string } | undefined;
  location: { name: string } | undefined;
  isExpanded: boolean;
  isHarvesting: boolean;
  onToggleExpand: () => void;
  onAdvanceStage: () => void;
  onRecordHarvest: (wetWeight: number, dryWeight: number, quality: Flush['quality'], notes: string, mushroomCount?: number) => void;
  onMarkContaminated: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogObservation: () => void;
  compact?: boolean;
}

const GrowCard: React.FC<GrowCardProps> = ({
  grow, strain, container, location, isExpanded, isHarvesting,
  onToggleExpand, onAdvanceStage, onRecordHarvest, onMarkContaminated,
  onComplete, onEdit, onDelete, onLogObservation, compact
}) => {
  const [harvestForm, setHarvestForm] = useState({ wetWeight: 0, dryWeight: 0, quality: 'good' as Flush['quality'], notes: '', mushroomCount: undefined as number | undefined });
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const days = daysActive(grow.spawnedAt, grow.completedAt);
  const config = stageConfig[grow.currentStage];
  const isTerminal = ['completed', 'contaminated', 'aborted'].includes(grow.currentStage);
  const canHarvest = ['fruiting', 'harvesting'].includes(grow.currentStage);
  const nextStage = !isTerminal ? stageOrder[stageOrder.indexOf(grow.currentStage) + 1] : null;

  const handleSubmitHarvest = async () => {
    if (!harvestForm.wetWeight) return;
    setIsSaving(true);
    try {
      await onRecordHarvest(
        harvestForm.wetWeight,
        harvestForm.dryWeight || Math.round(harvestForm.wetWeight * 0.1),
        harvestForm.quality,
        harvestForm.notes,
        harvestForm.mushroomCount
      );
      setHarvestForm({ wetWeight: 0, dryWeight: 0, quality: 'good', notes: '', mushroomCount: undefined });
      setShowHarvestForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  // BE% calculation (rough estimate)
  const bePercent = grow.substrateWeight > 0
    ? Math.round((grow.totalYield / (grow.substrateWeight / 1000)) * 10) / 10
    : 0;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl overflow-hidden transition-all duration-200 hover:border-opacity-100`}>
      {/* Card Header - Always Visible */}
      <div className="p-3">
        {/* Top row: Name + Quick Actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{grow.name}</h4>
            <p className="text-xs text-zinc-400 truncate">{strain?.name || 'Unknown strain'}</p>
          </div>

          {/* Quick action for advancing */}
          {!isTerminal && grow.currentStage !== 'harvesting' && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdvanceStage(); }}
              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors flex-shrink-0"
              title={`Advance to ${nextStage ? stageConfig[nextStage].label : 'next stage'}`}
            >
              <Icons.ArrowRight />
            </button>
          )}
          {grow.currentStage === 'harvesting' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors flex-shrink-0"
              title="Complete Grow"
            >
              <Icons.Check />
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-zinc-400">
            <Icons.Clock />
            {days}d
          </span>
          {grow.flushes.length > 0 && (
            <span className="text-amber-400">
              {grow.flushes.length} flush{grow.flushes.length !== 1 ? 'es' : ''}
            </span>
          )}
          {grow.totalYield > 0 && (
            <span className="text-emerald-400 font-medium">{grow.totalYield}g</span>
          )}
          {bePercent > 0 && (
            <span className="text-blue-400 text-xs">{bePercent}% BE</span>
          )}
        </div>

        {/* Inline Harvest Button */}
        {canHarvest && !showHarvestForm && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowHarvestForm(true); }}
            className="mt-3 w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Scale />
            Record Harvest
          </button>
        )}

        {/* Inline Harvest Form */}
        {showHarvestForm && (
          <div className="mt-3 p-3 bg-zinc-900/50 rounded-lg space-y-3" onClick={e => e.stopPropagation()}>
            <div className="text-center text-xs text-zinc-400 mb-2">
              Flush #{grow.flushes.length + 1}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Wet (g) *</label>
                <input
                  type="number"
                  value={harvestForm.wetWeight || ''}
                  onChange={e => setHarvestForm(prev => ({ ...prev, wetWeight: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Dry (g)</label>
                <input
                  type="number"
                  value={harvestForm.dryWeight || ''}
                  onChange={e => setHarvestForm(prev => ({ ...prev, dryWeight: parseFloat(e.target.value) || 0 }))}
                  placeholder={harvestForm.wetWeight ? `~${Math.round(harvestForm.wetWeight * 0.1)}` : '0'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['excellent', 'good', 'fair', 'poor'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setHarvestForm(prev => ({ ...prev, quality: q }))}
                  className={`py-1 rounded text-xs font-medium transition-all ${
                    harvestForm.quality === q
                      ? q === 'excellent' ? 'bg-emerald-500 text-white' :
                        q === 'good' ? 'bg-blue-500 text-white' :
                        q === 'fair' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {q.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHarvestForm(false)}
                className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitHarvest}
                disabled={!harvestForm.wetWeight || isSaving}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-xs font-medium"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <button
        onClick={onToggleExpand}
        className="w-full px-3 py-1.5 bg-zinc-900/30 border-t border-zinc-800/50 flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        {isExpanded ? 'Less' : 'More'}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-zinc-800/50">
          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-500">Container</span>
              <p className="text-white">{container?.name || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-zinc-500">Location</span>
              <p className="text-white">{location?.name || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-zinc-500">Spawn Rate</span>
              <p className="text-white">{grow.spawnRate}%</p>
            </div>
            <div>
              <span className="text-zinc-500">Started</span>
              <p className="text-white">{new Date(grow.spawnedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Flush History */}
          {grow.flushes.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Harvest History</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {grow.flushes.map((flush, i) => (
                  <div key={flush.id} className="flex-shrink-0 px-2 py-1 bg-zinc-800/50 rounded text-xs">
                    <span className="text-zinc-400">F{i + 1}:</span>{' '}
                    <span className="text-emerald-400 font-medium">{flush.wetWeight}g</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800/50">
            <button
              onClick={(e) => { e.stopPropagation(); onLogObservation(); }}
              className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1"
            >
              <Icons.Clipboard />
              Log
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded"
            >
              <Icons.Edit />
            </button>
            {!isTerminal && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkContaminated(); }}
                className="p-1.5 bg-red-950/50 hover:bg-red-950 text-red-400 rounded"
                title="Mark Contaminated"
              >
                ☠️
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-red-950/50 hover:bg-red-950 text-red-400 rounded"
              title="Remove Grow"
            >
              <Icons.Trash />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TODAY'S FOCUS COMPONENT
// ============================================================================
interface FocusTask {
  id: string;
  grow: Grow;
  type: 'ready-to-advance' | 'ready-to-harvest' | 'needs-attention' | 'overdue';
  message: string;
  priority: 'high' | 'medium' | 'low';
}

const TodaysFocus: React.FC<{
  tasks: FocusTask[];
  onAdvanceStage: (growId: string) => void;
  onRecordHarvest: (growId: string) => void;
  onSelectGrow: (grow: Grow) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ tasks, onAdvanceStage, onRecordHarvest, onSelectGrow, collapsed, onToggleCollapse }) => {
  if (tasks.length === 0) return null;

  const highPriority = tasks.filter(t => t.priority === 'high');
  const otherTasks = tasks.filter(t => t.priority !== 'high');

  return (
    <div className="bg-gradient-to-r from-amber-950/30 to-orange-950/30 border border-amber-800/30 rounded-xl overflow-hidden">
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400 text-lg">⚡</span>
          <div className="text-left">
            <h3 className="text-white font-semibold">Today's Focus</h3>
            <p className="text-xs text-amber-400/70">{tasks.length} task{tasks.length !== 1 ? 's' : ''} need attention</p>
          </div>
        </div>
        {collapsed ? <Icons.ChevronDown /> : <Icons.ChevronUp />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {highPriority.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-amber-950/30 border border-amber-800/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stageConfig[task.grow.currentStage].icon}</span>
                <div>
                  <p className="text-white font-medium text-sm">{task.grow.name}</p>
                  <p className="text-xs text-amber-400">{task.message}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {task.type === 'ready-to-advance' && (
                  <button
                    onClick={() => onAdvanceStage(task.grow.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Icons.ArrowRight />
                    Advance
                  </button>
                )}
                {task.type === 'ready-to-harvest' && (
                  <button
                    onClick={() => onRecordHarvest(task.grow.id)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Icons.Scale />
                    Harvest
                  </button>
                )}
                <button
                  onClick={() => onSelectGrow(task.grow)}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                >
                  <Icons.Eye />
                </button>
              </div>
            </div>
          ))}
          {otherTasks.length > 0 && highPriority.length > 0 && (
            <div className="border-t border-amber-800/20 pt-2 mt-2" />
          )}
          {otherTasks.slice(0, 3).map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 bg-zinc-900/30 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>{stageConfig[task.grow.currentStage].icon}</span>
                <span className="text-sm text-zinc-300">{task.grow.name}</span>
                <span className="text-xs text-zinc-500">- {task.message}</span>
              </div>
              <button
                onClick={() => onSelectGrow(task.grow)}
                className="text-zinc-400 hover:text-white"
              >
                <Icons.ChevronRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const GrowManagement: React.FC = () => {
  const {
    state,
    activeStrains,
    activeLocations,
    activeContainers,
    activeSubstrateTypes,
    activeGrainTypes,
    getStrain,
    getLocation,
    getContainer,
    getSubstrateType,
    getGrainType,
    getCulture,
    addGrow,
    updateGrow,
    deleteGrow,
    advanceGrowStage,
    markGrowContaminated,
    addGrowObservation,
    addFlush,
  } = useData();

  const grows = state.grows;
  const cultures = state.cultures;

  // UI State
  type ViewMode = 'kanban' | 'grid' | 'list';
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStrain, setFilterStrain] = useState<string | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [harvestingCard, setHarvestingCard] = useState<string | null>(null);
  const [todaysFocusCollapsed, setTodaysFocusCollapsed] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedGrow, setSelectedGrow] = useState<Grow | null>(null);
  const [showExitSurveyModal, setShowExitSurveyModal] = useState(false);
  const [exitSurveyGrow, setExitSurveyGrow] = useState<Grow | null>(null);
  const [preselectedOutcome, setPreselectedOutcome] = useState<GrowOutcomeCode | undefined>(undefined);
  const [hasDraft, setHasDraft] = useState(false);

  // Form type
  interface GrowFormState {
    name: string;
    strainId: string;
    sourceCultureId: string;
    grainTypeId: string;
    spawnWeight: number;
    substrateTypeId: string;
    substrateWeight: number;
    containerId: string;
    containerCount: number;
    locationId: string;
    inoculationDate: string;
    targetTempColonization: number;
    targetTempFruiting: number;
    targetHumidity: number;
    estimatedCost: number;
    notes: string;
  }

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const defaultFormState: GrowFormState = {
    name: '',
    strainId: '',
    sourceCultureId: '',
    grainTypeId: '',
    spawnWeight: 500,
    substrateTypeId: '',
    substrateWeight: 2000,
    containerId: '',
    containerCount: 1,
    locationId: '',
    inoculationDate: getTodayString(),
    targetTempColonization: 24,
    targetTempFruiting: 22,
    targetHumidity: 90,
    estimatedCost: 0,
    notes: '',
  };

  const getInitialFormState = (): GrowFormState => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultFormState, ...parsed, inoculationDate: parsed.inoculationDate || getTodayString() };
      } catch (e) {}
    }
    return defaultFormState;
  };

  const [newGrow, setNewGrow] = useState<GrowFormState>(getInitialFormState);
  const [editGrow, setEditGrow] = useState<GrowFormState & { id: string }>({ ...defaultFormState, id: '' });

  const [newObservation, setNewObservation] = useState({
    type: 'general' as GrowObservation['type'],
    title: '',
    notes: '',
    colonizationPercent: undefined as number | undefined,
  });

  // Check for draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    setHasDraft(!!saved);
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (showCreateModal) {
      const hasData = newGrow.strainId || newGrow.name || newGrow.substrateTypeId || newGrow.containerId;
      if (hasData) {
        localStorage.setItem(GROW_DRAFT_KEY, JSON.stringify(newGrow));
        setHasDraft(true);
      }
    }
  }, [newGrow, showCreateModal]);

  const clearDraft = () => {
    localStorage.removeItem(GROW_DRAFT_KEY);
    setHasDraft(false);
  };

  const loadDraft = () => {
    const saved = localStorage.getItem(GROW_DRAFT_KEY);
    if (saved) {
      try {
        setNewGrow(JSON.parse(saved));
        setShowCreateModal(true);
      } catch (e) {}
    }
  };

  // Event listeners
  useEffect(() => {
    const handleCreateNew = (event: CustomEvent) => {
      if (event.detail?.page === 'grows') setShowCreateModal(true);
    };
    const handleSelectItem = (event: CustomEvent) => {
      if (event.detail?.type === 'grow') {
        const grow = grows.find(g => g.id === event.detail.id);
        if (grow) {
          setSelectedGrow(grow);
          setShowDetailPanel(true);
        }
      }
    };
    const handleEditItem = (event: CustomEvent) => {
      if (event.detail?.type === 'grow') {
        const grow = grows.find(g => g.id === event.detail.id);
        if (grow) {
          setSelectedGrow(grow);
          openEditModal(grow);
        }
      }
    };
    window.addEventListener('mycolab:create-new', handleCreateNew as EventListener);
    window.addEventListener('mycolab:select-item', handleSelectItem as EventListener);
    window.addEventListener('mycolab:edit-item', handleEditItem as EventListener);
    return () => {
      window.removeEventListener('mycolab:create-new', handleCreateNew as EventListener);
      window.removeEventListener('mycolab:select-item', handleSelectItem as EventListener);
      window.removeEventListener('mycolab:edit-item', handleEditItem as EventListener);
    };
  }, [grows]);

  // Sync selectedGrow with state
  useEffect(() => {
    if (selectedGrow) {
      const updated = grows.find(g => g.id === selectedGrow.id);
      if (updated) {
        if (JSON.stringify(updated) !== JSON.stringify(selectedGrow)) {
          setSelectedGrow(updated);
        }
      } else {
        setSelectedGrow(null);
        setShowDetailPanel(false);
      }
    }
  }, [grows, selectedGrow]);

  // Filtered grows
  const filteredGrows = useMemo(() => {
    let result = [...grows];

    if (!showCompleted) {
      result = result.filter(g => !['completed', 'contaminated', 'aborted'].includes(g.currentStage));
    }

    if (filterStrain !== 'all') {
      result = result.filter(g => g.strainId === filterStrain);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        getStrain(g.strainId)?.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [grows, showCompleted, filterStrain, searchQuery, getStrain]);

  // Grows grouped by stage for Kanban view
  const growsByStage = useMemo(() => {
    const stages = showCompleted ? [...stageOrder, 'contaminated' as GrowStage, 'aborted' as GrowStage] : activeStages;
    return stages.reduce((acc, stage) => {
      acc[stage] = filteredGrows.filter(g => g.currentStage === stage);
      return acc;
    }, {} as Record<GrowStage, Grow[]>);
  }, [filteredGrows, showCompleted]);

  // Today's Focus tasks
  const focusTasks = useMemo((): FocusTask[] => {
    const tasks: FocusTask[] = [];

    grows.filter(g => g.status === 'active').forEach(grow => {
      const days = daysActive(grow.spawnedAt);

      // Ready to advance from colonization (typically 10-14 days)
      if (grow.currentStage === 'colonization' && days >= 14) {
        tasks.push({
          id: `${grow.id}-advance`,
          grow,
          type: 'ready-to-advance',
          message: 'May be ready for fruiting',
          priority: days >= 21 ? 'high' : 'medium',
        });
      }

      // Ready to harvest
      if (grow.currentStage === 'fruiting' && days >= 7) {
        tasks.push({
          id: `${grow.id}-harvest`,
          grow,
          type: 'ready-to-harvest',
          message: 'Check for harvest readiness',
          priority: 'high',
        });
      }

      // Harvesting stage reminder
      if (grow.currentStage === 'harvesting') {
        tasks.push({
          id: `${grow.id}-harvesting`,
          grow,
          type: 'ready-to-harvest',
          message: `${grow.flushes.length} flush${grow.flushes.length !== 1 ? 'es' : ''} recorded`,
          priority: 'high',
        });
      }

      // Spawning stage taking too long
      if (grow.currentStage === 'spawning' && days >= 7) {
        tasks.push({
          id: `${grow.id}-slow`,
          grow,
          type: 'needs-attention',
          message: 'Still in spawning after 7 days',
          priority: 'medium',
        });
      }
    });

    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [grows]);

  // Stats
  const stats = useMemo(() => {
    const active = grows.filter(g => g.status === 'active');
    const byStage = activeStages.reduce((acc, stage) => {
      acc[stage] = active.filter(g => g.currentStage === stage).length;
      return acc;
    }, {} as Record<string, number>);
    const totalYield = grows.reduce((sum, g) => sum + g.totalYield, 0);

    return { active: active.length, byStage, totalYield };
  }, [grows]);

  // Used strains
  const usedStrainIds = useMemo(() => [...new Set(grows.map(g => g.strainId))], [grows]);

  // Ready cultures for dropdown
  const readyCultureOptions = useMemo(() =>
    cultures.filter(c => ['active', 'ready'].includes(c.status)).map(c => ({
      id: c.id,
      name: `${c.label} - ${getStrain(c.strainId)?.name || 'Unknown'}`,
    })),
    [cultures, getStrain]
  );

  // Calculated spawn rate
  const calculatedSpawnRate = useMemo(() => {
    if (!newGrow.spawnWeight || !newGrow.substrateWeight) return 0;
    return Math.round((newGrow.spawnWeight / (newGrow.spawnWeight + newGrow.substrateWeight)) * 100);
  }, [newGrow.spawnWeight, newGrow.substrateWeight]);

  // Handlers
  const toggleCardExpand = useCallback((growId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(growId)) next.delete(growId);
      else next.add(growId);
      return next;
    });
  }, []);

  const handleCreateGrow = () => {
    if (!newGrow.strainId || !newGrow.substrateTypeId || !newGrow.containerId || !newGrow.locationId) return;

    const strain = getStrain(newGrow.strainId);
    const container = getContainer(newGrow.containerId);
    const grainType = getGrainType(newGrow.grainTypeId);
    const existingCount = grows.filter(g => g.strainId === newGrow.strainId && getContainer(g.containerId)?.id === newGrow.containerId).length;
    const autoName = newGrow.name || `${strain?.name || 'Unknown'} ${container?.name || 'Grow'} #${existingCount + 1}`;

    const inoculationDate = newGrow.inoculationDate
      ? new Date(newGrow.inoculationDate + 'T12:00:00')
      : new Date();

    addGrow({
      name: autoName,
      strainId: newGrow.strainId,
      status: 'active',
      currentStage: 'spawning',
      sourceCultureId: newGrow.sourceCultureId || undefined,
      spawnType: grainType?.name || 'Unknown',
      spawnWeight: newGrow.spawnWeight,
      substrateTypeId: newGrow.substrateTypeId,
      substrateWeight: newGrow.substrateWeight,
      spawnRate: calculatedSpawnRate,
      containerId: newGrow.containerId,
      containerCount: newGrow.containerCount,
      spawnedAt: inoculationDate,
      locationId: newGrow.locationId,
      targetTempColonization: newGrow.targetTempColonization,
      targetTempFruiting: newGrow.targetTempFruiting,
      targetHumidity: newGrow.targetHumidity,
      estimatedCost: newGrow.estimatedCost,
      notes: newGrow.notes,
    });

    setShowCreateModal(false);
    clearDraft();
    setNewGrow(defaultFormState);
  };

  const openEditModal = (grow: Grow) => {
    setEditGrow({
      id: grow.id,
      name: grow.name,
      strainId: grow.strainId,
      sourceCultureId: grow.sourceCultureId || '',
      grainTypeId: '',
      spawnWeight: grow.spawnWeight,
      substrateTypeId: grow.substrateTypeId,
      substrateWeight: grow.substrateWeight,
      containerId: grow.containerId,
      containerCount: grow.containerCount,
      locationId: grow.locationId,
      inoculationDate: new Date(grow.spawnedAt).toISOString().split('T')[0],
      targetTempColonization: grow.targetTempColonization || 24,
      targetTempFruiting: grow.targetTempFruiting || 22,
      targetHumidity: grow.targetHumidity || 90,
      estimatedCost: grow.estimatedCost,
      notes: grow.notes,
    });
    setShowEditModal(true);
  };

  const handleUpdateGrow = async () => {
    if (!editGrow.id || !editGrow.strainId || !editGrow.substrateTypeId || !editGrow.containerId || !editGrow.locationId) return;

    const inoculationDate = editGrow.inoculationDate
      ? new Date(editGrow.inoculationDate + 'T12:00:00')
      : new Date();

    const newSpawnRate = editGrow.spawnWeight && editGrow.substrateWeight
      ? Math.round((editGrow.spawnWeight / (editGrow.spawnWeight + editGrow.substrateWeight)) * 100)
      : 0;

    await updateGrow(editGrow.id, {
      name: editGrow.name,
      strainId: editGrow.strainId,
      sourceCultureId: editGrow.sourceCultureId || undefined,
      spawnWeight: editGrow.spawnWeight,
      substrateTypeId: editGrow.substrateTypeId,
      substrateWeight: editGrow.substrateWeight,
      spawnRate: newSpawnRate,
      containerId: editGrow.containerId,
      containerCount: editGrow.containerCount,
      locationId: editGrow.locationId,
      spawnedAt: inoculationDate,
      targetTempColonization: editGrow.targetTempColonization,
      targetTempFruiting: editGrow.targetTempFruiting,
      targetHumidity: editGrow.targetHumidity,
      estimatedCost: editGrow.estimatedCost,
      notes: editGrow.notes,
    });

    setShowEditModal(false);
  };

  const handleAdvanceStage = async (growId: string) => {
    await advanceGrowStage(growId);
  };

  const handleRecordHarvest = async (growId: string, wetWeight: number, dryWeight: number, quality: Flush['quality'], notes: string, mushroomCount?: number) => {
    await addFlush(growId, {
      harvestDate: new Date(),
      wetWeight,
      dryWeight,
      quality,
      notes,
      mushroomCount,
    });
  };

  const handleAddObservation = () => {
    if (!selectedGrow || !newObservation.title) return;

    addGrowObservation(selectedGrow.id, {
      date: new Date(),
      stage: selectedGrow.currentStage,
      type: newObservation.type,
      title: newObservation.title,
      notes: newObservation.notes,
      colonizationPercent: newObservation.colonizationPercent,
    });

    setShowObservationModal(false);
    setNewObservation({ type: 'general', title: '', notes: '', colonizationPercent: undefined });
  };

  // Exit survey handlers
  const openExitSurvey = (grow: Grow, preselected?: GrowOutcomeCode) => {
    setExitSurveyGrow(grow);
    setPreselectedOutcome(preselected);
    setShowExitSurveyModal(true);
  };

  const handleExitSurveyComplete = async (surveyData: ExitSurveyData) => {
    if (!exitSurveyGrow) return;

    const strain = getStrain(exitSurveyGrow.strainId);
    const location = getLocation(exitSurveyGrow.locationId);

    const outcomeData = {
      entityType: 'grow' as const,
      entityId: exitSurveyGrow.id,
      entityName: exitSurveyGrow.name,
      outcomeCategory: surveyData.outcomeCategory,
      outcomeCode: surveyData.outcomeCode,
      outcomeLabel: surveyData.outcomeLabel,
      startedAt: exitSurveyGrow.spawnedAt,
      endedAt: new Date(),
      totalCost: exitSurveyGrow.estimatedCost,
      totalYieldWet: exitSurveyGrow.totalYield,
      flushCount: exitSurveyGrow.flushes.length,
      strainId: exitSurveyGrow.strainId,
      strainName: strain?.name,
      locationId: exitSurveyGrow.locationId,
      locationName: location?.name,
      surveyResponses: {
        contamination: surveyData.contamination,
        feedback: surveyData.feedback,
      },
      notes: surveyData.feedback?.notes,
    };

    await deleteGrow(exitSurveyGrow.id, outcomeData);

    setShowExitSurveyModal(false);
    setExitSurveyGrow(null);
    setPreselectedOutcome(undefined);
    if (selectedGrow?.id === exitSurveyGrow.id) {
      setSelectedGrow(null);
      setShowDetailPanel(false);
    }
  };

  const handleSkipSurvey = async () => {
    if (!exitSurveyGrow) return;

    if (confirm('Delete this grow without logging the outcome? This data helps track patterns.')) {
      await deleteGrow(exitSurveyGrow.id);
      setShowExitSurveyModal(false);
      setExitSurveyGrow(null);
      setPreselectedOutcome(undefined);
      if (selectedGrow?.id === exitSurveyGrow.id) {
        setSelectedGrow(null);
        setShowDetailPanel(false);
      }
    }
  };

  const handleMarkContaminatedWithSurvey = (grow: Grow) => {
    const days = daysActive(grow.spawnedAt);
    let outcomeCode: GrowOutcomeCode = 'contamination_mid';
    if (days <= 7) outcomeCode = 'contamination_early';
    else if (days > 21) outcomeCode = 'contamination_late';
    openExitSurvey(grow, outcomeCode);
  };

  const handleCompleteGrow = (grow: Grow) => {
    openExitSurvey(grow, 'completed_success');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Grow Tracker</h2>
          <p className="text-zinc-400 text-sm">
            {stats.active} active grow{stats.active !== 1 ? 's' : ''} • {stats.totalYield}g total yield
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasDraft && !showCreateModal && (
            <button
              onClick={loadDraft}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg text-sm font-medium"
            >
              📝 Continue Draft
            </button>
          )}
        </div>
      </div>

      {/* Today's Focus */}
      <TodaysFocus
        tasks={focusTasks}
        onAdvanceStage={handleAdvanceStage}
        onRecordHarvest={(growId) => {
          const grow = grows.find(g => g.id === growId);
          if (grow) {
            setSelectedGrow(grow);
            setExpandedCards(prev => new Set(prev).add(growId));
          }
        }}
        onSelectGrow={(grow) => {
          setSelectedGrow(grow);
          setShowDetailPanel(true);
        }}
        collapsed={todaysFocusCollapsed}
        onToggleCollapse={() => setTodaysFocusCollapsed(!todaysFocusCollapsed)}
      />

      {/* Stage Summary Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {activeStages.map(stage => {
          const config = stageConfig[stage];
          const count = stats.byStage[stage] || 0;
          return (
            <div
              key={stage}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
            >
              <div className="flex items-center gap-2">
                <span>{config.icon}</span>
                <span className="text-sm font-medium text-white">{count}</span>
                <span className={`text-xs ${config.color}`}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search grows..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterStrain}
          onChange={e => setFilterStrain(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Strains</option>
          {usedStrainIds.map(id => {
            const strain = getStrain(id);
            return strain ? <option key={id} value={id}>{strain.name}</option> : null;
          })}
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={e => setShowCompleted(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
          />
          Show completed
        </label>

        <div className="flex bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden">
          {[
            { mode: 'kanban' as ViewMode, icon: <Icons.Kanban />, label: 'Kanban' },
            { mode: 'grid' as ViewMode, icon: <Icons.Grid />, label: 'Grid' },
            { mode: 'list' as ViewMode, icon: <Icons.List />, label: 'List' },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 transition-colors ${viewMode === mode ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        // Kanban View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(showCompleted ? [...activeStages, 'completed' as GrowStage] : activeStages).map(stage => {
            const config = stageConfig[stage];
            const stageGrows = growsByStage[stage] || [];

            return (
              <div key={stage} className="flex flex-col">
                {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl ${config.bgColor} border ${config.borderColor} border-b-0`}>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span className={`font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <span className="text-xs bg-zinc-900/50 px-2 py-0.5 rounded-full text-zinc-400">
                    {stageGrows.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className={`flex-1 p-2 space-y-2 bg-zinc-900/30 border ${config.borderColor} border-t-0 rounded-b-xl min-h-[200px]`}>
                  {stageGrows.map(grow => (
                    <GrowCard
                      key={grow.id}
                      grow={grow}
                      strain={getStrain(grow.strainId)}
                      container={getContainer(grow.containerId)}
                      location={getLocation(grow.locationId)}
                      isExpanded={expandedCards.has(grow.id)}
                      isHarvesting={harvestingCard === grow.id}
                      onToggleExpand={() => toggleCardExpand(grow.id)}
                      onAdvanceStage={() => handleAdvanceStage(grow.id)}
                      onRecordHarvest={(wet, dry, quality, notes, count) => handleRecordHarvest(grow.id, wet, dry, quality, notes, count)}
                      onMarkContaminated={() => handleMarkContaminatedWithSurvey(grow)}
                      onComplete={() => handleCompleteGrow(grow)}
                      onEdit={() => openEditModal(grow)}
                      onDelete={() => openExitSurvey(grow)}
                      onLogObservation={() => {
                        setSelectedGrow(grow);
                        setShowObservationModal(true);
                      }}
                    />
                  ))}
                  {stageGrows.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 text-sm">
                      No grows in {config.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGrows.map(grow => (
            <GrowCard
              key={grow.id}
              grow={grow}
              strain={getStrain(grow.strainId)}
              container={getContainer(grow.containerId)}
              location={getLocation(grow.locationId)}
              isExpanded={expandedCards.has(grow.id)}
              isHarvesting={harvestingCard === grow.id}
              onToggleExpand={() => toggleCardExpand(grow.id)}
              onAdvanceStage={() => handleAdvanceStage(grow.id)}
              onRecordHarvest={(wet, dry, quality, notes, count) => handleRecordHarvest(grow.id, wet, dry, quality, notes, count)}
              onMarkContaminated={() => handleMarkContaminatedWithSurvey(grow)}
              onComplete={() => handleCompleteGrow(grow)}
              onEdit={() => openEditModal(grow)}
              onDelete={() => openExitSurvey(grow)}
              onLogObservation={() => {
                setSelectedGrow(grow);
                setShowObservationModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Grow</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Stage</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Days</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Flushes</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Yield</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrows.map(grow => {
                const strain = getStrain(grow.strainId);
                const config = stageConfig[grow.currentStage];
                const days = daysActive(grow.spawnedAt, grow.completedAt);
                const isTerminal = ['completed', 'contaminated', 'aborted'].includes(grow.currentStage);

                return (
                  <tr key={grow.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-3">
                      <p className="font-medium text-white">{grow.name}</p>
                      <p className="text-xs text-zinc-500">{strain?.name}</p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">{days}</td>
                    <td className="p-3 text-sm text-zinc-400">{grow.flushes.length}</td>
                    <td className="p-3 text-sm font-medium text-emerald-400">{grow.totalYield}g</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {!isTerminal && grow.currentStage !== 'harvesting' && (
                          <button
                            onClick={() => handleAdvanceStage(grow.id)}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded"
                            title="Advance Stage"
                          >
                            <Icons.ArrowRight />
                          </button>
                        )}
                        {['fruiting', 'harvesting'].includes(grow.currentStage) && (
                          <button
                            onClick={() => {
                              setSelectedGrow(grow);
                              setExpandedCards(new Set([grow.id]));
                            }}
                            className="p-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded"
                            title="Record Harvest"
                          >
                            <Icons.Scale />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(grow)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => openExitSurvey(grow)}
                          className="p-1.5 bg-red-950/50 hover:bg-red-950 text-red-400 rounded"
                          title="Remove"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredGrows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No grows found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
          >
            Start Your First Grow
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">New Grow</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Name (optional)</label>
                <input
                  type="text"
                  value={newGrow.name}
                  onChange={e => setNewGrow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Auto-generated if blank"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Strain"
                  required
                  value={newGrow.strainId}
                  onChange={value => setNewGrow(prev => ({ ...prev, strainId: value }))}
                  options={activeStrains}
                  placeholder="Select..."
                  entityType="strain"
                  fieldName="strainId"
                />
                <StandardDropdown
                  label="Source Culture"
                  value={newGrow.sourceCultureId}
                  onChange={value => setNewGrow(prev => ({ ...prev, sourceCultureId: value }))}
                  options={readyCultureOptions}
                  placeholder="None"
                  fieldName="sourceCultureId"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Spawn Type"
                  value={newGrow.grainTypeId}
                  onChange={value => setNewGrow(prev => ({ ...prev, grainTypeId: value }))}
                  options={activeGrainTypes}
                  placeholder="Select..."
                  entityType="grainType"
                  fieldName="grainTypeId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Spawn Weight (g)</label>
                  <input
                    type="number"
                    value={newGrow.spawnWeight}
                    onChange={e => setNewGrow(prev => ({ ...prev, spawnWeight: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Substrate"
                  required
                  value={newGrow.substrateTypeId}
                  onChange={value => setNewGrow(prev => ({ ...prev, substrateTypeId: value }))}
                  options={activeSubstrateTypes}
                  filterFn={s => s.category === 'bulk'}
                  placeholder="Select..."
                  entityType="substrateType"
                  fieldName="substrateTypeId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Substrate Weight (g)</label>
                  <input
                    type="number"
                    value={newGrow.substrateWeight}
                    onChange={e => setNewGrow(prev => ({ ...prev, substrateWeight: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {calculatedSpawnRate > 0 && (
                <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Calculated Spawn Rate</p>
                  <p className="text-xl font-bold text-emerald-400">{calculatedSpawnRate}%</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Container"
                  required
                  value={newGrow.containerId}
                  onChange={value => setNewGrow(prev => ({ ...prev, containerId: value }))}
                  options={activeContainers.filter(c => c.usageContext.includes('grow'))}
                  placeholder="Select..."
                  entityType="container"
                  fieldName="containerId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Count</label>
                  <input
                    type="number"
                    value={newGrow.containerCount}
                    onChange={e => setNewGrow(prev => ({ ...prev, containerCount: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Location"
                  required
                  value={newGrow.locationId}
                  onChange={value => setNewGrow(prev => ({ ...prev, locationId: value }))}
                  options={activeLocations}
                  placeholder="Select..."
                  entityType="location"
                  fieldName="locationId"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Inoculation Date</label>
                  <input
                    type="date"
                    value={newGrow.inoculationDate}
                    onChange={e => setNewGrow(prev => ({ ...prev, inoculationDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Estimated Cost ($)</label>
                <input
                  type="number"
                  value={newGrow.estimatedCost}
                  onChange={e => setNewGrow(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                  step="0.01"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newGrow.notes}
                  onChange={e => setNewGrow(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  clearDraft();
                  setNewGrow(defaultFormState);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-lg font-medium"
              >
                Save Draft
              </button>
              <button
                onClick={handleCreateGrow}
                disabled={!newGrow.strainId || !newGrow.substrateTypeId || !newGrow.containerId || !newGrow.locationId}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Create Grow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Grow</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Name</label>
                <input
                  type="text"
                  value={editGrow.name}
                  onChange={e => setEditGrow(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  label="Strain"
                  required
                  value={editGrow.strainId}
                  onChange={value => setEditGrow(prev => ({ ...prev, strainId: value }))}
                  options={activeStrains}
                  placeholder="Select..."
                  entityType="strain"
                  fieldName="strainId"
                />
                <StandardDropdown
                  label="Location"
                  required
                  value={editGrow.locationId}
                  onChange={value => setEditGrow(prev => ({ ...prev, locationId: value }))}
                  options={activeLocations}
                  placeholder="Select..."
                  entityType="location"
                  fieldName="locationId"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Inoculation Date</label>
                  <input
                    type="date"
                    value={editGrow.inoculationDate}
                    onChange={e => setEditGrow(prev => ({ ...prev, inoculationDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={editGrow.estimatedCost}
                    onChange={e => setEditGrow(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    step="0.01"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={editGrow.notes}
                  onChange={e => setEditGrow(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGrow}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal */}
      {showObservationModal && selectedGrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Log Observation</h3>
              <button onClick={() => setShowObservationModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Type</label>
                <select
                  value={newObservation.type}
                  onChange={e => setNewObservation(prev => ({ ...prev, type: e.target.value as GrowObservation['type'] }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="general">General</option>
                  <option value="environmental">Environmental</option>
                  <option value="contamination">Contamination</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Title *</label>
                <input
                  type="text"
                  value={newObservation.title}
                  onChange={e => setNewObservation(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              {selectedGrow.currentStage === 'colonization' && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Colonization %</label>
                  <input
                    type="number"
                    value={newObservation.colonizationPercent || ''}
                    onChange={e => setNewObservation(prev => ({ ...prev, colonizationPercent: parseInt(e.target.value) || undefined }))}
                    min="0"
                    max="100"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newObservation.notes}
                  onChange={e => setNewObservation(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowObservationModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddObservation}
                disabled={!newObservation.title}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Survey Modal */}
      {exitSurveyGrow && (
        <ExitSurveyModal
          isOpen={showExitSurveyModal}
          onClose={() => {
            setShowExitSurveyModal(false);
            setExitSurveyGrow(null);
            setPreselectedOutcome(undefined);
          }}
          onComplete={handleExitSurveyComplete}
          onSkip={handleSkipSurvey}
          entityType="grow"
          entityName={exitSurveyGrow.name}
          preselectedOutcome={preselectedOutcome}
        />
      )}
    </div>
  );
};

export default GrowManagement;
