// ============================================================================
// CULTURE OVERVIEW TAB
// Clean summary view with key metrics, status, and quick info
// Part of the EntityDetailModal tab system
// ============================================================================

import React, { useMemo } from 'react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { useData } from '../../../store';
import type { Culture, CultureStatus } from '../../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface CultureOverviewTabProps {
  culture: Culture;
  onNavigateToCulture?: (culture: Culture) => void;
  onNavigateToLocation?: (locationId: string) => void;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const cultureTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  liquid_culture: { icon: '💧', label: 'Liquid Culture', color: 'text-blue-400' },
  agar: { icon: '🧫', label: 'Agar Plate', color: 'text-amber-400' },
  slant: { icon: '🧪', label: 'Slant', color: 'text-purple-400' },
  spore_syringe: { icon: '💉', label: 'Spore Syringe', color: 'text-emerald-400' },
};

const cultureStatusConfig: Record<CultureStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  colonizing: { label: 'Colonizing', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ready: { label: 'Ready', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  contaminated: { label: 'Contaminated', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  archived: { label: 'Archived', color: 'text-zinc-400', bgColor: 'bg-zinc-500/20' },
  depleted: { label: 'Depleted', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
};

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Beaker: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>,
  DollarSign: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  GitBranch: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  Truck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const normalizeVolume = (volume: number | null | undefined): number => {
  if (volume === null || volume === undefined) return 0;
  return volume < 0.5 ? 0 : volume;
};

const getAcquisitionDate = (culture: Culture): Date => {
  if (culture.acquisitionMethod === 'purchased') {
    return culture.receivedDate
      ? new Date(culture.receivedDate)
      : culture.purchaseDate
        ? new Date(culture.purchaseDate)
        : new Date(culture.createdAt);
  }
  return culture.prepDate
    ? new Date(culture.prepDate)
    : new Date(culture.createdAt);
};

const getAgeInfo = (culture: Culture): { days: number; label: string; subLabel: string } => {
  const acquisitionDate = getAcquisitionDate(culture);
  const days = differenceInDays(new Date(), acquisitionDate);

  let label: string;
  if (days === 0) label = 'Today';
  else if (days === 1) label = '1 day';
  else if (days < 7) label = `${days} days`;
  else if (days < 30) label = `${Math.floor(days / 7)} weeks`;
  else if (days < 365) label = `${Math.floor(days / 30)} months`;
  else label = `${Math.floor(days / 365)}+ years`;

  const subLabel = culture.acquisitionMethod === 'purchased'
    ? 'since received'
    : 'since prep';

  return { days, label, subLabel };
};

// ============================================================================
// HEALTH BAR COMPONENT
// ============================================================================

const HealthBar: React.FC<{ rating?: number }> = ({ rating }) => {
  const normalizedRating = rating ?? 5;
  const bars = 5;

  const getBarColor = (index: number) => {
    if (index >= normalizedRating) return 'bg-zinc-700';
    if (normalizedRating >= 4) return 'bg-emerald-500';
    if (normalizedRating >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex gap-0.5" title={`Health: ${normalizedRating}/5`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-5 rounded-sm ${getBarColor(i)}`}
        />
      ))}
    </div>
  );
};

// ============================================================================
// INFO CARD COMPONENT
// ============================================================================

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  sublabel?: string;
  onClick?: () => void;
  color?: string;
}> = ({ icon, label, value, sublabel, onClick, color = 'text-white' }) => {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 bg-zinc-800/50 rounded-xl
        ${onClick ? 'hover:bg-zinc-700/50 cursor-pointer transition-colors' : ''}
      `}
    >
      <span className="text-zinc-500 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-xs text-zinc-500 mb-0.5">{label}</div>
        <div className={`text-sm font-medium ${color} truncate`}>{value}</div>
        {sublabel && <div className="text-xs text-zinc-600 mt-0.5">{sublabel}</div>}
      </div>
      {onClick && (
        <span className="text-zinc-600 mt-1">
          <Icons.ChevronRight />
        </span>
      )}
    </Wrapper>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CultureOverviewTab: React.FC<CultureOverviewTabProps> = ({
  culture,
  onNavigateToCulture,
  onNavigateToLocation,
}) => {
  const {
    getStrain,
    getLocation,
    getContainer,
    getRecipe,
    getSupplier,
    getCultureLineage,
  } = useData();

  // Derived data
  const strain = getStrain(culture.strainId);
  const location = getLocation(culture.locationId);
  const container = getContainer(culture.containerId);
  const recipe = culture.recipeId ? getRecipe(culture.recipeId) : null;
  const supplier = culture.supplierId ? getSupplier(culture.supplierId) : null;
  const lineage = getCultureLineage(culture.id);
  const typeConfig = cultureTypeConfig[culture.type] || cultureTypeConfig.liquid_culture;
  const statusConfig = cultureStatusConfig[culture.status] || cultureStatusConfig.active;

  // Calculated values
  const ageInfo = useMemo(() => getAgeInfo(culture), [culture]);

  const volumeInfo = useMemo(() => {
    const normalizedFill = normalizeVolume(culture.fillVolumeMl);
    const capacity = culture.volumeMl ?? 0;
    const fillPercentage = capacity > 0 ? Math.round((normalizedFill / capacity) * 100) : 0;
    const isEffectivelyEmpty = normalizedFill === 0 && (culture.fillVolumeMl ?? 0) > 0;
    return { normalizedFill, capacity, fillPercentage, isEffectivelyEmpty };
  }, [culture.fillVolumeMl, culture.volumeMl]);

  const costInfo = useMemo(() => {
    const totalCost = (culture.purchaseCost ?? 0) + (culture.productionCost ?? 0)
                    + (culture.parentCultureCost ?? 0) + (culture.cost ?? 0);
    const fillVolume = normalizeVolume(culture.fillVolumeMl ?? culture.volumeMl);
    const costPerMl = fillVolume > 0 ? totalCost / fillVolume : 0;
    return { totalCost, costPerMl };
  }, [culture]);

  // P-Value / Senescence info
  const senescenceInfo = useMemo(() => {
    const gen = culture.generation ?? 0;
    let risk: string;
    let color: string;

    if (gen <= 3) { risk = 'Excellent vigor'; color = 'text-emerald-400'; }
    else if (gen <= 6) { risk = 'Good vigor'; color = 'text-green-400'; }
    else if (gen <= 10) { risk = 'Moderate vigor'; color = 'text-yellow-400'; }
    else { risk = 'Risk of senescence'; color = 'text-red-400'; }

    return { generation: gen, risk, color };
  }, [culture.generation]);

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* KEY METRICS ROW */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Age */}
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{ageInfo.label}</div>
          <div className="text-xs text-zinc-500 mt-1">Age ({ageInfo.subLabel})</div>
        </div>

        {/* Generation */}
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">P{senescenceInfo.generation}</div>
          <div className={`text-xs mt-1 ${senescenceInfo.color}`}>{senescenceInfo.risk}</div>
        </div>

        {/* Health */}
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="flex justify-center mb-1">
            <HealthBar rating={culture.healthRating} />
          </div>
          <div className="text-xs text-zinc-500">Health Rating</div>
        </div>

        {/* Value */}
        <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            ${costInfo.totalCost.toFixed(0)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Total Value</div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* VOLUME BAR (if applicable) */}
      {/* ================================================================== */}
      {volumeInfo.capacity > 0 && (
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Current Volume</span>
            <span className="text-sm font-medium text-white">
              {volumeInfo.normalizedFill > 0 ? (
                <>{volumeInfo.normalizedFill.toFixed(1)}ml <span className="text-zinc-500">/ {volumeInfo.capacity}ml</span></>
              ) : volumeInfo.isEffectivelyEmpty ? (
                <span className="text-amber-400">Empty (residue only)</span>
              ) : (
                `${volumeInfo.capacity}ml capacity`
              )}
            </span>
          </div>
          <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                volumeInfo.isEffectivelyEmpty ? 'bg-amber-500/50' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(2, volumeInfo.fillPercentage)}%` }}
            />
          </div>
          {costInfo.costPerMl > 0 && (
            <div className="text-xs text-zinc-500 mt-2 text-right">
              ${costInfo.costPerMl.toFixed(3)} per ml
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* DETAILS GRID */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Location */}
        {location && (
          <InfoCard
            icon={<Icons.MapPin />}
            label="Location"
            value={location.name}
            sublabel={location.type || undefined}
            onClick={onNavigateToLocation ? () => onNavigateToLocation(location.id) : undefined}
          />
        )}

        {/* Container */}
        {container && (
          <InfoCard
            icon={<Icons.Package />}
            label="Container"
            value={container.name}
            sublabel={container.volumeMl ? `${container.volumeMl}ml capacity` : undefined}
          />
        )}

        {/* Recipe */}
        {recipe && (
          <InfoCard
            icon={<Icons.Beaker />}
            label="Recipe"
            value={recipe.name}
            sublabel={recipe.category}
            color="text-emerald-400"
          />
        )}

        {/* Supplier */}
        {supplier && (
          <InfoCard
            icon={<Icons.Truck />}
            label="Supplier"
            value={supplier.name}
            sublabel={supplier.website || undefined}
          />
        )}

        {/* Cost breakdown */}
        {costInfo.totalCost > 0 && (
          <InfoCard
            icon={<Icons.DollarSign />}
            label="Cost Breakdown"
            value={
              <div className="space-y-0.5 text-xs">
                {(culture.purchaseCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Purchase:</span>
                    <span>${culture.purchaseCost!.toFixed(2)}</span>
                  </div>
                )}
                {(culture.productionCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Production:</span>
                    <span>${culture.productionCost!.toFixed(2)}</span>
                  </div>
                )}
                {(culture.parentCultureCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">From parent:</span>
                    <span>${culture.parentCultureCost!.toFixed(2)}</span>
                  </div>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* ================================================================== */}
      {/* LINEAGE PREVIEW */}
      {/* ================================================================== */}
      {(lineage.ancestors.length > 0 || lineage.descendants.length > 0) && (
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icons.GitBranch />
            <span className="text-sm font-medium text-zinc-300">Lineage</span>
            <span className="px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">
              {lineage.ancestors.length + lineage.descendants.length}
            </span>
          </div>

          <div className="space-y-1">
            {/* Ancestors (parents) */}
            {lineage.ancestors.slice(0, 2).map(ancestor => (
              <button
                key={ancestor.id}
                onClick={() => onNavigateToCulture?.(ancestor)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-700/50 rounded-lg text-left transition-colors"
              >
                <span className="text-zinc-500 text-xs">↑ Parent</span>
                <span className="text-sm text-zinc-300 flex-1 truncate">{ancestor.label}</span>
                <span className="text-xs text-zinc-600">P{ancestor.generation}</span>
              </button>
            ))}

            {/* Current (highlighted) */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <span className="text-emerald-400 text-xs">● Current</span>
              <span className="text-sm font-medium text-emerald-400 flex-1 truncate">{culture.label}</span>
              <span className="text-xs text-emerald-600">P{culture.generation}</span>
            </div>

            {/* Descendants (children) */}
            {lineage.descendants.slice(0, 2).map(descendant => (
              <button
                key={descendant.id}
                onClick={() => onNavigateToCulture?.(descendant)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-700/50 rounded-lg text-left transition-colors"
              >
                <span className="text-zinc-500 text-xs">↓ Child</span>
                <span className="text-sm text-zinc-300 flex-1 truncate">{descendant.label}</span>
                <span className="text-xs text-zinc-600">P{descendant.generation}</span>
              </button>
            ))}

            {/* Show more indicator */}
            {(lineage.ancestors.length > 2 || lineage.descendants.length > 2) && (
              <div className="text-xs text-zinc-500 text-center pt-1">
                +{(lineage.ancestors.length - 2) + (lineage.descendants.length - 2)} more in lineage
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* NOTES */}
      {/* ================================================================== */}
      {culture.notes && (
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-2">Notes</div>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{culture.notes}</p>
        </div>
      )}
    </div>
  );
};

export default CultureOverviewTab;
