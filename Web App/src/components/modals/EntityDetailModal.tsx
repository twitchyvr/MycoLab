// ============================================================================
// ENTITY DETAIL MODAL
// Standardized modal for viewing any entity with full details, history, and tabs
// Replaces cramped accordion panels with spacious tab-based navigation
// ============================================================================

import React, { useState, useCallback, useEffect } from 'react';
import { Portal } from '../common';
import type { Culture, Grow, Recipe, InventoryItem, Location } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

export type DetailEntityType = 'culture' | 'grow' | 'recipe' | 'inventory' | 'location';

export type DetailEntity = Culture | Grow | Recipe | InventoryItem | Location;

export interface EntityDetailTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

export interface EntityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: DetailEntityType;
  entity: DetailEntity;

  // Tab configuration - which tabs to show for this entity
  tabs: EntityDetailTab[];

  // Active tab
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // Header customization
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  statusBadge?: React.ReactNode;

  // Tab content renderer
  children: React.ReactNode;

  // Footer actions
  actions?: React.ReactNode;

  // Sizing
  size?: 'default' | 'wide' | 'full';

  // Optional callback when navigating to related entities
  onNavigate?: (entityType: DetailEntityType, entityId: string) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
};

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses = {
  default: 'max-w-4xl',   // 896px - most entities
  wide: 'max-w-6xl',      // 1152px - lineage views, complex data
  full: 'max-w-7xl',      // 1280px - dashboards, full analysis
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entity,
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  title,
  subtitle,
  icon,
  statusBadge,
  children,
  actions,
  size = 'default',
  onNavigate,
}) => {
  // Internal tab state (if not controlled)
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = useCallback((tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  }, [onTabChange]);

  // Reset to first tab when entity changes
  useEffect(() => {
    if (tabs[0] && !controlledActiveTab) {
      setInternalActiveTab(tabs[0].id);
    }
  }, [entity, tabs, controlledActiveTab]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 pointer-events-none">
        <div
          className={`
            w-full ${sizeClasses[size]}
            bg-zinc-900 border border-zinc-700 rounded-xl
            flex flex-col
            max-h-[90vh] min-h-[60vh]
            pointer-events-auto
            shadow-2xl
          `}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* ============================================================ */}
          {/* HEADER */}
          {/* ============================================================ */}
          <div className="flex-shrink-0 border-b border-zinc-800">
            {/* Title Bar */}
            <div className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3 min-w-0">
                {/* Entity icon */}
                {icon && (
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{icon}</span>
                )}

                {/* Title and subtitle */}
                <div className="min-w-0">
                  <h2
                    id="modal-title"
                    className="text-lg sm:text-xl font-bold text-white truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-zinc-400 truncate">{subtitle}</p>
                  )}
                </div>

                {/* Status badge */}
                {statusBadge && (
                  <div className="flex-shrink-0 ml-2">
                    {statusBadge}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2.5 min-w-[44px] min-h-[44px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <Icons.X />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 sm:px-5 -mb-px">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium
                      border-b-2 transition-colors whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                      }
                    `}
                    aria-selected={activeTab === tab.id}
                    role="tab"
                  >
                    <span className="text-current">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`
                        px-1.5 py-0.5 text-xs rounded-full
                        ${activeTab === tab.id
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-700 text-zinc-400'
                        }
                      `}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CONTENT AREA */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" role="tabpanel">
            {children}
          </div>

          {/* ============================================================ */}
          {/* FOOTER / ACTIONS */}
          {/* ============================================================ */}
          {actions && (
            <div className="flex-shrink-0 border-t border-zinc-800 p-4 sm:p-5">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default EntityDetailModal;
