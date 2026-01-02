// ============================================================================
// GLOBAL SEARCH - Cmd+K Quick Search Modal
// Search across all entities: cultures, grows, strains, recipes, inventory
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useData } from '../../store';

// ============================================================================
// TYPES
// ============================================================================

type Page = 'dashboard' | 'today' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'settings' | 'devlog' | 'library' | 'cultureguide';

interface SearchResult {
  id: string;
  type: 'culture' | 'grow' | 'strain' | 'recipe' | 'species' | 'location' | 'inventory' | 'page' | 'guide';
  title: string;
  subtitle: string;
  icon: string;
  page: Page;
  metadata?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page, itemId?: string, itemType?: string) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3" />
      <line x1="9" y1="3" x2="15" y2="3" />
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  ),
  Strain: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
  Recipe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Species: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 2L12 22" />
      <path d="M17 7C17 7 13 9 12 14" />
      <path d="M7 7C7 7 11 9 12 14" />
      <path d="M19 12C19 12 15 13 12 17" />
      <path d="M5 12C5 12 9 13 12 17" />
    </svg>
  ),
  Location: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Inventory: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Command: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  GraduationCap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
};

// ============================================================================
// TYPE CONFIG
// ============================================================================

const typeConfig: Record<SearchResult['type'], { icon: React.FC; color: string; bgColor: string }> = {
  culture: { icon: Icons.Culture, color: 'text-blue-400', bgColor: 'bg-blue-950/50' },
  grow: { icon: Icons.Grow, color: 'text-emerald-400', bgColor: 'bg-emerald-950/50' },
  strain: { icon: Icons.Strain, color: 'text-purple-400', bgColor: 'bg-purple-950/50' },
  recipe: { icon: Icons.Recipe, color: 'text-amber-400', bgColor: 'bg-amber-950/50' },
  species: { icon: Icons.Species, color: 'text-pink-400', bgColor: 'bg-pink-950/50' },
  location: { icon: Icons.Location, color: 'text-cyan-400', bgColor: 'bg-cyan-950/50' },
  inventory: { icon: Icons.Inventory, color: 'text-orange-400', bgColor: 'bg-orange-950/50' },
  page: { icon: Icons.Book, color: 'text-indigo-400', bgColor: 'bg-indigo-950/50' },
  guide: { icon: Icons.GraduationCap, color: 'text-teal-400', bgColor: 'bg-teal-950/50' },
};

// ============================================================================
// STATIC SEARCHABLE CONTENT
// Knowledge Base pages and Culture Guide sections
// ============================================================================

interface StaticSearchItem {
  id: string;
  type: 'page' | 'guide';
  title: string;
  subtitle: string;
  keywords: string[];
  page: Page;
}

const staticSearchItems: StaticSearchItem[] = [
  // Knowledge Base / Library pages
  {
    id: 'page-library',
    type: 'page',
    title: 'Species & Strain Library',
    subtitle: 'Browse all species and strains with growing parameters',
    keywords: ['knowledge base', 'library', 'species', 'strain', 'reference', 'mushroom', 'growing'],
    page: 'library',
  },
  {
    id: 'page-cultureguide',
    type: 'page',
    title: 'Culture Guide',
    subtitle: 'P-values, shelf life, senescence, and best practices',
    keywords: ['culture', 'guide', 'p-value', 'pvalue', 'passage', 'shelf life', 'senescence', 'storage'],
    page: 'cultureguide',
  },

  // Culture Guide sections
  {
    id: 'guide-overview',
    type: 'guide',
    title: 'Culture Types Overview',
    subtitle: 'LC, agar plates, slants, and spore syringes explained',
    keywords: ['culture', 'liquid culture', 'lc', 'agar', 'slant', 'spore', 'syringe', 'overview', 'types'],
    page: 'cultureguide',
  },
  {
    id: 'guide-pvalue',
    type: 'guide',
    title: 'P-Value System',
    subtitle: 'Understanding passage numbers and generation tracking',
    keywords: ['p-value', 'pvalue', 'passage', 'generation', 'transfer', 'genetics', 'vigor', 'senescence'],
    page: 'cultureguide',
  },
  {
    id: 'guide-shelflife',
    type: 'guide',
    title: 'Shelf Life by Generation',
    subtitle: 'How long cultures remain viable based on P-value',
    keywords: ['shelf life', 'viability', 'expiry', 'expiration', 'storage', 'longevity', 'fresh'],
    page: 'cultureguide',
  },
  {
    id: 'guide-senescence',
    type: 'guide',
    title: 'Recognizing Senescence',
    subtitle: 'Signs of culture degradation and when to refresh genetics',
    keywords: ['senescence', 'degradation', 'aging', 'weak', 'slow', 'contamination', 'refresh', 'genetics'],
    page: 'cultureguide',
  },
  {
    id: 'guide-storage',
    type: 'guide',
    title: 'Culture Storage & Temperature',
    subtitle: 'Optimal storage conditions and cold-sensitive species',
    keywords: ['storage', 'temperature', 'cold', 'fridge', 'refrigerator', 'freezer', 'preservation'],
    page: 'cultureguide',
  },
  {
    id: 'guide-expansion',
    type: 'guide',
    title: 'Expansion Ratios',
    subtitle: 'Best practices for culture transfers and multiplication',
    keywords: ['expansion', 'ratio', 'transfer', 'multiply', 'scale', 'propagate', 'inoculate'],
    page: 'cultureguide',
  },
  {
    id: 'guide-terminology',
    type: 'guide',
    title: 'Mycology Terminology',
    subtitle: 'Key terms and definitions for mushroom cultivation',
    keywords: ['terminology', 'glossary', 'terms', 'definitions', 'mycology', 'vocabulary', 'learn'],
    page: 'cultureguide',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const { state, activeStrains, activeSpecies, activeLocations, activeRecipes, activeInventoryItems } = useData();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build searchable index
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search cultures
    state.cultures.forEach(culture => {
      const strain = activeStrains.find(s => s.id === culture.strainId);
      const searchText = `${culture.label} ${strain?.name || ''} ${culture.notes || ''} ${culture.type}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: culture.id,
          type: 'culture',
          title: culture.label,
          subtitle: `${strain?.name || 'Unknown strain'} • ${culture.type.replace('_', ' ')}`,
          icon: culture.type === 'liquid_culture' ? '🧪' : culture.type === 'agar' ? '🍽️' : culture.type === 'spore_syringe' ? '💉' : '🧫',
          page: 'cultures',
          metadata: culture.status,
        });
      }
    });

    // Search grows
    state.grows.forEach(grow => {
      const strain = activeStrains.find(s => s.id === grow.strainId);
      const searchText = `${grow.name} ${strain?.name || ''} ${grow.notes || ''} ${grow.currentStage}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: grow.id,
          type: 'grow',
          title: grow.name,
          subtitle: `${strain?.name || 'Unknown strain'} • ${grow.currentStage}`,
          icon: '🌱',
          page: 'grows',
          metadata: grow.status,
        });
      }
    });

    // Search strains
    activeStrains.forEach(strain => {
      const searchText = `${strain.name} ${strain.species || ''} ${strain.notes || ''} ${strain.variety || ''}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: strain.id,
          type: 'strain',
          title: strain.name,
          subtitle: strain.species || 'Unknown species',
          icon: '🍄',
          page: 'settings',
          metadata: strain.difficulty,
        });
      }
    });

    // Search species
    activeSpecies.forEach(species => {
      const searchText = `${species.name} ${species.scientificName || ''} ${species.commonNames?.join(' ') || ''} ${species.characteristics || ''}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: species.id,
          type: 'species',
          title: species.name,
          subtitle: species.scientificName || species.category,
          icon: '🧬',
          page: 'settings',
          metadata: species.difficulty,
        });
      }
    });

    // Search recipes
    activeRecipes.forEach(recipe => {
      const searchText = `${recipe.name} ${recipe.description || ''} ${recipe.category} ${recipe.notes || ''}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: recipe.id,
          type: 'recipe',
          title: recipe.name,
          subtitle: `${recipe.category.replace('_', ' ')} • ${recipe.yield.amount} ${recipe.yield.unit}`,
          icon: '📋',
          page: 'recipes',
        });
      }
    });

    // Search locations
    activeLocations.forEach(location => {
      const searchText = `${location.name} ${location.type || ''} ${location.notes || ''}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: location.id,
          type: 'location',
          title: location.name,
          subtitle: location.type || 'Location',
          icon: '📍',
          page: 'settings',
        });
      }
    });

    // Search inventory items
    activeInventoryItems.forEach(item => {
      const searchText = `${item.name} ${item.sku || ''} ${item.notes || ''}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: item.id,
          type: 'inventory',
          title: item.name,
          subtitle: `${item.quantity} ${item.unit} in stock`,
          icon: '📦',
          page: 'stock',
        });
      }
    });

    // Search Knowledge Base pages and Culture Guide sections
    staticSearchItems.forEach(item => {
      const searchText = `${item.title} ${item.subtitle} ${item.keywords.join(' ')}`.toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          id: item.id,
          type: item.type,
          title: item.title,
          subtitle: item.subtitle,
          icon: item.type === 'page' ? '📚' : '🎓',
          page: item.page,
        });
      }
    });

    // Limit results and sort by relevance (exact matches first)
    return results
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 0 : 1;
        const bExact = b.title.toLowerCase().startsWith(q) ? 0 : 1;
        return aExact - bExact;
      })
      .slice(0, 20);
  }, [query, state.cultures, state.grows, activeStrains, activeSpecies, activeRecipes, activeLocations, activeInventoryItems]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelectResult(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [searchResults, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    onNavigate(result.page, result.id, result.type);
    onClose();

    // Dispatch event to select the item on the target page
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sporely:select-item', {
        detail: { id: result.id, type: result.type }
      }));
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <div className="text-zinc-500">
            <Icons.Search />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search cultures, grows, strains, recipes..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-lg focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-6 text-center">
              <p className="text-zinc-500 text-sm">Start typing to search across all your data</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['cultures', 'grows', 'strains', 'recipes', 'species', 'inventory'].map(type => (
                  <span key={type} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 capitalize">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-zinc-500">No results found for "{query}"</p>
              <p className="text-zinc-600 text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => {
                const config = typeConfig[result.type];
                const IconComponent = config.icon;
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    data-index={index}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <span className={config.color}><IconComponent /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{result.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 truncate">{result.subtitle}</p>
                    </div>
                    {isSelected && (
                      <div className="text-zinc-500">
                        <Icons.ArrowRight />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700">↑</kbd>
              <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700">↵</kbd>
              select
            </span>
          </div>
          <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SEARCH TRIGGER BUTTON (for nav bar)
// ============================================================================

interface SearchTriggerProps {
  onClick: () => void;
}

export const SearchTrigger: React.FC<SearchTriggerProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
    >
      <Icons.Search />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-900 rounded text-xs border border-zinc-600">
        <Icons.Command />K
      </kbd>
    </button>
  );
};

export default GlobalSearch;
