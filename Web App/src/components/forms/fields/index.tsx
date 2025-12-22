// ============================================================================
// FIELD REGISTRY - Reusable field components for Schema-Driven Forms
// Each field type has a consistent look and feel across the entire app
// ============================================================================

import React from 'react';
import type { FieldRenderProps, FieldType } from '../schema/types';
import { ImageUploader } from '../../common/images/ImageUploader';
import { WeightInput } from '../../common/WeightInput';
import { VolumeInput } from '../../common/VolumeInput';
import { NumericInput } from '../../common/NumericInput';

// ============================================================================
// SHARED STYLES
// ============================================================================

const baseInputStyles = `
  w-full px-3 py-2 rounded-lg
  bg-zinc-800 border border-zinc-700 text-white
  placeholder-zinc-500
  focus:outline-none focus:border-emerald-500
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const compactInputStyles = `
  w-full px-2 py-1.5 text-sm rounded-lg
  bg-zinc-800 border border-zinc-700 text-white
  placeholder-zinc-500
  focus:outline-none focus:border-emerald-500
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const errorInputStyles = 'border-red-500 focus:border-red-500';

const labelStyles = 'block text-sm text-zinc-400 mb-1';
const errorTextStyles = 'text-xs text-red-400 mt-1';
const helpTextStyles = 'text-xs text-zinc-500 mt-1';

// ============================================================================
// FIELD WRAPPER - Consistent layout for all fields
// ============================================================================

interface FieldWrapperProps {
  field: FieldRenderProps['field'];
  error?: string;
  children: React.ReactNode;
  compact?: boolean;
}

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  field,
  error,
  children,
  compact,
}) => (
  <div className={field.colSpan ? `col-span-${field.colSpan}` : ''}>
    {field.label && (
      <label className={labelStyles}>
        {field.label}
        {field.validation?.required && <span className="text-red-400 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && <p className={errorTextStyles}>{error}</p>}
    {!error && field.helpText && <p className={helpTextStyles}>{field.helpText}</p>}
  </div>
);

// ============================================================================
// TEXT FIELD
// ============================================================================

export const TextField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isSubmitting,
  compact,
}) => (
  <FieldWrapper field={field} error={error} compact={compact}>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={isSubmitting}
      maxLength={field.validation?.maxLength}
      className={`${compact ? compactInputStyles : baseInputStyles} ${error ? errorInputStyles : ''}`}
    />
  </FieldWrapper>
);

// ============================================================================
// TEXTAREA FIELD
// ============================================================================

export const TextareaField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isSubmitting,
  compact,
}) => (
  <FieldWrapper field={field} error={error} compact={compact}>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={field.placeholder}
      disabled={isSubmitting}
      rows={compact ? 2 : 3}
      maxLength={field.validation?.maxLength}
      className={`${compact ? compactInputStyles : baseInputStyles} resize-none ${error ? errorInputStyles : ''}`}
    />
  </FieldWrapper>
);

// ============================================================================
// NUMBER FIELD
// ============================================================================

export const NumberField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isSubmitting,
  compact,
}) => (
  <FieldWrapper field={field} error={error} compact={compact}>
    <NumericInput
      value={value}
      onChange={onChange}
      placeholder={field.placeholder}
      min={field.validation?.min}
      max={field.validation?.max}
      className={`${compact ? compactInputStyles : baseInputStyles} ${error ? errorInputStyles : ''}`}
    />
  </FieldWrapper>
);

// ============================================================================
// SELECT FIELD
// ============================================================================

export const SelectField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isSubmitting,
  context,
  compact,
}) => {
  const options = field.getOptions ? field.getOptions(context) : field.options || [];

  return (
    <FieldWrapper field={field} error={error} compact={compact}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={isSubmitting}
        className={`${compact ? compactInputStyles : baseInputStyles} ${error ? errorInputStyles : ''}`}
      >
        {!field.validation?.required && (
          <option value="">Select...</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

// ============================================================================
// RATING FIELD (1-5 scale with color coding)
// ============================================================================

const RATING_COLORS = [
  { value: 1, color: 'bg-red-500', label: 'Critical' },
  { value: 2, color: 'bg-orange-500', label: 'Poor' },
  { value: 3, color: 'bg-yellow-500', label: 'Fair' },
  { value: 4, color: 'bg-lime-500', label: 'Good' },
  { value: 5, color: 'bg-emerald-500', label: 'Excellent' },
];

export const RatingField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
  compact,
}) => {
  const range = field.range || [1, 5];
  const ratings = RATING_COLORS.filter(r => r.value >= range[0] && r.value <= range[1]);
  const currentRating = ratings.find(r => r.value === value);

  return (
    <FieldWrapper field={field} error={error} compact={compact}>
      <div className="flex gap-1">
        {ratings.map((rating) => {
          const isSelected = value === rating.value;
          return (
            <button
              key={rating.value}
              type="button"
              onClick={() => onChange(rating.value)}
              disabled={isSubmitting}
              title={rating.label}
              className={`
                flex-1 py-2 rounded-lg font-medium text-sm transition-all
                ${isSelected
                  ? `${rating.color} text-white`
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {rating.value}
            </button>
          );
        })}
      </div>
      {currentRating && (
        <p className="text-xs text-zinc-500 mt-1">{currentRating.label}</p>
      )}
    </FieldWrapper>
  );
};

// ============================================================================
// SLIDER FIELD (Percentage/range)
// ============================================================================

export const SliderField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
  compact,
}) => {
  const min = field.validation?.min ?? 0;
  const max = field.validation?.max ?? 100;

  return (
    <FieldWrapper field={field} error={error} compact={compact}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={value || min}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={isSubmitting}
          className="flex-1 h-2 rounded-lg appearance-none bg-zinc-700 accent-emerald-500"
        />
        <span className="text-sm font-medium text-white w-12 text-right">
          {value || 0}%
        </span>
      </div>
    </FieldWrapper>
  );
};

// ============================================================================
// IMAGES FIELD
// ============================================================================

export const ImagesField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
  compact,
}) => {
  if (compact) {
    // In compact mode, show just a button to add images
    return (
      <FieldWrapper field={field} error={error} compact={compact}>
        <p className="text-xs text-zinc-500">
          {(value || []).length} image(s) attached
        </p>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper field={field} error={error} compact={compact}>
      <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
        <ImageUploader
          images={value || []}
          onImagesChange={onChange}
          folder={field.imageFolder || 'uploads'}
          maxImages={field.maxImages || 5}
          label="Add Photos"
          disabled={isSubmitting}
        />
      </div>
    </FieldWrapper>
  );
};

// ============================================================================
// WEIGHT FIELD (with unit conversion)
// ============================================================================

export const WeightField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
  compact,
}) => (
  <FieldWrapper field={field} error={error} compact={compact}>
    <WeightInput
      label=""
      value={value}
      onChange={onChange}
      required={field.validation?.required}
      compact={compact}
      showConversionHint={!compact}
    />
  </FieldWrapper>
);

// ============================================================================
// VOLUME FIELD (with unit conversion)
// ============================================================================

export const VolumeField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
  compact,
}) => (
  <FieldWrapper field={field} error={error} compact={compact}>
    <VolumeInput
      label=""
      value={value}
      onChange={onChange}
      showConversionHint={!compact}
    />
  </FieldWrapper>
);

// ============================================================================
// CHECKBOX FIELD
// ============================================================================

export const CheckboxField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  error,
  isSubmitting,
}) => (
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e) => onChange(e.target.checked)}
      disabled={isSubmitting}
      className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
    />
    <label className="text-sm text-zinc-300">{field.label}</label>
    {error && <span className={errorTextStyles}>{error}</span>}
  </div>
);

// ============================================================================
// DATE FIELD
// ============================================================================

export const DateField: React.FC<FieldRenderProps & { compact?: boolean }> = ({
  field,
  value,
  onChange,
  onBlur,
  error,
  isSubmitting,
  compact,
}) => {
  // Convert Date to string for input
  const dateValue = value instanceof Date
    ? value.toISOString().split('T')[0]
    : value || '';

  return (
    <FieldWrapper field={field} error={error} compact={compact}>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        onBlur={onBlur}
        disabled={isSubmitting}
        className={`${compact ? compactInputStyles : baseInputStyles} ${error ? errorInputStyles : ''}`}
      />
    </FieldWrapper>
  );
};

// ============================================================================
// FIELD REGISTRY - Maps field types to components
// ============================================================================

export type FieldComponent = React.FC<FieldRenderProps & { compact?: boolean }>;

export const FieldRegistry: Record<FieldType, FieldComponent> = {
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  select: SelectField,
  multiselect: SelectField, // TODO: Implement proper multiselect
  rating: RatingField,
  slider: SliderField,
  date: DateField,
  datetime: DateField, // TODO: Implement datetime picker
  images: ImagesField,
  weight: WeightField,
  volume: VolumeField,
  temperature: NumberField, // TODO: Implement temperature with conversion
  currency: NumberField, // TODO: Implement currency input
  checkbox: CheckboxField,
  radio: SelectField, // TODO: Implement radio buttons
  'entity-select': SelectField, // TODO: Implement entity selector
  custom: () => null, // Custom uses render prop
};

// ============================================================================
// GET FIELD COMPONENT
// ============================================================================

export const getFieldComponent = (type: FieldType): FieldComponent => {
  return FieldRegistry[type] || TextField;
};

export default FieldRegistry;
