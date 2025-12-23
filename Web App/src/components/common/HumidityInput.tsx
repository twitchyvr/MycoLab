// ============================================================================
// HUMIDITY INPUT COMPONENT
// Smart humidity input with visual feedback (0-100%)
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface HumidityInputProps {
  /** Value as percentage (0-100) */
  value: number | undefined | null;
  /** Called with new value (0-100) */
  onChange: (percent: number | undefined) => void;
  /** Label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Minimum value (default 0) */
  min?: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Allow empty value (returns undefined) */
  allowEmpty?: boolean;
  /** Compact mode for tight spaces */
  compact?: boolean;
  /** Helper text to show below input */
  helperText?: string;
  /** Show a visual bar indicating humidity level */
  showVisualBar?: boolean;
}

// Get humidity level description and color
const getHumidityLevel = (value: number): { label: string; color: string; bgColor: string } => {
  if (value < 40) return { label: 'Low', color: 'text-amber-400', bgColor: 'bg-amber-500' };
  if (value < 60) return { label: 'Moderate', color: 'text-yellow-400', bgColor: 'bg-yellow-500' };
  if (value < 80) return { label: 'Optimal', color: 'text-emerald-400', bgColor: 'bg-emerald-500' };
  if (value < 95) return { label: 'High', color: 'text-blue-400', bgColor: 'bg-blue-500' };
  return { label: 'Very High', color: 'text-purple-400', bgColor: 'bg-purple-500' };
};

export const HumidityInput: React.FC<HumidityInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '85',
  className = '',
  required = false,
  disabled = false,
  min = 0,
  max = 100,
  allowEmpty = true,
  compact = false,
  helperText,
  showVisualBar = false,
}) => {
  // Raw input string (allows user to type freely)
  const [inputValue, setInputValue] = useState<string>('');

  // Track if user is actively editing
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display value when external value changes (and not editing)
  useEffect(() => {
    if (!isEditing) {
      if (value === undefined || value === null) {
        setInputValue('');
      } else {
        setInputValue(Math.round(value).toString());
      }
    }
  }, [value, isEditing]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);

    // Try to parse the input as a number
    const numValue = parseFloat(raw);

    if (!isNaN(numValue)) {
      // Clamp to valid range
      let clamped = numValue;
      if (clamped < min) clamped = min;
      if (clamped > max) clamped = max;
      onChange(clamped);
    } else if (raw === '' && allowEmpty) {
      onChange(undefined);
    }
  }, [onChange, min, max, allowEmpty]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);

    // Clean up input on blur
    if (inputValue === '') {
      if (!allowEmpty) {
        setInputValue('0');
        onChange(0);
      }
      return;
    }

    // Re-parse and format properly
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clamped = Math.min(Math.max(numValue, min), max);
      setInputValue(Math.round(clamped).toString());
      onChange(clamped);
    }
  }, [inputValue, allowEmpty, onChange, min, max]);

  const humidityLevel = value !== undefined && value !== null ? getHumidityLevel(value) : null;

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-2'} ${className}`}>
      {/* Label */}
      {label && (
        <label className={`block ${compact ? 'text-xs' : 'text-sm'} text-zinc-400`}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input with % suffix */}
      <div className="relative flex items-stretch">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            min-w-0 flex-1 bg-zinc-800 border border-zinc-700 rounded-l-lg px-3
            ${compact ? 'py-1.5 text-sm' : 'py-2'}
            text-white placeholder-zinc-500
            focus:outline-none focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {/* % suffix */}
        <div className={`
          bg-zinc-700 border border-l-0 border-zinc-600 rounded-r-lg
          ${compact ? 'px-2 text-sm' : 'px-3'}
          text-zinc-400 flex items-center
        `}>
          <span className="font-medium">%</span>
        </div>
      </div>

      {/* Visual bar */}
      {showVisualBar && value !== undefined && value !== null && (
        <div className="space-y-1">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${humidityLevel?.bgColor}`}
              style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={humidityLevel?.color}>{humidityLevel?.label}</span>
            <span className="text-zinc-500">{Math.round(value)}%</span>
          </div>
        </div>
      )}

      {/* Helper text */}
      {helperText && (
        <p className="text-xs text-zinc-500">{helperText}</p>
      )}
    </div>
  );
};

export default HumidityInput;
