// ============================================================================
// WARNINGS EVALUATOR - Analyzes data and triggers contextual warnings
// Runs periodically or on data changes to detect issues
// ============================================================================

import { useEffect, useCallback } from 'react';
import { useData } from '../store';
import { useInfoOptional } from '../store/InfoContext';
import { differenceInDays, differenceInHours } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface WarningCondition {
  id: string;
  category: 'culture' | 'grow' | 'inventory' | 'data' | 'location' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  evaluate: (data: EvaluationData) => WarningResult[];
}

interface WarningResult {
  definitionId: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  message: string;
  resolution?: string;
  data?: Record<string, any>;
}

interface EvaluationData {
  cultures: any[];
  grows: any[];
  inventoryItems: any[];
  locations: any[];
  recipes: any[];
  isConnected: boolean;
  lastSync?: Date;
}

// ============================================================================
// WARNING CONDITIONS
// ============================================================================

const warningConditions: WarningCondition[] = [
  // Culture: Old Liquid Culture
  {
    id: 'culture-old-lc',
    category: 'culture',
    priority: 'medium',
    evaluate: (data) => {
      const results: WarningResult[] = [];
      const now = new Date();

      data.cultures
        .filter((c: any) => c.type === 'liquid_culture' && c.status === 'active')
        .forEach((culture: any) => {
          const createdAt = new Date(culture.createdAt);
          const ageInDays = differenceInDays(now, createdAt);

          if (ageInDays > 90) {
            results.push({
              definitionId: 'warn-culture-old-lc',
              entityType: 'culture',
              entityId: culture.id,
              entityLabel: culture.label || `LC ${culture.id.slice(-6)}`,
              message: `This liquid culture is ${ageInDays} days old. Consider refreshing to maintain viability.`,
              resolution: 'Transfer to fresh LC media or use within 2 weeks.',
              data: { ageInDays, priority: 'medium' },
            });
          }
        });

      return results;
    },
  },

  // Culture: High Generation
  {
    id: 'culture-high-gen',
    category: 'culture',
    priority: 'medium',
    evaluate: (data) => {
      const results: WarningResult[] = [];

      data.cultures
        .filter((c: any) => c.status === 'active' && (c.generation || 0) >= 5)
        .forEach((culture: any) => {
          results.push({
            definitionId: 'warn-culture-high-gen',
            entityType: 'culture',
            entityId: culture.id,
            entityLabel: culture.label || `Culture ${culture.id.slice(-6)}`,
            message: `This culture is generation ${culture.generation}. Watch for signs of decline.`,
            resolution: 'Consider refreshing from a frozen or earlier generation stock.',
            data: { generation: culture.generation, priority: 'medium' },
          });
        });

      return results;
    },
  },

  // Culture: Contaminated
  {
    id: 'culture-contamination',
    category: 'culture',
    priority: 'critical',
    evaluate: (data) => {
      const results: WarningResult[] = [];

      data.cultures
        .filter((c: any) => c.status === 'contaminated')
        .forEach((culture: any) => {
          results.push({
            definitionId: 'warn-culture-contamination',
            entityType: 'culture',
            entityId: culture.id,
            entityLabel: culture.label || `Culture ${culture.id.slice(-6)}`,
            message: 'This culture is contaminated. Do not use for transfers.',
            resolution: 'Dispose of contaminated cultures safely. Never open indoors.',
            data: { priority: 'critical' },
          });
        });

      return results;
    },
  },

  // Grow: Slow Colonization
  {
    id: 'grow-slow-colonization',
    category: 'grow',
    priority: 'medium',
    evaluate: (data) => {
      const results: WarningResult[] = [];
      const now = new Date();

      data.grows
        .filter((g: any) => g.currentStage === 'colonization' && g.status === 'active')
        .forEach((grow: any) => {
          // Check if we have a stage start date
          const stageStart = grow.stageHistory?.find((s: any) => s.stage === 'colonization')?.startedAt;
          if (stageStart) {
            const daysInStage = differenceInDays(now, new Date(stageStart));
            const expectedDays = 21; // Default expected colonization time

            if (daysInStage > expectedDays * 1.5) {
              results.push({
                definitionId: 'warn-grow-slow-colonization',
                entityType: 'grow',
                entityId: grow.id,
                entityLabel: grow.name || `Grow ${grow.id.slice(-6)}`,
                message: `This grow has been colonizing for ${daysInStage} days, which is longer than expected.`,
                resolution: 'Check temperature, moisture, and spawn rate. May need more FAE.',
                data: { daysInStage, expectedDays, priority: 'medium' },
              });
            }
          }
        });

      return results;
    },
  },

  // Grow: No Pins
  {
    id: 'grow-no-pins',
    category: 'grow',
    priority: 'medium',
    evaluate: (data) => {
      const results: WarningResult[] = [];
      const now = new Date();

      data.grows
        .filter((g: any) => g.currentStage === 'fruiting' && g.status === 'active')
        .forEach((grow: any) => {
          const stageStart = grow.stageHistory?.find((s: any) => s.stage === 'fruiting')?.startedAt;
          if (stageStart) {
            const daysInFruiting = differenceInDays(now, new Date(stageStart));

            // If in fruiting for more than 14 days without pins
            if (daysInFruiting > 14 && !grow.firstPinsDate) {
              results.push({
                definitionId: 'warn-grow-no-pins',
                entityType: 'grow',
                entityId: grow.id,
                entityLabel: grow.name || `Grow ${grow.id.slice(-6)}`,
                message: `No pins after ${daysInFruiting} days in fruiting conditions.`,
                resolution: 'Increase FAE, check humidity, or try a cold shock if appropriate.',
                data: { daysInFruiting, priority: 'medium' },
              });
            }
          }
        });

      return results;
    },
  },

  // Inventory: Low Stock
  {
    id: 'inventory-low-stock',
    category: 'inventory',
    priority: 'medium',
    evaluate: (data) => {
      const results: WarningResult[] = [];

      data.inventoryItems
        .filter((item: any) => {
          const reorderPoint = item.reorderPoint || 0;
          const currentQty = item.totalQuantity || item.quantity || 0;
          return reorderPoint > 0 && currentQty <= reorderPoint;
        })
        .forEach((item: any) => {
          results.push({
            definitionId: 'warn-inventory-low-stock',
            entityType: 'inventory',
            entityId: item.id,
            entityLabel: item.name,
            message: `${item.name} is at or below reorder point (${item.totalQuantity || item.quantity} remaining).`,
            resolution: 'Reorder soon to avoid running out.',
            data: { quantity: item.totalQuantity || item.quantity, reorderPoint: item.reorderPoint, priority: 'medium' },
          });
        });

      return results;
    },
  },

  // Inventory: Expiring
  {
    id: 'inventory-expiring',
    category: 'inventory',
    priority: 'high',
    evaluate: (data) => {
      const results: WarningResult[] = [];
      const now = new Date();

      data.inventoryItems
        .filter((item: any) => item.expirationDate)
        .forEach((item: any) => {
          const expirationDate = new Date(item.expirationDate);
          const daysUntilExpiry = differenceInDays(expirationDate, now);

          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            results.push({
              definitionId: 'warn-inventory-expiring',
              entityType: 'inventory',
              entityId: item.id,
              entityLabel: item.name,
              message: `${item.name} expires in ${daysUntilExpiry} days.`,
              resolution: 'Use soon or dispose of properly.',
              data: { daysUntilExpiry, priority: daysUntilExpiry <= 7 ? 'high' : 'medium' },
            });
          } else if (daysUntilExpiry <= 0) {
            results.push({
              definitionId: 'warn-inventory-expiring',
              entityType: 'inventory',
              entityId: item.id,
              entityLabel: item.name,
              message: `${item.name} has expired!`,
              resolution: 'Dispose of expired items properly.',
              data: { daysUntilExpiry, priority: 'critical' },
            });
          }
        });

      return results;
    },
  },

  // Data: Not Synced
  {
    id: 'data-not-synced',
    category: 'data',
    priority: 'high',
    evaluate: (data) => {
      const results: WarningResult[] = [];

      // Only warn if connected but last sync was long ago
      if (data.isConnected && data.lastSync) {
        const hoursSinceSync = differenceInHours(new Date(), data.lastSync);

        if (hoursSinceSync > 24) {
          results.push({
            definitionId: 'warn-data-not-synced',
            entityType: 'system',
            entityId: 'sync',
            entityLabel: 'Data Sync',
            message: `Your data hasn't synced in ${Math.floor(hoursSinceSync / 24)} days.`,
            resolution: 'Check your internet connection and Supabase settings.',
            data: { hoursSinceSync, priority: 'high' },
          });
        }
      }

      return results;
    },
  },

  // Cultures: Needing Transfer
  {
    id: 'culture-needs-transfer',
    category: 'culture',
    priority: 'low',
    evaluate: (data) => {
      const results: WarningResult[] = [];
      const now = new Date();

      data.cultures
        .filter((c: any) => c.status === 'ready' && c.type === 'liquid_culture')
        .forEach((culture: any) => {
          const readySince = culture.updatedAt ? new Date(culture.updatedAt) : null;
          if (readySince) {
            const daysSinceReady = differenceInDays(now, readySince);

            if (daysSinceReady > 7) {
              results.push({
                definitionId: 'warn-culture-needs-transfer',
                entityType: 'culture',
                entityId: culture.id,
                entityLabel: culture.label || `Culture ${culture.id.slice(-6)}`,
                message: `This culture has been ready for ${daysSinceReady} days. Consider using it soon.`,
                resolution: 'Transfer to spawn or new culture to maintain viability.',
                data: { daysSinceReady, priority: 'low' },
              });
            }
          }
        });

      return results;
    },
  },
];

// ============================================================================
// WARNINGS EVALUATOR HOOK
// ============================================================================

export const useWarningsEvaluator = (enabled: boolean = true) => {
  const { state, isConnected } = useData();
  const infoContext = useInfoOptional();

  const evaluateWarnings = useCallback(() => {
    if (!infoContext || !enabled) return;

    const evaluationData: EvaluationData = {
      cultures: state.cultures || [],
      grows: state.grows || [],
      inventoryItems: state.inventoryItems || [],
      locations: state.locations || [],
      recipes: state.recipes || [],
      isConnected,
      lastSync: undefined, // Would need to track this separately
    };

    // Clear existing warnings before re-evaluating
    infoContext.clearWarnings();

    // Run all evaluators
    warningConditions.forEach((condition) => {
      try {
        const results = condition.evaluate(evaluationData);
        results.forEach((result) => {
          infoContext.addWarning({
            definitionId: result.definitionId,
            entityType: result.entityType,
            entityId: result.entityId,
            entityLabel: result.entityLabel,
            data: {
              message: result.message,
              resolution: result.resolution,
              priority: result.data?.priority || condition.priority,
              ...result.data,
            },
          });
        });
      } catch (error) {
        console.error(`[WarningsEvaluator] Error in condition ${condition.id}:`, error);
      }
    });
  }, [state.cultures, state.grows, state.inventoryItems, state.locations, state.recipes, isConnected, infoContext, enabled]);

  // Evaluate on mount and when data changes
  useEffect(() => {
    if (enabled) {
      // Debounce the evaluation to avoid excessive calls
      const timer = setTimeout(evaluateWarnings, 1000);
      return () => clearTimeout(timer);
    }
  }, [evaluateWarnings, enabled]);

  return { evaluateWarnings };
};

// ============================================================================
// WARNINGS EVALUATOR COMPONENT
// Can be placed in the app to automatically evaluate warnings
// ============================================================================

interface WarningsEvaluatorProps {
  enabled?: boolean;
}

export const WarningsEvaluator: React.FC<WarningsEvaluatorProps> = ({ enabled = true }) => {
  useWarningsEvaluator(enabled);
  return null; // Renders nothing, just runs the evaluation
};

export default WarningsEvaluator;
