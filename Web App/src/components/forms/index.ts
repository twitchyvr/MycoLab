// ============================================================================
// FORMS INDEX - Export all entity forms
// ============================================================================

// Schema-Driven Compound Factory (SDCF) - Core Components
export { FormEngine, FormModal } from './FormEngine';
export { FieldRegistry, getFieldComponent, FieldWrapper } from './fields';
export * from './schema';

// Canonical Observation Form (uses SDCF internally)
export {
  ObservationForm,
  ObservationModal,
  getDefaultObservationFormData,
  type ObservationFormData,
  type ObservationEntityType,
} from './ObservationForm';

// Harvest Entry Form
export { HarvestEntryForm, getDefaultHarvestEntryData } from './HarvestEntryForm';
export type { HarvestEntryData } from './HarvestEntryForm';

// Entity Forms
export { StrainForm } from './StrainForm';
export type { StrainFormData } from './StrainForm';

export { LocationForm } from './LocationForm';
export type { LocationFormData } from './LocationForm';

export { ContainerForm } from './ContainerForm';
export type { ContainerFormData } from './ContainerForm';

// Legacy aliases for backward compatibility
/** @deprecated Use ContainerForm instead */
export { ContainerForm as VesselForm } from './ContainerForm';
/** @deprecated Use ContainerFormData instead */
export type { ContainerFormData as VesselFormData } from './ContainerForm';

export { SupplierForm } from './SupplierForm';
export type { SupplierFormData } from './SupplierForm';

export { GrainTypeForm } from './GrainTypeForm';
export type { GrainTypeFormData } from './GrainTypeForm';

export { SubstrateTypeForm } from './SubstrateTypeForm';
export type { SubstrateTypeFormData } from './SubstrateTypeForm';

// Legacy aliases for backward compatibility
/** @deprecated Use ContainerForm instead */
export { ContainerForm as ContainerTypeForm } from './ContainerForm';
/** @deprecated Use ContainerFormData instead */
export type { ContainerFormData as ContainerTypeFormData } from './ContainerForm';

export { RecipeCategoryForm } from './RecipeCategoryForm';

export { LocationTypeForm } from './LocationTypeForm';

export { LocationClassificationForm } from './LocationClassificationForm';

export { EntityFormModal } from './EntityFormModal';
