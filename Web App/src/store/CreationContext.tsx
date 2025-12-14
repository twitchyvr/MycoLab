// ============================================================================
// CREATION CONTEXT - Manages draft stack for nested entity creation
// ============================================================================
//
// This context enables a "draft and navigate" workflow where:
// 1. User is filling out a form (e.g., New Culture)
// 2. They need to create a related entity (e.g., new Vessel)
// 3. Current form is saved as draft, new entity form opens
// 4. After creating the entity, user returns to their draft
// 5. The newly created entity is auto-selected in the appropriate field
//
// This can be nested multiple levels deep (Culture -> Vessel -> Supplier)
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

// All entity types that can be created
export type CreatableEntityType =
  | 'culture'
  | 'grow'
  | 'recipe'
  | 'strain'
  | 'location'
  | 'vessel'
  | 'supplier'
  | 'grainType'
  | 'substrateType'
  | 'containerType'
  | 'inventoryItem'
  | 'inventoryLot'
  | 'inventoryCategory'
  | 'recipeCategory'
  | 'locationType'
  | 'locationClassification';

// A single entry in the draft stack
export interface DraftEntry {
  id: string;                          // Unique ID for this draft
  entityType: CreatableEntityType;     // What type of entity is being created
  formData: Record<string, any>;       // Current form state
  fieldToFill?: string;                // Which field triggered "Add New" (for auto-selection)
  parentDraftId?: string;              // Reference to parent draft (for tracking hierarchy)
  createdAt: Date;                     // When this draft was created
  label?: string;                      // Human-readable label (e.g., "New Culture")
}

// Result returned when an entity is created
export interface CreationResult {
  id: string;                          // ID of the newly created entity
  name: string;                        // Name/label for display
  entityType: CreatableEntityType;     // What was created
}

// Configuration for entity types
export interface EntityTypeConfig {
  label: string;                       // Display name (e.g., "Vessel")
  labelPlural: string;                 // Plural form (e.g., "Vessels")
  requiredFields: string[];            // Fields that must be filled
  defaultValues: Record<string, any>;  // Default form values
}

// Context value shape
export interface CreationContextValue {
  // State
  draftStack: DraftEntry[];
  currentDraft: DraftEntry | null;
  isCreating: boolean;                 // Whether any creation form is open
  stackDepth: number;                  // How deep we are in nested creation

  // Actions
  startCreation: (
    entityType: CreatableEntityType,
    options?: {
      fieldToFill?: string;
      initialData?: Record<string, any>;
      label?: string;
    }
  ) => string;                         // Returns draft ID

  updateDraft: (
    draftId: string,
    formData: Record<string, any>
  ) => void;

  completeCreation: (
    draftId: string,
    result: CreationResult
  ) => DraftEntry | null;              // Returns parent draft if exists

  cancelCreation: (
    draftId?: string                   // If not provided, cancels current
  ) => DraftEntry | null;              // Returns parent draft if exists

  getDraft: (draftId: string) => DraftEntry | null;

  clearAllDrafts: () => void;

  // Utility
  getEntityConfig: (entityType: CreatableEntityType) => EntityTypeConfig;

  // Event handlers - called when creation completes
  onCreationComplete?: (result: CreationResult, parentDraft: DraftEntry | null) => void;
}

// ============================================================================
// ENTITY CONFIGURATIONS
// ============================================================================

export const ENTITY_CONFIGS: Record<CreatableEntityType, EntityTypeConfig> = {
  culture: {
    label: 'Culture',
    labelPlural: 'Cultures',
    requiredFields: ['strainId', 'locationId', 'vesselId'],
    defaultValues: {
      type: 'agar',
      status: 'colonizing',
      generation: 0,
      healthRating: 5,
      cost: 0,
      notes: '',
    },
  },
  grow: {
    label: 'Grow',
    labelPlural: 'Grows',
    requiredFields: ['strainId', 'substrateTypeId', 'containerTypeId', 'locationId'],
    defaultValues: {
      status: 'active',
      currentStage: 'spawning',
      spawnWeight: 500,
      substrateWeight: 2000,
      containerCount: 1,
      targetTempColonization: 24,
      targetTempFruiting: 22,
      targetHumidity: 90,
      estimatedCost: 0,
      notes: '',
    },
  },
  recipe: {
    label: 'Recipe',
    labelPlural: 'Recipes',
    requiredFields: ['name', 'category'],
    defaultValues: {
      category: 'agar',
      description: '',
      yield: { amount: 500, unit: 'ml' },
      prepTime: 15,
      sterilizationTime: 45,
      sterilizationPsi: 15,
      ingredients: [],
      instructions: [],
      tips: [],
      notes: '',
      isActive: true,
    },
  },
  strain: {
    label: 'Strain',
    labelPlural: 'Strains',
    requiredFields: ['name', 'species'],
    defaultValues: {
      species: '',
      difficulty: 'intermediate',
      colonizationDays: { min: 14, max: 21 },
      fruitingDays: { min: 7, max: 14 },
      optimalTempColonization: { min: 21, max: 27 },
      optimalTempFruiting: { min: 18, max: 24 },
      notes: '',
      isActive: true,
    },
  },
  location: {
    label: 'Location',
    labelPlural: 'Locations',
    requiredFields: ['name'],
    defaultValues: {
      type: 'storage',
      notes: '',
      isActive: true,
    },
  },
  vessel: {
    label: 'Vessel',
    labelPlural: 'Vessels',
    requiredFields: ['name', 'type'],
    defaultValues: {
      type: 'jar',
      isReusable: true,
      notes: '',
      isActive: true,
    },
  },
  supplier: {
    label: 'Supplier',
    labelPlural: 'Suppliers',
    requiredFields: ['name'],
    defaultValues: {
      website: '',
      email: '',
      phone: '',
      notes: '',
      isActive: true,
    },
  },
  grainType: {
    label: 'Grain Type',
    labelPlural: 'Grain Types',
    requiredFields: ['name'],
    defaultValues: {
      code: '',
      notes: '',
      isActive: true,
    },
  },
  substrateType: {
    label: 'Substrate Type',
    labelPlural: 'Substrate Types',
    requiredFields: ['name', 'category'],
    defaultValues: {
      code: '',
      category: 'bulk',
      notes: '',
      isActive: true,
    },
  },
  containerType: {
    label: 'Container Type',
    labelPlural: 'Container Types',
    requiredFields: ['name', 'category'],
    defaultValues: {
      category: 'tub',
      notes: '',
      isActive: true,
    },
  },
  inventoryItem: {
    label: 'Inventory Item',
    labelPlural: 'Inventory Items',
    requiredFields: ['name'],
    defaultValues: {
      categoryId: '',
      quantity: 0,
      unit: 'ea',
      reorderPoint: 0,
      notes: '',
      isActive: true,
    },
  },
  inventoryLot: {
    label: 'Stock Lot',
    labelPlural: 'Stock Lots',
    requiredFields: ['inventoryItemId', 'quantity'],
    defaultValues: {
      unit: 'g',
      status: 'available',
      notes: '',
    },
  },
  inventoryCategory: {
    label: 'Inventory Category',
    labelPlural: 'Inventory Categories',
    requiredFields: ['name'],
    defaultValues: {
      color: 'text-zinc-400 bg-zinc-800',
      icon: '',
      notes: '',
      isActive: true,
    },
  },
  recipeCategory: {
    label: 'Recipe Category',
    labelPlural: 'Recipe Categories',
    requiredFields: ['name'],
    defaultValues: {
      code: '',
      icon: '📦',
      color: 'text-zinc-400 bg-zinc-800',
      isActive: true,
    },
  },
  locationType: {
    label: 'Location Type',
    labelPlural: 'Location Types',
    requiredFields: ['name'],
    defaultValues: {
      code: '',
      description: '',
      notes: '',
      isActive: true,
    },
  },
  locationClassification: {
    label: 'Location Classification',
    labelPlural: 'Location Classifications',
    requiredFields: ['name'],
    defaultValues: {
      code: '',
      description: '',
      notes: '',
      isActive: true,
    },
  },
};

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const DRAFT_STACK_KEY = 'mycolab-creation-draft-stack';

// ============================================================================
// CONTEXT
// ============================================================================

const CreationContext = createContext<CreationContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export const CreationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage
  const [draftStack, setDraftStack] = useState<DraftEntry[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STACK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
        }));
      }
    } catch (e) {
      console.error('Failed to load draft stack from localStorage:', e);
    }
    return [];
  });

  // Persist to localStorage whenever stack changes
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STACK_KEY, JSON.stringify(draftStack));
    } catch (e) {
      console.error('Failed to save draft stack to localStorage:', e);
    }
  }, [draftStack]);

  // Computed values
  const currentDraft = draftStack.length > 0 ? draftStack[draftStack.length - 1] : null;
  const isCreating = draftStack.length > 0;
  const stackDepth = draftStack.length;

  // Generate unique ID for drafts
  const generateDraftId = useCallback(() => {
    return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Start creating a new entity
  const startCreation = useCallback((
    entityType: CreatableEntityType,
    options?: {
      fieldToFill?: string;
      initialData?: Record<string, any>;
      label?: string;
    }
  ): string => {
    const config = ENTITY_CONFIGS[entityType];
    const draftId = generateDraftId();

    const newDraft: DraftEntry = {
      id: draftId,
      entityType,
      formData: {
        ...config.defaultValues,
        ...options?.initialData,
      },
      fieldToFill: options?.fieldToFill,
      parentDraftId: currentDraft?.id,
      createdAt: new Date(),
      label: options?.label || `New ${config.label}`,
    };

    setDraftStack(prev => [...prev, newDraft]);
    return draftId;
  }, [currentDraft, generateDraftId]);

  // Update a draft's form data
  const updateDraft = useCallback((draftId: string, formData: Record<string, any>) => {
    setDraftStack(prev => prev.map(draft =>
      draft.id === draftId
        ? { ...draft, formData: { ...draft.formData, ...formData } }
        : draft
    ));
  }, []);

  // Complete creation and return to parent
  const completeCreation = useCallback((
    draftId: string,
    result: CreationResult
  ): DraftEntry | null => {
    const draftIndex = draftStack.findIndex(d => d.id === draftId);
    if (draftIndex === -1) return null;

    const completedDraft = draftStack[draftIndex];
    const parentDraft = draftIndex > 0 ? draftStack[draftIndex - 1] : null;

    // If there's a parent draft and a field to fill, update the parent
    if (parentDraft && completedDraft.fieldToFill) {
      setDraftStack(prev => {
        const newStack = prev.slice(0, draftIndex); // Remove completed draft and anything after
        // Update parent with the new entity's ID
        if (newStack.length > 0) {
          const parentIndex = newStack.length - 1;
          newStack[parentIndex] = {
            ...newStack[parentIndex],
            formData: {
              ...newStack[parentIndex].formData,
              [completedDraft.fieldToFill!]: result.id,
            },
          };
        }
        return newStack;
      });
    } else {
      // Just remove the completed draft
      setDraftStack(prev => prev.slice(0, draftIndex));
    }

    return parentDraft;
  }, [draftStack]);

  // Cancel creation
  const cancelCreation = useCallback((draftId?: string): DraftEntry | null => {
    const targetId = draftId || currentDraft?.id;
    if (!targetId) return null;

    const draftIndex = draftStack.findIndex(d => d.id === targetId);
    if (draftIndex === -1) return null;

    const parentDraft = draftIndex > 0 ? draftStack[draftIndex - 1] : null;

    // Remove this draft and anything after it
    setDraftStack(prev => prev.slice(0, draftIndex));

    return parentDraft;
  }, [draftStack, currentDraft]);

  // Get a specific draft
  const getDraft = useCallback((draftId: string): DraftEntry | null => {
    return draftStack.find(d => d.id === draftId) || null;
  }, [draftStack]);

  // Clear all drafts
  const clearAllDrafts = useCallback(() => {
    setDraftStack([]);
  }, []);

  // Get entity config
  const getEntityConfig = useCallback((entityType: CreatableEntityType): EntityTypeConfig => {
    return ENTITY_CONFIGS[entityType];
  }, []);

  const value: CreationContextValue = {
    draftStack,
    currentDraft,
    isCreating,
    stackDepth,
    startCreation,
    updateDraft,
    completeCreation,
    cancelCreation,
    getDraft,
    clearAllDrafts,
    getEntityConfig,
  };

  return (
    <CreationContext.Provider value={value}>
      {children}
    </CreationContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useCreation = (): CreationContextValue => {
  const context = useContext(CreationContext);
  if (!context) {
    throw new Error('useCreation must be used within a CreationProvider');
  }
  return context;
};

// ============================================================================
// HELPER HOOK - For forms that use this context
// ============================================================================

export interface UseEntityFormOptions {
  entityType: CreatableEntityType;
  draftId?: string;
  onComplete?: (result: CreationResult) => void;
  onCancel?: () => void;
}

export const useEntityForm = (options: UseEntityFormOptions) => {
  const { entityType, draftId, onComplete, onCancel } = options;
  const creation = useCreation();

  // Get or create draft
  const draft = draftId ? creation.getDraft(draftId) : creation.currentDraft;
  const config = creation.getEntityConfig(entityType);

  // Form data from draft or defaults
  const formData = draft?.formData || config.defaultValues;

  // Check if form is valid
  const isValid = config.requiredFields.every(field => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  });

  // Get missing required fields
  const missingFields = config.requiredFields.filter(field => {
    const value = formData[field];
    return value === undefined || value === null || value === '';
  });

  // Update form data
  const updateFormData = useCallback((updates: Record<string, any>) => {
    if (draft) {
      creation.updateDraft(draft.id, updates);
    }
  }, [draft, creation]);

  // Handle field change
  const handleFieldChange = useCallback((field: string, value: any) => {
    updateFormData({ [field]: value });
  }, [updateFormData]);

  // Handle completion
  const handleComplete = useCallback((result: CreationResult) => {
    if (draft) {
      const parentDraft = creation.completeCreation(draft.id, result);
      onComplete?.(result);
      return parentDraft;
    }
    return null;
  }, [draft, creation, onComplete]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (draft) {
      creation.cancelCreation(draft.id);
    }
    onCancel?.();
  }, [draft, creation, onCancel]);

  // Start nested creation (for "Add New" in dropdowns)
  const startNestedCreation = useCallback((
    nestedEntityType: CreatableEntityType,
    fieldToFill: string,
    initialData?: Record<string, any>
  ) => {
    return creation.startCreation(nestedEntityType, {
      fieldToFill,
      initialData,
    });
  }, [creation]);

  return {
    draft,
    formData,
    config,
    isValid,
    missingFields,
    updateFormData,
    handleFieldChange,
    handleComplete,
    handleCancel,
    startNestedCreation,
    stackDepth: creation.stackDepth,
    isNested: creation.stackDepth > 1,
  };
};

export default CreationContext;
