// ============================================================================
// ENTITY FORM MODAL - Modal wrapper that displays the appropriate entity form
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useCreation, useEntityForm, CreatableEntityType, CreationResult, ENTITY_CONFIGS } from '../../store/CreationContext';
import { useData } from '../../store';
import { Portal } from '../common';
import { StrainForm } from './StrainForm';
import { LocationForm } from './LocationForm';
import { ContainerForm } from './ContainerForm';
import { SupplierForm } from './SupplierForm';
import { GrainTypeForm } from './GrainTypeForm';
import { SubstrateTypeForm } from './SubstrateTypeForm';
import { RecipeCategoryForm } from './RecipeCategoryForm';
import { LocationTypeForm } from './LocationTypeForm';
import { LocationClassificationForm } from './LocationClassificationForm';
import { InventoryItemForm } from './InventoryItemForm';
import { InventoryCategoryForm } from './InventoryCategoryForm';
import { RecipeForm } from './RecipeForm';

// Icons
const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="15 18 9 12 15 6"/></svg>,
  Stack: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/></svg>,
};

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  onClose,
}) => {
  const creation = useCreation();
  const data = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const currentDraft = creation.currentDraft;
  const entityType = currentDraft?.entityType;

  // Clear validation errors when form data changes
  useEffect(() => {
    if (currentDraft) {
      setValidationErrors({});
    }
  }, [currentDraft?.formData]);

  if (!isOpen || !currentDraft || !entityType) {
    return null;
  }

  const config = ENTITY_CONFIGS[entityType];
  const formData = currentDraft.formData;

  // Handle form data change
  const handleFormChange = (updates: Record<string, any>) => {
    creation.updateDraft(currentDraft.id, updates);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    config.requiredFields.forEach(field => {
      const value = formData[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = 'This field is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let result: CreationResult | null = null;

      // Create the entity based on type
      switch (entityType) {
        case 'strain': {
          const newEntity = await data.addStrain({
            name: formData.name,
            species: formData.species || 'Unknown',
            speciesId: formData.speciesId,
            difficulty: formData.difficulty || 'intermediate',
            colonizationDays: formData.colonizationDays || { min: 14, max: 21 },
            fruitingDays: formData.fruitingDays || { min: 7, max: 14 },
            optimalTempColonization: formData.optimalTempColonization || { min: 21, max: 27 },
            optimalTempFruiting: formData.optimalTempFruiting || { min: 18, max: 24 },
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'strain' };
          break;
        }

        case 'location': {
          // Comprehensive location creation with all fields from canonical LocationForm
          const newEntity = await data.addLocation({
            name: formData.name,
            level: formData.level || 'zone',
            parentId: formData.parentId || undefined,
            roomPurposes: formData.roomPurposes || [],
            roomPurpose: formData.roomPurposes?.[0], // Legacy single purpose
            capacity: formData.capacity,
            code: formData.code,
            tempRange: formData.tempRange,
            humidityRange: formData.humidityRange,
            description: formData.description,
            notes: formData.notes,
            path: formData.parentId
              ? `${data.state.locations.find(l => l.id === formData.parentId)?.name || ''} > ${formData.name}`
              : formData.name,
            sortOrder: data.state.locations.length + 1,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'location' };
          break;
        }

        case 'container': {
          const newEntity = await data.addContainer({
            name: formData.name,
            category: formData.category || 'jar',
            volumeMl: formData.volumeMl,
            dimensions: formData.dimensions,
            isReusable: formData.isReusable ?? true,
            isSterilizable: formData.isSterilizable ?? (formData.isReusable ?? true),
            usageContext: formData.usageContext || ['culture', 'grow'],
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'container' };
          break;
        }

        case 'supplier': {
          const newEntity = await data.addSupplier({
            name: formData.name,
            website: formData.website,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'supplier' };
          break;
        }

        case 'grainType': {
          const newEntity = await data.addGrainType({
            name: formData.name,
            code: formData.code || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10),
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'grainType' };
          break;
        }

        case 'substrateType': {
          const newEntity = await data.addSubstrateType({
            name: formData.name,
            code: formData.code || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10),
            category: formData.category || 'bulk',
            spawnRateRange: formData.spawnRateRange || { min: 5, optimal: 10, max: 20 },
            fieldCapacity: formData.fieldCapacity,
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'substrateType' };
          break;
        }


        case 'recipeCategory': {
          const newEntity = await data.addRecipeCategory({
            name: formData.name,
            code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            icon: formData.icon || '📦',
            color: formData.color || 'text-zinc-400 bg-zinc-800',
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'recipeCategory' };
          break;
        }

        case 'locationType': {
          const newEntity = await data.addLocationType({
            name: formData.name,
            code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            description: formData.description,
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'locationType' };
          break;
        }

        case 'locationClassification': {
          const newEntity = await data.addLocationClassification({
            name: formData.name,
            code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            description: formData.description,
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'locationClassification' };
          break;
        }

        case 'inventoryItem': {
          const newEntity = await data.addInventoryItem({
            name: formData.name,
            categoryId: formData.categoryId || '',
            sku: formData.sku,
            quantity: 0,  // Items start with 0 quantity - stock is added via lots
            unit: formData.unit || 'ea',
            unitCost: formData.unitCost || 0,
            reorderPoint: formData.reorderPoint || 0,
            reorderQty: formData.reorderQty || 0,
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'inventoryItem' };
          break;
        }

        case 'inventoryCategory': {
          const newEntity = await data.addInventoryCategory({
            name: formData.name,
            color: formData.color || 'text-zinc-400 bg-zinc-800',
            icon: formData.icon,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'inventoryCategory' };
          break;
        }

        case 'recipe': {
          const newEntity = await data.addRecipe({
            name: formData.name,
            category: formData.category || 'agar',
            description: formData.description || '',
            yield: formData.yield || { amount: 500, unit: 'ml' },
            prepTime: formData.prepTime,
            sterilizationTime: formData.sterilizationTime,
            sterilizationPsi: formData.sterilizationPsi,
            ingredients: formData.ingredients || [],
            instructions: formData.instructions || [],
            tips: formData.tips || [],
            notes: formData.notes,
            isActive: true,
          });
          result = { id: newEntity.id, name: newEntity.name, entityType: 'recipe' };
          break;
        }

        default:
          console.error(`Unknown entity type: ${entityType}`);
          return;
      }

      if (result) {
        // Complete the creation and return to parent draft (if any)
        const parentDraft = creation.completeCreation(currentDraft.id, result);

        // If no parent draft, close the modal
        if (!parentDraft) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to create entity:', error);
      setValidationErrors({ _form: 'Failed to create. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const parentDraft = creation.cancelCreation(currentDraft.id);
    if (!parentDraft) {
      onClose();
    }
  };

  // Handle going back (for nested creation)
  const handleBack = () => {
    creation.cancelCreation(currentDraft.id);
  };

  // Render the appropriate form
  const renderForm = () => {
    switch (entityType) {
      case 'strain':
        return (
          <StrainForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
            species={data.state.species}
          />
        );
      case 'location':
        return (
          <LocationForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'container':
        return (
          <ContainerForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'supplier':
        return (
          <SupplierForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'grainType':
        return (
          <GrainTypeForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'substrateType':
        return (
          <SubstrateTypeForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'recipeCategory':
        return (
          <RecipeCategoryForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'locationType':
        return (
          <LocationTypeForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'locationClassification':
        return (
          <LocationClassificationForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'inventoryItem':
        return (
          <InventoryItemForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'inventoryCategory':
        return (
          <InventoryCategoryForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
          />
        );
      case 'recipe':
        return (
          <RecipeForm
            data={formData as any}
            onChange={handleFormChange}
            errors={validationErrors}
            recipeCategories={data.state.recipeCategories}
          />
        );
      default:
        return <div className="text-zinc-400">Unknown entity type: {entityType}</div>;
    }
  };

  // Dynamic z-index based on stack depth to ensure nested modals appear above parent modals
  // Base z-index is 100 (above page-level modals at z-50), plus 10 for each nesting level
  const zIndex = 100 + (creation.stackDepth - 1) * 10;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto" style={{ zIndex }}>
        <div className="bg-zinc-900 w-full sm:max-w-lg border-t sm:border border-zinc-700 rounded-t-2xl sm:rounded-xl max-h-[95vh] sm:max-h-[90vh] flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {creation.stackDepth > 1 && (
              <button
                onClick={handleBack}
                className="p-2.5 min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center"
                title="Back to previous form"
              >
                <Icons.ChevronLeft />
              </button>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {currentDraft.label || `New ${config.label}`}
              </h3>
              {creation.stackDepth > 1 && (
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                  <Icons.Stack />
                  <span>Creating for {creation.draftStack[creation.stackDepth - 2]?.label}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2.5 min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center"
          >
            <Icons.X />
          </button>
        </div>

        {/* Breadcrumb for nested creation */}
        {creation.stackDepth > 1 && (
          <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-xs">
              {creation.draftStack.map((draft, index) => (
                <React.Fragment key={draft.id}>
                  {index > 0 && <span className="text-zinc-600">/</span>}
                  <span className={index === creation.stackDepth - 1 ? 'text-emerald-400' : 'text-zinc-500'}>
                    {draft.label || `New ${ENTITY_CONFIGS[draft.entityType].label}`}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Form content */}
        <div className="flex-1 overflow-y-auto p-4">
          {validationErrors._form && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-400 text-sm">
              {validationErrors._form}
            </div>
          )}
          {renderForm()}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 hidden sm:block">
            {config.requiredFields.length > 0 && (
              <span>* Required fields</span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 min-h-[48px] bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 min-h-[48px] bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                `Create ${config.label}`
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </Portal>
  );
};

export default EntityFormModal;
