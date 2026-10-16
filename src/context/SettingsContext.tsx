import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BusinessSettings } from '../types.ts';

interface SettingsContextType {
  settings: BusinessSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getWhatsappUrl: (message?: string) => string;
  telLink: string;
  emailLink: string;
}

const defaultSettings: BusinessSettings = {
  brandName: 'Hashtnaghar Crafts',
  businessPhone: '03709956956',
  businessEmail: 'hashtnagarcrafts@gmail.com',
  whatsappNumber: '03709956956',
  countryCode: '+92',
  whatsappInternational: '923709956956',
  address: 'Historic Craft Bazaar, Charsadda, Khyber Pakhtunkhwa',
  city: 'Charsadda',
  region: 'Khyber Pakhtunkhwa',
  country: 'Pakistan',
  workingHours: 'Monday – Saturday: 9:00 AM – 8:00 PM PKT',
  supportNote: 'Direct master artisan support via WhatsApp and phone.',
  socialInstagram: 'https://instagram.com/hashtnagharcrafts',
  socialFacebook: 'https://facebook.com/hashtnagharcrafts',
  currency: 'PKR',
  timezone: 'Asia/Karachi',
  returnPolicy: '7-day inspection guarantee for unworn items and exchange for custom fits.',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
  getWhatsappUrl: () => `https://wa.me/923709956956`,
  telLink: 'tel:03709956956',
  emailLink: 'mailto:hashtnagarcrafts@gmail.com',
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.warn('Could not fetch settings from API, using fallback defaults:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const getWhatsappUrl = useCallback(
    (message?: string) => {
      const number = settings.whatsappInternational || '923709956956';
      const defaultText = `Hello ${settings.brandName}! I am interested in your handcrafted artisanal products.`;
      const textToUse = message ? message.trim() : defaultText;
      return `https://wa.me/${number}?text=${encodeURIComponent(textToUse)}`;
    },
    [settings.whatsappInternational, settings.brandName]
  );

  const telLink = `tel:${settings.businessPhone.replace(/\s+/g, '')}`;
  const emailLink = `mailto:${settings.businessEmail.trim()}`;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        getWhatsappUrl,
        telLink,
        emailLink,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
