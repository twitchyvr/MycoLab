// ============================================================================
// SETTINGS PAGE - Role-Based Settings Router
// Routes to appropriate settings component based on user authentication state
// ============================================================================

import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import { AnonymousSettings } from './AnonymousSettings';
import { GrowerSettings } from './GrowerSettings';
import { AdminConsole } from './admin/AdminConsole';

interface SettingsPageProps {
  onSignUpClick?: () => void;
}

export const SettingsPageNew: React.FC<SettingsPageProps> = ({ onSignUpClick }) => {
  const { isAuthenticated, isAnonymous, isAdmin } = useAuth();

  // Determine which settings component to show based on user role
  const renderSettings = () => {
    // Admin users get the full Admin Console
    if (isAuthenticated && isAdmin) {
      return (
        <div className="space-y-6">
          {/* Admin Console */}
          <AdminConsole />

          {/* Separator */}
          <div className="border-t border-zinc-800 pt-6">
            <h2 className="text-lg font-semibold text-zinc-400 mb-4">Personal Settings</h2>
            <GrowerSettings />
          </div>
        </div>
      );
    }

    // Authenticated non-admin users get Grower Settings
    if (isAuthenticated && !isAnonymous) {
      return <GrowerSettings />;
    }

    // Anonymous/unauthenticated users get minimal settings
    return <AnonymousSettings onSignUpClick={onSignUpClick} />;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? 'Admin Console & Settings' : 'Settings'}
          </h1>
          <p className="text-zinc-400 mt-1">
            {isAdmin
              ? 'Manage the application, users, and your personal preferences'
              : isAuthenticated
              ? 'Manage your preferences and account settings'
              : 'Configure your local preferences'
            }
          </p>
        </div>

        {/* Settings Content */}
        {renderSettings()}
      </div>
    </div>
  );
};

export default SettingsPageNew;
