// ============================================================================
// DATA OWNERSHIP BADGE
// Visual indicator for system vs user-created data
// ============================================================================

import React from 'react';
import { isSystemData, OwnableItem } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface DataOwnershipBadgeProps {
  item: OwnableItem | null | undefined;
  /** Show as inline badge (smaller) or as a standalone badge */
  variant?: 'inline' | 'badge';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Shows a visual badge indicating whether an item is system data (global/non-editable)
 * or user-created data (personal/editable).
 *
 * System data: Provided by MycoLab, shared with all users, not editable
 * User data: Created by the user, only visible to them, editable
 */
export const DataOwnershipBadge: React.FC<DataOwnershipBadgeProps> = ({
  item,
  variant = 'inline',
  className = '',
}) => {
  if (!item) return null;

  const isSystem = isSystemData(item);

  if (variant === 'inline') {
    // Inline variant - smaller, icon only with tooltip
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        title={isSystem ? 'System data (global, not editable)' : 'Your data (personal, editable)'}
      >
        {isSystem ? (
          <span className="text-amber-500/70">
            <Icons.Lock />
          </span>
        ) : (
          <span className="text-emerald-500/70">
            <Icons.User />
          </span>
        )}
      </span>
    );
  }

  // Badge variant - full badge with text
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isSystem
          ? 'bg-amber-950/50 text-amber-400 border border-amber-700/50'
          : 'bg-emerald-950/50 text-emerald-400 border border-emerald-700/50'
      } ${className}`}
    >
      {isSystem ? (
        <>
          <Icons.Lock />
          System
        </>
      ) : (
        <>
          <Icons.User />
          Mine
        </>
      )}
    </span>
  );
};

/**
 * A simpler version that just shows "System" badge for system data
 * Returns null for user data (since that's the default/expected case)
 */
export const SystemBadge: React.FC<{ item: OwnableItem | null | undefined; className?: string }> = ({
  item,
  className = '',
}) => {
  if (!item || !isSystemData(item)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-950/50 text-amber-400 border border-amber-700/50 ${className}`}
      title="System data - provided by MycoLab, not editable"
    >
      <Icons.Lock />
      System
    </span>
  );
};

export default DataOwnershipBadge;
