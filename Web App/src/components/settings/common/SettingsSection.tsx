// ============================================================================
// SETTINGS SECTION - Reusable section wrapper for settings pages
// ============================================================================

import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  className = '',
  headerAction,
}) => {
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {headerAction && (
          <div className="flex-shrink-0">
            {headerAction}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default SettingsSection;
