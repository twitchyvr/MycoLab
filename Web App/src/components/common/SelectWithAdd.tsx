// ============================================================================
// SELECT WITH ADD - Dropdown with inline "Add New" option
// ============================================================================

import React, { useState } from 'react';

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

interface SelectWithAddProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  // For inline add
  addLabel?: string;
  onAdd?: (name: string) => void;
  addFields?: {
    name: string;
    label: string;
    type: 'text' | 'select';
    options?: { value: string; label: string }[];
    required?: boolean;
  }[];
  onAddComplete?: (data: Record<string, string>) => void;
}

const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
};

export const SelectWithAdd: React.FC<SelectWithAddProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  required,
  disabled,
  className = '',
  addLabel = 'Add New',
  onAdd,
  addFields,
  onAddComplete,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addFormData, setAddFormData] = useState<Record<string, string>>({});

  const handleQuickAdd = () => {
    if (!newItemName.trim()) return;
    if (onAdd) {
      onAdd(newItemName.trim());
    }
    setNewItemName('');
    setShowAddForm(false);
  };

  const handleFullAdd = () => {
    if (onAddComplete && addFormData.name?.trim()) {
      onAddComplete(addFormData);
    }
    setAddFormData({});
    setShowAddForm(false);
  };

  const hasAddCapability = onAdd || onAddComplete;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm text-zinc-400 mb-2">
          {label} {required && '*'}
        </label>
      )}
      
      <select
        value={value}
        onChange={e => {
          if (e.target.value === '__ADD_NEW__') {
            setShowAddForm(true);
          } else {
            onChange(e.target.value);
          }
        }}
        disabled={disabled}
        className={`w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
        {hasAddCapability && (
          <option value="__ADD_NEW__" className="text-emerald-400">
            ➕ {addLabel}...
          </option>
        )}
      </select>

      {/* Inline Add Form */}
      {showAddForm && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-600 rounded-lg p-3 shadow-xl z-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">{addLabel}</span>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItemName('');
                setAddFormData({});
              }}
              className="text-zinc-400 hover:text-white"
            >
              <Icons.X />
            </button>
          </div>

          {/* Simple add (just name) */}
          {onAdd && !addFields && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Name..."
                autoFocus
                className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleQuickAdd();
                  if (e.key === 'Escape') {
                    setShowAddForm(false);
                    setNewItemName('');
                  }
                }}
              />
              <button
                onClick={handleQuickAdd}
                disabled={!newItemName.trim()}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded text-sm font-medium"
              >
                <Icons.Check />
              </button>
            </div>
          )}

          {/* Full add form with multiple fields */}
          {addFields && onAddComplete && (
            <div className="space-y-2">
              {addFields.map(field => (
                <div key={field.name}>
                  <label className="block text-xs text-zinc-400 mb-1">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'text' ? (
                    <input
                      type="text"
                      value={addFormData[field.name] || ''}
                      onChange={e => setAddFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <select
                      value={addFormData[field.name] || ''}
                      onChange={e => setAddFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-white text-sm"
                    >
                      <option value="">Select...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
              <button
                onClick={handleFullAdd}
                disabled={!addFormData.name?.trim()}
                className="w-full mt-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded text-sm font-medium"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectWithAdd;
