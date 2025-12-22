// ============================================================================
// SCHEMA-DRIVEN COMPOUND FACTORY (SDCF) - TYPE DEFINITIONS
// Canonical schema types that define form structures across the app
// ============================================================================

import type { Culture, Grow, CultureObservation, GrowObservation } from '../../../store/types';

// ============================================================================
// FIELD TYPES
// ============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'rating'        // 1-5 health/quality rating
  | 'slider'        // Percentage/range slider
  | 'date'
  | 'datetime'
  | 'images'        // Image uploader
  | 'weight'        // Weight with unit conversion
  | 'volume'        // Volume with unit conversion
  | 'temperature'   // Temperature with unit conversion
  | 'currency'      // Currency input
  | 'checkbox'
  | 'radio'
  | 'entity-select' // Select from existing entities (cultures, grows, etc.)
  | 'custom';       // Custom component via render prop

// ============================================================================
// FIELD DEFINITION
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData: Record<string, any>) => string | null;
}

export interface FieldDefinition {
  /** Unique field identifier (matches data key) */
  name: string;
  /** Display label */
  label: string;
  /** Field type determines which component renders */
  type: FieldType;
  /** Default value */
  defaultValue?: any;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below field */
  helpText?: string;
  /** Validation rules */
  validation?: FieldValidation;
  /** Options for select/radio/multiselect */
  options?: SelectOption[];
  /** Dynamic options based on form state or context */
  getOptions?: (context: FormContext) => SelectOption[];
  /** For rating type: min/max range */
  range?: [number, number];
  /** For images type: max image count */
  maxImages?: number;
  /** For images type: storage folder */
  imageFolder?: string;
  /** For weight/volume/temperature: default unit */
  defaultUnit?: string;
  /** For entity-select: entity type */
  entityType?: 'culture' | 'grow' | 'location' | 'strain' | 'recipe' | 'container';
  /** For entity-select: filter function */
  entityFilter?: (entity: any, context: FormContext) => boolean;
  /** Conditional visibility */
  visible?: (formData: Record<string, any>, context: FormContext) => boolean;
  /** Conditional disabled state */
  disabled?: (formData: Record<string, any>, context: FormContext) => boolean;
  /** Grid column span (1-12) */
  colSpan?: number;
  /** Custom render function for 'custom' type */
  render?: (props: FieldRenderProps) => React.ReactNode;
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

export interface FormSchema {
  /** Unique schema identifier */
  id: string;
  /** Display title for form */
  title: string;
  /** Optional description */
  description?: string;
  /** Field definitions in order */
  fields: FieldDefinition[];
  /** Form sections for grouping fields */
  sections?: FormSection[];
  /** Default values object */
  defaultValues?: Record<string, any>;
  /** Storage/database table (for persistence context) */
  tableName?: string;
  /** Transform data before submit */
  transformBeforeSubmit?: (data: Record<string, any>, context: FormContext) => Record<string, any>;
  /** Custom validation for entire form */
  validate?: (data: Record<string, any>, context: FormContext) => Record<string, string> | null;
}

export interface FormSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Field names in this section */
  fields: string[];
  /** Collapsible section */
  collapsible?: boolean;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Conditional visibility */
  visible?: (formData: Record<string, any>, context: FormContext) => boolean;
}

// ============================================================================
// FORM CONTEXT
// ============================================================================

export interface FormContext {
  /** Entity type being edited */
  entityType?: string;
  /** Existing entity data (for edit mode) */
  entity?: any;
  /** Parent entity (for nested forms) */
  parentEntity?: any;
  /** User settings (for units, etc.) */
  settings?: {
    defaultUnits?: 'metric' | 'imperial';
    defaultCurrency?: string;
    temperatureUnit?: 'celsius' | 'fahrenheit';
  };
  /** Any additional context data */
  [key: string]: any;
}

// ============================================================================
// FIELD RENDER PROPS
// ============================================================================

export interface FieldRenderProps {
  /** Field definition */
  field: FieldDefinition;
  /** Current field value */
  value: any;
  /** Change handler */
  onChange: (value: any) => void;
  /** Blur handler */
  onBlur: () => void;
  /** Error message if validation failed */
  error?: string;
  /** Whether field has been touched */
  touched: boolean;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Form context */
  context: FormContext;
  /** Full form data (for dependent fields) */
  formData: Record<string, any>;
}

// ============================================================================
// FORM ENGINE PROPS
// ============================================================================

export interface FormEngineProps {
  /** Form schema definition */
  schema: FormSchema;
  /** Initial data (for edit mode) */
  initialData?: Record<string, any>;
  /** Form context */
  context?: FormContext;
  /** Submit handler */
  onSubmit: (data: Record<string, any>) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** External error message */
  error?: string | null;
  /** Show cancel button */
  showCancel?: boolean;
  /** Submit button label */
  submitLabel?: string;
  /** Compact mode */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// FORM STATE
// ============================================================================

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// ENTITY-SPECIFIC CONTEXTS
// ============================================================================

export interface ObservationFormContext extends FormContext {
  entityType: 'culture' | 'grow';
  entity?: Culture | Grow;
}

export interface CultureFormContext extends FormContext {
  entityType: 'culture';
  parentCulture?: Culture;
}

export interface GrowFormContext extends FormContext {
  entityType: 'grow';
  sourceCulture?: Culture;
}
