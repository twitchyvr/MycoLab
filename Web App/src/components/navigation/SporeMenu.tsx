// ============================================================================
// SPORE MENU - Radial Quick-Access Navigation
// A mushroom-cap styled FAB that opens to reveal quick navigation options
// like spores dispersing from a fruiting body
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Page } from './types';
import { calculateRadialPosition } from './types';
import { getQuickAccessNodes, categoryMeta, NavIcons, getNodeById } from './navData';

interface SporeMenuProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenHub: () => void;
  className?: string;
}

interface SporeItemProps {
  node: ReturnType<typeof getQuickAccessNodes>[0];
  isActive: boolean;
  position: { x: number; y: number };
  delay: number;
  isExpanded: boolean;
  onClick: () => void;
}

// ============================================================================
// SPORE ITEM - Individual menu item with animation
// ============================================================================

const SporeItem: React.FC<SporeItemProps> = ({
  node,
  isActive,
  position,
  delay,
  isExpanded,
  onClick,
}) => {
  const Icon = node.icon;
  const meta = categoryMeta[node.category];

  return (
    <button
      onClick={onClick}
      className={`
        absolute flex items-center justify-center
        w-12 h-12 rounded-full
        transition-all ease-out
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950
        ${isExpanded
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
        }
        ${isActive
          ? `bg-${meta.color}-500/30 border-2 border-${meta.color}-400 text-${meta.color}-400`
          : 'bg-zinc-800/90 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
        }
        group backdrop-blur-sm
      `}
      style={{
        transform: isExpanded
          ? `translate(${position.x}px, ${position.y}px)`
          : 'translate(0, 0) scale(0.5)',
        transitionDuration: isExpanded ? '300ms' : '200ms',
        transitionDelay: isExpanded ? `${delay}ms` : `${(6 - delay / 30) * 30}ms`,
        boxShadow: isActive
          ? `0 0 15px ${meta.glowColor}, 0 4px 12px rgba(0, 0, 0, 0.3)`
          : '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
      aria-label={`Navigate to ${node.label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon */}
      <Icon className="w-5 h-5" />

      {/* Tooltip */}
      <span
        className={`
          absolute left-full ml-3 px-2.5 py-1.5
          bg-zinc-800/95 border border-zinc-700 rounded-lg
          text-xs font-medium text-white whitespace-nowrap
          opacity-0 group-hover:opacity-100 group-focus:opacity-100
          transition-opacity pointer-events-none
          backdrop-blur-sm shadow-lg
        `}
        style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        {node.label}
        {isActive && (
          <span className={`ml-2 text-${meta.color}-400`}>
            (current)
          </span>
        )}
      </span>

      {/* Active indicator ring */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: meta.glowColor }}
        />
      )}
    </button>
  );
};

// ============================================================================
// MAIN SPORE MENU COMPONENT
// ============================================================================

export const SporeMenu: React.FC<SporeMenuProps> = ({
  currentPage,
  onNavigate,
  onOpenHub,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const quickAccessNodes = useMemo(() => getQuickAccessNodes(), []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Handle animation state
  useEffect(() => {
    if (isExpanded) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const toggleMenu = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleNavigate = useCallback((page: Page) => {
    onNavigate(page);
    setIsExpanded(false);
  }, [onNavigate]);

  const handleOpenHub = useCallback(() => {
    onOpenHub();
    setIsExpanded(false);
  }, [onOpenHub]);

  // Calculate positions for spore items (radial layout)
  const radius = 90; // Distance from center
  const itemPositions = useMemo(() => {
    return quickAccessNodes.map((_, index) => {
      // Position items in an arc from -135 to 135 degrees (left side visible)
      // This creates a semicircle on the left side of the button
      const startAngle = -135;
      const endAngle = 135;
      const angleStep = (endAngle - startAngle) / (quickAccessNodes.length);
      return calculateRadialPosition(index, quickAccessNodes.length + 1, radius, startAngle + angleStep * 0.5);
    });
  }, [quickAccessNodes]);

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 ${className}`}
      style={{
        bottom: '24px',
        right: '24px',
      }}
    >
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] -z-10 animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Spore items container */}
      <div className="relative">
        {/* Hub access button - shows at top */}
        <button
          onClick={handleOpenHub}
          className={`
            absolute flex items-center justify-center
            w-10 h-10 rounded-full
            bg-zinc-800/90 border border-zinc-700 text-zinc-400
            hover:bg-zinc-700 hover:text-white hover:border-zinc-600
            backdrop-blur-sm
            transition-all ease-out
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            ${isExpanded
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
            }
            group
          `}
          style={{
            transform: isExpanded
              ? `translate(-50px, -${radius + 30}px)`
              : 'translate(0, 0) scale(0.5)',
            transitionDuration: isExpanded ? '300ms' : '200ms',
            transitionDelay: isExpanded ? '50ms' : '150ms',
          }}
          aria-label="Open full navigation"
        >
          <NavIcons.Mycelium className="w-5 h-5" />
          <span
            className={`
              absolute right-full mr-3 px-2.5 py-1.5
              bg-zinc-800/95 border border-zinc-700 rounded-lg
              text-xs font-medium text-white whitespace-nowrap
              opacity-0 group-hover:opacity-100 group-focus:opacity-100
              transition-opacity pointer-events-none
              backdrop-blur-sm
            `}
          >
            Open Navigator
          </span>
        </button>

        {/* Quick access spore items */}
        {quickAccessNodes.map((node, index) => (
          <SporeItem
            key={node.id}
            node={node}
            isActive={node.id === currentPage}
            position={itemPositions[index]}
            delay={index * 30}
            isExpanded={isExpanded}
            onClick={() => handleNavigate(node.id)}
          />
        ))}

        {/* Main mushroom cap button */}
        <button
          onClick={toggleMenu}
          className={`
            relative w-14 h-14 rounded-full
            flex items-center justify-center
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950
            ${isExpanded
              ? 'bg-zinc-700 rotate-45'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'
            }
          `}
          style={{
            boxShadow: isExpanded
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)',
          }}
          aria-label={isExpanded ? 'Close quick navigation' : 'Open quick navigation'}
          aria-expanded={isExpanded}
        >
          {/* Mushroom cap icon / close icon */}
          {isExpanded ? (
            <svg
              className="w-6 h-6 text-white transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <>
              {/* Mushroom cap shape */}
              <span className="text-2xl">🍄</span>
              {/* Pulsing glow effect */}
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-400"
                style={{ animationDuration: '2s' }}
              />
            </>
          )}
        </button>

        {/* Current page indicator dot */}
        {!isExpanded && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center"
            title={getNodeById(currentPage)?.label}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        )}
      </div>

      {/* Accessibility hint */}
      <span className="sr-only">
        Quick navigation menu. Press Enter to open.
      </span>
    </div>
  );
};

export default SporeMenu;
