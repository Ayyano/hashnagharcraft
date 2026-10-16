/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { StoreProvider } from './context/StoreContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Storefront } from './components/Storefront.tsx';
import { ContactPage } from './components/ContactPage.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<'store' | 'contact' | 'admin'>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#admin') return 'admin';
    if (path === '/contact' || hash === '#contact') return 'contact';
    return 'store';
  });

  const [contactSubject, setContactSubject] = useState<string>('');

  // Handle browser navigation & popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        setCurrentView('admin');
      } else if (path === '/contact' || hash === '#contact') {
        setCurrentView('contact');
      } else {
        setCurrentView('store');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (view: 'store' | 'contact' | 'admin', subject?: string) => {
    setCurrentView(view);
    if (subject) {
      setContactSubject(subject);
    } else if (view !== 'contact') {
      setContactSubject('');
    }

    const newPath = view === 'admin' ? '/admin' : view === 'contact' ? '/contact' : '/';
    if (window.location.pathname !== newPath) {
      try {
        window.history.pushState(null, '', newPath);
      } catch (e) {
        // Fallback for sandboxed iframes
        window.location.hash = view === 'store' ? '' : `#${view}`;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SettingsProvider>
      <StoreProvider>
        <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917] selection:bg-[#B45309]/20 selection:text-[#78350F]">
          {/* Top Header */}
          <Header currentView={currentView} onNavigate={navigate} />

          {/* Main Content Area */}
          <main className="flex-1">
            {currentView === 'store' && (
              <Storefront
                onNavigateToContact={(subject) => navigate('contact', subject)}
                onNavigateToAdmin={() => navigate('admin')}
              />
            )}

            {currentView === 'contact' && (
              <ContactPage
                initialSubject={contactSubject}
                onNavigateToStore={() => navigate('store')}
              />
            )}

            {currentView === 'admin' && (
              <AdminPortal onBackToStore={() => navigate('store')} />
            )}
          </main>

          {/* Customer Cart & Checkout Drawer */}
          <CartDrawer />

          {/* Footer */}
          <Footer onNavigate={navigate} />
        </div>
      </StoreProvider>
    </SettingsProvider>
  );
}
