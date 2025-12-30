// ============================================================================
// CONTAINER SETUP FLOW
// A smart, unified wizard for setting up containers from scratch.
// Handles: Container Type + Inventory Item + Stock Lot + Instances
// Supports both basic users (quick presets) and advanced users (full customization)
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import { NumericInput } from '../common/NumericInput';
import { VolumeInput } from '../common/VolumeInput';
import type { ContainerCategory, ContainerUsageContext } from '../../store/types';

interface ContainerSetupFlowProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the new container ID when setup is complete */
  onComplete?: (containerId: string) => void;
  /** Initial context - what this container will be used for */
  usageContext?: 'spawn' | 'culture' | 'grow' | 'general';
}

// Common container presets for quick selection
const CONTAINER_PRESETS = [
  // Grain Spawn / LC Jars
  {
    id: 'quart-jar',
    name: 'Quart Mason Jar',
    category: 'jar' as ContainerCategory,
    volumeMl: 946,
    icon: '🫙',
    description: 'Standard for grain spawn',
    contexts: ['spawn', 'culture'],
    isReusable: true,
    isSterilizable: true,
  },
  {
    id: 'pint-jar',
    name: 'Pint Mason Jar',
    category: 'jar' as ContainerCategory,
    volumeMl: 473,
    icon: '🫙',
    description: 'Smaller grain/LC jars',
    contexts: ['spawn', 'culture'],
    isReusable: true,
    isSterilizable: true,
  },
  {
    id: 'half-gallon-jar',
    name: 'Half Gallon Mason Jar',
    category: 'jar' as ContainerCategory,
    volumeMl: 1893,
    icon: '🫙',
    description: 'Large grain spawn jars',
    contexts: ['spawn'],
    isReusable: true,
    isSterilizable: true,
  },
  // Spawn Bags
  {
    id: '3lb-bag',
    name: '3lb Spawn Bag',
    category: 'bag' as ContainerCategory,
    volumeMl: 2800,
    icon: '📦',
    description: 'Standard unicorn bag',
    contexts: ['spawn'],
    isReusable: false,
    isSterilizable: true,
  },
  {
    id: '5lb-bag',
    name: '5lb Spawn Bag',
    category: 'bag' as ContainerCategory,
    volumeMl: 4700,
    icon: '📦',
    description: 'Large spawn bag',
    contexts: ['spawn', 'grow'],
    isReusable: false,
    isSterilizable: true,
  },
  // Culture containers
  {
    id: 'petri-100mm',
    name: '100mm Petri Dish',
    category: 'plate' as ContainerCategory,
    volumeMl: 25,
    icon: '🧫',
    description: 'Standard agar plates',
    contexts: ['culture'],
    isReusable: false,
    isSterilizable: false,
  },
  {
    id: 'syringe-10cc',
    name: '10cc Syringe',
    category: 'syringe' as ContainerCategory,
    volumeMl: 10,
    icon: '💉',
    description: 'Spore/LC syringe',
    contexts: ['culture'],
    isReusable: false,
    isSterilizable: false,
  },
  // Fruiting containers
  {
    id: 'shoebox-6qt',
    name: '6qt Shoebox',
    category: 'tub' as ContainerCategory,
    volumeMl: 5700,
    icon: '📦',
    description: 'Small fruiting tub',
    contexts: ['grow'],
    isReusable: true,
    isSterilizable: false,
  },
  {
    id: 'monotub-66qt',
    name: '66qt Monotub',
    category: 'tub' as ContainerCategory,
    volumeMl: 62000,
    icon: '📦',
    description: 'Standard monotub',
    contexts: ['grow'],
    isReusable: true,
    isSterilizable: false,
  },
];

const CONTAINER_CATEGORIES = [
  { value: 'jar', label: 'Jar', icon: '🫙' },
  { value: 'bag', label: 'Bag', icon: '📦' },
  { value: 'plate', label: 'Plate', icon: '🧫' },
  { value: 'tube', label: 'Tube', icon: '🧪' },
  { value: 'bottle', label: 'Bottle', icon: '🍶' },
  { value: 'syringe', label: 'Syringe', icon: '💉' },
  { value: 'tub', label: 'Tub', icon: '📦' },
  { value: 'bucket', label: 'Bucket', icon: '🪣' },
  { value: 'other', label: 'Other', icon: '📍' },
];

// Container inventory category ID from seed data
const CONTAINERS_CATEGORY_ID = '00000000-0000-0000-0005-000000000004';

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="20 6 9 17 4 12"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>,
};

type Step = 'select' | 'inventory' | 'summary';

export const ContainerSetupFlow: React.FC<ContainerSetupFlowProps> = ({
  isOpen,
  onClose,
  onComplete,
  usageContext = 'general',
}) => {
  const {
    state,
    activeContainers,
    activeSuppliers,
    addContainer,
    addInventoryItem,
    addInventoryLot,
    addLabItemInstance,
    generateId,
  } = useData();

  // Current step
  const [step, setStep] = useState<Step>('select');

  // Container Type Data
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [containerName, setContainerName] = useState('');
  const [containerCategory, setContainerCategory] = useState<ContainerCategory>('jar');
  const [containerVolume, setContainerVolume] = useState<number | undefined>(undefined);
  const [isReusable, setIsReusable] = useState(true);
  const [isSterilizable, setIsSterilizable] = useState(true);
  const [containerNotes, setContainerNotes] = useState('');

  // Inventory Tracking Data
  const [trackInventory, setTrackInventory] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [totalCost, setTotalCost] = useState<number | undefined>(undefined);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter presets based on usage context
  const filteredPresets = useMemo(() => {
    if (usageContext === 'general') return CONTAINER_PRESETS;
    return CONTAINER_PRESETS.filter(p =>
      p.contexts.includes(usageContext) || p.contexts.includes('general')
    );
  }, [usageContext]);

  // Get container data based on selection
  const getContainerData = useCallback(() => {
    if (selectedPreset && !isCustom) {
      const preset = CONTAINER_PRESETS.find(p => p.id === selectedPreset);
      if (preset) {
        return {
          name: preset.name,
          category: preset.category,
          volumeMl: preset.volumeMl,
          isReusable: preset.isReusable,
          isSterilizable: preset.isSterilizable,
        };
      }
    }
    return {
      name: containerName,
      category: containerCategory,
      volumeMl: containerVolume,
      isReusable,
      isSterilizable,
    };
  }, [selectedPreset, isCustom, containerName, containerCategory, containerVolume, isReusable, isSterilizable]);

  // Calculate unit cost
  const unitCost = useMemo(() => {
    if (!totalCost || !quantity || quantity <= 0) return 0;
    return totalCost / quantity;
  }, [totalCost, quantity]);

  // Check if container type already exists
  const existingContainer = useMemo(() => {
    const data = getContainerData();
    return activeContainers.find(c =>
      c.name.toLowerCase() === data.name.toLowerCase()
    );
  }, [activeContainers, getContainerData]);

  // Validate current step
  const canProceed = useMemo(() => {
    if (step === 'select') {
      const data = getContainerData();
      return data.name && data.name.trim().length > 0;
    }
    if (step === 'inventory') {
      if (!trackInventory) return true;
      return quantity > 0;
    }
    return true;
  }, [step, getContainerData, trackInventory, quantity]);

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setIsCustom(false);
    const preset = CONTAINER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setContainerName(preset.name);
      setContainerCategory(preset.category);
      setContainerVolume(preset.volumeMl);
      setIsReusable(preset.isReusable);
      setIsSterilizable(preset.isSterilizable);
    }
  };

  // Handle custom mode
  const handleCustomMode = () => {
    setSelectedPreset(null);
    setIsCustom(true);
    setContainerName('');
    setContainerCategory('jar');
    setContainerVolume(undefined);
    setIsReusable(true);
    setIsSterilizable(true);
  };

  // Handle next step
  const handleNext = () => {
    if (step === 'select') {
      setStep('inventory');
    } else if (step === 'inventory') {
      setStep('summary');
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (step === 'inventory') {
      setStep('select');
    } else if (step === 'summary') {
      setStep('inventory');
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data = getContainerData();
      let containerId: string;

      // Step 1: Create or use existing container type
      if (existingContainer) {
        containerId = existingContainer.id;
      } else {
        const usageContexts: ContainerUsageContext[] =
          usageContext === 'spawn' || usageContext === 'culture'
            ? ['culture']
            : usageContext === 'grow'
            ? ['grow']
            : ['culture', 'grow'];

        const newContainer = await addContainer({
          name: data.name,
          category: data.category,
          volumeMl: data.volumeMl,
          isReusable: data.isReusable,
          isSterilizable: data.isSterilizable,
          usageContext: usageContexts,
          notes: containerNotes || undefined,
          isActive: true,
        });
        containerId = newContainer.id;
      }

      // Step 2: Create inventory item and lot if tracking
      if (trackInventory && quantity > 0) {
        // Create inventory item
        const inventoryItem = await addInventoryItem({
          name: data.name,
          categoryId: CONTAINERS_CATEGORY_ID,
          quantity: quantity,
          unit: 'units',
          unitCost: unitCost > 0 ? unitCost : 0,
          reorderPoint: Math.max(1, Math.floor(quantity / 4)), // Suggest reorder at 25%
          reorderQty: quantity, // Default reorder quantity to original purchase amount
          supplierId: supplierId || undefined,
          itemBehavior: 'container',
          itemProperties: {
            isReusable: data.isReusable,
            isSterilizable: data.isSterilizable,
            trackInstances: true,
            unitType: 'countable',
            defaultUnit: 'each',
          },
          notes: data.volumeMl ? `${data.volumeMl}ml capacity. Container ID: ${containerId}` : `Container ID: ${containerId}`,
          isActive: true,
        });

        // Create inventory lot
        const lot = await addInventoryLot({
          inventoryItemId: inventoryItem.id,
          quantity: quantity,
          originalQuantity: quantity,
          inUseQuantity: 0,
          unit: 'units',
          status: 'available',
          purchaseCost: totalCost || undefined,
          unitCost: unitCost > 0 ? unitCost : undefined,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          supplierId: supplierId || undefined,
          isActive: true,
        });

        // Create individual instances for tracking
        // NOTE: We create instances directly here instead of using createInstancesFromLot
        // because React state won't have the lot yet (async state update timing issue)
        if (quantity <= 100) {
          const calculatedUnitCost = unitCost > 0 ? unitCost : 0;
          const acqDate = purchaseDate ? new Date(purchaseDate) : new Date();
          for (let i = 0; i < quantity; i++) {
            await addLabItemInstance({
              inventoryItemId: inventoryItem.id,
              inventoryLotId: lot.id,
              instanceNumber: i + 1,
              label: `${data.name} #${i + 1}`,
              status: 'available',
              unitCost: calculatedUnitCost,
              acquisitionDate: acqDate,
              usageCount: 0,
              isActive: true,
            });
          }
        }
      }

      // Complete - call callback with container ID
      onComplete?.(containerId);
      onClose();
    } catch (err) {
      console.error('Container setup failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up container');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setStep('select');
    setSelectedPreset(null);
    setIsCustom(false);
    setContainerName('');
    setContainerCategory('jar');
    setContainerVolume(undefined);
    setIsReusable(true);
    setIsSterilizable(true);
    setContainerNotes('');
    setTrackInventory(true);
    setQuantity(1);
    setTotalCost(undefined);
    setSupplierId('');
    setShowAdvanced(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const containerData = getContainerData();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Icons.Package />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Container Setup</h2>
              <p className="text-sm text-zinc-400">
                {step === 'select' && 'Choose or create a container type'}
                {step === 'inventory' && 'Track your container stock'}
                {step === 'summary' && 'Review and confirm'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-4 bg-zinc-950/50 border-b border-zinc-800">
          {[
            { key: 'select', label: 'Container' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'summary', label: 'Confirm' },
          ].map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <div className="w-8 h-0.5 bg-zinc-700" />}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  step === s.key
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : s.key === 'select' || (s.key === 'inventory' && step === 'summary')
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                <span>{i + 1}</span>
                <span>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="p-4">
          {/* STEP 1: Select Container */}
          {step === 'select' && (
            <div className="space-y-6">
              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Quick Select (Common Containers)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredPresets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedPreset === preset.id && !isCustom
                          ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{preset.icon}</span>
                        <span className="font-medium text-sm">{preset.name}</span>
                      </div>
                      <p className="text-xs opacity-70">{preset.description}</p>
                      {preset.volumeMl && (
                        <p className="text-xs text-zinc-500 mt-1">{preset.volumeMl}ml</p>
                      )}
                    </button>
                  ))}
                  {/* Custom Option */}
                  <button
                    type="button"
                    onClick={handleCustomMode}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isCustom
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                        : 'bg-zinc-800/50 border-zinc-700 border-dashed text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icons.Plus />
                      <span className="font-medium text-sm">Custom</span>
                    </div>
                    <p className="text-xs opacity-70">Create your own</p>
                  </button>
                </div>
              </div>

              {/* Custom Container Form */}
              {isCustom && (
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Container Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={containerName}
                        onChange={e => setContainerName(e.target.value)}
                        placeholder="e.g., 1 Liter Mason Jar"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Category</label>
                      <select
                        value={containerCategory}
                        onChange={e => setContainerCategory(e.target.value as ContainerCategory)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                      >
                        {CONTAINER_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <VolumeInput
                      label="Volume"
                      value={containerVolume}
                      onChange={setContainerVolume}
                      placeholder="e.g., 946, 1L, 1qt"
                      showConversionHint
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isReusable}
                        onChange={e => setIsReusable(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500"
                      />
                      <span className="text-sm text-zinc-300">Reusable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSterilizable}
                        onChange={e => setIsSterilizable(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500"
                      />
                      <span className="text-sm text-zinc-300">Sterilizable</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Existing Container Warning */}
              {existingContainer && containerData.name && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                  <p className="text-sm text-amber-300">
                    ⚠️ A container type named "{existingContainer.name}" already exists.
                    We'll use the existing type and add to your inventory.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Inventory Tracking */}
          {step === 'inventory' && (
            <div className="space-y-6">
              {/* Track Inventory Toggle */}
              <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-medium text-zinc-200">Track Inventory</span>
                    <p className="text-sm text-zinc-500 mt-1">
                      Track how many you have, cost per unit, and individual container usage
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={trackInventory}
                    onChange={e => setTrackInventory(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500"
                  />
                </label>
              </div>

              {trackInventory && (
                <>
                  {/* Quantity & Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        How many do you have?
                      </label>
                      <NumericInput
                        value={quantity}
                        onChange={val => setQuantity(val ?? 1)}
                        min={1}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">
                        Total Cost (optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                        <NumericInput
                          value={totalCost}
                          onChange={setTotalCost}
                          step={0.01}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unit Cost Display */}
                  {totalCost && quantity > 0 && (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-center">
                      <p className="text-sm text-zinc-400">Cost per container:</p>
                      <p className="text-2xl font-bold text-emerald-400">${unitCost.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Advanced Options */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300"
                    >
                      <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                        <Icons.ChevronDown />
                      </span>
                      Advanced Options
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Supplier</label>
                            <select
                              value={supplierId}
                              onChange={e => setSupplierId(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Select supplier...</option>
                              {activeSuppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Purchase Date</label>
                            <input
                              type="date"
                              value={purchaseDate}
                              onChange={e => setPurchaseDate(e.target.value)}
                              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 [color-scheme:dark] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!trackInventory && (
                <div className="p-4 bg-zinc-800/30 border border-zinc-700 border-dashed rounded-lg text-center">
                  <p className="text-zinc-500">
                    You can always add inventory tracking later from the Stock & Orders page.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 'summary' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg">
                <h3 className="font-medium text-zinc-200 mb-4">Setup Summary</h3>

                <div className="space-y-3">
                  {/* Container Type */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded text-blue-400">
                      <Icons.Package />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-400">Container Type</p>
                      <p className="font-medium text-zinc-200">
                        {containerData.name}
                        {containerData.volumeMl && ` (${containerData.volumeMl}ml)`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {containerData.isReusable ? 'Reusable' : 'Single-use'}
                        {containerData.isSterilizable && ' • Sterilizable'}
                      </p>
                      {existingContainer && (
                        <p className="text-xs text-amber-400 mt-1">
                          Using existing container type
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inventory */}
                  {trackInventory && (
                    <div className="flex items-start gap-3 pt-3 border-t border-zinc-700">
                      <div className="p-2 bg-emerald-500/10 rounded text-emerald-400">
                        <Icons.Package />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-400">Inventory</p>
                        <p className="font-medium text-zinc-200">
                          {quantity} container{quantity !== 1 ? 's' : ''}
                        </p>
                        {totalCost && (
                          <p className="text-sm text-zinc-400">
                            ${totalCost.toFixed(2)} total • ${unitCost.toFixed(2)} each
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">
                          {quantity <= 100
                            ? `${quantity} trackable instance${quantity !== 1 ? 's' : ''} will be created`
                            : 'Quantity tracking only (too many for individual instances)'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* What happens next */}
              <div className="p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                <h4 className="font-medium text-blue-300 mb-2">What happens next?</h4>
                <ul className="text-sm text-zinc-400 space-y-1">
                  <li>• Container type will be available for spawn preparation</li>
                  {trackInventory && (
                    <>
                      <li>• Stock will be tracked in your inventory</li>
                      <li>• Each container can be tracked individually</li>
                      <li>• Usage will automatically decrement inventory</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={step === 'select' ? handleClose : handleBack}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <Icons.ArrowLeft />
            {step === 'select' ? 'Cancel' : 'Back'}
          </button>

          {step !== 'summary' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Next
              <Icons.ArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Setting up...
                </>
              ) : (
                <>
                  <Icons.Check />
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerSetupFlow;
