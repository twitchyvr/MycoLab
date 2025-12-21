// ============================================================================
// PRESSURE COOKING CALCULATOR
// Calculate sterilization times with altitude adjustment and built-in timer
// Enhanced with item selection and sterilization logging
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import type { TimerSoundType, PreparedSpawn } from '../../store/types';
import { playTimerSound, previewSound, timerSoundOptions } from '../../utils/timerSounds';

// Item being sterilized
interface SterilizationItem {
  id: string;
  type: 'prepared_spawn' | 'inventory' | 'custom';
  name: string;
  quantity: number;
  refId?: string; // Reference ID for prepared_spawn or inventory item
  suggestedPreset?: string; // Suggested preset ID based on item type
}

interface PCPreset {
  id: string;
  name: string;
  category: 'grain' | 'substrate' | 'agar' | 'liquid' | 'tools';
  basePSI: number;
  baseMinutes: number;
  perQuartAdditional: number; // Additional minutes per quart over 1qt
  maxMinutes: number;
  notes: string;
}

interface AltitudeAdjustment {
  minFeet: number;
  maxFeet: number;
  psiIncrease: number;
  label: string;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  startTime: number | null;
}

// Altitude adjustments (FDA guidelines)
const altitudeAdjustments: AltitudeAdjustment[] = [
  { minFeet: 0, maxFeet: 1000, psiIncrease: 0, label: '0-1,000 ft' },
  { minFeet: 1001, maxFeet: 2000, psiIncrease: 0.5, label: '1,001-2,000 ft' },
  { minFeet: 2001, maxFeet: 3000, psiIncrease: 1, label: '2,001-3,000 ft' },
  { minFeet: 3001, maxFeet: 4000, psiIncrease: 1.5, label: '3,001-4,000 ft' },
  { minFeet: 4001, maxFeet: 5000, psiIncrease: 2, label: '4,001-5,000 ft' },
  { minFeet: 5001, maxFeet: 6000, psiIncrease: 2.5, label: '5,001-6,000 ft' },
  { minFeet: 6001, maxFeet: 7000, psiIncrease: 3, label: '6,001-7,000 ft' },
  { minFeet: 7001, maxFeet: 8000, psiIncrease: 3.5, label: '7,001-8,000 ft' },
  { minFeet: 8001, maxFeet: 10000, psiIncrease: 4, label: '8,001-10,000 ft' },
];

// Sterilization presets
const pcPresets: PCPreset[] = [
  // Grains
  {
    id: 'grain-quart',
    name: 'Grain Jars (Quart)',
    category: 'grain',
    basePSI: 15,
    baseMinutes: 90,
    perQuartAdditional: 0,
    maxMinutes: 120,
    notes: 'Oats, rye, wheat, popcorn, millet. Ensure grain is properly hydrated.',
  },
  {
    id: 'grain-pint',
    name: 'Grain Jars (Pint)',
    category: 'grain',
    basePSI: 15,
    baseMinutes: 75,
    perQuartAdditional: 0,
    maxMinutes: 90,
    notes: 'Smaller jars need slightly less time.',
  },
  {
    id: 'grain-bag-3lb',
    name: 'Grain Bags (3lb)',
    category: 'grain',
    basePSI: 15,
    baseMinutes: 150,
    perQuartAdditional: 0,
    maxMinutes: 180,
    notes: 'Larger mass requires longer sterilization. Lay flat in PC.',
  },
  {
    id: 'grain-bag-5lb',
    name: 'Grain Bags (5lb)',
    category: 'grain',
    basePSI: 15,
    baseMinutes: 180,
    perQuartAdditional: 0,
    maxMinutes: 210,
    notes: 'May need to run in batches. Ensure steam penetration.',
  },
  
  // Substrates
  {
    id: 'sawdust-block',
    name: 'Sawdust Blocks (5lb)',
    category: 'substrate',
    basePSI: 15,
    baseMinutes: 150,
    perQuartAdditional: 0,
    maxMinutes: 180,
    notes: 'Masters mix, supplemented sawdust. Dense blocks need longer.',
  },
  {
    id: 'straw-pasteurize',
    name: 'Straw (Pasteurization)',
    category: 'substrate',
    basePSI: 0,
    baseMinutes: 60,
    perQuartAdditional: 0,
    maxMinutes: 90,
    notes: 'NOT pressure cooked - use hot water bath at 160-180°F.',
  },
  {
    id: 'manure-substrate',
    name: 'Manure Substrate',
    category: 'substrate',
    basePSI: 15,
    baseMinutes: 120,
    perQuartAdditional: 0,
    maxMinutes: 150,
    notes: 'Composted manure-based substrates.',
  },
  
  // Agar
  {
    id: 'agar-plates',
    name: 'Agar Plates (Stack)',
    category: 'agar',
    basePSI: 15,
    baseMinutes: 45,
    perQuartAdditional: 0,
    maxMinutes: 60,
    notes: 'Pour immediately after removing from PC while still liquid.',
  },
  {
    id: 'agar-slants',
    name: 'Agar Slants',
    category: 'agar',
    basePSI: 15,
    baseMinutes: 30,
    perQuartAdditional: 0,
    maxMinutes: 45,
    notes: 'Small volume tubes sterilize quickly.',
  },
  {
    id: 'agar-bottle',
    name: 'Agar Media Bottle (500ml)',
    category: 'agar',
    basePSI: 15,
    baseMinutes: 45,
    perQuartAdditional: 5,
    maxMinutes: 60,
    notes: 'Keep cap loose during sterilization.',
  },
  
  // Liquids
  {
    id: 'lc-jar',
    name: 'Liquid Culture (Quart)',
    category: 'liquid',
    basePSI: 15,
    baseMinutes: 30,
    perQuartAdditional: 5,
    maxMinutes: 45,
    notes: 'Sugar water with nutrients. Dont overfill - max 500ml in quart jar.',
  },
  {
    id: 'lc-bottle',
    name: 'LC Bottle (500ml)',
    category: 'liquid',
    basePSI: 15,
    baseMinutes: 25,
    perQuartAdditional: 0,
    maxMinutes: 35,
    notes: 'Keep cap loose. Let cool slowly to avoid boil-over.',
  },
  {
    id: 'water-distilled',
    name: 'Distilled Water (Quart)',
    category: 'liquid',
    basePSI: 15,
    baseMinutes: 20,
    perQuartAdditional: 5,
    maxMinutes: 30,
    notes: 'For syringe filling, rinsing. Already pure - just sterilizing.',
  },
  
  // Tools
  {
    id: 'tools-syringes',
    name: 'Syringes & Needles',
    category: 'tools',
    basePSI: 15,
    baseMinutes: 30,
    perQuartAdditional: 0,
    maxMinutes: 45,
    notes: 'Wrap in foil. Remove plunger before sterilizing.',
  },
  {
    id: 'tools-scalpels',
    name: 'Scalpels & Tools',
    category: 'tools',
    basePSI: 15,
    baseMinutes: 30,
    perQuartAdditional: 0,
    maxMinutes: 45,
    notes: 'Wrap in foil. Can also flame sterilize between uses.',
  },
];

// Icons
const Icons = {
  Thermometer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  RotateCcw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Mountain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    </svg>
  ),
  Volume: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 2.26a3 3 0 0 0-2.45 3.17v10.14A3 3 0 0 0 14 18.74V2.26z" />
      <path d="M14 2.26L18 6v12l-4 3.74" />
      <path d="M14 2.26L10 6v12l4 3.74" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Package: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M16.5 9.4l-9-5.19"/>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Jar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10 2v2.343a5 5 0 00-1.464 1.036L8 6h8l-.536-.621A5 5 0 0014 4.343V2"/>
      <rect x="6" y="6" width="12" height="14" rx="2"/>
      <path d="M6 10h12"/>
    </svg>
  ),
  History: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l4 2"/>
    </svg>
  ),
};

// Format time for display
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Map inventory categories to suggested presets
const categoryToPresetMap: Record<string, string> = {
  'grain': 'grain-quart',
  'substrate': 'sawdust-block',
  'agar': 'agar-plates',
  'liquid': 'lc-jar',
  'jars': 'grain-quart',
  'bags': 'grain-bag-3lb',
  'containers': 'grain-quart',
  'tools': 'tools-syringes',
  'syringes': 'tools-syringes',
  'scalpels': 'tools-scalpels',
};

export const PressureCookingCalculator: React.FC = () => {
  const { state, updateSettings, updatePreparedSpawn, getContainer, getGrainType, getRecipe, getInventoryCategory } = useData();

  // Calculator state
  const [selectedPreset, setSelectedPreset] = useState<string>(pcPresets[0].id);
  const [altitude, setAltitude] = useState<string>('0');
  const [quantity, setQuantity] = useState<string>('1');
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);

  // Item tracking state
  const [sterilizationItems, setSterilizationItems] = useState<SterilizationItem[]>([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [sterilizationLog, setSterilizationLog] = useState<{date: Date; items: SterilizationItem[]; psi: number; minutes: number}[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    totalSeconds: 0,
    remainingSeconds: 0,
    startTime: null,
  });

  // Sound settings from user preferences
  const timerSound = state.settings.timerSound || 'bell';
  const timerVolume = state.settings.timerVolume ?? 0.7;
  const notificationsEnabled = timerSound !== 'none';

  // Show sound selector dropdown
  const [showSoundSelector, setShowSoundSelector] = useState(false);
  const soundSelectorRef = React.useRef<HTMLDivElement>(null);
  const itemSelectorRef = React.useRef<HTMLDivElement>(null);

  // Get prepared spawn that needs sterilization (not yet sterilized - no sterilization date)
  const needsSterilizationSpawn = useMemo(() => {
    return state.preparedSpawn.filter(s =>
      s.isActive && s.status === 'available' && !s.sterilizationDate
    );
  }, [state.preparedSpawn]);

  // Available prepared spawn that could be re-sterilized (already sterilized)
  const availableSpawn = useMemo(() => {
    return state.preparedSpawn.filter(s =>
      s.isActive && s.status === 'available' && s.sterilizationDate
    );
  }, [state.preparedSpawn]);

  // Reserved spawn waiting to be sterilized
  const reservedSpawn = useMemo(() => {
    return state.preparedSpawn.filter(s => s.isActive && s.status === 'reserved');
  }, [state.preparedSpawn]);

  // Get sterilizable inventory items (items that could be pressure cooked)
  const sterilizableInventoryItems = useMemo(() => {
    // Keywords that indicate items suitable for pressure cooking
    const sterilizableKeywords = ['jar', 'bag', 'grain', 'substrate', 'agar', 'media', 'syringe', 'needle', 'scalpel', 'tool'];

    return state.inventoryItems.filter(item => {
      if (!item.isActive || item.quantity <= 0) return false;

      // Check item name for keywords
      const nameLower = item.name.toLowerCase();
      if (sterilizableKeywords.some(kw => nameLower.includes(kw))) return true;

      // Check category name for keywords
      const category = getInventoryCategory(item.categoryId);
      if (category) {
        const catLower = category.name.toLowerCase();
        if (sterilizableKeywords.some(kw => catLower.includes(kw))) return true;
      }

      return false;
    });
  }, [state.inventoryItems, getInventoryCategory]);

  // Helper to get spawn display name
  const getSpawnDisplayName = useCallback((spawn: PreparedSpawn): string => {
    if (spawn.label) return spawn.label;
    const container = getContainer(spawn.containerId);
    const grainType = spawn.grainTypeId ? getGrainType(spawn.grainTypeId) : null;
    const recipe = spawn.recipeId ? getRecipe(spawn.recipeId) : null;

    let name = container?.name || spawn.type;
    if (grainType) name += ` - ${grainType.name}`;
    if (recipe) name += ` - ${recipe.name}`;
    return name;
  }, [getContainer, getGrainType, getRecipe]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (soundSelectorRef.current && !soundSelectorRef.current.contains(event.target as Node)) {
        setShowSoundSelector(false);
      }
      if (itemSelectorRef.current && !itemSelectorRef.current.contains(event.target as Node)) {
        setShowItemSelector(false);
      }
    };
    if (showSoundSelector || showItemSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSoundSelector, showItemSelector]);

  // Add a prepared spawn to sterilization items
  const addPreparedSpawnItem = useCallback((spawn: PreparedSpawn) => {
    // Check if already added
    if (sterilizationItems.some(item => item.refId === spawn.id)) return;

    const newItem: SterilizationItem = {
      id: `spawn-${spawn.id}`,
      type: 'prepared_spawn',
      name: getSpawnDisplayName(spawn),
      quantity: spawn.containerCount,
      refId: spawn.id,
    };
    setSterilizationItems(prev => [...prev, newItem]);
    setShowItemSelector(false);
  }, [sterilizationItems, getSpawnDisplayName]);

  // Get suggested preset for an inventory item based on its name/category
  const getSuggestedPreset = useCallback((itemName: string, categoryId?: string): string | undefined => {
    const nameLower = itemName.toLowerCase();
    const category = categoryId ? getInventoryCategory(categoryId) : undefined;
    const catNameLower = category?.name?.toLowerCase() || '';

    // Check name and category for preset matches
    for (const [keyword, presetId] of Object.entries(categoryToPresetMap)) {
      if (nameLower.includes(keyword) || catNameLower.includes(keyword)) {
        return presetId;
      }
    }
    return undefined;
  }, [getInventoryCategory]);

  // Add an inventory item to sterilization list
  const addInventoryItem = useCallback((item: typeof state.inventoryItems[0], qty?: number) => {
    // Check if already added
    if (sterilizationItems.some(si => si.refId === item.id && si.type === 'inventory')) return;

    const suggestedPreset = getSuggestedPreset(item.name, item.categoryId);
    const quantity = qty || Math.min(item.quantity, 12); // Default to available qty, max 12

    const newItem: SterilizationItem = {
      id: `inv-${item.id}`,
      type: 'inventory',
      name: item.name,
      quantity,
      refId: item.id,
      suggestedPreset,
    };
    setSterilizationItems(prev => [...prev, newItem]);

    // Auto-select suggested preset if one is found
    if (suggestedPreset) {
      setSelectedPreset(suggestedPreset);
    }

    // Update quantity
    setQuantity(quantity.toString());
    setShowItemSelector(false);
  }, [sterilizationItems, getSuggestedPreset]);

  // Add a custom item
  const addCustomItem = useCallback(() => {
    if (!customItemName.trim()) return;

    const suggestedPreset = getSuggestedPreset(customItemName);
    const newItem: SterilizationItem = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      name: customItemName.trim(),
      quantity: parseInt(customItemQty) || 1,
      suggestedPreset,
    };
    setSterilizationItems(prev => [...prev, newItem]);

    // Auto-select suggested preset if one is found
    if (suggestedPreset) {
      setSelectedPreset(suggestedPreset);
    }

    setCustomItemName('');
    setCustomItemQty('1');
    setShowItemSelector(false);
  }, [customItemName, customItemQty, getSuggestedPreset]);

  // Remove an item from sterilization list
  const removeItem = useCallback((itemId: string) => {
    setSterilizationItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Get current preset
  const currentPreset = pcPresets.find(p => p.id === selectedPreset) || pcPresets[0];
  
  // Calculate adjusted values
  const calculation = useMemo(() => {
    const alt = parseInt(altitude) || 0;
    const qty = parseInt(quantity) || 1;
    
    // Find altitude adjustment
    const altAdj = altitudeAdjustments.find(a => alt >= a.minFeet && alt <= a.maxFeet) || altitudeAdjustments[0];
    const adjustedPSI = currentPreset.basePSI + altAdj.psiIncrease;
    
    // Calculate time based on quantity
    let baseTime = currentPreset.baseMinutes;
    if (qty > 1 && currentPreset.perQuartAdditional > 0) {
      baseTime += (qty - 1) * currentPreset.perQuartAdditional;
    }
    
    // Cap at max time
    const calculatedTime = Math.min(baseTime, currentPreset.maxMinutes);
    const finalTime = useCustomTime && customMinutes ? parseInt(customMinutes) : calculatedTime;
    
    return {
      psi: adjustedPSI,
      minutes: finalTime,
      altitudeAdjustment: altAdj,
      isPasteurization: currentPreset.basePSI === 0,
    };
  }, [selectedPreset, altitude, quantity, customMinutes, useCustomTime, currentPreset]);

  // Handle sterilization completion
  const handleSterilizationComplete = useCallback(async () => {
    const sterilizationMethod = `PC ${calculation.psi}psi ${calculation.minutes}min`;
    const sterilizationDate = new Date();

    // Update all prepared spawn items that were sterilized
    for (const item of sterilizationItems) {
      if (item.type === 'prepared_spawn' && item.refId) {
        try {
          await updatePreparedSpawn(item.refId, {
            status: 'available',
            sterilizationDate,
            sterilizationMethod,
          });
        } catch (error) {
          console.error('Failed to update prepared spawn:', error);
        }
      }
    }

    // Log the sterilization event
    if (sterilizationItems.length > 0) {
      setSterilizationLog(prev => [
        {
          date: sterilizationDate,
          items: [...sterilizationItems],
          psi: calculation.psi,
          minutes: calculation.minutes,
        },
        ...prev.slice(0, 9), // Keep last 10 entries
      ]);
    }

    // Clear items after successful sterilization
    setSterilizationItems([]);
  }, [sterilizationItems, calculation.psi, calculation.minutes, updatePreparedSpawn]);

  // Timer tick effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timer.isRunning && !timer.isPaused && timer.remainingSeconds > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newRemaining = prev.remainingSeconds - 1;
          
          if (newRemaining <= 0) {
            // Timer complete - play sound and show notification
            if (notificationsEnabled) {
              playTimerSound(timerSound, timerVolume);
            }

            // Browser notification (always try if enabled in browser)
            if ('Notification' in window && Notification.permission === 'granted') {
              const itemCount = sterilizationItems.length;
              new Notification('Pressure Cooking Complete!', {
                body: itemCount > 0
                  ? `${currentPreset.name} sterilization complete. ${itemCount} item(s) updated.`
                  : `${currentPreset.name} sterilization is done.`,
                icon: '🍄',
              });
            }

            // Log sterilization and update items (handled via useEffect below)

            return {
              ...prev,
              isRunning: false,
              remainingSeconds: 0,
            };
          }
          
          return {
            ...prev,
            remainingSeconds: newRemaining,
          };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.isPaused, timer.remainingSeconds, notificationsEnabled, timerSound, timerVolume, currentPreset.name, sterilizationItems.length]);

  // Track previous timer state to detect completion
  const prevTimerRef = React.useRef({ wasRunning: false, remainingSeconds: 0 });

  // Effect to handle sterilization completion when timer finishes
  useEffect(() => {
    const prevWasRunning = prevTimerRef.current.wasRunning;
    const prevRemaining = prevTimerRef.current.remainingSeconds;

    // Detect timer completion: was running, now stopped, and finished at 0
    if (prevWasRunning && !timer.isRunning && prevRemaining > 0 && timer.remainingSeconds === 0) {
      // Timer just completed - update items
      handleSterilizationComplete();
    }

    // Update ref
    prevTimerRef.current = {
      wasRunning: timer.isRunning,
      remainingSeconds: timer.remainingSeconds,
    };
  }, [timer.isRunning, timer.remainingSeconds, handleSterilizationComplete]);

  // Start timer
  const startTimer = useCallback(() => {
    const totalSeconds = calculation.minutes * 60;
    setTimer({
      isRunning: true,
      isPaused: false,
      totalSeconds,
      remainingSeconds: totalSeconds,
      startTime: Date.now(),
    });
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [calculation.minutes]);

  // Pause/resume timer
  const togglePause = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimer({
      isRunning: false,
      isPaused: false,
      totalSeconds: 0,
      remainingSeconds: 0,
      startTime: null,
    });
  }, []);

  // Timer progress
  const timerProgress = timer.totalSeconds > 0 
    ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 
    : 0;

  // Category filter
  const categories = ['grain', 'substrate', 'agar', 'liquid', 'tools'] as const;
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number] | 'all'>('all');
  
  const filteredPresets = selectedCategory === 'all' 
    ? pcPresets 
    : pcPresets.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.Thermometer />
            Pressure Cooking Calculator
          </h2>
          <p className="text-zinc-400 text-sm">Calculate sterilization times with altitude adjustment</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Preset Selection */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-zinc-400 mb-3">What are you sterilizing?</label>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedPreset === preset.id
                      ? 'bg-emerald-950/30 border-emerald-700 text-white'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <p className="font-medium text-sm">{preset.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {preset.basePSI > 0 ? `${preset.basePSI} PSI • ${preset.baseMinutes} min` : 'Pasteurization'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Altitude */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <Icons.Mountain />
                  Altitude (feet)
                </label>
                <input
                  type="number"
                  value={altitude}
                  onChange={e => setAltitude(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Chicago: ~600 ft • Denver: ~5,280 ft
                </p>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2 flex items-center gap-2">
                  <Icons.Volume />
                  Quantity (jars/bags)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  More items may need longer time
                </p>
              </div>
            </div>

            {/* Custom Time Override */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useCustomTime}
                  onChange={e => setUseCustomTime(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-zinc-300">Use custom time</span>
              </label>
              
              {useCustomTime && (
                <input
                  type="number"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  placeholder="Enter minutes..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          </div>

          {/* Items Being Sterilized */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Icons.Package />
                Items Being Sterilized
              </h3>
              <div className="flex items-center gap-2">
                {sterilizationLog.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                      showHistory
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icons.History />
                    History ({sterilizationLog.length})
                  </button>
                )}
                <div className="relative" ref={itemSelectorRef}>
                  <button
                    onClick={() => setShowItemSelector(!showItemSelector)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Icons.Plus />
                    Add Item
                  </button>

                  {/* Item selector dropdown */}
                  {showItemSelector && (
                    <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden w-80">
                      {/* Prepared Spawn Section */}
                      {(needsSterilizationSpawn.length > 0 || reservedSpawn.length > 0 || availableSpawn.length > 0) && (
                        <div className="p-2 border-b border-zinc-700">
                          <p className="text-xs text-zinc-400 font-medium mb-2 flex items-center gap-1">
                            <Icons.Jar />
                            Prepared Spawn
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {needsSterilizationSpawn.map(spawn => (
                              <button
                                key={spawn.id}
                                onClick={() => addPreparedSpawnItem(spawn)}
                                disabled={sterilizationItems.some(item => item.refId === spawn.id)}
                                className="w-full px-2 py-1.5 text-left text-sm rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                              >
                                <span className="text-zinc-200 truncate">{getSpawnDisplayName(spawn)}</span>
                                <span className="text-xs text-amber-400 ml-2 shrink-0">needs sterilizing</span>
                              </button>
                            ))}
                            {reservedSpawn.map(spawn => (
                              <button
                                key={spawn.id}
                                onClick={() => addPreparedSpawnItem(spawn)}
                                disabled={sterilizationItems.some(item => item.refId === spawn.id)}
                                className="w-full px-2 py-1.5 text-left text-sm rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                              >
                                <span className="text-zinc-200 truncate">{getSpawnDisplayName(spawn)}</span>
                                <span className="text-xs text-blue-400 ml-2 shrink-0">reserved</span>
                              </button>
                            ))}
                            {availableSpawn.slice(0, 5).map(spawn => (
                              <button
                                key={spawn.id}
                                onClick={() => addPreparedSpawnItem(spawn)}
                                disabled={sterilizationItems.some(item => item.refId === spawn.id)}
                                className="w-full px-2 py-1.5 text-left text-sm rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                              >
                                <span className="text-zinc-200 truncate">{getSpawnDisplayName(spawn)}</span>
                                <span className="text-xs text-zinc-500 ml-2 shrink-0">re-sterilize</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inventory Items Section */}
                      {sterilizableInventoryItems.length > 0 && (
                        <div className="p-2 border-b border-zinc-700">
                          <p className="text-xs text-zinc-400 font-medium mb-2 flex items-center gap-1">
                            <Icons.Package />
                            Lab Inventory
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {sterilizableInventoryItems.map(item => {
                              const isAdded = sterilizationItems.some(si => si.refId === item.id && si.type === 'inventory');
                              const category = getInventoryCategory(item.categoryId);
                              const suggestedPreset = getSuggestedPreset(item.name, item.categoryId);
                              const presetName = suggestedPreset ? pcPresets.find(p => p.id === suggestedPreset)?.name : undefined;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => addInventoryItem(item)}
                                  disabled={isAdded}
                                  className="w-full px-2 py-1.5 text-left text-sm rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-zinc-200 truncate">{item.name}</span>
                                    <span className="text-xs text-zinc-500 ml-2 shrink-0">{item.quantity} {item.unit}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-xs text-zinc-500">{category?.name || 'Supplies'}</span>
                                    {presetName && (
                                      <span className="text-xs text-emerald-400">{presetName}</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Custom Item */}
                      <div className="p-3">
                        <p className="text-xs text-zinc-400 font-medium mb-2">Custom Item</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customItemName}
                            onChange={e => setCustomItemName(e.target.value)}
                            placeholder="Item name..."
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="number"
                            value={customItemQty}
                            onChange={e => setCustomItemQty(e.target.value)}
                            min="1"
                            className="w-14 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            onClick={addCustomItem}
                            disabled={!customItemName.trim()}
                            className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors"
                          >
                            <Icons.Plus />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* History View */}
            {showHistory && sterilizationLog.length > 0 && (
              <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-400 mb-2">Recent Sterilizations</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sterilizationLog.map((log, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300">
                          {log.date.toLocaleDateString()} {log.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs text-zinc-500">{log.psi}psi • {log.minutes}min</span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {log.items.map(item => `${item.name} (×${item.quantity})`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Items List */}
            {sterilizationItems.length > 0 ? (
              <div className="space-y-2">
                {sterilizationItems.map(item => {
                  const itemBgColor = item.type === 'prepared_spawn'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : item.type === 'inventory'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-zinc-700 text-zinc-400';
                  const presetLabel = item.suggestedPreset
                    ? pcPresets.find(p => p.id === item.suggestedPreset)?.name
                    : undefined;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${itemBgColor}`}>
                          {item.type === 'prepared_spawn' ? <Icons.Jar /> : <Icons.Package />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-zinc-500">
                            Qty: {item.quantity}
                            {item.type === 'prepared_spawn' && ' • Will update status when complete'}
                            {item.type === 'inventory' && presetLabel && (
                              <span className="text-emerald-400 ml-1">• {presetLabel}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Icons.X />
                      </button>
                    </div>
                  );
                })}

                {/* Summary */}
                <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {sterilizationItems.length} item{sterilizationItems.length !== 1 ? 's' : ''} •{' '}
                    {sterilizationItems.reduce((sum, i) => sum + i.quantity, 0)} total units
                  </span>
                  {sterilizationItems.some(i => i.type === 'prepared_spawn') && (
                    <span className="text-xs text-emerald-400">
                      Spawn status will update on completion
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500">
                <Icons.Package />
                <p className="mt-2 text-sm">No items selected</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Add items from lab inventory, prepared spawn, or custom items
                </p>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Recommended Settings</h3>
            
            {calculation.isPasteurization ? (
              <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Icons.AlertTriangle />
                  <span className="font-medium">Pasteurization (Not Pressure Cooked)</span>
                </div>
                <p className="text-sm text-zinc-300">
                  Use hot water bath at 160-180°F (71-82°C) for {calculation.minutes} minutes.
                  Do not use pressure cooker for straw pasteurization.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg text-center">
                  <p className="text-sm text-zinc-400 mb-1">Pressure</p>
                  <p className="text-3xl font-bold text-white">{calculation.psi} PSI</p>
                  {calculation.altitudeAdjustment.psiIncrease > 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      +{calculation.altitudeAdjustment.psiIncrease} PSI for altitude
                    </p>
                  )}
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg text-center">
                  <p className="text-sm text-zinc-400 mb-1">Time at Pressure</p>
                  <p className="text-3xl font-bold text-white">{calculation.minutes} min</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    After reaching full pressure
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg flex items-start gap-2">
              <Icons.Info />
              <p className="text-sm text-zinc-400">{currentPreset.notes}</p>
            </div>
          </div>
        </div>

        {/* Timer Sidebar */}
        <div className="space-y-6">
          {/* Timer */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Icons.Clock />
                Timer
              </h3>
              {/* Sound selector */}
              <div className="relative" ref={soundSelectorRef}>
                <button
                  onClick={() => setShowSoundSelector(!showSoundSelector)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
                    notificationsEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                  }`}
                  title="Timer sound settings"
                >
                  <Icons.Bell />
                  <span className="hidden sm:inline capitalize">{timerSound}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 transition-transform ${showSoundSelector ? 'rotate-180' : ''}`}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Sound selector dropdown */}
                {showSoundSelector && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden w-52">
                    <div className="p-2 border-b border-zinc-700">
                      <p className="text-xs text-zinc-400 font-medium">Timer Sound</p>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {timerSoundOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateSettings({ timerSound: option.value });
                            if (option.value !== 'none') {
                              previewSound(option.value, timerVolume);
                            }
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between group ${
                            timerSound === option.value
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-zinc-500">{option.description}</div>
                          </div>
                          {timerSound === option.value && (
                            <Icons.Check />
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Volume slider */}
                    <div className="p-3 border-t border-zinc-700">
                      <label className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                        <span>Volume</span>
                        <span>{Math.round(timerVolume * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={timerVolume * 100}
                        onChange={e => {
                          const vol = parseInt(e.target.value) / 100;
                          updateSettings({ timerVolume: vol });
                        }}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <button
                        onClick={() => previewSound(timerSound, timerVolume)}
                        disabled={timerSound === 'none'}
                        className="mt-2 w-full py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 rounded transition-colors"
                      >
                        Test Sound
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Display */}
            <div className="relative mb-4">
              {/* Progress Ring */}
              <svg className="w-40 h-40 mx-auto transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={timer.remainingSeconds === 0 && timer.totalSeconds > 0 ? '#10b981' : '#10b981'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - timerProgress / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-bold text-white">
                  {timer.isRunning 
                    ? formatTime(timer.remainingSeconds)
                    : formatTime(calculation.minutes * 60)
                  }
                </span>
                <span className="text-xs text-zinc-500 mt-1">
                  {timer.isRunning 
                    ? (timer.isPaused ? 'PAUSED' : 'RUNNING')
                    : 'READY'
                  }
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex gap-2">
              {!timer.isRunning ? (
                <button
                  onClick={startTimer}
                  disabled={calculation.isPasteurization}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Icons.Play />
                  Start
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {timer.isPaused ? <Icons.Play /> : <Icons.Pause />}
                    {timer.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Icons.RotateCcw />
                  </button>
                </>
              )}
            </div>

            {/* Timer Complete */}
            {timer.totalSeconds > 0 && timer.remainingSeconds === 0 && !timer.isRunning && (
              <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-center">
                <Icons.Check />
                <p className="text-emerald-400 font-medium">Complete!</p>
                <p className="text-xs text-zinc-400">Let pressure release naturally</p>
              </div>
            )}
          </div>

          {/* Altitude Reference */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Altitude Adjustments</h3>
            <div className="space-y-1 text-sm">
              {altitudeAdjustments.slice(0, 6).map(adj => (
                <div
                  key={adj.label}
                  className={`flex justify-between py-1.5 px-2 rounded ${
                    parseInt(altitude) >= adj.minFeet && parseInt(altitude) <= adj.maxFeet
                      ? 'bg-emerald-950/30 text-emerald-400'
                      : 'text-zinc-400'
                  }`}
                >
                  <span>{adj.label}</span>
                  <span>+{adj.psiIncrease} PSI</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Reminders */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Safety Checklist</h3>
            <div className="space-y-2">
              {[
                'Check gasket condition',
                'Ensure vent is clear',
                'Add correct water level',
                'Lid locked properly',
                'Start timer at full pressure',
                'Natural release for grains',
              ].map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressureCookingCalculator;
