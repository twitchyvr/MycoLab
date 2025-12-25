// ============================================================================
// INVENTORY ITEM FORM - Form for creating/editing inventory items
// ============================================================================

import React, { useEffect, useCallback } from 'react';
import { useData } from '../../store';
import { StandardDropdown } from '../common/StandardDropdown';
import { NumericInput } from '../common/NumericInput';
import type { ItemBehavior, ItemProperties } from '../../store/types';

// Smart defaults: map category names to suggested item behaviors
const CATEGORY_BEHAVIOR_MAP: Record<string, ItemBehavior> = {
  'containers': 'container',
  'equipment': 'equipment',
  'grains': 'consumable',
  'substrates': 'consumable',
  'chemicals': 'consumable',
  'media': 'consumable',
  'cultures': 'consumable',
  'lab supplies': 'supply',
};

// Keywords in item names that suggest specific behaviors
const NAME_BEHAVIOR_KEYWORDS: { pattern: RegExp; behavior: ItemBehavior }[] = [
  { pattern: /\b(jar|jars|mason|container|bottle|bag|bags|plate|plates|dish|tub|tubs|bucket|vessel)\b/i, behavior: 'container' },
  { pattern: /\b(scale|scales|incubator|pressure cooker|autoclave|flow hood|laminar|dehydrator|microscope|hepa)\b/i, behavior: 'equipment' },
  { pattern: /\b(glove|gloves|wipe|wipes|wrap|tape|parafilm|syringe|needle|scalpel|label)\b/i, behavior: 'supply' },
  { pattern: /\b(sab|still air box|workspace|table|bench|surface)\b/i, behavior: 'surface' },
];

export interface InventoryItemFormData {
  name: string;
  categoryId?: string;
  sku?: string;
  unit: string;
  unitCost?: number;
  reorderPoint?: number;
  reorderQty?: number;
  notes?: string;
  isActive: boolean;
  itemBehavior?: ItemBehavior;
  itemProperties?: ItemProperties;
}

const ITEM_BEHAVIOR_OPTIONS: { value: ItemBehavior; label: string; description: string }[] = [
  { value: 'consumable', label: 'Consumable', description: 'Gets used up (grains, agar powder, chemicals)' },
  { value: 'container', label: 'Container', description: 'Holds things (jars, bags, plates) - tracked individually' },
  { value: 'equipment', label: 'Equipment', description: 'Lab tools (scales, flow hoods) - tracked individually' },
  { value: 'supply', label: 'Supply', description: 'Disposable supplies (gloves, wipes, parafilm)' },
  { value: 'surface', label: 'Surface', description: 'Work surfaces (SAB, tables) - tracked for cleaning' },
];

interface InventoryItemFormProps {
  data: InventoryItemFormData;
  onChange: (data: Partial<InventoryItemFormData>) => void;
  errors?: Record<string, string>;
}

const UNIT_OPTIONS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'L', label: 'Liters (L)' },
  { value: 'ea', label: 'Each (ea)' },
  { value: 'pack', label: 'Pack' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
];

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const { activeInventoryCategories, getInventoryCategory } = useData();

  // Infer behavior from item name
  const inferBehaviorFromName = useCallback((name: string): ItemBehavior | null => {
    for (const { pattern, behavior } of NAME_BEHAVIOR_KEYWORDS) {
      if (pattern.test(name)) {
        return behavior;
      }
    }
    return null;
  }, []);

  // Infer behavior from category
  const inferBehaviorFromCategory = useCallback((categoryId: string): ItemBehavior | null => {
    const category = getInventoryCategory(categoryId);
    if (!category) return null;
    const categoryName = category.name.toLowerCase();
    return CATEGORY_BEHAVIOR_MAP[categoryName] || null;
  }, [getInventoryCategory]);

  // Build properties for a behavior
  const buildPropertiesForBehavior = useCallback((behavior: ItemBehavior): ItemProperties => {
    return {
      unitType: behavior === 'container' || behavior === 'equipment' || behavior === 'surface' ? 'countable' : 'weight',
      defaultUnit: behavior === 'container' || behavior === 'equipment' ? 'ea' : 'g',
      trackInstances: behavior === 'container' || behavior === 'equipment',
      isReusable: behavior === 'container' || behavior === 'equipment' || behavior === 'surface',
      isSterilizable: behavior === 'container',
      holdsContents: behavior === 'container',
    };
  }, []);

  // Auto-suggest behavior when category changes (if not already set)
  useEffect(() => {
    if (data.categoryId && !data.itemBehavior) {
      const suggestedBehavior = inferBehaviorFromCategory(data.categoryId);
      if (suggestedBehavior) {
        onChange({
          itemBehavior: suggestedBehavior,
          itemProperties: buildPropertiesForBehavior(suggestedBehavior),
          // Also set appropriate unit
          unit: suggestedBehavior === 'container' || suggestedBehavior === 'equipment' ? 'ea' : data.unit || 'g',
        });
      }
    }
  }, [data.categoryId, data.itemBehavior, data.unit, inferBehaviorFromCategory, buildPropertiesForBehavior, onChange]);

  // Auto-suggest behavior when name changes (if not already set)
  useEffect(() => {
    if (data.name && !data.itemBehavior) {
      const suggestedBehavior = inferBehaviorFromName(data.name);
      if (suggestedBehavior) {
        onChange({
          itemBehavior: suggestedBehavior,
          itemProperties: buildPropertiesForBehavior(suggestedBehavior),
          unit: suggestedBehavior === 'container' || suggestedBehavior === 'equipment' ? 'ea' : data.unit || 'g',
        });
      }
    }
  }, [data.name, data.itemBehavior, data.unit, inferBehaviorFromName, buildPropertiesForBehavior, onChange]);

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Item Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Light Malt Extract, Petri Dishes, Coco Coir"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <StandardDropdown
        label="Category"
        value={data.categoryId || ''}
        onChange={value => onChange({ categoryId: value })}
        options={activeInventoryCategories}
        placeholder="Select category..."
        entityType="inventoryCategory"
        fieldName="categoryId"
        helpText="Group similar items together (e.g., Grains, Substrates, Lab Supplies)"
      />

      {/* Item Behavior */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-zinc-400">Item Type</label>
          {data.itemBehavior && (inferBehaviorFromCategory(data.categoryId || '') === data.itemBehavior ||
            inferBehaviorFromName(data.name || '') === data.itemBehavior) && (
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
              </svg>
              Auto-detected
            </span>
          )}
        </div>
        <select
          value={data.itemBehavior || ''}
          onChange={e => {
            const behavior = e.target.value as ItemBehavior | '';
            onChange({
              itemBehavior: behavior || undefined,
              // Set default properties based on behavior
              itemProperties: behavior ? {
                ...data.itemProperties,
                unitType: behavior === 'container' || behavior === 'equipment' || behavior === 'surface' ? 'countable' : 'weight',
                defaultUnit: behavior === 'container' || behavior === 'equipment' ? 'ea' : data.unit || 'g',
                trackInstances: behavior === 'container' || behavior === 'equipment',
                isReusable: behavior === 'container' || behavior === 'equipment' || behavior === 'surface',
                isSterilizable: behavior === 'container',
                holdsContents: behavior === 'container',
              } : undefined,
            });
          }}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Select item type...</option>
          {ITEM_BEHAVIOR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {data.itemBehavior && (
          <p className="text-xs text-zinc-500 mt-1">
            {ITEM_BEHAVIOR_OPTIONS.find(o => o.value === data.itemBehavior)?.description}
          </p>
        )}
      </div>

      {/* Instance Tracking Options (for containers/equipment) */}
      {(data.itemBehavior === 'container' || data.itemBehavior === 'equipment') && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
          <p className="text-sm text-emerald-400 font-medium">Instance Tracking</p>
          <p className="text-xs text-zinc-400 mb-2">
            Individual items will be tracked (e.g., "Jar #1", "Jar #2"). Each item's status, usage, and cost are recorded.
          </p>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={data.itemProperties?.trackInstances ?? true}
              onChange={e => onChange({
                itemProperties: { ...data.itemProperties, trackInstances: e.target.checked, unitType: data.itemProperties?.unitType || 'countable', defaultUnit: data.itemProperties?.defaultUnit || 'ea' }
              })}
              className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            Track individual instances
          </label>
          {data.itemBehavior === 'container' && (
            <>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={data.itemProperties?.isSterilizable ?? true}
                  onChange={e => onChange({
                    itemProperties: { ...data.itemProperties, isSterilizable: e.target.checked, unitType: data.itemProperties?.unitType || 'countable', defaultUnit: data.itemProperties?.defaultUnit || 'ea' }
                  })}
                  className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                Can be sterilized (PC, autoclave)
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={data.itemProperties?.holdsContents ?? true}
                  onChange={e => onChange({
                    itemProperties: { ...data.itemProperties, holdsContents: e.target.checked, unitType: data.itemProperties?.unitType || 'countable', defaultUnit: data.itemProperties?.defaultUnit || 'ea' }
                  })}
                  className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                Holds contents (LC, agar, spawn)
              </label>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Unit */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Default Unit</label>
          <select
            value={data.unit || 'ea'}
            onChange={e => onChange({ unit: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
          >
            {UNIT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Default Cost (per unit)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
            <NumericInput
              value={data.unitCost}
              onChange={value => onChange({ unitCost: value })}
              placeholder="0.00"
              step={0.01}
              min={0}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">SKU / Part Number</label>
        <input
          type="text"
          value={data.sku || ''}
          onChange={e => onChange({ sku: e.target.value })}
          placeholder="Optional product code"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Reorder settings */}
      <div className="border-t border-zinc-700 pt-4">
        <label className="block text-sm text-zinc-300 mb-3">Reorder Settings</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Low Stock Alert At</label>
            <NumericInput
              value={data.reorderPoint}
              onChange={value => onChange({ reorderPoint: value })}
              placeholder="e.g., 5"
              min={0}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Reorder Quantity</label>
            <NumericInput
              value={data.reorderQty}
              onChange={value => onChange({ reorderQty: value })}
              placeholder="e.g., 10"
              min={0}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Product details, preferred brands, usage notes..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default InventoryItemForm;
