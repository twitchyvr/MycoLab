// ============================================================================
// MYCOLAB - Main Application Component
// ============================================================================

import React, { useState, createContext, useContext, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { DataProvider, useData, CreationProvider, useCreation, NotificationProvider, ThemeProvider } from './store';
import { AuthProvider } from './lib/AuthContext';
import { EntityFormModal } from './components/forms';
import { AuthModal, AccountMenu } from './components/auth';
import { ToastContainer, NotificationBell } from './components/notifications';
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
import { StrainPerformanceAnalytics } from './components/analytics/StrainPerformanceAnalytics';
import { SettingsPage } from './components/settings/SettingsPage';
import { SpawnRateCalculator } from './components/tools/SpawnRateCalculator';
import { PressureCookingCalculator } from './components/tools/PressureCookingCalculator';
import { CultureManagement } from './components/cultures/CultureManagement';
import { LineageVisualization } from './components/cultures/LineageVisualization';
import { GrowManagement } from './components/grows/GrowManagement';
import { RecipeBuilder } from './components/recipes/RecipeBuilder';
import { SetupWizard } from './components/setup/SetupWizard';
import { StockManagement } from './components/inventory/StockManagement';
import { TodayView } from './components/today';
import { GlobalSearch, SearchTrigger } from './components/common/GlobalSearch';
import { ObservationTimeline, EventLogger } from './components/observations';
import { ProfilePage } from './components/profile';
import { FloatingActionButton, LabCommandCenter } from './components/dashboard';
import { LabMapping, LocationOccupancy } from './components/locations';
import { LabelDesigner } from './components/labels';
import { QRScanner } from './components/qr';
import { DailyCheck, HarvestWorkflow, ColdStorageCheck } from './components/dailycheck';
import { HarvestForecast } from './components/forecast/HarvestForecast';
import { SpeciesLibrary } from './components/library';

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
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
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
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
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
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  QRScan: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="3" height="3"/>
      <rect x="18" y="14" width="3" height="3"/>
      <rect x="14" y="18" width="3" height="3"/>
      <rect x="18" y="18" width="3" height="3"/>
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13"/>
    </svg>
  ),
  Library: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <path d="M8 7h8"/>
      <path d="M8 11h8"/>
      <path d="M8 15h4"/>
    </svg>
  ),
  Snowflake: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M4.93 4.93l4.24 4.24"/>
      <path d="M14.83 14.83l4.24 4.24"/>
      <path d="M19.07 4.93l-4.24 4.24"/>
      <path d="M9.17 14.83l-4.24 4.24"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  Pencil: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  ),
};

// ============================================================================
// NAVIGATION
// ============================================================================

type Page = 'dashboard' | 'today' | 'dailycheck' | 'harvest' | 'forecast' | 'coldstorage' | 'observations' | 'eventlog' | 'library' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'labmapping' | 'occupancy' | 'labels' | 'scanner' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'strainanalytics' | 'settings' | 'profile' | 'devlog';

// Route configuration: maps Page to URL paths
// Routes with :id support deep-linking to specific items
const routeConfig: Record<Page, string> = {
  dashboard: '/',
  today: '/today',
  dailycheck: '/daily-check',
  harvest: '/harvest',
  forecast: '/forecast',
  coldstorage: '/cold-storage',
  observations: '/observations',
  eventlog: '/event-log',
  library: '/library',
  inventory: '/inventory',
  stock: '/stock',
  cultures: '/cultures',
  lineage: '/lineage',
  grows: '/grows',
  recipes: '/recipes',
  labmapping: '/lab-mapping',
  occupancy: '/occupancy',
  labels: '/labels',
  scanner: '/scanner',
  calculator: '/calculator',
  spawnrate: '/spawn-rate',
  pressure: '/pressure-cooking',
  contamination: '/contamination',
  efficiency: '/efficiency',
  analytics: '/analytics',
  strainanalytics: '/strain-analytics',
  settings: '/settings',
  profile: '/profile',
  devlog: '/devlog',
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
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.FC;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Section Icons for navigation groups
const SectionIcons = {
  Command: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  Library: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Inventory: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Genetics: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="M17 6l-2.5-2.5"/><path d="M14 8l-1.5-1.5"/><path d="M7 18l2.5 2.5"/><path d="M10 16l1.5 1.5"/>
    </svg>
  ),
  Analytics: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  ),
  Tools: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

// Grouped navigation structure based on design brief
const navGroups: NavGroup[] = [
  {
    id: 'command',
    label: 'Lab Command',
    icon: SectionIcons.Command,
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
      { id: 'today', label: 'Today', icon: Icons.Sun },
      { id: 'dailycheck', label: 'Daily Check', icon: Icons.Clipboard },
      { id: 'harvest', label: 'Harvest', icon: Icons.Scale },
      { id: 'forecast', label: 'Forecast', icon: Icons.TrendingUp },
      { id: 'coldstorage', label: 'Cold Storage', icon: Icons.Snowflake },
      { id: 'observations', label: 'Observations', icon: Icons.Clipboard },
      { id: 'eventlog', label: 'Event Logger', icon: Icons.Pencil },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    icon: SectionIcons.Library,
    defaultOpen: false,
    items: [
      { id: 'library', label: 'Species & Strains', icon: Icons.Library },
      { id: 'recipes', label: 'Recipes', icon: Icons.Recipe },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: SectionIcons.Inventory,
    defaultOpen: false,
    items: [
      { id: 'inventory', label: 'Lab Inventory', icon: Icons.Inventory },
      { id: 'stock', label: 'Stock & Orders', icon: Icons.Package },
      { id: 'labmapping', label: 'Lab Mapping', icon: Icons.Layers },
      { id: 'occupancy', label: 'Occupancy', icon: Icons.Grid },
      { id: 'labels', label: 'Labels', icon: Icons.Tag },
      { id: 'scanner', label: 'QR Scanner', icon: Icons.QRScan },
    ],
  },
  {
    id: 'genetics',
    label: 'Genetics',
    icon: SectionIcons.Genetics,
    defaultOpen: false,
    items: [
      { id: 'cultures', label: 'Cultures', icon: Icons.Culture },
      { id: 'lineage', label: 'Lineage', icon: Icons.Lineage },
      { id: 'grows', label: 'Grows', icon: Icons.Grow },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: SectionIcons.Analytics,
    defaultOpen: false,
    items: [
      { id: 'analytics', label: 'Dashboard', icon: Icons.Chart },
      { id: 'strainanalytics', label: 'Strain Performance', icon: Icons.Target },
      { id: 'contamination', label: 'Contamination', icon: Icons.AlertTriangle },
      { id: 'efficiency', label: 'BE Calculator', icon: Icons.TrendingUp },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: SectionIcons.Tools,
    defaultOpen: false,
    items: [
      { id: 'calculator', label: 'Substrate Calc', icon: Icons.Calculator },
      { id: 'spawnrate', label: 'Spawn Rate', icon: Icons.Layers },
      { id: 'pressure', label: 'Pressure Cook', icon: Icons.Thermometer },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: SectionIcons.Settings,
    defaultOpen: false,
    items: [
      { id: 'settings', label: 'Preferences', icon: Icons.Settings },
      { id: 'profile', label: 'Profile', icon: Icons.Dashboard },
      { id: 'devlog', label: 'Roadmap', icon: Icons.DevLog },
    ],
  },
];

// Flat list for backwards compatibility
const navItems: NavItem[] = navGroups.flatMap(group => group.items);

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

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose, cultureCount, activeGrowCount }) => {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-xl">🍄</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">MycoLab</h1>
                <p className="text-xs text-zinc-500">Laboratory Manager</p>
                <p className="text-[10px] text-zinc-600 font-mono">v{__APP_VERSION__}</p>
              </div>
            </div>
            {/* Mobile close button */}
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
          </div>
        </div>

        {/* Navigation - scrollable with grouped structure */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.has(group.id);
            const hasActivePage = group.items.some(item => item.id === currentPage);

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
                      const isActive = currentPage === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavigate(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                            transition-all duration-200
                            ${isActive
                              ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                              : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
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
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Quick Stats - fixed at bottom */}
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
  onNavigate: (page: Page, itemId?: string) => void;
  onMenuClick: () => void;
  onSearchClick: () => void;
}

// Map pages to their "new" action pages
const newButtonConfig: Partial<Record<Page, { label: string; page: Page }>> = {
  dashboard: { label: 'New Culture', page: 'cultures' },
  today: { label: 'New Culture', page: 'cultures' },
  cultures: { label: 'New Culture', page: 'cultures' },
  grows: { label: 'New Grow', page: 'grows' },
  recipes: { label: 'New Recipe', page: 'recipes' },
  inventory: { label: 'New Culture', page: 'cultures' },
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
    today: { title: 'Today', subtitle: 'Daily tasks and actionable items' },
    dailycheck: { title: 'Daily Room Check', subtitle: 'Growing room rounds with harvest estimates' },
    harvest: { title: 'Harvest Workflow', subtitle: 'Quick harvest recording with auto BE% calculation' },
    forecast: { title: 'Harvest Forecasting', subtitle: 'Predict stage transitions and forecast upcoming harvests' },
    coldstorage: { title: 'Cold Storage Check', subtitle: 'Review fridge and cold room inventory' },
    observations: { title: 'Observations', subtitle: 'Timeline of all culture and grow observations' },
    eventlog: { title: 'Event Logger', subtitle: 'Log events, notes, and observations across your lab' },
    library: { title: 'Species & Strain Library', subtitle: 'Reference guide with growing parameters and terminology' },
    inventory: { title: 'Lab Inventory', subtitle: 'All cultures, spawn, and grows' },
    stock: { title: 'Lab Stock', subtitle: 'Inventory lots, purchases, and tracking' },
    cultures: { title: 'Culture Library', subtitle: 'Manage your cultures and genetics' },
    lineage: { title: 'Lineage Visualization', subtitle: 'Interactive family tree of your cultures' },
    grows: { title: 'Grow Tracking', subtitle: 'Track your active and completed grows' },
    recipes: { title: 'Recipes', subtitle: 'Agar, LC, substrate formulations' },
    labmapping: { title: 'Lab Mapping', subtitle: 'Manage rooms, racks, shelves, and storage locations' },
    occupancy: { title: 'Location Occupancy', subtitle: 'Track items, varieties, and yields across your lab' },
    labels: { title: 'Label Designer', subtitle: 'Design and print labels with QR codes' },
    scanner: { title: 'QR Scanner', subtitle: 'Scan labels to access records instantly' },
    calculator: { title: 'Substrate Calculator', subtitle: 'Hydration ratio calculations' },
    spawnrate: { title: 'Spawn Rate Calculator', subtitle: 'Calculate spawn-to-substrate ratios' },
    pressure: { title: 'Pressure Cooking Calculator', subtitle: 'Sterilization times with altitude adjustment' },
    contamination: { title: 'Contamination Analysis', subtitle: 'Track and analyze contamination patterns' },
    efficiency: { title: 'Biological Efficiency', subtitle: 'Calculate and compare BE% across grows' },
    analytics: { title: 'Analytics', subtitle: 'Data visualization and insights' },
    strainanalytics: { title: 'Strain Performance', subtitle: 'Track success rates, yields, and optimal conditions per strain' },
    settings: { title: 'Settings', subtitle: 'Configure lookups and preferences' },
    profile: { title: 'My Profile', subtitle: 'Manage your account and security settings' },
    devlog: { title: 'Dev Roadmap', subtitle: 'Feature tracker with intelligent prioritization' },
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <LabCommandCenter onNavigate={setCurrentPage} />;
      case 'today':
        return (
          <div className="p-6">
            <TodayView onNavigate={setCurrentPage} />
          </div>
        );
      case 'dailycheck':
        return (
          <div className="p-6">
            <DailyCheck />
          </div>
        );
      case 'harvest':
        return (
          <div className="p-6">
            <HarvestWorkflow />
          </div>
        );
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
      case 'devlog':
        return (
          <DevLogPage 
            features={state.devLog}
            onUpdateStatus={updateFeatureStatus}
            onAddFeature={addDevLogFeature}
          />
        );
      case 'inventory':
        return <UnifiedItemView onNavigate={setCurrentPage} />;
      case 'stock':
        return (
          <div className="p-6">
            <StockManagement />
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
      case 'labmapping':
        return (
          <div className="p-6">
            <LabMapping />
          </div>
        );
      case 'occupancy':
        return (
          <div className="p-6">
            <LocationOccupancy />
          </div>
        );
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
      case 'strainanalytics':
        return <StrainPerformanceAnalytics />;
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
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <CreationProvider>
              <AppContext.Provider value={contextValue}>
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
                  renderPage={renderPage}
                  pageConfig={pageConfig}
                />
              </AppContext.Provider>
            </CreationProvider>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Component to manage EntityFormModal visibility based on creation context
const CreationModalManager: React.FC = () => {
  const { isCreating, clearAllDrafts } = useCreation();

  return (
    <EntityFormModal
      isOpen={isCreating}
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
  renderPage,
  pageConfig,
}) => {
  const { state } = useData();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
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
            onSearchClick={() => setIsSearchOpen(true)}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {renderPage()}
          </div>
        </main>
        {/* Mobile Floating Action Button */}
        <FloatingActionButton onNavigate={(page: string) => setCurrentPage(page as Page)} />
      </div>
    </>
  );
};

export default App;
