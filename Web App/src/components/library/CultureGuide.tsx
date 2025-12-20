// ============================================================================
// CULTURE GUIDE
// Educational reference for culture management, P-values, and best practices
// ============================================================================

import React, { useState } from 'react';
import {
  senescenceSigns,
  expansionRatios,
  coldSensitiveSpecies,
  getExpectedShelfLifeDays,
  getStorageRecommendation,
} from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

type Section = 'overview' | 'reproduction' | 'pvalue' | 'shelflife' | 'senescence' | 'storage' | 'expansion' | 'terminology';

interface SectionInfo {
  id: Section;
  title: string;
  icon: string;
  description: string;
}

// ============================================================================
// SECTION DATA
// ============================================================================

const sections: SectionInfo[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: '🧬',
    description: 'Introduction to culture management fundamentals',
  },
  {
    id: 'reproduction',
    title: 'Fungal Reproduction',
    icon: '🔀',
    description: 'Understanding spore genetics and dikaryotic mycelium',
  },
  {
    id: 'pvalue',
    title: 'P-Value System',
    icon: 'P',
    description: 'Understanding passage numbers and generation tracking',
  },
  {
    id: 'shelflife',
    title: 'Shelf Life',
    icon: '📆',
    description: 'How long cultures remain viable by generation',
  },
  {
    id: 'senescence',
    title: 'Senescence',
    icon: '⚠️',
    description: 'Recognizing and preventing culture degradation',
  },
  {
    id: 'storage',
    title: 'Storage',
    icon: '❄️',
    description: 'Temperature requirements and cold-sensitive species',
  },
  {
    id: 'expansion',
    title: 'Expansion Ratios',
    icon: '📐',
    description: 'Best practices for culture transfers and expansion',
  },
  {
    id: 'terminology',
    title: 'Terminology',
    icon: '📖',
    description: 'Key mycology terms and definitions',
  },
];

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Info: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

const OverviewSection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">What is a Culture?</h3>
      <p className="text-zinc-300 leading-relaxed">
        A <strong className="text-emerald-400">culture</strong> is living mycelium preserved on a growth medium for storage,
        propagation, and inoculation. Cultures allow cultivators to maintain and multiply proven genetics
        without starting from spores each time.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💧</span>
          <h4 className="font-semibold text-white">Liquid Culture (LC)</h4>
        </div>
        <p className="text-sm text-zinc-400">
          Mycelium suspended in a nutrient broth. Fast colonization, easy to transfer with a syringe.
          Ideal for inoculating grain spawn at scale.
        </p>
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🧫</span>
          <h4 className="font-semibold text-white">Agar Plate</h4>
        </div>
        <p className="text-sm text-zinc-400">
          Mycelium growing on solid nutrient agar in petri dishes. Best for isolation, cloning,
          and observing growth characteristics. Can identify contamination early.
        </p>
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🧪</span>
          <h4 className="font-semibold text-white">Slant</h4>
        </div>
        <p className="text-sm text-zinc-400">
          Agar in a test tube at an angle. Long-term storage format. Takes up less space than plates
          and can be sealed for years of preservation.
        </p>
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">💉</span>
          <h4 className="font-semibold text-white">Spore Syringe</h4>
        </div>
        <p className="text-sm text-zinc-400">
          Spores suspended in sterile water. Starting point for new genetics.
          Spores are not cultures (not living mycelium) but germinate into P0 cultures.
        </p>
      </div>
    </div>

    <div className="p-5 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
      <div className="flex items-start gap-3">
        <Icons.Info />
        <div>
          <h4 className="font-medium text-emerald-400 mb-1">Why Track Cultures?</h4>
          <p className="text-sm text-zinc-400">
            Every time you transfer a culture, it ages slightly. Tracking passage numbers (P-values),
            creation dates, and health ratings helps you know which cultures are fresh and vigorous,
            and which should be retired before they lose productivity.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ReproductionSection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">How Mycelium Reproduces</h3>
      <p className="text-zinc-300 leading-relaxed">
        Understanding fungal reproduction is essential for cultivators. Mushrooms begin as <strong className="text-emerald-400">spores</strong>,
        released from the gills of mature fruit bodies. A single mushroom can release <em>trillions</em> of spores
        before decomposing. These microscopic spores travel through the air and, when landing in suitable conditions,
        germinate and grow in search of nutrients.
      </p>
    </div>

    <div className="p-6 bg-gradient-to-r from-purple-950/30 to-zinc-900/50 rounded-xl border border-purple-800/50">
      <h3 className="text-lg font-semibold text-white mb-4">Sexual Reproduction in Fungi</h3>
      <p className="text-zinc-300 leading-relaxed mb-4">
        Unlike animals, fungi don't have male and female spores. Instead, there are <strong className="text-purple-400">two mating types</strong>,
        often called <strong>A</strong> and <strong>B</strong>. Each type carries 50% of the genetic material needed
        for reproduction.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-black/20 rounded-lg">
          <h4 className="font-medium text-purple-400 mb-2">Monokaryotic Mycelium</h4>
          <p className="text-sm text-zinc-400">
            When a single spore germinates, it produces <strong className="text-zinc-300">monokaryotic mycelium</strong> -
            having only one set of genetic information. This mycelium cannot produce mushrooms on its own.
          </p>
        </div>
        <div className="p-4 bg-black/20 rounded-lg">
          <h4 className="font-medium text-emerald-400 mb-2">Dikaryotic Mycelium</h4>
          <p className="text-sm text-zinc-400">
            When two compatible monokaryotic mycelia (A meets B) fuse, they form <strong className="text-zinc-300">dikaryotic mycelium</strong> -
            having the full genetic blueprint to produce mushrooms.
          </p>
        </div>
      </div>
    </div>

    <div className="p-5 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
      <div className="flex items-start gap-3">
        <Icons.Info />
        <div>
          <h4 className="font-medium text-emerald-400 mb-2">Why This Matters for Cultivators</h4>
          <p className="text-sm text-zinc-400 mb-3">
            In nature, mushrooms result from <strong className="text-zinc-300">multi-spore germination</strong>,
            leading to unpredictable traits - similar to growing plants from seeds. Each mushroom could be different.
          </p>
          <p className="text-sm text-zinc-400">
            For commercial cultivation, we need <strong className="text-zinc-300">predictable, consistent results</strong>.
            This is why commercial cultures are created from specifically selected dikaryotic mycelium - ensuring
            every grow produces mushrooms with the same traits: size, yield, color, flavor, and contamination resistance.
          </p>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <h4 className="font-semibold text-white">How Commercial Cultures Are Created</h4>

      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</span>
          <span className="font-medium text-white">Spore Isolation</span>
        </div>
        <p className="text-sm text-zinc-400 pl-11">
          Researchers isolate individual spores under a microscope and pair them randomly on agar plates
          (hundreds of combinations).
        </p>
      </div>

      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">2</span>
          <span className="font-medium text-white">Compatibility Testing</span>
        </div>
        <p className="text-sm text-zinc-400 pl-11">
          Since A/B types can't be visually identified, scientists observe which pairs successfully mate
          to form dikaryotic mycelium. Successful pairs become <strong className="text-emerald-400">P0 (Generation Zero)</strong>.
        </p>
      </div>

      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">3</span>
          <span className="font-medium text-white">Performance Testing</span>
        </div>
        <p className="text-sm text-zinc-400 pl-11">
          Each successful strain is grown to fruiting. Traits like size, flavor, yield, color, and contamination
          resistance are evaluated. Only strains meeting benchmarks are kept (often 7 out of 100).
        </p>
      </div>

      <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">4</span>
          <span className="font-medium text-white">Preservation & Distribution</span>
        </div>
        <p className="text-sm text-zinc-400 pl-11">
          Selected P0 cultures are preserved in cryogenic storage (liquid nitrogen) to halt aging.
          They're then expanded to P1 liquid cultures for distribution to growers.
        </p>
      </div>
    </div>

    <div className="p-5 bg-amber-950/30 rounded-xl border border-amber-800/50">
      <h4 className="font-medium text-amber-400 mb-2">Working with Agar Plates</h4>
      <p className="text-sm text-zinc-400">
        When transferring from agar, always select mycelium from the <strong className="text-zinc-300">outer edge</strong> of the plate.
        This is the youngest, most vigorous growth (vegetative stage). The center is older and has already
        transitioned to reproductive stage - using it accelerates senescence.
      </p>
    </div>
  </div>
);

const PValueSection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">What is a P-Value?</h3>
      <p className="text-zinc-300 leading-relaxed mb-4">
        The <strong className="text-emerald-400">P-value</strong> (Passage number) tracks how many times
        a culture has been transferred from its original source. Each transfer is one "passage."
        Lower P-values mean fresher genetics closer to the original isolate.
      </p>
      <p className="text-zinc-400 text-sm">
        This is also sometimes called the "generation" number. In MycoLab, we display this as
        P0, P1, P2, etc. on culture cards.
      </p>
    </div>

    <div className="space-y-3">
      <h4 className="font-semibold text-white">Generation Definitions</h4>

      <div className="p-4 bg-gradient-to-r from-emerald-950/50 to-zinc-900/50 rounded-xl border border-emerald-800/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl font-bold text-emerald-400">P0</span>
          <span className="text-white font-medium">Original Isolate</span>
        </div>
        <p className="text-sm text-zinc-400">
          The very first culture created from spores germination, tissue cloning from a wild specimen,
          or the original master culture from a supplier. This is your genetic source material.
        </p>
      </div>

      <div className="p-4 bg-gradient-to-r from-blue-950/50 to-zinc-900/50 rounded-xl border border-blue-800/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl font-bold text-blue-400">P1</span>
          <span className="text-white font-medium">First Expansion</span>
        </div>
        <p className="text-sm text-zinc-400">
          The first transfer from P0. Commercial labs often maintain a small number of P1 cultures
          as working stocks, expanding from these rather than touching the P0 master.
        </p>
      </div>

      <div className="p-4 bg-gradient-to-r from-amber-950/50 to-zinc-900/50 rounded-xl border border-amber-800/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl font-bold text-amber-400">P2</span>
          <span className="text-white font-medium">Second Transfer</span>
        </div>
        <p className="text-sm text-zinc-400">
          Expanded from P1. Still excellent quality. Many commercial operations use P2 as their
          primary production cultures for grain spawn inoculation.
        </p>
      </div>

      <div className="p-4 bg-gradient-to-r from-orange-950/50 to-zinc-900/50 rounded-xl border border-orange-800/50">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl font-bold text-orange-400">P3+</span>
          <span className="text-white font-medium">Later Passages</span>
        </div>
        <p className="text-sm text-zinc-400">
          Each additional passage increases the risk of genetic drift, contamination accumulation,
          and senescence. Most operations avoid going beyond P3-P4 for production use.
        </p>
      </div>
    </div>

    <div className="p-5 bg-amber-950/30 rounded-xl border border-amber-800/50">
      <h4 className="font-medium text-amber-400 mb-2">Best Practice</h4>
      <p className="text-sm text-zinc-400">
        Maintain your P0 as an untouched master, stored long-term in multiple slants or cryopreserved.
        Work from P1/P2 cultures for production. When those age out, return to P0 to create fresh
        working stocks rather than continuing to passage from older cultures.
      </p>
    </div>
  </div>
);

const ShelfLifeSection: React.FC = () => {
  const generations = [0, 1, 2, 3];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">Shelf Life by Generation</h3>
        <p className="text-zinc-300 leading-relaxed">
          Higher passage cultures degrade faster because they've undergone more divisions and
          accumulated more cellular stress. These estimates assume proper cold storage (2-4°C / 35-39°F).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {generations.map(gen => {
          const days = getExpectedShelfLifeDays(gen);
          const months = Math.round(days / 30);
          const color = gen === 0 ? 'emerald' : gen === 1 ? 'blue' : gen === 2 ? 'amber' : 'orange';

          return (
            <div
              key={gen}
              className={`p-5 bg-${color}-950/30 rounded-xl border border-${color}-800/50 text-center`}
              style={{
                backgroundColor: gen === 0 ? 'rgba(6, 78, 59, 0.3)' :
                                 gen === 1 ? 'rgba(30, 58, 138, 0.3)' :
                                 gen === 2 ? 'rgba(120, 53, 15, 0.3)' :
                                 'rgba(124, 45, 18, 0.3)',
                borderColor: gen === 0 ? 'rgba(16, 185, 129, 0.5)' :
                             gen === 1 ? 'rgba(59, 130, 246, 0.5)' :
                             gen === 2 ? 'rgba(245, 158, 11, 0.5)' :
                             'rgba(249, 115, 22, 0.5)',
              }}
            >
              <div className={`text-3xl font-bold mb-1 ${
                gen === 0 ? 'text-emerald-400' :
                gen === 1 ? 'text-blue-400' :
                gen === 2 ? 'text-amber-400' :
                'text-orange-400'
              }`}>
                P{gen}
              </div>
              <div className="text-2xl font-semibold text-white mb-1">
                {months} month{months !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-zinc-400">
                ~{days} days
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h4 className="font-semibold text-white mb-3">Factors Affecting Shelf Life</h4>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span><strong className="text-zinc-300">Temperature consistency:</strong> Fluctuations stress mycelium and reduce viability</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span><strong className="text-zinc-300">Media quality:</strong> Nutrient-rich media supports longer storage</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span><strong className="text-zinc-300">Sterile technique:</strong> Even minor contamination shortens usable life</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span><strong className="text-zinc-300">Species characteristics:</strong> Some species naturally store longer than others</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const SenescenceSection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">What is Senescence?</h3>
      <p className="text-zinc-300 leading-relaxed">
        <strong className="text-emerald-400">Senescence</strong> is the biological aging of mycelium that occurs
        with repeated subculturing. Over many passages, cultures lose vigor, produce lower yields,
        and may exhibit abnormal growth patterns. Recognizing the signs early helps you maintain
        productive cultures.
      </p>
    </div>

    <div className="space-y-3">
      <h4 className="font-semibold text-white">Warning Signs</h4>
      {senescenceSigns.map((sign, index) => (
        <div
          key={index}
          className={`p-4 rounded-xl border ${
            sign.severity === 'critical' ? 'bg-red-950/30 border-red-800/50' :
            sign.severity === 'warning' ? 'bg-amber-950/30 border-amber-800/50' :
            'bg-blue-950/30 border-blue-800/50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={
              sign.severity === 'critical' ? 'text-red-400' :
              sign.severity === 'warning' ? 'text-amber-400' :
              'text-blue-400'
            }>
              {sign.severity === 'critical' ? '🔴' : sign.severity === 'warning' ? '🟡' : '🔵'}
            </span>
            <span className="font-medium text-white">{sign.sign}</span>
          </div>
          <p className="text-sm text-zinc-400 pl-6">{sign.description}</p>
        </div>
      ))}
    </div>

    <div className="p-5 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
      <h4 className="font-medium text-emerald-400 mb-2">Prevention Strategies</h4>
      <ul className="space-y-2 text-sm text-zinc-400">
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          <span>Limit passage numbers - retire cultures at P3-P4</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          <span>Maintain frozen or cryopreserved P0 masters for recovery</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          <span>Use conservative expansion ratios (1:10 or less)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          <span>Store cultures properly at consistent temperatures</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-1">•</span>
          <span>Periodically test fruiting performance of working cultures</span>
        </li>
      </ul>
    </div>
  </div>
);

const StorageSection: React.FC = () => {
  const standardStorage = getStorageRecommendation(false);
  const tropicalStorage = getStorageRecommendation(true);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">Storage Temperature</h3>
        <p className="text-zinc-300 leading-relaxed">
          Most mushroom cultures store best at refrigerator temperatures, but some tropical species
          are cold-sensitive and can be damaged by standard refrigeration.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 bg-blue-950/30 rounded-xl border border-blue-800/50">
          <h4 className="font-semibold text-blue-400 mb-3">Standard Species</h4>
          <div className="text-3xl font-bold text-white mb-2">
            {standardStorage.tempC}°C / {standardStorage.tempF}°F
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Standard refrigerator temperature. Suitable for most temperate species including
            all oysters (except tropical varieties), shiitake, lion's mane, and most others.
          </p>
          <div className="text-xs text-zinc-500">
            Ideal range: 2-4°C (35-39°F)
          </div>
        </div>

        <div className="p-5 bg-amber-950/30 rounded-xl border border-amber-800/50">
          <h4 className="font-semibold text-amber-400 mb-3">Cold-Sensitive Species</h4>
          <div className="text-3xl font-bold text-white mb-2">
            {tropicalStorage.tempC}°C / {tropicalStorage.tempF}°F
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Tropical species require warmer storage. Standard refrigeration can damage or kill
            these cultures. Store in a cool room or wine cooler instead.
          </p>
          <div className="text-xs text-zinc-500">
            Minimum safe temperature for tropical species
          </div>
        </div>
      </div>

      <div className="p-5 bg-red-950/30 rounded-xl border border-red-800/50">
        <h4 className="font-medium text-red-400 mb-3">Cold-Sensitive Species List</h4>
        <p className="text-sm text-zinc-400 mb-3">
          Do NOT store these species in standard refrigeration (below 10°C/50°F):
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {coldSensitiveSpecies.map((species, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-amber-400">⚠️</span>
              <span className="text-zinc-300 italic">{species}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <h4 className="font-semibold text-white mb-3">Storage Tips</h4>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Seal plates with parafilm to prevent drying and contamination</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Store plates upside-down to prevent condensation on mycelium</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Keep LCs in dark storage - light can stimulate unwanted growth</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Label everything with date, strain, and passage number</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 mt-1">•</span>
            <span>Maintain multiple backup copies of important strains</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const ExpansionSection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">Expansion Ratios</h3>
      <p className="text-zinc-300 leading-relaxed">
        The <strong className="text-emerald-400">expansion ratio</strong> is how much you're diluting
        a culture when transferring it. Conservative ratios (1:10) minimize aging per generation,
        while aggressive ratios (1:20+) maximize output but accelerate senescence.
      </p>
    </div>

    <div className="space-y-4">
      {Object.entries(expansionRatios).map(([type, info]) => {
        const labels: Record<string, string> = {
          liquidCulture: 'Liquid Culture',
          agar: 'Agar Plates',
          grainSpawn: 'Grain Spawn',
        };

        return (
          <div key={type} className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <h4 className="font-semibold text-white mb-3">{labels[type]}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Recommended</div>
                <div className="text-xl font-bold text-emerald-400">{info.recommended}</div>
                <p className="text-sm text-zinc-400 mt-1">{info.description}</p>
              </div>
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Maximum</div>
                <div className="text-xl font-bold text-amber-400">{info.maxRatio}</div>
                <p className="text-sm text-zinc-400 mt-1">{info.warning}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="p-5 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
      <h4 className="font-medium text-emerald-400 mb-2">Why Conservative Ratios?</h4>
      <p className="text-sm text-zinc-400">
        When you use conservative expansion ratios (1:10 or less), each cell in the new culture
        divides fewer times to fill the container. This means less cellular stress and slower
        accumulation of the mutations that cause senescence. The trade-off is you produce less
        culture per transfer, but each generation stays productive longer.
      </p>
    </div>
  </div>
);

const TerminologySection: React.FC = () => (
  <div className="space-y-6">
    <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-lg font-semibold text-white mb-4">Mycology Terminology</h3>
      <p className="text-zinc-300 leading-relaxed">
        Common terms you'll encounter when working with mushroom cultures.
      </p>
    </div>

    <div className="space-y-3">
      {[
        { term: 'Mycelium', def: 'The vegetative body of a fungus, consisting of a network of thread-like hyphae. This is what grows in your cultures and colonizes substrates.' },
        { term: 'Hyphae', def: 'Individual filaments that make up mycelium. They grow at the tips and branch to form the mycelial network.' },
        { term: 'Dikaryotic', def: 'Having two genetically distinct nuclei per cell. Most commercial mushroom mycelium is dikaryotic, formed when two compatible monokaryotic strains mate.' },
        { term: 'Monokaryotic', def: 'Having one nucleus per cell. Mycelium grown directly from spores is initially monokaryotic until it mates with a compatible strain.' },
        { term: 'Colonization', def: 'The process of mycelium growing through and consuming a substrate or growth medium.' },
        { term: 'Primordia', def: 'The earliest stage of mushroom fruit body development, appearing as small pins or knots of mycelium. Also called "pins".' },
        { term: 'Fruiting Body', def: 'The mushroom itself - the reproductive structure that produces and releases spores.' },
        { term: 'Substrate', def: 'The material that provides nutrition for mycelium growth. Examples: sawdust, straw, grain, agar.' },
        { term: 'Inoculation', def: 'Introducing mycelium or spores to a new substrate or growth medium.' },
        { term: 'Transfer', def: 'Moving a piece of colonized material to fresh media. Each transfer increments the passage number.' },
        { term: 'Clone', def: 'A culture created from tissue of a fruit body, genetically identical to the parent mushroom.' },
        { term: 'Isolate', def: 'A pure culture derived from a single point of origin, whether from spores, tissue, or selected sectors.' },
        { term: 'Sectoring', def: 'When distinct regions of different growth appear on an agar plate, often indicating genetic variation or contamination.' },
        { term: 'Rhizomorphic', def: 'Mycelium growth pattern showing thick, rope-like strands. Generally indicates healthy, aggressive growth.' },
        { term: 'Tomentose', def: 'Fluffy, cotton-like mycelium growth pattern. Normal for some species, but can indicate weakness in others.' },
      ].map((item, index) => (
        <div key={index} className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <dt className="font-semibold text-emerald-400 mb-1">{item.term}</dt>
          <dd className="text-sm text-zinc-400">{item.def}</dd>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CultureGuideProps {
  onNavigate?: (page: string) => void;
}

export const CultureGuide: React.FC<CultureGuideProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection />;
      case 'reproduction': return <ReproductionSection />;
      case 'pvalue': return <PValueSection />;
      case 'shelflife': return <ShelfLifeSection />;
      case 'senescence': return <SenescenceSection />;
      case 'storage': return <StorageSection />;
      case 'expansion': return <ExpansionSection />;
      case 'terminology': return <TerminologySection />;
      default: return <OverviewSection />;
    }
  };

  const currentSectionInfo = sections.find(s => s.id === activeSection)!;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Navigation Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="lg:sticky lg:top-6 space-y-2">
          <h2 className="text-lg font-semibold text-white mb-4 hidden lg:block">Culture Guide</h2>
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal min-w-max lg:min-w-0 w-full ${
                  activeSection === section.id
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-400'
                    : 'bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <span className="text-lg w-6 text-center">{section.icon}</span>
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">{currentSectionInfo.title}</h2>
          <p className="text-zinc-400">{currentSectionInfo.description}</p>
        </div>
        {renderSection()}

        {/* Quick Actions - Links to App Features */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Related Tools</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSection === 'expansion' && onNavigate && (
              <button
                onClick={() => onNavigate('multiplication')}
                className="flex items-center gap-3 p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-left hover:bg-emerald-950/50 transition-all group"
              >
                <span className="text-2xl">🧮</span>
                <div>
                  <p className="font-medium text-emerald-400 group-hover:text-emerald-300">Culture Expansion Calculator</p>
                  <p className="text-xs text-zinc-500">Calculate costs and P-value progression</p>
                </div>
              </button>
            )}
            {(activeSection === 'overview' || activeSection === 'pvalue') && onNavigate && (
              <button
                onClick={() => onNavigate('cultures')}
                className="flex items-center gap-3 p-4 bg-blue-950/30 border border-blue-800/50 rounded-xl text-left hover:bg-blue-950/50 transition-all group"
              >
                <span className="text-2xl">💧</span>
                <div>
                  <p className="font-medium text-blue-400 group-hover:text-blue-300">Culture Library</p>
                  <p className="text-xs text-zinc-500">Manage your cultures and genetics</p>
                </div>
              </button>
            )}
            {activeSection === 'storage' && onNavigate && (
              <button
                onClick={() => onNavigate('coldstorage')}
                className="flex items-center gap-3 p-4 bg-cyan-950/30 border border-cyan-800/50 rounded-xl text-left hover:bg-cyan-950/50 transition-all group"
              >
                <span className="text-2xl">❄️</span>
                <div>
                  <p className="font-medium text-cyan-400 group-hover:text-cyan-300">Cold Storage Check</p>
                  <p className="text-xs text-zinc-500">Review fridge inventory</p>
                </div>
              </button>
            )}
            {activeSection === 'shelflife' && onNavigate && (
              <button
                onClick={() => onNavigate('multiplication')}
                className="flex items-center gap-3 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-left hover:bg-amber-950/50 transition-all group"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-amber-400 group-hover:text-amber-300">Expansion Calculator</p>
                  <p className="text-xs text-zinc-500">Track P-values and shelf life</p>
                </div>
              </button>
            )}
            {activeSection === 'senescence' && onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('cultures')}
                  className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-left hover:bg-red-950/50 transition-all group"
                >
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-medium text-red-400 group-hover:text-red-300">Check Culture Health</p>
                    <p className="text-xs text-zinc-500">Review P-values and condition</p>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('contamination')}
                  className="flex items-center gap-3 p-4 bg-orange-950/30 border border-orange-800/50 rounded-xl text-left hover:bg-orange-950/50 transition-all group"
                >
                  <span className="text-2xl">🔬</span>
                  <div>
                    <p className="font-medium text-orange-400 group-hover:text-orange-300">Contamination Analysis</p>
                    <p className="text-xs text-zinc-500">Track contamination patterns</p>
                  </div>
                </button>
              </>
            )}
            {/* Always show some helpful links */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('library')}
                className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-left hover:bg-zinc-800 transition-all group"
              >
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium text-zinc-300 group-hover:text-white">Species Library</p>
                  <p className="text-xs text-zinc-500">Growing parameters by species</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultureGuide;
