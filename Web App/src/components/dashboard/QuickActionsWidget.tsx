// ============================================================================
// QUICK ACTIONS WIDGET
// One-click actions for common daily operations
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../store';
import { useNotifications } from '../../store/NotificationContext';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  badge?: number;
  description?: string;
}

interface QuickActionsWidgetProps {
  onNavigate: (page: string) => void;
  variant?: 'grid' | 'list' | 'compact';
  showLabels?: boolean;
  className?: string;
}

interface FloatingActionButtonProps {
  onNavigate: (page: string) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Culture: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M8 3v4l-2 9a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4l-2-9V3"/>
      <line x1="9" y1="3" x2="15" y2="3"/>
    </svg>
  ),
  Grow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/>
      <path d="M19 12C19 12 15 13 12 17"/><path d="M5 12C5 12 9 13 12 17"/>
    </svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  Harvest: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M6 3v18"/><path d="M18 3v18"/>
      <path d="M6 8c4-1 8-1 12 0"/><path d="M6 13c4-1 8-1 12 0"/><path d="M6 18c4-1 8-1 12 0"/>
    </svg>
  ),
  Transfer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Recipe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Calculator: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/>
      <line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onNavigate,
  variant = 'grid',
  showLabels = true,
  className = '',
}) => {
  const { state } = useData();
  const { toast } = useNotifications();

  // Calculate badges
  const activeGrows = state.grows.filter(g => g.status === 'active');
  const fruitingGrows = activeGrows.filter(g => g.currentStage === 'fruiting' || g.currentStage === 'harvesting');
  const activeCultures = state.cultures.filter(c => c.status === 'active' || c.status === 'ready');

  const handleCreateNew = (page: string) => {
    onNavigate(page);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sporely:create-new', { detail: { page } }));
    }, 100);
  };

  const actions: QuickAction[] = [
    {
      id: 'new-culture',
      label: 'New Culture',
      icon: <Icons.Culture />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/50',
      borderColor: 'border-blue-800',
      onClick: () => handleCreateNew('cultures'),
      description: 'Create a new culture entry',
    },
    {
      id: 'new-grow',
      label: 'New Grow',
      icon: <Icons.Grow />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/50',
      borderColor: 'border-emerald-800',
      onClick: () => handleCreateNew('grows'),
      description: 'Start a new grow',
    },
    {
      id: 'log-observation',
      label: 'Log Observation',
      icon: <Icons.Clipboard />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/50',
      borderColor: 'border-purple-800',
      onClick: () => onNavigate('observations'),
      badge: activeGrows.length + activeCultures.length,
      description: 'Record a new observation',
    },
    {
      id: 'record-harvest',
      label: 'Record Harvest',
      icon: <Icons.Harvest />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/50',
      borderColor: 'border-amber-800',
      onClick: () => onNavigate('grows'),
      badge: fruitingGrows.length > 0 ? fruitingGrows.length : undefined,
      description: 'Log a harvest from active grows',
    },
    {
      id: 'transfer-culture',
      label: 'Transfer',
      icon: <Icons.Transfer />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/50',
      borderColor: 'border-cyan-800',
      onClick: () => onNavigate('cultures'),
      description: 'Transfer culture to new media',
    },
    {
      id: 'daily-check',
      label: 'Daily Check',
      icon: <Icons.Check />,
      color: 'text-green-400',
      bgColor: 'bg-green-950/50',
      borderColor: 'border-green-800',
      onClick: () => onNavigate('today'),
      description: 'View today\'s tasks',
    },
    {
      id: 'new-recipe',
      label: 'New Recipe',
      icon: <Icons.Recipe />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-950/50',
      borderColor: 'border-pink-800',
      onClick: () => handleCreateNew('recipes'),
      description: 'Create a new recipe',
    },
    {
      id: 'calculator',
      label: 'Calculator',
      icon: <Icons.Calculator />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/50',
      borderColor: 'border-orange-800',
      onClick: () => onNavigate('calculator'),
      description: 'Substrate calculator',
    },
  ];

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {actions.slice(0, 4).map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
              ${action.bgColor} ${action.borderColor} hover:brightness-110
            `}
            title={action.description}
          >
            <span className={action.color}>{action.icon}</span>
            {showLabels && <span className="text-sm text-white">{action.label}</span>}
            {action.badge && action.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {action.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
              bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600
            `}
          >
            <div className={`w-10 h-10 rounded-lg ${action.bgColor} ${action.borderColor} border flex items-center justify-center ${action.color}`}>
              {action.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">{action.label}</p>
              {action.description && (
                <p className="text-xs text-zinc-500">{action.description}</p>
              )}
            </div>
            {action.badge && action.badge > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-amber-400 bg-amber-950/50 rounded-full">
                {action.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default grid view
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${className}`}>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="relative p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg text-center transition-colors group"
        >
          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${action.bgColor} ${action.borderColor} border flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
            {action.icon}
          </div>
          {showLabels && <p className="text-sm text-white">{action.label}</p>}
          {action.badge && action.badge > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
              {action.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// FLOATING ACTION BUTTON (FAB)
// Mobile-friendly floating button with expandable menu
// ============================================================================

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detect when to hide the FAB:
  // 1. When modals are open
  // 2. When detail panels are open (to avoid overlap)
  // 3. On larger screens where header buttons provide same functionality
  useEffect(() => {
    const checkVisibility = () => {
      // Check for modal overlays
      const modals = document.querySelectorAll('.fixed.inset-0.bg-black\\/50, .fixed.inset-0[class*="bg-black"]');
      if (modals.length > 0) {
        setShouldHide(true);
        return;
      }

      // Check for detail panels (CultureDetailView or similar right-side panels)
      // These typically have the data-detail-panel attribute or are positioned sticky on the right
      const detailPanels = document.querySelectorAll('[data-detail-panel], .sticky.top-6.max-w-md');
      if (detailPanels.length > 0) {
        setShouldHide(true);
        return;
      }

      setShouldHide(false);
    };

    // Initial check
    checkVisibility();

    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(checkVisibility);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Don't render if should hide
  if (shouldHide) {
    return null;
  }

  const handleCreateNew = (page: string) => {
    setIsOpen(false);
    onNavigate(page);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sporely:create-new', { detail: { page } }));
    }, 100);
  };

  const fabActions = [
    { id: 'culture', label: 'New Culture', icon: <Icons.Culture />, color: 'bg-blue-600', action: () => handleCreateNew('cultures') },
    { id: 'grow', label: 'New Grow', icon: <Icons.Grow />, color: 'bg-emerald-600', action: () => handleCreateNew('grows') },
    { id: 'observation', label: 'Log Observation', icon: <Icons.Clipboard />, color: 'bg-purple-600', action: () => { setIsOpen(false); onNavigate('observations'); } },
    { id: 'harvest', label: 'Record Harvest', icon: <Icons.Harvest />, color: 'bg-amber-600', action: () => { setIsOpen(false); onNavigate('grows'); } },
  ];

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Expanded menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-fade-in">
          {fabActions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.action}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white
                ${action.color} hover:brightness-110 transition-all
                animate-slide-up
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {action.icon}
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300
          ${isOpen
            ? 'bg-zinc-700 rotate-45'
            : 'bg-emerald-500 hover:bg-emerald-600'
          }
        `}
      >
        {isOpen ? (
          <Icons.X />
        ) : (
          <Icons.Plus />
        )}
      </button>
    </div>
  );
};

export default QuickActionsWidget;
