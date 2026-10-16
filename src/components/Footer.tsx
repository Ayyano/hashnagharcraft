import React from 'react';
import { Phone, Mail, MessageCircle, MapPin, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.tsx';

interface FooterProps {
  onNavigate: (view: 'store' | 'contact' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, telLink, emailLink, getWhatsappUrl } = useSettings();

  return (
    <footer className="bg-[#1C1917] text-[#D6D3D1] border-t border-[#292524] mt-20">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Ethos */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-xl font-serif font-bold text-[#F5F5F4] tracking-tight">
              {settings.brandName}
            </h3>
            <p className="text-xs leading-relaxed text-[#A8A29E]">
              Dedicated to preserving the indigenous heritage of Hashtnaghar (Charsadda). Handcrafted leather chappals, traditional handloom khaddar, and historic ceramics direct from generational master craftspeople.
            </p>
            <div className="pt-1 flex items-center gap-2 text-xs text-[#D97706]">
              <HeartHandshake className="w-4 h-4 shrink-0" />
              <span>Direct Fair Artisan Remuneration</span>
            </div>
          </div>

          {/* Direct Customer Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#F5F5F4]">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="block text-[#78716C] mb-0.5">Phone (Direct Calls):</span>
                <a
                  href={telLink}
                  className="text-[#F5F5F4] hover:text-[#F59E0B] transition-colors flex items-center gap-2 font-medium tabular-nums"
                  title="Click to call mobile or desk phone"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>{settings.businessPhone}</span>
                </a>
              </li>
              <li>
                <span className="block text-[#78716C] mb-0.5">Official Inquiries & Orders:</span>
                <a
                  href={emailLink}
                  className="text-[#F5F5F4] hover:text-[#F59E0B] transition-colors flex items-center gap-2 font-medium break-all"
                  title="Click to open your email client"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>{settings.businessEmail}</span>
                </a>
              </li>
              <li>
                <span className="block text-[#78716C] mb-0.5">WhatsApp Orders (Instant):</span>
                <a
                  href={getWhatsappUrl('Hello Hashtnaghar Crafts, I would like to place an order.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#34D399] hover:text-[#6EE7B7] transition-colors flex items-center gap-2 font-medium tabular-nums"
                  title="Click to chat via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#10B981] shrink-0 fill-current" />
                  <span>+{settings.whatsappInternational} ({settings.whatsappNumber})</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Workshop Location & Hours */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#F5F5F4]">
              Artisan Workshop
            </h4>
            <div className="space-y-2.5 text-xs text-[#A8A29E]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>
                  {settings.address}, {settings.city}, {settings.region}, {settings.country}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>{settings.workingHours}</span>
              </div>
              <p className="text-[11px] text-[#78716C] italic pt-1">
                {settings.supportNote}
              </p>
            </div>
          </div>

          {/* Quick Navigation & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#F5F5F4]">
              Navigation & Governance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('store')}
                  className="text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
                >
                  Crafts Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="text-[#A8A29E] hover:text-white transition-colors cursor-pointer"
                >
                  Contact & Custom Orders
                </button>
              </li>
              <li className="pt-3 border-t border-[#292524]">
                <button
                  onClick={() => onNavigate('admin')}
                  className="text-[#D97706] hover:text-[#F59E0B] transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Configuration Panel</span>
                </button>
                <span className="block text-[11px] text-[#78716C] mt-0.5">
                  Secure administration & settings
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom hairline row */}
        <div className="border-t border-[#292524] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>© {new Date().getFullYear()} {settings.brandName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Charsadda, Khyber Pakhtunkhwa</span>
            <span aria-hidden="true">·</span>
            <span>Handmade in Pakistan</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#A8A29E] hover:underline"
            >
              /admin
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
