// ============================================================================
// CONTAINER FORM - Unified form for creating/editing containers
// Replaces VesselForm and ContainerTypeForm
// ============================================================================

import React from 'react';
import type { ContainerCategory, ContainerUsageContext } from '../../store/types';

export interface ContainerFormData {
  name: string;
  category: ContainerCategory;
  volumeMl?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit?: 'cm' | 'in';
  };
  isReusable: boolean;
  usageContext: ContainerUsageContext[];
  notes?: string;
  isActive: boolean;
}

interface ContainerFormProps {
  data: ContainerFormData;
  onChange: (data: Partial<ContainerFormData>) => void;
  errors?: Record<string, string>;
}

const containerCategories = [
  // Culture containers (small scale)
  { value: 'jar', label: 'Jar', icon: '🫙', description: 'Mason jars, LC jars', context: 'culture' },
  { value: 'bag', label: 'Bag', icon: '🛍️', description: 'Spawn bags, grow bags', context: 'both' },
  { value: 'plate', label: 'Plate', icon: '🧫', description: 'Petri dishes', context: 'culture' },
  { value: 'tube', label: 'Tube', icon: '🧪', description: 'Test tubes, slants', context: 'culture' },
  { value: 'bottle', label: 'Bottle', icon: '🍶', description: 'Media bottles', context: 'culture' },
  { value: 'syringe', label: 'Syringe', icon: '💉', description: 'Spore/LC syringes', context: 'culture' },
  // Grow containers (larger scale)
  { value: 'tub', label: 'Tub', icon: '📦', description: 'Monotubs, shoeboxes', context: 'grow' },
  { value: 'bucket', label: 'Bucket', icon: '🪣', description: '5-gallon buckets', context: 'grow' },
  { value: 'bed', label: 'Bed', icon: '🪵', description: 'Outdoor beds', context: 'grow' },
  { value: 'other', label: 'Other', icon: '📍', description: 'Custom container', context: 'both' },
];

const commonContainers = [
  { name: 'Quart Mason Jar', category: 'jar', volumeMl: 946, context: ['culture', 'grow'] },
  { name: 'Pint Mason Jar', category: 'jar', volumeMl: 473, context: ['culture'] },
  { name: '100mm Petri Dish', category: 'plate', volumeMl: 25, context: ['culture'] },
  { name: '10cc Syringe', category: 'syringe', volumeMl: 10, context: ['culture'] },
  { name: '6qt Shoebox', category: 'tub', volumeMl: 5700, context: ['grow'] },
  { name: '66qt Monotub', category: 'tub', volumeMl: 62000, context: ['grow'] },
  { name: '5 Gallon Bucket', category: 'bucket', volumeMl: 19000, context: ['grow'] },
];

export const ContainerForm: React.FC<ContainerFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const handleQuickSelect = (container: typeof commonContainers[0]) => {
    onChange({
      name: container.name,
      category: container.category as ContainerCategory,
      volumeMl: container.volumeMl,
      usageContext: container.context as ContainerUsageContext[],
    });
  };

  const toggleUsageContext = (context: ContainerUsageContext) => {
    const current = data.usageContext || [];
    if (current.includes(context)) {
      if (current.length > 1) {
        onChange({ usageContext: current.filter(c => c !== context) });
      }
    } else {
      onChange({ usageContext: [...current, context] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Select */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Quick Select</label>
        <div className="flex flex-wrap gap-2">
          {commonContainers.map(container => (
            <button
              key={container.name}
              type="button"
              onClick={() => handleQuickSelect(container)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                data.name === container.name
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {container.name}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Container Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Quart Mason Jar, 66qt Monotub, 10cc Syringe"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Container Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {containerCategories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value as ContainerCategory })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.category === cat.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="font-medium text-sm">{cat.label}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">{cat.description}</div>
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
      </div>

      {/* Usage Context */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Usage <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => toggleUsageContext('culture')}
            className={`flex-1 p-3 rounded-lg border text-left transition-all ${
              data.usageContext?.includes('culture')
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <div className="font-medium">Culture Work</div>
            <div className="text-xs opacity-70">LC, agar, slants, syringes</div>
          </button>
          <button
            type="button"
            onClick={() => toggleUsageContext('grow')}
            className={`flex-1 p-3 rounded-lg border text-left transition-all ${
              data.usageContext?.includes('grow')
                ? 'border-green-500 bg-green-500/10 text-green-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            <div className="font-medium">Fruiting/Growing</div>
            <div className="text-xs opacity-70">Monotubs, buckets, bags</div>
          </button>
        </div>
      </div>

      {/* Volume */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Volume (ml)</label>
        <input
          type="number"
          value={data.volumeMl || ''}
          onChange={e => onChange({ volumeMl: parseInt(e.target.value) || undefined })}
          placeholder="e.g., 946 for quart jar, 62000 for 66qt tub"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Total capacity in milliliters (1L = 1000ml)
        </p>
      </div>

      {/* Reusable */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isReusable}
            onChange={e => onChange({ isReusable: e.target.checked })}
            className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
          />
          <div>
            <span className="text-white font-medium">Reusable</span>
            <p className="text-xs text-zinc-500">
              Can be sterilized and used multiple times (e.g., glass jars, plastic tubs)
            </p>
          </div>
        </label>
      </div>

      {/* Dimensions (optional, mainly for larger containers) */}
      {['tub', 'bucket', 'bed'].includes(data.category) && (
        <div>
          <label className="block text-sm text-zinc-400 mb-2">
            Dimensions (cm) - Optional
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Length</label>
              <input
                type="number"
                value={data.dimensions?.length || ''}
                onChange={e => onChange({
                  dimensions: {
                    length: parseFloat(e.target.value) || 0,
                    width: data.dimensions?.width || 0,
                    height: data.dimensions?.height || 0,
                    unit: 'cm',
                  },
                })}
                placeholder="L"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Width</label>
              <input
                type="number"
                value={data.dimensions?.width || ''}
                onChange={e => onChange({
                  dimensions: {
                    length: data.dimensions?.length || 0,
                    width: parseFloat(e.target.value) || 0,
                    height: data.dimensions?.height || 0,
                    unit: 'cm',
                  },
                })}
                placeholder="W"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Height</label>
              <input
                type="number"
                value={data.dimensions?.height || ''}
                onChange={e => onChange({
                  dimensions: {
                    length: data.dimensions?.length || 0,
                    width: data.dimensions?.width || 0,
                    height: parseFloat(e.target.value) || 0,
                    unit: 'cm',
                  },
                })}
                placeholder="H"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Supplier notes, modifications, where to buy..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default ContainerForm;
