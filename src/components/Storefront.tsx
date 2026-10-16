import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Award,
  PackageCheck,
  Check,
  Eye,
  Heart,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';
import { Product } from '../types.ts';

interface StorefrontProps {
  onNavigateToContact: (prefillSubject?: string) => void;
  onNavigateToAdmin: () => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ onNavigateToContact }) => {
  const {
    settings,
    websiteContent,
    categories,
    products,
    addToCart,
    getWhatsappUrl,
    getProductWhatsappUrl,
    setIsCartOpen,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  const formatPkr = (amount: number) => {
    return 'PKR ' + amount.toLocaleString('en-PK');
  };

  const telLink = `tel:${settings.businessPhone.replace(/\s+/g, '')}`;

  // Hero configuration from Website Editor
  const hero = websiteContent?.hero || {
    heading: 'Handcrafted Masterpieces from the Heart of Hashtnaghar',
    subtitle: 'Ancient Gandhara Heritage Guild · Charsadda, Khyber Pakhtunkhwa',
    description: 'Authentic Charsadda buffalo-leather chappals, handloom spun khaddar, and terracotta ceramics. Each piece is crafted by generational master artisans, delivered straight to your door.',
    heroImageUrl: '/uploads/hero_hashtnaghar_crafts_1792123449961.jpg',
    primaryButtonText: 'Order via WhatsApp (+92)',
    primaryButtonLink: '#products',
    secondaryButtonText: 'Explore Collection',
    secondaryButtonLink: '#products',
    textAlignment: 'left' as const,
    imagePosition: 'right' as const,
    isVisible: true,
  };

  // Filter products by selected category
  const displayedProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const openQuickView = (p: Product) => {
    setActiveProductModal(p);
    setSelectedSize(p.sizes[0] || '');
    setSelectedColor(p.colors[0] || '');
  };

  return (
    <div className="space-y-16">
      {/* 1. HOMEPAGE HERO SECTION (Live from Website Editor) */}
      {hero.isVisible && (
        <section className="relative overflow-hidden bg-[#F5F2EB] border-b border-[#E7E2DA]">
          <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className={`lg:col-span-7 space-y-6 ${hero.textAlignment === 'center' ? 'text-center mx-auto' : ''}`}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#92400E]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hero.subtitle}</span>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1C1917] tracking-tight leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                {hero.heading}
              </h1>

              <p className="text-base text-[#57534E] leading-relaxed max-w-xl">
                {hero.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={getWhatsappUrl(`Hello ${settings.brandName}, I would like to place an order or ask for custom sizing.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-sm transition-all whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>{hero.primaryButtonText}</span>
                </a>

                <a
                  href={hero.secondaryButtonLink || '#products'}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#1C1917] bg-[#E7E2DA] hover:bg-[#DCD5C9] rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>{hero.secondaryButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href={telLink}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#57534E] hover:text-[#1C1917] transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-[#92400E]" />
                  <span>Call {settings.businessPhone}</span>
                </a>
              </div>

              {/* Trust Strip */}
              <div className="pt-6 border-t border-[#E7E2DA]/80 grid grid-cols-3 gap-4 text-xs text-[#57534E]">
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#1C1917]">100% Genuine</p>
                  <p className="text-[11px] text-[#78716C]">Full-grain leather & handloom</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#1C1917]">Direct From KPK</p>
                  <p className="text-[11px] text-[#78716C]">Charsadda artisan workshop</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#1C1917]">Cash on Delivery</p>
                  <p className="text-[11px] text-[#78716C]">Nationwide courier freight</p>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-[#DCD5C9] shadow-md bg-stone-100 aspect-4/3 sm:aspect-16/9 lg:aspect-4/3">
                <img
                  src={hero.heroImageUrl}
                  alt={hero.heading}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white text-xs space-y-1">
                    <p className="font-semibold tracking-wide font-serif text-sm">Living Pashtun Heritage</p>
                    <p className="text-[#E7E2DA] opacity-90">Every cut, stitch, and glaze rooted in 800 years of tradition.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. CATALOG PRODUCTS SECTION */}
      <section id="products" className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase font-semibold text-[#92400E] tracking-wider mb-1">
              Curated Masterworks
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              Handcrafted Artisanal Collection
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#57534E] max-w-md">
            Direct from our Charsadda guild workshop. Order online via Cash on Delivery or tap WhatsApp on any item for custom sizing.
          </p>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#92400E] text-white shadow-xs'
                : 'bg-white text-[#57534E] hover:text-[#1C1917] border border-[#E7E2DA]'
            }`}
          >
            All Disciplines ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            if (count === 0) return null;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-[#92400E] text-white shadow-xs'
                    : 'bg-white text-[#57534E] hover:text-[#1C1917] border border-[#E7E2DA]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          {displayedProducts.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-[#78716C] bg-white rounded-xl border border-[#E7E2DA]">
              No products found in this category.
            </div>
          ) : (
            displayedProducts.map((product) => {
              const primaryImg = product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || '';
              const hasDiscount = product.originalPrice > product.price;
              const discountPct = hasDiscount
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-[#E7E2DA] shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                >
                  {/* Image & Badges */}
                  <div
                    onClick={() => openQuickView(product)}
                    className="relative aspect-4/3 bg-[#F5F2EB] overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={primaryImg}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />

                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="bg-[#1C1917]/85 backdrop-blur-xs text-[#FAF8F5] text-[10px] px-2 py-0.5 rounded-sm font-medium">
                        {product.category}
                      </span>
                      {hasDiscount && (
                        <span className="bg-[#059669] text-white text-[10px] px-2 py-0.5 rounded-sm font-bold font-mono">
                          {discountPct}% OFF
                        </span>
                      )}
                    </div>

                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3
                        onClick={() => openQuickView(product)}
                        className="font-serif font-bold text-[#1C1917] text-lg leading-snug hover:text-[#92400E] cursor-pointer"
                      >
                        {product.title}
                      </h3>

                      <p className="text-xs text-[#57534E] leading-relaxed line-clamp-2">
                        {product.shortDescription || product.slogan}
                      </p>

                      <div className="pt-2 text-[11px] text-[#78716C] border-t border-[#F5F2EB]">
                        <span className="font-semibold text-[#44403C]">Craft:</span> {product.materials}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E7E2DA] space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold font-serif text-[#1C1917] tabular-nums">
                            {formatPkr(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-[#A8A29E] line-through tabular-nums">
                              {formatPkr(product.originalPrice)}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-[#059669] font-medium">
                          {product.stock > 0 ? `${product.stock} in stock` : 'Made to order'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            addToCart(product, 1, product.sizes[0], product.colors[0]);
                          }}
                          disabled={product.stock <= 0}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#D6D3D1] rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#92400E]" />
                          <span>Add to Bag</span>
                        </button>

                        <a
                          href={getProductWhatsappUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
                          title="Order directly via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3. HERITAGE & GUILD STORY */}
      <section id="heritage" className="bg-[#F5F2EB] border-y border-[#E7E2DA] py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-5">
            <div className="text-xs uppercase font-semibold text-[#92400E] tracking-wider">
              Centuries of Living Tradition
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] leading-tight">
              Hashtnaghar: The Ancient Eight Guilds of Charsadda
            </h2>
            <p className="text-sm text-[#57534E] leading-relaxed">
              In Pashto and historic Gandhara texts, <em>Hashtnaghar</em> (&ldquo;Eight Towns&rdquo;) has been the epicenter of Northern craftsmanship for over eight centuries. Renowned worldwide for the durable double-sole Charsadda chappal and handloom unspun khaddar, these crafts require days of dedicated manual labor.
            </p>
            <p className="text-sm text-[#57534E] leading-relaxed">
              When you purchase from <strong>{settings.brandName}</strong>, you support master cobblers, weavers, and potters directly. No middlemen, no compromise on raw materials, and complete transparency.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-3.5 rounded-lg border border-[#E7E2DA]">
                <Award className="w-4 h-4 text-[#92400E] mb-1.5" />
                <h4 className="font-semibold text-xs text-[#1C1917]">Master Craft Guild</h4>
                <p className="text-[11px] text-[#78716C] mt-0.5">3rd generation artisans using hand-awl and wooden lasts.</p>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-[#E7E2DA]">
                <PackageCheck className="w-4 h-4 text-[#059669] mb-1.5" />
                <h4 className="font-semibold text-xs text-[#1C1917]">Custom Fits & Sizing</h4>
                <p className="text-[11px] text-[#78716C] mt-0.5">Custom sole width and foot tracings accepted on WhatsApp.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 bg-white rounded-2xl border border-[#E7E2DA] p-8 shadow-xs space-y-6">
            <h3 className="font-serif font-bold text-xl text-[#1C1917]">
              Need Assistance or Custom Sizing?
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Our workshop team in Charsadda is ready to help you with sizes, color swatches, or corporate gift commissions. Reach out directly through any of our official channels:
            </p>

            <div className="space-y-3">
              <a
                href={getWhatsappUrl('Hello Hashtnaghar Crafts! I would like customer support.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#059669] flex items-center justify-center text-white shrink-0">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#065F46]">WhatsApp Support (Fastest)</p>
                    <p className="text-xs text-[#047857] tabular-nums font-mono">+{settings.whatsappInternational} ({settings.whatsappNumber})</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#059669] group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href={telLink}
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] hover:bg-[#F5F2EB] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#92400E] flex items-center justify-center text-white shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917]">Direct Workshop Phone</p>
                    <p className="text-xs text-[#78716C] tabular-nums">{settings.businessPhone}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#92400E]">Call Now</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VIEW PRODUCT MODAL */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E2DA]">
              <span className="text-xs uppercase font-semibold text-[#92400E]">
                {activeProductModal.category}
              </span>
              <button
                onClick={() => setActiveProductModal(null)}
                className="text-xs text-[#78716C] hover:text-[#1C1917]"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square rounded-lg overflow-hidden bg-stone-100">
                <img
                  src={activeProductModal.images[0]?.url}
                  alt={activeProductModal.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-xl text-[#1C1917]">
                    {activeProductModal.title}
                  </h3>
                  <p className="font-serif font-bold text-lg text-[#92400E] tabular-nums">
                    {formatPkr(activeProductModal.price)}
                  </p>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {activeProductModal.fullDescription || activeProductModal.shortDescription}
                  </p>

                  {/* Size options */}
                  {activeProductModal.sizes && activeProductModal.sizes.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-[#1C1917]">Select Size:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProductModal.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSize(s)}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                              selectedSize === s
                                ? 'bg-[#92400E] text-white border-[#92400E] font-bold'
                                : 'bg-[#FAF8F5] text-[#57534E] border-[#D6D3D1]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color options */}
                  {activeProductModal.colors && activeProductModal.colors.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-[#1C1917]">Color:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeProductModal.colors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                              selectedColor === c
                                ? 'bg-[#1C1917] text-white border-[#1C1917] font-bold'
                                : 'bg-[#FAF8F5] text-[#57534E] border-[#D6D3D1]'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-[#E7E2DA]">
                  <button
                    onClick={() => {
                      addToCart(activeProductModal, 1, selectedSize, selectedColor);
                      setActiveProductModal(null);
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors"
                  >
                    Add to Bag & Checkout
                  </button>
                  <a
                    href={getProductWhatsappUrl(activeProductModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#065F46] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <a
          href={getWhatsappUrl('Hello Hashtnaghar Crafts! I would like to chat with an artisan.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus-visible:outline-3"
          title="Chat with Hashtnaghar Crafts on WhatsApp"
        >
          <MessageCircle className="w-5 h-5 fill-current shrink-0" />
          <span className="text-xs font-semibold tracking-wide whitespace-nowrap">
            Chat on WhatsApp
          </span>
        </a>
      </div>
    </div>
  );
};
