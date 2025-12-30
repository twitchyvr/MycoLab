// ============================================================================
// WARNINGS PANEL - Displays active warnings from the info system
// Can be placed on any page to show relevant contextual warnings
// ============================================================================

import React from 'react';
import { useInfoOptional, InfoCategory, InfoPriority } from '../../store/InfoContext';
import { ContextualWarning } from './InfoComponents';

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  collapse: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  expand: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// ============================================================================
// WARNINGS PANEL
// ============================================================================

interface WarningsPanelProps {
  category?: InfoCategory;            // Filter by category
  maxVisible?: number;                // Max warnings to show initially
  showTitle?: boolean;                // Show "Warnings" header
  collapsible?: boolean;              // Allow collapsing
  defaultCollapsed?: boolean;         // Start collapsed
  className?: string;
}

export const WarningsPanel: React.FC<WarningsPanelProps> = ({
  category,
  maxVisible = 3,
  showTitle = true,
  collapsible = true,
  defaultCollapsed = false,
  className = '',
}) => {
  const infoContext = useInfoOptional();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [showAll, setShowAll] = React.useState(false);

  if (!infoContext) return null;

  const { activeWarnings, dismissWarning, shouldShow } = infoContext;

  // Filter warnings by category if provided
  const filteredWarnings = category
    ? activeWarnings.filter(w => {
        // Check if this warning's definition matches the category
        return true; // Would need to lookup the definition to filter properly
      })
    : activeWarnings;

  // Check if we should show warnings at all
  if (!shouldShow('warning')) return null;
  if (filteredWarnings.length === 0) return null;

  const visibleWarnings = showAll ? filteredWarnings : filteredWarnings.slice(0, maxVisible);
  const hasMore = filteredWarnings.length > maxVisible;

  return (
    <div className={`${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">
              <Icons.warning />
            </span>
            <h3 className="text-sm font-medium text-white">
              Warnings ({filteredWarnings.length})
            </h3>
          </div>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-zinc-500 hover:text-zinc-400 p-1"
            >
              {isCollapsed ? <Icons.expand /> : <Icons.collapse />}
            </button>
          )}
        </div>
      )}

      {/* Warnings List */}
      {!isCollapsed && (
        <div className="space-y-2">
          {visibleWarnings.map((warning) => (
            <ContextualWarning
              key={warning.id}
              title={warning.entityLabel || 'Warning'}
              message={warning.data?.message || 'An issue requires your attention'}
              priority={warning.data?.priority || 'medium'}
              resolution={warning.data?.resolution}
              isDismissible
              onDismiss={() => dismissWarning(warning.id)}
              variant="inline"
            />
          ))}

          {/* Show more/less */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              {showAll ? 'Show less' : `Show ${filteredWarnings.length - maxVisible} more`}
            </button>
          )}
        </div>
      )}

      {/* Collapsed indicator */}
      {isCollapsed && filteredWarnings.length > 0 && (
        <div className="text-xs text-amber-400/70">
          {filteredWarnings.length} warning{filteredWarnings.length > 1 ? 's' : ''} hidden
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ACTIVE TIPS PANEL - Displays proactive tips
// ============================================================================

interface TipsPanelProps {
  category?: InfoCategory;
  maxVisible?: number;
  className?: string;
}

export const TipsPanel: React.FC<TipsPanelProps> = ({
  category,
  maxVisible = 2,
  className = '',
}) => {
  const infoContext = useInfoOptional();

  if (!infoContext) return null;

  const { activeTips, dismissTip, snoozeTip, shouldShow } = infoContext;

  if (!shouldShow('tip')) return null;
  if (activeTips.length === 0) return null;

  const visibleTips = activeTips.slice(0, maxVisible);

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleTips.map((tip) => (
        <div
          key={tip.id}
          className="bg-purple-950/30 border border-purple-800/50 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-purple-400 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M9 18h6M10 22h4M12 2v1M12 9a3 3 0 1 0 0 6v0"/>
                <path d="M21 12h1M3 12h1M18.364 5.636l-.707.707M6.343 17.657l-.707.707M5.636 5.636l.707.707M17.657 17.657l.707.707"/>
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{tip.data?.title || 'Tip'}</p>
              <p className="text-xs text-zinc-400 mt-1">{tip.data?.message}</p>
              <div className="flex gap-3 mt-3">
                {tip.data?.actionLabel && (
                  <button
                    onClick={tip.data?.onAction}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {tip.data.actionLabel} →
                  </button>
                )}
                <button
                  onClick={() => snoozeTip(tip.id, 1)}
                  className="text-xs text-zinc-500 hover:text-zinc-400"
                >
                  Later
                </button>
                <button
                  onClick={() => dismissTip(tip.id, true)}
                  className="text-xs text-zinc-500 hover:text-zinc-400"
                >
                  Don't show again
                </button>
              </div>
            </div>
            <button
              onClick={() => dismissTip(tip.id)}
              className="text-zinc-500 hover:text-zinc-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// QUICK HELP SEARCH
// ============================================================================

interface QuickHelpSearchProps {
  placeholder?: string;
  className?: string;
}

export const QuickHelpSearch: React.FC<QuickHelpSearchProps> = ({
  placeholder = 'Search help...',
  className = '',
}) => {
  const infoContext = useInfoOptional();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  if (!infoContext) return null;

  const { searchHelp } = infoContext;

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const searchResults = searchHelp(value);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
        />
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              className="w-full p-3 text-left hover:bg-zinc-700 border-b border-zinc-700 last:border-b-0"
            >
              <p className="text-sm font-medium text-white">{result.title}</p>
              <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{result.content}</p>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 p-4 text-center">
          <p className="text-sm text-zinc-400">No help topics found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default WarningsPanel;
