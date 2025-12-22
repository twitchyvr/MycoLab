// ============================================================================
// CULTURE DETAIL VIEW - Reimagined detail component with proper UX
// Mobile-first, desktop-superior design with progressive disclosure
// ============================================================================

import React, { useState, useMemo } from 'react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { useData } from '../../store';
import type { Culture, CultureStatus } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface CultureDetailViewProps {
  culture: Culture;
  onClose?: () => void;
  onNavigateToCulture?: (culture: Culture) => void;
  onStatusChange?: (status: CultureStatus) => void;
  onLogObservation?: () => void;
  onTransfer?: () => void;
  onViewHistory?: () => void;
  onDispose?: () => void;
  variant?: 'panel' | 'drawer' | 'page';
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9 18 15 12 9 6"/></svg>,
  MapPin: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Beaker: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>,
  DollarSign: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  GitBranch: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Clipboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Share: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  BellOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  ExternalLink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

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

const getLastActivityDate = (culture: Culture): Date | null => {
  const dates: Date[] = [];

  if (culture.observations?.length) {
    const lastObs = culture.observations[culture.observations.length - 1];
    dates.push(new Date(lastObs.date));
  }

  if (culture.transfers?.length) {
    const lastTransfer = culture.transfers[culture.transfers.length - 1];
    dates.push(new Date(lastTransfer.date));
  }

  if (culture.updatedAt) {
    dates.push(new Date(culture.updatedAt));
  }

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => d > latest ? d : latest);
};

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-zinc-500">{icon}</span>}
          <span className="text-sm font-medium text-zinc-300">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown />
        </span>
      </button>
      {isOpen && (
        <div className="pb-3 px-1">
          {children}
        </div>
      )}
    </div>
  );
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
          className={`w-2 h-4 rounded-sm ${getBarColor(i)}`}
        />
      ))}
    </div>
  );
};

// ============================================================================
// CLICKABLE CHIP COMPONENT
// ============================================================================

const RelatedChip: React.FC<{
  icon?: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  color?: string;
}> = ({ icon, label, sublabel, onClick, color = 'text-white' }) => {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg ${
        onClick ? 'hover:bg-zinc-700/50 cursor-pointer transition-colors' : ''
      }`}
    >
      {icon && <span className="text-zinc-500">{icon}</span>}
      <div className="text-left min-w-0">
        <div className={`text-sm font-medium truncate ${color}`}>{label}</div>
        {sublabel && <div className="text-xs text-zinc-500 truncate">{sublabel}</div>}
      </div>
      {onClick && (
        <span className="text-zinc-600 ml-auto">
          <Icons.ChevronRight />
        </span>
      )}
    </Wrapper>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CultureDetailView: React.FC<CultureDetailViewProps> = ({
  culture,
  onClose,
  onNavigateToCulture,
  onStatusChange,
  onLogObservation,
  onTransfer,
  onViewHistory,
  onDispose,
  variant = 'panel',
  className = '',
}) => {
  const {
    getStrain,
    getLocation,
    getContainer,
    getRecipe,
    getSupplier,
    getCultureLineage,
    updateCulture,
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
  const lastActivity = useMemo(() => getLastActivityDate(culture), [culture]);

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

  // Container classes based on variant
  const containerClasses = {
    panel: 'w-full max-w-md bg-zinc-900/95 border border-zinc-800 rounded-xl',
    drawer: 'w-full bg-zinc-900 min-h-screen',
    page: 'w-full max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-xl',
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {/* ================================================================== */}
      {/* HEADER SECTION */}
      {/* ================================================================== */}
      <div className="p-4 sm:p-5 border-b border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          {/* Culture identity */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl flex-shrink-0">{typeConfig.icon}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{culture.label}</h2>
              <p className="text-sm text-zinc-400 truncate">
                {strain?.name || 'Unknown Strain'} • {typeConfig.label}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => updateCulture(culture.id, { notificationsMuted: !culture.notificationsMuted })}
              className={`p-2 rounded-lg transition-colors ${
                culture.notificationsMuted
                  ? 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  : 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700'
              }`}
              title={culture.notificationsMuted ? 'Enable notifications' : 'Mute notifications'}
            >
              {culture.notificationsMuted ? <Icons.BellOff /> : <Icons.Bell />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                <Icons.X />
              </button>
            )}
          </div>
        </div>

        {/* Status badges row */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* Current status */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>

          {/* Generation badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300">
            P{senescenceInfo.generation}
          </span>

          {/* Volume badge (if applicable) */}
          {volumeInfo.capacity > 0 && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              volumeInfo.isEffectivelyEmpty
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {volumeInfo.isEffectivelyEmpty
                ? 'Empty'
                : `${volumeInfo.fillPercentage}% full`}
            </span>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* QUICK STATS SECTION */}
      {/* ================================================================== */}
      <div className="grid grid-cols-3 gap-px bg-zinc-800/50">
        {/* Age */}
        <div className="bg-zinc-900 p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl font-bold text-white">{ageInfo.label}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Age</div>
        </div>

        {/* Viability */}
        <div className="bg-zinc-900 p-3 sm:p-4 text-center">
          <div className={`text-sm sm:text-base font-semibold ${senescenceInfo.color}`}>
            {senescenceInfo.risk.split(' ')[0]}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Viability</div>
        </div>

        {/* Value */}
        <div className="bg-zinc-900 p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-xl font-bold text-emerald-400">
            ${costInfo.totalCost.toFixed(0)}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">Value</div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT - SCROLLABLE */}
      {/* ================================================================== */}
      <div className={`overflow-y-auto ${variant === 'drawer' ? 'max-h-[calc(100vh-280px)]' : 'max-h-96'}`}>

        {/* Health & Volume Section (always visible) */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-500">Health</span>
            <HealthBar rating={culture.healthRating} />
          </div>

          {volumeInfo.capacity > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-zinc-500">Volume</span>
                <span className="text-sm text-white">
                  {volumeInfo.normalizedFill > 0 ? (
                    <>{volumeInfo.normalizedFill.toFixed(1)}ml <span className="text-zinc-500">/ {volumeInfo.capacity}ml</span></>
                  ) : volumeInfo.isEffectivelyEmpty ? (
                    <span className="text-amber-400">Empty (residue)</span>
                  ) : (
                    `${volumeInfo.capacity}ml`
                  )}
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    volumeInfo.isEffectivelyEmpty ? 'bg-amber-500/50' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(2, volumeInfo.fillPercentage)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Sections */}
        <div className="px-4 sm:px-5">

          {/* Location & Storage */}
          <CollapsibleSection
            title="Location & Storage"
            icon={<Icons.MapPin />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {location && (
                <RelatedChip
                  icon={<Icons.MapPin />}
                  label={location.name}
                  sublabel={location.type || 'Location'}
                />
              )}
              {container && (
                <RelatedChip
                  icon={<Icons.Package />}
                  label={container.name}
                  sublabel={container.volumeMl ? `${container.volumeMl}ml capacity` : 'Container'}
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Recipe & Source */}
          {(recipe || supplier) && (
            <CollapsibleSection
              title="Recipe & Source"
              icon={<Icons.Beaker />}
            >
              <div className="space-y-2">
                {recipe && (
                  <RelatedChip
                    icon={<Icons.Beaker />}
                    label={recipe.name}
                    sublabel={recipe.category || 'Recipe'}
                    color="text-emerald-400"
                  />
                )}
                {supplier && (
                  <RelatedChip
                    icon={<Icons.Package />}
                    label={supplier.name}
                    sublabel="Supplier"
                  />
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Cost Breakdown */}
          {costInfo.totalCost > 0 && (
            <CollapsibleSection
              title="Cost Details"
              icon={<Icons.DollarSign />}
            >
              <div className="space-y-2 text-sm">
                {(culture.purchaseCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Purchase cost</span>
                    <span className="text-white">${culture.purchaseCost!.toFixed(2)}</span>
                  </div>
                )}
                {(culture.productionCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Production cost</span>
                    <span className="text-white">${culture.productionCost!.toFixed(2)}</span>
                  </div>
                )}
                {(culture.parentCultureCost ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">From parent</span>
                    <span className="text-white">${culture.parentCultureCost!.toFixed(2)}</span>
                  </div>
                )}
                {costInfo.costPerMl > 0 && (
                  <div className="flex justify-between pt-2 border-t border-zinc-800">
                    <span className="text-zinc-500">Cost per ml</span>
                    <span className="text-emerald-400">${costInfo.costPerMl.toFixed(3)}/ml</span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Lineage */}
          {(lineage.ancestors.length > 0 || lineage.descendants.length > 0) && (
            <CollapsibleSection
              title="Lineage"
              icon={<Icons.GitBranch />}
              badge={lineage.ancestors.length + lineage.descendants.length}
            >
              <div className="space-y-1">
                {/* Ancestors */}
                {lineage.ancestors.map(ancestor => (
                  <button
                    key={ancestor.id}
                    onClick={() => onNavigateToCulture?.(ancestor)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-lg text-left transition-colors"
                  >
                    <span className="text-zinc-500">↑</span>
                    <span className="text-sm text-zinc-400">{ancestor.label}</span>
                    <span className="text-xs text-zinc-600 ml-auto">P{ancestor.generation}</span>
                  </button>
                ))}

                {/* Current */}
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <span className="text-emerald-400">●</span>
                  <span className="text-sm font-medium text-emerald-400">{culture.label}</span>
                  <span className="text-xs text-emerald-600 ml-auto">P{culture.generation}</span>
                </div>

                {/* Descendants */}
                {lineage.descendants.map(descendant => (
                  <button
                    key={descendant.id}
                    onClick={() => onNavigateToCulture?.(descendant)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-lg text-left transition-colors"
                  >
                    <span className="text-zinc-500">↓</span>
                    <span className="text-sm text-zinc-400">{descendant.label}</span>
                    <span className="text-xs text-zinc-600 ml-auto">P{descendant.generation}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Notes */}
          {culture.notes && (
            <CollapsibleSection
              title="Notes"
              icon={<Icons.FileText />}
            >
              <p className="text-sm text-zinc-300 bg-zinc-800/30 rounded-lg p-3">
                {culture.notes}
              </p>
            </CollapsibleSection>
          )}

          {/* Observations */}
          {culture.observations && culture.observations.length > 0 && (
            <CollapsibleSection
              title="Observations"
              icon={<Icons.Eye />}
              badge={culture.observations.length}
            >
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {culture.observations.slice().reverse().slice(0, 5).map(obs => (
                  <div key={obs.id} className="bg-zinc-800/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="font-medium">{obs.type}</span>
                      <span>{formatDistanceToNow(new Date(obs.date), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{obs.notes}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* FOOTER - CONTEXTUAL INFO & ACTIONS */}
      {/* ================================================================== */}
      <div className="border-t border-zinc-800 p-4 sm:p-5">
        {/* Contextual footer info */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-4">
          <div className="flex items-center gap-1">
            <Icons.Calendar />
            <span>{ageInfo.label} old ({ageInfo.subLabel})</span>
          </div>
          {lastActivity && (
            <div className="flex items-center gap-1">
              <Icons.Activity />
              <span>Updated {formatDistanceToNow(lastActivity, { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onLogObservation}
            className="flex flex-col items-center gap-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <Icons.Clipboard />
            <span className="text-xs">Log</span>
          </button>
          <button
            onClick={onTransfer}
            className="flex flex-col items-center gap-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
          >
            <Icons.Share />
            <span className="text-xs">Transfer</span>
          </button>
          <button
            onClick={onViewHistory}
            className="flex flex-col items-center gap-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
            <Icons.History />
            <span className="text-xs">History</span>
          </button>
          <button
            onClick={onDispose}
            className="flex flex-col items-center gap-1 py-3 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg transition-colors"
          >
            <Icons.Trash />
            <span className="text-xs">Dispose</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CultureDetailView;
