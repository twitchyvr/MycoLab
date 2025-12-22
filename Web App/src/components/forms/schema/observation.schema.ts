// ============================================================================
// OBSERVATION SCHEMA - Canonical schema for logging observations
// Used for both culture and grow observations with consistent fields
// ============================================================================

import type { FormSchema, FormContext } from './types';

// ============================================================================
// OBSERVATION TYPES BY ENTITY
// ============================================================================

const CULTURE_OBSERVATION_TYPES = [
  { value: 'general', label: 'General', description: 'General note or update' },
  { value: 'growth', label: 'Growth', description: 'Growth progress observation' },
  { value: 'contamination', label: 'Contamination', description: 'Contamination detected' },
  { value: 'transfer', label: 'Transfer', description: 'Transfer recorded' },
  { value: 'harvest', label: 'Harvest', description: 'Harvest or sampling' },
];

const GROW_OBSERVATION_TYPES = [
  { value: 'general', label: 'General', description: 'General note or update' },
  { value: 'growth', label: 'Growth', description: 'Colonization or growth progress' },
  { value: 'contamination', label: 'Contamination', description: 'Contamination detected' },
  { value: 'milestone', label: 'Milestone', description: 'Stage transition or pins' },
  { value: 'harvest', label: 'Harvest', description: 'Harvest observation' },
  { value: 'environmental', label: 'Environmental', description: 'Temp, humidity, CO2' },
];

// ============================================================================
// CULTURE OBSERVATION SCHEMA
// ============================================================================

export const cultureObservationSchema: FormSchema = {
  id: 'culture-observation',
  title: 'Log Observation',
  description: 'Record an observation for this culture',
  tableName: 'culture_observations',

  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'general',
      options: CULTURE_OBSERVATION_TYPES,
      validation: { required: true },
      helpText: 'What type of observation is this?',
    },
    {
      name: 'healthRating',
      label: 'Health Rating',
      type: 'rating',
      range: [1, 5],
      defaultValue: 5,
      helpText: '1 = Critical, 5 = Excellent',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'What did you observe? Growth progress, appearance, changes...',
      validation: { required: true, minLength: 3 },
    },
    {
      name: 'images',
      label: 'Photos',
      type: 'images',
      imageFolder: 'culture-observations',
      maxImages: 5,
      helpText: 'Document visual changes with photos. Up to 5 images.',
    },
  ],

  defaultValues: {
    type: 'general',
    healthRating: 5,
    notes: '',
    images: [],
  },

  // Dynamic placeholder based on observation type
  transformBeforeSubmit: (data, context) => ({
    ...data,
    date: new Date(),
    entityType: 'culture',
    entityId: context.entity?.id,
  }),
};

// ============================================================================
// GROW OBSERVATION SCHEMA
// ============================================================================

export const growObservationSchema: FormSchema = {
  id: 'grow-observation',
  title: 'Log Observation',
  description: 'Record an observation for this grow',
  tableName: 'grow_observations',

  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      defaultValue: 'general',
      options: GROW_OBSERVATION_TYPES,
      validation: { required: true },
      helpText: 'What type of observation is this?',
    },
    {
      name: 'colonizationPercent',
      label: 'Colonization %',
      type: 'slider',
      defaultValue: 0,
      validation: { min: 0, max: 100 },
      visible: (formData) => ['growth', 'general'].includes(formData.type),
      helpText: 'Estimated percentage of substrate colonized',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'What did you observe? Growth progress, appearance, changes...',
      validation: { required: true, minLength: 3 },
    },
    {
      name: 'images',
      label: 'Photos',
      type: 'images',
      imageFolder: 'grow-observations',
      maxImages: 5,
      helpText: 'Document visual changes with photos. Up to 5 images.',
    },
  ],

  defaultValues: {
    type: 'general',
    colonizationPercent: 0,
    notes: '',
    images: [],
  },

  transformBeforeSubmit: (data, context) => ({
    ...data,
    date: new Date(),
    entityType: 'grow',
    entityId: context.entity?.id,
  }),
};

// ============================================================================
// UNIFIED OBSERVATION SCHEMA FACTORY
// Returns the appropriate schema based on entity type
// ============================================================================

export const getObservationSchema = (entityType: 'culture' | 'grow'): FormSchema => {
  return entityType === 'culture' ? cultureObservationSchema : growObservationSchema;
};

// ============================================================================
// CONTAMINATION WARNING
// Helper to check if observation indicates contamination
// ============================================================================

export const isContaminationObservation = (type: string): boolean => {
  return type === 'contamination';
};

export default {
  cultureObservationSchema,
  growObservationSchema,
  getObservationSchema,
};
