// ============================================================================
// MYCELIUM NAVIGATION SYSTEM - Main Export
// ============================================================================

// Components
export { MyceliumHub } from './MyceliumHub';
export { SporeMenu } from './SporeMenu';
export { GrowthTrail, CompactGrowthTrail } from './GrowthTrail';

// Types
export type { Page, NavNode, NavCategory, NavCategoryMeta, NavigationState } from './types';
export { calculateRadialPosition, ANIMATION_TIMINGS } from './types';

// Data & Configuration
export {
  navNodes,
  categoryMeta,
  categoryOrder,
  routeConfig,
  getNodeById,
  getNodesByCategory,
  getQuickAccessNodes,
  getConnectedNodes,
  getCategoryForPage,
  NavIcons,
} from './navData';
