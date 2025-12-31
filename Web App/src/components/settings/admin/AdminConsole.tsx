// ============================================================================
// ADMIN CONSOLE - Consolidated admin panel
// Database, Users, Library, Suggestions, Notifications, Audit, Services
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../../store';
import { useAuth } from '../../../lib/AuthContext';
import { SettingsSection } from '../common/SettingsSection';
import { AdminMasterData } from '../AdminMasterData';
import { AdminNotifications } from '../AdminNotifications';
import { AdminNotificationConfig } from '../AdminNotificationConfig';
import { SuggestionReviewPanel } from './SuggestionReviewPanel';

type AdminTab = 'dashboard' | 'database' | 'users' | 'library' | 'suggestions' | 'notifications' | 'audit' | 'services';

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  is_active: boolean;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_email: string | null;
  details: any;
  created_at: string;
}

interface TableStatus {
  name: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

const Icons = {
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Library: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Inbox: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  XCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Cloud: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  CloudOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const ALL_TABLES = [
  'species', 'strains', 'locations', 'containers', 'substrate_types',
  'suppliers', 'inventory_categories', 'inventory_items', 'cultures', 'culture_observations',
  'culture_transfers', 'grows', 'grow_observations', 'flushes', 'recipes', 'recipe_ingredients',
  'user_profiles', 'user_settings', 'admin_notifications', 'admin_audit_log', 'library_suggestions',
  'suggestion_messages'
];

const tabConfig: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
  { id: 'database', label: 'Database', icon: <Icons.Database /> },
  { id: 'users', label: 'Users', icon: <Icons.Users /> },
  { id: 'library', label: 'Library', icon: <Icons.Library /> },
  { id: 'suggestions', label: 'Suggestions', icon: <Icons.Inbox /> },
  { id: 'notifications', label: 'Alerts', icon: <Icons.Bell /> },
  { id: 'audit', label: 'Audit Log', icon: <Icons.FileText /> },
  { id: 'services', label: 'Services', icon: <Icons.Settings /> },
];

export const AdminConsole: React.FC = () => {
  const { state, isConnected, refreshData } = useData();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database state
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [dbTesting, setDbTesting] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);

  // Users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Audit log state
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingAuditLog, setLoadingAuditLog] = useState(false);

  // Pending suggestions count
  const [pendingSuggestions, setPendingSuggestions] = useState(0);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Load admin data on tab change
  useEffect(() => {
    if (isAdmin && isConnected) {
      if (activeTab === 'users' || activeTab === 'dashboard') {
        fetchUsers();
      }
      if (activeTab === 'audit') {
        fetchAuditLog();
      }
      if (activeTab === 'dashboard') {
        fetchPendingSuggestions();
      }
    }
  }, [activeTab, isAdmin, isConnected]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Icons.Shield />
        <p className="text-red-400 font-medium mt-4">Access Denied</p>
        <p className="text-zinc-500 text-sm">You do not have permission to access the Admin Console.</p>
      </div>
    );
  }

  // ============================================================================
  // DATABASE FUNCTIONS
  // ============================================================================

  const checkTableStatus = async () => {
    if (!isConnected) return;
    setDbTesting(true);
    setTableStatuses([]);

    try {
      const { supabase } = await import('../../../lib/supabase');
      if (!supabase) return;

      const statuses: TableStatus[] = [];
      for (const tableName of ALL_TABLES) {
        try {
          const { count, error: selectError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (selectError) {
            statuses.push({ name: tableName, exists: false, rowCount: 0, error: selectError.message });
          } else {
            statuses.push({ name: tableName, exists: true, rowCount: count || 0 });
          }
        } catch (e: any) {
          statuses.push({ name: tableName, exists: false, rowCount: 0, error: e.message });
        }
      }
      setTableStatuses(statuses);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Status check failed: ${err.message}` });
    } finally {
      setDbTesting(false);
    }
  };

  const copySchema = async () => {
    try {
      const response = await fetch('/supabase-schema.sql');
      const schema = await response.text();
      await navigator.clipboard.writeText(schema);
      setSchemaCopied(true);
      setTimeout(() => setSchemaCopied(false), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Could not copy schema. Please download the file manually.' });
    }
  };

  // ============================================================================
  // USER MANAGEMENT FUNCTIONS
  // ============================================================================

  const fetchUsers = async () => {
    if (!isConnected || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const { supabase } = await import('../../../lib/supabase');
      if (!supabase) return;
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setMessage({ type: 'error', text: `Failed to fetch users: ${fetchError.message}` });
        return;
      }
      setAdminUsers(data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to fetch users: ${err.message}` });
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<AdminUser>) => {
    if (!isConnected || !isAdmin) return;
    setSaving(true);
    try {
      const { supabase } = await import('../../../lib/supabase');
      if (!supabase) return;

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: updates.display_name,
          is_admin: updates.is_admin,
          is_active: updates.is_active,
          subscription_tier: updates.subscription_tier,
          subscription_status: updates.subscription_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        setMessage({ type: 'error', text: `Failed to update user: ${updateError.message}` });
        return;
      }

      setMessage({ type: 'success', text: 'User updated successfully' });
      setShowUserModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Failed to update user: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const toggleAdminStatus = async (user: AdminUser) => {
    const newStatus = !user.is_admin;
    if (!newStatus && adminUsers.filter(u => u.is_admin).length <= 1) {
      setMessage({ type: 'error', text: 'Cannot remove admin status from the last admin user' });
      return;
    }
    await updateUserProfile(user.id, { is_admin: newStatus });
  };

  const toggleActiveStatus = async (user: AdminUser) => {
    await updateUserProfile(user.id, { is_active: !user.is_active });
  };

  // ============================================================================
  // AUDIT LOG FUNCTIONS
  // ============================================================================

  const fetchAuditLog = async () => {
    if (!isConnected || !isAdmin) return;
    setLoadingAuditLog(true);
    try {
      const { supabase } = await import('../../../lib/supabase');
      if (!supabase) return;

      const { data, error: fetchError } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        if (!fetchError.message.includes('does not exist')) {
          console.error('Audit log fetch error:', fetchError);
        }
        return;
      }
      setAuditLog(data || []);
    } catch (err: any) {
      console.error('Audit log fetch error:', err);
    } finally {
      setLoadingAuditLog(false);
    }
  };

  // ============================================================================
  // SUGGESTIONS FUNCTIONS
  // ============================================================================

  const fetchPendingSuggestions = async () => {
    if (!isConnected || !isAdmin) return;
    try {
      const { supabase } = await import('../../../lib/supabase');
      if (!supabase) return;

      const { count, error } = await supabase
        .from('library_suggestions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review', 'changes_requested']);

      if (!error) {
        setPendingSuggestions(count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch pending suggestions:', err);
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-950/50 to-indigo-950/50 border border-purple-800/50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            🛡️
          </div>
          <div>
            <h2 className="text-xl font-semibold text-purple-300">Admin Console</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Manage users, database, library entries, and system settings.
              Changes made here affect all users.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-emerald-400">{adminUsers.length}</p>
          <p className="text-sm text-zinc-500">Total Users</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-purple-400">{adminUsers.filter(u => u.is_admin).length}</p>
          <p className="text-sm text-zinc-500">Administrators</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-amber-400">{pendingSuggestions}</p>
          <p className="text-sm text-zinc-500">Pending Suggestions</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="text-emerald-400"><Icons.Cloud /></span>
                <p className="text-sm text-emerald-400">Connected</p>
              </>
            ) : (
              <>
                <span className="text-amber-400"><Icons.CloudOff /></span>
                <p className="text-sm text-amber-400">Offline</p>
              </>
            )}
          </div>
          <p className="text-sm text-zinc-500">Database Status</p>
        </div>
      </div>

      {/* Quick Actions */}
      <SettingsSection title="Quick Actions" icon="⚡">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('suggestions')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg border border-amber-500/30"
          >
            Review Suggestions ({pendingSuggestions})
          </button>
          <button
            onClick={() => { setActiveTab('database'); checkTableStatus(); }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
          >
            Check Database Health
          </button>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
          >
            Refresh User List
          </button>
        </div>
      </SettingsSection>
    </div>
  );

  const renderDatabase = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <SettingsSection
        title="Connection Status"
        description="Database connection and health"
        icon={isConnected ? "✅" : "⚠️"}
      >
        <div className="flex items-center gap-4 mb-4">
          {isConnected ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-950/30 rounded-lg border border-emerald-700 flex-1">
              <span className="text-emerald-400"><Icons.Cloud /></span>
              <div>
                <p className="text-sm font-medium text-emerald-300">Connected to Supabase</p>
                <p className="text-xs text-zinc-500">Database is online and healthy</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-amber-950/30 rounded-lg border border-amber-700 flex-1">
              <span className="text-amber-400"><Icons.CloudOff /></span>
              <div>
                <p className="text-sm font-medium text-amber-300">Offline Mode</p>
                <p className="text-xs text-zinc-500">Data is stored locally only</p>
              </div>
            </div>
          )}
          <button
            onClick={() => refreshData()}
            disabled={!isConnected}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
          >
            <Icons.Refresh /> Refresh Data
          </button>
        </div>
      </SettingsSection>

      {/* Table Status */}
      <SettingsSection
        title="Table Health Check"
        description="Verify all database tables are accessible"
        icon="📊"
        headerAction={
          <button
            onClick={checkTableStatus}
            disabled={dbTesting || !isConnected}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg text-sm flex items-center gap-2"
          >
            {dbTesting ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Checking...</>
            ) : (
              <><Icons.Refresh /> Check Tables</>
            )}
          </button>
        }
      >
        {tableStatuses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tableStatuses.map(table => (
              <div
                key={table.name}
                className={`border rounded-lg p-3 ${
                  table.exists
                    ? 'bg-emerald-950/30 border-emerald-800'
                    : 'bg-red-950/30 border-red-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {table.exists ? (
                    <span className="text-emerald-400"><Icons.CheckCircle /></span>
                  ) : (
                    <span className="text-red-400"><Icons.XCircle /></span>
                  )}
                  <span className="text-sm font-medium text-white">{table.name}</span>
                </div>
                {table.exists ? (
                  <p className="text-xs text-zinc-400">{table.rowCount} rows</p>
                ) : (
                  <p className="text-xs text-red-400 truncate">{table.error || 'Not found'}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Click "Check Tables" to verify database health</p>
        )}
      </SettingsSection>

      {/* Schema Setup */}
      <SettingsSection
        title="Schema Setup"
        description="Database schema management"
        icon="📝"
      >
        <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-300">
            <strong>Important:</strong> If tables are missing or you see permission errors,
            run the schema SQL in your Supabase SQL Editor.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={copySchema}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
          >
            <Icons.Copy /> {schemaCopied ? 'Copied!' : 'Copy Schema SQL'}
          </button>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
          >
            Open Supabase Dashboard →
          </a>
        </div>
      </SettingsSection>

      {/* Local Data Summary */}
      <SettingsSection title="Local Data Summary" icon="📈">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{state.species?.length || 0}</p>
            <p className="text-sm text-zinc-500">Species</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{state.strains.length}</p>
            <p className="text-sm text-zinc-500">Strains</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{state.cultures.length}</p>
            <p className="text-sm text-zinc-500">Cultures</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{state.grows.length}</p>
            <p className="text-sm text-zinc-500">Grows</p>
          </div>
        </div>
      </SettingsSection>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <SettingsSection
        title="User Management"
        description="Manage user accounts and permissions"
        icon="👥"
        headerAction={
          <button
            onClick={fetchUsers}
            disabled={loadingUsers}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Refresh /> {loadingUsers ? 'Loading...' : 'Refresh'}
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">User</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Role</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Subscription</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Joined</th>
                <th className="text-right p-3 text-sm font-medium text-zinc-400 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No users found. Users will appear here after they sign up.
                  </td>
                </tr>
              ) : (
                adminUsers.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/30">
                    <td className="p-3">
                      <div>
                        <p className="text-white font-medium">{user.display_name || 'No name'}</p>
                        <p className="text-sm text-zinc-500">{user.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_active
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-700'
                          : 'bg-red-950/50 text-red-400 border border-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_admin
                          ? 'bg-purple-950/50 text-purple-400 border border-purple-700'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <span className="capitalize text-white">{user.subscription_tier}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                          user.subscription_status === 'active'
                            ? 'bg-emerald-950/50 text-emerald-400'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {user.subscription_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditingUser(user); setShowUserModal(true); }}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                          title="Edit user"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => toggleAdminStatus(user)}
                          className={`p-1.5 rounded ${
                            user.is_admin
                              ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/50'
                              : 'text-zinc-400 hover:text-purple-400 hover:bg-zinc-800'
                          }`}
                          title={user.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          <Icons.Shield />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SettingsSection>
    </div>
  );

  const renderLibrary = () => (
    <AdminMasterData isConnected={isConnected} />
  );

  const renderSuggestions = () => (
    <SuggestionReviewPanel
      isConnected={isConnected}
      onCountChange={setPendingSuggestions}
    />
  );

  const renderNotifications = () => (
    <AdminNotifications isConnected={isConnected} />
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <SettingsSection
        title="Audit Log"
        description="Track admin actions and changes"
        icon="📜"
        headerAction={
          <button
            onClick={fetchAuditLog}
            disabled={loadingAuditLog}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Refresh /> {loadingAuditLog ? 'Loading...' : 'Refresh'}
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Time</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Admin</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Action</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Target</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loadingAuditLog ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading audit log...
                    </div>
                  </td>
                </tr>
              ) : auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No audit log entries yet. Admin actions will be recorded here.
                  </td>
                </tr>
              ) : (
                auditLog.map(entry => (
                  <tr key={entry.id} className="hover:bg-zinc-800/30">
                    <td className="p-3 text-sm text-zinc-400">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="p-3 text-sm text-white">
                      {entry.admin_email || 'Unknown'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.action.includes('grant') || entry.action.includes('activate')
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-700'
                          : entry.action.includes('revoke') || entry.action.includes('deactivate')
                          ? 'bg-red-950/50 text-red-400 border border-red-700'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">
                      {entry.target_email || entry.target_id || '-'}
                    </td>
                    <td className="p-3 text-sm text-zinc-500 max-w-xs truncate">
                      {entry.details ? JSON.stringify(entry.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SettingsSection>
    </div>
  );

  const renderServices = () => (
    <AdminNotificationConfig isConnected={isConnected} />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'database': return renderDatabase();
      case 'users': return renderUsers();
      case 'library': return renderLibrary();
      case 'suggestions': return renderSuggestions();
      case 'notifications': return renderNotifications();
      case 'audit': return renderAudit();
      case 'services': return renderServices();
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-700 text-emerald-300'
            : 'bg-red-950/30 border-red-700 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'suggestions' && pendingSuggestions > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {pendingSuggestions}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* User Edit Modal */}
      {showUserModal && editingUser && (
        <div
          className="fixed inset-0 bg-black/70 z-50 overflow-y-auto"
          onClick={() => { setShowUserModal(false); setEditingUser(null); }}
        >
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Edit User</h3>
                <button
                  onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Icons.X />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Email</label>
                  <input
                    type="text"
                    value={editingUser.email || ''}
                    disabled
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editingUser.display_name || ''}
                    onChange={e => setEditingUser({ ...editingUser, display_name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Enter display name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Subscription Tier</label>
                    <select
                      value={editingUser.subscription_tier}
                      onChange={e => setEditingUser({ ...editingUser, subscription_tier: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Subscription Status</label>
                    <select
                      value={editingUser.subscription_status}
                      onChange={e => setEditingUser({ ...editingUser, subscription_status: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.is_admin}
                      onChange={e => setEditingUser({ ...editingUser, is_admin: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-600"
                    />
                    <span className="text-sm text-zinc-300">Admin privileges</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.is_active}
                      onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-600"
                    />
                    <span className="text-sm text-zinc-300">Account active</span>
                  </label>
                </div>
              </div>
              <div className="p-5 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserProfile(editingUser.id, editingUser)}
                  disabled={saving}
                  className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
