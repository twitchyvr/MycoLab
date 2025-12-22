// ============================================================================
// LINEAGE TAB
// Focused lineage visualization for a specific culture within detail modal
// Shows ancestors, current culture, and descendants in a clean tree view
// ============================================================================

import React, { useMemo } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { useData } from '../../../store';
import type { Culture, CultureStatus } from '../../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface LineageTabProps {
  culture: Culture;
  onNavigateToCulture?: (culture: Culture) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const cultureTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  liquid_culture: { icon: '💧', label: 'LC', color: 'bg-blue-500/20 border-blue-500/50' },
  agar: { icon: '🧫', label: 'Agar', color: 'bg-emerald-500/20 border-emerald-500/50' },
  slant: { icon: '🧪', label: 'Slant', color: 'bg-amber-500/20 border-amber-500/50' },
  spore_syringe: { icon: '💉', label: 'Spore', color: 'bg-purple-500/20 border-purple-500/50' },
};

const statusConfig: Record<CultureStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-emerald-400' },
  colonizing: { label: 'Colonizing', color: 'text-blue-400' },
  ready: { label: 'Ready', color: 'text-green-400' },
  contaminated: { label: 'Contaminated', color: 'text-red-400' },
  archived: { label: 'Archived', color: 'text-zinc-400' },
  depleted: { label: 'Depleted', color: 'text-amber-400' },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  GitBranch: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="6" y1="3" x2="6" y2="15"/>
      <circle cx="18" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 9a9 9 0 0 1-9 9"/>
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
};

// ============================================================================
// CULTURE NODE COMPONENT
// ============================================================================

interface CultureNodeProps {
  culture: Culture;
  isCurrent?: boolean;
  isAncestor?: boolean;
  isDescendant?: boolean;
  depth?: number;
  onNavigate?: (culture: Culture) => void;
}

const CultureNode: React.FC<CultureNodeProps> = ({
  culture,
  isCurrent = false,
  isAncestor = false,
  isDescendant = false,
  depth = 0,
  onNavigate,
}) => {
  const { getStrain } = useData();
  const strain = getStrain(culture.strainId);
  const typeConfig = cultureTypeConfig[culture.type] || cultureTypeConfig.liquid_culture;
  const status = statusConfig[culture.status] || statusConfig.active;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-3 rounded-xl border transition-all
        ${isCurrent
          ? 'bg-emerald-950/30 border-emerald-500/50 ring-2 ring-emerald-500/30'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
        }
        ${onNavigate && !isCurrent ? 'cursor-pointer' : ''}
      `}
      onClick={() => onNavigate && !isCurrent && onNavigate(culture)}
      style={{ marginLeft: depth * 24 }}
    >
      {/* Connector line for descendants */}
      {depth > 0 && (
        <div className="absolute -left-3 top-1/2 w-3 h-px bg-zinc-600" />
      )}

      {/* Type icon */}
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl border ${typeConfig.color}`}>
        {typeConfig.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{culture.label}</span>
          {isCurrent && (
            <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
              Current
            </span>
          )}
          {isAncestor && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
              Ancestor
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{typeConfig.label}</span>
          <span>•</span>
          <span className={status.color}>{status.label}</span>
          {culture.createdAt && (
            <>
              <span>•</span>
              <span>{format(new Date(culture.createdAt), 'MMM d, yyyy')}</span>
            </>
          )}
        </div>
        {strain && (
          <div className="text-xs text-zinc-500 truncate mt-0.5">{strain.name}</div>
        )}
      </div>

      {/* Navigate arrow */}
      {onNavigate && !isCurrent && (
        <div className="text-zinc-500 hover:text-white transition-colors">
          <Icons.ArrowRight />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const LineageTab: React.FC<LineageTabProps> = ({
  culture,
  onNavigateToCulture,
}) => {
  const { getCultureLineage, getCulture } = useData();

  // Get lineage data
  const lineage = useMemo(() => getCultureLineage(culture.id), [culture.id, getCultureLineage]);

  // Build ancestor chain (parent -> grandparent -> etc.)
  const ancestorChain = useMemo(() => {
    const chain: Culture[] = [];
    let currentId = culture.parentId;
    let depth = 0;
    const maxDepth = 10; // Prevent infinite loops

    while (currentId && depth < maxDepth) {
      const ancestor = getCulture(currentId);
      if (ancestor) {
        chain.push(ancestor);
        currentId = ancestor.parentId;
      } else {
        break;
      }
      depth++;
    }

    return chain.reverse(); // Show oldest first
  }, [culture.parentId, getCulture]);

  // Get direct children
  const directChildren = useMemo(() => {
    return lineage.descendants.filter(d => d.parentId === culture.id);
  }, [lineage.descendants, culture.id]);

  // Count total descendants (for display)
  const totalDescendants = lineage.descendants.length;
  const hasMoreDescendants = totalDescendants > directChildren.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{ancestorChain.length}</div>
          <div className="text-xs text-zinc-400 mt-1">Ancestors</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">G{culture.generation || 0}</div>
          <div className="text-xs text-zinc-400 mt-1">Generation</div>
        </div>
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{totalDescendants}</div>
          <div className="text-xs text-zinc-400 mt-1">Descendants</div>
        </div>
      </div>

      {/* Lineage Tree */}
      <div className="space-y-4">
        {/* Ancestors Section */}
        {ancestorChain.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.ChevronUp />
              <h4 className="text-sm font-medium text-zinc-300">Ancestors</h4>
              <span className="text-xs text-zinc-500">({ancestorChain.length})</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-blue-500/30">
              {ancestorChain.map((ancestor, index) => (
                <CultureNode
                  key={ancestor.id}
                  culture={ancestor}
                  isAncestor
                  depth={0}
                  onNavigate={onNavigateToCulture}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Culture */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icons.GitBranch />
            <h4 className="text-sm font-medium text-zinc-300">Current Culture</h4>
          </div>
          <CultureNode
            culture={culture}
            isCurrent
          />
        </div>

        {/* Descendants Section */}
        {directChildren.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icons.ChevronDown />
              <h4 className="text-sm font-medium text-zinc-300">Direct Children</h4>
              <span className="text-xs text-zinc-500">({directChildren.length})</span>
              {hasMoreDescendants && (
                <span className="text-xs text-zinc-500">
                  • {totalDescendants - directChildren.length} more in tree
                </span>
              )}
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-amber-500/30">
              {directChildren.map((child) => (
                <CultureNode
                  key={child.id}
                  culture={child}
                  isDescendant
                  depth={0}
                  onNavigate={onNavigateToCulture}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Lineage Message */}
        {ancestorChain.length === 0 && directChildren.length === 0 && (
          <div className="text-center py-8 bg-zinc-800/30 rounded-xl">
            <div className="text-zinc-500 mb-2">
              <Icons.GitBranch />
            </div>
            <p className="text-zinc-400">No lineage connections</p>
            <p className="text-xs text-zinc-500 mt-1">
              This culture has no recorded parent or children
            </p>
          </div>
        )}
      </div>

      {/* Lineage Tips */}
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
          <Icons.Link />
          About Lineage Tracking
        </h4>
        <ul className="text-xs text-zinc-400 space-y-1">
          <li>• <strong>Generation</strong> tracks how many transfers from the original source</li>
          <li>• <strong>Ancestors</strong> show the chain of parent cultures</li>
          <li>• <strong>Descendants</strong> are cultures created from transfers of this culture</li>
          <li>• Click any culture to view its details</li>
        </ul>
      </div>
    </div>
  );
};

export default LineageTab;
