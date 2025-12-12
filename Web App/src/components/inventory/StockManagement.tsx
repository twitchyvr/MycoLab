// ============================================================================
// STOCK MANAGEMENT - Inventory Lots and Purchase Orders
// Track individual stock units with quantities, purchases, and usage
// ============================================================================

import React, { useState, useMemo } from 'react';
import { useData } from '../../store';
import type { InventoryLot, PurchaseOrder, PurchaseOrderItem, LotStatus, OrderStatus, PaymentStatus } from '../../store/types';
import { SelectWithAdd } from '../common/SelectWithAdd';

// Icons
const Icons = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Truck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  Camera: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg>,
  Link: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
};

// Status configurations
const lotStatusConfig: Record<LotStatus, { label: string; color: string }> = {
  available: { label: 'Available', color: 'text-emerald-400 bg-emerald-950/50' },
  low: { label: 'Low', color: 'text-amber-400 bg-amber-950/50' },
  empty: { label: 'Empty', color: 'text-zinc-400 bg-zinc-800' },
  expired: { label: 'Expired', color: 'text-red-400 bg-red-950/50' },
  reserved: { label: 'Reserved', color: 'text-blue-400 bg-blue-950/50' },
};

const orderStatusConfig: Record<OrderStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-zinc-400 bg-zinc-800' },
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-950/50' },
  ordered: { label: 'Ordered', color: 'text-blue-400 bg-blue-950/50' },
  shipped: { label: 'Shipped', color: 'text-purple-400 bg-purple-950/50' },
  partial: { label: 'Partial', color: 'text-orange-400 bg-orange-950/50' },
  received: { label: 'Received', color: 'text-emerald-400 bg-emerald-950/50' },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-950/50' },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  unpaid: { label: 'Unpaid', color: 'text-red-400 bg-red-950/50' },
  paid: { label: 'Paid', color: 'text-emerald-400 bg-emerald-950/50' },
  partial: { label: 'Partial', color: 'text-amber-400 bg-amber-950/50' },
  refunded: { label: 'Refunded', color: 'text-purple-400 bg-purple-950/50' },
};

// Photo upload component
const PhotoUpload: React.FC<{
  images: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
}> = ({ images, onImagesChange, label = 'Photos' }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert files to data URLs for now (in production, upload to Supabase Storage)
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImagesChange([...images, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((img, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-800">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-0 right-0 p-1 bg-red-500/80 text-white rounded-bl"
            >
              <Icons.X />
            </button>
          </div>
        ))}
        <label className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-600 transition-colors">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Icons.Camera />
        </label>
      </div>
    </div>
  );
};

export const StockManagement: React.FC = () => {
  const {
    state,
    activeInventoryItems,
    activeInventoryLots,
    activePurchaseOrders,
    activeSuppliers,
    activeLocations,
    getInventoryItem,
    getSupplier,
    getLocation,
    addInventoryLot,
    updateInventoryLot,
    deleteInventoryLot,
    adjustLotQuantity,
    getLotsForItem,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    receiveOrder,
    generateOrderNumber,
    addInventoryItem,
    addSupplier,
    generateId,
  } = useData();

  // UI State
  const [activeTab, setActiveTab] = useState<'lots' | 'orders'>('lots');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterItem, setFilterItem] = useState<string>('all');

  // Modal states
  const [showAddLotModal, setShowAddLotModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<InventoryLot | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Form states
  const [newLot, setNewLot] = useState({
    inventoryItemId: '',
    quantity: 0,
    unit: 'g',
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: 0,
    locationId: '',
    expirationDate: '',
    lotNumber: '',
    images: [] as string[],
    notes: '',
  });

  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    items: [] as PurchaseOrderItem[],
    shipping: 0,
    tax: 0,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    trackingNumber: '',
    trackingUrl: '',
    orderUrl: '',
    receiptImage: '',
    images: [] as string[],
    notes: '',
    paymentStatus: 'unpaid' as PaymentStatus,
  });

  // Filtered lots
  const filteredLots = useMemo(() => {
    let result = activeInventoryLots;

    if (filterStatus !== 'all') {
      result = result.filter(l => l.status === filterStatus);
    }
    if (filterItem !== 'all') {
      result = result.filter(l => l.inventoryItemId === filterItem);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        const item = getInventoryItem(l.inventoryItemId);
        return item?.name.toLowerCase().includes(q) || l.lotNumber?.toLowerCase().includes(q);
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeInventoryLots, filterStatus, filterItem, searchQuery, getInventoryItem]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = activePurchaseOrders;

    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => {
        const supplier = getSupplier(o.supplierId);
        return o.orderNumber.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q);
      });
    }

    return result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [activePurchaseOrders, filterStatus, searchQuery, getSupplier]);

  // Stats
  const stats = useMemo(() => {
    const totalLots = activeInventoryLots.length;
    const lowStock = activeInventoryLots.filter(l => l.status === 'low').length;
    const expired = activeInventoryLots.filter(l => l.status === 'expired').length;
    const pendingOrders = activePurchaseOrders.filter(o => !['received', 'cancelled'].includes(o.status)).length;
    const totalValue = activeInventoryLots.reduce((sum, l) => sum + (l.purchaseCost || 0), 0);

    return { totalLots, lowStock, expired, pendingOrders, totalValue };
  }, [activeInventoryLots, activePurchaseOrders]);

  // Add lot handler
  const handleAddLot = async () => {
    if (!newLot.inventoryItemId || !newLot.quantity) return;

    await addInventoryLot({
      inventoryItemId: newLot.inventoryItemId,
      quantity: newLot.quantity,
      originalQuantity: newLot.quantity,
      unit: newLot.unit,
      status: 'available',
      supplierId: newLot.supplierId || undefined,
      purchaseDate: newLot.purchaseDate ? new Date(newLot.purchaseDate) : undefined,
      purchaseCost: newLot.purchaseCost || undefined,
      locationId: newLot.locationId || undefined,
      expirationDate: newLot.expirationDate ? new Date(newLot.expirationDate) : undefined,
      lotNumber: newLot.lotNumber || undefined,
      images: newLot.images.length > 0 ? newLot.images : undefined,
      notes: newLot.notes || undefined,
      isActive: true,
    });

    setShowAddLotModal(false);
    setNewLot({
      inventoryItemId: '',
      quantity: 0,
      unit: 'g',
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      locationId: '',
      expirationDate: '',
      lotNumber: '',
      images: [],
      notes: '',
    });
  };

  // Add order handler
  const handleAddOrder = async () => {
    if (!newOrder.supplierId || newOrder.items.length === 0) return;

    const subtotal = newOrder.items.reduce((sum, item) => sum + item.totalCost, 0);
    const total = subtotal + newOrder.shipping + newOrder.tax;

    await addPurchaseOrder({
      orderNumber: generateOrderNumber(),
      supplierId: newOrder.supplierId,
      status: 'draft',
      paymentStatus: newOrder.paymentStatus,
      items: newOrder.items,
      subtotal,
      shipping: newOrder.shipping,
      tax: newOrder.tax,
      total,
      orderDate: new Date(newOrder.orderDate),
      expectedDate: newOrder.expectedDate ? new Date(newOrder.expectedDate) : undefined,
      trackingNumber: newOrder.trackingNumber || undefined,
      trackingUrl: newOrder.trackingUrl || undefined,
      orderUrl: newOrder.orderUrl || undefined,
      receiptImage: newOrder.receiptImage || undefined,
      images: newOrder.images.length > 0 ? newOrder.images : undefined,
      notes: newOrder.notes || undefined,
      isActive: true,
    });

    setShowAddOrderModal(false);
    setNewOrder({
      supplierId: '',
      items: [],
      shipping: 0,
      tax: 0,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      trackingNumber: '',
      trackingUrl: '',
      orderUrl: '',
      receiptImage: '',
      images: [],
      notes: '',
      paymentStatus: 'unpaid',
    });
  };

  // Add order item
  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, {
        id: generateId('oi'),
        inventoryItemId: '',
        name: '',
        quantity: 1,
        unit: 'ea',
        unitCost: 0,
        totalCost: 0,
        quantityReceived: 0,
      }],
    }));
  };

  // Update order item
  const updateOrderItem = (index: number, updates: Partial<PurchaseOrderItem>) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, ...updates };
        updated.totalCost = updated.quantity * updated.unitCost;
        return updated;
      }),
    }));
  };

  // Remove order item
  const removeOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Handle add supplier inline
  const handleAddSupplier = async (name: string) => {
    const newSup = await addSupplier({ name, isActive: true });
    return newSup.id;
  };

  // Handle add inventory item inline
  const handleAddInventoryItem = (name: string) => {
    const newItem = addInventoryItem({
      name,
      categoryId: '',
      quantity: 0,
      unit: 'ea',
      unitCost: 0,
      reorderPoint: 0,
      reorderQty: 0,
      isActive: true,
    });
    return newItem.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lab Stock</h2>
          <p className="text-zinc-400 text-sm">Track your inventory lots and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddLotModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
          >
            <Icons.Package />
            Add Stock
          </button>
          <button
            onClick={() => setShowAddOrderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Icons.Truck />
            New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total Lots</p>
          <p className="text-2xl font-bold text-white">{stats.totalLots}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Low Stock</p>
          <p className="text-2xl font-bold text-amber-400">{stats.lowStock}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Expired</p>
          <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Pending Orders</p>
          <p className="text-2xl font-bold text-blue-400">{stats.pendingOrders}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500">Total Value</p>
          <p className="text-2xl font-bold text-emerald-400">${stats.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('lots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'lots' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Icons.Package />
          Stock Lots
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'orders' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Icons.Truck />
          Orders
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-64 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icons.Search />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'lots' ? 'Search lots...' : 'Search orders...'}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeTab === 'lots' ? (
          <>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Statuses</option>
              {Object.entries(lotStatusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filterItem}
              onChange={e => setFilterItem(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Items</option>
              {activeInventoryItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </>
        ) : (
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All Statuses</option>
            {Object.entries(orderStatusConfig).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'lots' ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Item</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Quantity</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Supplier</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Location</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Expiration</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Cost</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map(lot => {
                const item = getInventoryItem(lot.inventoryItemId);
                const supplier = lot.supplierId ? getSupplier(lot.supplierId) : null;
                const location = lot.locationId ? getLocation(lot.locationId) : null;
                const statusConfig = lotStatusConfig[lot.status];
                const percentRemaining = Math.round((lot.quantity / lot.originalQuantity) * 100);

                return (
                  <tr key={lot.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-3">
                      <p className="font-medium text-white">{item?.name || 'Unknown'}</p>
                      {lot.lotNumber && <p className="text-xs text-zinc-500">Lot: {lot.lotNumber}</p>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{lot.quantity} {lot.unit}</span>
                        <span className="text-xs text-zinc-500">/ {lot.originalQuantity}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-zinc-700 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            percentRemaining > 50 ? 'bg-emerald-500' :
                            percentRemaining > 20 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentRemaining}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">{supplier?.name || '-'}</td>
                    <td className="p-3 text-sm text-zinc-400">{location?.name || '-'}</td>
                    <td className="p-3 text-sm text-zinc-400">
                      {lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-sm text-white">
                      {lot.purchaseCost ? `$${lot.purchaseCost.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedLot(lot)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                          title="Edit"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this stock lot?')) {
                              deleteInventoryLot(lot.id);
                            }
                          }}
                          className="p-1.5 bg-red-950/50 hover:bg-red-950 text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLots.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No stock lots found. Add your first stock!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Order #</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Supplier</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Payment</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Items</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Total</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Order Date</th>
                <th className="text-left p-3 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const supplier = getSupplier(order.supplierId);
                const statusConfig = orderStatusConfig[order.status];
                const paymentConfig = paymentStatusConfig[order.paymentStatus];

                return (
                  <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="p-3 font-medium text-white">{order.orderNumber}</td>
                    <td className="p-3 text-sm text-zinc-300">{supplier?.name || 'Unknown'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentConfig.color}`}>
                        {paymentConfig.label}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-zinc-400">{order.items.length} items</td>
                    <td className="p-3 text-sm font-medium text-emerald-400">${order.total.toFixed(2)}</td>
                    <td className="p-3 text-sm text-zinc-400">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {order.status !== 'received' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (confirm('Mark this order as received?')) {
                                receiveOrder(order.id);
                              }
                            }}
                            className="p-1.5 bg-emerald-950/50 hover:bg-emerald-950 text-emerald-400 rounded transition-colors"
                            title="Mark Received"
                          >
                            <Icons.Check />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                          title="View/Edit"
                        >
                          <Icons.Edit />
                        </button>
                        {order.orderUrl && (
                          <a
                            href={order.orderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-blue-950/50 hover:bg-blue-950 text-blue-400 rounded transition-colors"
                            title="View Order"
                          >
                            <Icons.Link />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No orders found. Create your first order!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lot Modal */}
      {showAddLotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Add Stock</h3>
              <button onClick={() => setShowAddLotModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <SelectWithAdd
                label="Item"
                required
                value={newLot.inventoryItemId}
                onChange={value => setNewLot(prev => ({ ...prev, inventoryItemId: value }))}
                options={activeInventoryItems}
                placeholder="Select item..."
                addLabel="Add New Item"
                onAdd={async (name) => {
                  const id = handleAddInventoryItem(name);
                  setNewLot(prev => ({ ...prev, inventoryItemId: id }));
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={newLot.quantity || ''}
                    onChange={e => setNewLot(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Unit</label>
                  <select
                    value={newLot.unit}
                    onChange={e => setNewLot(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lb">Pounds (lb)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="L">Liters (L)</option>
                    <option value="ea">Each (ea)</option>
                  </select>
                </div>
              </div>

              <SelectWithAdd
                label="Supplier"
                value={newLot.supplierId}
                onChange={value => setNewLot(prev => ({ ...prev, supplierId: value }))}
                options={activeSuppliers}
                placeholder="Select supplier..."
                addLabel="Add New Supplier"
                onAdd={async (name) => {
                  const id = await handleAddSupplier(name);
                  setNewLot(prev => ({ ...prev, supplierId: id }));
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={newLot.purchaseDate}
                    onChange={e => setNewLot(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Cost ($)</label>
                  <input
                    type="number"
                    value={newLot.purchaseCost || ''}
                    onChange={e => setNewLot(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    step="0.01"
                  />
                </div>
              </div>

              <SelectWithAdd
                label="Location"
                value={newLot.locationId}
                onChange={value => setNewLot(prev => ({ ...prev, locationId: value }))}
                options={activeLocations}
                placeholder="Select location..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Expiration Date</label>
                  <input
                    type="date"
                    value={newLot.expirationDate}
                    onChange={e => setNewLot(prev => ({ ...prev, expirationDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Lot Number</label>
                  <input
                    type="text"
                    value={newLot.lotNumber}
                    onChange={e => setNewLot(prev => ({ ...prev, lotNumber: e.target.value }))}
                    placeholder="Manufacturer lot #"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <PhotoUpload
                images={newLot.images}
                onImagesChange={images => setNewLot(prev => ({ ...prev, images }))}
              />

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newLot.notes}
                  onChange={e => setNewLot(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddLotModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLot}
                disabled={!newLot.inventoryItemId || !newLot.quantity}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">New Purchase Order</h3>
              <button onClick={() => setShowAddOrderModal(false)} className="text-zinc-400 hover:text-white">
                <Icons.X />
              </button>
            </div>

            <div className="space-y-4">
              <SelectWithAdd
                label="Supplier"
                required
                value={newOrder.supplierId}
                onChange={value => setNewOrder(prev => ({ ...prev, supplierId: value }))}
                options={activeSuppliers}
                placeholder="Select supplier..."
                addLabel="Add New Supplier"
                onAdd={async (name) => {
                  const id = await handleAddSupplier(name);
                  setNewOrder(prev => ({ ...prev, supplierId: id }));
                }}
              />

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-zinc-400">Items *</label>
                  <button
                    onClick={addOrderItem}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Icons.Plus /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {newOrder.items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 p-3 bg-zinc-800/50 rounded-lg">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateOrderItem(index, { name: e.target.value })}
                        placeholder="Item name"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={e => updateOrderItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                        placeholder="Qty"
                        className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="number"
                        value={item.unitCost || ''}
                        onChange={e => updateOrderItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                        placeholder="$ each"
                        className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
                        step="0.01"
                      />
                      <span className="w-20 text-sm text-zinc-400 flex items-center justify-end">
                        ${(item.totalCost || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeOrderItem(index)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  ))}
                  {newOrder.items.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">No items added yet</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Shipping ($)</label>
                  <input
                    type="number"
                    value={newOrder.shipping || ''}
                    onChange={e => setNewOrder(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tax ($)</label>
                  <input
                    type="number"
                    value={newOrder.tax || ''}
                    onChange={e => setNewOrder(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Payment Status</label>
                  <select
                    value={newOrder.paymentStatus}
                    onChange={e => setNewOrder(prev => ({ ...prev, paymentStatus: e.target.value as PaymentStatus }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    {Object.entries(paymentStatusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total */}
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500">Order Total</p>
                <p className="text-2xl font-bold text-emerald-400">
                  ${(newOrder.items.reduce((sum, item) => sum + item.totalCost, 0) + newOrder.shipping + newOrder.tax).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Order Date</label>
                  <input
                    type="date"
                    value={newOrder.orderDate}
                    onChange={e => setNewOrder(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Expected Delivery</label>
                  <input
                    type="date"
                    value={newOrder.expectedDate}
                    onChange={e => setNewOrder(prev => ({ ...prev, expectedDate: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Order URL</label>
                <input
                  type="url"
                  value={newOrder.orderUrl}
                  onChange={e => setNewOrder(prev => ({ ...prev, orderUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={newOrder.trackingNumber}
                    onChange={e => setNewOrder(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tracking URL</label>
                  <input
                    type="url"
                    value={newOrder.trackingUrl}
                    onChange={e => setNewOrder(prev => ({ ...prev, trackingUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <PhotoUpload
                images={newOrder.images}
                onImagesChange={images => setNewOrder(prev => ({ ...prev, images }))}
                label="Receipt / Invoice Photos"
              />

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={e => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddOrderModal(false)}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrder}
                disabled={!newOrder.supplierId || newOrder.items.length === 0}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;
