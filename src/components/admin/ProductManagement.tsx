import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Star,
  Sparkles,
  Flame,
  Tag,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { Product, Category, ProductImage, MediaItem } from '../../types.ts';
import { useStore } from '../../context/StoreContext.tsx';

interface ProductManagementProps {
  token: string;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ token }) => {
  const { refreshStoreData } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    slogan: '',
    shortDescription: '',
    fullDescription: '',
    category: 'Peshawari Chappals',
    subcategory: '',
    price: 5000,
    originalPrice: 5000,
    sku: '',
    stock: 10,
    lowStockThreshold: 5,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['Cognac Brown', 'Jet Black'],
    materials: 'Full-Grain Buffalo Leather, Recycled Tire Sole',
    tags: ['chappal', 'handmade'],
    status: 'published',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isOnSale: false,
    seoTitle: '',
    seoDescription: '',
    images: [],
  });

  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const fetchProductsAndData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, mediaRes] = await Promise.all([
        fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/media', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        setMediaList(mediaData.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndData();
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (stockFilter === 'in_stock' && p.stock <= p.lowStockThreshold) return false;
    if (stockFilter === 'low_stock' && (p.stock <= 0 || p.stock > p.lowStockThreshold)) return false;
    if (stockFilter === 'out_of_stock' && p.stock > 0) return false;
    return true;
  });

  const openCreateModal = () => {
    const defaultCat = categories[0]?.name || 'Peshawari Chappals';
    setFormData({
      title: '',
      slogan: '',
      shortDescription: '',
      fullDescription: '',
      category: defaultCat,
      subcategory: 'Traditional',
      price: 6500,
      originalPrice: 7500,
      sku: 'HC-' + Math.floor(1000 + Math.random() * 9000),
      stock: 15,
      lowStockThreshold: 4,
      sizes: ['7', '8', '9', '10', '11'],
      colors: ['Cognac Brown', 'Jet Black'],
      materials: 'Full-Grain Leather, Bonded Thread, Tire Sole',
      tags: ['chappal', 'charsadda'],
      status: 'published',
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isOnSale: true,
      seoTitle: '',
      seoDescription: '',
      images: [
        {
          url: '/uploads/product_charsadda_chappal_1792123450304.jpg',
          alt: 'Product photo',
          isPrimary: true,
        },
      ],
    });
    setSizesInput('7, 8, 9, 10, 11');
    setColorsInput('Cognac Brown, Jet Black');
    setTagsInput('chappal, charsadda');
    setIsCreatingNew(true);
    setEditingProduct(null);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsCreatingNew(false);
    setFormData({ ...p });
    setSizesInput(p.sizes.join(', '));
    setColorsInput(p.colors.join(', '));
    setTagsInput(p.tags.join(', '));
  };

  // Image Upload handler for "Upload From Device"
  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(20);
    const uploadFormData = new FormData();
    for (let i = 0; i < files.length; i++) {
      uploadFormData.append('images', files[i]);
    }

    try {
      setUploadProgress(60);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);
      // Append uploaded images to formData
      const newImages: ProductImage[] = data.files.map((f: MediaItem, i: number) => ({
        url: f.url,
        alt: f.alt || formData.title || 'Product Image',
        isPrimary: (formData.images?.length || 0) === 0 && i === 0,
      }));

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
      }));

      // Refresh media library
      fetchProductsAndData();
      setFeedback({ type: 'success', message: `Uploaded ${data.files.length} image(s) to permanent storage.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error uploading file.' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add custom URL image
  const handleAddCustomImageUrl = () => {
    if (!customImageUrl.trim()) return;
    const newImg: ProductImage = {
      url: customImageUrl.trim(),
      alt: formData.title || 'Product Image',
      isPrimary: (formData.images?.length || 0) === 0,
    };
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImg],
    }));
    setCustomImageUrl('');
  };

  // Remove image from form
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const updated = [...(prev.images || [])];
      const removed = updated.splice(index, 1)[0];
      if (removed?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return { ...prev, images: updated };
    });
  };

  // Set primary image
  const handleSetPrimaryImage = (index: number) => {
    setFormData((prev) => {
      const updated = (prev.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      return { ...prev, images: updated };
    });
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.price === undefined) {
      alert('Product title and price are required.');
      return;
    }

    const payload = {
      ...formData,
      sizes: sizesInput.split(',').map((s) => s.trim()).filter(Boolean),
      colors: colorsInput.split(',').map((c) => c.trim()).filter(Boolean),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      isOnSale: (formData.originalPrice || 0) > (formData.price || 0),
    };

    try {
      const url = isCreatingNew ? '/api/admin/products' : `/api/admin/products/${editingProduct?.id}`;
      const method = isCreatingNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setFeedback({
        type: 'success',
        message: isCreatingNew ? `Product "${data.product.title}" created successfully!` : `Product "${data.product.title}" updated.`,
      });
      setIsCreatingNew(false);
      setEditingProduct(null);
      await fetchProductsAndData();
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Save error' });
    }
  };

  // Duplicate Product
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Product duplicated as draft copy.' });
        await fetchProductsAndData();
        await refreshStoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Product deleted from database.' });
        setDeleteConfirmId(null);
        await fetchProductsAndData();
        await refreshStoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (p: Product) => {
    const newStatus = p.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchProductsAndData();
      await refreshStoreData();
    } catch (e) {
      console.error(e);
    }
  };

  // Auto calculate discount percentage
  const discountPercent =
    formData.originalPrice && formData.price && formData.originalPrice > formData.price
      ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Add Button */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Product Catalog Management
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Full control over products, sizes, prices, inventory levels, and device image uploads. Changes sync directly to the live customer storefront.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Craft Item</span>
        </button>
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
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Filter Strip */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Stock */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917] focus:outline-none"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ Threshold)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button
            onClick={fetchProductsAndData}
            className="p-1.5 rounded-md border border-[#D6D3D1] hover:bg-neutral-50 text-[#78716C]"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Item & Images</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Price (PKR)</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3">Badges</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#78716C]">
                    No products matched the active filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImage = p.images.find((i) => i.isPrimary)?.url || p.images[0]?.url || '';
                  const hasDiscount = p.originalPrice > p.price;
                  const discountVal = hasDiscount
                    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={primaryImage}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded-md border border-[#E7E2DA] bg-stone-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-serif font-bold text-sm text-[#1C1917] truncate max-w-xs">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-[#78716C] truncate max-w-xs">{p.slogan}</p>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#57534E]">{p.sku}</td>

                      <td className="py-3 px-3">
                        <span className="text-[#1C1917] font-medium">{p.category}</span>
                        {p.subcategory && (
                          <span className="text-[10px] text-[#78716C] block">{p.subcategory}</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-serif font-bold text-[#1C1917] tabular-nums">
                          PKR {p.price.toLocaleString('en-PK')}
                        </div>
                        {hasDiscount && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="line-through text-[#A8A29E] tabular-nums">
                              {p.originalPrice.toLocaleString('en-PK')}
                            </span>
                            <span className="text-[#059669] font-semibold font-mono">
                              -{discountVal}%
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold tabular-nums font-mono px-2 py-0.5 rounded text-[11px] ${
                            p.stock <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : p.stock <= p.lowStockThreshold
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {p.isFeatured && (
                            <span className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                              Featured
                            </span>
                          )}
                          {p.isBestSeller && (
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                              Best Seller
                            </span>
                          )}
                          {p.isNewArrival && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                            p.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                        >
                          {p.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewProduct(p)}
                            className="p-1 text-[#78716C] hover:text-[#1C1917]"
                            title="Quick Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1 text-[#78716C] hover:text-[#92400E]"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(p.id)}
                            className="p-1 text-[#78716C] hover:text-[#1C1917]"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                Delete Product Permanently?
              </h3>
              <p className="text-xs text-[#57534E] mt-1">
                This will remove the product and all associated SKU details from the database and storefront.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL (With "Upload From Device") */}
      {(isCreatingNew || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2DA]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#92400E]" />
                <h2 className="font-serif font-bold text-lg text-[#1C1917]">
                  {isCreatingNew ? 'Create New Handcrafted Product' : `Edit: ${editingProduct?.title}`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingProduct(null);
                }}
                className="text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Authentic Charsadda Double-Sole Leather Chappal"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-serif font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Slogan / Sub-heading
                  </label>
                  <input
                    type="text"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="e.g. Hand-stitched full grain buffalo leather with lifetime tire sole"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Double Sole / Unstitched Fabric"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              {/* Pricing & Stock with Auto-Discount calculation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Selling Price (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Original Price (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    SKU Identifier
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono font-bold"
                  />
                </div>

                {/* Auto Calculated Discount Badge */}
                <div className="col-span-2 sm:col-span-4 flex items-center justify-between text-xs pt-1 border-t border-[#E7E2DA]">
                  <span className="text-[#78716C]">
                    Calculated Discount:
                  </span>
                  {discountPercent > 0 ? (
                    <span className="font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {discountPercent}% OFF (Active Sale)
                    </span>
                  ) : (
                    <span className="text-[#A8A29E]">Regular Price (No discount)</span>
                  )}
                </div>
              </div>

              {/* IMAGE MANAGEMENT WITH "UPLOAD FROM DEVICE" */}
              <div className="space-y-3 p-4 rounded-lg bg-white border border-[#E7E2DA]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-[#1C1917] tracking-wider">
                      Product Images & Gallery
                    </h3>
                    <p className="text-[11px] text-[#78716C]">
                      Upload images directly from your Windows computer, phone, or local device into server storage.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleDeviceUpload}
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                    />

                    {/* Button labeled Upload From Device as required */}
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? `Uploading (${uploadProgress}%)...` : 'Upload From Device'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(!showMediaPicker)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#92400E]" />
                      <span>Media Library</span>
                    </button>
                  </div>
                </div>

                {/* Media Library Picker Drawer */}
                {showMediaPicker && (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1C1917]">Select Existing Image</span>
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(false)}
                        className="text-xs text-[#78716C]"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {mediaList.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              images: [
                                ...(prev.images || []),
                                { url: m.url, alt: m.alt, isPrimary: (prev.images?.length || 0) === 0 },
                              ],
                            }));
                            setShowMediaPicker(false);
                          }}
                          className="cursor-pointer rounded border overflow-hidden aspect-4/3 relative hover:ring-2 hover:ring-[#92400E]"
                        >
                          <img src={m.url} alt={m.alt} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Image URL fallback */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Or enter permanent image URL /uploads/..."
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomImageUrl}
                    className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-white border border-[#D6D3D1] rounded-md hover:bg-neutral-50"
                  >
                    Add URL
                  </button>
                </div>

                {/* Thumbnails list */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-2">
                  {formData.images?.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-lg border overflow-hidden aspect-square group bg-stone-100 ${
                        img.isPrimary ? 'ring-2 ring-[#92400E] border-[#92400E]' : 'border-[#E7E2DA]'
                      }`}
                    >
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="self-end p-1 text-white bg-red-600 rounded-full hover:bg-red-700"
                          title="Delete image"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        {!img.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="w-full py-1 text-[10px] bg-white text-[#1C1917] rounded font-semibold"
                          >
                            Set Main
                          </button>
                        ) : (
                          <span className="w-full py-0.5 text-[9px] bg-[#92400E] text-white rounded text-center font-bold">
                            Main Image
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes, Colors, Materials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Sizes (comma separated)
                  </label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    placeholder="7, 8, 9, 10, 11, 12"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Colors (comma separated)
                  </label>
                  <input
                    type="text"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    placeholder="Cognac Brown, Dark Mustard, Jet Black"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="chappal, kaptaan, leather"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Craft Materials Spec
                  </label>
                  <input
                    type="text"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    placeholder="e.g. 100% Full-Grain Buffalo Leather, Durable Tire Sole"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Short Description (Card Summary)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Full Description (Detail Modal & Story)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              {/* Badges & Status */}
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="rounded text-[#92400E]"
                    />
                    <span>Featured</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="rounded text-[#92400E]"
                    />
                    <span>Best Seller</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                      className="rounded text-[#92400E]"
                    />
                    <span>New Arrival</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#1C1917]">Publish State:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white font-medium"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E2DA]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs text-[#57534E] hover:text-[#1C1917]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md shadow-xs transition-colors"
                >
                  {isCreatingNew ? 'Create & Save Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DA]">
              <span className="text-xs uppercase font-semibold text-[#92400E] tracking-wider">
                Product Preview
              </span>
              <button
                onClick={() => setPreviewProduct(null)}
                className="text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div className="aspect-4/3 rounded-lg overflow-hidden bg-stone-100">
                <img
                  src={previewProduct.images[0]?.url}
                  alt={previewProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                  {previewProduct.title}
                </h3>
                <span className="font-serif font-bold text-base text-[#92400E] tabular-nums">
                  PKR {previewProduct.price.toLocaleString('en-PK')}
                </span>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed">
                {previewProduct.fullDescription || previewProduct.shortDescription}
              </p>

              <div className="p-3 bg-[#FAF8F5] rounded border border-[#E7E2DA] text-xs space-y-1">
                <p>
                  <strong className="text-[#1C1917]">SKU:</strong> {previewProduct.sku} ·{' '}
                  <strong className="text-[#1C1917]">Stock:</strong> {previewProduct.stock} units
                </p>
                <p>
                  <strong className="text-[#1C1917]">Materials:</strong> {previewProduct.materials}
                </p>
                <p>
                  <strong className="text-[#1C1917]">Sizes:</strong> {previewProduct.sizes.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
