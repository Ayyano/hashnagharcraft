import React, { useState, useEffect } from 'react';
import {
  Layers,
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Minus,
} from 'lucide-react';
import { Category, Product } from '../../types.ts';
import { useStore } from '../../context/StoreContext.tsx';

interface CategoriesAndInventoryProps {
  token: string;
}

export const CategoriesAndInventory: React.FC<CategoriesAndInventoryProps> = ({ token }) => {
  const { refreshStoreData } = useStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'categories'>('inventory');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Category Modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Quick adjust inline state
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Stock adjustment
  const handleStockDelta = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      const res = await fetch(`/api/admin/inventory/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
        await refreshStoreData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveInlineStock = async (product: Product) => {
    const val = stockEdits[product.id];
    if (val === undefined || isNaN(val)) return;

    try {
      const res = await fetch(`/api/admin/inventory/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: Math.max(0, val) }),
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Stock for "${product.title}" updated to ${val}.` });
        setStockEdits((prev) => {
          const c = { ...prev };
          delete c[product.id];
          return c;
        });
        await fetchData();
        await refreshStoreData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Category save
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      if (isCreatingCat) {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to create');
        }
      } else if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Failed to update');
        }
      }

      setFeedback({ type: 'success', message: 'Category saved successfully.' });
      setIsCreatingCat(false);
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      await fetchData();
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Category error' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }
      setFeedback({ type: 'success', message: 'Category deleted.' });
      await fetchData();
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Categories & Inventory Management
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Monitor real-time product quantities, set low-stock warning thresholds, and organize storefront category taxonomy.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 border border-[#D6D3D1] rounded-lg">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'inventory'
                ? 'bg-[#92400E] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Inventory Stock Tracker
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-[#92400E] text-white shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Product Categories ({categories.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg text-xs flex items-center gap-2 shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* 1. INVENTORY TRACKER TAB */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
          <div className="p-4 bg-[#FAF8F5] border-b border-[#E7E2DA] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1C1917]">
              Current Inventory Levels ({products.length} catalog items)
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock (&gt; Threshold)
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Low Stock (≤ Threshold)
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Out of Stock (0 units)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit Price</th>
                  <th className="py-3 px-3">Threshold</th>
                  <th className="py-3 px-3">Stock Units</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Quick Adjust Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2DA]">
                {products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = !isOutOfStock && p.stock <= p.lowStockThreshold;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={p.images[0]?.url}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded-md border border-[#E7E2DA] shrink-0"
                        />
                        <div>
                          <p className="font-serif font-bold text-sm text-[#1C1917] truncate max-w-xs">{p.title}</p>
                          <p className="font-mono text-[10px] text-[#78716C]">SKU: {p.sku}</p>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#57534E]">{p.category}</td>

                      <td className="py-3 px-3 font-serif font-bold text-[#1C1917] tabular-nums">
                        PKR {p.price.toLocaleString('en-PK')}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#78716C]">
                        {p.lowStockThreshold} units
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-mono font-bold text-sm tabular-nums px-2.5 py-1 rounded ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {isOutOfStock ? (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Low Stock Warning
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Healthy Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStockDelta(p, -1)}
                            className="w-7 h-7 rounded border border-[#D6D3D1] bg-white hover:bg-neutral-100 text-[#1C1917] flex items-center justify-center font-bold"
                            title="Decrease Stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleStockDelta(p, 1)}
                            className="w-7 h-7 rounded border border-[#D6D3D1] bg-white hover:bg-neutral-100 text-[#1C1917] flex items-center justify-center font-bold"
                            title="Increase Stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          {/* Quick manual number entry */}
                          <input
                            type="number"
                            min={0}
                            placeholder={String(p.stock)}
                            value={stockEdits[p.id] !== undefined ? stockEdits[p.id] : ''}
                            onChange={(e) =>
                              setStockEdits({
                                ...stockEdits,
                                [p.id]: parseInt(e.target.value, 10),
                              })
                            }
                            className="w-16 px-1.5 py-1 text-xs rounded border border-[#D6D3D1] font-mono text-center"
                          />
                          {stockEdits[p.id] !== undefined && (
                            <button
                              onClick={() => handleSaveInlineStock(p)}
                              className="px-2 py-1 bg-[#92400E] text-white rounded text-[11px] font-semibold hover:bg-[#78350F]"
                            >
                              Save
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIsCreatingCat(true);
                setEditingCategory(null);
                setCatName('');
                setCatDesc('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-3">URL Slug</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Assigned Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2DA]">
                {categories.map((c) => {
                  const assignedCount = products.filter((p) => p.category === c.name).length;

                  return (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3 px-4 font-serif font-bold text-sm text-[#1C1917]">
                        {c.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#78716C] text-[11px]">
                        /{c.slug}
                      </td>
                      <td className="py-3 px-3 text-[#57534E] max-w-sm truncate">
                        {c.description || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[#1C1917] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7E2DA]">
                          {assignedCount} product(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setIsCreatingCat(false);
                              setCatName(c.name);
                              setCatDesc(c.description);
                            }}
                            className="p-1 text-[#78716C] hover:text-[#92400E]"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Edit/Create Modal */}
      {(isCreatingCat || editingCategory) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DA]">
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                {isCreatingCat ? 'Create Product Category' : `Edit Category: ${editingCategory?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingCat(false);
                  setEditingCategory(null);
                }}
                className="text-xs text-[#78716C]"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Peshawari Chappals"
                  className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Category Description
                </label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Describe this craft discipline..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCat(false);
                    setEditingCategory(null);
                  }}
                  className="px-3 py-1.5 text-xs text-[#57534E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
