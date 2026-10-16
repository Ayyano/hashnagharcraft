import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  ExternalLink,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { WhatsAppSettings } from '../../types.ts';
import { useStore } from '../../context/StoreContext.tsx';

interface WhatsAppSettingsTabProps {
  token: string;
}

export const WhatsAppSettingsTab: React.FC<WhatsAppSettingsTabProps> = ({ token }) => {
  const { refreshStoreData } = useStore();

  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: true,
    phoneNumber: '03709956956',
    countryCode: '+92',
    defaultMessage: 'Hello Hashtnaghar Crafts! I would like to inquire about your handcrafted products.',
    productMessageTemplate: 'Hello Hashtnaghar Crafts! I am interested in ordering: "{productTitle}" (PKR {productPrice}). Please confirm availability and sizing options.',
    orderConfirmationTemplate: 'Hello Hashtnaghar Crafts! I have placed Order #{orderNumber} for PKR {orderTotal}. Please confirm my shipment.',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.whatsAppSettings) setSettings(data.whatsAppSettings);
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
      const res = await fetch('/api/admin/whatsapp-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update WhatsApp settings');
      }

      setFeedback({ type: 'success', message: 'WhatsApp order settings and templates saved successfully!' });
      await refreshStoreData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Compute correctly formatted Pakistan international number without double country code
  const digits = settings.phoneNumber.replace(/\D/g, '');
  const internationalNumber = digits.startsWith('92') ? digits : '92' + digits.replace(/^0/, '');
  const sampleTestUrl = `https://wa.me/${internationalNumber}?text=${encodeURIComponent(settings.defaultMessage)}`;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#57534E]">Loading WhatsApp configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#059669]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              WhatsApp Direct Order Integration
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Connect customers directly to your Charsadda artisan desk via standard WhatsApp click-to-chat links formatted for Pakistan (+92).
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="rounded text-[#059669]"
          />
          <span>Enable WhatsApp Touchpoints</span>
        </label>
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

      {/* Protocol Transparency Notice */}
      <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>Pakistan International Dialing Protocol Enforced</span>
        </p>
        <p className="leading-relaxed">
          The business phone <code className="font-mono font-bold">{settings.phoneNumber}</code> is automatically transformed to international format <code className="font-mono font-bold">+{internationalNumber}</code> for WhatsApp URLs (<code className="font-mono font-bold">wa.me/{internationalNumber}</code>). The country code (+92) is never duplicated.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              WhatsApp Business Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={settings.phoneNumber}
              onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
              placeholder="03709956956"
              className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono font-bold text-[#1C1917]"
            />
            <span className="text-[11px] text-[#78716C] mt-1 block">
              Default: 03709956956 (Pakistan)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Country Code Prefix
            </label>
            <input
              type="text"
              disabled
              value={settings.countryCode}
              className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1] bg-stone-100 font-mono text-[#78716C]"
            />
            <span className="text-[11px] text-[#78716C] mt-1 block">
              Resolved URL Number: <strong className="font-mono text-[#059669]">{internationalNumber}</strong>
            </span>
          </div>
        </div>

        {/* Message Templates */}
        <div className="space-y-4 pt-2 border-t border-[#E7E2DA]">
          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              General Inquiries Message Template
            </label>
            <textarea
              rows={2}
              value={settings.defaultMessage}
              onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
            />
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Used when customers click the floating WhatsApp button or the header contact link.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Product-Specific Order Template
            </label>
            <textarea
              rows={2}
              value={settings.productMessageTemplate}
              onChange={(e) => setSettings({ ...settings, productMessageTemplate: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
            />
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Supported dynamic variables: <code className="text-[#92400E] font-mono">&#123;productTitle&#125;</code>, <code className="text-[#92400E] font-mono">&#123;productPrice&#125;</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1917] mb-1">
              Order Confirmation Notification Template
            </label>
            <textarea
              rows={2}
              value={settings.orderConfirmationTemplate}
              onChange={(e) => setSettings({ ...settings, orderConfirmationTemplate: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-md border border-[#D6D3D1]"
            />
            <p className="text-[11px] text-[#78716C] mt-0.5">
              Supported dynamic variables: <code className="text-[#92400E] font-mono">&#123;orderNumber&#125;</code>, <code className="text-[#92400E] font-mono">&#123;orderTotal&#125;</code>.
            </p>
          </div>
        </div>

        {/* Live Click to Chat Test Link */}
        <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] space-y-2 text-xs">
          <span className="font-semibold text-[#1C1917] block">Live Click-to-Chat Link Preview</span>
          <p className="text-[#78716C]">
            Opening WhatsApp opens a pre-composed message in the user's WhatsApp client:
          </p>
          <div className="bg-white p-2.5 rounded border border-[#D6D3D1] font-mono text-[11px] break-all text-[#059669]">
            {sampleTestUrl}
          </div>
          <div className="pt-1">
            <a
              href={sampleTestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#059669] hover:underline font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Click-to-Chat in New Window</span>
            </a>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#E7E2DA]">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
