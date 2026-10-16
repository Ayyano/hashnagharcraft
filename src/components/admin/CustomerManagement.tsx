import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Customer } from '../../types.ts';

interface CustomerManagementProps {
  token: string;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ token }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Customer Directory & Order History
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Customer profiles compiled from completed and in-flight transactions across Pakistan.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] border border-[#D6D3D1] rounded-md hover:bg-neutral-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer by name, phone, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#78716C]">{filteredCustomers.length} registered patrons</span>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Patron Name</th>
                <th className="py-3 px-3">Phone & Direct Contact</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">City / Province</th>
                <th className="py-3 px-3">Total Orders</th>
                <th className="py-3 px-3">Total Spend (PKR)</th>
                <th className="py-3 px-4 text-right">Last Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#78716C]">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-serif font-bold text-sm text-[#1C1917] block">{c.name}</span>
                      <span className="text-[10px] text-[#A8A29E]">ID: {c.id}</span>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <a
                        href={`https://wa.me/92${c.phone.replace(/\D/g, '').replace(/^0/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#059669] hover:underline font-semibold block"
                      >
                        {c.phone}
                      </a>
                    </td>

                    <td className="py-3 px-3 text-[#57534E]">
                      {c.email || <span className="text-[#A8A29E] italic">Via Phone / COD</span>}
                    </td>

                    <td className="py-3 px-3 text-[#1C1917] font-medium">
                      {c.city || 'Pakistan'}
                    </td>

                    <td className="py-3 px-3 tabular-nums font-mono">
                      <span className="font-semibold text-[#1C1917] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E7E2DA]">
                        {c.totalOrders} order(s)
                      </span>
                    </td>

                    <td className="py-3 px-3 font-serif font-bold text-[#92400E] tabular-nums">
                      PKR {c.totalSpent.toLocaleString('en-PK')}
                    </td>

                    <td className="py-3 px-4 text-right text-[#78716C] font-mono">
                      {new Date(c.lastOrderDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
