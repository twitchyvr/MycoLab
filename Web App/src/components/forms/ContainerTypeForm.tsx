// ============================================================================
// CONTAINER TYPE FORM - Full form for creating/editing container types
// ============================================================================

import React from 'react';
import { VolumeInput } from '../common/VolumeInput';

export interface ContainerTypeFormData {
  name: string;
  category: 'tub' | 'bag' | 'jar' | 'bucket' | 'bed' | 'other';
  volumeL?: number;
  dimensions?: { length: number; width: number; height: number };
  notes?: string;
  isActive: boolean;
}

interface ContainerTypeFormProps {
  data: ContainerTypeFormData;
  onChange: (data: Partial<ContainerTypeFormData>) => void;
  errors?: Record<string, string>;
}

const categories = [
  { value: 'tub', label: 'Tub/Shoebox', icon: '📦', description: 'Plastic storage containers' },
  { value: 'bag', label: 'Grow Bag', icon: '🛍️', description: 'Mushroom grow bags' },
  { value: 'jar', label: 'Jar', icon: '🫙', description: 'Mason jars, BRF jars' },
  { value: 'bucket', label: 'Bucket', icon: '🪣', description: '5-gallon buckets' },
  { value: 'bed', label: 'Bed/Log', icon: '🪵', description: 'Outdoor beds, logs' },
  { value: 'other', label: 'Other', icon: '📍', description: 'Custom container' },
];

const commonContainers = [
  { name: '6qt Shoebox', category: 'tub', volumeL: 5.7 },
  { name: '15qt Sterilite', category: 'tub', volumeL: 14.2 },
  { name: '32qt Monotub', category: 'tub', volumeL: 30.3 },
  { name: '56qt Monotub', category: 'tub', volumeL: 53 },
  { name: '66qt Monotub', category: 'tub', volumeL: 62.5 },
  { name: 'Unicorn Bag XLS', category: 'bag', volumeL: 7 },
  { name: '5 Gallon Bucket', category: 'bucket', volumeL: 19 },
];

export const ContainerTypeForm: React.FC<ContainerTypeFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const handleQuickSelect = (container: typeof commonContainers[0]) => {
    onChange({
      name: container.name,
      category: container.category as ContainerTypeFormData['category'],
      volumeL: container.volumeL,
    });
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

      {/* Category */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Category <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {categories.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value as ContainerTypeFormData['category'] })}
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

      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Container Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., 6qt Shoebox, 56qt Monotub"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Volume */}
      <VolumeInput
        label="Volume"
        value={data.volumeL ? data.volumeL * 1000 : undefined}
        onChange={ml => onChange({ volumeL: ml ? ml / 1000 : undefined })}
        placeholder="e.g., 30L for 32qt tub"
        showConversionHint
      />

      {/* Dimensions */}
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
                },
              })}
              placeholder="H"
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
          rows={3}
          placeholder="Modification notes, where to buy, FAE holes..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default ContainerTypeForm;
