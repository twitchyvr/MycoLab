// ============================================================================
// FORM ENGINE - Schema-Driven Form Controller
// Generates forms from schemas using the Field Registry
// Provides consistent look and feel across the entire app
// ============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  FormSchema,
  FormEngineProps,
  FormState,
  FormContext,
  FieldDefinition,
  FieldRenderProps,
} from './schema/types';
import { getFieldComponent } from './fields';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

// ============================================================================
// VALIDATION
// ============================================================================

const validateField = (
  field: FieldDefinition,
  value: any,
  formData: Record<string, any>
): string | null => {
  const { validation } = field;
  if (!validation) return null;

  // Required check
  if (validation.required) {
    if (value === undefined || value === null || value === '') {
      return `${field.label} is required`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${field.label} is required`;
    }
  }

  // Skip other validations if empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (validation.minLength && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value.length > validation.maxLength) {
      return `${field.label} must be at most ${validation.maxLength} characters`;
    }
    if (validation.pattern && !validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      return `${field.label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && value > validation.max) {
      return `${field.label} must be at most ${validation.max}`;
    }
  }

  // Custom validation
  if (validation.custom) {
    return validation.custom(value, formData);
  }

  return null;
};

const validateForm = (
  schema: FormSchema,
  values: Record<string, any>,
  context: FormContext
): Record<string, string> => {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    // Skip hidden fields
    if (field.visible && !field.visible(values, context)) {
      continue;
    }

    const error = validateField(field, values[field.name], values);
    if (error) {
      errors[field.name] = error;
    }
  }

  // Schema-level validation
  if (schema.validate) {
    const schemaErrors = schema.validate(values, context);
    if (schemaErrors) {
      Object.assign(errors, schemaErrors);
    }
  }

  return errors;
};

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

interface FormSectionProps {
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  collapsible,
  defaultCollapsed,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div className="border-b border-zinc-800 pb-2">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {description && <p className="text-xs text-zinc-500 mt-1">{description}</p>}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded-lg">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-800/50"
      >
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {description && <p className="text-xs text-zinc-500">{description}</p>}
        </div>
        <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          <Icons.ChevronDown />
        </span>
      </button>
      {!isCollapsed && <div className="p-3 pt-0 space-y-3">{children}</div>}
    </div>
  );
};

// ============================================================================
// FORM ENGINE COMPONENT
// ============================================================================

export const FormEngine: React.FC<FormEngineProps> = ({
  schema,
  initialData,
  context = {},
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  showCancel = true,
  submitLabel = 'Save',
  compact = false,
  className = '',
}) => {
  // Initialize form state
  const [state, setState] = useState<FormState>(() => {
    const defaultValues = { ...schema.defaultValues };

    // Apply field-level defaults
    for (const field of schema.fields) {
      if (field.defaultValue !== undefined && defaultValues[field.name] === undefined) {
        defaultValues[field.name] = field.defaultValue;
      }
    }

    // Override with initial data
    const values = { ...defaultValues, ...initialData };

    return {
      values,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    };
  });

  // Reset form when schema or initialData changes
  useEffect(() => {
    const defaultValues = { ...schema.defaultValues };
    for (const field of schema.fields) {
      if (field.defaultValue !== undefined && defaultValues[field.name] === undefined) {
        defaultValues[field.name] = field.defaultValue;
      }
    }
    const values = { ...defaultValues, ...initialData };
    setState({
      values,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [schema.id, initialData]);

  // Handle field change
  const handleChange = useCallback((fieldName: string, value: any) => {
    setState((prev) => {
      const newValues = { ...prev.values, [fieldName]: value };
      const field = schema.fields.find((f) => f.name === fieldName);

      // Clear error on change
      const newErrors = { ...prev.errors };
      delete newErrors[fieldName];

      // Validate if already touched
      if (prev.touched[fieldName] && field) {
        const error = validateField(field, value, newValues);
        if (error) {
          newErrors[fieldName] = error;
        }
      }

      return {
        ...prev,
        values: newValues,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [schema.fields]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: string) => {
    setState((prev) => {
      const newTouched = { ...prev.touched, [fieldName]: true };
      const field = schema.fields.find((f) => f.name === fieldName);

      // Validate on blur
      const newErrors = { ...prev.errors };
      if (field) {
        const error = validateField(field, prev.values[fieldName], prev.values);
        if (error) {
          newErrors[fieldName] = error;
        } else {
          delete newErrors[fieldName];
        }
      }

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [schema.fields]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate all fields
    const errors = validateForm(schema, state.values, context);

    // Mark all fields as touched
    const touched: Record<string, boolean> = {};
    for (const field of schema.fields) {
      touched[field.name] = true;
    }

    if (Object.keys(errors).length > 0) {
      setState((prev) => ({
        ...prev,
        errors,
        touched,
        isValid: false,
      }));
      return;
    }

    // Transform data if needed
    let submitData = state.values;
    if (schema.transformBeforeSubmit) {
      submitData = schema.transformBeforeSubmit(state.values, context);
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(submitData);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [schema, state.values, context, onSubmit]);

  // Get visible fields
  const visibleFields = useMemo(() => {
    return schema.fields.filter((field) => {
      if (!field.visible) return true;
      return field.visible(state.values, context);
    });
  }, [schema.fields, state.values, context]);

  // Render a single field
  const renderField = (field: FieldDefinition) => {
    const FieldComponent = field.type === 'custom' && field.render
      ? () => field.render!({
          field,
          value: state.values[field.name],
          onChange: (v) => handleChange(field.name, v),
          onBlur: () => handleBlur(field.name),
          error: state.errors[field.name],
          touched: state.touched[field.name] || false,
          isSubmitting: state.isSubmitting || isLoading,
          context,
          formData: state.values,
        })
      : getFieldComponent(field.type);

    const isDisabled = field.disabled
      ? field.disabled(state.values, context)
      : false;

    const renderProps: FieldRenderProps = {
      field: { ...field, disabled: () => isDisabled },
      value: state.values[field.name],
      onChange: (v) => handleChange(field.name, v),
      onBlur: () => handleBlur(field.name),
      error: state.errors[field.name],
      touched: state.touched[field.name] || false,
      isSubmitting: state.isSubmitting || isLoading,
      context,
      formData: state.values,
    };

    return (
      <FieldComponent
        key={field.name}
        {...renderProps}
        compact={compact}
      />
    );
  };

  // Render fields by section or flat
  const renderFields = () => {
    if (schema.sections && schema.sections.length > 0) {
      return schema.sections
        .filter((section) => !section.visible || section.visible(state.values, context))
        .map((section) => {
          const sectionFields = visibleFields.filter((f) =>
            section.fields.includes(f.name)
          );
          if (sectionFields.length === 0) return null;

          return (
            <FormSection
              key={section.id}
              title={section.title}
              description={section.description}
              collapsible={section.collapsible}
              defaultCollapsed={section.defaultCollapsed}
            >
              {sectionFields.map(renderField)}
            </FormSection>
          );
        });
    }

    return visibleFields.map(renderField);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-${compact ? '3' : '4'} ${className}`}
    >
      {/* Form Title/Description */}
      {!compact && schema.description && (
        <p className="text-sm text-zinc-400 mb-4">{schema.description}</p>
      )}

      {/* Fields */}
      <div className={`space-y-${compact ? '3' : '4'}`}>
        {renderFields()}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`p-${compact ? '2' : '3'} rounded-lg bg-red-950/50 border border-red-800 text-red-400 text-sm`}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex gap-${compact ? '2' : '3'} pt-2`}>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={state.isSubmitting || isLoading}
            className={`
              flex-1 ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg
              bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50
              text-white font-medium transition-colors
            `}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={state.isSubmitting || isLoading}
          className={`
            ${showCancel && onCancel ? 'flex-1' : 'w-full'}
            ${compact ? 'py-2 text-sm' : 'py-3'} rounded-lg
            bg-emerald-500 hover:bg-emerald-600
            disabled:bg-zinc-700 disabled:text-zinc-500
            text-white font-medium transition-colors
            flex items-center justify-center gap-2
          `}
        >
          {state.isSubmitting || isLoading ? (
            <span>Saving...</span>
          ) : (
            <>
              <Icons.Check />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// ============================================================================
// MODAL WRAPPER FOR FORM ENGINE
// ============================================================================

interface FormModalProps extends FormEngineProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  schema,
  ...formProps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {title || schema.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <FormEngine
            schema={schema}
            {...formProps}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default FormEngine;
