// ============================================================================
// SETTINGS PAGE - Full Database Administration
// Manage all lookup tables, database config, schema verification, and preferences
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useData, useTheme, ThemeSelector } from '../../store';
import { useAuth } from '../../lib/AuthContext';
import type { Species, Strain, Location, LocationType, LocationClassification, Container, SubstrateType, Supplier, InventoryCategory, AppSettings } from '../../store/types';
import { createClient } from '@supabase/supabase-js';
import { StandardDropdown } from '../common/StandardDropdown';
import { AdminMasterData } from './AdminMasterData';
import { AdminNotifications } from './AdminNotifications';
import { SpeciesInfoPanel } from '../common/SpeciesInfoPanel';
import { SpeciesName, SpeciesBadge } from '../common/SpeciesName';

// ============================================================================
// TYPES
// ============================================================================


type SettingsTab = 'admin' | 'database' | 'species' | 'strains' | 'locations' | 'locationTypes' | 'locationClassifications' | 'containers' | 'substrates' | 'suppliers' | 'categories' | 'preferences';

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

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Cloud: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  CloudOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="m2 2 20 20"/><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  AlertCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  XCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Table: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
};

// Tab configuration
const tabConfig: Record<SettingsTab, { label: string; icon: string }> = {
  admin: { label: 'Admin', icon: '🛡️' },
  database: { label: 'Database', icon: '☁️' },
  species: { label: 'Species', icon: '🧬' },
  strains: { label: 'Strains', icon: '🍄' },
  locations: { label: 'Locations', icon: '📍' },
  locationTypes: { label: 'Loc Types', icon: '🏷️' },
  locationClassifications: { label: 'Loc Classes', icon: '📂' },
  containers: { label: 'Containers', icon: '📦' },
  substrates: { label: 'Substrates', icon: '🌱' },
  suppliers: { label: 'Suppliers', icon: '🏪' },
  categories: { label: 'Categories', icon: '🏷️' },
  preferences: { label: 'Preferences', icon: '⚙️' },
};

// All database tables
const ALL_TABLES = [
  'species', 'strains', 'locations', 'containers', 'substrate_types',
  'suppliers', 'inventory_categories', 'inventory_items', 'cultures', 'culture_observations',
  'culture_transfers', 'grows', 'grow_observations', 'flushes', 'recipes', 'recipe_ingredients'
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SettingsPage: React.FC = () => {
  const {
    state,
    isConnected,
    refreshData,
    updateSettings,
    addSpecies, updateSpecies, deleteSpecies,
    addStrain, updateStrain, deleteStrain,
    addLocation, updateLocation, deleteLocation,
    addLocationType, updateLocationType, deleteLocationType,
    addLocationClassification, updateLocationClassification, deleteLocationClassification,
    addSupplier, updateSupplier, deleteSupplier,
    addContainer, updateContainer, deleteContainer,
    addSubstrateType, updateSubstrateType, deleteSubstrateType,
    addInventoryCategory, updateInventoryCategory, deleteInventoryCategory,
    activeLocationTypes,
    activeLocationClassifications,
    activeSuppliers,
  } = useData();

  const { isAdmin } = useAuth();

  // Filter tabs based on admin status - non-admins can't see admin or database tabs
  const adminOnlyTabs: SettingsTab[] = ['admin', 'database'];
  const availableTabs = isAdmin
    ? (Object.keys(tabConfig) as SettingsTab[])
    : (Object.keys(tabConfig) as SettingsTab[]).filter(tab => !adminOnlyTabs.includes(tab));

  const [activeTab, setActiveTab] = useState<SettingsTab>(isAdmin ? 'admin' : 'preferences');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);

  // Database state (read-only status display for admins)
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);

  // Admin panel state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAuditLog, setLoadingAuditLog] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'users' | 'audit' | 'masterData' | 'notifications'>('users');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({});

  // Local settings
  const [localSettings, setLocalSettings] = useState<AppSettings>(state.settings);

  useEffect(() => {
    setLocalSettings(state.settings);
  }, [state.settings]);

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ============================================================================
  // DATABASE FUNCTIONS
  // ============================================================================

  const [writeTestResult, setWriteTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check database tables status (for admin monitoring)
  const checkTableStatus = async () => {
    if (!isConnected) return;

    setDbTesting(true);
    setTableStatuses([]);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const statuses: TableStatus[] = [];

      for (const tableName of ALL_TABLES) {
        try {
          const { count, error: selectError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (selectError) {
            statuses.push({
              name: tableName,
              exists: false,
              rowCount: 0,
              error: selectError.message,
            });
          } else {
            statuses.push({
              name: tableName,
              exists: true,
              rowCount: count || 0,
            });
          }
        } catch (e: any) {
          statuses.push({
            name: tableName,
            exists: false,
            rowCount: 0,
            error: e.message,
          });
        }
      }

      setTableStatuses(statuses);
    } catch (err: any) {
      setError(`Status check failed: ${err.message}`);
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
      setError('Could not copy schema. Please download the file manually.');
    }
  };

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================

  // Fetch all users (admin only)
  const fetchUsers = async () => {
    if (!isConnected || !isAdmin) return;

    setLoadingUsers(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(`Failed to fetch users: ${fetchError.message}`);
        return;
      }

      setAdminUsers(data || []);
    } catch (err: any) {
      setError(`Failed to fetch users: ${err.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch audit log (admin only)
  const fetchAuditLog = async () => {
    if (!isConnected || !isAdmin) return;

    setLoadingAuditLog(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { data, error: fetchError } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        // Table might not exist yet - that's ok
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

  // Log admin action
  const logAdminAction = async (action: string, targetType: string, targetId: string | null, targetEmail: string | null, details?: any) => {
    if (!isConnected || !isAdmin) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action,
        target_type: targetType,
        target_id: targetId,
        target_email: targetEmail,
        details: details || null,
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

  // Update user profile (admin only)
  const updateUserProfile = async (userId: string, updates: Partial<AdminUser>) => {
    if (!isConnected || !isAdmin) return;

    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const targetUser = adminUsers.find(u => u.id === userId);

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
        setError(`Failed to update user: ${updateError.message}`);
        return;
      }

      // Log the action
      await logAdminAction(
        'update_user',
        'user_profile',
        userId,
        targetUser?.email || null,
        { changes: updates }
      );

      setSuccess('User updated successfully');
      setShowUserModal(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (user: AdminUser) => {
    const newStatus = !user.is_admin;
    if (!newStatus && adminUsers.filter(u => u.is_admin).length <= 1) {
      setError('Cannot remove admin status from the last admin user');
      return;
    }

    await updateUserProfile(user.id, { is_admin: newStatus });
    await logAdminAction(
      newStatus ? 'grant_admin' : 'revoke_admin',
      'user_profile',
      user.id,
      user.email,
      { new_status: newStatus }
    );
  };

  // Toggle active status
  const toggleActiveStatus = async (user: AdminUser) => {
    await updateUserProfile(user.id, { is_active: !user.is_active });
    await logAdminAction(
      user.is_active ? 'deactivate_user' : 'activate_user',
      'user_profile',
      user.id,
      user.email,
      { new_status: !user.is_active }
    );
  };

  // Load admin data when tab becomes active
  useEffect(() => {
    if (activeTab === 'admin' && isAdmin && isConnected) {
      fetchUsers();
      fetchAuditLog();
    }
  }, [activeTab, isAdmin, isConnected]);

  // ============================================================================
  // CRUD HELPERS
  // ============================================================================

  const openAddModal = (tab: SettingsTab) => {
    setEditingItem(null);
    setFormData(getDefaultFormData(tab));
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData(getFormDataFromItem(item, activeTab));
    setShowModal(true);
  };

  const getDefaultFormData = (tab: SettingsTab) => {
    switch (tab) {
      case 'species':
        return { name: '', scientificName: '', category: 'gourmet', notes: '' };
      case 'strains':
        return { name: '', species: '', difficulty: 'intermediate', colonizationDaysMin: 14, colonizationDaysMax: 21, fruitingDaysMin: 7, fruitingDaysMax: 14, notes: '' };
      case 'locations':
        return {
          name: '',
          typeId: '',
          classificationId: '',
          tempMin: '',
          tempMax: '',
          humidityMin: '',
          humidityMax: '',
          hasPower: false,
          powerUsage: '',
          hasAirCirculation: false,
          size: '',
          supplierId: '',
          cost: '',
          procurementDate: '',
          notes: ''
        };
      case 'locationTypes':
        return { name: '', code: '', description: '', notes: '' };
      case 'locationClassifications':
        return { name: '', code: '', description: '', notes: '' };
      case 'containers':
        return { name: '', category: 'jar', volumeMl: '', isReusable: true, usageContext: ['culture', 'grow'], notes: '' };
      case 'substrates':
        return { name: '', code: '', category: 'bulk', spawnRateMin: 10, spawnRateOptimal: 20, spawnRateMax: 30, fieldCapacity: 65, notes: '' };
      case 'suppliers':
        return { name: '', website: '', email: '', phone: '', notes: '' };
      case 'categories':
        return { name: '', color: '#10b981', icon: '📦' };
      default:
        return {};
    }
  };

  const getFormDataFromItem = (item: any, tab: SettingsTab) => {
    switch (tab) {
      case 'species':
        return { name: item.name || '', scientificName: item.scientificName || '', category: item.category || 'gourmet', notes: item.notes || '' };
      case 'strains':
        return {
          name: item.name || '',
          species: item.species || '',
          difficulty: item.difficulty || 'intermediate',
          colonizationDaysMin: item.colonizationDays?.min || 14,
          colonizationDaysMax: item.colonizationDays?.max || 21,
          fruitingDaysMin: item.fruitingDays?.min || 7,
          fruitingDaysMax: item.fruitingDays?.max || 14,
          notes: item.notes || '',
        };
      case 'locations':
        return {
          name: item.name || '',
          typeId: item.typeId || '',
          classificationId: item.classificationId || '',
          tempMin: item.tempRange?.min ?? '',
          tempMax: item.tempRange?.max ?? '',
          humidityMin: item.humidityRange?.min ?? '',
          humidityMax: item.humidityRange?.max ?? '',
          hasPower: item.hasPower ?? false,
          powerUsage: item.powerUsage || '',
          hasAirCirculation: item.hasAirCirculation ?? false,
          size: item.size || '',
          supplierId: item.supplierId || '',
          cost: item.cost ?? '',
          procurementDate: item.procurementDate ? new Date(item.procurementDate).toISOString().split('T')[0] : '',
          notes: item.notes || ''
        };
      case 'locationTypes':
        return { name: item.name || '', code: item.code || '', description: item.description || '', notes: item.notes || '' };
      case 'locationClassifications':
        return { name: item.name || '', code: item.code || '', description: item.description || '', notes: item.notes || '' };
      case 'containers':
        return { name: item.name || '', category: item.category || 'jar', volumeMl: item.volumeMl || '', isReusable: item.isReusable ?? true, usageContext: item.usageContext || ['culture', 'grow'], notes: item.notes || '' };
      case 'substrates':
        return { name: item.name || '', code: item.code || '', category: item.category || 'bulk', spawnRateMin: item.spawnRateRange?.min || 10, spawnRateOptimal: item.spawnRateRange?.optimal || 20, spawnRateMax: item.spawnRateRange?.max || 30, fieldCapacity: item.fieldCapacity || 65, notes: item.notes || '' };
      case 'suppliers':
        return { name: item.name || '', website: item.website || '', email: item.email || '', phone: item.phone || '', notes: item.notes || '' };
      case 'categories':
        return { name: item.name || '', color: item.color || '#10b981', icon: item.icon || '📦' };
      default:
        return item;
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'species':
          const speciesData: Omit<Species, 'id'> = {
            name: formData.name.trim(),
            scientificName: formData.scientificName?.trim() || undefined,
            category: formData.category || 'gourmet',
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateSpecies(editingItem.id, speciesData);
            setSuccess('Species updated');
          } else {
            await addSpecies(speciesData);
            setSuccess('Species added');
          }
          break;

        case 'strains':
          const strainData = {
            name: formData.name.trim(),
            species: formData.species?.trim() || 'Unknown',
            difficulty: formData.difficulty as Strain['difficulty'],
            colonizationDays: { min: Number(formData.colonizationDaysMin) || 14, max: Number(formData.colonizationDaysMax) || 21 },
            fruitingDays: { min: Number(formData.fruitingDaysMin) || 7, max: Number(formData.fruitingDaysMax) || 14 },
            optimalTempColonization: { min: 24, max: 27 },
            optimalTempFruiting: { min: 20, max: 24 },
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          console.log('Saving strain:', strainData);
          if (editingItem) {
            await updateStrain(editingItem.id, strainData);
            setSuccess('Strain updated');
          } else {
            const result = await addStrain(strainData);
            console.log('Strain saved:', result);
            setSuccess('Strain added to database');
          }
          break;

        case 'locations':
          const locationData = {
            name: formData.name.trim(),
            typeId: formData.typeId || undefined,
            classificationId: formData.classificationId || undefined,
            tempRange: formData.tempMin !== '' && formData.tempMax !== '' ? { min: Number(formData.tempMin), max: Number(formData.tempMax) } : undefined,
            humidityRange: formData.humidityMin !== '' && formData.humidityMax !== '' ? { min: Number(formData.humidityMin), max: Number(formData.humidityMax) } : undefined,
            hasPower: formData.hasPower ?? false,
            powerUsage: formData.powerUsage?.trim() || undefined,
            hasAirCirculation: formData.hasAirCirculation ?? false,
            size: formData.size?.trim() || undefined,
            supplierId: formData.supplierId || undefined,
            cost: formData.cost !== '' ? Number(formData.cost) : undefined,
            procurementDate: formData.procurementDate ? new Date(formData.procurementDate) : undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateLocation(editingItem.id, locationData);
            setSuccess('Location updated');
          } else {
            await addLocation(locationData);
            setSuccess('Location added');
          }
          break;

        case 'locationTypes':
          const locationTypeData = {
            name: formData.name.trim(),
            code: formData.code?.trim() || formData.name.toLowerCase().replace(/\s+/g, '_'),
            description: formData.description?.trim() || undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateLocationType(editingItem.id, locationTypeData);
            setSuccess('Location type updated');
          } else {
            await addLocationType(locationTypeData);
            setSuccess('Location type added');
          }
          break;

        case 'locationClassifications':
          const locationClassData = {
            name: formData.name.trim(),
            code: formData.code?.trim() || formData.name.toLowerCase().replace(/\s+/g, '_'),
            description: formData.description?.trim() || undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateLocationClassification(editingItem.id, locationClassData);
            setSuccess('Location classification updated');
          } else {
            await addLocationClassification(locationClassData);
            setSuccess('Location classification added');
          }
          break;

        case 'suppliers':
          const supplierData = {
            name: formData.name.trim(),
            website: formData.website?.trim() || undefined,
            email: formData.email?.trim() || undefined,
            phone: formData.phone?.trim() || undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateSupplier(editingItem.id, supplierData);
            setSuccess('Supplier updated');
          } else {
            await addSupplier(supplierData);
            setSuccess('Supplier added');
          }
          break;

        case 'containers':
          const containerData = {
            name: formData.name.trim(),
            category: formData.category as Container['category'],
            volumeMl: formData.volumeMl ? Number(formData.volumeMl) : undefined,
            isReusable: formData.isReusable ?? true,
            usageContext: formData.usageContext || ['culture', 'grow'],
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateContainer(editingItem.id, containerData);
          } else {
            await addContainer(containerData);
          }
          setSuccess('Container saved');
          break;

        case 'substrates':
          const substrateData = {
            name: formData.name.trim(),
            code: formData.code?.trim() || formData.name.toLowerCase().replace(/\s+/g, '_'),
            category: formData.category as SubstrateType['category'],
            spawnRateRange: { min: Number(formData.spawnRateMin) || 10, optimal: Number(formData.spawnRateOptimal) || 20, max: Number(formData.spawnRateMax) || 30 },
            fieldCapacity: formData.fieldCapacity ? Number(formData.fieldCapacity) : undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateSubstrateType(editingItem.id, substrateData);
          } else {
            await addSubstrateType(substrateData);
          }
          setSuccess('Substrate saved');
          break;

        case 'categories':
          const categoryData = {
            name: formData.name.trim(),
            color: formData.color || '#10b981',
            icon: formData.icon || '📦',
            isActive: true,
          };
          if (editingItem) {
            await updateInventoryCategory(editingItem.id, categoryData);
          } else {
            await addInventoryCategory(categoryData);
          }
          setSuccess('Category saved');
          break;
      }

      setShowModal(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Save error:', err);
      // More detailed error message
      let errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('row-level security') || errorMsg.includes('RLS')) {
        errorMsg = `Database permission error: ${errorMsg}. Make sure you've run the RLS policies from the schema SQL in Supabase.`;
      } else if (errorMsg.includes('violates foreign key')) {
        errorMsg = `Reference error: ${errorMsg}. The referenced record may not exist.`;
      }
      setError(`Save failed: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, tab: SettingsTab) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      switch (tab) {
        case 'species': await deleteSpecies(id); break;
        case 'strains': await deleteStrain(id); break;
        case 'locations': await deleteLocation(id); break;
        case 'locationTypes': await deleteLocationType(id); break;
        case 'locationClassifications': await deleteLocationClassification(id); break;
        case 'suppliers': await deleteSupplier(id); break;
        case 'containers': await deleteContainer(id); break;
        case 'substrates': deleteSubstrateType(id); break;
        case 'categories': deleteInventoryCategory(id); break;
      }
      setSuccess('Item deleted');
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  // ============================================================================
  // RENDER ADMIN TAB
  // ============================================================================

  const renderAdminTab = () => (
    <div className="space-y-6">
      {/* Admin Notice */}
      <div className="bg-purple-950/30 border border-purple-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-purple-400 text-xl">🛡️</span>
          <div>
            <p className="text-sm font-medium text-purple-300">Admin Panel</p>
            <p className="text-sm text-zinc-400 mt-1">
              Manage user accounts, permissions, and view audit logs. Changes here affect all users.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setAdminSubTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminSubTab === 'users'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          Users ({adminUsers.length})
        </button>
        <button
          onClick={() => setAdminSubTab('masterData')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminSubTab === 'masterData'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          Master Data
        </button>
        <button
          onClick={() => setAdminSubTab('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminSubTab === 'notifications'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setAdminSubTab('audit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            adminSubTab === 'audit'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          Audit Log ({auditLog.length})
        </button>
      </div>

      {adminSubTab === 'users' ? (
        <div className="space-y-4">
          {/* Users Header */}
          <div className="flex items-center justify-between">
            <p className="text-zinc-400">Manage user accounts and permissions</p>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.Refresh />
              {loadingUsers ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">User</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Subscription</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Joined</th>
                    <th className="text-right p-4 text-sm font-medium text-zinc-400 w-32">Actions</th>
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
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">{user.display_name || 'No name'}</p>
                            <p className="text-sm text-zinc-500">{user.email || 'No email'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_active
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-700'
                              : 'bg-red-950/50 text-red-400 border border-red-700'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.is_admin
                              ? 'bg-purple-950/50 text-purple-400 border border-purple-700'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="p-4">
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
                        <td className="p-4 text-sm text-zinc-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4 text-right">
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
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleActiveStatus(user)}
                              className={`p-1.5 rounded ${
                                user.is_active
                                  ? 'text-emerald-400 hover:text-red-400 hover:bg-zinc-800'
                                  : 'text-red-400 hover:text-emerald-400 hover:bg-zinc-800'
                              }`}
                              title={user.is_active ? 'Deactivate user' : 'Activate user'}
                            >
                              {user.is_active ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : adminSubTab === 'masterData' ? (
        <AdminMasterData isConnected={isConnected} />
      ) : adminSubTab === 'notifications' ? (
        <AdminNotifications isConnected={isConnected} />
      ) : (
        <div className="space-y-4">
          {/* Audit Log Header */}
          <div className="flex items-center justify-between">
            <p className="text-zinc-400">Track admin actions and changes</p>
            <button
              onClick={fetchAuditLog}
              disabled={loadingAuditLog}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Icons.Refresh />
              {loadingAuditLog ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Audit Log Table */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Time</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Admin</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Action</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Target</th>
                    <th className="text-left p-4 text-sm font-medium text-zinc-400">Details</th>
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
                        <td className="p-4 text-sm text-zinc-400">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}
                        </td>
                        <td className="p-4 text-sm text-white">
                          {entry.admin_email || 'Unknown'}
                        </td>
                        <td className="p-4">
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
                        <td className="p-4 text-sm text-zinc-400">
                          {entry.target_email || entry.target_id || '-'}
                        </td>
                        <td className="p-4 text-sm text-zinc-500 max-w-xs truncate">
                          {entry.details ? JSON.stringify(entry.details) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

  // ============================================================================
  // RENDER DATABASE TAB
  // ============================================================================

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      {/* Admin Notice */}
      <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Icons.AlertCircle />
          <div>
            <p className="text-sm font-medium text-amber-300">Admin Only Section</p>
            <p className="text-sm text-zinc-400 mt-1">
              Database credentials are configured via environment variables at build time for security.
              This section shows connection status and database health.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-700 flex items-center justify-center text-emerald-400">
                  <Icons.Cloud />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400">Connected to Supabase</h3>
                  <p className="text-sm text-zinc-500">Database is online and healthy</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-700 flex items-center justify-center text-amber-400">
                  <Icons.CloudOff />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-400">Offline Mode</h3>
                  <p className="text-sm text-zinc-500">Data is stored locally on this device</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => refreshData()}
            disabled={!isConnected}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
          >
            <Icons.Refresh />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Table Status */}
      {tableStatuses.length > 0 && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Icons.Table />
            Database Tables Status
          </h3>
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
          
          {/* Check Status Button */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <button
              onClick={checkTableStatus}
              disabled={dbTesting}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
            >
              {dbTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking...
                </>
              ) : (
                <>
                  <Icons.Refresh />
                  Refresh Table Status
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Schema Setup */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Schema Setup</h3>
        <p className="text-sm text-zinc-400 mb-4">
          If tables are missing or you see permission errors, run the schema SQL in your Supabase SQL Editor.
        </p>
        
        <div className="bg-amber-950/30 border border-amber-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-300">
            <strong>Important:</strong> The schema includes anonymous access policies. Make sure to run the FULL schema file to enable data access without authentication.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={copySchema}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 flex items-center gap-2"
          >
            <Icons.Copy />
            {schemaCopied ? 'Copied!' : 'Copy Schema SQL'}
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
      </div>

      {/* Quick Stats */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Local Data Summary</h3>
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
      </div>
    </div>
  );

  // ============================================================================
  // RENDER DATA TABLE
  // ============================================================================

  const renderDataTable = (items: any[], columns: { key: string; label: string; render?: (item: any) => React.ReactNode }[]) => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {columns.map(col => (
                <th key={col.key} className="text-left p-4 text-sm font-medium text-zinc-400">{col.label}</th>
              ))}
              <th className="text-right p-4 text-sm font-medium text-zinc-400 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {items.filter(i => i.isActive !== false).map(item => (
              <tr key={item.id} className="hover:bg-zinc-800/30">
                {columns.map(col => (
                  <td key={col.key} className="p-4 text-white">
                    {col.render ? col.render(item) : item[col.key] || '-'}
                  </td>
                ))}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(item)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" title="Edit">
                      <Icons.Edit />
                    </button>
                    <button onClick={() => handleDelete(item.id, activeTab)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded" title="Delete">
                      <Icons.Trash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.filter(i => i.isActive !== false).length === 0 && (
        <div className="p-8 text-center text-zinc-500">
          No items yet. Click "Add" to create one.
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER TAB CONTENT
  // ============================================================================

  const renderTabContent = () => {
    switch (activeTab) {
      case 'admin':
        return renderAdminTab();

      case 'database':
        return renderDatabaseTab();

      case 'species':
        const activeSpecies = (state.species || []).filter(s => s.isActive !== false);
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Mushroom species for your strain library. Click to view details.</p>
              <button onClick={() => openAddModal('species')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Species
              </button>
            </div>

            {/* Species List with Click-to-Expand */}
            <div className="grid gap-3">
              {activeSpecies.map(species => (
                <div key={species.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Species Row Header - Always Visible */}
                  <button
                    onClick={() => setSelectedSpeciesId(selectedSpeciesId === species.id ? null : species.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-lg">
                        {species.category === 'gourmet' ? '🍄' : species.category === 'medicinal' ? '💊' : species.category === 'research' ? '🔬' : '🧬'}
                      </div>
                      <div>
                        <SpeciesName species={species} className="text-white font-medium" />
                        <div className="flex items-center gap-2 mt-0.5">
                          <SpeciesBadge species={species} size="sm" />
                          {species.difficulty && (
                            <span className={`text-xs capitalize ${
                              species.difficulty === 'beginner' ? 'text-emerald-400' :
                              species.difficulty === 'intermediate' ? 'text-amber-400' :
                              species.difficulty === 'advanced' ? 'text-orange-400' :
                              'text-red-400'
                            }`}>
                              {species.difficulty}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Quick Stats */}
                      {species.typicalYield && (
                        <span className="hidden sm:block text-xs text-zinc-500">Yield: <span className="text-emerald-400">{species.typicalYield}</span></span>
                      )}
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEditModal(species)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded" title="Edit">
                          <Icons.Edit />
                        </button>
                        <button onClick={() => handleDelete(species.id, 'species')} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded" title="Delete">
                          <Icons.Trash />
                        </button>
                      </div>
                      {/* Expand Indicator */}
                      <svg
                        className={`w-5 h-5 text-zinc-500 transition-transform ${selectedSpeciesId === species.id ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Content - SpeciesInfoPanel */}
                  {selectedSpeciesId === species.id && (
                    <div className="border-t border-zinc-800">
                      <SpeciesInfoPanel species={species} className="border-0 rounded-none" />
                    </div>
                  )}
                </div>
              ))}

              {activeSpecies.length === 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
                  No species yet. Click "Add Species" to create one.
                </div>
              )}
            </div>
          </div>
        );

      case 'strains':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Strain varieties in your library</p>
              <button onClick={() => openAddModal('strains')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Strain
              </button>
            </div>
            {renderDataTable(state.strains, [
              { key: 'name', label: 'Name' },
              { key: 'species', label: 'Species' },
              { key: 'difficulty', label: 'Difficulty', render: (item) => {
                const colors: Record<string, string> = { beginner: 'bg-emerald-950/50 text-emerald-400 border-emerald-700', intermediate: 'bg-amber-950/50 text-amber-400 border-amber-700', advanced: 'bg-red-950/50 text-red-400 border-red-700' };
                return <span className={`px-2 py-0.5 rounded text-xs border ${colors[item.difficulty] || colors.intermediate}`}>{item.difficulty}</span>;
              }},
              { key: 'colonizationDays', label: 'Colonization', render: (item) => `${item.colonizationDays?.min || 0}-${item.colonizationDays?.max || 0}d` },
            ])}
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Lab areas and growing spaces with procurement tracking</p>
              <button onClick={() => openAddModal('locations')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Location
              </button>
            </div>
            {renderDataTable(state.locations, [
              { key: 'name', label: 'Name' },
              { key: 'typeId', label: 'Type', render: (item) => {
                const locType = state.locationTypes.find(lt => lt.id === item.typeId);
                return <span className="capitalize">{locType?.name || item.type || '-'}</span>;
              }},
              { key: 'classificationId', label: 'Class', render: (item) => {
                const locClass = state.locationClassifications.find(lc => lc.id === item.classificationId);
                return <span className="capitalize">{locClass?.name || '-'}</span>;
              }},
              { key: 'tempRange', label: 'Temp', render: (item) => item.tempRange ? `${item.tempRange.min}-${item.tempRange.max}°C` : '-' },
              { key: 'hasPower', label: 'Power', render: (item) => item.hasPower ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-500">✗</span> },
            ])}
          </div>
        );

      case 'locationTypes':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Customizable location types (incubation, fruiting, storage, etc.)</p>
              <button onClick={() => openAddModal('locationTypes')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Type
              </button>
            </div>
            {renderDataTable(state.locationTypes, [
              { key: 'name', label: 'Name' },
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description' },
            ])}
          </div>
        );

      case 'locationClassifications':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Customizable location classifications (indoor, greenhouse, etc.)</p>
              <button onClick={() => openAddModal('locationClassifications')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Classification
              </button>
            </div>
            {renderDataTable(state.locationClassifications, [
              { key: 'name', label: 'Name' },
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description' },
            ])}
          </div>
        );

      case 'containers':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">All containers: jars, plates, bags, tubs, buckets</p>
              <button onClick={() => openAddModal('containers')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Container
              </button>
            </div>
            {renderDataTable(state.containers, [
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category', render: (item) => <span className="capitalize">{item.category}</span> },
              { key: 'volumeMl', label: 'Volume', render: (item) => item.volumeMl ? (item.volumeMl >= 1000 ? `${(item.volumeMl / 1000).toFixed(1)}L` : `${item.volumeMl}ml`) : '-' },
              { key: 'usageContext', label: 'Usage', render: (item) => item.usageContext?.join(', ') || '-' },
            ])}
          </div>
        );

      case 'substrates':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Substrate types for spawning and fruiting</p>
              <button onClick={() => openAddModal('substrates')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Substrate
              </button>
            </div>
            {renderDataTable(state.substrateTypes, [
              { key: 'name', label: 'Name' },
              { key: 'code', label: 'Code' },
              { key: 'category', label: 'Category', render: (item) => <span className="capitalize">{item.category}</span> },
            ])}
          </div>
        );

      case 'suppliers':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Vendors for spores, supplies, equipment</p>
              <button onClick={() => openAddModal('suppliers')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Supplier
              </button>
            </div>
            {renderDataTable(state.suppliers, [
              { key: 'name', label: 'Name' },
              { key: 'website', label: 'Website', render: (item) => item.website ? <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{item.website}</a> : '-' },
              { key: 'email', label: 'Email' },
            ])}
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Inventory categories for organizing supplies</p>
              <button onClick={() => openAddModal('categories')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Category
              </button>
            </div>
            {renderDataTable(state.inventoryCategories, [
              { key: 'name', label: 'Name' },
              { key: 'color', label: 'Color', render: (item) => <div className="w-6 h-6 rounded border border-zinc-600" style={{ backgroundColor: item.color }}></div> },
              { key: 'icon', label: 'Icon', render: (item) => <span className="text-xl">{item.icon}</span> },
            ])}
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Theme / Appearance Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Appearance</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Choose a visual theme that matches your workflow and aesthetic preferences.
              </p>
              <ThemeSelector />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Units</label>
                  <select
                    value={localSettings.defaultUnits}
                    onChange={e => setLocalSettings(prev => ({ ...prev, defaultUnits: e.target.value as 'metric' | 'imperial' }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="metric">Metric (g, ml, °C)</option>
                    <option value="imperial">Imperial (oz, fl oz, °F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Currency</label>
                  <select
                    value={localSettings.defaultCurrency}
                    onChange={e => setLocalSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => { updateSettings(localSettings); setSuccess('Settings saved'); }}
                className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                Save Preferences
              </button>
            </div>

            {/* Email/SMS Notification Settings */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Email & SMS Notifications</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Receive alerts about important events like contamination, harvest readiness, and low inventory via email or SMS.
              </p>

              {/* Email Notifications */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">Email Notifications</h4>
                    <p className="text-xs text-zinc-500">Receive notifications via email</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, emailNotificationsEnabled: !prev.emailNotificationsEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.emailNotificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {localSettings.emailNotificationsEnabled && (
                  <div className="pl-4 border-l-2 border-zinc-700 space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Notification Email</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={localSettings.notificationEmail || ''}
                          onChange={e => setLocalSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
                          placeholder="Enter email address"
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                        {localSettings.notificationEmailVerified ? (
                          <span className="flex items-center gap-1 px-3 py-2 text-emerald-400 text-sm">
                            <Icons.CheckCircle /> Verified
                          </span>
                        ) : (
                          <button className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm">
                            Verify
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Leave blank to use your account email</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SMS Notifications */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">SMS Notifications</h4>
                    <p className="text-xs text-zinc-500">Receive urgent notifications via text message</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings(prev => ({ ...prev, smsNotificationsEnabled: !prev.smsNotificationsEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.smsNotificationsEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      localSettings.smsNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {localSettings.smsNotificationsEnabled && (
                  <div className="pl-4 border-l-2 border-zinc-700 space-y-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Phone Number</label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={localSettings.phoneNumber || ''}
                          onChange={e => setLocalSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                        />
                        {localSettings.phoneVerified ? (
                          <span className="flex items-center gap-1 px-3 py-2 text-emerald-400 text-sm">
                            <Icons.CheckCircle /> Verified
                          </span>
                        ) : (
                          <button className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm">
                            Verify
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">SMS is reserved for urgent alerts only (contamination, critical failures)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quiet Hours */}
              <div className="space-y-4 border-t border-zinc-700 pt-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Quiet Hours</h4>
                  <p className="text-xs text-zinc-500 mb-3">Pause notifications during these hours (uses your timezone: {localSettings.timezone})</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Start (Don't Disturb After)</label>
                      <input
                        type="time"
                        value={localSettings.quietHoursStart || '22:00'}
                        onChange={e => setLocalSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">End (Resume Notifications)</label>
                      <input
                        type="time"
                        value={localSettings.quietHoursEnd || '08:00'}
                        onChange={e => setLocalSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Categories */}
              <div className="space-y-4 border-t border-zinc-700 pt-6 mt-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Notification Events</h4>
                  <p className="text-xs text-zinc-500 mb-3">Choose which events trigger email/SMS notifications</p>
                  <div className="space-y-3">
                    {[
                      { key: 'contamination', label: 'Contamination Detected', desc: 'Immediate alert when contamination is logged', urgent: true },
                      { key: 'harvest_ready', label: 'Harvest Ready', desc: 'When grows are ready for harvest' },
                      { key: 'stage_transition', label: 'Stage Transitions', desc: 'When grows should advance to next stage' },
                      { key: 'low_inventory', label: 'Low Inventory', desc: 'When supplies fall below reorder point' },
                      { key: 'culture_expiring', label: 'Culture Expiring', desc: 'When cultures are approaching expiration' },
                      { key: 'lc_age', label: 'LC Age Warning', desc: 'When liquid cultures are getting old' },
                    ].map(event => (
                      <div key={event.key} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{event.label}</span>
                            {event.urgent && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">URGENT</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">{event.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {localSettings.emailNotificationsEnabled && (
                            <button className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded">
                              📧
                            </button>
                          )}
                          {localSettings.smsNotificationsEnabled && (
                            <button className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded">
                              📱
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { updateSettings(localSettings); setSuccess('Notification settings saved'); }}
                className="mt-6 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
              >
                Save Notification Settings
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER MODAL - With scrolling fix
  // ============================================================================

  const renderModal = () => {
    if (!showModal) return null;

    const renderFormFields = () => {
      switch (activeTab) {
        case 'species':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Psilocybe cubensis" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Scientific Name</label>
                <input type="text" value={formData.scientificName || ''} onChange={e => setFormData({ ...formData, scientificName: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                <select value={formData.category || 'gourmet'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="gourmet">Gourmet</option>
                  <option value="medicinal">Medicinal</option>
                  <option value="research">Research</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
            </div>
          );

        case 'strains':
          const activeSpecies = (state.species || []).filter((s: { isActive?: boolean }) => s.isActive !== false);
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Blue Oyster, Golden Teacher" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Species *</label>
                <select
                  value={formData.speciesId || ''}
                  onChange={e => {
                    const selectedSpecies = activeSpecies.find((s: { id: string }) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      speciesId: e.target.value,
                      species: selectedSpecies?.scientificName || selectedSpecies?.name || ''
                    });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select species...</option>
                  {activeSpecies.map((species: { id: string; name: string; scientificName?: string }) => (
                    <option key={species.id} value={species.id}>
                      {species.name} {species.scientificName ? `(${species.scientificName})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">Select the species this strain belongs to. Add new species in the Species tab.</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Difficulty</label>
                <select value={formData.difficulty || 'intermediate'} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Colonization Min (days)</label>
                  <input type="number" value={formData.colonizationDaysMin || ''} onChange={e => setFormData({ ...formData, colonizationDaysMin: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Colonization Max (days)</label>
                  <input type="number" value={formData.colonizationDaysMax || ''} onChange={e => setFormData({ ...formData, colonizationDaysMax: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
            </div>
          );

        case 'locations':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StandardDropdown
                  value={formData.typeId || ''}
                  onChange={(value) => setFormData({ ...formData, typeId: value })}
                  options={activeLocationTypes}
                  label="Type"
                  placeholder="Select type..."
                  entityType="locationType"
                  fieldName="typeId"
                />
                <StandardDropdown
                  value={formData.classificationId || ''}
                  onChange={(value) => setFormData({ ...formData, classificationId: value })}
                  options={activeLocationClassifications}
                  label="Classification"
                  placeholder="Select classification..."
                  entityType="locationClassification"
                  fieldName="classificationId"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Temp Min (°C)</label>
                  <input type="number" value={formData.tempMin ?? ''} onChange={e => setFormData({ ...formData, tempMin: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Temp Max (°C)</label>
                  <input type="number" value={formData.tempMax ?? ''} onChange={e => setFormData({ ...formData, tempMax: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Humidity Min (%)</label>
                  <input type="number" value={formData.humidityMin ?? ''} onChange={e => setFormData({ ...formData, humidityMin: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Humidity Max (%)</label>
                  <input type="number" value={formData.humidityMax ?? ''} onChange={e => setFormData({ ...formData, humidityMax: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="hasPower" checked={formData.hasPower ?? false} onChange={e => setFormData({ ...formData, hasPower: e.target.checked })} className="w-4 h-4 rounded" />
                  <label htmlFor="hasPower" className="text-sm text-zinc-400">Has Power</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="hasAirCirculation" checked={formData.hasAirCirculation ?? false} onChange={e => setFormData({ ...formData, hasAirCirculation: e.target.checked })} className="w-4 h-4 rounded" />
                  <label htmlFor="hasAirCirculation" className="text-sm text-zinc-400">Air Circulation</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Power Usage</label>
                  <input type="text" value={formData.powerUsage || ''} onChange={e => setFormData({ ...formData, powerUsage: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., 120V, 240V" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Size</label>
                  <input type="text" value={formData.size || ''} onChange={e => setFormData({ ...formData, size: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Small, 4x4ft" />
                </div>
              </div>
              <div className="border-t border-zinc-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Procurement Details</h4>
                <div className="space-y-4">
                  <StandardDropdown
                    value={formData.supplierId || ''}
                    onChange={(value) => setFormData({ ...formData, supplierId: value })}
                    options={activeSuppliers}
                    label="Supplier/Source"
                    placeholder="Select supplier..."
                    entityType="supplier"
                    fieldName="supplierId"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Cost</label>
                      <input type="number" step="0.01" value={formData.cost ?? ''} onChange={e => setFormData({ ...formData, cost: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Procurement Date</label>
                      <input type="date" value={formData.procurementDate || ''} onChange={e => setFormData({ ...formData, procurementDate: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
            </div>
          );

        case 'locationTypes':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus placeholder="e.g., Incubation Chamber" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Code</label>
                <input type="text" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono" placeholder="e.g., incubation_chamber" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
            </div>
          );

        case 'locationClassifications':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus placeholder="e.g., Greenhouse" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Code</label>
                <input type="text" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono" placeholder="e.g., greenhouse" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none" />
              </div>
            </div>
          );

        case 'suppliers':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Website</label>
                <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="https://" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
          );

        case 'containers':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                <select value={formData.category || 'jar'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <optgroup label="Culture Containers">
                    <option value="jar">Jar</option>
                    <option value="plate">Plate</option>
                    <option value="tube">Tube</option>
                    <option value="bottle">Bottle</option>
                    <option value="syringe">Syringe</option>
                  </optgroup>
                  <optgroup label="Grow Containers">
                    <option value="tub">Tub</option>
                    <option value="bucket">Bucket</option>
                    <option value="bed">Bed</option>
                  </optgroup>
                  <optgroup label="Both">
                    <option value="bag">Bag</option>
                    <option value="other">Other</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Volume (ml)</label>
                <input type="number" value={formData.volumeMl || ''} onChange={e => setFormData({ ...formData, volumeMl: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., 946 for quart jar" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isReusable" checked={formData.isReusable ?? true} onChange={e => setFormData({ ...formData, isReusable: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="isReusable" className="text-sm text-zinc-400">Reusable</label>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Usage Context</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.usageContext?.includes('culture') ?? true} onChange={e => {
                      const contexts = formData.usageContext || ['culture', 'grow'];
                      setFormData({ ...formData, usageContext: e.target.checked ? [...contexts.filter((c: string) => c !== 'culture'), 'culture'] : contexts.filter((c: string) => c !== 'culture') });
                    }} className="w-4 h-4 rounded" />
                    <span className="text-sm text-zinc-400">Culture Work</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.usageContext?.includes('grow') ?? true} onChange={e => {
                      const contexts = formData.usageContext || ['culture', 'grow'];
                      setFormData({ ...formData, usageContext: e.target.checked ? [...contexts.filter((c: string) => c !== 'grow'), 'grow'] : contexts.filter((c: string) => c !== 'grow') });
                    }} className="w-4 h-4 rounded" />
                    <span className="text-sm text-zinc-400">Growing</span>
                  </label>
                </div>
              </div>
            </div>
          );

        case 'substrates':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Code</label>
                <input type="text" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., cvg" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                <select value={formData.category || 'bulk'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="bulk">Bulk</option>
                  <option value="grain">Grain</option>
                  <option value="agar">Agar</option>
                  <option value="liquid">Liquid</option>
                </select>
              </div>
            </div>
          );

        case 'categories':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formData.color || '#10b981'} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded border border-zinc-700 cursor-pointer" />
                  <input type="text" value={formData.color || '#10b981'} onChange={e => setFormData({ ...formData, color: e.target.value })} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Icon (emoji)</label>
                <input type="text" value={formData.icon || '📦'} onChange={e => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
          );

        default:
          return <p className="text-zinc-500">Form not available for this tab.</p>;
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black/70 z-50 overflow-y-auto" 
        onClick={() => setShowModal(false)}
      >
        <div className="min-h-full flex items-start justify-center p-4 py-8">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? 'Edit' : 'Add'} {tabConfig[activeTab]?.label.replace(/s$/, '') || 'Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>
            <div className="p-5">
              {renderFormFields()}
            </div>
            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name?.trim()}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <div className="text-red-400 flex-shrink-0 mt-0.5"><Icons.AlertCircle /></div>
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4 flex items-center gap-3">
          <div className="text-emerald-400"><Icons.CheckCircle /></div>
          <p className="text-emerald-400">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            <span>{tabConfig[tab].icon}</span>
            <span className="hidden sm:inline">{tabConfig[tab].label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {renderTabContent()}

      {/* Modal */}
      {renderModal()}
    </div>
  );
};
