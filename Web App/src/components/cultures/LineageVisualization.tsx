// ============================================================================
// LINEAGE VISUALIZATION
// Interactive family tree showing culture lineages and genetic relationships
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import type { Culture } from '../../store/types';

// Node positions for tree layout
interface TreeNode {
  culture: Culture;
  x: number;
  y: number;
  level: number;
  children: TreeNode[];
}

// Icons
const Icons = {
  ZoomIn: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  ZoomOut: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Reset: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// Culture type icons and colors - enhanced for better visibility
const cultureConfig: Record<string, {
  icon: string;
  color: string;
  bgColor: string;
  svgBg: string;
  svgBorder: string;
  svgAccent: string;
}> = {
  spore_syringe: {
    icon: '💉',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/80 border-purple-600',
    svgBg: '#581c87',     // purple-900
    svgBorder: '#9333ea', // purple-600
    svgAccent: '#c084fc', // purple-400
  },
  liquid_culture: {
    icon: '💧',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/80 border-blue-600',
    svgBg: '#1e3a8a',     // blue-900
    svgBorder: '#2563eb', // blue-600
    svgAccent: '#60a5fa', // blue-400
  },
  agar: {
    icon: '🧫',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/80 border-emerald-600',
    svgBg: '#064e3b',     // emerald-900
    svgBorder: '#059669', // emerald-600
    svgAccent: '#34d399', // emerald-400
  },
  slant: {
    icon: '🧪',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/80 border-amber-600',
    svgBg: '#78350f',     // amber-900
    svgBorder: '#d97706', // amber-600
    svgAccent: '#fbbf24', // amber-400
  },
  grain_spawn: {
    icon: '🌾',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/80 border-orange-600',
    svgBg: '#7c2d12',     // orange-900
    svgBorder: '#ea580c', // orange-600
    svgAccent: '#fb923c', // orange-400
  },
};

const statusColors: Record<string, { ring: string; fill: string }> = {
  active: { ring: '#10b981', fill: '#10b981' },     // emerald-500
  colonizing: { ring: '#3b82f6', fill: '#3b82f6' }, // blue-500
  ready: { ring: '#22c55e', fill: '#22c55e' },      // green-500
  contaminated: { ring: '#ef4444', fill: '#ef4444' }, // red-500
  expired: { ring: '#71717a', fill: '#71717a' },    // zinc-500
  used: { ring: '#52525b', fill: '#52525b' },       // zinc-600
  archived: { ring: '#a1a1aa', fill: '#a1a1aa' },   // zinc-400
  depleted: { ring: '#71717a', fill: '#71717a' },   // zinc-500
};

export const LineageVisualization: React.FC = () => {
  const { state, getStrain, getCultureLineage } = useData();
  const cultures = state.cultures;

  // UI State
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filterStrain, setFilterStrain] = useState<string | 'all'>('all');
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [highlightedLineage, setHighlightedLineage] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'network'>('tree');

  // Get unique strains that have cultures
  const usedStrains = useMemo(() => {
    const strainIds = [...new Set(cultures.map(c => c.strainId))];
    return strainIds.map(id => getStrain(id)).filter(Boolean);
  }, [cultures, getStrain]);

  // Find root cultures (no parent)
  const rootCultures = useMemo(() => {
    return cultures.filter(c => !c.parentId);
  }, [cultures]);

  // Build tree structure
  const buildTree = useCallback((culture: Culture, level: number = 0): TreeNode => {
    const children = cultures.filter(c => c.parentId === culture.id);
    return {
      culture,
      x: 0,
      y: level * 120,
      level,
      children: children.map(child => buildTree(child, level + 1)),
    };
  }, [cultures]);

  // Calculate positions for tree layout
  const calculatePositions = useCallback((nodes: TreeNode[], startX: number = 0): number => {
    const nodeWidth = 160;
    const nodeGap = 40;
    let currentX = startX;

    nodes.forEach(node => {
      if (node.children.length === 0) {
        node.x = currentX;
        currentX += nodeWidth + nodeGap;
      } else {
        const childWidth = calculatePositions(node.children, currentX);
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.x = (firstChild.x + lastChild.x) / 2;
        currentX = Math.max(currentX, node.x + nodeWidth + nodeGap);
      }
    });

    return currentX;
  }, []);

  // Build forest (multiple trees)
  const forest = useMemo(() => {
    let filtered = rootCultures;
    
    if (filterStrain !== 'all') {
      filtered = filtered.filter(c => c.strainId === filterStrain);
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    const trees = filtered.map(root => buildTree(root));
    let offset = 0;
    trees.forEach(tree => {
      const width = calculatePositions([tree], offset);
      offset = width + 80;
    });
    return trees;
  }, [rootCultures, filterStrain, filterType, buildTree, calculatePositions]);

  // Flatten tree for rendering
  const flattenTree = useCallback((nodes: TreeNode[]): TreeNode[] => {
    return nodes.flatMap(node => [node, ...flattenTree(node.children)]);
  }, []);

  const allNodes = useMemo(() => flattenTree(forest), [forest, flattenTree]);

  // Calculate SVG dimensions
  const dimensions = useMemo(() => {
    if (allNodes.length === 0) return { width: 800, height: 400 };
    const maxX = Math.max(...allNodes.map(n => n.x)) + 200;
    const maxY = Math.max(...allNodes.map(n => n.y)) + 150;
    return { width: Math.max(800, maxX), height: Math.max(400, maxY) };
  }, [allNodes]);

  // Handle culture click
  const handleCultureClick = (culture: Culture) => {
    setSelectedCulture(culture);
    const lineage = getCultureLineage(culture.id);
    const lineageIds = new Set([
      ...lineage.ancestors.map(c => c.id),
      culture.id,
      ...lineage.descendants.map(c => c.id),
    ]);
    setHighlightedLineage(lineageIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCulture(null);
    setHighlightedLineage(new Set());
  };

  // Render connection lines - enhanced visibility
  const renderConnections = () => {
    const lines: JSX.Element[] = [];

    const drawLines = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        node.children.forEach(child => {
          const isHighlighted = highlightedLineage.has(node.culture.id) && highlightedLineage.has(child.culture.id);
          const parentConfig = cultureConfig[node.culture.type] || cultureConfig.agar;
          const childConfig = cultureConfig[child.culture.type] || cultureConfig.agar;

          // Create gradient ID for this connection
          const gradientId = `gradient-${node.culture.id}-${child.culture.id}`;

          lines.push(
            <defs key={`defs-${node.culture.id}-${child.culture.id}`}>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isHighlighted ? '#10b981' : parentConfig.svgBorder} />
                <stop offset="100%" stopColor={isHighlighted ? '#10b981' : childConfig.svgBorder} />
              </linearGradient>
            </defs>
          );

          // Shadow line for depth
          lines.push(
            <path
              key={`shadow-${node.culture.id}-${child.culture.id}`}
              d={`M ${node.x + 70} ${node.y + 82}
                  C ${node.x + 70} ${node.y + 102},
                    ${child.x + 70} ${child.y - 18},
                    ${child.x + 70} ${child.y + 2}`}
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={isHighlighted ? 5 : 4}
              strokeLinecap="round"
            />
          );

          // Main connection line
          lines.push(
            <path
              key={`${node.culture.id}-${child.culture.id}`}
              d={`M ${node.x + 70} ${node.y + 80}
                  C ${node.x + 70} ${node.y + 100},
                    ${child.x + 70} ${child.y - 20},
                    ${child.x + 70} ${child.y}`}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={isHighlighted ? 3 : 2.5}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          );

          // Arrow/dot at child end
          lines.push(
            <circle
              key={`dot-${node.culture.id}-${child.culture.id}`}
              cx={child.x + 70}
              cy={child.y - 2}
              r={isHighlighted ? 4 : 3}
              fill={isHighlighted ? '#10b981' : childConfig.svgBorder}
            />
          );
        });
        drawLines(node.children);
      });
    };

    drawLines(forest);
    return lines;
  };

  // Render culture node - enhanced with proper SVG styling
  const renderNode = (node: TreeNode) => {
    const { culture } = node;
    const config = cultureConfig[culture.type] || cultureConfig.agar;
    const strain = getStrain(culture.strainId);
    const isSelected = selectedCulture?.id === culture.id;
    const isInLineage = highlightedLineage.has(culture.id);
    const opacity = highlightedLineage.size === 0 || isInLineage ? 1 : 0.3;
    const statusConfig = statusColors[culture.status] || statusColors.active;

    return (
      <g
        key={culture.id}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer"
        onClick={() => handleCultureClick(culture)}
        style={{ opacity }}
      >
        {/* Drop shadow for depth */}
        <defs>
          <filter id={`shadow-${culture.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Node background - solid fill with gradient */}
        <rect
          x="0"
          y="0"
          width="140"
          height="80"
          rx="10"
          fill={config.svgBg}
          stroke={isSelected ? '#10b981' : config.svgBorder}
          strokeWidth={isSelected ? 3 : 2}
          filter={`url(#shadow-${culture.id})`}
        />

        {/* Inner highlight line at top */}
        <rect
          x="1"
          y="1"
          width="138"
          height="3"
          rx="10"
          fill={config.svgAccent}
          opacity="0.4"
        />

        {/* Status indicator with glow */}
        <circle
          cx="122"
          cy="18"
          r="10"
          fill={config.svgBg}
          stroke={statusConfig.ring}
          strokeWidth="2"
        />
        <circle
          cx="122"
          cy="18"
          r="6"
          fill={statusConfig.fill}
        />

        {/* Type icon */}
        <text x="12" y="32" fontSize="22">{config.icon}</text>

        {/* Culture label - bold white text */}
        <text
          x="40"
          y="30"
          fill="#ffffff"
          fontSize="14"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {culture.label}
        </text>

        {/* Strain name - light gray for contrast */}
        <text
          x="12"
          y="52"
          fill="#d4d4d8"
          fontSize="12"
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {strain?.name || 'Unknown'}
        </text>

        {/* Generation badge */}
        <rect
          x="12"
          y="58"
          width="28"
          height="16"
          rx="4"
          fill="rgba(0,0,0,0.3)"
        />
        <text
          x="26"
          y="70"
          fill="#a1a1aa"
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          G{culture.generation}
        </text>

        {/* Health indicator bars */}
        {culture.healthRating && (
          <g transform="translate(85, 58)">
            {[1, 2, 3, 4, 5].map(i => (
              <rect
                key={i}
                x={(i - 1) * 9}
                y={0}
                width="7"
                height="14"
                rx="2"
                fill={i <= culture.healthRating! ? '#10b981' : 'rgba(63,63,70,0.8)'}
                stroke={i <= culture.healthRating! ? '#059669' : 'transparent'}
                strokeWidth="1"
              />
            ))}
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lineage Visualization</h2>
          <p className="text-zinc-400 text-sm">Interactive family tree of your culture library</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">{cultures.length} cultures</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        {/* Filters */}
        <select
          value={filterStrain}
          onChange={e => setFilterStrain(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Strains</option>
          {usedStrains.map(s => s && <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="spore_syringe">💉 Spore Syringe</option>
          <option value="liquid_culture">💧 Liquid Culture</option>
          <option value="agar">🧫 Agar</option>
          <option value="slant">🧪 Slant</option>
          <option value="grain_spawn">🌾 Grain Spawn</option>
        </select>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <Icons.ZoomOut />
          </button>
          <span className="px-2 text-sm text-zinc-400 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <Icons.ZoomIn />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Reset Zoom"
          >
            <Icons.Reset />
          </button>
        </div>

        {highlightedLineage.size > 0 && (
          <button
            onClick={clearSelection}
            className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            <Icons.X />
            Clear Selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-zinc-500">Types:</span>
        {Object.entries(cultureConfig).map(([type, config]) => (
          <span key={type} className={`flex items-center gap-1 ${config.color}`}>
            <span>{config.icon}</span>
            <span className="capitalize">{type.replace('_', ' ')}</span>
          </span>
        ))}
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-500">Status:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Colonizing</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Ready</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Contaminated</span>
      </div>

      {/* Main visualization */}
      <div className="flex gap-6">
        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {allNodes.length > 0 ? (
              <svg
                width={dimensions.width * zoom}
                height={dimensions.height * zoom}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="min-w-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              >
                {/* Connection lines */}
                <g className="connections">
                  {renderConnections()}
                </g>

                {/* Nodes */}
                <g className="nodes">
                  {allNodes.map(node => renderNode(node))}
                </g>
              </svg>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                <div className="text-center">
                  <p className="text-lg mb-2">No cultures to display</p>
                  <p className="text-sm">Add cultures to see the lineage tree</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel - Enhanced styling */}
        {selectedCulture && (
          <div className="w-80 bg-zinc-900/90 border border-zinc-700 rounded-xl p-5 h-fit shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cultureConfig[selectedCulture.type]?.bgColor || 'bg-zinc-800'}`}>
                  <span className="text-2xl">{cultureConfig[selectedCulture.type]?.icon || '🧫'}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCulture.label}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${cultureConfig[selectedCulture.type]?.color || 'text-zinc-400'}`}>
                    {selectedCulture.type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <button onClick={clearSelection} className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-0 text-sm">
              <div className="flex justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400 font-medium">Strain</span>
                <span className="text-white font-semibold">{getStrain(selectedCulture.strainId)?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400 font-medium">Generation</span>
                <span className="text-white font-semibold">G{selectedCulture.generation}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                <span className="text-zinc-400 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  selectedCulture.status === 'active' ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600' :
                  selectedCulture.status === 'contaminated' ? 'bg-red-900/80 text-red-300 border border-red-600' :
                  selectedCulture.status === 'ready' ? 'bg-green-900/80 text-green-300 border border-green-600' :
                  selectedCulture.status === 'colonizing' ? 'bg-blue-900/80 text-blue-300 border border-blue-600' :
                  'bg-zinc-800 text-zinc-300 border border-zinc-600'
                }`}>
                  {selectedCulture.status}
                </span>
              </div>
              {selectedCulture.healthRating && (
                <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                  <span className="text-zinc-400 font-medium">Health</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`w-2.5 h-5 rounded ${i <= selectedCulture.healthRating! ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between py-3 border-b border-zinc-800">
                <span className="text-zinc-400 font-medium">Created</span>
                <span className="text-white font-semibold">{new Date(selectedCulture.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedCulture.notes && (
                <div className="pt-3">
                  <p className="text-zinc-400 text-xs font-medium mb-2">Notes</p>
                  <p className="text-zinc-200 text-sm bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 leading-relaxed">{selectedCulture.notes}</p>
                </div>
              )}
            </div>

            {/* Lineage stats */}
            {highlightedLineage.size > 1 && (
              <div className="mt-5 pt-4 border-t border-zinc-700">
                <p className="text-xs text-zinc-400 font-medium mb-3">Lineage Overview</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 mb-1">Ancestors</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {getCultureLineage(selectedCulture.id).ancestors.length}
                    </p>
                  </div>
                  <div className="bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-zinc-400 mb-1">Descendants</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {getCultureLineage(selectedCulture.id).descendants.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats footer - Enhanced cards */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(cultureConfig).map(([type, config]) => {
          const count = cultures.filter(c => c.type === type).length;
          return (
            <div
              key={type}
              className={`${config.bgColor} rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-lg cursor-default`}
              onClick={() => setFilterType(type === filterType ? 'all' : type)}
            >
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl">{config.icon}</span>
              </div>
              <p className="text-3xl font-bold text-white">{count}</p>
              <p className={`text-xs font-medium capitalize ${config.color}`}>{type.replace(/_/g, ' ')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LineageVisualization;
