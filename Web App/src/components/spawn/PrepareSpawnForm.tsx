// ============================================================================
// PREPARE SPAWN FORM
// Form for preparing grain spawn - select ingredients, containers, create PreparedSpawn
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import { StandardDropdown } from '../common/StandardDropdown';
import { ContainerSetupFlow } from './ContainerSetupFlow';
import type { PreparedSpawn, IngredientUsage, InventoryLot } from '../../store/types';

interface PrepareSpawnFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (preparedSpawn: PreparedSpawn) => void;
}

// Container category ID from seed data
const CONTAINERS_CATEGORY_ID = '00000000-0000-0000-0005-000000000004';

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Grain: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6"/><path d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/></svg>,
};

interface SelectedIngredient {
  inventoryItemId: string;
  inventoryLotId?: string;
  quantity: number;
  unit: string;
}

export const PrepareSpawnForm: React.FC<PrepareSpawnFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    state,
    activeContainers,
    activeGrainTypes,
    activeLocations,
    activeInventoryItems,
    activeInventoryLots,
    activeLabItemInstances,
    getInventoryItem,
    getInventoryCategory,
    getContainer,
    addPreparedSpawn,
    adjustLotQuantity,
    markInstanceInUse,
    generateId,
  } = useData();

  // Form state
  const [spawnType, setSpawnType] = useState<PreparedSpawn['type']>('grain_jar');
  const [label, setLabel] = useState('');
  const [containerId, setContainerId] = useState('');
  const [containerCount, setContainerCount] = useState(1);
  const [containerInventoryLotId, setContainerInventoryLotId] = useState<string>(''); // Track which inventory lot to decrement
  const [grainTypeId, setGrainTypeId] = useState('');
  const [weightGrams, setWeightGrams] = useState<string>('');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [laborCost, setLaborCost] = useState<string>('');

  // Selected ingredients
  const [ingredients, setIngredients] = useState<SelectedIngredient[]>([]);
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Container setup flow
  const [showContainerSetup, setShowContainerSetup] = useState(false);

  // Instance tracking for containers
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);

  // Get available instances for the selected container lot
  const availableInstancesForLot = useMemo(() => {
    if (!containerInventoryLotId) return [];
    return activeLabItemInstances.filter(
      inst => inst.inventoryLotId === containerInventoryLotId && inst.status === 'available'
    );
  }, [containerInventoryLotId, activeLabItemInstances]);

  // Check if this lot tracks instances (has any instances at all)
  const lotHasInstances = useMemo(() => {
    if (!containerInventoryLotId) return false;
    return activeLabItemInstances.some(inst => inst.inventoryLotId === containerInventoryLotId);
  }, [containerInventoryLotId, activeLabItemInstances]);

  // Auto-select instances when lot changes or count changes
  useEffect(() => {
    if (lotHasInstances && availableInstancesForLot.length > 0) {
      // Auto-select first N available instances based on containerCount
      const autoSelected = availableInstancesForLot
        .slice(0, containerCount)
        .map(inst => inst.id);
      setSelectedInstanceIds(autoSelected);
    } else {
      setSelectedInstanceIds([]);
    }
  }, [containerInventoryLotId, containerCount, lotHasInstances, availableInstancesForLot]);

  // Filter inventory items by category for grain preparation
  const grainItems = useMemo(() => {
    return activeInventoryItems.filter(item => {
      const category = item.categoryId ? getInventoryCategory(item.categoryId) : null;
      return category?.name?.toLowerCase().includes('grain');
    });
  }, [activeInventoryItems, getInventoryCategory]);

  // All available items for ingredient selection
  const ingredientItems = useMemo(() => {
    return activeInventoryItems.filter(item => {
      // Include grains, substrates, chemicals, media ingredients
      const category = item.categoryId ? getInventoryCategory(item.categoryId) : null;
      const catName = category?.name?.toLowerCase() || '';
      return catName.includes('grain') ||
             catName.includes('substrate') ||
             catName.includes('chemical') ||
             catName.includes('media') ||
             catName.includes('supplement');
    });
  }, [activeInventoryItems, getInventoryCategory]);

  // Container inventory items (items in the Containers category)
  const containerInventoryItems = useMemo(() => {
    return activeInventoryItems.filter(item => item.categoryId === CONTAINERS_CATEGORY_ID);
  }, [activeInventoryItems]);

  // Find inventory items matching the selected container type
  const matchingContainerInventory = useMemo(() => {
    if (!containerId) return [];
    const container = getContainer(containerId);
    if (!container) return [];

    // Find inventory items that match by name or volume
    return containerInventoryItems.filter(item => {
      const itemName = item.name.toLowerCase();
      const containerName = container.name.toLowerCase();
      // Match by name similarity or if item name contains container name parts
      return itemName.includes(containerName) ||
             containerName.includes(itemName) ||
             (container.volumeMl && itemName.includes(`${container.volumeMl}ml`));
    });
  }, [containerId, containerInventoryItems, getContainer]);

  // Get available lots for container inventory items
  const containerInventoryLots = useMemo(() => {
    const lots: (InventoryLot & { itemName: string })[] = [];
    matchingContainerInventory.forEach(item => {
      activeInventoryLots
        .filter(lot =>
          lot.inventoryItemId === item.id &&
          lot.quantity > 0 &&
          (lot.status === 'available' || lot.status === 'low')
        )
        .forEach(lot => {
          lots.push({ ...lot, itemName: item.name });
        });
    });
    return lots;
  }, [matchingContainerInventory, activeInventoryLots]);

  // Calculate per-unit container cost from selected lot
  const containerUnitCost = useMemo(() => {
    if (!containerInventoryLotId) return 0;
    const lot = activeInventoryLots.find(l => l.id === containerInventoryLotId);
    if (!lot || !lot.purchaseCost || !lot.originalQuantity) return 0;
    return lot.purchaseCost / lot.originalQuantity;
  }, [containerInventoryLotId, activeInventoryLots]);

  // Total container cost for the batch
  const totalContainerCost = containerUnitCost * containerCount;

  // Get available quantity from selected container lot
  const availableContainerQuantity = useMemo(() => {
    if (!containerInventoryLotId) return null;
    const lot = activeInventoryLots.find(l => l.id === containerInventoryLotId);
    return lot?.quantity ?? null;
  }, [containerInventoryLotId, activeInventoryLots]);

  // Reset container inventory lot when container type changes
  useEffect(() => {
    setContainerInventoryLotId('');
  }, [containerId]);

  // Get available lots for a specific item
  const getLotsForItem = (itemId: string) => {
    return activeInventoryLots.filter(lot =>
      lot.inventoryItemId === itemId &&
      lot.quantity > 0 &&
      lot.status === 'available'
    );
  };

  // Calculate total ingredient cost
  const totalIngredientCost = useMemo(() => {
    return ingredients.reduce((sum, ing) => {
      const lot = ing.inventoryLotId
        ? activeInventoryLots.find(l => l.id === ing.inventoryLotId)
        : null;
      if (lot && lot.purchaseCost && lot.quantity) {
        const unitCost = lot.purchaseCost / lot.quantity;
        return sum + (unitCost * ing.quantity);
      }
      return sum;
    }, 0);
  }, [ingredients, activeInventoryLots]);

  // Add ingredient
  const addIngredient = (itemId: string) => {
    const item = getInventoryItem(itemId);
    if (!item) return;

    const lots = getLotsForItem(itemId);
    const defaultLot = lots[0];

    setIngredients(prev => [...prev, {
      inventoryItemId: itemId,
      inventoryLotId: defaultLot?.id,
      quantity: 0,
      unit: item.unit || 'g',
    }]);
    setShowIngredientPicker(false);
  };

  // Remove ingredient
  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Update ingredient
  const updateIngredient = (index: number, updates: Partial<SelectedIngredient>) => {
    setIngredients(prev => prev.map((ing, i) =>
      i === index ? { ...ing, ...updates } : ing
    ));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!containerId) {
      setError('Please select a container type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build ingredients used array
      const ingredientsUsed: IngredientUsage[] = ingredients
        .filter(ing => ing.quantity > 0)
        .map(ing => {
          const lot = ing.inventoryLotId
            ? activeInventoryLots.find(l => l.id === ing.inventoryLotId)
            : null;
          const unitCost = lot && lot.purchaseCost && lot.quantity
            ? lot.purchaseCost / lot.quantity
            : undefined;

          return {
            id: generateId('ingredient'),
            inventoryItemId: ing.inventoryItemId,
            inventoryLotId: ing.inventoryLotId,
            quantity: ing.quantity,
            unit: ing.unit,
            unitCost,
            totalCost: unitCost ? unitCost * ing.quantity : undefined,
          };
        });

      // Calculate production cost (ingredients + containers + labor)
      const ingredientCost = ingredientsUsed.reduce((sum, ing) => sum + (ing.totalCost || 0), 0);
      const labor = parseFloat(laborCost) || 0;
      const productionCost = ingredientCost + totalContainerCost + labor;

      // Decrement container inventory if a lot was selected
      if (containerInventoryLotId && containerCount > 0) {
        // If we have tracked instances, mark them as in_use
        if (selectedInstanceIds.length > 0) {
          for (const instanceId of selectedInstanceIds) {
            await markInstanceInUse(instanceId, {
              entityType: 'prepared_spawn',
              entityId: '', // Will be set after spawn creation
              entityLabel: label || spawnType,
              usedAt: new Date(),
            });
          }
        } else {
          // No instances tracked, just decrement lot quantity
          await adjustLotQuantity(
            containerInventoryLotId,
            -containerCount, // Negative to decrement
            'spawn_preparation',
            undefined, // Will be filled with spawn ID after creation
            `Prepared spawn: ${label || spawnType}`
          );
        }
      }

      // Decrement ingredient lots
      for (const ing of ingredientsUsed) {
        if (ing.inventoryLotId && ing.quantity > 0) {
          await adjustLotQuantity(
            ing.inventoryLotId,
            -ing.quantity,
            'spawn_preparation',
            undefined,
            `Prepared spawn: ${label || spawnType}`
          );
        }
      }

      const newSpawn = await addPreparedSpawn({
        type: spawnType,
        label: label || undefined,
        containerId,
        containerCount,
        grainTypeId: grainTypeId || undefined,
        weightGrams: weightGrams ? parseFloat(weightGrams) : undefined,
        locationId: locationId || '',
        status: 'preparing',
        prepDate: new Date(),
        ingredientsUsed,
        laborCost: labor || undefined,
        productionCost: productionCost || undefined,
        notes: notes || undefined,
        isActive: true,
      });

      onSuccess?.(newSpawn);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prepared spawn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Icons.Grain />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Prepare Spawn</h2>
              <p className="text-sm text-zinc-400">Select ingredients and containers for preparation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Workflow Info */}
        <div className="p-4 bg-amber-950/30 border-b border-zinc-800">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm text-amber-300 font-medium">Preparation Phase</p>
              <p className="text-xs text-zinc-400 mt-1">
                After preparation, you'll sterilize these containers. Once sterilized and cooled,
                they'll be ready for inoculation.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Spawn Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Spawn Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'grain_jar', label: 'Grain Jar', icon: '🫙' },
                { value: 'spawn_bag', label: 'Spawn Bag', icon: '📦' },
                { value: 'lc_jar', label: 'LC Jar', icon: '💧' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpawnType(opt.value as PreparedSpawn['type'])}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    spawnType === opt.value
                      ? 'bg-amber-950/50 border-amber-700 text-amber-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <p className="text-sm mt-1">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Container & Count */}
          {activeContainers.length === 0 ? (
            /* Empty State - No containers configured */
            <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div className="flex-1">
                  <p className="font-medium text-amber-300">No Container Types Configured</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Before you can prepare spawn, you need to set up at least one container type
                    (like mason jars, spawn bags, etc.)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowContainerSetup(true)}
                    className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icons.Plus />
                    Set Up Your First Container
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Container Type <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowContainerSetup(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Icons.Plus />
                    Set Up New
                  </button>
                </div>
                <StandardDropdown
                  value={containerId}
                  onChange={setContainerId}
                  options={activeContainers.map(c => ({
                    id: c.id,
                    name: `${c.name}${c.volumeMl ? ` (${c.volumeMl}ml)` : ''}`,
                  }))}
                  placeholder="Select container..."
                  required
                  entityType="container"
                  fieldName="containerId"
                  addLabel="Add New Container Type"
                  helpText="Don't see your container? Click + to add a custom container type."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Number of Containers
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableContainerQuantity ?? undefined}
                  value={containerCount}
                  onChange={(e) => setContainerCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Container Inventory Selection - shows matching inventory lots */}
          {containerId && containerInventoryLots.length > 0 && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                📦 Use from Inventory
              </label>
              <select
                value={containerInventoryLotId}
                onChange={(e) => setContainerInventoryLotId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100"
              >
                <option value="">Don't track inventory...</option>
                {containerInventoryLots.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.itemName} - {lot.quantity} available
                    {lot.purchaseCost && lot.originalQuantity
                      ? ` ($${(lot.purchaseCost / lot.originalQuantity).toFixed(2)} each)`
                      : ''}
                  </option>
                ))}
              </select>
              {containerInventoryLotId && availableContainerQuantity !== null && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    Available: <span className="text-emerald-400 font-medium">{availableContainerQuantity}</span>
                    {containerCount > availableContainerQuantity && (
                      <span className="text-red-400 ml-2">⚠️ Not enough!</span>
                    )}
                  </span>
                  {containerUnitCost > 0 && (
                    <span className="text-zinc-400">
                      Cost: <span className="text-emerald-400">${totalContainerCost.toFixed(2)}</span>
                      <span className="text-zinc-500 text-xs ml-1">
                        (${containerUnitCost.toFixed(2)} × {containerCount})
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Instance Tracking Info */}
              {lotHasInstances && containerInventoryLotId && (
                <div className="mt-3 p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                  <p className="text-sm text-blue-400 font-medium mb-2">
                    📦 Container Instance Tracking
                  </p>
                  {availableInstancesForLot.length === 0 ? (
                    <p className="text-sm text-amber-400">
                      ⚠️ No available instances. All containers from this lot are in use.
                    </p>
                  ) : availableInstancesForLot.length < containerCount ? (
                    <p className="text-sm text-amber-400">
                      ⚠️ Only {availableInstancesForLot.length} instances available (need {containerCount})
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedInstanceIds.map((id, idx) => {
                        const inst = availableInstancesForLot.find(i => i.id === id);
                        return inst && (
                          <span key={id} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">
                            #{inst.instanceNumber}
                            {inst.label && ` (${inst.label})`}
                          </span>
                        );
                      })}
                      <span className="text-xs text-zinc-400 self-center ml-1">
                        {selectedInstanceIds.length} container{selectedInstanceIds.length !== 1 ? 's' : ''} will be marked as in-use
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* No matching inventory info */}
          {containerId && containerInventoryLots.length === 0 && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 border-dashed rounded-lg text-sm text-zinc-500">
              <p>💡 No matching containers in inventory. Add containers to your inventory to track usage automatically.</p>
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Rye Batch #3"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
            />
          </div>

          {/* Grain Type & Weight (for grain spawn) */}
          {(spawnType === 'grain_jar' || spawnType === 'spawn_bag') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <StandardDropdown
                  label="Grain Type"
                  value={grainTypeId}
                  onChange={setGrainTypeId}
                  options={activeGrainTypes}
                  placeholder="Select grain..."
                  entityType="grainType"
                  fieldName="grainTypeId"
                  addLabel="Add New Grain Type"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Weight per Container (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  placeholder="e.g., 400"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
                />
              </div>
            </div>
          )}

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                Ingredients Used
              </label>
              <button
                type="button"
                onClick={() => setShowIngredientPicker(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
              >
                <Icons.Plus />
                Add Ingredient
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 border-dashed rounded-lg text-center">
                <p className="text-zinc-500 text-sm">No ingredients added yet</p>
                <p className="text-zinc-600 text-xs mt-1">Track ingredients for cost calculation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ing, idx) => {
                  const item = getInventoryItem(ing.inventoryItemId);
                  const lots = getLotsForItem(ing.inventoryItemId);
                  const selectedLot = ing.inventoryLotId
                    ? lots.find(l => l.id === ing.inventoryLotId)
                    : null;

                  return (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {item?.name || 'Unknown Item'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            step="0.1"
                            value={ing.quantity || ''}
                            onChange={(e) => updateIngredient(idx, { quantity: parseFloat(e.target.value) || 0 })}
                            placeholder="Qty"
                            className="w-20 px-2 py-1 text-sm bg-zinc-700 border border-zinc-600 rounded text-zinc-100"
                          />
                          <span className="text-xs text-zinc-400">{ing.unit}</span>
                          {lots.length > 1 && (
                            <select
                              value={ing.inventoryLotId || ''}
                              onChange={(e) => updateIngredient(idx, { inventoryLotId: e.target.value })}
                              className="text-xs px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-zinc-100"
                            >
                              {lots.map(lot => (
                                <option key={lot.id} value={lot.id}>
                                  {lot.lotNumber || `Lot (${lot.quantity}${ing.unit})`}
                                </option>
                              ))}
                            </select>
                          )}
                          {selectedLot?.purchaseCost && ing.quantity > 0 && (
                            <span className="text-xs text-emerald-400">
                              ${((selectedLot.purchaseCost / selectedLot.quantity) * ing.quantity).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredient(idx)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition-colors"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ingredient Picker Modal */}
            {showIngredientPicker && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full max-h-[60vh] overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-zinc-700">
                    <h4 className="font-medium text-zinc-200">Select Ingredient</h4>
                    <button onClick={() => setShowIngredientPicker(false)} className="text-zinc-400 hover:text-white">
                      <Icons.X />
                    </button>
                  </div>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    {ingredientItems.length === 0 ? (
                      <p className="text-center text-zinc-500 py-4">No ingredient items found</p>
                    ) : (
                      ingredientItems.map(item => {
                        const category = item.categoryId ? getInventoryCategory(item.categoryId) : null;
                        const alreadyAdded = ingredients.some(i => i.inventoryItemId === item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => addIngredient(item.id)}
                            className={`w-full text-left p-2 rounded hover:bg-zinc-800 transition-colors ${
                              alreadyAdded ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <p className="text-sm text-zinc-200">{item.name}</p>
                            <p className="text-xs text-zinc-500">{category?.name || 'Uncategorized'}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <StandardDropdown
              label="Storage Location"
              value={locationId}
              onChange={setLocationId}
              options={activeLocations}
              placeholder="Select location..."
              entityType="location"
              fieldName="locationId"
              addLabel="Add New Location"
            />
          </div>

          {/* Labor Cost */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Labor Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Cost Summary */}
          {(totalIngredientCost > 0 || totalContainerCost > 0 || parseFloat(laborCost) > 0) && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Cost Summary</h4>
              <div className="space-y-1 text-sm">
                {totalContainerCost > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Containers ({containerCount}×):</span>
                    <span>${totalContainerCost.toFixed(2)}</span>
                  </div>
                )}
                {totalIngredientCost > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Ingredients:</span>
                    <span>${totalIngredientCost.toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(laborCost) > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Labor:</span>
                    <span>${parseFloat(laborCost).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-200 font-medium pt-1 border-t border-zinc-700">
                  <span>Total:</span>
                  <span>${(totalContainerCost + totalIngredientCost + (parseFloat(laborCost) || 0)).toFixed(2)}</span>
                </div>
                {containerCount > 1 && (
                  <div className="flex justify-between text-zinc-500 text-xs">
                    <span>Per container:</span>
                    <span>${((totalContainerCost + totalIngredientCost + (parseFloat(laborCost) || 0)) / containerCount).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !containerId}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⌛</span>
                  Creating...
                </>
              ) : (
                <>
                  <Icons.Package />
                  Start Preparation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Container Setup Flow Modal */}
      <ContainerSetupFlow
        isOpen={showContainerSetup}
        onClose={() => setShowContainerSetup(false)}
        onComplete={(newContainerId) => {
          setContainerId(newContainerId);
          setShowContainerSetup(false);
        }}
        usageContext="spawn"
      />
    </div>
  );
};
