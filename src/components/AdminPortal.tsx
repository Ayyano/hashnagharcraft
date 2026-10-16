import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Building2,
  Mail,
  Phone,
  MessageCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  ExternalLink,
  Trash2,
  Menu,
  X,
  CreditCard,
  Layers,
  Scale,
  Palette,
  Package,
  Users,
  BarChart3,
  Image as ImageIcon,
  ShoppingBag,
} from 'lucide-react';
import { AdminSidebar, AdminTab } from './admin/AdminSidebar.tsx';
import { OverviewDashboard } from './admin/OverviewDashboard.tsx';
import { WebsiteEditor } from './admin/WebsiteEditor.tsx';
import { ProductManagement } from './admin/ProductManagement.tsx';
import { MediaLibrary } from './admin/MediaLibrary.tsx';
import { OrderManagement } from './admin/OrderManagement.tsx';
import { CustomerManagement } from './admin/CustomerManagement.tsx';
import { CategoriesAndInventory } from './admin/CategoriesAndInventory.tsx';
import { RevenueAnalytics } from './admin/RevenueAnalytics.tsx';
import { ManualAdjustments } from './admin/ManualAdjustments.tsx';
import { WhatsAppSettingsTab } from './admin/WhatsAppSettingsTab.tsx';
import { PaymentsAndCheckoutSettings } from './admin/PaymentsAndCheckoutSettings.tsx';
import { AuditLogsTab } from './admin/AuditLogsTab.tsx';
import { BusinessSettings, EmailServiceStatus, Inquiry } from '../types.ts';
import { useStore } from '../context/StoreContext.tsx';

interface AdminPortalProps {
  onBackToStore: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToStore }) => {
  const { refreshStoreData } = useStore();

  // Setup / Auth states
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState('hashtnagarcrafts@gmail.com');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hc_admin_token'));
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Loading / Feedback states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Forms
  const [loginEmail, setLoginEmail] = useState('hashtnagarcrafts@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Initial Setup Wizard form
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  // Password Reset flow
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('hashtnagarcrafts@gmail.com');
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Change Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Editable Business Settings state
  const [settingsFormData, setSettingsFormData] = useState<BusinessSettings>({
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
  });

  // Email service state
  const [emailService, setEmailService] = useState<EmailServiceStatus>({
    configured: false,
    provider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    fromEmail: 'hashtnagarcrafts@gmail.com',
    lastTestedAt: null,
    testStatus: 'unconfigured',
    testMessage: null,
  });
  const [smtpPassword, setSmtpPassword] = useState('');

  // Counters
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Check setup status and verify session
  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/setup-status');
      const data = await res.json();
      setIsInitialized(data.isInitialized);
      if (data.adminEmail) {
        setAdminEmail(data.adminEmail);
        setLoginEmail(data.adminEmail);
      }

      // If token exists, verify and load data
      const currentToken = localStorage.getItem('hc_admin_token');
      if (currentToken) {
        const [authRes, inqRes, orderRes, prodRes] = await Promise.all([
          fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${currentToken}` } }),
          fetch('/api/admin/inquiries', { headers: { Authorization: `Bearer ${currentToken}` } }),
          fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${currentToken}` } }),
          fetch('/api/admin/products', { headers: { Authorization: `Bearer ${currentToken}` } }),
        ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          setSettingsFormData(authData.settings);
          setEmailService(authData.emailService);
        } else {
          localStorage.removeItem('hc_admin_token');
          setToken(null);
        }

        if (inqRes.ok) {
          const inqData = await inqRes.json();
          setInquiries(inqData.inquiries || []);
        }

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const pending = (orderData.orders || []).filter((o: any) => o.orderStatus === 'pending').length;
          setPendingOrdersCount(pending);
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const low = (prodData.products || []).filter((p: any) => p.stock <= p.lowStockThreshold).length;
          setLowStockCount(low);
        }
      }
    } catch (e) {
      console.error('Failed to query status:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Initial Account Setup
  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (setupPassword.length < 8) {
      setFeedback({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/setup-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: setupPassword, confirmPassword: setupConfirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      localStorage.setItem('hc_admin_token', data.token);
      setToken(data.token);
      setIsInitialized(true);
      setFeedback({ type: 'success', message: 'Administrator account configured and logged in securely!' });
      await checkStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Setup encountered an error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('hc_admin_token', data.token);
      setToken(data.token);
      setFeedback({ type: 'success', message: 'Welcome back! Admin session established.' });
      await checkStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Authentication error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('hc_admin_token');
    setToken(null);
    setFeedback({ type: 'success', message: 'Logged out securely.' });
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSettingsFormData(data.settings);
      setFeedback({ type: 'success', message: 'Website contact information and WhatsApp routing updated successfully!' });
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Save Email Settings
  const handleSaveEmailService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/email-service', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: emailService.provider,
          smtpHost: emailService.smtpHost,
          smtpPort: emailService.smtpPort,
          smtpUser: emailService.smtpUser,
          smtpPass: smtpPassword,
          fromEmail: emailService.fromEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save email settings');
      }

      setEmailService(data.emailService);
      setFeedback({ type: 'success', message: 'Email service configuration saved.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save' });
    } finally {
      setActionLoading(false);
    }
  };

  // Test Email
  const handleTestEmail = async () => {
    setFeedback(null);
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testRecipient: adminEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Email test failed');
      }

      setFeedback({ type: 'success', message: data.message || 'Email test verified successfully!' });
      await checkStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Email service connection test failed.' });
      await checkStatus();
    } finally {
      setActionLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!token) return;

    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFeedback({ type: 'success', message: 'Administrator password changed securely.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Password update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Password reset request
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetStep('confirm');
        setResetFeedback({
          type: 'info',
          message: `${data.message} One-time verification token: ${data.resetToken}`,
        });
      } else {
        setResetStep('confirm');
        setResetFeedback({
          type: 'success',
          message: data.message,
        });
      }
    } catch (err: any) {
      setResetFeedback({ type: 'error', message: err.message || 'Request failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Password reset confirm
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetFeedback(null);
    if (newResetPassword.length < 8) {
      setResetFeedback({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setResetFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword: newResetPassword,
          confirmPassword: confirmResetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reset confirmation failed');
      }

      setShowResetModal(false);
      setResetStep('request');
      setResetToken('');
      setNewResetPassword('');
      setConfirmResetPassword('');
      setFeedback({ type: 'success', message: 'Password reset confirmed! Please log in with your new password.' });
    } catch (err: any) {
      setResetFeedback({ type: 'error', message: err.message || 'Could not reset password' });
    } finally {
      setActionLoading(false);
    }
  };

  // Inquiry actions
  const handleUpdateInquiryStatus = async (id: string, newStatus: 'new' | 'read' | 'replied') => {
    if (!token) return;
    try {
      await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto mb-3" />
        <p className="text-sm text-[#57534E]">Verifying administrative security environment...</p>
      </div>
    );
  }

  // SCREEN 1: First-time Initial Setup Wizard
  if (isInitialized === false && !token) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#92400E] flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1C1917]">
              Initial Administrator Setup
            </h1>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Welcome to <strong>Hashtnaghar Crafts</strong>. Initialize your administrator account with a strong, unique password.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-xs space-y-1">
            <p className="text-[#78716C]">Designated Admin Email:</p>
            <p className="font-semibold text-[#1C1917] font-mono">{adminEmail}</p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleInitialSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Create Secure Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#78716C] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={setupConfirmPassword}
                onChange={(e) => setSetupConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none"
              />
            </div>

            <div className="text-[11px] text-[#78716C] bg-amber-50/50 p-3 rounded border border-amber-100/80 leading-normal">
              <strong>Security Protocol:</strong> Your password is salted and hashed using scrypt cryptographic derivation. It is never transmitted unhashed or stored in plaintext.
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? 'Initializing Secure Credentials...' : 'Complete Account Setup'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs text-[#78716C] hover:text-[#1C1917] hover:underline"
            >
              ← Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: Unauthenticated Admin Login Screen
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#1C1917] text-white flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-[#D97706]" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#1C1917]">
              Administrator Authentication
            </h1>
            <p className="text-xs text-[#57534E]">
              Protected access for {settingsFormData.brandName} management.
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="hashtnagarcrafts@gmail.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1C1917]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetFeedback(null);
                  }}
                  className="text-[11px] text-[#92400E] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#78716C] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#292524] rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{actionLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={onBackToStore}
              className="text-xs text-[#78716C] hover:text-[#1C1917] hover:underline"
            >
              ← Return to Storefront
            </button>
          </div>
        </div>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DA]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#92400E]" />
                  <h3 className="font-serif font-bold text-base text-[#1C1917]">
                    Secure Password Reset
                  </h3>
                </div>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-xs text-[#78716C] hover:text-[#1C1917]"
                >
                  ✕ Close
                </button>
              </div>

              {resetFeedback && (
                <div className={`p-3 rounded-md text-xs leading-relaxed ${
                  resetFeedback.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : resetFeedback.type === 'info'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {resetFeedback.message}
                </div>
              )}

              {resetStep === 'request' ? (
                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                  <p className="text-xs text-[#57534E]">
                    Enter the registered administrator email to receive a secure password reset token.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="px-3 py-1.5 text-xs text-[#57534E] hover:text-[#1C1917]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
                    >
                      {actionLoading ? 'Generating Token...' : 'Generate Reset Token'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Verification Reset Token
                    </label>
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Enter verification token"
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                      New Unique Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="text-xs text-[#78716C] hover:underline"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
                    >
                      {actionLoading ? 'Updating...' : 'Set New Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SCREEN 3: Full Premium Admin Dashboard Shell
  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Desktop & Collapsible Sidebar */}
      <AdminSidebar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
        inquiriesCount={inquiries.length}
        onBackToStore={onBackToStore}
      />

      {/* Main Administrative Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <header className="bg-white border-b border-[#E7E2DA] px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#92400E] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              Hashtnaghar Crafts Commerce Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] hover:bg-neutral-100 rounded-md transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Customer Storefront</span>
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs border-l border-[#E7E2DA] pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[#57534E] text-[11px]">{adminEmail}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors flex items-center gap-1.5"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Rendered Tab */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {activeTab === 'overview' && (
            <OverviewDashboard token={token!} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'website_editor' && (
            <WebsiteEditor token={token!} onBackToStore={onBackToStore} />
          )}

          {activeTab === 'products' && (
            <ProductManagement token={token!} />
          )}

          {activeTab === 'media' && (
            <MediaLibrary token={token!} />
          )}

          {activeTab === 'orders' && (
            <OrderManagement token={token!} />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement token={token!} />
          )}

          {activeTab === 'categories_inventory' && (
            <CategoriesAndInventory token={token!} />
          )}

          {activeTab === 'analytics' && (
            <RevenueAnalytics token={token!} />
          )}

          {activeTab === 'adjustments' && (
            <ManualAdjustments token={token!} />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppSettingsTab token={token!} />
          )}

          {activeTab === 'payments' && (
            <PaymentsAndCheckoutSettings token={token!} />
          )}

          {/* Business Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E7E2DA]">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1C1917]">
                    Storefront Business Settings
                  </h2>
                  <p className="text-xs text-[#57534E]">
                    Business contact info, address, operating hours, and customer policies.
                  </p>
                </div>
                <div className="text-[11px] text-[#78716C] bg-neutral-100 px-2.5 py-1 rounded">
                  Kept separate from admin login credentials
                </div>
              </div>

              {feedback && (
                <div className={`p-4 rounded-lg text-xs flex items-center gap-2 shadow-2xs ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsFormData.brandName}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, brandName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-serif font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Official Business Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={settingsFormData.businessPhone}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, businessPhone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Official Business Email
                    </label>
                    <input
                      type="email"
                      required
                      value={settingsFormData.businessEmail}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, businessEmail: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      WhatsApp Contact Number
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsFormData.whatsappNumber}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, whatsappNumber: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Workshop Street Address
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.address}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, address: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.city}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, city: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Province / Region
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.region}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, region: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Workshop Operating Hours
                    </label>
                    <input
                      type="text"
                      value={settingsFormData.workingHours}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, workingHours: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Return & Refund Policy
                    </label>
                    <textarea
                      rows={2}
                      value={settingsFormData.returnPolicy}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, returnPolicy: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E7E2DA] flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Website Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security & Password Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="pb-4 border-b border-[#E7E2DA]">
                <h2 className="text-lg font-serif font-bold text-[#1C1917]">
                  Administrator Security & Cryptographic Credentials
                </h2>
                <p className="text-xs text-[#57534E]">
                  Maintain server-side authorization. Passwords are never stored in plaintext.
                </p>
              </div>

              {feedback && (
                <div className={`p-4 rounded-lg text-xs flex items-center gap-2 shadow-2xs ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'}`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase text-[#78716C] tracking-wider">
                    Current Authentication Identity
                  </h3>
                  <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] space-y-3 text-xs">
                    <div>
                      <span className="text-[#78716C] block mb-0.5">Admin Email:</span>
                      <span className="font-bold text-[#1C1917] font-mono">{adminEmail}</span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block mb-0.5">Key Derivation Function:</span>
                      <span className="text-[#1C1917] font-mono">scrypt (16-byte random salt, 64-byte key)</span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block mb-0.5">Session Security:</span>
                      <span className="text-[#1C1917]">Cryptographic Bearer tokens with 24-hr TTL</span>
                    </div>
                    <div>
                      <span className="text-[#78716C] block mb-0.5">Brute Force Protection:</span>
                      <span className="text-emerald-700 font-semibold">Active Rate Limiter (Lockout after 5 failed attempts)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase text-[#78716C] tracking-wider">
                    Update Master Password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        New Unique Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-2.5 text-xs font-semibold text-white bg-[#1C1917] hover:bg-[#292524] rounded-md transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Updating...' : 'Update Password Securely'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <AuditLogsTab token={token!} />
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E2DA]">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1C1917]">
                    Customer Inquiries & Messages
                  </h2>
                  <p className="text-xs text-[#57534E]">
                    Submitted through the storefront Contact Us page.
                  </p>
                </div>
                <button
                  onClick={checkStatus}
                  className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded border border-[#E7E2DA]"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-[#78716C] space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-[#D6D3D1]" />
                  <p className="text-xs">No customer inquiries recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => {
                    const customerWaUrl = inq.phone
                      ? `https://wa.me/92${inq.phone.replace(/\D/g, '').replace(/^0/, '')}?text=Hello%20${encodeURIComponent(inq.name)},%20regarding%20your%20inquiry%20"${encodeURIComponent(inq.subject)}"...`
                      : null;

                    return (
                      <div
                        key={inq.id}
                        className="p-4 rounded-lg border border-[#E7E2DA] space-y-3 bg-[#FAF8F5]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[#1C1917]">{inq.name}</span>
                            <span className="text-[11px] text-[#78716C]">({inq.email})</span>
                            {inq.phone && <span className="text-[11px] font-mono text-[#78716C]">· {inq.phone}</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${inq.status === 'new' ? 'bg-amber-100 text-amber-800' : inq.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                              {inq.status}
                            </span>
                            <span className="text-[11px] text-[#A8A29E]">
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-[#92400E]">{inq.subject}</div>

                        <p className="text-xs text-[#44403C] leading-relaxed whitespace-pre-wrap bg-white p-3 rounded border border-[#E7E2DA]">
                          {inq.message}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                          <div className="flex items-center gap-2">
                            {customerWaUrl && (
                              <a
                                href={customerWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded"
                              >
                                <MessageCircle className="w-3 h-3 fill-current" />
                                <span>Reply on WhatsApp</span>
                              </a>
                            )}
                            {inq.phone && (
                              <a
                                href={`tel:${inq.phone}`}
                                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-[#1C1917] bg-white border border-[#D6D3D1] rounded"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call</span>
                              </a>
                            )}
                            <a
                              href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-medium text-[#1C1917] bg-white border border-[#D6D3D1] rounded"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={inq.status}
                              onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                              className="px-2 py-1 text-[11px] rounded border border-[#D6D3D1] bg-white"
                            >
                              <option value="new">Mark as New</option>
                              <option value="read">Mark as Read</option>
                              <option value="replied">Mark as Replied</option>
                            </select>
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
