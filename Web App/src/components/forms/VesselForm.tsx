// ============================================================================
// VESSEL FORM - Full form for creating/editing vessels
// ============================================================================

import React from 'react';

export interface VesselFormData {
  name: string;
  type: 'jar' | 'bag' | 'plate' | 'tube' | 'bottle' | 'syringe' | 'other';
  volumeMl?: number;
  isReusable: boolean;
  notes?: string;
  isActive: boolean;
}

interface VesselFormProps {
  data: VesselFormData;
  onChange: (data: Partial<VesselFormData>) => void;
  errors?: Record<string, string>;
}

const vesselTypes = [
  { value: 'jar', label: 'Jar', icon: '🫙', description: 'Mason jars, LC jars' },
  { value: 'bag', label: 'Bag', icon: '🛍️', description: 'Spawn bags, filter bags' },
  { value: 'plate', label: 'Plate', icon: '🧫', description: 'Petri dishes, agar plates' },
  { value: 'tube', label: 'Tube', icon: '🧪', description: 'Test tubes, slant tubes' },
  { value: 'bottle', label: 'Bottle', icon: '🍶', description: 'Media bottles, LC bottles' },
  { value: 'syringe', label: 'Syringe', icon: '💉', description: 'Spore syringes, LC syringes' },
  { value: 'other', label: 'Other', icon: '📦', description: 'Custom container type' },
];

export const VesselForm: React.FC<VesselFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Vessel Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Quart Mason Jar, 100mm Petri Dish, 10ml Syringe"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Vessel Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {vesselTypes.map(type => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange({ type: type.value as VesselFormData['type'] })}
              className={`p-3 rounded-lg border text-left transition-all ${
                data.type === type.value
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{type.icon}</span>
                <span className="font-medium text-sm">{type.label}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">{type.description}</div>
            </button>
          ))}
        </div>
        {errors.type && <p className="text-xs text-red-400 mt-1">{errors.type}</p>}
      </div>

      {/* Volume */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Volume (ml)
        </label>
        <input
          type="number"
          value={data.volumeMl || ''}
          onChange={e => onChange({ volumeMl: parseInt(e.target.value) || undefined })}
          placeholder="e.g., 946 for quart jar, 100 for petri dish"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Total capacity of the container
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
              Can be sterilized and used multiple times (e.g., glass jars)
            </p>
          </div>
        </label>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Brand, where to buy, special considerations..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default VesselForm;
