import React, { useState, useEffect } from 'react';
import {
  Palette,
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react';
import { WebsiteContent, HomepageSection, MediaItem } from '../../types.ts';
import { useStore } from '../../context/StoreContext.tsx';

interface WebsiteEditorProps {
  token: string;
  onBackToStore: () => void;
}

export const WebsiteEditor: React.FC<WebsiteEditorProps> = ({ token, onBackToStore }) => {
  const { refreshStoreData } = useStore();
  const [content, setContent] = useState<WebsiteContent | null>(null);
  const [originalContent, setOriginalContent] = useState<WebsiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'header' | 'hero' | 'sections' | 'footer'>('hero');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [showMediaPickerFor, setShowMediaPickerFor] = useState<'hero' | null>(null);

  const fetchWebsiteContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/website-content', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContent(data.websiteContent);
        setOriginalContent(JSON.parse(JSON.stringify(data.websiteContent)));
      }

      // Fetch media library
      const mediaRes = await fetch('/api/admin/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    fetchWebsiteContent();
  }, []);

  const handlePublish = async () => {
    if (!content) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/website-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish changes.');
      }

      setOriginalContent(JSON.parse(JSON.stringify(content)));
      setFeedback({
        type: 'success',
        message: 'Changes published to the live customer storefront! Changes are permanent.',
      });
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Publishing error.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalContent) {
      setContent(JSON.parse(JSON.stringify(originalContent)));
      setFeedback({ type: 'success', message: 'Reverted uncommitted edits.' });
    }
  };

  // Sections management
  const moveSection = (idx: number, direction: 'up' | 'down') => {
    if (!content) return;
    const newSections = [...content.sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // re-assign order numbers
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });

    setContent({ ...content, sections: newSections });
  };

  const toggleSectionVisibility = (id: string) => {
    if (!content) return;
    setContent({
      ...content,
      sections: content.sections.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)),
    });
  };

  const deleteSection = (id: string) => {
    if (!content) return;
    if (content.sections.length <= 1) {
      alert('You must keep at least one homepage section.');
      return;
    }
    setContent({
      ...content,
      sections: content.sections.filter((s) => s.id !== id),
    });
  };

  const addSection = (type: HomepageSection['type']) => {
    if (!content) return;
    const titles: Record<HomepageSection['type'], { title: string; subtitle: string }> = {
      featured_categories: { title: 'Explore Craft Disciplines', subtitle: 'Authentic specialties from Charsadda' },
      featured_products: { title: 'Signature Masterpieces', subtitle: 'Limited batch handcrafted releases' },
      best_sellers: { title: 'Most Popular Creations', subtitle: 'Preferred by patrons across Pakistan' },
      new_arrivals: { title: 'Freshly Finished from the Loom & Workshop', subtitle: 'This season’s newest crafts' },
      brand_story: { title: 'The Living Legacy of Hashtnaghar', subtitle: 'Generational pride and master techniques' },
      craftsmanship: { title: 'Raw Materials & Traditional Guilds', subtitle: 'Full-grain buff leather, handspun khaddar, river clay' },
      testimonials: { title: 'Words from Our Patrons', subtitle: 'Verified reviews from customers nationwide' },
      promo_banner: { title: 'Wedding & Custom Bespoke Orders', subtitle: 'Personalized foot sizing and bulk gift boxes' },
      footer_info: { title: 'Hashtnaghar Artisans Workshop', subtitle: 'Visit us in Charsadda' },
    };

    const newSec: HomepageSection = {
      id: 'sec_' + Date.now(),
      type,
      title: titles[type].title,
      subtitle: titles[type].subtitle,
      isVisible: true,
      order: content.sections.length + 1,
    };

    setContent({
      ...content,
      sections: [...content.sections, newSec],
    });
  };

  if (loading || !content) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#57534E]">Loading Website Content Editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Storefront Website Editor
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Modify text, hero banner, announcements, and homepage layout visually. Changes published here update the customer website in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] rounded-md transition-colors"
          >
            Cancel / Reset
          </button>
          <button
            onClick={onBackToStore}
            className="px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-white border border-[#D6D3D1] hover:bg-neutral-50 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Storefront</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing to Database...' : 'Save & Publish Live'}</span>
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
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Editor Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E7E2DA] overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeSubTab === 'hero'
              ? 'border-[#92400E] text-[#92400E] bg-white rounded-t-md font-semibold'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Homepage Hero Banner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('header')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeSubTab === 'header'
              ? 'border-[#92400E] text-[#92400E] bg-white rounded-t-md font-semibold'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Header & Announcements</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeSubTab === 'sections'
              ? 'border-[#92400E] text-[#92400E] bg-white rounded-t-md font-semibold'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Homepage Sections & Ordering ({content.sections.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('footer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
            activeSubTab === 'footer'
              ? 'border-[#92400E] text-[#92400E] bg-white rounded-t-md font-semibold'
              : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Footer Content</span>
        </button>
      </div>

      {/* 1. HERO EDITOR */}
      {activeSubTab === 'hero' && (
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E2DA]">
            <div>
              <h2 className="text-base font-serif font-bold text-[#1C1917]">
                Homepage Hero Section
              </h2>
              <p className="text-xs text-[#78716C]">
                Configure the primary focal banner displayed to every visitor landing on Hashtnaghar Crafts.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={content.hero.isVisible}
                onChange={(e) =>
                  setContent({
                    ...content,
                    hero: { ...content.hero, isVisible: e.target.checked },
                  })
                }
                className="rounded text-[#92400E]"
              />
              <span>Section Visible on Homepage</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Text & Buttons */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Main Headline Heading
                </label>
                <input
                  type="text"
                  value={content.hero.heading}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, heading: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-serif font-bold text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Kicker Subtitle / Guild Tag
                </label>
                <input
                  type="text"
                  value={content.hero.subtitle}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Hero Paragraph Description
                </label>
                <textarea
                  rows={3}
                  value={content.hero.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, description: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={content.hero.primaryButtonText}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, primaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={content.hero.primaryButtonLink}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, primaryButtonLink: e.target.value },
                      })
                    }
                    placeholder="#products or /contact"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Secondary Button Text
                  </label>
                  <input
                    type="text"
                    value={content.hero.secondaryButtonText}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, secondaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Secondary Button Link
                  </label>
                  <input
                    type="text"
                    value={content.hero.secondaryButtonLink}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, secondaryButtonLink: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Text Alignment
                  </label>
                  <select
                    value={content.hero.textAlignment}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, textAlignment: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Center Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Image Layout Position
                  </label>
                  <select
                    value={content.hero.imagePosition}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, imagePosition: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                  >
                    <option value="right">Right Split Column</option>
                    <option value="left">Left Split Column</option>
                    <option value="background">Full Backdrop Scrim</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image Preview & Selector */}
            <div className="lg:col-span-5 space-y-3">
              <label className="block text-xs font-semibold text-[#1C1917]">
                Hero Showcase Image
              </label>

              <div className="relative rounded-lg border border-[#D6D3D1] overflow-hidden bg-stone-100 aspect-16/9">
                <img
                  src={content.hero.heroImageUrl}
                  alt="Hero preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={content.hero.heroImageUrl}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, heroImageUrl: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPickerFor('hero')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F] whitespace-nowrap"
                >
                  Choose Media
                </button>
              </div>

              {/* Media Picker Drawer/Modal */}
              {showMediaPickerFor === 'hero' && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1C1917]">Select Image from Library</span>
                    <button
                      onClick={() => setShowMediaPickerFor(null)}
                      className="text-xs text-[#78716C] hover:text-[#1C1917]"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {mediaList.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setContent({
                            ...content,
                            hero: { ...content.hero, heroImageUrl: m.url },
                          });
                          setShowMediaPickerFor(null);
                        }}
                        className={`cursor-pointer rounded border overflow-hidden aspect-4/3 relative group ${
                          content.hero.heroImageUrl === m.url ? 'ring-2 ring-[#92400E]' : ''
                        }`}
                      >
                        <img src={m.url} alt={m.alt} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-0.5 truncate block text-center">
                          {m.alt || m.filename}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. HEADER & ANNOUNCEMENT BAR */}
      {activeSubTab === 'header' && (
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-[#E7E2DA]">
            <h2 className="text-base font-serif font-bold text-[#1C1917]">
              Header & Announcement Bar
            </h2>
            <p className="text-xs text-[#78716C]">
              Configure the top announcement ticker, brand wordmark, and direct contact display in the storefront navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Storefront Brand Name
              </label>
              <input
                type="text"
                value={content.header.websiteName}
                onChange={(e) =>
                  setContent({
                    ...content,
                    header: { ...content.header, websiteName: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-serif font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Header Promotional Tagline
              </label>
              <input
                type="text"
                value={content.header.promoTagline}
                onChange={(e) =>
                  setContent({
                    ...content,
                    header: { ...content.header, promoTagline: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
              />
            </div>

            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-[#F5F2EB]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Top Announcement Bar Message
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#78716C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={content.header.showAnnouncement}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        header: { ...content.header, showAnnouncement: e.target.checked },
                      })
                    }
                    className="rounded text-[#92400E]"
                  />
                  <span>Display Top Banner</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={content.header.announcementText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    header: { ...content.header, announcementText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. HOMEPAGE SECTIONS & ORDERING */}
      {activeSubTab === 'sections' && (
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
            <div>
              <h2 className="text-base font-serif font-bold text-[#1C1917]">
                Homepage Sections & Hierarchy
              </h2>
              <p className="text-xs text-[#78716C]">
                Reorder, rename, hide, or add sections displayed below the hero banner.
              </p>
            </div>

            {/* Add Section dropdown */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addSection(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917] font-medium"
              >
                <option value="">+ Add Section...</option>
                <option value="featured_categories">Featured Categories</option>
                <option value="featured_products">Featured Products</option>
                <option value="best_sellers">Best Sellers</option>
                <option value="new_arrivals">New Arrivals</option>
                <option value="brand_story">Brand Story & Mission</option>
                <option value="craftsmanship">Cultural Craftsmanship</option>
                <option value="testimonials">Patron Testimonials</option>
                <option value="promo_banner">Promotional Banner</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {content.sections.map((section, idx) => (
              <div
                key={section.id}
                className={`p-4 rounded-lg border transition-all ${
                  section.isVisible ? 'bg-white border-[#E7E2DA]' : 'bg-[#FAF8F5] border-[#E7E2DA] opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#D6D3D1] text-[11px] font-mono font-bold text-[#78716C] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#92400E] tracking-wider block">
                        {section.type.replace('_', ' ')}
                      </span>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = [...content.sections];
                          updated[idx].title = e.target.value;
                          setContent({ ...content, sections: updated });
                        }}
                        className="font-serif font-bold text-sm text-[#1C1917] bg-transparent border-b border-transparent hover:border-[#D6D3D1] focus:border-[#92400E] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Subtitle / kicker"
                      value={section.subtitle}
                      onChange={(e) => {
                        const updated = [...content.sections];
                        updated[idx].subtitle = e.target.value;
                        setContent({ ...content, sections: updated });
                      }}
                      className="text-xs text-[#78716C] px-2 py-1 border border-transparent hover:border-[#D6D3D1] rounded bg-transparent focus:bg-white focus:outline-none w-48"
                    />

                    {/* Visibility */}
                    <button
                      onClick={() => toggleSectionVisibility(section.id)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                        section.isVisible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {section.isVisible ? 'Visible' : 'Hidden'}
                    </button>

                    {/* Move Up */}
                    <button
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="p-1 text-[#78716C] hover:text-[#1C1917] disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      disabled={idx === content.sections.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="p-1 text-[#78716C] hover:text-[#1C1917] disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1 text-red-500 hover:text-red-700 ml-1"
                      title="Remove section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. FOOTER CONTENT */}
      {activeSubTab === 'footer' && (
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-[#E7E2DA]">
            <h2 className="text-base font-serif font-bold text-[#1C1917]">
              Storefront Footer Content
            </h2>
            <p className="text-xs text-[#78716C]">
              Edit the brand narrative and legal notices appearing in the website footer.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Footer Brand Narrative
              </label>
              <textarea
                rows={3}
                value={content.footer.aboutText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    footer: { ...content.footer, aboutText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Copyright Notice
              </label>
              <input
                type="text"
                value={content.footer.copyrightText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    footer: { ...content.footer, copyrightText: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
