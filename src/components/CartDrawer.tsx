import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, AlertCircle, MessageCircle, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext.tsx';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    checkoutSettings,
    settings,
    getOrderWhatsappUrl,
    refreshStoreData,
  } = useStore();

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: 'Charsadda',
    province: 'Khyber Pakhtunkhwa',
    postalCode: '',
    paymentMethod: 'cod' as 'cod' | 'bank_transfer',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const freeShippingThreshold = checkoutSettings?.freeShippingThreshold || 10000;
  const standardShippingFee = checkoutSettings?.shippingFee || 300;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const shippingFee = cartSubtotal > 0 ? (isFreeShipping ? 0 : standardShippingFee) : 0;
  const totalAmount = cartSubtotal + shippingFee;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim() || !formData.phone.trim() || !formData.street.trim() || !formData.city.trim()) {
      setErrorMsg('Please fill in your name, mobile phone number, street address, and city.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          },
          items: cart,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      setCompletedOrder(data.order);
      setCheckoutStep('success');
      clearCart();
      await refreshStoreData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while submitting your order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF8F5] border-l border-[#E7E2DA] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#E7E2DA] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#92400E]" />
              <h2 className="font-serif font-bold text-lg text-[#1C1917]">
                {checkoutStep === 'cart' ? `Your Bag (${cartCount})` : checkoutStep === 'checkout' ? 'Order Details & Delivery' : 'Order Confirmed'}
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {checkoutStep === 'cart' && (
              <>
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mx-auto text-[#A8A29E]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <p className="font-serif text-lg font-bold text-[#1C1917]">Your bag is empty</p>
                    <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                      Explore our handcrafted Charsadda chappals, handloom khaddar, and ceramics.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-5 py-2 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Free shipping progress */}
                    <div className="p-3 rounded-lg bg-[#FAF0E6] border border-[#F3E5D8] text-xs space-y-1">
                      <div className="flex items-center justify-between font-medium text-[#78350F]">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#92400E]" />
                          {isFreeShipping ? '🎉 Free Delivery Unlocked!' : `Add PKR ${(freeShippingThreshold - cartSubtotal).toLocaleString('en-PK')} more for Free Delivery`}
                        </span>
                        <span className="tabular-nums font-mono">{Math.min(100, Math.round((cartSubtotal / freeShippingThreshold) * 100))}%</span>
                      </div>
                      <div className="w-full bg-[#E7E2DA] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#059669] h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (cartSubtotal / freeShippingThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cart.map((item, idx) => (
                        <div
                          key={`${item.productId}_${item.selectedSize}_${item.selectedColor}_${idx}`}
                          className="p-3 bg-white rounded-lg border border-[#E7E2DA] flex gap-3"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-18 h-18 object-cover rounded-md bg-stone-100 shrink-0"
                            />
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="space-y-0.5">
                              <h4 className="font-serif font-bold text-xs text-[#1C1917] leading-snug line-clamp-1">
                                {item.title}
                              </h4>
                              {(item.selectedSize || item.selectedColor) && (
                                <p className="text-[11px] text-[#78716C]">
                                  {item.selectedSize && `Size: ${item.selectedSize}`}
                                  {item.selectedSize && item.selectedColor && ' · '}
                                  {item.selectedColor && `Color: ${item.selectedColor}`}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-[#92400E] tabular-nums font-serif">
                                PKR {item.price.toLocaleString('en-PK')}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center border border-[#E7E2DA] rounded bg-[#FAF8F5]">
                                <button
                                  onClick={() => updateCartQuantity(item.productId, item.quantity - 1, item.selectedSize, item.selectedColor)}
                                  className="p-1 hover:bg-[#E7E2DA] text-[#57534E]"
                                  title="Decrease"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-xs font-semibold tabular-nums">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.productId, item.quantity + 1, item.selectedSize, item.selectedColor)}
                                  className="p-1 hover:bg-[#E7E2DA] text-[#57534E]"
                                  title="Increase"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.productId, item.selectedSize, item.selectedColor)}
                                className="text-[#A8A29E] hover:text-red-600 p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {checkoutStep === 'checkout' && (
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    Customer Information
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Asad Ullah Khan"
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Mobile Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0300 1234567"
                        className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="customer@email.com"
                        className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#E7E2DA]">
                  <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    Delivery Address (Pakistan)
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1">
                      Street Address & House # <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. House 14, Street 7, Sector F-8"
                      className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Peshawar / Islamabad"
                        className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1C1917] mb-1">
                        Province
                      </label>
                      <select
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white"
                      >
                        <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                        <option value="Federal Capital (Islamabad)">Islamabad Capital</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Sindh">Sindh</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                        <option value="Azad Kashmir">Azad Kashmir</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-3 pt-2 border-t border-[#E7E2DA]">
                  <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                    Payment Method
                  </h3>

                  <div className="space-y-2">
                    <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-[#059669] bg-emerald-50/50' : 'border-[#E7E2DA] bg-white'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                        className="mt-0.5 text-[#059669]"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-[#1C1917] block">Cash on Delivery (COD)</span>
                        <span className="text-[#78716C]">Pay the courier when your handcrafted item arrives at your doorstep.</span>
                      </div>
                    </label>

                    {checkoutSettings?.bankTransferEnabled && (
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.paymentMethod === 'bank_transfer' ? 'border-[#059669] bg-emerald-50/50' : 'border-[#E7E2DA] bg-white'}`}>
                        <input
                          type="radio"
                          name="payment"
                          value="bank_transfer"
                          checked={formData.paymentMethod === 'bank_transfer'}
                          onChange={() => setFormData({ ...formData, paymentMethod: 'bank_transfer' })}
                          className="mt-0.5 text-[#059669]"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-[#1C1917] block">Direct Bank Transfer</span>
                          <span className="text-[#78716C]">{checkoutSettings.bankDetails?.bankName} (IBAN provided upon order)</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </form>
            )}

            {checkoutStep === 'success' && completedOrder && (
              <div className="py-8 text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#1C1917]">
                    Order Confirmed!
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1 font-mono">
                    Order Reference: <strong className="text-[#92400E] font-bold text-sm">{completedOrder.orderNumber}</strong>
                  </p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-[#E7E2DA] text-xs text-left space-y-2">
                  <div className="flex justify-between py-1 border-b border-[#F5F2EB]">
                    <span className="text-[#78716C]">Customer:</span>
                    <span className="font-semibold text-[#1C1917]">{completedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F5F2EB]">
                    <span className="text-[#78716C]">Destination:</span>
                    <span className="font-semibold text-[#1C1917]">{completedOrder.shippingAddress.city}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F5F2EB]">
                    <span className="text-[#78716C]">Payment:</span>
                    <span className="font-semibold text-[#1C1917]">
                      {completedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Direct Bank Transfer'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#78716C]">Total Amount:</span>
                    <span className="font-bold text-[#92400E] text-sm tabular-nums">
                      PKR {completedOrder.totalAmount.toLocaleString('en-PK')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#57534E] leading-relaxed">
                  Our master craftsmen in Charsadda are preparing your order. For immediate dispatch updates or custom sole sizing adjustments, connect with us on WhatsApp:
                </p>

                <a
                  href={getOrderWhatsappUrl(completedOrder.orderNumber, completedOrder.totalAmount)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send Order Confirmation on WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setCheckoutStep('cart');
                    setIsCartOpen(false);
                  }}
                  className="block w-full py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917]"
                >
                  Close & Continue Browsing
                </button>
              </div>
            )}
          </div>

          {/* Footer controls for Cart / Checkout */}
          {checkoutStep !== 'success' && cart.length > 0 && (
            <div className="p-5 border-t border-[#E7E2DA] bg-white space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Subtotal</span>
                  <span className="font-semibold tabular-nums text-[#1C1917]">
                    PKR {cartSubtotal.toLocaleString('en-PK')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Courier Delivery (Pakistan)</span>
                  <span className="tabular-nums">
                    {shippingFee === 0 ? <strong className="text-[#059669]">FREE</strong> : `PKR ${shippingFee.toLocaleString('en-PK')}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E7E2DA] flex items-center justify-between text-sm font-bold text-[#1C1917]">
                  <span>Total Payable</span>
                  <span className="font-serif text-[#92400E] text-base tabular-nums">
                    PKR {totalAmount.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {checkoutStep === 'cart' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={getOrderWhatsappUrl('Bag-Checkout', totalAmount)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>WhatsApp Order</span>
                  </a>

                  <button
                    onClick={() => setCheckoutStep('checkout')}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md shadow-xs transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="px-3 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] border border-[#D6D3D1] rounded-md"
                  >
                    Back to Bag
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    disabled={submitting}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Confirming Order with Guild...' : `Place Order (PKR ${totalAmount.toLocaleString('en-PK')})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
