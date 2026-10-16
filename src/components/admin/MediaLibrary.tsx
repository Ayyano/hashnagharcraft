import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { MediaItem } from '../../types.ts';

interface MediaLibraryProps {
  token: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ token }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(20);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setUploadProgress(60);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload files.');
      }

      setUploadProgress(100);
      setFeedback({ type: 'success', message: `Successfully stored ${data.files.length} image(s) in persistent storage.` });
      await fetchMedia();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Upload error.' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete media');
      }

      setFeedback({ type: 'success', message: 'Image deleted safely from media library.' });
      setDeleteConfirmId(null);
      await fetchMedia();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete error' });
      setDeleteConfirmId(null);
    }
  };

  const filteredMedia = media.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.originalName.toLowerCase().includes(q) || m.alt.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Central Media Library
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Manage high-resolution product photography, hero backdrops, and artisan workshop assets saved on persistent disk storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleDeviceUpload}
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? `Uploading (${uploadProgress}%)...` : 'Upload From Device'}</span>
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

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search images by filename or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 text-[#78716C]">
          <span>{filteredMedia.length} assets</span>
          <button
            onClick={fetchMedia}
            className="p-1.5 rounded-md border border-[#D6D3D1] hover:bg-neutral-50"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#78716C]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#92400E] mb-2" />
          <span>Loading media assets...</span>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-[#E7E2DA] space-y-2">
          <ImageIcon className="w-10 h-10 text-[#D6D3D1] mx-auto" />
          <p className="text-sm font-serif font-bold text-[#1C1917]">No images found</p>
          <p className="text-xs text-[#78716C]">
            Click "Upload From Device" above to add JPG, PNG, or WebP images to your server storage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E7E2DA] overflow-hidden shadow-2xs flex flex-col group hover:shadow-md transition-shadow"
            >
              {/* Image Preview Box */}
              <div className="aspect-4/3 relative bg-stone-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.alt || item.filename}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewMedia(item)}
                    className="p-1.5 bg-white text-[#1C1917] rounded-full hover:bg-neutral-100 shadow"
                    title="Enlarge"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="p-1.5 bg-white text-[#1C1917] rounded-full hover:bg-neutral-100 shadow"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meta details */}
              <div className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <p className="font-medium text-[#1C1917] truncate" title={item.originalName || item.filename}>
                    {item.originalName || item.filename}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] truncate font-mono">
                    {Math.round(item.size / 1024)} KB · {item.mimeType.split('/')[1]?.toUpperCase()}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F5F2EB] flex items-center justify-between text-[11px]">
                  <span className="text-[#78716C] font-mono truncate max-w-[130px]">
                    {item.url}
                  </span>
                  <button
                    onClick={() => handleCopyUrl(item.url, item.id)}
                    className="text-[#92400E] hover:underline font-medium"
                  >
                    {copiedId === item.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                Delete Media File?
              </h3>
              <p className="text-xs text-[#57534E] mt-1">
                The image will be removed from disk storage. The system will verify it is not actively referenced by published products or hero banners.
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
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-2xl w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DA]">
              <span className="text-xs font-semibold text-[#1C1917] truncate max-w-md">
                {previewMedia.originalName}
              </span>
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-hidden rounded-lg bg-stone-100 flex items-center justify-center">
              <img
                src={previewMedia.url}
                alt={previewMedia.alt}
                className="max-h-[60vh] object-contain"
              />
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded border border-[#E7E2DA] text-xs flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#57534E] truncate max-w-md">
                {previewMedia.url}
              </span>
              <button
                onClick={() => handleCopyUrl(previewMedia.url, previewMedia.id)}
                className="px-3 py-1 bg-[#92400E] text-white rounded text-xs font-medium hover:bg-[#78350F]"
              >
                {copiedId === previewMedia.id ? 'Copied!' : 'Copy Relative URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
