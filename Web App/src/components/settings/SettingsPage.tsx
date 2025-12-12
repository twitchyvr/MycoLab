// ============================================================================
// SETTINGS PAGE - Full Database Administration
// Manage all lookup tables, database config, schema verification, and preferences
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useData } from '../../store';
import { useAuth } from '../../lib/AuthContext';
import type { Species, Strain, Location, Vessel, ContainerType, SubstrateType, Supplier, InventoryCategory, AppSettings } from '../../store/types';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

type SettingsTab = 'database' | 'species' | 'strains' | 'locations' | 'vessels' | 'containers' | 'substrates' | 'suppliers' | 'categories' | 'preferences';

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
  database: { label: 'Database', icon: '☁️' },
  species: { label: 'Species', icon: '🧬' },
  strains: { label: 'Strains', icon: '🍄' },
  locations: { label: 'Locations', icon: '📍' },
  vessels: { label: 'Vessels', icon: '🧪' },
  containers: { label: 'Containers', icon: '📦' },
  substrates: { label: 'Substrates', icon: '🌱' },
  suppliers: { label: 'Suppliers', icon: '🏪' },
  categories: { label: 'Categories', icon: '🏷️' },
  preferences: { label: 'Preferences', icon: '⚙️' },
};

// All database tables
const ALL_TABLES = [
  'species', 'strains', 'locations', 'vessels', 'container_types', 'substrate_types',
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
    addSupplier, updateSupplier, deleteSupplier,
    addVessel, updateVessel, deleteVessel,
    addContainerType, updateContainerType, deleteContainerType,
    addSubstrateType, updateSubstrateType, deleteSubstrateType,
    addInventoryCategory, updateInventoryCategory, deleteInventoryCategory,
  } = useData();

  const { isAdmin } = useAuth();

  // Filter tabs based on admin status - non-admins can't see database config
  const availableTabs = isAdmin
    ? (Object.keys(tabConfig) as SettingsTab[])
    : (Object.keys(tabConfig) as SettingsTab[]).filter(tab => tab !== 'database');

  const [activeTab, setActiveTab] = useState<SettingsTab>(isAdmin ? 'database' : 'preferences');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Database state (read-only status display for admins)
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);

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
        return { name: '', type: 'storage', tempMin: '', tempMax: '', humidityMin: '', humidityMax: '', notes: '' };
      case 'vessels':
        return { name: '', type: 'jar', volumeMl: '', isReusable: true, notes: '' };
      case 'containers':
        return { name: '', category: 'tub', volumeL: '', notes: '' };
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
        return { name: item.name || '', type: item.type || 'storage', tempMin: item.tempRange?.min ?? '', tempMax: item.tempRange?.max ?? '', humidityMin: item.humidityRange?.min ?? '', humidityMax: item.humidityRange?.max ?? '', notes: item.notes || '' };
      case 'vessels':
        return { name: item.name || '', type: item.type || 'jar', volumeMl: item.volumeMl || '', isReusable: item.isReusable ?? true, notes: item.notes || '' };
      case 'containers':
        return { name: item.name || '', category: item.category || 'tub', volumeL: item.volumeL || '', notes: item.notes || '' };
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
            type: formData.type as Location['type'],
            tempRange: formData.tempMin !== '' && formData.tempMax !== '' ? { min: Number(formData.tempMin), max: Number(formData.tempMax) } : undefined,
            humidityRange: formData.humidityMin !== '' && formData.humidityMax !== '' ? { min: Number(formData.humidityMin), max: Number(formData.humidityMax) } : undefined,
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

        case 'vessels':
          const vesselData = {
            name: formData.name.trim(),
            type: formData.type as Vessel['type'],
            volumeMl: formData.volumeMl ? Number(formData.volumeMl) : undefined,
            isReusable: formData.isReusable ?? true,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateVessel(editingItem.id, vesselData);
          } else {
            await addVessel(vesselData);
          }
          setSuccess('Vessel saved');
          break;

        case 'containers':
          const containerData = {
            name: formData.name.trim(),
            category: formData.category as ContainerType['category'],
            volumeL: formData.volumeL ? Number(formData.volumeL) : undefined,
            notes: formData.notes?.trim() || undefined,
            isActive: true,
          };
          if (editingItem) {
            await updateContainerType(editingItem.id, containerData);
          } else {
            await addContainerType(containerData);
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
        case 'suppliers': await deleteSupplier(id); break;
        case 'vessels': deleteVessel(id); break;
        case 'containers': deleteContainerType(id); break;
        case 'substrates': deleteSubstrateType(id); break;
        case 'categories': deleteInventoryCategory(id); break;
      }
      setSuccess('Item deleted');
    } catch (err: any) {
      setError(`Delete failed: ${err.message}`);
    }
  };

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
      case 'database':
        return renderDatabaseTab();

      case 'species':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Mushroom species for your strain library</p>
              <button onClick={() => openAddModal('species')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Species
              </button>
            </div>
            {renderDataTable(state.species || [], [
              { key: 'name', label: 'Name' },
              { key: 'scientificName', label: 'Scientific Name' },
              { key: 'category', label: 'Category', render: (item) => <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 capitalize">{item.category}</span> },
            ])}
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
              <p className="text-zinc-400">Lab areas and growing spaces</p>
              <button onClick={() => openAddModal('locations')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Location
              </button>
            </div>
            {renderDataTable(state.locations, [
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type', render: (item) => <span className="capitalize">{item.type}</span> },
              { key: 'tempRange', label: 'Temp Range', render: (item) => item.tempRange ? `${item.tempRange.min}-${item.tempRange.max}°C` : '-' },
              { key: 'humidityRange', label: 'Humidity', render: (item) => item.humidityRange ? `${item.humidityRange.min}-${item.humidityRange.max}%` : '-' },
            ])}
          </div>
        );

      case 'vessels':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Culture containers: jars, bags, plates, syringes</p>
              <button onClick={() => openAddModal('vessels')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Vessel
              </button>
            </div>
            {renderDataTable(state.vessels, [
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type', render: (item) => <span className="capitalize">{item.type}</span> },
              { key: 'volumeMl', label: 'Volume', render: (item) => item.volumeMl ? `${item.volumeMl}ml` : '-' },
              { key: 'isReusable', label: 'Reusable', render: (item) => item.isReusable ? <span className="text-emerald-400">✓</span> : <span className="text-zinc-500">✗</span> },
            ])}
          </div>
        );

      case 'containers':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-zinc-400">Grow containers: monotubs, buckets, bags</p>
              <button onClick={() => openAddModal('containers')} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Icons.Plus /> Add Container
              </button>
            </div>
            {renderDataTable(state.containerTypes, [
              { key: 'name', label: 'Name' },
              { key: 'category', label: 'Category', render: (item) => <span className="capitalize">{item.category}</span> },
              { key: 'volumeL', label: 'Volume', render: (item) => item.volumeL ? `${item.volumeL}L` : '-' },
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
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Golden Teacher" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Species *</label>
                <input type="text" value={formData.species || ''} onChange={e => setFormData({ ...formData, species: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Psilocybe cubensis" />
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
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select value={formData.type || 'storage'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="incubation">Incubation</option>
                  <option value="fruiting">Fruiting</option>
                  <option value="storage">Storage</option>
                  <option value="lab">Lab</option>
                  <option value="other">Other</option>
                </select>
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

        case 'vessels':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select value={formData.type || 'jar'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="jar">Jar</option>
                  <option value="bag">Bag</option>
                  <option value="plate">Plate</option>
                  <option value="tube">Tube</option>
                  <option value="bottle">Bottle</option>
                  <option value="syringe">Syringe</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Volume (ml)</label>
                <input type="number" value={formData.volumeMl || ''} onChange={e => setFormData({ ...formData, volumeMl: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isReusable" checked={formData.isReusable ?? true} onChange={e => setFormData({ ...formData, isReusable: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="isReusable" className="text-sm text-zinc-400">Reusable</label>
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
                <select value={formData.category || 'tub'} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                  <option value="tub">Tub</option>
                  <option value="bag">Bag</option>
                  <option value="bucket">Bucket</option>
                  <option value="bed">Bed</option>
                  <option value="jar">Jar</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Volume (L)</label>
                <input type="number" value={formData.volumeL || ''} onChange={e => setFormData({ ...formData, volumeL: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
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
