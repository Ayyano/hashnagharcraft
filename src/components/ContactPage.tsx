import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, MapPin, Clock, Send, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.tsx';

interface ContactPageProps {
  initialSubject?: string;
  onNavigateToStore: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ initialSubject = '', onNavigateToStore }) => {
  const { settings, getWhatsappUrl, telLink, emailLink } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: initialSubject || '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedInquiryId, setSubmittedInquiryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry');
      }

      setStatus('success');
      setSubmittedInquiryId(data.inquiryId || '');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected network error occurred.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header breadcrumb & title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-[#78716C]">
          <button onClick={onNavigateToStore} className="hover:underline">Home</button>
          <span>/</span>
          <span className="text-[#1C1917] font-medium">Contact Us & Support</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
          Get in Touch with {settings.brandName}
        </h1>
        <p className="text-sm text-[#57534E] max-w-2xl leading-relaxed">
          Whether you need a custom-made pair of Charsadda chappals, unstitched handloom khaddar by the yard, or custom pottery, our workshop masters are available through multiple direct channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Direct Contact Information Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">
              Direct Communication Channels
            </h2>

            {/* Clickable Phone Number */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
              <div className="w-10 h-10 rounded-full bg-[#92400E] text-white flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-[#78716C] tracking-wider block">
                  Official Business Phone
                </span>
                <a
                  href={telLink}
                  className="text-base font-bold text-[#1C1917] hover:text-[#92400E] transition-colors tabular-nums block"
                  title="Click to call from your phone"
                >
                  {settings.businessPhone}
                </a>
                <p className="text-[11px] text-[#78716C]">
                  Tap to call directly. Available during workshop hours.
                </p>
              </div>
            </div>

            {/* Clickable Email */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA]">
              <div className="w-10 h-10 rounded-full bg-[#44403C] text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-[#78716C] tracking-wider block">
                  Customer Support Email
                </span>
                <a
                  href={emailLink}
                  className="text-sm font-semibold text-[#1C1917] hover:text-[#92400E] transition-colors break-all block"
                  title="Click to send email"
                >
                  {settings.businessEmail}
                </a>
                <p className="text-[11px] text-[#78716C]">
                  Inquiries, custom commission proposals, and corporate orders.
                </p>
              </div>
            </div>

            {/* Direct WhatsApp Contact */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
              <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold text-[#065F46] tracking-wider block">
                  WhatsApp Contact (Pakistan +92)
                </span>
                <a
                  href={getWhatsappUrl('Hello Hashtnaghar Crafts, I am reaching out from the Contact page.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#065F46] hover:underline tabular-nums block"
                  title="Click to chat on WhatsApp"
                >
                  +{settings.whatsappInternational} ({settings.whatsappNumber})
                </a>
                <p className="text-[11px] text-[#047857]">
                  Instant response for orders, sizing assistance, and photos of work in progress.
                </p>
                <a
                  href={getWhatsappUrl('Hello Hashtnaghar Crafts, I have an inquiry.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Start WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Physical Location & Hours */}
            <div className="pt-4 border-t border-[#E7E2DA] space-y-3 text-xs text-[#57534E]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1C1917]">Main Heritage Workshop</p>
                  <p>{settings.address}, {settings.city}, {settings.region}, {settings.country}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1C1917]">Working Hours</p>
                  <p>{settings.workingHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#1C1917]">
                Send an Online Inquiry
              </h2>
              <p className="text-xs text-[#57534E] mt-1">
                Fill in the details below. Our customer support desk will respond via email or phone within 12 business hours.
              </p>
            </div>

            {status === 'success' ? (
              <div className="p-6 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#059669] mx-auto" />
                <h3 className="text-base font-semibold text-[#065F46]">
                  Inquiry Received Successfully!
                </h3>
                <p className="text-xs text-[#047857] max-w-md mx-auto">
                  Thank you for contacting {settings.brandName}. Your inquiry has been registered in our management system with reference #{submittedInquiryId}. A master artisan or support representative will be in touch shortly.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-4 py-2 text-xs font-semibold text-[#065F46] bg-white border border-[#A7F3D0] rounded-md hover:bg-emerald-50"
                  >
                    Send Another Message
                  </button>
                  <a
                    href={getWhatsappUrl(`Hello, following up on inquiry #${submittedInquiryId}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>Follow Up on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Asad Ullah"
                      className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. customer@example.com"
                      className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Phone / Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 0300 1234567"
                      className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                      Subject / Craft Item
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Custom Double-Sole Chappal Sizing"
                      className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    Your Message / Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details such as shoe size, color preference, quantity, or delivery city..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-md border border-[#D6D3D1] focus:border-[#92400E] focus:outline-none transition-colors resize-y"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-[11px] text-[#78716C]">
                    Data stored securely for inquiry response only.
                  </p>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{status === 'submitting' ? 'Submitting...' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
