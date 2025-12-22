// ============================================================================
// CANONICAL RECIPE FORM - Complete recipe creation/editing with ingredients
// This is the single source of truth for recipe entry throughout the app
// Features: Ingredients from inventory, cost tracking, instructions, tips
// ============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../../store';
import { NumericInput } from '../common/NumericInput';
import type { RecipeCategory, RecipeIngredient } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface RecipeFormData {
  name: string;
  category: RecipeCategory;
  description?: string;
  yield?: { amount: number; unit: string };
  prepTime?: number;
  sterilizationTime?: number;
  sterilizationPsi?: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tips?: string[];
  sourceUrl?: string;
  notes?: string;
  isActive: boolean;
}

interface RecipeFormProps {
  data: RecipeFormData;
  onChange: (data: Partial<RecipeFormData>) => void;
  errors?: Record<string, string>;
  recipeCategories?: Array<{ id: string; name: string; code: string }>;
  compact?: boolean;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Dollar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

// ============================================================================
// CONSTANTS
// ============================================================================

const defaultCategories = [
  { value: 'agar', label: 'Agar', icon: '🧫', description: 'Agar plate media recipes' },
  { value: 'liquid_culture', label: 'Liquid Culture', icon: '💧', description: 'LC media recipes' },
  { value: 'grain_spawn', label: 'Grain Spawn', icon: '🌾', description: 'Grain preparation recipes' },
  { value: 'bulk_substrate', label: 'Bulk Substrate', icon: '🪵', description: 'Fruiting substrates' },
  { value: 'casing', label: 'Casing', icon: '🧱', description: 'Casing layer recipes' },
  { value: 'other', label: 'Other', icon: '📦', description: 'Other recipe types' },
];

const yieldUnits = ['ml', 'L', 'g', 'kg', 'jars', 'plates', 'bags', 'qt', 'gal'];

const ingredientUnits = ['g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'each', 'pinch'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RecipeForm: React.FC<RecipeFormProps> = ({
  data,
  onChange,
  errors = {},
  recipeCategories = [],
  compact = false,
}) => {
  const { state, activeInventoryItems, getInventoryItem, getInventoryCategory, generateId } = useData();

  // UI State
  const [showIngredients, setShowIngredients] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTips, setShowTips] = useState((data.tips?.length || 0) > 0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // New ingredient state
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    name: '',
    quantity: 0,
    unit: 'g',
  });

  // Combine default categories with custom ones
  const allCategories = useMemo(() => [
    ...defaultCategories,
    ...recipeCategories
      .filter(cat => !defaultCategories.some(d => d.value === cat.code))
      .map(cat => ({
        value: cat.code,
        label: cat.name,
        icon: '📋',
        description: 'Custom category',
      })),
  ], [recipeCategories]);

  // Filter inventory items that can be recipe ingredients
  const ingredientInventoryItems = useMemo(() => {
    const ingredientCategoryKeywords = ['chemical', 'supplement', 'grain', 'substrate', 'additive', 'nutrient'];
    return activeInventoryItems.filter(item => {
      // Check if category matches typical ingredient categories
      const category = item.categoryId ? getInventoryCategory(item.categoryId) : null;
      const categoryName = category?.name?.toLowerCase() || '';

      if (ingredientCategoryKeywords.some(keyword => categoryName.includes(keyword))) {
        return true;
      }

      // Also include items with ingredient-like names
      const nameLower = item.name.toLowerCase();
      return nameLower.includes('agar') ||
        nameLower.includes('malt') ||
        nameLower.includes('dextrose') ||
        nameLower.includes('peptone') ||
        nameLower.includes('yeast') ||
        nameLower.includes('extract');
    });
  }, [activeInventoryItems, getInventoryCategory]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return (data.ingredients || []).reduce((total, ing) => {
      if (ing.inventoryItemId) {
        const item = getInventoryItem(ing.inventoryItemId);
        if (item && item.unitCost) {
          return total + (item.unitCost * ing.quantity);
        }
      }
      return total;
    }, 0);
  }, [data.ingredients, getInventoryItem]);

  // Handle adding ingredient
  const handleAddIngredient = useCallback(() => {
    if (!newIngredient.name || !newIngredient.quantity) return;

    const ingredient: RecipeIngredient = {
      id: generateId('ing'),
      inventoryItemId: newIngredient.inventoryItemId || undefined,
      name: newIngredient.name,
      quantity: newIngredient.quantity,
      unit: newIngredient.unit,
    };

    onChange({ ingredients: [...(data.ingredients || []), ingredient] });
    setNewIngredient({ inventoryItemId: '', name: '', quantity: 0, unit: 'g' });
  }, [newIngredient, data.ingredients, onChange, generateId]);

  // Handle removing ingredient
  const handleRemoveIngredient = useCallback((id: string) => {
    onChange({ ingredients: (data.ingredients || []).filter(i => i.id !== id) });
  }, [data.ingredients, onChange]);

  // Handle selecting inventory item for ingredient
  const handleInventoryItemSelect = useCallback((itemId: string) => {
    const item = getInventoryItem(itemId);
    if (item) {
      setNewIngredient(prev => ({
        ...prev,
        inventoryItemId: itemId,
        name: item.name,
        unit: item.unit || 'g',
      }));
    }
  }, [getInventoryItem]);

  // Handle adding instruction step
  const handleAddInstruction = useCallback(() => {
    onChange({ instructions: [...(data.instructions || []), ''] });
  }, [data.instructions, onChange]);

  // Handle updating instruction
  const handleUpdateInstruction = useCallback((index: number, value: string) => {
    const newInstructions = [...(data.instructions || [])];
    newInstructions[index] = value;
    onChange({ instructions: newInstructions });
  }, [data.instructions, onChange]);

  // Handle removing instruction
  const handleRemoveInstruction = useCallback((index: number) => {
    const newInstructions = (data.instructions || []).filter((_, i) => i !== index);
    onChange({ instructions: newInstructions });
  }, [data.instructions, onChange]);

  // Handle adding tip
  const handleAddTip = useCallback(() => {
    onChange({ tips: [...(data.tips || []), ''] });
  }, [data.tips, onChange]);

  // Handle updating tip
  const handleUpdateTip = useCallback((index: number, value: string) => {
    const newTips = [...(data.tips || [])];
    newTips[index] = value;
    onChange({ tips: newTips });
  }, [data.tips, onChange]);

  // Handle removing tip
  const handleRemoveTip = useCallback((index: number) => {
    const newTips = (data.tips || []).filter((_, i) => i !== index);
    onChange({ tips: newTips });
  }, [data.tips, onChange]);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Recipe Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., MEA, PDYA, Oat Grain Prep, CVG Substrate"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allCategories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value })}
              className={`p-2 sm:p-3 rounded-lg border text-left transition-all ${
                data.category === cat.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.label}</span>
              </div>
              {!compact && <div className="text-xs opacity-70 mt-1 line-clamp-1">{cat.description}</div>}
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Description</label>
        <textarea
          value={data.description || ''}
          onChange={e => onChange({ description: e.target.value })}
          rows={2}
          placeholder="Brief description of this recipe..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Yield */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Yield</label>
        <div className="flex gap-3">
          <NumericInput
            value={data.yield?.amount}
            onChange={value => onChange({
              yield: {
                amount: value ?? 0,
                unit: data.yield?.unit || 'ml',
              },
            })}
            placeholder="Amount"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={data.yield?.unit || 'ml'}
            onChange={e => onChange({
              yield: {
                amount: data.yield?.amount || 0,
                unit: e.target.value,
              },
            })}
            className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            {yieldUnits.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-zinc-500 mt-1">How much this recipe produces</p>
      </div>

      {/* ========== INGREDIENTS SECTION ========== */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIngredients(!showIngredients)}
          className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🧪</span>
            <span className="font-medium text-white">Ingredients</span>
            {(data.ingredients?.length || 0) > 0 && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {data.ingredients?.length}
              </span>
            )}
          </div>
          {showIngredients ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </button>

        {showIngredients && (
          <div className="p-3 space-y-3 bg-zinc-900/30">
            {/* Existing ingredients */}
            {(data.ingredients || []).map((ing, index) => {
              const linkedItem = ing.inventoryItemId ? getInventoryItem(ing.inventoryItemId) : null;
              const cost = linkedItem?.unitCost ? (linkedItem.unitCost * ing.quantity).toFixed(2) : null;

              return (
                <div key={ing.id} className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{ing.name}</span>
                      {linkedItem && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Icons.Link />
                          Linked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-zinc-400">{ing.quantity} {ing.unit}</span>
                      {cost && (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <Icons.Dollar />
                          ${cost}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              );
            })}

            {/* Add new ingredient */}
            <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 border-dashed">
              <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Add Ingredient</div>

              {/* From Inventory */}
              <div className="mb-2">
                <label className="block text-xs text-zinc-500 mb-1">From Inventory (optional)</label>
                <select
                  value={newIngredient.inventoryItemId}
                  onChange={e => handleInventoryItemSelect(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                >
                  <option value="">-- Select from your shelf --</option>
                  {ingredientInventoryItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.unitCost ? `($${item.unitCost}/${item.unit})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={newIngredient.name}
                    onChange={e => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ingredient name"
                    className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                  />
                </div>
                <div className="col-span-3">
                  <NumericInput
                    value={newIngredient.quantity || undefined}
                    onChange={value => setNewIngredient(prev => ({ ...prev, quantity: value ?? 0 }))}
                    placeholder="Qty"
                    className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={newIngredient.unit}
                    onChange={e => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-sm text-white"
                  >
                    {ingredientUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    disabled={!newIngredient.name || !newIngredient.quantity}
                    className="w-full h-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded flex items-center justify-center transition-colors"
                  >
                    <Icons.Plus />
                  </button>
                </div>
              </div>
            </div>

            {/* Cost Summary */}
            {totalCost > 0 && (
              <div className="p-2 bg-amber-950/30 border border-amber-800 rounded-lg flex items-center justify-between">
                <span className="text-sm text-amber-400 flex items-center gap-2">
                  <Icons.Dollar />
                  Total Ingredient Cost
                </span>
                <span className="text-lg font-semibold text-amber-300">${totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== INSTRUCTIONS SECTION ========== */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span className="font-medium text-white">Instructions</span>
            {(data.instructions?.length || 0) > 0 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                {data.instructions?.filter(i => i.trim()).length} steps
              </span>
            )}
          </div>
          {showInstructions ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </button>

        {showInstructions && (
          <div className="p-3 space-y-2 bg-zinc-900/30">
            {(data.instructions || []).map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                <textarea
                  value={instruction}
                  onChange={e => handleUpdateInstruction(index, e.target.value)}
                  placeholder={`Step ${index + 1}...`}
                  rows={2}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white resize-none focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(index)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInstruction}
              className="w-full py-2 border border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icons.Plus />
              Add Step
            </button>
          </div>
        )}
      </div>

      {/* ========== TIPS SECTION ========== */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="font-medium text-white">Tips & Notes</span>
            {(data.tips?.length || 0) > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                {data.tips?.filter(t => t.trim()).length}
              </span>
            )}
          </div>
          {showTips ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </button>

        {showTips && (
          <div className="p-3 space-y-2 bg-zinc-900/30">
            {(data.tips || []).map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1.5">•</span>
                <input
                  type="text"
                  value={tip}
                  onChange={e => handleUpdateTip(index, e.target.value)}
                  placeholder="Add a helpful tip..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTip(index)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddTip}
              className="w-full py-2 border border-dashed border-zinc-600 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
              <Icons.Plus />
              Add Tip
            </button>
          </div>
        )}
      </div>

      {/* ========== TIMING & ADVANCED ========== */}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span className="font-medium text-white">Timing & Sterilization</span>
          </div>
          {showAdvanced ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </button>

        {showAdvanced && (
          <div className="p-3 space-y-3 bg-zinc-900/30">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Prep Time</label>
                <div className="relative">
                  <NumericInput
                    value={data.prepTime}
                    onChange={value => onChange({ prepTime: value })}
                    placeholder="15"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Sterilization</label>
                <div className="relative">
                  <NumericInput
                    value={data.sterilizationTime}
                    onChange={value => onChange({ sterilizationTime: value })}
                    placeholder="45"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Pressure</label>
                <div className="relative">
                  <NumericInput
                    value={data.sterilizationPsi}
                    onChange={value => onChange({ sterilizationPsi: value })}
                    placeholder="15"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">PSI</span>
                </div>
              </div>
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Source URL</label>
              <input
                type="url"
                value={data.sourceUrl || ''}
                onChange={e => onChange({ sourceUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Link to where you found this recipe</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Additional Notes</label>
              <textarea
                value={data.notes || ''}
                onChange={e => onChange({ notes: e.target.value })}
                rows={2}
                placeholder="Any other information about this recipe..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DEFAULT FORM DATA
// ============================================================================

export const getDefaultRecipeFormData = (): RecipeFormData => ({
  name: '',
  category: 'agar',
  description: '',
  yield: { amount: 500, unit: 'ml' },
  prepTime: 15,
  sterilizationTime: 45,
  sterilizationPsi: 15,
  ingredients: [],
  instructions: [''],
  tips: [],
  sourceUrl: '',
  notes: '',
  isActive: true,
});

export default RecipeForm;
