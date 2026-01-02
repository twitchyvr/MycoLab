// ============================================================================
// MYCELIUM HUB - Organic Network-Style Navigation
// A visual, interconnected navigation experience inspired by fungal networks
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Page, NavCategory } from './types';
import {
  navNodes,
  categoryMeta,
  categoryOrder,
  getNodesByCategory,
  getNodeById,
  getConnectedNodes,
  NavIcons,
} from './navData';

interface MyceliumHubProps {
  isOpen: boolean;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onClose: () => void;
}

// ============================================================================
// MYCELIUM THREAD SVG COMPONENT
// Draws organic connecting lines between nodes
// ============================================================================

interface MyceliumThreadProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive?: boolean;
  delay?: number;
}

const MyceliumThread: React.FC<MyceliumThreadProps> = ({ from, to, isActive, delay = 0 }) => {
  // Create a curved path using bezier curve for organic feel
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const controlOffset = Math.random() * 20 - 10; // Random curve variation

  const path = `M ${from.x} ${from.y} Q ${midX + controlOffset} ${midY + controlOffset}, ${to.x} ${to.y}`;

  return (
    <path
      d={path}
      stroke={isActive ? 'rgba(16, 185, 129, 0.6)' : 'rgba(63, 63, 70, 0.4)'}
      strokeWidth={isActive ? 2 : 1}
      fill="none"
      strokeLinecap="round"
      className="transition-all duration-500"
      style={{
        strokeDasharray: isActive ? '0' : '4 4',
        animationDelay: `${delay}ms`,
      }}
    />
  );
};

// ============================================================================
// NAVIGATION NODE COMPONENT
// Individual clickable node with hover effects and connections
// ============================================================================

interface NavNodeProps {
  node: typeof navNodes[0];
  isActive: boolean;
  isConnected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
  position: { x: number; y: number };
  categoryColor: string;
}

const NavNode: React.FC<NavNodeProps> = ({
  node,
  isActive,
  isConnected,
  onClick,
  onHover,
  position,
  categoryColor,
}) => {
  const Icon = node.icon;
  const isHighlighted = isActive || isConnected;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        flex flex-col items-center gap-1.5 p-2 rounded-xl
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950
        ${isActive
          ? `bg-${categoryColor}-500/20 border-2 border-${categoryColor}-500 shadow-lg`
          : isConnected
            ? 'bg-zinc-800/80 border border-zinc-600 scale-105'
            : 'bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
        }
        ${isHighlighted ? 'z-20' : 'z-10'}
        group
      `}
      style={{
        left: position.x,
        top: position.y,
        boxShadow: isActive
          ? `0 0 20px ${categoryMeta[node.category].glowColor}`
          : isConnected
            ? `0 0 10px ${categoryMeta[node.category].glowColor}`
            : 'none',
      }}
      aria-label={`Navigate to ${node.label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Pulsing ring for active node */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-xl animate-ping opacity-30"
          style={{ backgroundColor: categoryMeta[node.category].glowColor }}
        />
      )}

      {/* Icon container with bioluminescent effect */}
      <span
        className={`
          relative w-10 h-10 rounded-lg flex items-center justify-center
          transition-all duration-300
          ${isActive
            ? `bg-${categoryColor}-500/30 text-${categoryColor}-400`
            : isConnected
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800 text-zinc-400 group-hover:text-white'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        {/* Bioluminescent glow */}
        {isHighlighted && (
          <span
            className="absolute inset-0 rounded-lg animate-pulse opacity-40"
            style={{
              background: `radial-gradient(circle, ${categoryMeta[node.category].glowColor} 0%, transparent 70%)`,
            }}
          />
        )}
      </span>

      {/* Label */}
      <span
        className={`
          text-xs font-medium whitespace-nowrap
          transition-colors duration-200
          ${isActive
            ? `text-${categoryColor}-400`
            : isConnected
              ? 'text-white'
              : 'text-zinc-500 group-hover:text-zinc-300'
          }
        `}
      >
        {node.shortLabel || node.label}
      </span>

      {/* Connection indicator dot */}
      {isActive && (
        <span
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-${categoryColor}-400`}
          style={{ boxShadow: `0 0 8px ${categoryMeta[node.category].glowColor}` }}
        />
      )}
    </button>
  );
};

// ============================================================================
// CATEGORY CLUSTER COMPONENT
// Groups nodes by category with organic layout
// ============================================================================

interface CategoryClusterProps {
  category: NavCategory;
  nodes: typeof navNodes;
  currentPage: Page;
  hoveredNode: Page | null;
  onNavigate: (page: Page) => void;
  onNodeHover: (page: Page | null) => void;
  clusterPosition: { x: number; y: number };
  clusterRadius: number;
}

const CategoryCluster: React.FC<CategoryClusterProps> = ({
  category,
  nodes,
  currentPage,
  hoveredNode,
  onNavigate,
  onNodeHover,
  clusterPosition,
  clusterRadius,
}) => {
  const meta = categoryMeta[category];
  const connectedPages = hoveredNode ? getConnectedNodes(hoveredNode).map(n => n.id) : [];
  const Icon = meta.icon;

  // Calculate positions for nodes within the cluster
  const nodePositions = useMemo(() => {
    const positions: { [key: string]: { x: number; y: number } } = {};
    const angleStep = (2 * Math.PI) / nodes.length;
    const innerRadius = clusterRadius * 0.6;

    nodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2; // Start from top
      positions[node.id] = {
        x: clusterPosition.x + Math.cos(angle) * innerRadius,
        y: clusterPosition.y + Math.sin(angle) * innerRadius,
      };
    });

    return positions;
  }, [nodes, clusterPosition, clusterRadius]);

  const hasActiveNode = nodes.some(n => n.id === currentPage);

  return (
    <g className="category-cluster">
      {/* Category label in center */}
      <foreignObject
        x={clusterPosition.x - 40}
        y={clusterPosition.y - 15}
        width="80"
        height="30"
        className="pointer-events-none"
      >
        <div
          className={`
            flex items-center justify-center gap-1.5 px-2 py-1 rounded-full
            text-xs font-medium
            ${hasActiveNode
              ? `bg-${meta.color}-500/20 text-${meta.color}-400 border border-${meta.color}-500/50`
              : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700'
            }
          `}
          style={{
            boxShadow: hasActiveNode ? `0 0 15px ${meta.glowColor}` : 'none',
          }}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{meta.label}</span>
        </div>
      </foreignObject>

      {/* Render nodes */}
      {nodes.map((node) => {
        const pos = nodePositions[node.id];
        return (
          <foreignObject
            key={node.id}
            x={pos.x - 45}
            y={pos.y - 35}
            width="90"
            height="80"
          >
            <NavNode
              node={node}
              isActive={node.id === currentPage}
              isConnected={connectedPages.includes(node.id)}
              onClick={() => onNavigate(node.id)}
              onHover={(hovering) => onNodeHover(hovering ? node.id : null)}
              position={{ x: 45, y: 35 }}
              categoryColor={meta.color}
            />
          </foreignObject>
        );
      })}
    </g>
  );
};

// ============================================================================
// MAIN MYCELIUM HUB COMPONENT
// ============================================================================

export const MyceliumHub: React.FC<MyceliumHubProps> = ({
  isOpen,
  currentPage,
  onNavigate,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<Page | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isOpen]);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return navNodes;
    const query = searchQuery.toLowerCase();
    return navNodes.filter(
      node =>
        node.label.toLowerCase().includes(query) ||
        node.description?.toLowerCase().includes(query) ||
        categoryMeta[node.category].label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Calculate cluster positions based on dimensions
  const clusterPositions = useMemo(() => {
    const { width, height } = dimensions;
    if (!width || !height) return {};

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const positions: { [key: string]: { x: number; y: number } } = {};
    const visibleCategories = categoryOrder.filter(cat =>
      getNodesByCategory(cat).some(node => filteredNodes.includes(node))
    );

    visibleCategories.forEach((category, index) => {
      const angle = ((2 * Math.PI) / visibleCategories.length) * index - Math.PI / 2;
      positions[category] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    return positions;
  }, [dimensions, filteredNodes]);

  // Get connection lines for the currently active/hovered node
  const connectionLines = useMemo(() => {
    const sourceNode = hoveredNode || currentPage;
    const connected = getConnectedNodes(sourceNode);
    const lines: { from: Page; to: Page }[] = [];

    connected.forEach(targetNode => {
      if (filteredNodes.includes(targetNode)) {
        lines.push({ from: sourceNode, to: targetNode.id });
      }
    });

    return lines;
  }, [hoveredNode, currentPage, filteredNodes]);

  const handleNavigate = useCallback((page: Page) => {
    onNavigate(page);
    onClose();
  }, [onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Hub Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Hub"
      >
        {/* Header with search and close */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center gap-4">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <NavIcons.Mushroom className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-white">Sporely Navigator</h2>
              <p className="text-xs text-zinc-500">Click a node or search to navigate</p>
            </div>
          </div>

          {/* Search input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-lg
                  text-white placeholder-zinc-500
                  focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                  transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close navigation"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current location indicator */}
        <div className="absolute top-20 left-4 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-zinc-400">You are here:</span>
            <span className="text-sm font-medium text-white">
              {getNodeById(currentPage)?.label}
            </span>
          </div>
        </div>

        {/* Network visualization SVG */}
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(63, 63, 70, 0.2)"
                strokeWidth="0.5"
              />
            </pattern>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />
          <ellipse
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            rx={dimensions.width * 0.4}
            ry={dimensions.height * 0.4}
            fill="url(#centerGlow)"
          />

          {/* Connection threads */}
          <g className="connection-threads">
            {connectionLines.map((line, index) => {
              const fromNode = getNodeById(line.from);
              const toNode = getNodeById(line.to);
              if (!fromNode || !toNode) return null;

              const fromCluster = clusterPositions[fromNode.category];
              const toCluster = clusterPositions[toNode.category];
              if (!fromCluster || !toCluster) return null;

              // Simplified position calculation
              return (
                <MyceliumThread
                  key={`${line.from}-${line.to}`}
                  from={fromCluster}
                  to={toCluster}
                  isActive={true}
                  delay={index * 50}
                />
              );
            })}
          </g>

          {/* Category clusters */}
          {categoryOrder.map((category) => {
            const nodes = getNodesByCategory(category).filter(n => filteredNodes.includes(n));
            if (nodes.length === 0) return null;
            const position = clusterPositions[category];
            if (!position) return null;

            return (
              <CategoryCluster
                key={category}
                category={category}
                nodes={nodes}
                currentPage={currentPage}
                hoveredNode={hoveredNode}
                onNavigate={handleNavigate}
                onNodeHover={setHoveredNode}
                clusterPosition={position}
                clusterRadius={Math.min(dimensions.width, dimensions.height) * 0.15}
              />
            );
          })}
        </svg>

        {/* Quick search results overlay (when searching) */}
        {searchQuery && filteredNodes.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-30 max-h-48 overflow-y-auto">
            <div className="bg-zinc-900/95 border border-zinc-700 rounded-xl p-2 backdrop-blur-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredNodes.slice(0, 8).map((node) => {
                  const meta = categoryMeta[node.category];
                  const Icon = node.icon;
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleNavigate(node.id)}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg text-left
                        transition-colors
                        ${node.id === currentPage
                          ? `bg-${meta.color}-500/20 border border-${meta.color}-500`
                          : 'bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${node.id === currentPage ? `text-${meta.color}-400` : 'text-zinc-400'}`} />
                      <span className={`text-sm truncate ${node.id === currentPage ? `text-${meta.color}-400` : 'text-zinc-300'}`}>
                        {node.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filteredNodes.length > 8 && (
                <p className="text-xs text-zinc-500 text-center mt-2">
                  +{filteredNodes.length - 8} more results
                </p>
              )}
            </div>
          </div>
        )}

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">Esc</kbd>
            to close
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">/</kbd>
            to search
          </span>
        </div>
      </div>
    </div>
  );
};

export default MyceliumHub;
