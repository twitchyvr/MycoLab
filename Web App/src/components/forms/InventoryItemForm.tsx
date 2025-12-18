// ============================================================================
// INVENTORY ITEM FORM - Form for creating/editing inventory items
// ============================================================================

import React from 'react';
import { useData } from '../../store';
import { StandardDropdown } from '../common/StandardDropdown';
import { NumericInput } from '../common/NumericInput';

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
}

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
  const { activeInventoryCategories } = useData();

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
