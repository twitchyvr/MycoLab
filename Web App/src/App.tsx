// ============================================================================
// MYCOLAB - Main Application Component
// ============================================================================

import React, { useState, createContext, useContext, useEffect } from 'react';
import { DataProvider, useData } from './store';
import DevLogPage from './components/devlog/DevLogPage';
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
  sampleVesselTypes,
  sampleIngredients,
  initialDevLog,
  projectScope
} from './data/initialData';
import { SubstrateCalculator } from './components/tools/SubstrateCalculator';
import { UnifiedItemView } from './components/inventory/UnifiedItemView';
import { ContaminationAnalysis } from './components/analysis/ContaminationAnalysis';
import { BiologicalEfficiencyCalculator } from './components/analysis/BiologicalEfficiencyCalculator';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { SettingsPage } from './components/settings/SettingsPage';
import { SpawnRateCalculator } from './components/tools/SpawnRateCalculator';
import { PressureCookingCalculator } from './components/tools/PressureCookingCalculator';
import { CultureManagement } from './components/cultures/CultureManagement';
import { LineageVisualization } from './components/cultures/LineageVisualization';
import { GrowManagement } from './components/grows/GrowManagement';
import { RecipeBuilder } from './components/recipes/RecipeBuilder';
import { SetupWizard } from './components/setup/SetupWizard';

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
  vesselTypes: sampleVesselTypes,
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
// ICONS (Inline SVG components)
// ============================================================================

const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/><path d="M19 12C19 12 15 13 12 17"/><path d="M5 12C5 12 9 13 12 17"/>
    </svg>
  ),
  Inventory: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  DevLog: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Lineage: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="5" y2="16"/><line x1="12" y1="12" x2="19" y2="16"/>
    </svg>
  ),
  Recipe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Calculator: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
};

// ============================================================================
// NAVIGATION
// ============================================================================

type Page = 'dashboard' | 'inventory' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'settings' | 'devlog';

interface NavItem {
  id: Page;
  label: string;
  icon: React.FC;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'inventory', label: 'Lab Inventory', icon: Icons.Inventory },
  { id: 'cultures', label: 'Cultures', icon: Icons.Culture },
  { id: 'lineage', label: 'Lineage', icon: Icons.Culture },
  { id: 'grows', label: 'Grows', icon: Icons.Grow },
  { id: 'recipes', label: 'Recipes', icon: Icons.Recipe },
  { id: 'calculator', label: 'Substrate Calc', icon: Icons.Calculator },
  { id: 'spawnrate', label: 'Spawn Rate', icon: Icons.Layers },
  { id: 'pressure', label: 'Pressure Cook', icon: Icons.Thermometer },
  { id: 'contamination', label: 'Contamination', icon: Icons.AlertTriangle },
  { id: 'efficiency', label: 'BE Calculator', icon: Icons.TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: Icons.Chart },
  { id: 'settings', label: 'Settings', icon: Icons.Settings },
  { id: 'devlog', label: 'Roadmap', icon: Icons.DevLog },
];

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
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  cultureCount: number;
  activeGrowCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose, cultureCount, activeGrowCount }) => {
  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onClose(); // Close sidebar on mobile after navigation
  };

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
        w-64 bg-zinc-900 border-r border-zinc-800 
        flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl">🍄</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">MycoLab</h1>
              <p className="text-xs text-zinc-500">Laboratory Manager</p>
            </div>
          </div>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
                  }
                `}
              >
                <Icon />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Stats - fixed at bottom, collapsible on small screens */}
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
  onNavigate: (page: Page) => void;
  onMenuClick: () => void;
}

// Map pages to their "new" action pages
const newButtonConfig: Partial<Record<Page, { label: string; page: Page }>> = {
  dashboard: { label: 'New Culture', page: 'cultures' },
  cultures: { label: 'New Culture', page: 'cultures' },
  grows: { label: 'New Grow', page: 'grows' },
  recipes: { label: 'New Recipe', page: 'recipes' },
  inventory: { label: 'New Culture', page: 'cultures' },
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, currentPage, onNavigate, onMenuClick }) => {
  const newAction = newButtonConfig[currentPage];
  
  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification Bell - only show dot when there are actual notifications */}
        <button 
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors relative"
          title="Notifications coming soon"
        >
          <Icons.Bell />
          {/* No hardcoded notification dot - will be dynamic when notifications are implemented */}
        </button>
        {newAction && (
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            onClick={() => onNavigate(newAction.page)}
          >
            <Icons.Plus />
            <span className="hidden sm:inline">{newAction.label}</span>
          </button>
        )}
      </div>
    </header>
  );
};

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

const DashboardPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
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
                  onClick={() => onNavigate('grows')}
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
          <button onClick={() => onNavigate('grows')} className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-center transition-colors">
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
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [state, setState] = useState<AppState>(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(() => {
    // Show setup wizard on first run
    return !localStorage.getItem('mycolab-setup-complete');
  });

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
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your mycology lab' },
    inventory: { title: 'Lab Inventory', subtitle: 'All cultures, spawn, and grows' },
    cultures: { title: 'Culture Library', subtitle: 'Manage your cultures and genetics' },
    lineage: { title: 'Lineage Visualization', subtitle: 'Interactive family tree of your cultures' },
    grows: { title: 'Grow Tracking', subtitle: 'Track your active and completed grows' },
    recipes: { title: 'Recipes', subtitle: 'Agar, LC, substrate formulations' },
    calculator: { title: 'Substrate Calculator', subtitle: 'Hydration ratio calculations' },
    spawnrate: { title: 'Spawn Rate Calculator', subtitle: 'Calculate spawn-to-substrate ratios' },
    pressure: { title: 'Pressure Cooking Calculator', subtitle: 'Sterilization times with altitude adjustment' },
    contamination: { title: 'Contamination Analysis', subtitle: 'Track and analyze contamination patterns' },
    efficiency: { title: 'Biological Efficiency', subtitle: 'Calculate and compare BE% across grows' },
    analytics: { title: 'Analytics', subtitle: 'Data visualization and insights' },
    settings: { title: 'Settings', subtitle: 'Configure lookups and preferences' },
    devlog: { title: 'Dev Roadmap', subtitle: 'Feature tracker with intelligent prioritization' },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'devlog':
        return (
          <DevLogPage 
            features={state.devLog}
            onUpdateStatus={updateFeatureStatus}
            onAddFeature={addDevLogFeature}
          />
        );
      case 'inventory':
        return <UnifiedItemView />;
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
      case 'analytics':
        return (
          <div className="p-6">
            <AnalyticsDashboard />
          </div>
        );
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
      case 'settings':
        return (
          <div className="p-6">
            <SettingsPage />
          </div>
        );
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DataProvider>
      <AppContext.Provider value={contextValue}>
        <AppContent 
          showSetup={showSetup}
          setShowSetup={setShowSetup}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          renderPage={renderPage}
          pageConfig={pageConfig}
        />
      </AppContext.Provider>
    </DataProvider>
  );
};

// Inner component that can access useData
const AppContent: React.FC<{
  showSetup: boolean;
  setShowSetup: (v: boolean) => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  renderPage: () => React.ReactNode;
  pageConfig: Record<string, { title: string; subtitle?: string; newAction?: { label: string; page: Page } }>;
}> = ({
  showSetup,
  setShowSetup,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  renderPage,
  pageConfig,
}) => {
  const { state } = useData();
  
  // Calculate real stats from actual data
  const cultureCount = state.cultures.length;
  const activeGrowCount = state.grows.filter(g => g.status === 'active').length;

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
      <div className="h-screen flex bg-zinc-950 text-white overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          cultureCount={cultureCount}
          activeGrowCount={activeGrowCount}
        />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
          <Header 
            {...pageConfig[currentPage]} 
            currentPage={currentPage} 
            onNavigate={setCurrentPage}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {renderPage()}
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
