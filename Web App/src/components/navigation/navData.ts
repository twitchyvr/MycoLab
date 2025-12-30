// ============================================================================
// MYCELIUM NAVIGATION SYSTEM - Navigation Data & Configuration
// ============================================================================

import React from 'react';
import type { NavNode, NavCategory, NavCategoryMeta, Page } from './types';

// ============================================================================
// ICONS - Inline SVG components for navigation
// ============================================================================

const createIcon = (paths: string, viewBox: string = '0 0 24 24') => {
  const IconComponent: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) =>
    React.createElement('svg', {
      viewBox,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      className,
      dangerouslySetInnerHTML: { __html: paths },
    });
  return IconComponent;
};

export const NavIcons = {
  // Daily Ops
  Dashboard: createIcon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  Command: createIcon('<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'),
  Forecast: createIcon('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  ColdStorage: createIcon('<line x1="12" y1="2" x2="12" y2="22"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M19.07 4.93l-4.24 4.24"/><path d="M9.17 14.83l-4.24 4.24"/><line x1="2" y1="12" x2="22" y2="12"/>'),

  // Cultivation
  Culture: createIcon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  Grow: createIcon('<path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/><path d="M19 12C19 12 15 13 12 17"/><path d="M5 12C5 12 9 13 12 17"/>'),
  Lineage: createIcon('<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="16"/><line x1="12" y1="12" x2="19" y2="16"/>'),
  Observations: createIcon('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/>'),
  EventLog: createIcon('<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>'),

  // Knowledge Base
  Library: createIcon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h4"/>'),
  Recipe: createIcon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),

  // Lab & Storage
  Inventory: createIcon('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  Stock: createIcon('<path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
  LabSpaces: createIcon('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
  Labels: createIcon('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),
  Scanner: createIcon('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>'),

  // Analytics
  Chart: createIcon('<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'),
  Target: createIcon('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  Alert: createIcon('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  TrendingUp: createIcon('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),

  // Calculators
  Calculator: createIcon('<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/>'),
  Scale: createIcon('<path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/>'),
  Thermometer: createIcon('<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>'),

  // Settings
  Settings: createIcon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  User: createIcon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  DevLog: createIcon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),

  // Special
  Mushroom: createIcon('<ellipse cx="12" cy="6" rx="8" ry="4"/><path d="M4 6c0 6 3 14 8 14s8-8 8-14"/><line x1="12" y1="10" x2="12" y2="20"/>'),
  Mycelium: createIcon('<circle cx="12" cy="12" r="2"/><path d="M12 14v4"/><path d="M12 4v4"/><path d="M6 12h4"/><path d="M14 12h4"/><path d="M7.76 7.76l2.83 2.83"/><path d="M13.41 13.41l2.83 2.83"/><path d="M7.76 16.24l2.83-2.83"/><path d="M13.41 10.59l2.83-2.83"/>'),
  Spore: createIcon('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="20" cy="12" r="1"/><circle cx="6.34" cy="6.34" r="1"/><circle cx="17.66" cy="17.66" r="1"/><circle cx="6.34" cy="17.66" r="1"/><circle cx="17.66" cy="6.34" r="1"/>'),

  // Additional icons for missing pages
  Grain: createIcon('<ellipse cx="12" cy="5" rx="3" ry="2"/><path d="M9 5v12a3 3 0 0 0 6 0V5"/><path d="M12 9h.01"/><path d="M12 13h.01"/>'),
  Flask: createIcon('<path d="M9 3h6v5l4 9H5l4-9V3z"/><path d="M9 3h6"/><path d="M8.5 14h7"/>'),
  Container: createIcon('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/>'),
  DollarSign: createIcon('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  Clock: createIcon('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  Book: createIcon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
};

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

export const categoryMeta: Record<NavCategory, NavCategoryMeta> = {
  daily: {
    id: 'daily',
    label: 'Daily Ops',
    icon: NavIcons.Command,
    color: 'emerald',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    description: 'Daily operations and monitoring',
  },
  cultivation: {
    id: 'cultivation',
    label: 'Cultivation',
    icon: NavIcons.Grow,
    color: 'blue',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    description: 'Cultures, grows, and lineage tracking',
  },
  knowledge: {
    id: 'knowledge',
    label: 'Knowledge',
    icon: NavIcons.Library,
    color: 'purple',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    description: 'Species library and recipes',
  },
  storage: {
    id: 'storage',
    label: 'Lab & Storage',
    icon: NavIcons.Inventory,
    color: 'amber',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    description: 'Inventory, locations, and labels',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    icon: NavIcons.Chart,
    color: 'cyan',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    description: 'Data insights and performance',
  },
  tools: {
    id: 'tools',
    label: 'Calculators',
    icon: NavIcons.Calculator,
    color: 'pink',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    description: 'Substrate, spawn, and pressure calculators',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: NavIcons.Settings,
    color: 'zinc',
    glowColor: 'rgba(161, 161, 170, 0.4)',
    description: 'Preferences and configuration',
  },
};

// ============================================================================
// NAVIGATION NODES - All pages with their relationships
// ============================================================================

export const navNodes: NavNode[] = [
  // Daily Ops
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    icon: NavIcons.Dashboard,
    category: 'daily',
    description: 'Lab command center overview',
    connections: ['commandcenter', 'cultures', 'grows', 'forecast'],
    quickAccess: true,
  },
  {
    id: 'commandcenter',
    label: 'Command Center',
    shortLabel: 'Command',
    icon: NavIcons.Command,
    category: 'daily',
    description: 'Unified daily operations hub',
    connections: ['dashboard', 'grows', 'observations'],
    quickAccess: true,
  },
  {
    id: 'forecast',
    label: 'Harvest Forecast',
    shortLabel: 'Forecast',
    icon: NavIcons.Forecast,
    category: 'daily',
    description: 'Predict stage transitions',
    connections: ['grows', 'analytics'],
  },
  {
    id: 'coldstorage',
    label: 'Cold Storage',
    shortLabel: 'Fridge',
    icon: NavIcons.ColdStorage,
    category: 'daily',
    description: 'Fridge and cold room inventory',
    connections: ['inventory', 'cultures'],
  },

  // Cultivation
  {
    id: 'cultures',
    label: 'Cultures',
    icon: NavIcons.Culture,
    category: 'cultivation',
    description: 'Culture library management',
    connections: ['grows', 'lineage', 'recipes'],
    quickAccess: true,
  },
  {
    id: 'grows',
    label: 'Grows',
    icon: NavIcons.Grow,
    category: 'cultivation',
    description: 'Active and completed grows',
    connections: ['cultures', 'forecast', 'analytics'],
    quickAccess: true,
  },
  {
    id: 'lineage',
    label: 'Lineage Tree',
    shortLabel: 'Lineage',
    icon: NavIcons.Lineage,
    category: 'cultivation',
    description: 'Culture family tree visualization',
    connections: ['cultures'],
  },
  {
    id: 'observations',
    label: 'Observations',
    icon: NavIcons.Observations,
    category: 'cultivation',
    description: 'Timeline of all observations',
    connections: ['cultures', 'grows', 'eventlog'],
  },
  {
    id: 'eventlog',
    label: 'Event Log',
    shortLabel: 'Events',
    icon: NavIcons.EventLog,
    category: 'cultivation',
    description: 'Lab events and notes',
    connections: ['observations'],
  },
  {
    id: 'spawn',
    label: 'Grain Spawn',
    shortLabel: 'Spawn',
    icon: NavIcons.Grain,
    category: 'cultivation',
    description: 'Track colonization from inoculation to spawn-to-bulk',
    connections: ['cultures', 'grows'],
  },

  // Knowledge Base
  {
    id: 'library',
    label: 'Species & Strains',
    shortLabel: 'Species',
    icon: NavIcons.Library,
    category: 'knowledge',
    description: 'Reference guide with growing parameters',
    connections: ['cultures', 'grows', 'recipes', 'cultureguide'],
    quickAccess: true,
  },
  {
    id: 'cultureguide',
    label: 'Culture Guide',
    shortLabel: 'Guide',
    icon: NavIcons.Book,
    category: 'knowledge',
    description: 'P-values, shelf life, senescence, and best practices',
    connections: ['library', 'cultures'],
  },
  {
    id: 'recipes',
    label: 'Recipes',
    icon: NavIcons.Recipe,
    category: 'knowledge',
    description: 'Agar, LC, substrate formulations',
    connections: ['cultures', 'inventory', 'calculator'],
    quickAccess: true,
  },

  // Lab & Storage
  {
    id: 'inventory',
    label: 'Lab Inventory',
    shortLabel: 'Inventory',
    icon: NavIcons.Inventory,
    category: 'storage',
    description: 'All cultures, spawn, and grows',
    connections: ['cultures', 'grows', 'stock'],
  },
  {
    id: 'stock',
    label: 'Stock & Orders',
    shortLabel: 'Stock',
    icon: NavIcons.Stock,
    category: 'storage',
    description: 'Inventory lots and purchases',
    connections: ['inventory', 'instances'],
  },
  {
    id: 'instances',
    label: 'Containers',
    shortLabel: 'Containers',
    icon: NavIcons.Container,
    category: 'storage',
    description: 'Track individual jars, bags, and equipment',
    connections: ['inventory', 'labspaces'],
  },
  {
    id: 'labspaces',
    label: 'Lab Spaces',
    shortLabel: 'Spaces',
    icon: NavIcons.LabSpaces,
    category: 'storage',
    description: 'Locations, chambers, and occupancy',
    connections: ['inventory', 'grows'],
  },
  {
    id: 'labels',
    label: 'Label Maker',
    shortLabel: 'Labels',
    icon: NavIcons.Labels,
    category: 'storage',
    description: 'Design and print QR labels',
    connections: ['scanner', 'cultures', 'grows'],
  },
  {
    id: 'scanner',
    label: 'QR Scanner',
    shortLabel: 'Scan',
    icon: NavIcons.Scanner,
    category: 'storage',
    description: 'Scan labels for instant access',
    connections: ['labels'],
    quickAccess: true,
  },

  // Analytics
  {
    id: 'analytics',
    label: 'Overview',
    icon: NavIcons.Chart,
    category: 'analytics',
    description: 'Data visualization dashboard',
    connections: ['strainanalytics', 'grows', 'efficiency', 'financial', 'outcomes'],
  },
  {
    id: 'strainanalytics',
    label: 'Strain Stats',
    shortLabel: 'Strains',
    icon: NavIcons.Target,
    category: 'analytics',
    description: 'Performance per strain',
    connections: ['analytics', 'library'],
  },
  {
    id: 'contamination',
    label: 'Contam Analysis',
    shortLabel: 'Contam',
    icon: NavIcons.Alert,
    category: 'analytics',
    description: 'Contamination pattern tracking',
    connections: ['analytics', 'grows'],
  },
  {
    id: 'efficiency',
    label: 'BE Calculator',
    shortLabel: 'BE%',
    icon: NavIcons.TrendingUp,
    category: 'analytics',
    description: 'Biological efficiency metrics',
    connections: ['analytics', 'grows'],
  },
  {
    id: 'financial',
    label: 'Financial',
    shortLabel: 'Financial',
    icon: NavIcons.DollarSign,
    category: 'analytics',
    description: 'Lab valuation, costs, and profitability analysis',
    connections: ['analytics', 'inventory'],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    shortLabel: 'Outcomes',
    icon: NavIcons.Clock,
    category: 'analytics',
    description: 'Historical tracking of disposed and completed entities',
    connections: ['analytics', 'grows', 'cultures'],
  },

  // Calculators
  {
    id: 'calculator',
    label: 'Substrate Calc',
    shortLabel: 'Substrate',
    icon: NavIcons.Calculator,
    category: 'tools',
    description: 'Hydration ratio calculations',
    connections: ['recipes', 'spawnrate'],
  },
  {
    id: 'spawnrate',
    label: 'Spawn Rate',
    shortLabel: 'Spawn',
    icon: NavIcons.Scale,
    category: 'tools',
    description: 'Spawn-to-substrate ratios',
    connections: ['calculator', 'grows'],
  },
  {
    id: 'pressure',
    label: 'Pressure Cook',
    shortLabel: 'Pressure',
    icon: NavIcons.Thermometer,
    category: 'tools',
    description: 'Sterilization with altitude adjustment',
    connections: ['recipes'],
  },
  {
    id: 'multiplication',
    label: 'Culture Expansion',
    shortLabel: 'Expansion',
    icon: NavIcons.Flask,
    category: 'tools',
    description: 'P-value tracking, expansion costs, and senescence risk',
    connections: ['cultures', 'cultureguide'],
  },

  // Settings
  {
    id: 'settings',
    label: 'Preferences',
    icon: NavIcons.Settings,
    category: 'settings',
    description: 'User preferences and database config',
    connections: ['profile'],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: NavIcons.User,
    category: 'settings',
    description: 'Account and security',
    connections: ['settings'],
  },
  {
    id: 'devlog',
    label: 'Roadmap',
    icon: NavIcons.DevLog,
    category: 'settings',
    description: 'Feature development roadmap',
    connections: ['featuretracker'],
  },
  {
    id: 'featuretracker',
    label: 'Feature Tracker',
    shortLabel: 'Tracker',
    icon: NavIcons.DevLog,
    category: 'settings',
    description: 'Development roadmap with milestones and changelog',
    connections: ['devlog'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getNodeById = (id: Page): NavNode | undefined =>
  navNodes.find(node => node.id === id);

export const getNodesByCategory = (category: NavCategory): NavNode[] =>
  navNodes.filter(node => node.category === category);

export const getQuickAccessNodes = (): NavNode[] =>
  navNodes.filter(node => node.quickAccess);

export const getConnectedNodes = (id: Page): NavNode[] => {
  const node = getNodeById(id);
  if (!node?.connections) return [];
  return node.connections.map(connId => getNodeById(connId)).filter(Boolean) as NavNode[];
};

export const getCategoryForPage = (page: Page): NavCategory | undefined =>
  getNodeById(page)?.category;

// Category order for display
export const categoryOrder: NavCategory[] = [
  'daily',
  'cultivation',
  'knowledge',
  'storage',
  'analytics',
  'tools',
  'settings',
];

// Route configuration
export const routeConfig: Record<Page, string> = {
  dashboard: '/',
  commandcenter: '/command',
  today: '/today',
  dailycheck: '/daily-check',
  harvest: '/harvest',
  forecast: '/forecast',
  coldstorage: '/cold-storage',
  observations: '/observations',
  eventlog: '/event-log',
  library: '/library',
  cultureguide: '/culture-guide',
  inventory: '/inventory',
  stock: '/stock',
  instances: '/instances',
  cultures: '/cultures',
  spawn: '/spawn',
  lineage: '/lineage',
  grows: '/grows',
  recipes: '/recipes',
  labspaces: '/lab-spaces',
  labmapping: '/lab-mapping',
  occupancy: '/occupancy',
  labels: '/labels',
  scanner: '/scanner',
  calculator: '/calculator',
  spawnrate: '/spawn-rate',
  pressure: '/pressure-cooking',
  multiplication: '/culture-multiplication',
  contamination: '/contamination',
  efficiency: '/efficiency',
  analytics: '/analytics',
  financial: '/financial',
  strainanalytics: '/strain-analytics',
  outcomes: '/outcomes',
  settings: '/settings',
  profile: '/profile',
  devlog: '/devlog',
  featuretracker: '/feature-tracker',
};
