// ============================================================================
// CONTAMINATION ANALYSIS
// Log, track, and analyze contamination patterns to improve success rates
// ============================================================================

import React, { useState, useMemo } from 'react';

// Types
type ContaminationType = 
  | 'trichoderma' 
  | 'cobweb' 
  | 'black_mold' 
  | 'penicillium' 
  | 'aspergillus' 
  | 'bacterial' 
  | 'lipstick' 
  | 'wet_spot' 
  | 'unknown';

type ContaminationStage = 
  | 'agar' 
  | 'liquid_culture' 
  | 'grain_spawn' 
  | 'bulk_colonization' 
  | 'fruiting';

type SuspectedCause = 
  | 'sterilization_failure'
  | 'inoculation_technique'
  | 'contaminated_source'
  | 'environmental'
  | 'substrate_issue'
  | 'equipment'
  | 'user_error'
  | 'unknown';

interface ContaminationEvent {
  id: string;
  itemId: string;
  itemLabel: string;
  strainName: string;
  type: ContaminationType;
  stage: ContaminationStage;
  daysSinceInoculation: number;
  suspectedCause: SuspectedCause;
  notes?: string;
  imageUrl?: string;
  dateDetected: Date;
  // Contextual data for analysis
  grainType?: string;
  substrateType?: string;
  pcTime?: number; // minutes
  pcPsi?: number;
  inoculationMethod?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  locationId?: string;
  locationName?: string;
}

// Contamination knowledge base
const contamKnowledge: Record<ContaminationType, {
  name: string;
  color: string;
  appearance: string;
  commonCauses: string[];
  timing: string;
  prevention: string[];
}> = {
  trichoderma: {
    name: 'Trichoderma (Green Mold)',
    color: 'text-green-400',
    appearance: 'Starts white, turns bright green. Aggressive spreader.',
    commonCauses: [
      'Inadequate sterilization',
      'Bacterial contamination weakening mycelium',
      'Contaminated spawn',
      'Environmental spores during S2B'
    ],
    timing: 'Days 3-14: Sterilization issue. Post-colonization: Environmental.',
    prevention: [
      'Ensure full colonization before S2B',
      'Proper PC time (90 min at 15 PSI for grain)',
      'Clean spawn-to-bulk technique',
      'Avoid opening during colonization'
    ]
  },
  cobweb: {
    name: 'Cobweb Mold',
    color: 'text-gray-400',
    appearance: 'Wispy, gray, cotton-like. Grows extremely fast (faster than mycelium).',
    commonCauses: [
      'High humidity + poor FAE',
      'Contaminated casing layer',
      'Stagnant air'
    ],
    timing: 'Usually appears during fruiting conditions.',
    prevention: [
      'Increase FAE',
      'Lower humidity slightly',
      'Pasteurize casing layer',
      'Can be treated with H2O2 spray if caught early'
    ]
  },
  black_mold: {
    name: 'Black Mold (Aspergillus niger)',
    color: 'text-zinc-600',
    appearance: 'Black or very dark green/brown spots.',
    commonCauses: [
      'Severe sterilization failure',
      'Very old or improperly stored grain',
      'Water damage'
    ],
    timing: 'Can appear anytime. Serious contamination.',
    prevention: [
      'Fresh, dry grains',
      'Proper sterilization',
      'Clean, dry storage'
    ]
  },
  penicillium: {
    name: 'Penicillium (Blue-Green Mold)',
    color: 'text-blue-400',
    appearance: 'Blue-green with white edges. Powdery texture.',
    commonCauses: [
      'Contaminated grain or substrate',
      'Environmental contamination',
      'Improper storage'
    ],
    timing: 'Often early (days 3-7) if from source.',
    prevention: [
      'Inspect grain before use',
      'Proper sterilization',
      'Clean work area'
    ]
  },
  aspergillus: {
    name: 'Aspergillus',
    color: 'text-yellow-400',
    appearance: 'Yellow, green, or brown. Often fuzzy or powdery.',
    commonCauses: [
      'Present on grain before sterilization',
      'Insufficient PC time',
      'High temperatures'
    ],
    timing: 'Days 3-10 typically.',
    prevention: [
      'Quality grain source',
      'Full sterilization cycle',
      'Moderate incubation temps'
    ]
  },
  bacterial: {
    name: 'Bacterial Contamination',
    color: 'text-orange-400',
    appearance: 'Slimy, wet spots. Often smells sour or foul. Grain looks wet/mushy.',
    commonCauses: [
      'Grain too wet before PC',
      'Insufficient sterilization',
      'Contaminated water/syringe',
      'Break and shake with wet grain'
    ],
    timing: 'Days 1-4: Very early = bacterial. Precedes other contams.',
    prevention: [
      'Proper grain hydration (no burst kernels)',
      'Dry grain surface before PC',
      'Sterile water for LC/syringes',
      'Don\'t B&S if grain looks wet'
    ]
  },
  lipstick: {
    name: 'Lipstick Mold (Sporendonema)',
    color: 'text-pink-400',
    appearance: 'Pink or orange-red spots.',
    commonCauses: [
      'Contaminated grain',
      'Environmental (rare indoors)'
    ],
    timing: 'Usually early to mid colonization.',
    prevention: [
      'Quality grain',
      'Proper sterilization',
      'Clean storage'
    ]
  },
  wet_spot: {
    name: 'Wet Spot (Bacillus)',
    color: 'text-amber-600',
    appearance: 'Wet, slimy grain that doesn\'t colonize. Smells sour.',
    commonCauses: [
      'Grain too wet',
      'Bacterial endospores survived PC',
      'Too short PC time'
    ],
    timing: 'Days 1-5. Grain never colonizes properly.',
    prevention: [
      'Proper grain prep - dry surface',
      'Extended PC time (90-120 min)',
      'Don\'t overfill jars'
    ]
  },
  unknown: {
    name: 'Unknown/Other',
    color: 'text-zinc-400',
    appearance: 'Varies - document carefully for identification.',
    commonCauses: ['Various'],
    timing: 'Document when detected.',
    prevention: ['Identify type for specific prevention']
  }
};

const stageConfig: Record<ContaminationStage, { label: string; color: string }> = {
  agar: { label: 'Agar', color: 'text-pink-400' },
  liquid_culture: { label: 'Liquid Culture', color: 'text-blue-400' },
  grain_spawn: { label: 'Grain Spawn', color: 'text-amber-400' },
  bulk_colonization: { label: 'Bulk Colonization', color: 'text-emerald-400' },
  fruiting: { label: 'Fruiting', color: 'text-purple-400' },
};

const causeConfig: Record<SuspectedCause, { label: string; icon: string }> = {
  sterilization_failure: { label: 'Sterilization Failure', icon: '🔥' },
  inoculation_technique: { label: 'Inoculation Technique', icon: '💉' },
  contaminated_source: { label: 'Contaminated Source', icon: '🧫' },
  environmental: { label: 'Environmental', icon: '🌡️' },
  substrate_issue: { label: 'Substrate Issue', icon: '🌾' },
  equipment: { label: 'Equipment', icon: '🔧' },
  user_error: { label: 'User Error', icon: '👤' },
  unknown: { label: 'Unknown', icon: '❓' },
};

// Sample data
const sampleEvents: ContaminationEvent[] = [
  {
    id: 'c1',
    itemId: 'GS-005',
    itemLabel: 'GS-005',
    strainName: 'B+',
    type: 'trichoderma',
    stage: 'grain_spawn',
    daysSinceInoculation: 8,
    suspectedCause: 'sterilization_failure',
    notes: 'Green patches appeared on day 8. PC was only 75 minutes.',
    dateDetected: new Date('2024-11-15'),
    grainType: 'Oat Groats',
    pcTime: 75,
    pcPsi: 15,
    season: 'fall',
    locationName: 'Incubator'
  },
  {
    id: 'c2',
    itemId: 'AG-004',
    itemLabel: 'AG-004',
    strainName: 'Blue Oyster',
    type: 'bacterial',
    stage: 'agar',
    daysSinceInoculation: 2,
    suspectedCause: 'inoculation_technique',
    notes: 'Slimy spots near inoculation point. SAB technique may have been compromised.',
    dateDetected: new Date('2024-12-05'),
    season: 'winter',
    locationName: 'Main Fridge'
  },
  {
    id: 'c3',
    itemId: 'BK-003',
    itemLabel: 'BK-003',
    strainName: 'Penis Envy',
    type: 'trichoderma',
    stage: 'bulk_colonization',
    daysSinceInoculation: 12,
    suspectedCause: 'environmental',
    notes: 'Trich appeared after opening lid to check progress.',
    dateDetected: new Date('2024-12-01'),
    substrateType: 'CVG',
    season: 'winter',
    locationName: 'Incubator'
  },
  {
    id: 'c4',
    itemId: 'GS-008',
    itemLabel: 'GS-008',
    strainName: 'JMF',
    type: 'wet_spot',
    stage: 'grain_spawn',
    daysSinceInoculation: 3,
    suspectedCause: 'substrate_issue',
    notes: 'Grain was too wet after soak. Some kernels burst during prep.',
    dateDetected: new Date('2024-11-28'),
    grainType: 'Popcorn',
    pcTime: 90,
    pcPsi: 15,
    season: 'fall',
    locationName: 'Incubator'
  },
  {
    id: 'c5',
    itemId: 'LC-005',
    itemLabel: 'LC-005',
    strainName: 'B+',
    type: 'bacterial',
    stage: 'liquid_culture',
    daysSinceInoculation: 5,
    suspectedCause: 'contaminated_source',
    notes: 'LC cloudy with no mycelium growth. Source syringe may have been old.',
    dateDetected: new Date('2024-11-20'),
    season: 'fall',
    locationName: 'Main Fridge'
  },
  {
    id: 'c6',
    itemId: 'BK-005',
    itemLabel: 'BK-005',
    strainName: 'Blue Oyster',
    type: 'cobweb',
    stage: 'fruiting',
    daysSinceInoculation: 18,
    suspectedCause: 'environmental',
    notes: 'Cobweb appeared after increasing humidity. FAE was insufficient.',
    dateDetected: new Date('2024-12-08'),
    substrateType: 'Masters Mix',
    season: 'winter',
    locationName: 'Fruiting Chamber'
  },
];

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Book: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6 9 12 15 18 9"/></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

export const ContaminationAnalysis: React.FC = () => {
  const [events] = useState<ContaminationEvent[]>(sampleEvents);
  const [activeTab, setActiveTab] = useState<'log' | 'analysis' | 'knowledge'>('log');
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedContamType, setSelectedContamType] = useState<ContaminationType | null>(null);
  const [filterType, setFilterType] = useState<ContaminationType | 'all'>('all');
  const [filterStage, setFilterStage] = useState<ContaminationStage | 'all'>('all');

  // Analysis calculations
  const analysis = useMemo(() => {
    const totalEvents = events.length;
    
    // By type
    const byType = Object.keys(contamKnowledge).reduce((acc, type) => {
      acc[type as ContaminationType] = events.filter(e => e.type === type).length;
      return acc;
    }, {} as Record<ContaminationType, number>);
    
    // By stage
    const byStage = Object.keys(stageConfig).reduce((acc, stage) => {
      acc[stage as ContaminationStage] = events.filter(e => e.stage === stage).length;
      return acc;
    }, {} as Record<ContaminationStage, number>);
    
    // By cause
    const byCause = Object.keys(causeConfig).reduce((acc, cause) => {
      acc[cause as SuspectedCause] = events.filter(e => e.suspectedCause === cause).length;
      return acc;
    }, {} as Record<SuspectedCause, number>);

    // By timing (early vs late)
    const earlyContam = events.filter(e => e.daysSinceInoculation <= 5).length;
    const midContam = events.filter(e => e.daysSinceInoculation > 5 && e.daysSinceInoculation <= 14).length;
    const lateContam = events.filter(e => e.daysSinceInoculation > 14).length;

    // By grain type (if available)
    const grainTypes = events.filter(e => e.grainType).reduce((acc, e) => {
      acc[e.grainType!] = (acc[e.grainType!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // By strain
    const byStrain = events.reduce((acc, e) => {
      acc[e.strainName] = (acc[e.strainName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Timing insight
    const avgDaysToContam = events.length > 0 
      ? Math.round(events.reduce((sum, e) => sum + e.daysSinceInoculation, 0) / events.length)
      : 0;

    return {
      totalEvents,
      byType,
      byStage,
      byCause,
      earlyContam,
      midContam,
      lateContam,
      grainTypes,
      byStrain,
      avgDaysToContam,
    };
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterStage !== 'all' && e.stage !== filterStage) return false;
      return true;
    }).sort((a, b) => b.dateDetected.getTime() - a.dateDetected.getTime());
  }, [events, filterType, filterStage]);

  // Get timing diagnosis
  const getTimingDiagnosis = (days: number, stage: ContaminationStage): string => {
    if (stage === 'agar' || stage === 'liquid_culture') {
      if (days <= 2) return 'Likely bacterial or contaminated source';
      if (days <= 5) return 'Possible inoculation technique issue';
      return 'May indicate environmental or storage issue';
    }
    if (stage === 'grain_spawn') {
      if (days <= 3) return 'Bacterial - grain too wet or inadequate sterilization';
      if (days <= 7) return 'Sterilization failure - PC time/pressure issue';
      if (days <= 14) return 'Late sterilization issue or inoculation contam';
      return 'Environmental or storage contamination';
    }
    if (stage === 'bulk_colonization') {
      if (days <= 7) return 'Contaminated spawn or S2B technique';
      return 'Environmental - often from opening too early';
    }
    return 'Environmental contamination during fruiting';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contamination Analysis</h2>
          <p className="text-zinc-400 text-sm">Track, analyze, and learn from contamination events</p>
        </div>
        <button
          onClick={() => setShowLogForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium border border-red-500/30 transition-colors"
        >
          <Icons.AlertTriangle />
          Log Contamination
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Events</p>
          <p className="text-2xl font-bold text-white">{analysis.totalEvents}</p>
        </div>
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
          <p className="text-xs text-red-400 mb-1">Early (&lt;5 days)</p>
          <p className="text-2xl font-bold text-white">{analysis.earlyContam}</p>
          <p className="text-xs text-zinc-500">Usually bacterial/sterile</p>
        </div>
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
          <p className="text-xs text-amber-400 mb-1">Mid (5-14 days)</p>
          <p className="text-2xl font-bold text-white">{analysis.midContam}</p>
          <p className="text-xs text-zinc-500">Often sterilization</p>
        </div>
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4">
          <p className="text-xs text-blue-400 mb-1">Late (&gt;14 days)</p>
          <p className="text-2xl font-bold text-white">{analysis.lateContam}</p>
          <p className="text-xs text-zinc-500">Usually environmental</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Avg Days to Contam</p>
          <p className="text-2xl font-bold text-white">{analysis.avgDaysToContam}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        {[
          { id: 'log', label: 'Event Log', icon: Icons.AlertTriangle },
          { id: 'analysis', label: 'Pattern Analysis', icon: Icons.TrendingUp },
          { id: 'knowledge', label: 'Knowledge Base', icon: Icons.Book },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <Icons.Filter />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as ContaminationType | 'all')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Types</option>
              {Object.entries(contamKnowledge).map(([key, info]) => (
                <option key={key} value={key}>{info.name}</option>
              ))}
            </select>
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value as ContaminationStage | 'all')}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageConfig).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
            <span className="text-zinc-500 text-sm ml-auto">{filteredEvents.length} events</span>
          </div>

          {/* Event List */}
          <div className="space-y-3">
            {filteredEvents.map(event => {
              const typeInfo = contamKnowledge[event.type];
              const stageInfo = stageConfig[event.stage];
              const causeInfo = causeConfig[event.suspectedCause];
              
              return (
                <div key={event.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-950/50 border border-red-800/50 flex items-center justify-center">
                        <Icons.AlertTriangle />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-white">{event.itemLabel}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-sm text-zinc-400">{event.strainName}</span>
                        </div>
                        <p className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">{event.dateDetected.toLocaleDateString()}</p>
                      <p className="text-xs text-zinc-500">Day {event.daysSinceInoculation}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-zinc-800 ${stageInfo.color}`}>
                      {stageInfo.label}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                      {causeInfo.icon} {causeInfo.label}
                    </span>
                    {event.grainType && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-amber-400">
                        {event.grainType}
                      </span>
                    )}
                    {event.pcTime && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-blue-400">
                        PC: {event.pcTime}min
                      </span>
                    )}
                  </div>

                  {event.notes && (
                    <p className="text-sm text-zinc-400 mb-3">{event.notes}</p>
                  )}

                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <Icons.Info />
                      <span className="text-zinc-400">{getTimingDiagnosis(event.daysSinceInoculation, event.stage)}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Type */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">By Contamination Type</h3>
            <div className="space-y-2">
              {Object.entries(analysis.byType)
                .filter(([_, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const info = contamKnowledge[type as ContaminationType];
                  const percent = Math.round((count / analysis.totalEvents) * 100);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={info.color}>{info.name}</span>
                          <span className="text-zinc-400">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Stage */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">By Stage</h3>
            <div className="space-y-2">
              {Object.entries(analysis.byStage)
                .filter(([_, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([stage, count]) => {
                  const info = stageConfig[stage as ContaminationStage];
                  const percent = Math.round((count / analysis.totalEvents) * 100);
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={info.color}>{info.label}</span>
                          <span className="text-zinc-400">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Suspected Cause */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">By Suspected Cause</h3>
            <div className="space-y-2">
              {Object.entries(analysis.byCause)
                .filter(([_, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([cause, count]) => {
                  const info = causeConfig[cause as SuspectedCause];
                  const percent = Math.round((count / analysis.totalEvents) * 100);
                  return (
                    <div key={cause} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-zinc-300">{info.icon} {info.label}</span>
                          <span className="text-zinc-400">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* By Strain */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">By Strain</h3>
            <div className="space-y-2">
              {Object.entries(analysis.byStrain)
                .sort(([, a], [, b]) => b - a)
                .map(([strain, count]) => {
                  const percent = Math.round((count / analysis.totalEvents) * 100);
                  return (
                    <div key={strain} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-emerald-400">{strain}</span>
                          <span className="text-zinc-400">{count} ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Insights */}
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">🔍 Key Insights</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {analysis.earlyContam > analysis.lateContam && (
                <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
                  <p className="text-sm text-red-400 font-medium mb-1">Early Contam Dominant</p>
                  <p className="text-xs text-zinc-400">Most contamination occurs early (&lt;5 days). Focus on sterilization and technique.</p>
                </div>
              )}
              {Object.entries(analysis.byType).filter(([t, c]) => c > 0 && t === 'bacterial').length > 0 && (
                <div className="p-4 bg-orange-950/30 border border-orange-800/50 rounded-lg">
                  <p className="text-sm text-orange-400 font-medium mb-1">Bacterial Issues Present</p>
                  <p className="text-xs text-zinc-400">Check grain hydration, PC times, and water sources.</p>
                </div>
              )}
              {Object.entries(analysis.byStage).filter(([s, c]) => c > 0 && s === 'grain_spawn').length > 0 && (
                <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                  <p className="text-sm text-amber-400 font-medium mb-1">Grain Spawn Issues</p>
                  <p className="text-xs text-zinc-400">Consider longer PC times, drier grain, or different grain type.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">Click on a contamination type to learn more about identification and prevention.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(contamKnowledge).map(([type, info]) => (
              <button
                key={type}
                onClick={() => setSelectedContamType(selectedContamType === type ? null : type as ContaminationType)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedContamType === type
                    ? 'bg-zinc-800 border-zinc-600'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-medium ${info.color}`}>{info.name}</p>
                  <Icons.ChevronDown />
                </div>
                <p className="text-xs text-zinc-500">{info.appearance}</p>
              </button>
            ))}
          </div>

          {/* Expanded Knowledge */}
          {selectedContamType && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <h3 className={`text-xl font-semibold ${contamKnowledge[selectedContamType].color}`}>
                  {contamKnowledge[selectedContamType].name}
                </h3>
                <button onClick={() => setSelectedContamType(null)} className="text-zinc-400 hover:text-white">
                  <Icons.X />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Appearance</h4>
                  <p className="text-zinc-300">{contamKnowledge[selectedContamType].appearance}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Timing Diagnosis</h4>
                  <p className="text-zinc-300">{contamKnowledge[selectedContamType].timing}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Common Causes</h4>
                  <ul className="space-y-1">
                    {contamKnowledge[selectedContamType].commonCauses.map((cause, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Prevention</h4>
                  <ul className="space-y-1">
                    {contamKnowledge[selectedContamType].prevention.map((tip, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Form Modal (placeholder) */}
      {showLogForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Log Contamination Event</h3>
              <button onClick={() => setShowLogForm(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Item</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option>Select item...</option>
                  <option>GS-002 - B+ Grain Spawn</option>
                  <option>AG-003 - PE Agar</option>
                  <option>BK-001 - B+ Monotub</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Contamination Type</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option>Select type...</option>
                  {Object.entries(contamKnowledge).map(([key, info]) => (
                    <option key={key} value={key}>{info.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Suspected Cause</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option>Select cause...</option>
                  {Object.entries(causeConfig).map(([key, info]) => (
                    <option key={key} value={key}>{info.icon} {info.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Days Since Inoculation</label>
                <input 
                  type="number" 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., 7"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea 
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white h-24"
                  placeholder="Describe what you observed..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowLogForm(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium border border-zinc-700"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowLogForm(false)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
              >
                Log Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContaminationAnalysis;
