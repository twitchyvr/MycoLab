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

// Culture type icons and colors
const cultureConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  spore_syringe: { icon: '💉', color: 'text-purple-400', bgColor: 'bg-purple-950/50 border-purple-700' },
  liquid_culture: { icon: '💧', color: 'text-blue-400', bgColor: 'bg-blue-950/50 border-blue-700' },
  agar: { icon: '🧫', color: 'text-emerald-400', bgColor: 'bg-emerald-950/50 border-emerald-700' },
  slant: { icon: '🧪', color: 'text-amber-400', bgColor: 'bg-amber-950/50 border-amber-700' },
  grain_spawn: { icon: '🌾', color: 'text-orange-400', bgColor: 'bg-orange-950/50 border-orange-700' },
};

const statusColors: Record<string, string> = {
  active: 'ring-emerald-500',
  colonizing: 'ring-blue-500',
  ready: 'ring-green-500',
  contaminated: 'ring-red-500',
  expired: 'ring-zinc-500',
  used: 'ring-zinc-600',
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

  // Render connection lines
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    
    const drawLines = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        node.children.forEach(child => {
          const isHighlighted = highlightedLineage.has(node.culture.id) && highlightedLineage.has(child.culture.id);
          lines.push(
            <path
              key={`${node.culture.id}-${child.culture.id}`}
              d={`M ${node.x + 70} ${node.y + 80} 
                  C ${node.x + 70} ${node.y + 100}, 
                    ${child.x + 70} ${child.y - 20}, 
                    ${child.x + 70} ${child.y}`}
              fill="none"
              stroke={isHighlighted ? '#10b981' : '#3f3f46'}
              strokeWidth={isHighlighted ? 3 : 2}
              className="transition-all duration-300"
            />
          );
        });
        drawLines(node.children);
      });
    };

    drawLines(forest);
    return lines;
  };

  // Render culture node
  const renderNode = (node: TreeNode) => {
    const { culture } = node;
    const config = cultureConfig[culture.type] || cultureConfig.agar;
    const strain = getStrain(culture.strainId);
    const isSelected = selectedCulture?.id === culture.id;
    const isInLineage = highlightedLineage.has(culture.id);
    const opacity = highlightedLineage.size === 0 || isInLineage ? 1 : 0.3;

    return (
      <g
        key={culture.id}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer"
        onClick={() => handleCultureClick(culture)}
        style={{ opacity }}
      >
        {/* Node background */}
        <rect
          x="0"
          y="0"
          width="140"
          height="80"
          rx="8"
          className={`${config.bgColor} transition-all duration-300 ${
            isSelected ? 'stroke-emerald-500 stroke-2' : 'stroke-zinc-700'
          }`}
          fill="currentColor"
          stroke="currentColor"
        />
        
        {/* Status ring */}
        <circle
          cx="120"
          cy="20"
          r="8"
          className={`${statusColors[culture.status]} ring-2`}
          fill={culture.status === 'contaminated' ? '#ef4444' : 
                culture.status === 'ready' ? '#22c55e' : 
                culture.status === 'active' ? '#10b981' : '#52525b'}
        />

        {/* Type icon */}
        <text x="15" y="30" fontSize="20">{config.icon}</text>

        {/* Label */}
        <text x="40" y="28" className="fill-white text-sm font-bold">{culture.label}</text>

        {/* Strain name */}
        <text x="15" y="50" className="fill-zinc-400 text-xs">
          {strain?.name || 'Unknown'}
        </text>

        {/* Generation */}
        <text x="15" y="68" className="fill-zinc-500 text-xs">
          G{culture.generation}
        </text>

        {/* Health indicator */}
        {culture.healthRating && (
          <g transform="translate(90, 55)">
            {[1, 2, 3, 4, 5].map(i => (
              <rect
                key={i}
                x={(i - 1) * 8}
                y={0}
                width="6"
                height="12"
                rx="1"
                fill={i <= culture.healthRating! ? '#10b981' : '#3f3f46'}
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

        {/* Detail Panel */}
        {selectedCulture && (
          <div className="w-80 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-fit">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cultureConfig[selectedCulture.type]?.icon || '🧫'}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedCulture.label}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${cultureConfig[selectedCulture.type]?.bgColor || 'bg-zinc-800'}`}>
                    {selectedCulture.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button onClick={clearSelection} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Strain</span>
                <span className="text-white">{getStrain(selectedCulture.strainId)?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Generation</span>
                <span className="text-white">G{selectedCulture.generation}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  selectedCulture.status === 'active' ? 'bg-emerald-950/50 text-emerald-400' :
                  selectedCulture.status === 'contaminated' ? 'bg-red-950/50 text-red-400' :
                  selectedCulture.status === 'ready' ? 'bg-green-950/50 text-green-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {selectedCulture.status}
                </span>
              </div>
              {selectedCulture.healthRating && (
                <div className="flex justify-between py-2 border-b border-zinc-800">
                  <span className="text-zinc-500">Health</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${i <= selectedCulture.healthRating! ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-zinc-800">
                <span className="text-zinc-500">Created</span>
                <span className="text-white">{new Date(selectedCulture.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedCulture.notes && (
                <div className="pt-2">
                  <p className="text-zinc-500 text-xs mb-1">Notes</p>
                  <p className="text-zinc-300 text-xs bg-zinc-800/50 rounded p-2">{selectedCulture.notes}</p>
                </div>
              )}
            </div>

            {/* Lineage stats */}
            {highlightedLineage.size > 1 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Lineage</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-zinc-500">Ancestors</p>
                    <p className="text-lg font-bold text-white">
                      {getCultureLineage(selectedCulture.id).ancestors.length}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-zinc-500">Descendants</p>
                    <p className="text-lg font-bold text-white">
                      {getCultureLineage(selectedCulture.id).descendants.length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(cultureConfig).map(([type, config]) => {
          const count = cultures.filter(c => c.type === type).length;
          return (
            <div key={type} className={`${config.bgColor} border rounded-xl p-4 text-center`}>
              <span className="text-2xl">{config.icon}</span>
              <p className="text-2xl font-bold text-white mt-1">{count}</p>
              <p className="text-xs text-zinc-400 capitalize">{type.replace('_', ' ')}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LineageVisualization;
