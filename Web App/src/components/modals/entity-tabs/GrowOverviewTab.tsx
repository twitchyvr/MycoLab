// ============================================================================
// GROW OVERVIEW TAB
// Clean summary view of a grow with key metrics, stage progression, and harvests
// ============================================================================

import React, { useMemo } from 'react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { useData } from '../../../store';
import type { Grow, GrowStage } from '../../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface GrowOverviewTabProps {
  grow: Grow;
  onLogObservation?: () => void;
  onRecordHarvest?: () => void;
  onAdvanceStage?: () => void;
  onMarkContaminated?: () => void;
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

const stageOrder: GrowStage[] = ['spawning', 'colonization', 'fruiting', 'harvesting', 'completed'];

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
};

// ============================================================================
// STAGE PROGRESS BAR
// ============================================================================

const StageProgressBar: React.FC<{ currentStage: GrowStage }> = ({ currentStage }) => {
  const currentIndex = stageOrder.indexOf(currentStage);
  const isTerminal = ['contaminated', 'aborted'].includes(currentStage);

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">Stage Progress</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageConfig[currentStage].bgColor} ${stageConfig[currentStage].color}`}>
          {stageConfig[currentStage].icon} {stageConfig[currentStage].label}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {stageOrder.map((stage, index) => {
          const isCompleted = !isTerminal && index < currentIndex;
          const isCurrent = stage === currentStage;
          const config = stageConfig[stage];

          return (
            <React.Fragment key={stage}>
              <div
                className={`
                  flex-1 h-2 rounded-full transition-colors
                  ${isCompleted ? 'bg-emerald-500' : isCurrent ? config.bgColor.replace('/20', '/50') : 'bg-zinc-700'}
                `}
                title={config.label}
              />
              {index < stageOrder.length - 1 && (
                <div className="w-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {isTerminal && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${stageConfig[currentStage].color}`}>
          <Icons.AlertTriangle />
          <span>Grow ended: {stageConfig[currentStage].label}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HARVEST HISTORY CARD
// ============================================================================

const HarvestHistoryCard: React.FC<{ grow: Grow }> = ({ grow }) => {
  if (grow.flushes.length === 0) return null;

  const totalWet = grow.flushes.reduce((sum, f) => sum + f.wetWeight, 0);
  const totalDry = grow.flushes.reduce((sum, f) => sum + (f.dryWeight || 0), 0);

  return (
    <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-amber-300">Harvest History</h4>
        <span className="text-xs text-zinc-400">{grow.flushes.length} flush{grow.flushes.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="space-y-2">
        {grow.flushes.map((flush, index) => (
          <div key={flush.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                {index + 1}
              </span>
              <div>
                <div className="text-sm text-white">{flush.wetWeight}g wet</div>
                {flush.dryWeight && (
                  <div className="text-xs text-zinc-400">{flush.dryWeight}g dry</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400">
                {format(new Date(flush.harvestDate), 'MMM d')}
              </div>
              {flush.quality && (
                <div className={`text-xs ${
                  flush.quality === 'excellent' ? 'text-emerald-400' :
                  flush.quality === 'good' ? 'text-blue-400' :
                  flush.quality === 'fair' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {flush.quality}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between text-sm">
        <span className="text-zinc-400">Total</span>
        <span className="text-emerald-400 font-medium">
          {totalWet}g wet {totalDry > 0 && `/ ${totalDry}g dry`}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GrowOverviewTab: React.FC<GrowOverviewTabProps> = ({
  grow,
  onLogObservation,
  onRecordHarvest,
  onAdvanceStage,
  onMarkContaminated,
}) => {
  const { getStrain, getLocation, getContainer, getSubstrateType, getCulture } = useData();

  // Derived data
  const strain = getStrain(grow.strainId);
  const location = getLocation(grow.locationId);
  const container = getContainer(grow.containerId);
  const substrateType = getSubstrateType(grow.substrateTypeId);
  const sourceCulture = grow.sourceCultureId ? getCulture(grow.sourceCultureId) : null;

  // Calculate days in each stage
  const daysActive = useMemo(() => {
    const end = grow.completedAt ? new Date(grow.completedAt) : new Date();
    return differenceInDays(end, new Date(grow.spawnedAt));
  }, [grow.spawnedAt, grow.completedAt]);

  const daysInCurrentStage = useMemo(() => {
    let stageStart = new Date(grow.spawnedAt);
    if (grow.currentStage === 'colonization' && grow.colonizationStartedAt) {
      stageStart = new Date(grow.colonizationStartedAt);
    } else if (grow.currentStage === 'fruiting' && grow.fruitingStartedAt) {
      stageStart = new Date(grow.fruitingStartedAt);
    } else if (grow.currentStage === 'harvesting' && grow.firstHarvestAt) {
      stageStart = new Date(grow.firstHarvestAt);
    }
    const end = grow.completedAt ? new Date(grow.completedAt) : new Date();
    return differenceInDays(end, stageStart);
  }, [grow]);

  // Biological efficiency
  const bePercent = useMemo(() => {
    if (grow.substrateWeight <= 0 || grow.totalYield <= 0) return 0;
    return Math.round((grow.totalYield / (grow.substrateWeight / 1000)) * 10) / 10;
  }, [grow.substrateWeight, grow.totalYield]);

  // Status helpers
  const isTerminal = ['completed', 'contaminated', 'aborted'].includes(grow.currentStage);
  const canHarvest = ['fruiting', 'harvesting'].includes(grow.currentStage);
  const canAdvance = !isTerminal && grow.currentStage !== 'harvesting';

  return (
    <div className="space-y-6">
      {/* Stage Progress */}
      <StageProgressBar currentStage={grow.currentStage} />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{daysActive}</div>
          <div className="text-xs text-zinc-400 mt-1">Days Active</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{grow.totalYield}g</div>
          <div className="text-xs text-zinc-400 mt-1">Total Yield</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{grow.flushes.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Flushes</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{bePercent}%</div>
          <div className="text-xs text-zinc-400 mt-1">BE (estimate)</div>
        </div>
      </div>

      {/* Quick Actions */}
      {!isTerminal && (
        <div className="flex flex-wrap gap-3">
          {onLogObservation && (
            <button
              onClick={onLogObservation}
              className="flex-1 min-w-[140px] py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.Clipboard />
              Log Observation
            </button>
          )}
          {canHarvest && onRecordHarvest && (
            <button
              onClick={onRecordHarvest}
              className="flex-1 min-w-[140px] py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.Scale />
              Record Harvest
            </button>
          )}
          {canAdvance && onAdvanceStage && (
            <button
              onClick={onAdvanceStage}
              className="flex-1 min-w-[140px] py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Icons.ArrowRight />
              Advance Stage
            </button>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Grow Details */}
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Icons.Box />
            Grow Details
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Strain</span>
              <span className="text-white">{strain?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Container</span>
              <span className="text-white">{container?.name || 'Unknown'} × {grow.containerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Substrate</span>
              <span className="text-white">{substrateType?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Spawn Weight</span>
              <span className="text-white">{grow.spawnWeight}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Substrate Weight</span>
              <span className="text-white">{grow.substrateWeight}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Spawn Rate</span>
              <span className="text-white">{grow.spawnRate}%</span>
            </div>
            {sourceCulture && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Source Culture</span>
                <span className="text-emerald-400">{sourceCulture.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Environment & Location */}
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Icons.MapPin />
            Environment
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Location</span>
              <span className="text-white">{location?.name || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 flex items-center gap-1">
                <Icons.Thermometer />
                Colonization Temp
              </span>
              <span className="text-white">{grow.targetTempColonization}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 flex items-center gap-1">
                <Icons.Thermometer />
                Fruiting Temp
              </span>
              <span className="text-white">{grow.targetTempFruiting}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 flex items-center gap-1">
                <Icons.Droplet />
                Humidity
              </span>
              <span className="text-white">{grow.targetHumidity}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Info */}
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
          <Icons.Clock />
          Timeline
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-zinc-500">Started</div>
            <div className="text-white">{format(new Date(grow.spawnedAt), 'MMM d, yyyy')}</div>
          </div>
          {grow.colonizationStartedAt && (
            <div>
              <div className="text-xs text-zinc-500">Colonization</div>
              <div className="text-white">{format(new Date(grow.colonizationStartedAt), 'MMM d, yyyy')}</div>
            </div>
          )}
          {grow.fruitingStartedAt && (
            <div>
              <div className="text-xs text-zinc-500">Fruiting</div>
              <div className="text-white">{format(new Date(grow.fruitingStartedAt), 'MMM d, yyyy')}</div>
            </div>
          )}
          {grow.completedAt && (
            <div>
              <div className="text-xs text-zinc-500">Completed</div>
              <div className="text-white">{format(new Date(grow.completedAt), 'MMM d, yyyy')}</div>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-zinc-400">
          {daysInCurrentStage} days in {stageConfig[grow.currentStage].label.toLowerCase()}
        </div>
      </div>

      {/* Harvest History */}
      <HarvestHistoryCard grow={grow} />

      {/* Cost & Efficiency (if available) */}
      {(grow.estimatedCost > 0 || grow.totalCost) && (
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
            <Icons.TrendingUp />
            Cost Analysis
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-zinc-500">Est. Cost</div>
              <div className="text-white">${grow.estimatedCost.toFixed(2)}</div>
            </div>
            {grow.totalCost && (
              <div>
                <div className="text-xs text-zinc-500">Actual Cost</div>
                <div className="text-white">${grow.totalCost.toFixed(2)}</div>
              </div>
            )}
            {grow.costPerGramWet && (
              <div>
                <div className="text-xs text-zinc-500">Cost/g (wet)</div>
                <div className="text-white">${grow.costPerGramWet.toFixed(2)}</div>
              </div>
            )}
            {grow.profit !== undefined && (
              <div>
                <div className="text-xs text-zinc-500">Profit</div>
                <div className={grow.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ${grow.profit.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {grow.notes && (
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-2">Notes</h4>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap">{grow.notes}</p>
        </div>
      )}

      {/* Recent Observations */}
      {grow.observations.length > 0 && (
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Recent Observations</h4>
          <div className="space-y-2">
            {grow.observations.slice(-3).reverse().map((obs, index) => (
              <div key={index} className="flex items-start gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                <div className="w-8 h-8 flex items-center justify-center bg-zinc-700/50 rounded-full text-sm">
                  {obs.type === 'contamination' ? '☠️' :
                   obs.type === 'milestone' ? '📈' :
                   obs.type === 'photo' ? '📷' :
                   obs.type === 'environmental' ? '🌡️' :
                   obs.type === 'misting' ? '💧' :
                   obs.type === 'fae' ? '💨' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{obs.title || obs.notes?.slice(0, 50) || 'Observation'}</div>
                  <div className="text-xs text-zinc-400">
                    {formatDistanceToNow(new Date(obs.date), { addSuffix: true })}
                    {obs.colonizationPercent != null && ` • ${obs.colonizationPercent}% colonized`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowOverviewTab;
