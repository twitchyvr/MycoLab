// ============================================================================
// FEATURE TRACKER - DEPENDENCY ANALYSIS
// Dependency graph, critical path, and blocker detection
// ============================================================================

import type { Feature, UUID } from '../types';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

export interface DependencyNode {
  feature: Feature;
  dependsOn: UUID[];           // Features this depends on
  blockedBy: UUID[];           // Features blocking this (unmet deps)
  blocks: UUID[];              // Features that depend on this
  depth: number;               // Depth in dependency tree
  isReady: boolean;            // All dependencies met
  isCriticalPath: boolean;     // On the critical path
}

export interface DependencyGraph {
  nodes: Map<UUID, DependencyNode>;
  roots: UUID[];               // Features with no dependencies
  leaves: UUID[];              // Features that nothing depends on
  criticalPath: UUID[];        // Longest path through the graph
  cycles: UUID[][];            // Detected cycles (should be empty!)
}

// ----------------------------------------------------------------------------
// GRAPH CONSTRUCTION
// ----------------------------------------------------------------------------

/**
 * Build a complete dependency graph from features
 */
export function buildDependencyGraph(features: Feature[]): DependencyGraph {
  const nodes = new Map<UUID, DependencyNode>();
  const featureMap = new Map<UUID, Feature>();

  // Initialize nodes
  for (const feature of features) {
    featureMap.set(feature.id, feature);
    nodes.set(feature.id, {
      feature,
      dependsOn: feature.dependencies || [],
      blockedBy: [],
      blocks: [],
      depth: 0,
      isReady: true,
      isCriticalPath: false,
    });
  }

  // Build reverse dependencies (blocks)
  for (const feature of features) {
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        const depNode = nodes.get(depId);
        if (depNode) {
          depNode.blocks.push(feature.id);
        }
      }
    }
  }

  // Calculate blockedBy (unmet dependencies)
  for (const node of nodes.values()) {
    for (const depId of node.dependsOn) {
      const dep = featureMap.get(depId);
      if (dep && dep.status !== 'completed') {
        node.blockedBy.push(depId);
        node.isReady = false;
      }
    }
  }

  // Find roots and leaves
  const roots = Array.from(nodes.values())
    .filter(n => n.dependsOn.length === 0)
    .map(n => n.feature.id);

  const leaves = Array.from(nodes.values())
    .filter(n => n.blocks.length === 0)
    .map(n => n.feature.id);

  // Calculate depths
  calculateDepths(nodes, roots);

  // Detect cycles
  const cycles = detectCycles(nodes);

  // Find critical path
  const criticalPath = findCriticalPath(nodes, roots, featureMap);

  // Mark critical path nodes
  for (const id of criticalPath) {
    const node = nodes.get(id);
    if (node) {
      node.isCriticalPath = true;
    }
  }

  return {
    nodes,
    roots,
    leaves,
    criticalPath,
    cycles,
  };
}

/**
 * Calculate depth of each node (longest path from root)
 */
function calculateDepths(nodes: Map<UUID, DependencyNode>, roots: UUID[]): void {
  const visited = new Set<UUID>();

  function visit(id: UUID, depth: number): void {
    if (visited.has(id)) return;
    visited.add(id);

    const node = nodes.get(id);
    if (!node) return;

    node.depth = Math.max(node.depth, depth);

    for (const blockId of node.blocks) {
      visit(blockId, depth + 1);
    }
  }

  for (const rootId of roots) {
    visit(rootId, 0);
  }
}

/**
 * Detect cycles in the dependency graph
 */
function detectCycles(nodes: Map<UUID, DependencyNode>): UUID[][] {
  const cycles: UUID[][] = [];
  const visited = new Set<UUID>();
  const recursionStack = new Set<UUID>();
  const path: UUID[] = [];

  function dfs(id: UUID): void {
    if (recursionStack.has(id)) {
      // Found a cycle - extract it from path
      const cycleStart = path.indexOf(id);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart));
      }
      return;
    }

    if (visited.has(id)) return;

    visited.add(id);
    recursionStack.add(id);
    path.push(id);

    const node = nodes.get(id);
    if (node) {
      for (const depId of node.dependsOn) {
        dfs(depId);
      }
    }

    path.pop();
    recursionStack.delete(id);
  }

  for (const id of nodes.keys()) {
    dfs(id);
  }

  return cycles;
}

/**
 * Find the critical path (longest path through incomplete features)
 */
function findCriticalPath(
  nodes: Map<UUID, DependencyNode>,
  roots: UUID[],
  featureMap: Map<UUID, Feature>
): UUID[] {
  let longestPath: UUID[] = [];

  function dfs(id: UUID, path: UUID[]): void {
    const feature = featureMap.get(id);
    if (!feature || feature.status === 'completed' || feature.status === 'cancelled') {
      return;
    }

    const newPath = [...path, id];

    if (newPath.length > longestPath.length) {
      longestPath = newPath;
    }

    const node = nodes.get(id);
    if (node) {
      for (const blockId of node.blocks) {
        dfs(blockId, newPath);
      }
    }
  }

  // Start from each incomplete root
  for (const rootId of roots) {
    const feature = featureMap.get(rootId);
    if (feature && feature.status !== 'completed' && feature.status !== 'cancelled') {
      dfs(rootId, []);
    }
  }

  return longestPath;
}

// ----------------------------------------------------------------------------
// QUERIES
// ----------------------------------------------------------------------------

/**
 * Get all features that are blocked by a specific feature
 */
export function getBlockedByFeature(
  featureId: UUID,
  graph: DependencyGraph
): Feature[] {
  const result: Feature[] = [];
  const visited = new Set<UUID>();

  function collectBlocked(id: UUID): void {
    if (visited.has(id)) return;
    visited.add(id);

    const node = graph.nodes.get(id);
    if (!node) return;

    for (const blockId of node.blocks) {
      const blockNode = graph.nodes.get(blockId);
      if (blockNode) {
        result.push(blockNode.feature);
        collectBlocked(blockId);
      }
    }
  }

  collectBlocked(featureId);
  return result;
}

/**
 * Get all features that a specific feature depends on (transitively)
 */
export function getAllDependencies(
  featureId: UUID,
  graph: DependencyGraph
): Feature[] {
  const result: Feature[] = [];
  const visited = new Set<UUID>();

  function collectDeps(id: UUID): void {
    if (visited.has(id)) return;
    visited.add(id);

    const node = graph.nodes.get(id);
    if (!node) return;

    for (const depId of node.dependsOn) {
      const depNode = graph.nodes.get(depId);
      if (depNode) {
        result.push(depNode.feature);
        collectDeps(depId);
      }
    }
  }

  collectDeps(featureId);
  return result;
}

/**
 * Get features that would be unblocked if a feature was completed
 */
export function getWouldUnblock(
  featureId: UUID,
  graph: DependencyGraph
): Feature[] {
  const node = graph.nodes.get(featureId);
  if (!node) return [];

  return node.blocks
    .map(id => graph.nodes.get(id))
    .filter((n): n is DependencyNode => {
      if (!n) return false;
      // Only include if this is the ONLY blocker
      return n.blockedBy.length === 1 && n.blockedBy[0] === featureId;
    })
    .map(n => n.feature);
}

/**
 * Get impact score of completing a feature (how many features it unblocks)
 */
export function getFeatureImpact(featureId: UUID, graph: DependencyGraph): number {
  const blocked = getBlockedByFeature(featureId, graph);
  return blocked.length;
}

// ----------------------------------------------------------------------------
// GRAPH VISUALIZATION DATA
// ----------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  label: string;
  status: string;
  priority: string;
  isReady: boolean;
  isCriticalPath: boolean;
  depth: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  isBlocking: boolean;  // Source is blocking target (not completed)
}

/**
 * Get data formatted for graph visualization
 */
export function getGraphVisualizationData(
  graph: DependencyGraph
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const graphNodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const node of graph.nodes.values()) {
    graphNodes.push({
      id: node.feature.id,
      label: node.feature.title,
      status: node.feature.status,
      priority: node.feature.priority,
      isReady: node.isReady,
      isCriticalPath: node.isCriticalPath,
      depth: node.depth,
    });

    // Add edges
    for (const depId of node.dependsOn) {
      const isBlocking = node.blockedBy.includes(depId);
      edges.push({
        source: depId,
        target: node.feature.id,
        isBlocking,
      });
    }
  }

  return { nodes: graphNodes, edges };
}

// ----------------------------------------------------------------------------
// VALIDATION
// ----------------------------------------------------------------------------

/**
 * Validate dependencies are valid
 */
export function validateDependencies(
  features: Feature[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const featureIds = new Set(features.map(f => f.id));

  for (const feature of features) {
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        // Check dependency exists
        if (!featureIds.has(depId)) {
          errors.push(
            `Feature "${feature.title}" (${feature.id}) depends on non-existent feature: ${depId}`
          );
        }

        // Check for self-dependency
        if (depId === feature.id) {
          errors.push(
            `Feature "${feature.title}" (${feature.id}) depends on itself`
          );
        }
      }
    }
  }

  // Check for cycles
  const graph = buildDependencyGraph(features);
  if (graph.cycles.length > 0) {
    for (const cycle of graph.cycles) {
      const cycleNames = cycle
        .map(id => {
          const node = graph.nodes.get(id);
          return node ? node.feature.title : id;
        })
        .join(' -> ');
      errors.push(`Circular dependency detected: ${cycleNames}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
