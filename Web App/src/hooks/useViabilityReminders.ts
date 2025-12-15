// ============================================================================
// VIABILITY REMINDERS HOOK
// Tracks culture age and viability, generates alerts
// ============================================================================

import { useMemo, useEffect, useCallback } from 'react';
import { differenceInDays } from 'date-fns';
import { useData } from '../store';
import { useNotifications } from '../store/NotificationContext';
import type { Culture, Species, Strain } from '../store/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ViabilityStatus {
  culture: Culture;
  strainName: string;
  speciesName?: string;
  daysSinceCreation: number;
  daysSinceLastTransfer: number | null;
  viabilityThreshold: number;
  warningThreshold: number;
  status: 'healthy' | 'warning' | 'critical' | 'expired';
  recommendedAction: string;
  daysUntilWarning: number | null;
  daysUntilExpiry: number | null;
}

export interface ViabilityConfig {
  // Default thresholds by culture type (days)
  defaultThresholds: {
    liquid_culture: { warning: number; critical: number };
    agar: { warning: number; critical: number };
    slant: { warning: number; critical: number };
    spore_syringe: { warning: number; critical: number };
  };
  // Allow overrides per species
  speciesOverrides?: Record<string, { warning: number; critical: number }>;
  // Allow overrides per strain
  strainOverrides?: Record<string, { warning: number; critical: number }>;
}

// Default viability thresholds (in days)
const DEFAULT_CONFIG: ViabilityConfig = {
  defaultThresholds: {
    liquid_culture: { warning: 21, critical: 30 }, // LC should be transferred within ~30 days
    agar: { warning: 14, critical: 21 }, // Agar dries out faster
    slant: { warning: 60, critical: 90 }, // Slants last longer in fridge
    spore_syringe: { warning: 180, critical: 365 }, // Spore syringes last ~1 year
  },
};

// ============================================================================
// HOOK
// ============================================================================

export function useViabilityReminders(config: Partial<ViabilityConfig> = {}) {
  const { state, activeStrains } = useData();
  const { addNotification, notifications, preferences } = useNotifications();

  const fullConfig: ViabilityConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    defaultThresholds: {
      ...DEFAULT_CONFIG.defaultThresholds,
      ...config.defaultThresholds,
    },
  };

  // Calculate viability status for all active cultures
  const viabilityStatuses = useMemo((): ViabilityStatus[] => {
    const activeCultures = state.cultures.filter(
      c => c.status === 'active' || c.status === 'colonizing' || c.status === 'ready'
    );

    return activeCultures.map(culture => {
      const strain = activeStrains.find(s => s.id === culture.strainId);
      const species = strain?.speciesId
        ? state.species.find(sp => sp.id === strain.speciesId)
        : undefined;

      // Get thresholds - check overrides first
      let thresholds = fullConfig.defaultThresholds[culture.type];

      if (strain?.id && fullConfig.strainOverrides?.[strain.id]) {
        thresholds = fullConfig.strainOverrides[strain.id];
      } else if (species?.id && fullConfig.speciesOverrides?.[species.id]) {
        thresholds = fullConfig.speciesOverrides[species.id];
      }

      const now = new Date();
      const createdAt = new Date(culture.createdAt);
      const daysSinceCreation = differenceInDays(now, createdAt);

      // Calculate days since last transfer
      let daysSinceLastTransfer: number | null = null;
      if (culture.transfers && culture.transfers.length > 0) {
        const sortedTransfers = [...culture.transfers].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const lastTransfer = sortedTransfers[0];
        daysSinceLastTransfer = differenceInDays(now, new Date(lastTransfer.date));
      }

      // Use whichever is more recent: creation or last transfer
      const effectiveAge = daysSinceLastTransfer !== null
        ? daysSinceLastTransfer
        : daysSinceCreation;

      // Determine status
      let status: ViabilityStatus['status'];
      let recommendedAction: string;

      if (effectiveAge >= thresholds.critical) {
        status = 'expired';
        recommendedAction = `Culture may no longer be viable. Consider transferring immediately or creating backup from fresher source.`;
      } else if (effectiveAge >= thresholds.warning) {
        status = 'critical';
        recommendedAction = `Transfer to fresh media soon. ${thresholds.critical - effectiveAge} days until expiry.`;
      } else if (effectiveAge >= thresholds.warning * 0.7) {
        status = 'warning';
        recommendedAction = `Consider scheduling a transfer within the next ${thresholds.warning - effectiveAge} days.`;
      } else {
        status = 'healthy';
        recommendedAction = `Culture is healthy. Next check recommended in ${Math.floor(thresholds.warning * 0.7) - effectiveAge} days.`;
      }

      return {
        culture,
        strainName: strain?.name || 'Unknown Strain',
        speciesName: species?.name,
        daysSinceCreation,
        daysSinceLastTransfer,
        viabilityThreshold: thresholds.critical,
        warningThreshold: thresholds.warning,
        status,
        recommendedAction,
        daysUntilWarning: status === 'healthy' ? thresholds.warning - effectiveAge : null,
        daysUntilExpiry: status !== 'expired' ? thresholds.critical - effectiveAge : null,
      };
    });
  }, [state.cultures, state.species, activeStrains, fullConfig]);

  // Get cultures that need attention
  const culturesNeedingAttention = useMemo(() => {
    return viabilityStatuses.filter(
      vs => vs.status === 'warning' || vs.status === 'critical' || vs.status === 'expired'
    );
  }, [viabilityStatuses]);

  // Summary stats
  const summary = useMemo(() => ({
    total: viabilityStatuses.length,
    healthy: viabilityStatuses.filter(v => v.status === 'healthy').length,
    warning: viabilityStatuses.filter(v => v.status === 'warning').length,
    critical: viabilityStatuses.filter(v => v.status === 'critical').length,
    expired: viabilityStatuses.filter(v => v.status === 'expired').length,
  }), [viabilityStatuses]);

  // Generate notifications for cultures needing attention
  const generateNotifications = useCallback(() => {
    if (!preferences.enabled || !preferences.cultureExpiring) return;

    const now = new Date();
    const existingCultureNotifications = notifications.filter(
      n => n.category === 'culture_expiring' && !n.dismissedAt
    );

    culturesNeedingAttention.forEach(vs => {
      // Check if we already have a recent notification for this culture
      const existingNotif = existingCultureNotifications.find(
        n => n.entityId === vs.culture.id
      );

      if (existingNotif) {
        // Don't spam - only notify once per day
        const notifAge = differenceInDays(now, new Date(existingNotif.createdAt));
        if (notifAge < 1) return;
      }

      const notificationType = vs.status === 'expired'
        ? 'error'
        : vs.status === 'critical'
          ? 'warning'
          : 'info';

      const title = vs.status === 'expired'
        ? `Culture ${vs.culture.label} may be expired`
        : vs.status === 'critical'
          ? `Culture ${vs.culture.label} needs attention`
          : `Culture ${vs.culture.label} approaching age threshold`;

      addNotification({
        type: notificationType,
        category: 'culture_expiring',
        title,
        message: vs.recommendedAction,
        entityType: 'culture',
        entityId: vs.culture.id,
        entityName: `${vs.culture.label} (${vs.strainName})`,
        actionLabel: 'View Culture',
        actionPage: 'cultures',
      });
    });
  }, [culturesNeedingAttention, notifications, preferences, addNotification]);

  // Auto-check on mount and periodically
  useEffect(() => {
    // Initial check
    const timer = setTimeout(() => {
      generateNotifications();
    }, 2000); // Delay to let app settle

    return () => clearTimeout(timer);
  }, []); // Only run on mount

  return {
    viabilityStatuses,
    culturesNeedingAttention,
    summary,
    generateNotifications,
    config: fullConfig,
  };
}

export default useViabilityReminders;
