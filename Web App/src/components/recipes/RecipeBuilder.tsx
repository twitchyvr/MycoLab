// ============================================================================
// RECIPE BUILDER
// Create and manage recipes for agar, liquid culture, grain spawn, and substrates
// ============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../store';
import type { Recipe, RecipeCategory, RecipeIngredient, RecipeCategoryItem } from '../../store/types';
import { StandardDropdown } from '../common/StandardDropdown';

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

export const RecipeBuilder: React.FC = () => {
  const {
    state,
    activeInventoryItems,
    activeRecipeCategories,
    getInventoryItem,
    getRecipeCategory,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    scaleRecipe,
    generateId,
  } = useData();

  const recipes = state.recipes.filter(r => r.isActive);

  // Helper to get category config by code
  const getCategoryConfig = (code: string) => {
    const cat = getRecipeCategory(code);
    if (cat) {
      return { label: cat.name, icon: cat.icon, color: cat.color };
    }
    // Fallback for unknown categories
    return { label: code, icon: '📦', color: 'text-zinc-400 bg-zinc-800' };
  };

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<RecipeCategory | 'all'>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    category: RecipeCategory;
    description: string;
    yield: { amount: number; unit: string };
    prepTime: number;
    sterilizationTime: number;
    sterilizationPsi: number;
    ingredients: RecipeIngredient[];
    instructions: string[];
    tips: string[];
    notes: string;
  }>({
    name: '',
    category: 'agar',
    description: '',
    yield: { amount: 500, unit: 'ml' },
    prepTime: 15,
    sterilizationTime: 45,
    sterilizationPsi: 15,
    ingredients: [],
    instructions: [''],
    tips: [],
    notes: '',
  });

  // New ingredient form
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    name: '',
    quantity: 0,
    unit: 'g',
  });

  // Listen for header "New" button click
  useEffect(() => {
    const handleCreateNew = (event: CustomEvent) => {
      if (event.detail?.page === 'recipes') {
        resetForm();
        setEditMode(false);
        setShowCreateModal(true);
      }
    };
    window.addEventListener('mycolab:create-new', handleCreateNew as EventListener);
    return () => window.removeEventListener('mycolab:create-new', handleCreateNew as EventListener);
  }, []);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    let result = [...recipes];
    if (filterCategory !== 'all') result = result.filter(r => r.category === filterCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, filterCategory, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    // Initialize counts for all active categories
    activeRecipeCategories.forEach(cat => { byCategory[cat.code] = 0; });
    // Count recipes by category
    recipes.forEach(r => {
      if (byCategory[r.category] !== undefined) {
        byCategory[r.category]++;
      } else {
        byCategory[r.category] = 1;
      }
    });
    return { total: recipes.length, byCategory };
  }, [recipes, activeRecipeCategories]);

  // Calculate cost
  const getRecipeCost = (recipe: Recipe): number => {
    return recipe.ingredients.reduce((total, ing) => {
      if (ing.inventoryItemId) {
        const item = getInventoryItem(ing.inventoryItemId);
        if (item) return total + (item.unitCost * ing.quantity);
      }
      return total;
    }, 0);
  };

  // Scaled recipe
  const scaledRecipe = useMemo(() => {
    if (!selectedRecipe) return null;
    return scaleRecipe(selectedRecipe, scaleFactor);
  }, [selectedRecipe, scaleFactor, scaleRecipe]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '', category: 'agar', description: '',
      yield: { amount: 500, unit: 'ml' },
      prepTime: 15, sterilizationTime: 45, sterilizationPsi: 15,
      ingredients: [], instructions: [''], tips: [], notes: '',
    });
    setNewIngredient({ inventoryItemId: '', name: '', quantity: 0, unit: 'g' });
  };

  // Load recipe for editing
  const loadRecipeForEdit = (recipe: Recipe) => {
    setFormData({
      name: recipe.name,
      category: recipe.category,
      description: recipe.description,
      yield: { ...recipe.yield },
      prepTime: recipe.prepTime || 0,
      sterilizationTime: recipe.sterilizationTime || 0,
      sterilizationPsi: recipe.sterilizationPsi || 15,
      ingredients: recipe.ingredients.map(i => ({ ...i })),
      instructions: [...recipe.instructions],
      tips: recipe.tips ? [...recipe.tips] : [],
      notes: recipe.notes || '',
    });
    setEditMode(true);
    setShowCreateModal(true);
  };

  // Add ingredient
  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity) return;
    const ingredient: RecipeIngredient = {
      id: generateId('ing'),
      inventoryItemId: newIngredient.inventoryItemId || undefined,
      name: newIngredient.name,
      quantity: newIngredient.quantity,
      unit: newIngredient.unit,
    };
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, ingredient] }));
    setNewIngredient({ inventoryItemId: '', name: '', quantity: 0, unit: 'g' });
  };

  // Remove ingredient
  const handleRemoveIngredient = (id: string) => {
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.id !== id) }));
  };

  // Add instruction
  const handleAddInstruction = () => {
    setFormData(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  // Update instruction
  const handleUpdateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst),
    }));
  };

  // Remove instruction
  const handleRemoveInstruction = (index: number) => {
    setFormData(prev => ({ ...prev, instructions: prev.instructions.filter((_, i) => i !== index) }));
  };

  // Save recipe
  const handleSaveRecipe = async () => {
    if (!formData.name || formData.ingredients.length === 0) return;
    const recipeData = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      yield: formData.yield,
      prepTime: formData.prepTime || undefined,
      sterilizationTime: formData.sterilizationTime || undefined,
      sterilizationPsi: formData.sterilizationPsi || undefined,
      ingredients: formData.ingredients,
      instructions: formData.instructions.filter(i => i.trim()),
      tips: formData.tips.filter(t => t.trim()),
      notes: formData.notes || undefined,
      isActive: true,
    };
    if (editMode && selectedRecipe) {
      await updateRecipe(selectedRecipe.id, recipeData);
      setSelectedRecipe({ ...selectedRecipe, ...recipeData } as Recipe);
    } else {
      const newRecipe = await addRecipe(recipeData);
      setSelectedRecipe(newRecipe);
    }
    setShowCreateModal(false);
    setEditMode(false);
    resetForm();
  };

  // Duplicate recipe
  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const duplicate = await addRecipe({
      ...recipe,
      name: `${recipe.name} (Copy)`,
      ingredients: recipe.ingredients.map(i => ({ ...i, id: generateId('ing') })),
    });
    setSelectedRecipe(duplicate);
  };

  // Delete recipe
  const handleDeleteRecipe = async (id: string) => {
    if (confirm('Delete this recipe?')) {
      await deleteRecipe(id);
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
    }
  };

  // Handle inventory selection
  const handleInventorySelect = (itemId: string) => {
    const item = getInventoryItem(itemId);
    if (item) {
      setNewIngredient(prev => ({ ...prev, inventoryItemId: itemId, name: item.name, unit: item.unit }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Recipe Builder</h2>
          <p className="text-zinc-400 text-sm">Create and manage recipes with automatic cost calculation</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditMode(false); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <Icons.Plus />
          New Recipe
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        {activeRecipeCategories.map(cat => (
          <div key={cat.code} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span>{cat.icon}</span> {cat.name.split(' ')[0]}
            </p>
            <p className="text-2xl font-bold text-white">{stats.byCategory[cat.code] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-64 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Icons.Search /></div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as RecipeCategory | 'all')}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Categories</option>
          {activeRecipeCategories.map(cat => (
            <option key={cat.code} value={cat.code}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Recipe List */}
        <div className="flex-1">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRecipes.map(recipe => {
              const config = getCategoryConfig(recipe.category);
              const cost = getRecipeCost(recipe);
              return (
                <div
                  key={recipe.id}
                  onClick={() => { setSelectedRecipe(recipe); setScaleFactor(1); }}
                  className={`bg-zinc-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-zinc-600 ${
                    selectedRecipe?.id === recipe.id ? 'border-emerald-600' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className="font-semibold text-white">{recipe.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${config.color}`}>{config.label}</span>
                      </div>
                    </div>
                  </div>
                  {recipe.description && (
                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{recipe.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-zinc-800/50 rounded p-2">
                      <p className="text-xs text-zinc-500">Yield</p>
                      <p className="text-sm font-medium text-white">{recipe.yield.amount}{recipe.yield.unit}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded p-2">
                      <p className="text-xs text-zinc-500">Items</p>
                      <p className="text-sm font-medium text-white">{recipe.ingredients.length}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded p-2">
                      <p className="text-xs text-zinc-500">Cost</p>
                      <p className="text-sm font-medium text-emerald-400">${cost.toFixed(2)}</p>
                    </div>
                  </div>
                  {(recipe.prepTime || recipe.sterilizationTime) && (
                    <div className="flex items-center gap-3 text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                      {recipe.prepTime && <span className="flex items-center gap-1"><Icons.Clock />{recipe.prepTime}min prep</span>}
                      {recipe.sterilizationTime && <span>🔥 {recipe.sterilizationTime}min @ {recipe.sterilizationPsi}PSI</span>}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredRecipes.length === 0 && (
              <div className="col-span-full text-center py-12 text-zinc-500">
                No recipes found. Create your first recipe!
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedRecipe && (
          <div className="w-96 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 h-fit sticky top-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCategoryConfig(selectedRecipe.category).icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRecipe.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${getCategoryConfig(selectedRecipe.category).color}`}>
                    {getCategoryConfig(selectedRecipe.category).label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="text-zinc-400 hover:text-white"><Icons.X /></button>
            </div>

            {selectedRecipe.description && (
              <p className="text-sm text-zinc-400 mb-4">{selectedRecipe.description}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Yield</p>
                <p className="text-lg font-bold text-white">
                  {scaledRecipe?.yield.amount || selectedRecipe.yield.amount}
                  <span className="text-sm text-zinc-400">{selectedRecipe.yield.unit}</span>
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Time</p>
                <p className="text-lg font-bold text-white">
                  {(selectedRecipe.prepTime || 0) + (selectedRecipe.sterilizationTime || 0)}
                  <span className="text-sm text-zinc-400">min</span>
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Cost</p>
                <p className="text-lg font-bold text-emerald-400">${(getRecipeCost(selectedRecipe) * scaleFactor).toFixed(2)}</p>
              </div>
            </div>

            {/* Scale Slider */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-500">Scale</span>
                <span className="text-white font-medium">{scaleFactor}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={scaleFactor}
                onChange={e => setScaleFactor(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Ingredients */}
            <div className="mb-4">
              <p className="text-sm font-medium text-white mb-2">Ingredients</p>
              <div className="space-y-2">
                {(scaledRecipe || selectedRecipe).ingredients.map(ing => (
                  <div key={ing.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-white">{ing.name}</span>
                    <span className="text-emerald-400 font-medium">{ing.quantity.toFixed(ing.quantity < 10 ? 1 : 0)} {ing.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {selectedRecipe.instructions.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Instructions</p>
                <ol className="space-y-2">
                  {selectedRecipe.instructions.map((inst, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-medium">{i + 1}</span>
                      <span className="text-zinc-300">{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Tips */}
            {selectedRecipe.tips && selectedRecipe.tips.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Tips</p>
                <ul className="space-y-1">
                  {selectedRecipe.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-400"><span className="text-amber-400">💡</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-white mb-2">Notes</p>
                <p className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3">{selectedRecipe.notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
              <button onClick={() => loadRecipeForEdit(selectedRecipe)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium">
                <Icons.Edit />Edit
              </button>
              <button onClick={() => handleDuplicateRecipe(selectedRecipe)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium">
                <Icons.Copy />Duplicate
              </button>
              <button onClick={() => handleDeleteRecipe(selectedRecipe.id)} className="p-2 bg-red-950/50 hover:bg-red-950 text-red-400 rounded-lg"><Icons.Trash /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">{editMode ? 'Edit Recipe' : 'New Recipe'}</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-zinc-400 hover:text-white"><Icons.X /></button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-2">Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" placeholder="e.g., Standard MEA" />
                </div>
                <StandardDropdown
                  label="Category"
                  value={formData.category}
                  onChange={(val) => setFormData(prev => ({ ...prev, category: val as RecipeCategory }))}
                  options={activeRecipeCategories.map(cat => ({
                    id: cat.code,
                    name: `${cat.icon} ${cat.name}`,
                  }))}
                  placeholder="Select category..."
                  entityType="recipeCategory"
                  fieldName="category"
                />
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Yield</label>
                  <div className="flex gap-2">
                    <input type="number" value={formData.yield.amount} onChange={e => setFormData(prev => ({ ...prev, yield: { ...prev.yield, amount: parseFloat(e.target.value) || 0 } }))} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                    <select value={formData.yield.unit} onChange={e => setFormData(prev => ({ ...prev, yield: { ...prev.yield, unit: e.target.value } }))} className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white">
                      <option value="ml">ml</option><option value="L">L</option><option value="g">g</option><option value="kg">kg</option><option value="plates">plates</option><option value="jars">jars</option><option value="quarts">quarts</option>
                    </select>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-2">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Prep (min)</label>
                  <input type="number" value={formData.prepTime} onChange={e => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Sterilize (min)</label>
                  <input type="number" value={formData.sterilizationTime} onChange={e => setFormData(prev => ({ ...prev, sterilizationTime: parseInt(e.target.value) || 0 }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">PSI</label>
                  <input type="number" value={formData.sterilizationPsi} onChange={e => setFormData(prev => ({ ...prev, sterilizationPsi: parseInt(e.target.value) || 15 }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Ingredients *</label>
                {formData.ingredients.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.ingredients.map(ing => (
                      <div key={ing.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
                        <span className="flex-1 text-white">{ing.name}</span>
                        <span className="text-emerald-400">{ing.quantity} {ing.unit}</span>
                        <button onClick={() => handleRemoveIngredient(ing.id)} className="text-red-400 hover:text-red-300"><Icons.X /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-zinc-800/30 rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">From Inventory</label>
                      <select value={newIngredient.inventoryItemId} onChange={e => handleInventorySelect(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white">
                        <option value="">Manual entry...</option>
                        {activeInventoryItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Name</label>
                      <input type="text" value={newIngredient.name} onChange={e => setNewIngredient(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white" placeholder="Ingredient name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Quantity</label>
                      <input type="number" value={newIngredient.quantity || ''} onChange={e => setNewIngredient(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Unit</label>
                      <select value={newIngredient.unit} onChange={e => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white">
                        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option><option value="tsp">tsp</option><option value="tbsp">tbsp</option><option value="cup">cup</option><option value="lb">lb</option><option value="brick">brick</option><option value="quart">quart</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleAddIngredient} disabled={!newIngredient.name || !newIngredient.quantity} className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded text-sm font-medium">Add</button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Instructions</label>
                <div className="space-y-2">
                  {formData.instructions.map((inst, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-zinc-500 text-sm">{i + 1}.</span>
                      <input type="text" value={inst} onChange={e => handleUpdateInstruction(i, e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white" placeholder={`Step ${i + 1}...`} />
                      <button onClick={() => handleRemoveInstruction(i)} className="text-zinc-500 hover:text-red-400"><Icons.X /></button>
                    </div>
                  ))}
                  <button onClick={handleAddInstruction} className="text-sm text-emerald-400 hover:text-emerald-300">+ Add step</button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium">Cancel</button>
              <button onClick={handleSaveRecipe} disabled={!formData.name || formData.ingredients.length === 0} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium">
                {editMode ? 'Save Changes' : 'Create Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeBuilder;
