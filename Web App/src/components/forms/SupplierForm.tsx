// ============================================================================
// SUPPLIER FORM - Full form for creating/editing suppliers
// ============================================================================

import React from 'react';

export interface SupplierFormData {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}

interface SupplierFormProps {
  data: SupplierFormData;
  onChange: (data: Partial<SupplierFormData>) => void;
  errors?: Record<string, string>;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          Supplier Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name || ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g., Midwest Grow Kits, Amazon, Local Farm Store"
          className={`w-full bg-zinc-800 border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${
            errors.name ? 'border-red-500' : 'border-zinc-700'
          }`}
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Website</label>
        <input
          type="url"
          value={data.website || ''}
          onChange={e => onChange({ website: e.target.value })}
          placeholder="https://www.example.com"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Email</label>
        <input
          type="email"
          value={data.email || ''}
          onChange={e => onChange({ email: e.target.value })}
          placeholder="contact@example.com"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Phone</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={e => onChange({ phone: e.target.value })}
          placeholder="(555) 123-4567"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={e => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Shipping times, product quality, discount codes..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};

export default SupplierForm;
