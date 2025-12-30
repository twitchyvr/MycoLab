// ============================================================================
// MYCOLAB - Main Application Component
// ============================================================================

import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { DataProvider, useData, CreationProvider, useCreation, NotificationProvider, ThemeProvider } from './store';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { VersionProvider, VersionUpdateModal } from './lib/VersionContext';
import { EntityFormModal } from './components/forms';
import { AuthModal, AccountMenu } from './components/auth';
import { ToastContainer, NotificationBell } from './components/notifications';
import { ErrorBoundary, GlobalErrorHandler } from './components/errors';
import DevLogPage from './components/devlog/DevLogPage';
import { FeatureTrackerPage } from './components/feature-tracker/FeatureTrackerPage';
import { PrivacyPolicy, TermsOfService } from './components/legal';
import type { 
  AppState, 
  Culture, 
  Grow, 
  DevLogFeature,
  FeatureStatus,
  FeaturePriority 
} from './types';
import {
  defaultPreferences,
  sampleStrains,
  sampleVendors,
  sampleLocations,
  sampleContainers,
  sampleIngredients,
  initialDevLog,
  projectScope
} from './data/initialData';
import { SubstrateCalculator } from './components/tools/SubstrateCalculator';
import { UnifiedItemView } from './components/inventory/UnifiedItemView';
import { ContaminationAnalysis } from './components/analysis/ContaminationAnalysis';
import { BiologicalEfficiencyCalculator } from './components/analysis/BiologicalEfficiencyCalculator';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { FinancialDashboard } from './components/analytics/FinancialDashboard';
import { StrainPerformanceAnalytics } from './components/analytics/StrainPerformanceAnalytics';
import { OutcomesAnalytics } from './components/analytics/OutcomesAnalytics';
import { SettingsPageNew as SettingsPage } from './components/settings/SettingsPageNew';
import { SpawnRateCalculator } from './components/tools/SpawnRateCalculator';
import { PressureCookingCalculator } from './components/tools/PressureCookingCalculator';
import { CultureMultiplicationCalculator } from './components/tools/CultureMultiplicationCalculator';
import { CultureManagement } from './components/cultures/CultureManagement';
import { LineageVisualization } from './components/cultures/LineageVisualization';
import { GrowManagement } from './components/grows/GrowManagement';
import { SpawnManagement } from './components/spawn/SpawnManagement';
import { RecipeBuilder } from './components/recipes/RecipeBuilder';
import { SetupWizard } from './components/setup/SetupWizard';
import { OnboardingWizard } from './components/setup/OnboardingWizard';
import { StockManagement } from './components/inventory/StockManagement';
import { InstanceManagement } from './components/inventory/InstanceManagement';
import { CommandCenter } from './components/command';
import { GlobalSearch, SearchTrigger } from './components/common/GlobalSearch';
import { AmbientBackground } from './components/common';
import { ObservationTimeline, EventLogger } from './components/observations';
import { ProfilePage } from './components/profile';
import { FloatingActionButton, LabCommandCenter } from './components/dashboard';
import { GrowthTrail } from './components/navigation';
import type { Page as NavPage } from './components/navigation';
import { LabMapping, LocationOccupancy, LabSpaces } from './components/locations';
import { LabelDesigner } from './components/labels';
import { QRScanner } from './components/qr';
import { ColdStorageCheck } from './components/dailycheck';
import { HarvestForecast } from './components/forecast/HarvestForecast';
import { SpeciesLibrary, CultureGuide } from './components/library';
import { Icons, SectionIcons } from './components/icons';

// ============================================================================
// CONTEXT
// ============================================================================

interface AppContextType {
  state: AppState;
  updateDevLog: (features: DevLogFeature[]) => void;
  addDevLogFeature: (feature: Omit<DevLogFeature, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFeatureStatus: (id: string, status: FeatureStatus) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  cultures: [],
  grows: [],
  strains: sampleStrains,
  vendors: sampleVendors,
  locations: sampleLocations,
  containers: sampleContainers,
  ingredients: sampleIngredients,
  tools: [],
  procedures: [],
  recipes: [],
  labelTemplates: [],
  inventory: [],
  wishlist: [],
  ideas: [],
  environmentalReadings: [],
  dailyChecks: [],
  roomStatuses: [],
  media: [],
  qrLabels: [],
  notifications: [],
  notificationRules: [],
  devLog: initialDevLog,
  preferences: defaultPreferences,
};

// ============================================================================
// NAVIGATION
// ============================================================================

type Page = 'dashboard' | 'commandcenter' | 'today' | 'dailycheck' | 'harvest' | 'forecast' | 'coldstorage' | 'observations' | 'eventlog' | 'library' | 'cultureguide' | 'inventory' | 'stock' | 'instances' | 'cultures' | 'spawn' | 'lineage' | 'grows' | 'recipes' | 'labspaces' | 'labmapping' | 'occupancy' | 'labels' | 'scanner' | 'calculator' | 'spawnrate' | 'pressure' | 'multiplication' | 'contamination' | 'efficiency' | 'analytics' | 'financial' | 'strainanalytics' | 'outcomes' | 'settings' | 'profile' | 'devlog' | 'featuretracker';

// Route configuration: maps Page to URL paths
// Routes with :id support deep-linking to specific items
const routeConfig: Record<Page, string> = {
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

// Reverse lookup: URL path to Page
const pathToPage: Record<string, Page> = Object.entries(routeConfig).reduce(
  (acc, [page, path]) => ({ ...acc, [path]: page as Page }),
  {} as Record<string, Page>
);

// Helper to get route path for a page
const getRoutePath = (page: Page): string => routeConfig[page] || '/';

// Helper to get page from current path
const getPageFromPath = (pathname: string): Page => {
  // Handle base paths (e.g., /cultures from /cultures/abc123)
  const basePath = '/' + pathname.split('/').filter(Boolean)[0] || '';
  return pathToPage[pathname] || pathToPage[basePath] || 'dashboard';
};

interface NavItem {
  id: Page;
  label: string;
  icon: React.FC;
  /** If true, this page is accessible without authentication */
  isPublic?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.FC;
  items: NavItem[];
  defaultOpen?: boolean;
  /** If true, all items in this group are public (no auth required) */
  isPublic?: boolean;
  /** Description shown in collapsed sidebar flyout */
  description?: string;
}

// ============================================================================
// NAVIGATION STRUCTURE
// ============================================================================
// Organized to reflect the logical workflow of mushroom cultivation:
// 1. LEARN - Library & reference materials (public, Wikipedia-style)
// 2. SETUP - Configure lab spaces and preferences
// 3. GENETICS - Manage cultures and lineage
// 4. PRODUCTION - Grain spawn, grows, recipes
// 5. DAILY OPS - Day-to-day lab management
// 6. INVENTORY - Stock and supplies
// 7. ANALYTICS - Performance analysis
// 8. TOOLS - Calculators (public)
// 9. ACCOUNT - Settings and profile

const navGroups: NavGroup[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // PUBLIC SECTION - Accessible without authentication
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'library',
    label: 'Library',
    icon: SectionIcons.Library,
    defaultOpen: true,
    isPublic: true,
    description: 'Reference guides & species info',
    items: [
      { id: 'library', label: 'Species & Strains', icon: Icons.Library, isPublic: true },
      { id: 'cultureguide', label: 'Culture Guide', icon: Icons.Culture, isPublic: true },
      { id: 'recipes', label: 'Recipe Library', icon: Icons.Recipe, isPublic: true },
    ],
  },
  {
    id: 'tools',
    label: 'Calculators',
    icon: SectionIcons.Tools,
    defaultOpen: false,
    isPublic: true,
    description: 'Cultivation calculators',
    items: [
      { id: 'calculator', label: 'Substrate Calc', icon: Icons.Calculator, isPublic: true },
      { id: 'spawnrate', label: 'Spawn Rate', icon: Icons.Layers, isPublic: true },
      { id: 'pressure', label: 'Pressure Cook', icon: Icons.Thermometer, isPublic: true },
      { id: 'multiplication', label: 'Culture Expansion', icon: Icons.Flask, isPublic: true },
      { id: 'efficiency', label: 'BE Calculator', icon: Icons.TrendingUp, isPublic: true },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // AUTHENTICATED SECTION - Requires login
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'labsetup',
    label: 'Lab Setup',
    icon: SectionIcons.Settings,
    defaultOpen: false,
    description: 'Configure your lab environment',
    items: [
      { id: 'labspaces', label: 'Lab Spaces', icon: Icons.Layers },
      { id: 'instances', label: 'Containers', icon: Icons.Container },
    ],
  },
  {
    id: 'genetics',
    label: 'Genetics',
    icon: SectionIcons.Genetics,
    defaultOpen: false,
    description: 'Culture library & lineage',
    items: [
      { id: 'cultures', label: 'Cultures', icon: Icons.Culture },
      { id: 'lineage', label: 'Lineage Tree', icon: Icons.Lineage },
    ],
  },
  {
    id: 'production',
    label: 'Production',
    icon: SectionIcons.Genetics,
    defaultOpen: false,
    description: 'Spawn, grows & recipes',
    items: [
      { id: 'spawn', label: 'Grain Spawn', icon: Icons.Grain },
      { id: 'grows', label: 'Grows', icon: Icons.Grow },
    ],
  },
  {
    id: 'command',
    label: 'Daily Ops',
    icon: SectionIcons.Command,
    defaultOpen: false,
    description: 'Day-to-day lab management',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
      { id: 'commandcenter', label: 'Command Center', icon: Icons.Target },
      { id: 'observations', label: 'Observations', icon: Icons.Clipboard },
      { id: 'eventlog', label: 'Event Log', icon: Icons.Pencil },
      { id: 'forecast', label: 'Harvest Forecast', icon: Icons.TrendingUp },
      { id: 'coldstorage', label: 'Cold Storage', icon: Icons.Snowflake },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: SectionIcons.Inventory,
    defaultOpen: false,
    description: 'Stock & supplies tracking',
    items: [
      { id: 'inventory', label: 'Lab Inventory', icon: Icons.Inventory },
      { id: 'stock', label: 'Stock & Orders', icon: Icons.Package },
      { id: 'labels', label: 'Label Maker', icon: Icons.Tag },
      { id: 'scanner', label: 'QR Scanner', icon: Icons.QRScan },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: SectionIcons.Analytics,
    defaultOpen: false,
    description: 'Performance & insights',
    items: [
      { id: 'analytics', label: 'Overview', icon: Icons.Chart },
      { id: 'financial', label: 'Financial', icon: Icons.DollarSign },
      { id: 'strainanalytics', label: 'Strain Stats', icon: Icons.Target },
      { id: 'outcomes', label: 'Outcomes', icon: Icons.Clock },
      { id: 'contamination', label: 'Contam Analysis', icon: Icons.AlertTriangle },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: SectionIcons.Settings,
    defaultOpen: false,
    description: 'Settings & profile',
    items: [
      { id: 'settings', label: 'Preferences', icon: Icons.Settings, isPublic: true },
      { id: 'profile', label: 'Profile', icon: Icons.Dashboard },
      { id: 'featuretracker', label: 'Feature Tracker', icon: Icons.DevLog, isPublic: true },
    ],
  },
];

// Flat list for backwards compatibility
const navItems: NavItem[] = navGroups.flatMap(group => group.items);

// Helper to check if a page is public (no auth required)
const isPublicPage = (page: Page): boolean => {
  for (const group of navGroups) {
    const item = group.items.find(i => i.id === page);
    if (item) {
      // Item-level isPublic takes precedence, otherwise use group-level
      return item.isPublic ?? group.isPublic ?? false;
    }
  }
  return false;
};

// List of all public pages for quick reference
const PUBLIC_PAGES: Page[] = navGroups
  .flatMap(group => group.items
    .filter(item => item.isPublic || group.isPublic)
    .map(item => item.id)
  );

// ============================================================================
// AUTH REQUIRED PROMPT COMPONENT
// ============================================================================
// Shown when unauthenticated users try to access protected pages

interface AuthRequiredPromptProps {
  pageName: string;
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthRequiredPrompt: React.FC<AuthRequiredPromptProps> = ({ pageName, onSignIn, onSignUp }) => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
        {/* Lock Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-emerald-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          Sign in to access {pageName}
        </h2>
        <p className="text-zinc-400 mb-6">
          Create a free account to track your cultures, grows, and lab operations.
        </p>

        <div className="space-y-3">
          <button
            onClick={onSignUp}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20"
          >
            Create Free Account
          </button>
          <button
            onClick={onSignIn}
            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700"
          >
            Sign In
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-6">
          Explore our <span className="text-emerald-400">Library</span> and <span className="text-emerald-400">Calculators</span> without an account
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// STATUS STYLING
// ============================================================================

const statusColors: Record<FeatureStatus, { bg: string; text: string; border: string }> = {
  backlog: { bg: 'bg-zinc-800/50', text: 'text-zinc-400', border: 'border-zinc-700' },
  planned: { bg: 'bg-blue-950/50', text: 'text-blue-400', border: 'border-blue-800' },
  in_progress: { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-800' },
  testing: { bg: 'bg-purple-950/50', text: 'text-purple-400', border: 'border-purple-800' },
  completed: { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-800' },
  blocked: { bg: 'bg-red-950/50', text: 'text-red-400', border: 'border-red-800' },
  cancelled: { bg: 'bg-zinc-900/50', text: 'text-zinc-500', border: 'border-zinc-800' },
};

const priorityColors: Record<FeaturePriority, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
  nice_to_have: 'text-zinc-500',
};

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page, itemId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  cultureCount: number;
  activeGrowCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Helper to find which group contains the current page
const findGroupForPage = (page: Page): string | null => {
  for (const group of navGroups) {
    if (group.items.some(item => item.id === page)) {
      return group.id;
    }
  }
  return null;
};

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  cultureCount,
  activeGrowCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Track which groups are expanded - initialize based on current page and defaults
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Add default open groups
    navGroups.forEach(group => {
      if (group.defaultOpen) initial.add(group.id);
    });
    // Add group containing current page
    const currentGroup = findGroupForPage(currentPage);
    if (currentGroup) initial.add(currentGroup);
    return initial;
  });

  // Flyout state for collapsed sidebar - supports both hover and click
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  // When page changes, ensure its group is expanded
  useEffect(() => {
    const currentGroup = findGroupForPage(currentPage);
    if (currentGroup && !expandedGroups.has(currentGroup)) {
      setExpandedGroups(prev => new Set([...prev, currentGroup]));
    }
  }, [currentPage]);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onClose(); // Close sidebar on mobile after navigation
    setActiveGroup(null); // Close flyout
    setIsPinned(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Handle flyout interactions in collapsed mode
  const handleGroupClick = (groupId: string) => {
    if (activeGroup === groupId && isPinned) {
      // Click again to close
      setActiveGroup(null);
      setIsPinned(false);
    } else {
      // Open and pin
      setActiveGroup(groupId);
      setIsPinned(true);
    }
  };

  const handleGroupHover = (groupId: string | null) => {
    if (!isPinned) {
      setActiveGroup(groupId);
    }
  };

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isPinned && activeGroup) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-flyout]') && !target.closest('[data-group-button]')) {
          setActiveGroup(null);
          setIsPinned(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPinned, activeGroup]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isCollapsed ? 'w-16 overflow-visible' : 'w-64'}
        bg-zinc-900 border-r border-zinc-800
        flex flex-col h-full
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`border-b border-zinc-800 flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
              <button
                onClick={isCollapsed ? onToggleCollapse : undefined}
                className={`
                  ${isCollapsed ? 'w-10 h-10 cursor-pointer hover:scale-110' : 'w-10 h-10'}
                  rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600
                  flex items-center justify-center shadow-lg shadow-emerald-500/20
                  transition-all duration-300
                  ${isCollapsed ? 'hover:shadow-emerald-500/40 hover:shadow-xl' : ''}
                `}
                title={isCollapsed ? 'Expand menu' : undefined}
              >
                <span className={`${isCollapsed ? 'text-lg' : 'text-xl'} transition-transform duration-300`}>🍄</span>
              </button>
              {!isCollapsed && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-lg font-semibold text-white tracking-tight">MycoLab</h1>
                  <p className="text-xs text-zinc-500">Laboratory Manager</p>
                  <p className="text-[10px] text-zinc-600 font-mono">v{__APP_VERSION__}</p>
                </div>
              )}
            </div>
            {/* Mobile close button */}
            {!isCollapsed && (
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2 overflow-visible' : 'p-3 overflow-y-auto overflow-x-hidden'} space-y-1`}>
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.has(group.id);
            const hasActivePage = group.items.some(item => item.id === currentPage);
            const isActive = activeGroup === group.id;

            // Collapsed mode: show icons with flyout menu
            if (isCollapsed) {
              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => handleGroupHover(group.id)}
                  onMouseLeave={() => handleGroupHover(null)}
                >
                  {/* Group Icon Button */}
                  <button
                    data-group-button
                    onClick={() => handleGroupClick(group.id)}
                    className={`
                      w-full flex items-center justify-center p-2.5 rounded-lg
                      transition-all duration-200 relative group
                      ${hasActivePage
                        ? 'bg-emerald-500/15 text-emerald-400 shadow-inner shadow-emerald-500/10'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                      }
                      ${isActive ? 'bg-zinc-800 text-white ring-1 ring-emerald-500/30' : ''}
                    `}
                  >
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      <GroupIcon />
                    </div>
                    {/* Active indicator dot with glow */}
                    {hasActivePage && (
                      <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></span>
                    )}
                  </button>

                  {/* Flyout menu */}
                  {isActive && (
                    <div
                      data-flyout
                      className="absolute left-full top-0 ml-2 z-50 min-w-52 animate-in slide-in-from-left-2 fade-in duration-200"
                      onMouseEnter={() => handleGroupHover(group.id)}
                      onMouseLeave={() => !isPinned && handleGroupHover(null)}
                    >
                      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/80 rounded-xl shadow-2xl shadow-black/60 py-2 overflow-hidden">
                        {/* Group label with gradient */}
                        <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 mb-1 bg-gradient-to-r from-zinc-800/50 to-transparent flex items-center gap-2">
                          <GroupIcon />
                          <span>{group.label}</span>
                          {/* Public/Auth indicator */}
                          {group.isPublic ? (
                            <span className="ml-auto text-emerald-400" title="Open to all">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                              </svg>
                            </span>
                          ) : (
                            <span className="ml-auto text-zinc-500" title="Sign in required">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </span>
                          )}
                          {isPinned && (
                            <span className="text-emerald-400">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"/>
                              </svg>
                            </span>
                          )}
                        </div>
                        {/* Group description */}
                        {group.description && (
                          <div className="px-4 py-1 text-xs text-zinc-500 border-b border-zinc-800/50 mb-1">
                            {group.description}
                          </div>
                        )}
                        {/* Items */}
                        <div className="py-1">
                          {group.items.map((item, index) => {
                            const isItemActive = currentPage === item.id;
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                  transition-all duration-150
                                  ${isItemActive
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 font-medium border-l-2 border-emerald-400'
                                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white border-l-2 border-transparent hover:border-zinc-600'
                                  }
                                `}
                                style={{ animationDelay: `${index * 30}ms` }}
                              >
                                <Icon />
                                <span className="flex-1 text-left">{item.label}</span>
                                {isItemActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Expanded mode: show full navigation
            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${hasActivePage
                      ? 'text-emerald-400'
                      : 'text-zinc-400 hover:text-white'
                    }
                    hover:bg-zinc-800/50
                  `}
                >
                  <GroupIcon />
                  <span className="flex-1 text-left">{group.label}</span>
                  {/* Public/Auth indicator - subtle */}
                  {group.isPublic ? (
                    <span className="text-emerald-500/60" title="Open to all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    </span>
                  ) : (
                    <span className="text-zinc-600" title="Sign in required">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  )}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Group Items */}
                <div className={`
                  overflow-hidden transition-all duration-200 ease-in-out
                  ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}>
                  <div className="ml-3 pl-3 border-l border-zinc-800 mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isItemActive = currentPage === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                            transition-all duration-200
                            ${isItemActive
                              ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                              : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                            }
                          `}
                        >
                          <Icon />
                          <span className="truncate">{item.label}</span>
                          {isItemActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Quick Stats - only show when expanded */}
        {!isCollapsed && (
          <div className="p-3 border-t border-zinc-800 flex-shrink-0 hidden sm:block">
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-lg font-semibold text-white">{cultureCount}</p>
                  <p className="text-xs text-zinc-500">Cultures</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-400">{activeGrowCount}</p>
                  <p className="text-xs text-zinc-500">Active Grows</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Magical Collapse/Expand Toggle - desktop only */}
        <div className={`
          ${isCollapsed ? 'p-2' : 'p-3'}
          border-t border-zinc-800 flex-shrink-0 hidden lg:block
        `}>
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center justify-center gap-2
              ${isCollapsed ? 'p-3' : 'px-3 py-2.5'}
              rounded-xl text-sm
              transition-all duration-300 ease-out
              group relative overflow-hidden
              ${isCollapsed
                ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 hover:from-emerald-900/30 hover:to-teal-900/20 text-zinc-400 hover:text-emerald-400'
                : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white'
              }
              hover:shadow-lg hover:shadow-emerald-500/10
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {/* Animated background glow for collapsed state */}
            {isCollapsed && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            )}

            {/* Icon with rotation animation */}
            <div className={`relative z-10 transition-transform duration-300 ${isCollapsed ? 'group-hover:scale-125 group-hover:rotate-180' : ''}`}>
              {isCollapsed ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
                </svg>
              )}
            </div>

            {!isCollapsed && <span className="relative z-10">Collapse</span>}

            {/* Sparkle effect on hover when collapsed */}
            {isCollapsed && (
              <>
                <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-teal-400 opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '150ms' }}></div>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentPage: Page;
  onNavigate: (page: Page, itemId?: string) => void;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

// Map pages to their "new" action pages
// Removed: persistent "New" button was confusing with multiple create options already on pages
const newButtonConfig: Partial<Record<Page, { label: string; page: Page }>> = {
  // Empty - pages have their own create buttons
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, currentPage, onNavigate, onMenuClick, onSearchClick }) => {
  const newAction = newButtonConfig[currentPage];

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-4 bg-zinc-900/30 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Global Search Trigger */}
        <SearchTrigger onClick={onSearchClick} />
        {/* Notification Bell */}
        <NotificationBell onNavigateToSettings={() => onNavigate('settings')} />
        {newAction && (
          <button
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => {
              if (currentPage === newAction.page) {
                // Already on the page, just dispatch the create event
                window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: newAction.page } }));
              } else {
                // Navigate to page first, then dispatch event after a short delay
                onNavigate(newAction.page);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: newAction.page } }));
                }, 100);
              }
            }}
          >
            <Icons.Plus />
            <span className="hidden sm:inline">{newAction.label}</span>
          </button>
        )}
        {/* Account Menu */}
        <AccountMenu onNavigate={(page) => onNavigate(page as Page)} />
      </div>
    </header>
  );
};

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

const DashboardPage: React.FC<{ onNavigate: (page: Page, itemId?: string) => void }> = ({ onNavigate }) => {
  const { state, isLoading, isConnected, activeStrains } = useData();
  
  // Calculate real stats
  const activeCultures = state.cultures.filter(c => c.status === 'active');
  const activeGrows = state.grows.filter(g => g.status === 'active');
  const recentGrows = state.grows.slice(0, 3);
  
  const stats = [
    { label: 'Active Cultures', value: activeCultures.length.toString(), change: isConnected ? 'Synced' : 'Local', color: 'emerald' },
    { label: 'Active Grows', value: activeGrows.length.toString(), change: `${activeGrows.filter(g => g.currentStage === 'fruiting').length} fruiting`, color: 'blue' },
    { label: 'Strains', value: activeStrains.length.toString(), change: 'In library', color: 'purple' },
    { label: 'Recipes', value: state.recipes.filter(r => r.isActive).length.toString(), change: 'Available', color: 'amber' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-400">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="flex-1">
            <p className="text-amber-400 font-medium">Database not connected</p>
            <p className="text-sm text-zinc-400">Go to Settings → Database to configure Supabase</p>
          </div>
          <button onClick={() => onNavigate('settings')} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg">
            Configure
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-sm text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-semibold text-white mb-1">{stat.value}</p>
            <p className={`text-xs text-${stat.color}-400`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Grows */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Active Grows</h3>
            <button onClick={() => onNavigate('grows')} className="text-sm text-emerald-400 hover:text-emerald-300">View all</button>
          </div>
          <div className="p-5 space-y-4">
            {recentGrows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500 mb-3">No grows yet</p>
                <button
                  onClick={() => {
                    onNavigate('grows');
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: 'grows' } }));
                    }, 100);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm"
                >
                  Start Your First Grow
                </button>
              </div>
            ) : (
              recentGrows.map((grow) => {
                const strain = activeStrains.find(s => s.id === grow.strainId);
                const daysOld = Math.floor((Date.now() - new Date(grow.spawnedAt).getTime()) / (1000 * 60 * 60 * 24));
                const stageProgress: Record<string, number> = {
                  spawning: 10, colonization: 40, fruiting: 70, harvesting: 90, completed: 100
                };
                const progress = stageProgress[grow.currentStage] || 0;
                
                return (
                  <div key={grow.id} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">{grow.name}</p>
                        <p className="text-sm text-zinc-500">{strain?.name || 'Unknown'} • Day {daysOld}</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-blue-950/50 text-blue-400 rounded-full border border-blue-800 capitalize">
                        {grow.currentStage.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">{progress}% complete</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Cultures */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Recent Cultures</h3>
            <button onClick={() => onNavigate('cultures')} className="text-sm text-emerald-400 hover:text-emerald-300">View all</button>
          </div>
          <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {state.cultures.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-zinc-500 text-sm mb-3">No cultures yet</p>
                <button 
                  onClick={() => onNavigate('cultures')}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs"
                >
                  Add Culture
                </button>
              </div>
            ) : (
              state.cultures.slice(0, 5).map((culture) => {
                const strain = activeStrains.find(s => s.id === culture.strainId);
                const typeColors: Record<string, string> = {
                  spore_syringe: 'bg-purple-950/50 border-purple-800 text-purple-400',
                  liquid_culture: 'bg-blue-950/50 border-blue-800 text-blue-400',
                  agar: 'bg-pink-950/50 border-pink-800 text-pink-400',
                  slant: 'bg-orange-950/50 border-orange-800 text-orange-400',
                };
                return (
                  <div key={culture.id} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{culture.label}</p>
                        <p className="text-xs text-zinc-500">{strain?.name || 'Unknown strain'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${typeColors[culture.type] || 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                        {culture.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => onNavigate('cultures')} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-center transition-colors">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-950/50 border border-blue-800 flex items-center justify-center">
              <Icons.Culture />
            </div>
            <p className="text-sm text-white">New Culture</p>
          </button>
          <button
            onClick={() => {
              onNavigate('grows');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('mycolab:create-new', { detail: { page: 'grows' } }));
              }, 100);
            }}
            className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-center transition-colors"
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-emerald-950/50 border border-emerald-800 flex items-center justify-center">
              <Icons.Grow />
            </div>
            <p className="text-sm text-white">New Grow</p>
          </button>
          <button onClick={() => onNavigate('recipes')} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-center transition-colors">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-purple-950/50 border border-purple-800 flex items-center justify-center">
              <Icons.Recipe />
            </div>
            <p className="text-sm text-white">New Recipe</p>
          </button>
          <button onClick={() => onNavigate('settings')} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-center transition-colors">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Icons.Settings />
            </div>
            <p className="text-sm text-white">Settings</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PLACEHOLDER PAGES
// ============================================================================

const PlaceholderPage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-6">
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
        <span className="text-2xl">🚧</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-md mx-auto">{description}</p>
      <p className="text-sm text-zinc-500 mt-4">Check the Dev Roadmap for implementation status</p>
    </div>
  </div>
);

// ============================================================================
// MAIN APP
// ============================================================================

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppWithRouter />
    </BrowserRouter>
  );
};

// Inner component that has access to React Router hooks
const AppWithRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle standalone legal pages (render without app shell)
  if (location.pathname === '/privacy') {
    return <PrivacyPolicy />;
  }
  if (location.pathname === '/terms') {
    return <TermsOfService />;
  }

  // Derive current page from URL
  const currentPage = useMemo(() => getPageFromPath(location.pathname), [location.pathname]);

  // Extract item ID from URL if present (e.g., /cultures/abc123)
  const selectedItemId = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length > 1 ? parts[1] : undefined;
  }, [location.pathname]);

  // Navigation function that updates URL
  const setCurrentPage = (page: Page, itemId?: string) => {
    const basePath = getRoutePath(page);
    const fullPath = itemId ? `${basePath}/${itemId}` : basePath;
    navigate(fullPath);
  };

  const [state, setState] = useState<AppState>(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar collapse state - persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('mycolab-sidebar-collapsed');
    return saved === 'true';
  });

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('mycolab-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  // Never show setup wizard - users don't need to configure database credentials
  // The app works in offline mode by default, cloud sync can be enabled in Settings
  const [showSetup, setShowSetup] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mycolab-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load saved state');
      }
    }
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('mycolab-state', JSON.stringify(state));
  }, [state]);

  const updateDevLog = (features: DevLogFeature[]) => {
    setState(prev => ({ ...prev, devLog: features }));
  };

  const addDevLogFeature = (feature: Omit<DevLogFeature, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFeature: DevLogFeature = {
      ...feature,
      id: `dev-${Date.now()}`,
      status: 'backlog',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      devLog: [...prev.devLog, newFeature],
    }));
  };

  const updateFeatureStatus = (id: string, status: FeatureStatus) => {
    setState(prev => ({
      ...prev,
      devLog: prev.devLog.map(f => 
        f.id === id 
          ? { 
              ...f, 
              status, 
              updatedAt: new Date().toISOString(),
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
            } 
          : f
      ),
    }));
  };

  const contextValue: AppContextType = {
    state,
    updateDevLog,
    addDevLogFeature,
    updateFeatureStatus,
  };

  const pageConfig: Record<Page, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Lab Command Center', subtitle: 'Real-time operational hub for your mycology lab' },
    commandcenter: { title: 'Command Center', subtitle: 'Unified daily operations: tasks, room checks, harvests' },
    today: { title: 'Today', subtitle: 'Daily tasks and actionable items' },
    dailycheck: { title: 'Daily Room Check', subtitle: 'Growing room rounds with harvest estimates' },
    harvest: { title: 'Harvest Workflow', subtitle: 'Quick harvest recording with auto BE% calculation' },
    forecast: { title: 'Harvest Forecasting', subtitle: 'Predict stage transitions and forecast upcoming harvests' },
    coldstorage: { title: 'Cold Storage Check', subtitle: 'Review fridge and cold room inventory' },
    observations: { title: 'Observations', subtitle: 'Timeline of all culture and grow observations' },
    eventlog: { title: 'Event Logger', subtitle: 'Log events, notes, and observations across your lab' },
    library: { title: 'Species & Strain Library', subtitle: 'Reference guide with growing parameters and terminology' },
    cultureguide: { title: 'Culture Guide', subtitle: 'P-values, shelf life, senescence, and best practices' },
    inventory: { title: 'Lab Inventory', subtitle: 'All cultures, spawn, and grows' },
    stock: { title: 'Lab Stock', subtitle: 'Inventory lots, purchases, and tracking' },
    instances: { title: 'Container Instances', subtitle: 'Track individual jars, bags, and equipment' },
    cultures: { title: 'Culture Library', subtitle: 'Manage your cultures and genetics' },
    spawn: { title: 'Grain Spawn', subtitle: 'Track colonization from inoculation to spawn-to-bulk' },
    lineage: { title: 'Lineage Visualization', subtitle: 'Interactive family tree of your cultures' },
    grows: { title: 'Grow Tracking', subtitle: 'Track your active and completed grows' },
    recipes: { title: 'Recipes', subtitle: 'Agar, LC, substrate formulations' },
    labspaces: { title: 'Lab Spaces', subtitle: 'Manage locations, chambers, and track occupancy' },
    labmapping: { title: 'Lab Mapping', subtitle: 'Manage rooms, racks, shelves, and storage locations' },
    occupancy: { title: 'Location Occupancy', subtitle: 'Track items, varieties, and yields across your lab' },
    labels: { title: 'Label Designer', subtitle: 'Design and print labels with QR codes' },
    scanner: { title: 'QR Scanner', subtitle: 'Scan labels to access records instantly' },
    calculator: { title: 'Substrate Calculator', subtitle: 'Hydration ratio calculations' },
    spawnrate: { title: 'Spawn Rate Calculator', subtitle: 'Calculate spawn-to-substrate ratios' },
    pressure: { title: 'Pressure Cooking Calculator', subtitle: 'Sterilization times with altitude adjustment' },
    multiplication: { title: 'Culture Expansion Calculator', subtitle: 'P-value tracking, expansion costs, and senescence risk' },
    contamination: { title: 'Contamination Analysis', subtitle: 'Track and analyze contamination patterns' },
    efficiency: { title: 'Biological Efficiency', subtitle: 'Calculate and compare BE% across grows' },
    analytics: { title: 'Analytics', subtitle: 'Data visualization and insights' },
    financial: { title: 'Financial Dashboard', subtitle: 'Lab valuation, costs, and profitability analysis' },
    strainanalytics: { title: 'Strain Performance', subtitle: 'Track success rates, yields, and optimal conditions per strain' },
    outcomes: { title: 'Outcomes Analytics', subtitle: 'Historical tracking of disposed and completed entities' },
    settings: { title: 'Settings', subtitle: 'Configure lookups and preferences' },
    profile: { title: 'My Profile', subtitle: 'Manage your account and security settings' },
    devlog: { title: 'Dev Roadmap', subtitle: 'Feature tracker with intelligent prioritization' },
    featuretracker: { title: 'Feature Tracker', subtitle: 'Development roadmap with milestones and changelog' },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <LabCommandCenter onNavigate={setCurrentPage} />;
      case 'commandcenter':
        return <CommandCenter />;
      // Legacy routes - redirect to unified Command Center
      case 'today':
      case 'dailycheck':
      case 'harvest':
        return <Navigate to="/command" replace />;
      case 'forecast':
        return (
          <div className="p-6">
            <HarvestForecast />
          </div>
        );
      case 'coldstorage':
        return (
          <div className="p-6">
            <ColdStorageCheck />
          </div>
        );
      case 'observations':
        return (
          <div className="p-6">
            <ObservationTimeline onNavigate={setCurrentPage} />
          </div>
        );
      case 'eventlog':
        return (
          <div className="p-6">
            <EventLogger />
          </div>
        );
      case 'library':
        return (
          <div className="p-6">
            <SpeciesLibrary />
          </div>
        );
      case 'cultureguide':
        return (
          <div className="p-6">
            <CultureGuide onNavigate={(page) => setCurrentPage(page as Page)} />
          </div>
        );
      case 'devlog':
        return (
          <DevLogPage
            features={state.devLog}
            onUpdateStatus={updateFeatureStatus}
            onAddFeature={addDevLogFeature}
          />
        );
      case 'featuretracker':
        return (
          <div className="p-6">
            <FeatureTrackerPage />
          </div>
        );
      case 'inventory':
        return <UnifiedItemView onNavigate={setCurrentPage} />;
      case 'stock':
        return (
          <div className="p-6">
            <StockManagement />
          </div>
        );
      case 'instances':
        return (
          <div className="p-6">
            <InstanceManagement onNavigate={setCurrentPage} />
          </div>
        );
      case 'calculator':
        return (
          <div className="p-6">
            <SubstrateCalculator />
          </div>
        );
      case 'contamination':
        return (
          <div className="p-6">
            <ContaminationAnalysis />
          </div>
        );
      case 'efficiency':
        return (
          <div className="p-6">
            <BiologicalEfficiencyCalculator />
          </div>
        );
      case 'cultures':
        return (
          <div className="p-6">
            <CultureManagement />
          </div>
        );
      case 'spawn':
        return (
          <div className="p-6">
            <SpawnManagement />
          </div>
        );
      case 'lineage':
        return (
          <div className="p-6">
            <LineageVisualization />
          </div>
        );
      case 'grows':
        return (
          <div className="p-6">
            <GrowManagement />
          </div>
        );
      case 'recipes':
        return (
          <div className="p-6">
            <RecipeBuilder />
          </div>
        );
      case 'labspaces':
        return (
          <div className="p-6">
            <LabSpaces onNavigate={(page, itemId) => {
              setCurrentPage(page as Page);
              if (itemId) {
                window.dispatchEvent(new CustomEvent('mycolab:select-item', { detail: { type: page, id: itemId } }));
              }
            }} />
          </div>
        );
      // Legacy routes - redirect to unified Lab Spaces
      case 'labmapping':
      case 'occupancy':
        return <Navigate to="/lab-spaces" replace />;
      case 'labels':
        return (
          <div className="p-6">
            <LabelDesigner />
          </div>
        );
      case 'scanner':
        return (
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <QRScanner onNavigate={(page) => {
                setCurrentPage(page as Page);
              }} />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <AnalyticsDashboard />
          </div>
        );
      case 'financial':
        return (
          <div className="p-6">
            <FinancialDashboard />
          </div>
        );
      case 'strainanalytics':
        return <StrainPerformanceAnalytics />;
      case 'outcomes':
        return <OutcomesAnalytics />;
      case 'spawnrate':
        return (
          <div className="p-6">
            <SpawnRateCalculator />
          </div>
        );
      case 'pressure':
        return (
          <div className="p-6">
            <PressureCookingCalculator />
          </div>
        );
      case 'multiplication':
        return (
          <div className="p-6">
            <CultureMultiplicationCalculator />
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <SettingsPage />
          </div>
        );
      case 'profile':
        return (
          <div className="p-6">
            <ProfilePage />
          </div>
        );
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <VersionProvider>
          <AuthProvider>
            <DataProvider>
              <NotificationProvider>
                <GlobalErrorHandler />
                <CreationProvider>
                  <AppContext.Provider value={contextValue}>
                    <VersionUpdateModal />
                    <AuthModal />
                    <CreationModalManager />
                  <ToastContainer />
                  <AppContent
                    showSetup={showSetup}
                    setShowSetup={setShowSetup}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    selectedItemId={selectedItemId}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    renderPage={renderPage}
                    pageConfig={pageConfig}
                  />
                  </AppContext.Provider>
                </CreationProvider>
              </NotificationProvider>
            </DataProvider>
          </AuthProvider>
        </VersionProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

// Component to manage EntityFormModal visibility based on creation context
// Note: Entity types with dedicated wizards (culture, grow) should NOT show EntityFormModal
const ENTITY_TYPES_WITH_DEDICATED_WIZARDS = ['culture', 'grow'];

const CreationModalManager: React.FC = () => {
  const { isCreating, clearAllDrafts, currentDraft } = useCreation();

  // Don't show EntityFormModal if the current draft has a dedicated wizard
  const shouldShowModal = Boolean(
    isCreating &&
    currentDraft &&
    !ENTITY_TYPES_WITH_DEDICATED_WIZARDS.includes(currentDraft.entityType)
  );

  return (
    <EntityFormModal
      isOpen={shouldShowModal}
      onClose={clearAllDrafts}
    />
  );
};

// Inner component that can access useData
const AppContent: React.FC<{
  showSetup: boolean;
  setShowSetup: (v: boolean) => void;
  currentPage: Page;
  setCurrentPage: (page: Page, itemId?: string) => void;
  selectedItemId?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  renderPage: () => React.ReactNode;
  pageConfig: Record<string, { title: string; subtitle?: string; newAction?: { label: string; page: Page } }>;
}> = ({
  showSetup,
  setShowSetup,
  currentPage,
  setCurrentPage,
  selectedItemId,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  renderPage,
  pageConfig,
}) => {
  const { state } = useData();
  const { user, isAuthenticated, setShowAuthModal, setAuthModalMode } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previousPages, setPreviousPages] = useState<Page[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if current page requires authentication
  const requiresAuth = !isPublicPage(currentPage);

  // Auth handlers for the AuthRequiredPrompt
  const handleSignIn = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleSignUp = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  // Check if user needs onboarding
  useEffect(() => {
    // Show onboarding wizard if:
    // 1. User is authenticated AND
    // 2. User hasn't completed the setup wizard

    // CRITICAL: Check localStorage directly as an additional fallback
    // This handles race conditions where state.settings hasn't loaded yet
    let localStorageComplete = false;
    try {
      const storedSettings = localStorage.getItem('mycolab-settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        localStorageComplete = parsed.hasCompletedSetupWizard === true;
      }
      // Also check the legacy key from SetupWizard
      if (!localStorageComplete && localStorage.getItem('mycolab-setup-complete') === 'true') {
        localStorageComplete = true;
      }
    } catch (e) {
      // Ignore parse errors
    }

    const hasCompletedWizard = state.settings.hasCompletedSetupWizard || localStorageComplete;
    const needsOnboarding = isAuthenticated && !hasCompletedWizard;

    // Small delay to prevent flash on initial load
    if (needsOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowOnboarding(false);
    }
  }, [isAuthenticated, state.settings.hasCompletedSetupWizard]);

  // Track navigation history for breadcrumb trail
  useEffect(() => {
    setPreviousPages(prev => {
      // Don't duplicate if navigating to the same page
      if (prev[prev.length - 1] === currentPage) return prev;
      // Keep last 5 pages for trail
      const updated = [...prev, currentPage].slice(-5);
      return updated;
    });
  }, [currentPage]);

  // Calculate real stats from actual data
  const cultureCount = state.cultures.length;
  const activeGrowCount = state.grows.filter(g => g.status === 'active').length;

  // Dispatch event when a deep-linked item ID is present in URL
  // This allows pages like CultureManagement/GrowManagement to auto-select the item
  useEffect(() => {
    if (selectedItemId) {
      // Map page to item type for the event
      const pageToType: Partial<Record<Page, string>> = {
        cultures: 'culture',
        grows: 'grow',
        recipes: 'recipe',
        lineage: 'culture',
      };
      const itemType = pageToType[currentPage];

      if (itemType) {
        // Small delay to ensure the page component has mounted
        const timer = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('mycolab:select-item', {
              detail: { id: selectedItemId, type: itemType },
            })
          );
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedItemId, currentPage]);

  // Global keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle navigation from search results
  const handleSearchNavigate = (page: Page, itemId?: string, itemType?: string) => {
    // Navigate with item ID for deep-linking support
    setCurrentPage(page, itemId);
  };

  return (
    <>
      {showSetup && (
        <SetupWizard
          onComplete={() => setShowSetup(false)}
          onSkip={() => {
            localStorage.setItem('mycolab-setup-complete', 'true');
            setShowSetup(false);
          }}
        />
      )}
      {/* Onboarding Wizard for new authenticated users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />

      <div className="h-screen flex bg-zinc-950 text-white overflow-hidden relative">
        {/* Ambient Background - Living atmosphere */}
        <AmbientBackground showParticles={true} showVignette={true} />

        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          cultureCount={cultureCount}
          activeGrowCount={activeGrowCount}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
          <Header
            {...pageConfig[currentPage]}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => setIsSearchOpen(true)}
          />
          {/* GrowthTrail breadcrumb - visible on all screen sizes */}
          <GrowthTrail
            currentPage={currentPage as NavPage}
            previousPages={previousPages as NavPage[]}
            onNavigate={(page) => setCurrentPage(page as Page)}
            onOpenHub={() => setSidebarOpen(true)}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Show auth prompt for protected pages when not authenticated */}
            {requiresAuth && !isAuthenticated ? (
              <AuthRequiredPrompt
                pageName={pageConfig[currentPage]?.title || 'this page'}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
              />
            ) : (
              renderPage()
            )}
          </div>
        </main>

        {/* Floating Action Button for quick actions */}
        <FloatingActionButton
          onNavigate={(page) => setCurrentPage(page as Page)}
        />
      </div>
    </>
  );
};

export default App;
