// ============================================================================
// ADMIN MASTER DATA - Manage all lookup tables across all users
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';

// Types
interface MasterDataItem {
  id: string;
  name: string;
  user_id: string | null;
  user_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface AdminUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
}

type MasterDataTable =
  | 'species'
  | 'strains'
  | 'location_types'
  | 'location_classifications'
  | 'containers'  // Unified: replaces vessels and container_types
  | 'substrate_types'
  | 'suppliers'
  | 'inventory_categories'
  | 'recipe_categories'
  | 'grain_types';

interface TableConfig {
  name: string;
  displayName: string;
  icon: string;
  fields: { key: string; label: string; type: 'text' | 'select' | 'number' | 'boolean' }[];
}

const tableConfigs: Record<MasterDataTable, TableConfig> = {
  species: {
    name: 'species',
    displayName: 'Species',
    icon: '🧬',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'scientific_name', label: 'Scientific Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'select' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
  },
  strains: {
    name: 'strains',
    displayName: 'Strains',
    icon: '🍄',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'species', label: 'Species', type: 'text' },
      { key: 'difficulty', label: 'Difficulty', type: 'select' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
  },
  location_types: {
    name: 'location_types',
    displayName: 'Location Types',
    icon: '🏷️',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  location_classifications: {
    name: 'location_classifications',
    displayName: 'Location Classifications',
    icon: '📂',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
    ],
  },
  containers: {
    name: 'containers',
    displayName: 'Containers',
    icon: '📦',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'select' },
      { key: 'volume_ml', label: 'Volume (ml)', type: 'number' },
      { key: 'is_reusable', label: 'Reusable', type: 'boolean' },
    ],
  },
  substrate_types: {
    name: 'substrate_types',
    displayName: 'Substrate Types',
    icon: '🌱',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'category', label: 'Category', type: 'select' },
      { key: 'field_capacity', label: 'Field Capacity', type: 'number' },
    ],
  },
  suppliers: {
    name: 'suppliers',
    displayName: 'Suppliers',
    icon: '🏪',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
    ],
  },
  inventory_categories: {
    name: 'inventory_categories',
    displayName: 'Inventory Categories',
    icon: '🏷️',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'text' },
    ],
  },
  recipe_categories: {
    name: 'recipe_categories',
    displayName: 'Recipe Categories',
    icon: '📋',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'icon', label: 'Icon', type: 'text' },
    ],
  },
  grain_types: {
    name: 'grain_types',
    displayName: 'Grain Types',
    icon: '🌾',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
    ],
  },
};

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
};

interface AdminMasterDataProps {
  isConnected: boolean;
}

export const AdminMasterData: React.FC<AdminMasterDataProps> = ({ isConnected }) => {
  const { isAdmin } = useAuth();
  const [selectedTable, setSelectedTable] = useState<MasterDataTable>('species');
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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

  // Fetch users for the filter dropdown
  const fetchUsers = async () => {
    console.log('[AdminMasterData] fetchUsers called', { isConnected, isAdmin });
    if (!isConnected || !isAdmin) {
      console.log('[AdminMasterData] fetchUsers skipped - not connected or not admin');
      return;
    }

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) {
        console.log('[AdminMasterData] fetchUsers - no supabase client');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id, user_id, email, display_name')
        .order('email');

      if (fetchError) {
        console.error('Failed to fetch users:', fetchError);
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Fetch items for the selected table
  const fetchItems = async () => {
    console.log('[AdminMasterData] fetchItems called', { selectedTable, isConnected, isAdmin });
    if (!isConnected || !isAdmin) {
      console.log('[AdminMasterData] fetchItems skipped - not connected or not admin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) {
        console.log('[AdminMasterData] fetchItems - no supabase client');
        return;
      }

      let query = supabase
        .from(selectedTable)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply user filter if not "all"
      if (filterUserId === 'global') {
        query = query.is('user_id', null);
      } else if (filterUserId !== 'all') {
        query = query.eq('user_id', filterUserId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(`Failed to fetch data: ${fetchError.message}`);
        return;
      }

      // Enrich items with user email
      const enrichedItems = (data || []).map(item => {
        const user = users.find(u => u.user_id === item.user_id);
        return {
          ...item,
          user_email: user?.email || (item.user_id ? 'Unknown User' : 'Global Default'),
        };
      });

      setItems(enrichedItems);
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when table or filter changes
  useEffect(() => {
    fetchUsers();
  }, [isConnected, isAdmin]);

  useEffect(() => {
    fetchItems();
  }, [selectedTable, filterUserId, isConnected, isAdmin, users]);

  // Open add modal with empty form
  const openAddModal = () => {
    console.log('[AdminMasterData] openAddModal clicked');
    setEditingItem(null);
    const defaultData: Record<string, any> = { is_global: true };
    tableConfigs[selectedTable].fields.forEach(field => {
      defaultData[field.key] = field.type === 'boolean' ? false : '';
    });
    setFormData(defaultData);
    setShowModal(true);
  };

  // Open edit modal with item data
  const openEditModal = (item: MasterDataItem) => {
    setEditingItem(item);
    const data: Record<string, any> = { is_global: item.user_id === null };
    tableConfigs[selectedTable].fields.forEach(field => {
      data[field.key] = item[field.key] ?? '';
    });
    setFormData(data);
    setShowModal(true);
  };

  // Save item
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const saveData: Record<string, any> = {
        is_active: true,
      };

      tableConfigs[selectedTable].fields.forEach(field => {
        if (formData[field.key] !== undefined && formData[field.key] !== '') {
          saveData[field.key] = formData[field.key];
        }
      });

      // Set user_id to null for global items, otherwise keep existing or current user
      if (formData.is_global) {
        saveData.user_id = null;
      }

      if (editingItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from(selectedTable)
          .update(saveData)
          .eq('id', editingItem.id);

        if (updateError) {
          throw updateError;
        }
        setSuccess('Item updated successfully');
      } else {
        // Insert new item - for global items, set user_id to null
        if (!formData.is_global) {
          // Get current user for non-global items
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            saveData.user_id = user.id;
          }
        }

        const { error: insertError } = await supabase
          .from(selectedTable)
          .insert(saveData);

        if (insertError) {
          throw insertError;
        }
        setSuccess('Item created successfully');
      }

      setShowModal(false);
      setEditingItem(null);
      await fetchItems();
    } catch (err: any) {
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDelete = async (item: MasterDataItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { error: deleteError } = await supabase
        .from(selectedTable)
        .delete()
        .eq('id', item.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess('Item deleted successfully');
      await fetchItems();
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  // Toggle active status
  const toggleActive = async (item: MasterDataItem) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      if (!supabase) return;

      const { error: updateError } = await supabase
        .from(selectedTable)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(`Item ${item.is_active ? 'deactivated' : 'activated'}`);
      await fetchItems();
    } catch (err: any) {
      setError(`Failed to update: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-zinc-500">
        You do not have permission to access this section.
      </div>
    );
  }

  const config = tableConfigs[selectedTable];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-950/30 border border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-xl">📊</span>
          <div>
            <p className="text-sm font-medium text-blue-300">Master Data Management</p>
            <p className="text-sm text-zinc-400 mt-1">
              Manage lookup tables across all users. Create global defaults (available to everyone) or view/edit user-specific data.
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 rounded-lg p-4 text-emerald-300">
          {success}
        </div>
      )}

      {/* Table Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(tableConfigs) as MasterDataTable[]).map(table => (
          <button
            key={table}
            onClick={() => setSelectedTable(table)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedTable === table
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            <span>{tableConfigs[table].icon}</span>
            {tableConfigs[table].displayName}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Icons.Filter />
          <select
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All Items</option>
            <option value="global">Global Defaults Only</option>
            {users.map(user => (
              <option key={user.user_id} value={user.user_id}>
                {user.email || user.display_name || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={fetchItems}
            disabled={loading}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Refresh />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Icons.Plus />
            Add {config.displayName.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Name</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Owner</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-zinc-400">Created</th>
                <th className="text-right p-4 text-sm font-medium text-zinc-400 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No items found. Click "Add" to create one.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          {item.notes && (
                            <p className="text-sm text-zinc-500 truncate max-w-xs">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                        item.user_id === null
                          ? 'bg-blue-950/50 text-blue-400 border border-blue-700'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {item.user_id === null ? (
                          <>
                            <Icons.Globe />
                            Global
                          </>
                        ) : (
                          <>
                            <Icons.User />
                            {item.user_email}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.is_active
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-700'
                          : 'bg-red-950/50 text-red-400 border border-red-700'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          className={`p-1.5 rounded ${
                            item.is_active
                              ? 'text-emerald-400 hover:text-red-400 hover:bg-zinc-800'
                              : 'text-red-400 hover:text-emerald-400 hover:bg-zinc-800'
                          }`}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {item.is_active ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <path d="M9 12l2 2 4-4"/>
                              <circle cx="12" cy="12" r="10"/>
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                              <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded"
                          title="Delete"
                        >
                          <Icons.Trash />
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

      {/* Item Count */}
      <div className="text-sm text-zinc-500">
        Showing {items.length} item{items.length !== 1 ? 's' : ''}
        {filterUserId === 'global' && ' (global defaults only)'}
        {filterUserId !== 'all' && filterUserId !== 'global' && ` for ${users.find(u => u.user_id === filterUserId)?.email || 'selected user'}`}
      </div>

      {/* Edit Modal */}
      {showModal && (
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
                  {editingItem ? 'Edit' : 'Add'} {config.displayName.slice(0, -1)}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <Icons.X />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Global toggle */}
                <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_global}
                      onChange={e => setFormData({ ...formData, is_global: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-blue-300 flex items-center gap-2">
                        <Icons.Globe />
                        Global Default
                      </span>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Make this available to all users as a default option
                      </p>
                    </div>
                  </label>
                </div>

                {/* Dynamic fields */}
                {config.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm text-zinc-400 mb-1">{field.label}</label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[field.key] || false}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-zinc-600"
                        />
                        <span className="text-sm text-zinc-300">Yes</span>
                      </label>
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Select...</option>
                        {field.key === 'category' && selectedTable === 'species' && (
                          <>
                            <option value="gourmet">Gourmet</option>
                            <option value="medicinal">Medicinal</option>
                            <option value="research">Research</option>
                            <option value="other">Other</option>
                          </>
                        )}
                        {field.key === 'difficulty' && (
                          <>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </>
                        )}
                        {field.key === 'category' && selectedTable === 'containers' && (
                          <>
                            <option value="jar">Jar</option>
                            <option value="bag">Bag</option>
                            <option value="plate">Plate</option>
                            <option value="tube">Tube</option>
                            <option value="bottle">Bottle</option>
                            <option value="syringe">Syringe</option>
                            <option value="tub">Tub</option>
                            <option value="bucket">Bucket</option>
                            <option value="bed">Bed</option>
                            <option value="other">Other</option>
                          </>
                        )}
                        {field.key === 'category' && selectedTable === 'substrate_types' && (
                          <>
                            <option value="bulk">Bulk</option>
                            <option value="grain">Grain</option>
                            <option value="agar">Agar</option>
                            <option value="liquid">Liquid</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMasterData;
