// ============================================================================
// RELATED TAB
// Shows entities linked to the current entity
// - Cultures: Grows using this culture, child cultures
// - Grows: Harvests, source culture
// - Recipes: Cultures/grows using this recipe
// ============================================================================

import React, { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useData } from '../../../store';
import type { Culture, Grow, GrowStage } from '../../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface RelatedTabProps {
  entityType: 'culture' | 'grow';
  entity: Culture | Grow;
  onNavigateToCulture?: (culture: Culture) => void;
  onNavigateToGrow?: (grow: Grow) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const growStageConfig: Record<GrowStage, { icon: string; color: string }> = {
  spawning: { icon: '🌱', color: 'text-purple-400' },
  colonization: { icon: '🔵', color: 'text-blue-400' },
  fruiting: { icon: '🍄', color: 'text-emerald-400' },
  harvesting: { icon: '✂️', color: 'text-amber-400' },
  completed: { icon: '✅', color: 'text-green-400' },
  contaminated: { icon: '☠️', color: 'text-red-400' },
  aborted: { icon: '⛔', color: 'text-zinc-400' },
};

const cultureTypeConfig: Record<string, { icon: string; label: string }> = {
  liquid_culture: { icon: '💧', label: 'LC' },
  agar: { icon: '🧫', label: 'Agar' },
  slant: { icon: '🧪', label: 'Slant' },
  spore_syringe: { icon: '💉', label: 'Spore' },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Flask: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M9 3h6v4a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4V3z"/>
      <line x1="9" y1="3" x2="15" y2="3"/>
    </svg>
  ),
};

// ============================================================================
// GROW CARD COMPONENT
// ============================================================================

interface RelatedGrowCardProps {
  grow: Grow;
  strain?: { name: string };
  onClick?: () => void;
}

const RelatedGrowCard: React.FC<RelatedGrowCardProps> = ({ grow, strain, onClick }) => {
  const stageInfo = growStageConfig[grow.currentStage];
  const daysActive = Math.floor(
    (new Date().getTime() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border bg-zinc-800/50 border-zinc-700/50
        ${onClick ? 'hover:border-zinc-600 cursor-pointer' : ''}
        transition-colors
      `}
      onClick={onClick}
    >
      {/* Stage icon */}
      <div className="w-10 h-10 flex items-center justify-center bg-zinc-700/50 rounded-lg text-xl">
        {stageInfo.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{grow.name}</div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className={stageInfo.color}>{grow.currentStage}</span>
          <span>•</span>
          <span>{daysActive}d</span>
          {grow.totalYield > 0 && (
            <>
              <span>•</span>
              <span className="text-emerald-400">{grow.totalYield}g</span>
            </>
          )}
        </div>
        {strain && (
          <div className="text-xs text-zinc-500 truncate">{strain.name}</div>
        )}
      </div>

      {/* Navigate */}
      {onClick && (
        <div className="text-zinc-500 hover:text-white">
          <Icons.ArrowRight />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CULTURE CARD COMPONENT
// ============================================================================

interface RelatedCultureCardProps {
  culture: Culture;
  strain?: { name: string };
  relationship: string;
  onClick?: () => void;
}

const RelatedCultureCard: React.FC<RelatedCultureCardProps> = ({
  culture,
  strain,
  relationship,
  onClick,
}) => {
  const typeInfo = cultureTypeConfig[culture.type] || cultureTypeConfig.liquid_culture;

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-xl border bg-zinc-800/50 border-zinc-700/50
        ${onClick ? 'hover:border-zinc-600 cursor-pointer' : ''}
        transition-colors
      `}
      onClick={onClick}
    >
      {/* Type icon */}
      <div className="w-10 h-10 flex items-center justify-center bg-zinc-700/50 rounded-lg text-xl">
        {typeInfo.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{culture.label}</span>
          <span className="px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded">
            {relationship}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{typeInfo.label}</span>
          <span>•</span>
          <span className={
            culture.status === 'active' ? 'text-emerald-400' :
            culture.status === 'ready' ? 'text-green-400' :
            culture.status === 'contaminated' ? 'text-red-400' :
            'text-zinc-400'
          }>
            {culture.status}
          </span>
        </div>
        {strain && (
          <div className="text-xs text-zinc-500 truncate">{strain.name}</div>
        )}
      </div>

      {/* Navigate */}
      {onClick && (
        <div className="text-zinc-500 hover:text-white">
          <Icons.ArrowRight />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RelatedTab: React.FC<RelatedTabProps> = ({
  entityType,
  entity,
  onNavigateToCulture,
  onNavigateToGrow,
}) => {
  const { state, getStrain, getCulture } = useData();

  // For cultures: find grows using this culture and child cultures
  const cultureRelated = useMemo(() => {
    if (entityType !== 'culture') return null;

    const culture = entity as Culture;

    // Grows using this culture as source
    const growsUsingCulture = state.grows.filter(
      g => g.sourceCultureId === culture.id && !g.isArchived
    );

    // Child cultures (transferred from this one)
    const childCultures = state.cultures.filter(
      c => c.parentId === culture.id && !c.isArchived
    );

    // Parent culture
    const parentCulture = culture.parentId ? getCulture(culture.parentId) : null;

    return {
      grows: growsUsingCulture,
      children: childCultures,
      parent: parentCulture,
    };
  }, [entityType, entity, state.grows, state.cultures, getCulture]);

  // For grows: find source culture
  const growRelated = useMemo(() => {
    if (entityType !== 'grow') return null;

    const grow = entity as Grow;

    // Source culture
    const sourceCulture = grow.sourceCultureId
      ? getCulture(grow.sourceCultureId)
      : null;

    return {
      sourceCulture,
    };
  }, [entityType, entity, getCulture]);

  // Render culture related content
  if (entityType === 'culture' && cultureRelated) {
    const { grows, children, parent } = cultureRelated;
    const hasRelated = grows.length > 0 || children.length > 0 || parent;

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{grows.length}</div>
            <div className="text-xs text-zinc-400 mt-1">Active Grows</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{children.length}</div>
            <div className="text-xs text-zinc-400 mt-1">Child Cultures</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {grows.reduce((sum, g) => sum + g.totalYield, 0)}g
            </div>
            <div className="text-xs text-zinc-400 mt-1">Total Yield</div>
          </div>
        </div>

        {/* Parent Culture */}
        {parent && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Flask />
              <h4 className="text-sm font-medium text-zinc-300">Source Culture</h4>
            </div>
            <RelatedCultureCard
              culture={parent}
              strain={getStrain(parent.strainId)}
              relationship="Parent"
              onClick={onNavigateToCulture ? () => onNavigateToCulture(parent) : undefined}
            />
          </div>
        )}

        {/* Grows Using This Culture */}
        {grows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Box />
              <h4 className="text-sm font-medium text-zinc-300">Grows Using This Culture</h4>
              <span className="text-xs text-zinc-500">({grows.length})</span>
            </div>
            <div className="space-y-2">
              {grows.map(grow => (
                <RelatedGrowCard
                  key={grow.id}
                  grow={grow}
                  strain={getStrain(grow.strainId)}
                  onClick={onNavigateToGrow ? () => onNavigateToGrow(grow) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Child Cultures */}
        {children.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Layers />
              <h4 className="text-sm font-medium text-zinc-300">Child Cultures</h4>
              <span className="text-xs text-zinc-500">({children.length})</span>
            </div>
            <div className="space-y-2">
              {children.map(child => (
                <RelatedCultureCard
                  key={child.id}
                  culture={child}
                  strain={getStrain(child.strainId)}
                  relationship="Child"
                  onClick={onNavigateToCulture ? () => onNavigateToCulture(child) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Related Entities */}
        {!hasRelated && (
          <div className="text-center py-8 bg-zinc-800/30 rounded-xl">
            <Icons.Layers />
            <p className="text-zinc-400 mt-2">No related entities</p>
            <p className="text-xs text-zinc-500 mt-1">
              Grows started from this culture and child cultures will appear here
            </p>
          </div>
        )}
      </div>
    );
  }

  // Render grow related content
  if (entityType === 'grow' && growRelated) {
    const { sourceCulture } = growRelated;
    const grow = entity as Grow;

    return (
      <div className="space-y-6">
        {/* Harvest Summary */}
        {grow.flushes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🍄</span>
              <h4 className="text-sm font-medium text-zinc-300">Harvests</h4>
              <span className="text-xs text-zinc-500">({grow.flushes.length} flushes)</span>
            </div>
            <div className="space-y-2">
              {grow.flushes.map((flush, index) => (
                <div
                  key={flush.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm text-white">{flush.wetWeight}g wet</div>
                      {flush.dryWeight && (
                        <div className="text-xs text-zinc-400">{flush.dryWeight}g dry</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">
                      {format(new Date(flush.harvestDate), 'MMM d, yyyy')}
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
          </div>
        )}

        {/* Source Culture */}
        {sourceCulture && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Flask />
              <h4 className="text-sm font-medium text-zinc-300">Source Culture</h4>
            </div>
            <RelatedCultureCard
              culture={sourceCulture}
              strain={getStrain(sourceCulture.strainId)}
              relationship="Source"
              onClick={onNavigateToCulture ? () => onNavigateToCulture(sourceCulture) : undefined}
            />
          </div>
        )}

        {/* No Related Entities */}
        {!sourceCulture && grow.flushes.length === 0 && (
          <div className="text-center py-8 bg-zinc-800/30 rounded-xl">
            <Icons.Layers />
            <p className="text-zinc-400 mt-2">No related entities</p>
            <p className="text-xs text-zinc-500 mt-1">
              Source culture and harvest data will appear here
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default RelatedTab;
