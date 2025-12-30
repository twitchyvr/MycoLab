// ============================================================================
// INFO CONTEXT - Unified informational UI system
// Provides centralized management of help, warnings, tips, and suggestions
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useNotifications } from './NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

// Info display levels - controls verbosity
export type InfoVerbosity = 'minimal' | 'standard' | 'verbose' | 'exhaustive';

// Types of informational content
export type InfoType =
  | 'tooltip'        // Quick hover hints
  | 'help'           // Detailed explanations
  | 'warning'        // Caution/warning messages
  | 'tip'            // Pro tips and suggestions
  | 'validation'     // Form validation feedback
  | 'success'        // Positive feedback
  | 'info'           // General information
  | 'guide';         // Guided walkthrough

// Categories for grouping info content
export type InfoCategory =
  | 'general'
  | 'culture'
  | 'grow'
  | 'recipe'
  | 'inventory'
  | 'location'
  | 'strain'
  | 'container'
  | 'settings'
  | 'navigation'
  | 'data'
  | 'workflow';

// Priority levels for info items
export type InfoPriority = 'low' | 'medium' | 'high' | 'critical';

// User preferences for the info system
export interface InfoPreferences {
  // Master controls
  enabled: boolean;                    // Enable/disable all info features
  verbosity: InfoVerbosity;            // How much info to show

  // Type-specific toggles
  showTooltips: boolean;               // Hover tooltips
  showHelpIcons: boolean;              // ? icons next to fields
  showWarnings: boolean;               // Warning messages
  showTips: boolean;                   // Pro tips
  showValidation: boolean;             // Form validation
  showSuccessFeedback: boolean;        // Success messages
  showGuides: boolean;                 // Guided workflows

  // Category-specific toggles
  enabledCategories: InfoCategory[];   // Which categories to show

  // Delivery preferences
  useToasts: boolean;                  // Show as toast notifications
  toastDuration: number;               // How long toasts appear (ms)
  useInline: boolean;                  // Show inline with content
  usePopovers: boolean;                // Show as popovers

  // Warning preferences
  warningThreshold: InfoPriority;      // Minimum priority to show warnings
  dismissedWarnings: string[];         // IDs of dismissed warnings

  // Tip preferences
  dismissedTips: string[];             // IDs of dismissed tips (never show again)
  snoozeUntil?: Record<string, Date>;  // Tips snoozed until date

  // Sound
  soundEnabled: boolean;               // Play sounds for warnings
}

// A piece of help content
export interface HelpContent {
  id: string;
  category: InfoCategory;
  title: string;
  content: string;
  learnMoreUrl?: string;
  relatedTopics?: string[];
  forBeginners?: boolean;              // Only show for beginners
  keywords?: string[];                 // For searching
}

// A contextual warning
export interface WarningDefinition {
  id: string;
  category: InfoCategory;
  priority: InfoPriority;
  title: string;
  message: string;
  condition: string;                   // Description of when this triggers
  resolution?: string;                 // How to resolve
  learnMoreUrl?: string;
  isDismissible: boolean;
  showOnce?: boolean;                  // Only show once per session
}

// A proactive tip/suggestion
export interface TipDefinition {
  id: string;
  category: InfoCategory;
  priority: InfoPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionPage?: string;                 // Page to navigate to
  condition: string;                   // When to show this tip
  isDismissible: boolean;
  showOnce?: boolean;
}

// Active warning instance (triggered)
export interface ActiveWarning {
  id: string;
  definitionId: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  triggeredAt: Date;
  data?: Record<string, any>;
}

// Active tip instance
export interface ActiveTip {
  id: string;
  definitionId: string;
  triggeredAt: Date;
  data?: Record<string, any>;
}

// Validation state for form fields
export interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

const defaultPreferences: InfoPreferences = {
  enabled: true,
  verbosity: 'standard',

  showTooltips: true,
  showHelpIcons: true,
  showWarnings: true,
  showTips: true,
  showValidation: true,
  showSuccessFeedback: true,
  showGuides: true,

  enabledCategories: [
    'general', 'culture', 'grow', 'recipe', 'inventory',
    'location', 'strain', 'container', 'settings', 'navigation',
    'data', 'workflow'
  ],

  useToasts: true,
  toastDuration: 5000,
  useInline: true,
  usePopovers: true,

  warningThreshold: 'low',
  dismissedWarnings: [],

  dismissedTips: [],
  snoozeUntil: {},

  soundEnabled: false,
};

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface InfoContextType {
  // Preferences
  preferences: InfoPreferences;
  updatePreferences: (updates: Partial<InfoPreferences>) => void;
  resetPreferences: () => void;

  // Help content
  getHelp: (id: string) => HelpContent | undefined;
  searchHelp: (query: string) => HelpContent[];
  getHelpByCategory: (category: InfoCategory) => HelpContent[];

  // Warnings
  activeWarnings: ActiveWarning[];
  addWarning: (warning: Omit<ActiveWarning, 'id' | 'triggeredAt'>) => void;
  dismissWarning: (id: string, permanent?: boolean) => void;
  clearWarnings: () => void;
  isWarningDismissed: (definitionId: string) => boolean;

  // Tips
  activeTips: ActiveTip[];
  addTip: (tip: Omit<ActiveTip, 'id' | 'triggeredAt'>) => void;
  dismissTip: (id: string, permanent?: boolean) => void;
  snoozeTip: (id: string, days: number) => void;
  clearTips: () => void;
  isTipDismissed: (definitionId: string) => boolean;
  isTipSnoozed: (definitionId: string) => boolean;

  // Validation
  validation: Record<string, ValidationState>;
  setValidation: (fieldId: string, state: ValidationState) => void;
  clearValidation: (fieldId?: string) => void;

  // Visibility helpers
  shouldShow: (type: InfoType, category?: InfoCategory, priority?: InfoPriority) => boolean;
  isVerbose: () => boolean;
  isExhaustive: () => boolean;

  // Quick actions
  showInfo: (title: string, message: string, category?: InfoCategory) => void;
  showWarning: (title: string, message: string, priority?: InfoPriority) => void;
  showTip: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const InfoContext = createContext<InfoContextType | null>(null);

export const useInfo = () => {
  const context = useContext(InfoContext);
  if (!context) {
    throw new Error('useInfo must be used within InfoProvider');
  }
  return context;
};

// Optional hook that doesn't throw if outside provider
export const useInfoOptional = () => {
  return useContext(InfoContext);
};

// ============================================================================
// HELP CONTENT REGISTRY
// ============================================================================

const helpRegistry: HelpContent[] = [
  // Culture help
  {
    id: 'culture-type',
    category: 'culture',
    title: 'Culture Types',
    content: 'Different culture types serve different purposes. Liquid Culture (LC) is fast and easy to use. Agar plates allow isolation and selection. Spore syringes are for starting new genetics. Slants are for long-term storage.',
    relatedTopics: ['culture-transfer', 'culture-storage'],
    forBeginners: true,
    keywords: ['lc', 'agar', 'spore', 'slant', 'type'],
  },
  {
    id: 'culture-transfer',
    category: 'culture',
    title: 'Transfers & Generations',
    content: 'Each time you transfer culture to a new vessel, the generation increases. Monitor vigorousness across generations. Most cultures start declining around G5-G7. Transfer to fresh media before decline.',
    relatedTopics: ['culture-type', 'culture-health'],
    keywords: ['transfer', 'generation', 'vigor', 'decline'],
  },
  {
    id: 'culture-health',
    category: 'culture',
    title: 'Health Rating',
    content: 'Rate culture health 1-10 based on: growth speed, mycelium density, contamination signs, and color. A healthy LC should have fluffy white growth. Agar should show clean, rhizomorphic growth.',
    forBeginners: true,
    keywords: ['health', 'rating', 'contamination', 'growth'],
  },
  {
    id: 'culture-storage',
    category: 'culture',
    title: 'Culture Storage',
    content: 'Store agar cultures at 2-4°C (35-39°F). Liquid cultures can be refrigerated for 6-12 months. For long-term storage, use slants at 2-4°C or cryopreservation at -80°C.',
    relatedTopics: ['culture-type'],
    keywords: ['storage', 'refrigerator', 'fridge', 'cold'],
  },

  // Grow help
  {
    id: 'grow-stages',
    category: 'grow',
    title: 'Grow Stages',
    content: 'Grows progress through stages: Spawning → Colonization → Fruiting → Harvesting → Completed. Each stage has specific environmental requirements. Track transitions to optimize future grows.',
    forBeginners: true,
    keywords: ['stage', 'spawn', 'colonization', 'fruiting', 'harvest'],
  },
  {
    id: 'grow-contamination',
    category: 'grow',
    title: 'Contamination Signs',
    content: 'Watch for: green/blue/black mold, sour smells, slimy texture, or bacterial wet spots. Catch early and isolate or dispose of contaminated grows. Never open contaminated containers indoors.',
    forBeginners: true,
    keywords: ['contamination', 'mold', 'bacteria', 'trich'],
  },
  {
    id: 'grow-harvest',
    category: 'grow',
    title: 'Harvest Timing',
    content: 'Harvest just before or as veils begin to break. This maximizes potency and prevents spore drop. Twist and pull or cut at the base. Trim substrate from stems.',
    keywords: ['harvest', 'veil', 'timing', 'pick'],
  },
  {
    id: 'grow-yield',
    category: 'grow',
    title: 'Yield & Efficiency',
    content: 'Biological Efficiency (BE) = (wet weight / dry substrate weight) × 100. Good BE for most species is 75-150%. Track yields per flush and total to compare strains and techniques.',
    keywords: ['yield', 'efficiency', 'be', 'weight'],
  },

  // Location help
  {
    id: 'location-hierarchy',
    category: 'location',
    title: 'Location Hierarchy',
    content: 'Organize your lab with a hierarchy: Facility → Room → Zone → Rack → Shelf → Slot. This helps track where cultures and grows are located and plan workflows.',
    keywords: ['hierarchy', 'facility', 'room', 'rack', 'shelf'],
  },
  {
    id: 'location-environment',
    category: 'location',
    title: 'Environmental Ranges',
    content: 'Set temperature and humidity ranges for each location. The system will warn you when grows in that location need different conditions than the space provides.',
    keywords: ['temperature', 'humidity', 'environment', 'range'],
  },

  // Inventory help
  {
    id: 'inventory-tracking',
    category: 'inventory',
    title: 'Inventory Tracking',
    content: 'Track supplies by category: containers, substrates, chemicals, etc. Set reorder points to get alerts when stock is low. Link inventory usage to grows for cost tracking.',
    forBeginners: true,
    keywords: ['inventory', 'stock', 'supply', 'reorder'],
  },
  {
    id: 'inventory-lots',
    category: 'inventory',
    title: 'Lot Tracking',
    content: 'Track purchases as separate lots with cost and date. This enables accurate cost-per-grow calculations and helps identify supplier quality issues.',
    keywords: ['lot', 'batch', 'purchase', 'cost'],
  },

  // Recipe help
  {
    id: 'recipe-scaling',
    category: 'recipe',
    title: 'Recipe Scaling',
    content: 'Scale recipes by target volume or weight. The calculator adjusts all ingredients proportionally. Consider container size when scaling - ingredient ratios may need adjustment at very large scales.',
    keywords: ['scale', 'recipe', 'ingredient', 'ratio'],
  },
  {
    id: 'recipe-hydration',
    category: 'recipe',
    title: 'Hydration Rates',
    content: 'Substrate hydration is critical. Most bulk substrates need 60-70% moisture. Grains typically absorb 1.5-2x their dry weight. Use the hydration calculator for precise water amounts.',
    keywords: ['hydration', 'moisture', 'water', 'substrate'],
  },

  // Workflow help
  {
    id: 'workflow-sterile',
    category: 'workflow',
    title: 'Sterile Technique',
    content: 'Always work in front of a flow hood or in a still air box. Flame-sterilize tools between uses. Wear gloves and work quickly. These practices prevent contamination.',
    forBeginners: true,
    keywords: ['sterile', 'technique', 'flow hood', 'sab', 'contamination'],
  },
  {
    id: 'workflow-documentation',
    category: 'workflow',
    title: 'Documentation Best Practices',
    content: 'Log observations regularly: colonization progress, any issues, environmental readings. Good records help identify patterns and improve future grows.',
    keywords: ['documentation', 'log', 'observation', 'record'],
  },

  // Settings help
  {
    id: 'settings-experience',
    category: 'settings',
    title: 'Experience Level',
    content: 'Your experience level controls UI complexity. Beginners see more guidance and simpler interfaces. Experts see all advanced options. You can change this anytime in Settings.',
    forBeginners: true,
    keywords: ['experience', 'beginner', 'expert', 'settings'],
  },
  {
    id: 'settings-notifications',
    category: 'settings',
    title: 'Notification Settings',
    content: 'Configure which alerts you receive: harvest reminders, low stock, contamination alerts. Set quiet hours to pause notifications. Enable email/SMS for important alerts.',
    keywords: ['notification', 'alert', 'email', 'sms'],
  },
];

// ============================================================================
// WARNING DEFINITIONS
// ============================================================================

const warningDefinitions: WarningDefinition[] = [
  // Culture warnings
  {
    id: 'warn-culture-old-lc',
    category: 'culture',
    priority: 'medium',
    title: 'Liquid Culture Getting Old',
    message: 'This LC is over 3 months old. Consider refreshing to maintain viability.',
    condition: 'LC age > 90 days',
    resolution: 'Transfer to fresh LC media or use within 2 weeks.',
    isDismissible: true,
  },
  {
    id: 'warn-culture-high-gen',
    category: 'culture',
    priority: 'medium',
    title: 'High Generation Culture',
    message: 'This culture is generation 5+. Watch for signs of decline.',
    condition: 'Generation >= 5',
    resolution: 'Consider refreshing from a frozen or earlier generation stock.',
    isDismissible: true,
  },
  {
    id: 'warn-culture-contamination',
    category: 'culture',
    priority: 'critical',
    title: 'Contamination Detected',
    message: 'This culture has been marked as contaminated. Do not use for transfers.',
    condition: 'Status = contaminated',
    resolution: 'Dispose of contaminated cultures safely. Never open indoors.',
    isDismissible: false,
  },

  // Grow warnings
  {
    id: 'warn-grow-slow-colonization',
    category: 'grow',
    priority: 'medium',
    title: 'Slow Colonization',
    message: 'This grow is taking longer than expected to colonize.',
    condition: 'Colonization exceeds expected time by 50%',
    resolution: 'Check temperature, moisture, and spawn rate. May need more FAE.',
    isDismissible: true,
  },
  {
    id: 'warn-grow-no-pins',
    category: 'grow',
    priority: 'medium',
    title: 'No Pins Forming',
    message: 'This grow has been in fruiting for a while without pins.',
    condition: 'Fruiting stage > expected days without pins',
    resolution: 'Increase FAE, check humidity, or try a cold shock if appropriate.',
    isDismissible: true,
  },
  {
    id: 'warn-grow-environment-mismatch',
    category: 'grow',
    priority: 'high',
    title: 'Environment Mismatch',
    message: 'The location temperature/humidity doesn\'t match this grow\'s needs.',
    condition: 'Location env outside grow requirements',
    resolution: 'Move to appropriate location or adjust environment.',
    isDismissible: true,
  },

  // Inventory warnings
  {
    id: 'warn-inventory-low-stock',
    category: 'inventory',
    priority: 'medium',
    title: 'Low Stock',
    message: 'This item is below the reorder threshold.',
    condition: 'Quantity < reorder point',
    resolution: 'Reorder soon to avoid running out.',
    isDismissible: true,
  },
  {
    id: 'warn-inventory-expiring',
    category: 'inventory',
    priority: 'high',
    title: 'Item Expiring Soon',
    message: 'This inventory item is approaching its expiration date.',
    condition: 'Expiration within 30 days',
    resolution: 'Use soon or dispose of properly.',
    isDismissible: true,
  },

  // Data warnings
  {
    id: 'warn-data-not-synced',
    category: 'data',
    priority: 'high',
    title: 'Data Not Synced',
    message: 'Your data hasn\'t synced to the cloud recently. Changes may be lost.',
    condition: 'Last sync > 24 hours ago',
    resolution: 'Check your internet connection and Supabase settings.',
    isDismissible: true,
  },
  {
    id: 'warn-data-backup-needed',
    category: 'data',
    priority: 'medium',
    title: 'Backup Recommended',
    message: 'It\'s been a while since your last backup. Consider exporting your data.',
    condition: 'No backup in 30 days',
    resolution: 'Export your data from Settings → Data Management.',
    isDismissible: true,
  },
];

// ============================================================================
// TIP DEFINITIONS
// ============================================================================

const tipDefinitions: TipDefinition[] = [
  // Getting started tips
  {
    id: 'tip-add-first-culture',
    category: 'culture',
    priority: 'high',
    title: 'Add Your First Culture',
    message: 'Start by adding your cultures to track. This lets you trace lineage and monitor health.',
    actionLabel: 'Add Culture',
    actionPage: 'cultures',
    condition: 'No cultures exist',
    isDismissible: true,
  },
  {
    id: 'tip-setup-locations',
    category: 'location',
    priority: 'high',
    title: 'Set Up Your Lab Spaces',
    message: 'Define your lab locations (incubator, fruiting room, etc.) to track where things are.',
    actionLabel: 'Add Locations',
    actionPage: 'lab-spaces',
    condition: 'No locations exist',
    isDismissible: true,
  },
  {
    id: 'tip-add-strains',
    category: 'strain',
    priority: 'medium',
    title: 'Add Your Strains',
    message: 'Add the strains you work with for better tracking and yield comparisons.',
    actionLabel: 'Manage Strains',
    actionPage: 'strains',
    condition: 'No custom strains',
    isDismissible: true,
  },

  // Workflow tips
  {
    id: 'tip-log-observations',
    category: 'workflow',
    priority: 'medium',
    title: 'Log Regular Observations',
    message: 'Recording observations helps identify patterns and troubleshoot issues.',
    condition: 'Active grows with no recent observations',
    isDismissible: true,
  },
  {
    id: 'tip-track-inventory',
    category: 'inventory',
    priority: 'low',
    title: 'Track Your Supplies',
    message: 'Adding inventory items helps calculate grow costs and avoid stockouts.',
    actionLabel: 'Add Inventory',
    actionPage: 'inventory',
    condition: 'No inventory items',
    isDismissible: true,
  },

  // Best practice tips
  {
    id: 'tip-backup-data',
    category: 'data',
    priority: 'medium',
    title: 'Back Up Your Data',
    message: 'Export your data periodically to avoid losing your cultivation records.',
    actionLabel: 'Export Data',
    actionPage: 'settings',
    condition: 'Never backed up',
    isDismissible: true,
  },
  {
    id: 'tip-connect-supabase',
    category: 'data',
    priority: 'low',
    title: 'Enable Cloud Sync',
    message: 'Connect to Supabase to sync your data across devices and enable backups.',
    actionLabel: 'Connect',
    actionPage: 'settings',
    condition: 'Not connected to Supabase',
    isDismissible: true,
  },
];

// ============================================================================
// PROVIDER
// ============================================================================

interface InfoProviderProps {
  children: React.ReactNode;
}

export const InfoProvider: React.FC<InfoProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<InfoPreferences>(() => {
    const saved = localStorage.getItem('mycolab-info-preferences');
    if (saved) {
      try {
        return { ...defaultPreferences, ...JSON.parse(saved) };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [activeWarnings, setActiveWarnings] = useState<ActiveWarning[]>([]);
  const [activeTips, setActiveTips] = useState<ActiveTip[]>([]);
  const [validation, setValidationState] = useState<Record<string, ValidationState>>({});

  // Try to use notification system if available
  let notificationContext: ReturnType<typeof useNotifications> | null = null;
  try {
    notificationContext = useNotifications();
  } catch {
    // NotificationProvider not available
  }

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('mycolab-info-preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<InfoPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset preferences
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  // Get help content by ID
  const getHelp = useCallback((id: string): HelpContent | undefined => {
    return helpRegistry.find(h => h.id === id);
  }, []);

  // Search help content
  const searchHelp = useCallback((query: string): HelpContent[] => {
    const lowerQuery = query.toLowerCase();
    return helpRegistry.filter(h =>
      h.title.toLowerCase().includes(lowerQuery) ||
      h.content.toLowerCase().includes(lowerQuery) ||
      h.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }, []);

  // Get help by category
  const getHelpByCategory = useCallback((category: InfoCategory): HelpContent[] => {
    return helpRegistry.filter(h => h.category === category);
  }, []);

  // Generate unique ID
  const generateId = () => `info-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add warning
  const addWarning = useCallback((warning: Omit<ActiveWarning, 'id' | 'triggeredAt'>) => {
    if (!preferences.showWarnings) return;

    // Check if already dismissed
    if (preferences.dismissedWarnings.includes(warning.definitionId)) return;

    // Check priority threshold
    const definition = warningDefinitions.find(w => w.id === warning.definitionId);
    if (definition) {
      const priorities: InfoPriority[] = ['low', 'medium', 'high', 'critical'];
      const thresholdIndex = priorities.indexOf(preferences.warningThreshold);
      const warningIndex = priorities.indexOf(definition.priority);
      if (warningIndex < thresholdIndex) return;
    }

    // Check if already active
    if (activeWarnings.some(w =>
      w.definitionId === warning.definitionId &&
      w.entityId === warning.entityId
    )) return;

    const newWarning: ActiveWarning = {
      ...warning,
      id: generateId(),
      triggeredAt: new Date(),
    };

    setActiveWarnings(prev => [...prev, newWarning]);

    // Also show as toast if using notifications
    if (preferences.useToasts && notificationContext && definition) {
      notificationContext.toast.warning(definition.title, definition.message);
    }
  }, [preferences, activeWarnings, notificationContext]);

  // Dismiss warning
  const dismissWarning = useCallback((id: string, permanent = false) => {
    const warning = activeWarnings.find(w => w.id === id);
    if (warning && permanent) {
      setPreferences(prev => ({
        ...prev,
        dismissedWarnings: [...prev.dismissedWarnings, warning.definitionId],
      }));
    }
    setActiveWarnings(prev => prev.filter(w => w.id !== id));
  }, [activeWarnings]);

  // Clear all warnings
  const clearWarnings = useCallback(() => {
    setActiveWarnings([]);
  }, []);

  // Check if warning is dismissed
  const isWarningDismissed = useCallback((definitionId: string): boolean => {
    return preferences.dismissedWarnings.includes(definitionId);
  }, [preferences.dismissedWarnings]);

  // Add tip
  const addTip = useCallback((tip: Omit<ActiveTip, 'id' | 'triggeredAt'>) => {
    if (!preferences.showTips) return;

    // Check if dismissed or snoozed
    if (preferences.dismissedTips.includes(tip.definitionId)) return;

    const snoozeDate = preferences.snoozeUntil?.[tip.definitionId];
    if (snoozeDate && new Date(snoozeDate) > new Date()) return;

    // Check if already active
    if (activeTips.some(t => t.definitionId === tip.definitionId)) return;

    const newTip: ActiveTip = {
      ...tip,
      id: generateId(),
      triggeredAt: new Date(),
    };

    setActiveTips(prev => [...prev, newTip]);
  }, [preferences, activeTips]);

  // Dismiss tip
  const dismissTip = useCallback((id: string, permanent = false) => {
    const tip = activeTips.find(t => t.id === id);
    if (tip && permanent) {
      setPreferences(prev => ({
        ...prev,
        dismissedTips: [...prev.dismissedTips, tip.definitionId],
      }));
    }
    setActiveTips(prev => prev.filter(t => t.id !== id));
  }, [activeTips]);

  // Snooze tip
  const snoozeTip = useCallback((id: string, days: number) => {
    const tip = activeTips.find(t => t.id === id);
    if (tip) {
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + days);
      setPreferences(prev => ({
        ...prev,
        snoozeUntil: { ...prev.snoozeUntil, [tip.definitionId]: snoozeDate },
      }));
    }
    setActiveTips(prev => prev.filter(t => t.id !== id));
  }, [activeTips]);

  // Clear all tips
  const clearTips = useCallback(() => {
    setActiveTips([]);
  }, []);

  // Check if tip is dismissed
  const isTipDismissed = useCallback((definitionId: string): boolean => {
    return preferences.dismissedTips.includes(definitionId);
  }, [preferences.dismissedTips]);

  // Check if tip is snoozed
  const isTipSnoozed = useCallback((definitionId: string): boolean => {
    const snoozeDate = preferences.snoozeUntil?.[definitionId];
    return snoozeDate ? new Date(snoozeDate) > new Date() : false;
  }, [preferences.snoozeUntil]);

  // Set validation state for a field
  const setValidation = useCallback((fieldId: string, state: ValidationState) => {
    if (!preferences.showValidation) return;
    setValidationState(prev => ({ ...prev, [fieldId]: state }));
  }, [preferences.showValidation]);

  // Clear validation
  const clearValidation = useCallback((fieldId?: string) => {
    if (fieldId) {
      setValidationState(prev => {
        const { [fieldId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setValidationState({});
    }
  }, []);

  // Check if should show content based on preferences
  const shouldShow = useCallback((
    type: InfoType,
    category?: InfoCategory,
    priority?: InfoPriority
  ): boolean => {
    if (!preferences.enabled) return false;

    // Check type-specific toggle
    switch (type) {
      case 'tooltip':
        if (!preferences.showTooltips) return false;
        break;
      case 'help':
        if (!preferences.showHelpIcons) return false;
        break;
      case 'warning':
        if (!preferences.showWarnings) return false;
        break;
      case 'tip':
        if (!preferences.showTips) return false;
        break;
      case 'validation':
        if (!preferences.showValidation) return false;
        break;
      case 'success':
        if (!preferences.showSuccessFeedback) return false;
        break;
      case 'guide':
        if (!preferences.showGuides) return false;
        break;
    }

    // Check category if provided
    if (category && !preferences.enabledCategories.includes(category)) {
      return false;
    }

    // Check priority for warnings
    if (priority && type === 'warning') {
      const priorities: InfoPriority[] = ['low', 'medium', 'high', 'critical'];
      const thresholdIndex = priorities.indexOf(preferences.warningThreshold);
      const checkIndex = priorities.indexOf(priority);
      if (checkIndex < thresholdIndex) return false;
    }

    return true;
  }, [preferences]);

  // Verbosity checks
  const isVerbose = useCallback((): boolean => {
    return preferences.verbosity === 'verbose' || preferences.verbosity === 'exhaustive';
  }, [preferences.verbosity]);

  const isExhaustive = useCallback((): boolean => {
    return preferences.verbosity === 'exhaustive';
  }, [preferences.verbosity]);

  // Quick action methods
  const showInfo = useCallback((title: string, message: string, category: InfoCategory = 'general') => {
    if (!shouldShow('info', category)) return;
    if (preferences.useToasts && notificationContext) {
      notificationContext.toast.info(title, message);
    }
  }, [shouldShow, preferences.useToasts, notificationContext]);

  const showWarning = useCallback((title: string, message: string, priority: InfoPriority = 'medium') => {
    if (!shouldShow('warning', undefined, priority)) return;
    if (preferences.useToasts && notificationContext) {
      notificationContext.toast.warning(title, message);
    }
  }, [shouldShow, preferences.useToasts, notificationContext]);

  const showTip = useCallback((title: string, message: string) => {
    if (!shouldShow('tip')) return;
    if (preferences.useToasts && notificationContext) {
      notificationContext.toast.info(`💡 ${title}`, message);
    }
  }, [shouldShow, preferences.useToasts, notificationContext]);

  const showSuccess = useCallback((title: string, message: string) => {
    if (!shouldShow('success')) return;
    if (preferences.useToasts && notificationContext) {
      notificationContext.toast.success(title, message);
    }
  }, [shouldShow, preferences.useToasts, notificationContext]);

  const value: InfoContextType = useMemo(() => ({
    preferences,
    updatePreferences,
    resetPreferences,

    getHelp,
    searchHelp,
    getHelpByCategory,

    activeWarnings,
    addWarning,
    dismissWarning,
    clearWarnings,
    isWarningDismissed,

    activeTips,
    addTip,
    dismissTip,
    snoozeTip,
    clearTips,
    isTipDismissed,
    isTipSnoozed,

    validation,
    setValidation,
    clearValidation,

    shouldShow,
    isVerbose,
    isExhaustive,

    showInfo,
    showWarning,
    showTip,
    showSuccess,
  }), [
    preferences, updatePreferences, resetPreferences,
    getHelp, searchHelp, getHelpByCategory,
    activeWarnings, addWarning, dismissWarning, clearWarnings, isWarningDismissed,
    activeTips, addTip, dismissTip, snoozeTip, clearTips, isTipDismissed, isTipSnoozed,
    validation, setValidation, clearValidation,
    shouldShow, isVerbose, isExhaustive,
    showInfo, showWarning, showTip, showSuccess,
  ]);

  return (
    <InfoContext.Provider value={value}>
      {children}
    </InfoContext.Provider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { helpRegistry, warningDefinitions, tipDefinitions };
export default InfoProvider;
