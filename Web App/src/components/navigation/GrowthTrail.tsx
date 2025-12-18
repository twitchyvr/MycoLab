// ============================================================================
// GROWTH TRAIL - Organic Breadcrumb Navigation
// Shows your navigation path like a growth journey through cultivation stages
// Styled with organic, flowing lines connecting navigation points
// ============================================================================

import React, { useMemo } from 'react';
import type { Page, NavCategory } from './types';
import { getNodeById, categoryMeta, getConnectedNodes, NavIcons } from './navData';

interface GrowthTrailProps {
  currentPage: Page;
  previousPages: Page[];
  onNavigate: (page: Page) => void;
  onOpenHub: () => void;
  className?: string;
}

interface TrailNodeProps {
  page: Page;
  isCurrent: boolean;
  isLast: boolean;
  onClick: () => void;
}

// ============================================================================
// TRAIL NODE - Individual breadcrumb item
// ============================================================================

const TrailNode: React.FC<TrailNodeProps> = ({ page, isCurrent, isLast, onClick }) => {
  const node = getNodeById(page);
  if (!node) return null;

  const meta = categoryMeta[node.category];
  const Icon = node.icon;

  return (
    <div className="flex items-center gap-1 group">
      {/* Mycelium connector (except for first item) */}
      {!isLast && (
        <div className="flex items-center">
          <svg
            className="w-6 h-3 text-zinc-600"
            viewBox="0 0 24 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M0 6 C8 6, 8 2, 12 2 S16 6, 24 6"
              className="transition-colors group-hover:text-zinc-500"
            />
            {/* Branching threads for visual interest */}
            <circle cx="12" cy="4" r="1" fill="currentColor" className="opacity-50" />
          </svg>
        </div>
      )}

      {/* Node button */}
      <button
        onClick={onClick}
        disabled={isCurrent}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-lg
          transition-all duration-200
          ${isCurrent
            ? `bg-${meta.color}-500/20 border border-${meta.color}-500/50 text-${meta.color}-400 cursor-default`
            : 'bg-zinc-800/50 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
          }
        `}
        style={{
          boxShadow: isCurrent ? `0 0 10px ${meta.glowColor}` : 'none',
        }}
        aria-current={isCurrent ? 'page' : undefined}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium whitespace-nowrap">
          {node.shortLabel || node.label}
        </span>
        {isCurrent && (
          <span
            className={`w-1.5 h-1.5 rounded-full bg-${meta.color}-400`}
            style={{ boxShadow: `0 0 6px ${meta.glowColor}` }}
          />
        )}
      </button>
    </div>
  );
};

// ============================================================================
// RELATED PAGES DROPDOWN
// Shows pages connected to the current page
// ============================================================================

interface RelatedPagesProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const RelatedPages: React.FC<RelatedPagesProps> = ({ currentPage, onNavigate }) => {
  const connectedNodes = useMemo(() => getConnectedNodes(currentPage), [currentPage]);

  if (connectedNodes.length === 0) return null;

  return (
    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-zinc-700">
      <span className="text-xs text-zinc-600 mr-1">Related:</span>
      {connectedNodes.slice(0, 3).map((node) => {
        const Icon = node.icon;
        const meta = categoryMeta[node.category];
        return (
          <button
            key={node.id}
            onClick={() => onNavigate(node.id)}
            className={`
              flex items-center gap-1 px-1.5 py-0.5 rounded
              bg-zinc-800/30 text-zinc-500 border border-zinc-800
              hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-700
              transition-all duration-150
            `}
            title={`Go to ${node.label}`}
          >
            <Icon className="w-3 h-3" />
            <span className="text-[10px]">{node.shortLabel || node.label}</span>
          </button>
        );
      })}
      {connectedNodes.length > 3 && (
        <span className="text-[10px] text-zinc-600">+{connectedNodes.length - 3}</span>
      )}
    </div>
  );
};

// ============================================================================
// MAIN GROWTH TRAIL COMPONENT
// ============================================================================

export const GrowthTrail: React.FC<GrowthTrailProps> = ({
  currentPage,
  previousPages,
  onNavigate,
  onOpenHub,
  className = '',
}) => {
  const currentNode = getNodeById(currentPage);
  const currentCategory = currentNode?.category;
  const meta = currentCategory ? categoryMeta[currentCategory] : null;

  // Get the trail (limited to last 3-4 items for cleaner UI)
  const trail = useMemo(() => {
    // Start with dashboard if it's not in the trail
    const fullTrail = previousPages.slice(-3);
    if (fullTrail.length > 0 && !fullTrail.includes('dashboard')) {
      fullTrail.unshift('dashboard');
    }
    // Add current page if not already there
    if (!fullTrail.includes(currentPage)) {
      fullTrail.push(currentPage);
    }
    return fullTrail.slice(-4); // Max 4 items
  }, [previousPages, currentPage]);

  return (
    <div
      className={`
        flex items-center justify-between
        px-4 py-2
        bg-zinc-900/80 backdrop-blur-sm
        border-b border-zinc-800
        overflow-x-auto
        ${className}
      `}
    >
      {/* Left: Navigation trail */}
      <div className="flex items-center gap-0.5 min-w-0">
        {/* Hub trigger button - organic mycelium icon */}
        <button
          onClick={onOpenHub}
          className="
            flex items-center justify-center
            w-8 h-8 rounded-lg
            bg-zinc-800/50 border border-zinc-700
            text-zinc-400 hover:text-emerald-400 hover:border-zinc-600
            transition-colors mr-2 flex-shrink-0
            focus:outline-none focus:ring-2 focus:ring-emerald-500
          "
          title="Open Navigation Hub"
          aria-label="Open full navigation"
        >
          <NavIcons.Spore className="w-4 h-4" />
        </button>

        {/* Trail nodes */}
        <div className="flex items-center flex-nowrap overflow-x-auto scrollbar-none">
          {trail.map((page, index) => (
            <TrailNode
              key={`${page}-${index}`}
              page={page}
              isCurrent={page === currentPage}
              isLast={index === 0}
              onClick={() => onNavigate(page)}
            />
          ))}
        </div>

        {/* Related pages - visible on all screens */}
        <RelatedPages currentPage={currentPage} onNavigate={onNavigate} />
      </div>

      {/* Right: Category indicator */}
      {meta && currentNode && (
        <div
          className={`
            flex items-center gap-2 px-3 py-1 rounded-full
            bg-${meta.color}-500/10 border border-${meta.color}-500/30
            flex-shrink-0 ml-4
          `}
        >
          <meta.icon className={`w-3.5 h-3.5 text-${meta.color}-400`} />
          <span className={`text-xs font-medium text-${meta.color}-400 hidden sm:inline`}>
            {meta.label}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full bg-${meta.color}-400 animate-pulse`}
            style={{ boxShadow: `0 0 6px ${meta.glowColor}` }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPACT GROWTH TRAIL - For mobile/limited space
// ============================================================================

interface CompactGrowthTrailProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onBack: () => void;
  onOpenHub: () => void;
}

export const CompactGrowthTrail: React.FC<CompactGrowthTrailProps> = ({
  currentPage,
  onNavigate,
  onBack,
  onOpenHub,
}) => {
  const currentNode = getNodeById(currentPage);
  const meta = currentNode ? categoryMeta[currentNode.category] : null;
  const Icon = currentNode?.icon || NavIcons.Dashboard;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        {/* Back button (if not on dashboard) */}
        {currentPage !== 'dashboard' && (
          <button
            onClick={onBack}
            className="
              p-1.5 rounded-lg
              text-zinc-400 hover:text-white hover:bg-zinc-800
              transition-colors
            "
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Current page indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`
              flex items-center justify-center
              w-8 h-8 rounded-lg
              ${meta ? `bg-${meta.color}-500/20 text-${meta.color}-400` : 'bg-zinc-800 text-zinc-400'}
            `}
            style={{ boxShadow: meta ? `0 0 8px ${meta.glowColor}` : 'none' }}
          >
            <Icon className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium text-white">
            {currentNode?.label || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Hub trigger */}
      <button
        onClick={onOpenHub}
        className="
          p-2 rounded-lg
          text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800
          transition-colors
        "
        aria-label="Open navigation"
      >
        <NavIcons.Mycelium className="w-5 h-5" />
      </button>
    </div>
  );
};

export default GrowthTrail;
