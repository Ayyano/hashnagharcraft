import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { ManualAdjustment } from '../../types.ts';

interface ManualAdjustmentsProps {
  token: string;
}

export const ManualAdjustments: React.FC<ManualAdjustmentsProps> = ({ token }) => {
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'deduction'>('all');

  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'income' as 'income' | 'deduction',
    date: new Date().toISOString().split('T')[0],
    category: 'Workshop Direct Walk-in Sale',
    description: '',
    referenceNumber: '',
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/adjustments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data.adjustments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description.trim()) {
      alert('Please supply an amount and detailed description.');
      return;
    }

    try {
      const res = await fetch('/api/admin/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record adjustment');
      }

      setFeedback({ type: 'success', message: 'Financial adjustment recorded and logged to audit trail.' });
      setIsAdding(false);
      setFormData({
        amount: '',
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        category: 'Workshop Direct Walk-in Sale',
        description: '',
        referenceNumber: '',
      });
      await fetchAdjustments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this financial adjustment record?')) return;
    try {
      const res = await fetch(`/api/admin/adjustments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Adjustment entry removed.' });
        await fetchAdjustments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations
  const totalManualIncome = adjustments
    .filter((a) => a.type === 'income')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalManualDeductions = adjustments
    .filter((a) => a.type === 'deduction')
    .reduce((sum, a) => sum + a.amount, 0);

  const netManualImpact = totalManualIncome - totalManualDeductions;

  const filtered = adjustments.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.referenceNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Manual Revenue & Expense Adjustments
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Transparently record non-order financial activities (walk-in cash sales, bulk raw material costs, bespoke commissions) with an unalterable audit trail.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Adjustment</span>
        </button>
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

      {/* Financial Adjustment Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#059669]">
            <span className="text-xs font-semibold uppercase">Total Manual Income</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xl font-serif font-bold text-[#059669] tabular-nums">
            +PKR {totalManualIncome.toLocaleString('en-PK')}
          </p>
          <span className="text-[10px] text-[#78716C]">Workshop walk-in sales & custom fees</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold uppercase">Total Manual Deductions</span>
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <p className="text-xl font-serif font-bold text-rose-600 tabular-nums">
            -PKR {totalManualDeductions.toLocaleString('en-PK')}
          </p>
          <span className="text-[10px] text-[#78716C]">Raw leather, wool, dyes, packaging costs</span>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#B45309]/30 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-[#92400E] uppercase">Net Manual Adjustment</span>
          <p className="text-xl font-serif font-bold text-[#78350F] tabular-nums">
            {netManualImpact >= 0 ? '+' : ''}PKR {netManualImpact.toLocaleString('en-PK')}
          </p>
          <span className="text-[10px] text-[#78716C]">Applied to adjusted financial reporting</span>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 text-[#A8A29E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search adjustments by description or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#D6D3D1] bg-[#FAF8F5] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-md border border-[#D6D3D1] bg-[#FAF8F5] text-[#1C1917]"
        >
          <option value="all">All Types</option>
          <option value="income">Income Only (+)</option>
          <option value="deduction">Deduction Only (-)</option>
        </select>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2DA] text-[#78716C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Amount (PKR)</th>
                <th className="py-3 px-3">Description & Rationale</th>
                <th className="py-3 px-3">Reference #</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2DA]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#78716C]">
                    No adjustment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((adj) => (
                  <tr key={adj.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[#1C1917]">{adj.date}</td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          adj.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {adj.type.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#1C1917] font-medium">{adj.category}</td>

                    <td className="py-3 px-3 font-serif font-bold tabular-nums">
                      <span className={adj.type === 'income' ? 'text-[#059669]' : 'text-rose-600'}>
                        {adj.type === 'income' ? '+' : '-'}PKR {adj.amount.toLocaleString('en-PK')}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-xs text-[#57534E] leading-relaxed">
                      {adj.description}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-[#78716C]">
                      {adj.referenceNumber}
                    </td>

                    <td className="py-3 px-3 text-[#78716C] font-mono text-[11px]">
                      {adj.administrator}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(adj.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Adjustment Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E7E2DA] max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E2DA]">
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                Record Manual Adjustment
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-xs text-[#78716C]">
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">
                    Adjustment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-md border border-[#D6D3D1] bg-white"
                  >
                    <option value="income">Income (+ Cash In)</option>
                    <option value="deduction">Deduction (- Expense)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">
                    Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 rounded-md border border-[#D6D3D1] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">
                    Transaction Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#D6D3D1]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1917] mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#D6D3D1] bg-white"
                  >
                    <option value="Workshop Direct Walk-in Sale">Workshop Direct Walk-in Sale</option>
                    <option value="Bespoke Commission">Bespoke Commission</option>
                    <option value="Raw Leather Material Cost">Raw Leather Material Cost</option>
                    <option value="Handloom Wool Yarns">Handloom Wool Yarns</option>
                    <option value="Packaging & Crating Supplies">Packaging & Crating Supplies</option>
                    <option value="Artisan Master Honorarium">Artisan Master Honorarium</option>
                    <option value="Miscellaneous Overhead">Miscellaneous Overhead</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">
                  Reference # / Voucher / Receipt
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g. PO-TAN-889 or INV-WALK-12"
                  className="w-full px-3 py-2 rounded-md border border-[#D6D3D1] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1C1917] mb-1">
                  Detailed Description & Rationale <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain why this adjustment was entered..."
                  className="w-full px-3 py-2 rounded-md border border-[#D6D3D1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E2DA]">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-[#57534E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#92400E] rounded-md hover:bg-[#78350F]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
