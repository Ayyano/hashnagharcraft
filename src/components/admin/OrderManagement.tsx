import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  Printer,
  Truck,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Save,
  AlertCircle,
  User,
  MapPin,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus } from '../../types.ts';

interface OrderManagementProps {
  token: string;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('pending');
  const [paymentDraft, setPaymentDraft] = useState<PaymentStatus>('unpaid');
  const [trackingDraft, setTrackingDraft] = useState('');
  const [internalNotesDraft, setInternalNotesDraft] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusDraft(order.orderStatus);
    setPaymentDraft(order.paymentStatus);
    setTrackingDraft(order.trackingNumber || '');
    setInternalNotesDraft(order.internalNotes || '');
    setFeedback(null);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: statusDraft,
          paymentStatus: paymentDraft,
          trackingNumber: trackingDraft,
          internalNotes: internalNotesDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setSelectedOrder(data.order);
      setFeedback({ type: 'success', message: `Order ${data.order.orderNumber} successfully updated.` });
      await fetchOrders();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Update failed' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.shippingAddress.city.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'processing':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'cancelled':
        return 'bg-stone-200 text-stone-700 border-stone-300';
      case 'refunded':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Customer Order Management
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Track customer orders, manage Pakistan courier tracking numbers, dispatch status, and inventory adjustments.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] hover:bg-neutral-100 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order # (e.g. HC-1001), customer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917]"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917]"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid (COD)</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3">Total (PKR)</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#78716C]">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#92400E]">
                        {order.orderNumber}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#1C1917] block">{order.customerName}</span>
                        <span className="text-[11px] text-[#78716C]">{order.shippingAddress.city}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#57534E]">
                        {order.customerPhone}
                      </td>

                      <td className="py-3 px-3 text-[#78716C]">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 max-w-xs truncate text-[#57534E]">
                        <span className="font-semibold text-[#1C1917]">{itemsCount} item(s): </span>
                        {order.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                      </td>

                      <td className="py-3 px-3 font-serif font-bold text-[#1C1917] tabular-nums">
                        PKR {order.totalAmount.toLocaleString('en-PK')}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-[#1C1917] block">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            order.paymentStatus === 'paid'
                              ? 'text-emerald-700'
                              : order.paymentStatus === 'refunded'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openOrderModal(order)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#92400E] bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL ORDER DETAIL MODAL & DISPATCH CONTROL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2DA]">
              <div>
                <span className="text-[11px] font-mono text-[#78716C]">Order Reference</span>
                <h2 className="font-serif font-bold text-xl text-[#92400E]">
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] rounded-md hover:bg-neutral-100 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-[#78716C] hover:text-[#1C1917] p-1.5"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Customer & Address Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-[#78716C] uppercase tracking-wider block text-[10px]">
                  Customer Contact
                </span>
                <p className="font-bold text-[#1C1917] text-sm">{selectedOrder.customerName}</p>
                <p className="font-mono text-[#57534E]">{selectedOrder.customerPhone}</p>
                {selectedOrder.customerEmail && (
                  <p className="text-[#78716C]">{selectedOrder.customerEmail}</p>
                )}
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`https://wa.me/92${selectedOrder.customerPhone.replace(/\D/g, '').replace(/^0/, '')}?text=Hello%20${encodeURIComponent(selectedOrder.customerName)},%20regarding%20Order%20${selectedOrder.orderNumber}...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#059669] rounded hover:bg-[#047857]"
                  >
                    <MessageCircle className="w-3 h-3 fill-current" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#1C1917] bg-white border border-[#D6D3D1] rounded"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-[#78716C] uppercase tracking-wider block text-[10px]">
                  Shipping Destination
                </span>
                <p className="text-[#1C1917] font-medium">{selectedOrder.shippingAddress.street}</p>
                <p className="text-[#57534E]">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province}
                </p>
                {selectedOrder.shippingAddress.postalCode && (
                  <p className="font-mono text-[#78716C]">Postal: {selectedOrder.shippingAddress.postalCode}</p>
                )}
              </div>
            </div>

            {/* Items Summary Table */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
                Order Items
              </h3>
              <div className="rounded-lg border border-[#E7E2DA] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C]">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E2DA]">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-[#1C1917]">{item.title}</p>
                          {(item.selectedSize || item.selectedColor) && (
                            <span className="text-[10px] text-[#78716C]">
                              {item.selectedSize && `Size: ${item.selectedSize}`}
                              {item.selectedSize && item.selectedColor && ' · '}
                              {item.selectedColor && `Color: ${item.selectedColor}`}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 tabular-nums font-mono">
                          PKR {item.price.toLocaleString('en-PK')}
                        </td>
                        <td className="py-2 px-3 tabular-nums font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-semibold tabular-nums font-mono">
                          PKR {(item.price * item.quantity).toLocaleString('en-PK')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#FAF8F5] border-t border-[#E7E2DA]">
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-right text-[#78716C]">
                        Subtotal:
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-mono">
                        PKR {selectedOrder.subtotal.toLocaleString('en-PK')}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-right text-[#78716C]">
                        Shipping Courier:
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-mono">
                        {selectedOrder.shippingFee === 0 ? 'FREE' : `PKR ${selectedOrder.shippingFee}`}
                      </td>
                    </tr>
                    <tr className="font-bold text-sm text-[#1C1917]">
                      <td colSpan={3} className="py-2 px-3 text-right text-[#92400E]">
                        Total Amount:
                      </td>
                      <td className="py-2 px-3 text-right font-serif text-[#92400E] tabular-nums">
                        PKR {selectedOrder.totalAmount.toLocaleString('en-PK')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateOrder} className="space-y-4 pt-2 border-t border-[#E7E2DA]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Order Lifecycle Status
                  </label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white font-semibold"
                  >
                    <option value="pending">Pending (Awaiting Confirmation)</option>
                    <option value="confirmed">Confirmed (WhatsApp verified)</option>
                    <option value="processing">Processing (In Workshop Crafting)</option>
                    <option value="shipped">Shipped (Handed to Courier)</option>
                    <option value="delivered">Delivered (Funds Collected)</option>
                    <option value="cancelled">Cancelled (Restore Stock)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Payment Collection Status
                  </label>
                  <select
                    value={paymentDraft}
                    onChange={(e) => setPaymentDraft(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] bg-white font-semibold"
                  >
                    <option value="unpaid">Unpaid (Cash on Delivery)</option>
                    <option value="paid">Paid (Collected)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Courier Tracking # (e.g. TCS, Leopards, Call Courier)
                  </label>
                  <input
                    type="text"
                    value={trackingDraft}
                    onChange={(e) => setTrackingDraft(e.target.value)}
                    placeholder="e.g. TCS-77291884 or LEO-9912001"
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Internal Guild Notes
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotesDraft}
                    onChange={(e) => setInternalNotesDraft(e.target.value)}
                    placeholder="Custom sizing notes, courier remarks, customer requests..."
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#D6D3D1]"
                  />
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase font-semibold text-[#78716C] tracking-wider block">
                    Audit Timeline
                  </span>
                  <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] max-h-32 overflow-y-auto space-y-1.5 text-[11px]">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start justify-between text-[#57534E]">
                        <span>
                          <strong className="text-[#1C1917] capitalize">{h.status}:</strong> {h.note || ''}
                        </span>
                        <span className="text-[#A8A29E] font-mono shrink-0 ml-2">
                          {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E7E2DA]">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3.5 py-2 text-xs text-[#57534E] hover:text-[#1C1917]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Order Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
