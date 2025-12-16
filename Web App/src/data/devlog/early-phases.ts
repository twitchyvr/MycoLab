// ============================================================================
// DEV LOG: EARLY PHASES (1-9)
// Foundation, Core Tracking, Strain Library, Farm Mapping, Daily Ops,
// Recipes, Photo Journal, Supplies, Yields
// ============================================================================

import type { DevLogFeature } from '../../types';

// Helper for timestamps
const timestamp = () => new Date().toISOString();

/**
 * Phase 1: Foundation
 * Phase 2: Core Tracking
 * Phase 3: Strain Library
 * Phase 4: Farm/Lab Mapping
 * Phase 5: Daily Operations
 * Phase 6: Recipes & Substrates
 * Phase 7: Photo Journal
 * Phase 8: Supplies & Inventory
 * Phase 9: Yield & Analytics
 */
export const earlyPhases: DevLogFeature[] = [
  // =============================================================================
  // PHASE 1: FOUNDATION
  // =============================================================================
  {
    id: 'dev-001',
    title: 'Application Architecture Setup',
    description: 'React + TypeScript + Vite + Tailwind. Component structure, routing, state management foundation.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-002',
    title: 'Dark Theme UI Design',
    description: 'Consistent dark theme using zinc/emerald color palette. Mobile-responsive sidebar navigation.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-003',
    title: 'Type System & Data Models',
    description: 'Comprehensive TypeScript types for all entities: cultures, grows, strains, recipes, inventory, etc.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 10,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 2: CORE TRACKING
  // =============================================================================
  {
    id: 'dev-010',
    title: 'Analytics Dashboard',
    description: 'Summary statistics: active cultures, grows in progress, success rates, yield trends.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 10,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-011',
    title: 'Culture Management',
    description: 'Full CRUD for cultures: LC, agar, slants, spore syringes. Track status, health, generation.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 16,
    actualHours: 14,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-012',
    title: 'Grow Management',
    description: 'Track grows from spawning through harvest. Stage progression, observations, harvest logging.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 20,
    actualHours: 18,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-013',
    title: 'Flush/Harvest Tracking',
    description: 'Log multiple flushes per grow. Track wet/dry weights, quality ratings, mushroom counts.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-014',
    title: 'Lineage Visualization',
    description: 'Interactive tree view showing culture relationships. Track T0 → T1 → T2 generations.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 12,
    actualHours: 14,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-015',
    title: 'Culture Transfer Logging',
    description: 'Log transfers between cultures. Auto-increment generation count, update parent/child relationships.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 5,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 3: STRAIN/SPECIES LIBRARY
  // =============================================================================
  {
    id: 'dev-020',
    title: 'Species Database',
    description: 'Comprehensive species data: scientific names, common names, cultivation parameters, optimal ranges. 35+ species with full grow cycle data.',
    category: 'data',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 16,
    actualHours: 20,
    completedAt: timestamp(),
    notes: 'Includes gourmet, medicinal, and research species with full parameters for automation.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-021',
    title: 'Strain Performance Analytics',
    description: 'Track success rates, average yields, contamination rates, and optimal conditions per strain based on historical grows',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 10,
    actualHours: 8,
    dependencies: ['dev-020', 'dev-012'],
    completedAt: timestamp(),
    notes: `Added dedicated Strain Performance Analytics page (dev-021). Features:

**Overview Mode:**
- Summary KPI cards: strains tracked, total grows, total yield, avg success rate, avg BE%, top performer
- Strain rankings by BE% with horizontal bar charts
- Success rate rankings across strains
- Grow distribution donut chart by strain
- Contamination rates analysis

**Detail Mode:**
- Select individual strain for deep-dive analytics
- Status distribution (completed, active, contaminated, aborted)
- Key metrics: success rate, contamination rate, avg BE%, total yield
- Yield statistics: avg per grow, avg per flush, best/worst yields, avg flushes
- Timing analysis: days to first harvest, days to completion
- Yield by flush number breakdown
- Monthly performance trends
- Substrate and container performance comparison

**Compare Mode:**
- Select up to 5 strains for side-by-side comparison
- Compare: success rate, avg BE%, yield/grow, contamination rate, days to harvest, avg flushes
- Visual rankings with best performer highlighted

**Key Insights Section:**
- Best biological efficiency strain
- Most reliable strain (lowest contamination)
- Highest yielder

Navigation: Available under "Strain Analytics" in the sidebar after "Analytics"`,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-023',
    title: 'Strain Management',
    description: 'Track strains with phenotype, genetics source, isolation type, generation. Link to species for grow parameters.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-022',
    title: 'Species Info Panel',
    description: 'Rich species detail view with tabs: Overview, Growing Conditions, Stage Guide, Automation. Environmental ranges with visual indicators.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    dependencies: ['dev-020'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 4: FARM/LAB MAPPING
  // =============================================================================
  {
    id: 'dev-030',
    title: 'Location Management',
    description: 'Define lab locations: rooms, racks, shelves, slots. Track environmental conditions, capacity.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    actualHours: 8,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-031',
    title: 'Location Assignment',
    description: 'Assign cultures and grows to locations. Track occupancy, location history.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 5,
    completedAt: timestamp(),
    dependencies: ['dev-030'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-032',
    title: 'Room Environmental Settings',
    description: 'Define target temp/humidity ranges per room. Track actual vs target conditions.',
    category: 'core',
    status: 'completed',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 3,
    completedAt: timestamp(),
    dependencies: ['dev-030'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-033',
    title: 'Occupancy Dashboard',
    description: 'Visual overview of room occupancy. What\'s where, capacity utilization, yields per location.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-031'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 5: DAILY OPERATIONS
  // =============================================================================
  {
    id: 'dev-040',
    title: 'Growing Room Daily Check',
    description: 'Morning walk-through workflow: check each room, log conditions, flag items needing attention, estimate 7-day harvest.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 14,
    actualHours: 12,
    completedAt: timestamp(),
    dependencies: ['dev-030'],
    notes: 'Full daily check system with room status tracking, attention flags, and harvest forecasting.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-041',
    title: 'Harvest Workflow',
    description: 'Streamlined harvest logging: select grow, enter weight, auto-calculate BE%, log flush, advance stage.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    dependencies: ['dev-040'],
    notes: 'Integrated with daily checks for seamless harvest recording.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-042',
    title: 'Cool Room / Fridge Check',
    description: 'Dedicated workflow for cold storage inventory. Check expiration dates, culture viability, spawn condition.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 6,
    actualHours: 5,
    completedAt: timestamp(),
    notes: 'Cold storage check component with item status tracking (good/attention/remove).',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-043',
    title: 'Harvest Forecast',
    description: '7-day rolling harvest predictions. Based on grow stage, species parameters, and historical data.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    actualHours: 8,
    completedAt: timestamp(),
    dependencies: ['dev-040'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 6: RECIPES & SUBSTRATES
  // =============================================================================
  {
    id: 'dev-050',
    title: 'Recipe Builder',
    description: 'Create and manage recipes for agar, LC, grain spawn, bulk substrates. Scale recipes, auto-calculate costs.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 14,
    actualHours: 12,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-051',
    title: 'Substrate Calculator',
    description: '4 calculation modes: target moisture, field capacity, wet/dry ratios, hydration adjustment.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 8,
    actualHours: 10,
    completedAt: timestamp(),
    notes: 'Full calculator with ingredient presets, save/load, and detailed explanations.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-052',
    title: 'Recipe Performance Tracking',
    description: 'Link grows to recipes. Compare yields, success rates, contamination rates per recipe.',
    category: 'core',
    status: 'planned',
    priority: 'high',
    estimatedHours: 8,
    dependencies: ['dev-050', 'dev-012'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 7: PHOTO JOURNAL
  // =============================================================================
  {
    id: 'dev-060',
    title: 'Photo Upload System',
    description: 'Upload and store photos for cultures, grows, observations. Cloud storage integration.',
    category: 'core',
    status: 'planned',
    priority: 'critical',
    estimatedHours: 16,
    notes: 'Foundation for visual documentation. Requires cloud storage setup.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-061',
    title: 'Photo Timeline View',
    description: 'Chronological photo gallery per culture/grow. Compare growth progression over time.',
    category: 'ui',
    status: 'planned',
    priority: 'high',
    estimatedHours: 10,
    dependencies: ['dev-060'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-062',
    title: 'Event/Observation Logging',
    description: 'General purpose event logger for cultures, grows, locations. Categories: observation, maintenance, harvest, transfer, contamination, etc.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 10,
    actualHours: 8,
    completedAt: timestamp(),
    notes: 'EventLogger component with category filtering, entity linking, and timeline view.',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 8: SUPPLIES & INVENTORY
  // =============================================================================
  {
    id: 'dev-070',
    title: 'Inventory Management',
    description: 'Track lab supplies: substrate ingredients, consumables, containers. Quantities, costs, reorder alerts.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 14,
    actualHours: 12,
    completedAt: timestamp(),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-071',
    title: 'Cost Tracking System',
    description: 'Track cost-of-goods across all grows. Link ingredient costs to recipes, recipes to grows. Drill-down from final yield to individual ingredient costs.',
    category: 'core',
    status: 'completed',
    priority: 'high',
    estimatedHours: 14,
    actualHours: 10,
    completedAt: timestamp(),
    dependencies: ['dev-070', 'dev-050'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-072',
    title: 'Cost Analysis Dashboard',
    description: 'Visualize cost breakdowns, cost per gram, ROI per grow, compare costs across strains/methods',
    category: 'ui',
    status: 'planned',
    priority: 'medium',
    estimatedHours: 10,
    dependencies: ['dev-071'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-073',
    title: 'Wishlist & Purchase Planning',
    description: 'Track wanted items, plan purchases, track what you want to try vs what you have tried',
    category: 'enhancement',
    status: 'backlog',
    priority: 'low',
    estimatedHours: 4,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },

  // =============================================================================
  // PHASE 9: YIELD & ANALYTICS
  // =============================================================================
  {
    id: 'dev-080',
    title: 'Harvest & Yield Logging',
    description: 'Record harvest weights (wet/dry), flush numbers, quality ratings. Track biological efficiency.',
    category: 'core',
    status: 'completed',
    priority: 'critical',
    estimatedHours: 8,
    actualHours: 6,
    completedAt: timestamp(),
    dependencies: ['dev-012'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-081',
    title: 'Performance Analytics Dashboard',
    description: 'Understand how grows perform over time. Compare yields, techniques, strains side by side. Identify best performers.',
    category: 'ui',
    status: 'completed',
    priority: 'high',
    estimatedHours: 14,
    actualHours: 12,
    completedAt: timestamp(),
    dependencies: ['dev-080'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-082',
    title: 'Success/Failure Pattern Recognition',
    description: 'Learn from data: repeat what works, avoid past mistakes. Track contamination rates, success rates per method.',
    category: 'core',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 12,
    dependencies: ['dev-081'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
  {
    id: 'dev-083',
    title: 'Smarter Reuse / Duplication',
    description: 'Duplicate successful grow setups easily. App learns from history to suggest optimal configurations.',
    category: 'enhancement',
    status: 'backlog',
    priority: 'medium',
    estimatedHours: 8,
    dependencies: ['dev-081'],
    createdAt: timestamp(),
    updatedAt: timestamp(),
  },
];

export default earlyPhases;
