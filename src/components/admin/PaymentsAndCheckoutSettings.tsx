import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Building,
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { CheckoutSettings } from '../../types.ts';
import { useStore } from '../../context/StoreContext.tsx';

interface PaymentsAndCheckoutSettingsProps {
  token: string;
}

export const PaymentsAndCheckoutSettings: React.FC<PaymentsAndCheckoutSettingsProps> = ({ token }) => {
  const { refreshStoreData } = useStore();

  const [settings, setSettings] = useState<CheckoutSettings>({
    codEnabled: true,
    bankTransferEnabled: true,
    bankDetails: {
      bankName: 'Meezan Bank Limited',
      accountTitle: 'Hashtnaghar Crafts',
      accountNumber: '02890104882910',
      iban: 'PK55MEZN0002890104882910',
      instructions: 'Please transfer the exact amount and send screenshot via WhatsApp to 03709956956.',
    },
    onlinePaymentsEnabled: false,
    onlinePaymentProvider: 'none',
    onlinePaymentNotes: 'Payment gateway requires live merchant API credentials from PayFast or JazzCash.',
    shippingFee: 300,
    freeShippingThreshold: 10000,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/checkout-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.checkoutSettings) setSettings(data.checkoutSettings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/checkout-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save checkout settings');
      }

      setFeedback({ type: 'success', message: 'Payment methods and shipping parameters updated successfully!' });
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#57534E]">Loading payment & checkout configurations...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
      <div className="pb-4 border-b border-[#E7E2DA]">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#92400E]" />
          <h1 className="text-xl font-serif font-bold text-[#1C1917]">
            Payments, Shipping & Checkout Settings
          </h1>
        </div>
        <p className="text-xs text-[#57534E] mt-0.5">
          Configure active customer payment options for Pakistan, courier shipping fees, and free delivery thresholds.
        </p>
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

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Cash on Delivery */}
        <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Banknote className="w-5 h-5 text-[#059669]" />
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                  Cash on Delivery (COD)
                </h3>
                <p className="text-[11px] text-[#78716C]">
                  Most popular payment method across Pakistan for footwear and handloom crafts.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={settings.codEnabled}
                onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                className="rounded text-[#059669]"
              />
              <span className={settings.codEnabled ? 'text-[#059669]' : 'text-[#78716C]'}>
                {settings.codEnabled ? 'Active on Checkout' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        {/* 2. Direct Bank Transfer */}
        <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-[#92400E]" />
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                  Direct Bank Account Transfer
                </h3>
                <p className="text-[11px] text-[#78716C]">
                  Allow patrons to transfer directly into the official artisan guild bank account.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={settings.bankTransferEnabled}
                onChange={(e) => setSettings({ ...settings, bankTransferEnabled: e.target.checked })}
                className="rounded text-[#92400E]"
              />
              <span className={settings.bankTransferEnabled ? 'text-[#92400E]' : 'text-[#78716C]'}>
                {settings.bankTransferEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {settings.bankTransferEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E7E2DA]">
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Account Title
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, accountTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.accountNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  IBAN (International Bank Account #)
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.iban}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, iban: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Customer Deposit Instructions
                </label>
                <input
                  type="text"
                  value={settings.bankDetails.instructions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, instructions: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Online Payment Gateway (Transparent Real Status) */}
        <div className="p-5 rounded-xl bg-white border border-[#E7E2DA] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-[#57534E]" />
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                  Online Credit / Debit Card Gateway
                </h3>
                <p className="text-[11px] text-[#78716C]">
                  PayFast, JazzCash Merchant, Easypaisa, or Stripe Integration.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              {settings.onlinePaymentsEnabled ? 'Active' : 'Not Configured (Requires Merchant Keys)'}
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 text-xs text-amber-900 rounded-lg space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Authentic Integration Status</span>
            </p>
            <p className="leading-relaxed">
              In accordance with payment security rules, online card processing is never marked as active without verified merchant credentials. To enable online card payments in Pakistan, register an account with <strong>PayFast</strong>, <strong>JazzCash Merchant</strong>, or <strong>Stripe</strong> and supply your verified server API secrets. In the meantime, Cash on Delivery and Direct Bank Transfer process customer orders reliably.
            </p>
          </div>
        </div>

        {/* 4. Courier Shipping Rates */}
        <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] space-y-4">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-[#92400E]" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                Courier Freight & Free Delivery Threshold
              </h3>
              <p className="text-[11px] text-[#78716C]">
                Configure standard flat shipping rate across Pakistan and free delivery cart threshold.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Standard Shipping Charge (PKR)
              </label>
              <input
                type="number"
                min={0}
                value={settings.shippingFee}
                onChange={(e) => setSettings({ ...settings, shippingFee: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white font-mono font-bold"
              />
              <span className="text-[11px] text-[#78716C] mt-1 block">
                Charged when total order is below free threshold.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                Free Shipping Threshold (PKR)
              </label>
              <input
                type="number"
                min={0}
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white font-mono font-bold"
              />
              <span className="text-[11px] text-[#78716C] mt-1 block">
                Orders equal or exceeding this qualify for Free Delivery across Pakistan.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#E7E2DA]">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Parameters...' : 'Save Checkout & Payment Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
