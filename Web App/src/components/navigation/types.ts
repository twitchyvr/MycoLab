// ============================================================================
// MYCELIUM NAVIGATION SYSTEM - Type Definitions
// ============================================================================

export type Page =
  | 'dashboard' | 'commandcenter' | 'today' | 'dailycheck' | 'harvest'
  | 'forecast' | 'coldstorage' | 'observations' | 'eventlog' | 'library'
  | 'cultureguide' | 'inventory' | 'stock' | 'instances' | 'cultures'
  | 'spawn' | 'lineage' | 'grows' | 'recipes' | 'labspaces' | 'labmapping'
  | 'occupancy' | 'labels' | 'scanner' | 'calculator' | 'spawnrate'
  | 'pressure' | 'multiplication' | 'contamination' | 'efficiency'
  | 'analytics' | 'financial' | 'strainanalytics' | 'outcomes'
  | 'settings' | 'profile' | 'devlog' | 'featuretracker';

export interface NavNode {
  id: Page;
  label: string;
  shortLabel?: string; // For mobile/compact view
  icon: React.FC<{ className?: string }>;
  category: NavCategory;
  description?: string;
  connections?: Page[]; // Related pages (for mycelium network connections)
  quickAccess?: boolean; // Show in spore menu
}

export type NavCategory =
  | 'daily'
  | 'cultivation'
  | 'knowledge'
  | 'storage'
  | 'analytics'
  | 'tools'
  | 'settings';

export interface NavCategoryMeta {
  id: NavCategory;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string; // Tailwind color class (e.g., 'emerald', 'blue')
  glowColor: string; // CSS glow color
  description: string;
}

export interface NavigationState {
  currentPage: Page;
  previousPages: Page[]; // Navigation history for trail
  hubOpen: boolean;
  sporeMenuOpen: boolean;
  searchQuery: string;
}

export interface NavigationContextValue {
  state: NavigationState;
  navigate: (page: Page, itemId?: string) => void;
  goBack: () => void;
  openHub: () => void;
  closeHub: () => void;
  toggleSporeMenu: () => void;
  setSearchQuery: (query: string) => void;
}

// Animation timing constants
export const ANIMATION_TIMINGS = {
  hubOpen: 400,
  hubClose: 300,
  sporeExpand: 300,
  sporeCollapse: 200,
  nodeHover: 150,
  trailUpdate: 200,
  connectionDraw: 500,
  bioluminescence: 2000,
} as const;

// Position calculations for radial menu
export const calculateRadialPosition = (
  index: number,
  total: number,
  radius: number,
  startAngle: number = -90 // Start from top
): { x: number; y: number } => {
  const angle = startAngle + (360 / total) * index;
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
};
