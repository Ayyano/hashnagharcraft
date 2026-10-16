import React, { useState } from 'react';
import { MessageCircle, Menu, X, Shield, PhoneCall, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

interface HeaderProps {
  currentView: 'store' | 'contact' | 'admin';
  onNavigate: (view: 'store' | 'contact' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { settings, websiteContent, getWhatsappUrl, cartCount, setIsCartOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: 'store' | 'contact' | 'admin') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const brandTitle = websiteContent?.header?.websiteName || settings.brandName || 'Hashtnaghar Crafts';
  const showAnnouncement = websiteContent?.header?.showAnnouncement ?? true;
  const announcementText =
    websiteContent?.header?.announcementText ||
    '✨ Authentic Charsadda Craft Guild · Free Delivery Across Pakistan on Orders Over PKR 10,000 · WhatsApp Orders Active';

  const telLink = `tel:${settings.businessPhone.replace(/\s+/g, '')}`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2DA]">
      {/* Top Announcement Bar (Configurable from Website Editor) */}
      {showAnnouncement && (
        <div className="bg-[#1C1917] text-[#E7E2DA] px-6 py-2 text-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{announcementText}</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[11px] shrink-0 opacity-90">
              <a
                href={telLink}
                className="text-[#D97706] hover:underline font-medium tabular-nums"
                title="Call Directly"
              >
                Call: {settings.businessPhone}
              </a>
              <span aria-hidden="true" className="opacity-40">·</span>
              <button
                onClick={() => onNavigate('admin')}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-[#D97706]" />
                <span>Admin Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => handleNav('store')}
          className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-[#1C1917] hover:text-[#92400E] transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          {brandTitle}
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]">
          <button
            onClick={() => handleNav('store')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] transition-colors pb-0.5 cursor-pointer ${
              currentView === 'store' ? 'text-[#92400E] font-semibold border-b-2 border-[#92400E]' : ''
            }`}
          >
            Crafts Collection
          </button>
          <a
            href="#heritage"
            onClick={(e) => {
              if (currentView !== 'store') {
                e.preventDefault();
                handleNav('store');
                setTimeout(() => {
                  document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="whitespace-nowrap shrink-0 hover:text-[#1C1917] transition-colors pb-0.5 cursor-pointer"
          >
            Artisanal Heritage
          </a>
          <button
            onClick={() => handleNav('contact')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] transition-colors pb-0.5 cursor-pointer ${
              currentView === 'contact' ? 'text-[#92400E] font-semibold border-b-2 border-[#92400E]' : ''
            }`}
          >
            Contact & Custom
          </button>
          <button
            onClick={() => handleNav('admin')}
            className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] transition-colors pb-0.5 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'admin' ? 'text-[#92400E] font-semibold border-b-2 border-[#92400E]' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5 opacity-70" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Cart & WhatsApp Order) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Shopping Bag Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg bg-white border border-[#E7E2DA] hover:border-[#D6D3D1] text-[#1C1917] transition-colors cursor-pointer"
            aria-label="Open Shopping Bag"
            title="View Bag"
          >
            <ShoppingBag className="w-4 h-4 text-[#92400E]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#059669] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {cartCount}
              </span>
            )}
          </button>

          {/* Primary Action Button */}
          <a
            href={getWhatsappUrl('Hello Hashtnaghar Crafts! I would like to place an order.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">WhatsApp Order</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#57534E] hover:text-[#1C1917] rounded-md border border-[#E7E2DA]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E2DA] bg-[#FAF8F5] px-6 py-4 space-y-3 animate-in fade-in duration-150">
          <button
            onClick={() => handleNav('store')}
            className="block w-full text-left py-2 text-sm font-medium text-[#1C1917]"
          >
            Crafts Collection
          </button>
          <a
            href="#heritage"
            onClick={() => {
              handleNav('store');
              setTimeout(() => {
                document.getElementById('heritage')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-[#57534E]"
          >
            Artisanal Heritage
          </a>
          <button
            onClick={() => handleNav('contact')}
            className="block w-full text-left py-2 text-sm font-medium text-[#57534E]"
          >
            Contact & Support
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="block w-full text-left py-2 text-sm font-medium text-[#92400E] flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Control Panel</span>
          </button>
          <div className="pt-2 border-t border-[#E7E2DA] flex flex-col gap-2">
            <a
              href={telLink}
              className="py-2 text-sm text-[#1C1917] flex items-center gap-2 font-medium tabular-nums"
            >
              <PhoneCall className="w-4 h-4 text-[#92400E]" />
              <span>Call {settings.businessPhone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
