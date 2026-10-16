import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  DollarSign,
  PieChart,
  Tag,
  Truck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { DateFilterType } from '../../types.ts';

interface RevenueAnalyticsProps {
  token: string;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all_time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?period=${dateFilter}`;
      if (dateFilter === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, customStart, customEnd]);

  const handleExportCsv = () => {
    window.open(`/api/admin/analytics/export?period=${dateFilter}`, '_blank');
  };

  const formatPkr = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return 'PKR 0';
    return 'PKR ' + val.toLocaleString('en-PK');
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#57534E]">Compiling verified revenue metrics and transactions...</p>
      </div>
    );
  }

  const maxCatRev = Math.max(1, ...(data?.categoryRevenue?.map((c: any) => c.revenue) || [1]));

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Banner & Export */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#92400E]" />
            <h1 className="text-xl font-serif font-bold text-[#1C1917]">
              Revenue Analytics & Financial Reports
            </h1>
          </div>
          <p className="text-xs text-[#57534E] mt-0.5">
            Documented calculations separating gross sales, net collections, courier shipping fees, and refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#D6D3D1] rounded-lg p-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#92400E] ml-1.5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-[#1C1917] focus:outline-none cursor-pointer pr-2"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="previous_month">Previous Month</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Gross Order Value</span>
          <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
            {formatPkr(data?.grossOrderValue)}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">All placed orders</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-emerald-900">Net Sales Revenue</span>
          <p className="text-base font-bold font-serif text-[#059669] tabular-nums truncate">
            {formatPkr(data?.netRevenue)}
          </p>
          <span className="text-[10px] text-emerald-700 block">Excl. cancelled/refunds</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Completed Orders</span>
          <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums">
            {data?.totalOrders}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">Orders in period</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Avg. Order Value</span>
          <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
            {formatPkr(data?.averageOrderValue)}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">AOV per order</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Coupons / Discounts</span>
          <p className="text-base font-bold font-serif text-[#78716C] tabular-nums truncate">
            {formatPkr(data?.totalDiscounts)}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">Promotion deductions</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Refunds Issued</span>
          <p className="text-base font-bold font-serif text-rose-600 tabular-nums truncate">
            {formatPkr(data?.totalRefunds)}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">Returns & damaged items</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
          <span className="text-[11px] font-medium text-[#78716C]">Courier Shipping Fee</span>
          <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
            {formatPkr(data?.totalShipping)}
          </p>
          <span className="text-[10px] text-[#A8A29E] block">Courier freight total</span>
        </div>
      </div>

      {/* Financial Adjusted Overview Strip (Connects to Manual Adjustments) */}
      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-semibold text-[#1C1917]">Manual Adjustments Reconciliation:</span>
          <p className="text-[11px] text-[#78716C]">
            Order Net Sales: <strong className="text-[#1C1917]">{formatPkr(data?.netRevenue)}</strong> + Walk-in/Other Income: <strong className="text-[#059669]">{formatPkr(data?.manualIncome)}</strong> - Manual Expenses: <strong className="text-rose-600">{formatPkr(data?.manualDeductions)}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-[#78716C]">Combined Adjusted Revenue</span>
          <p className="text-lg font-serif font-bold text-[#92400E] tabular-nums">
            {formatPkr(data?.combinedAdjustedTotal)}
          </p>
        </div>
      </div>

      {/* Grid: Revenue by Category & Revenue by Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E2DA]">
            <h3 className="font-serif font-bold text-base text-[#1C1917]">
              Revenue by Craft Category
            </h3>
            <span className="text-xs text-[#78716C]">{data?.categoryRevenue?.length || 0} categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.categoryRevenue?.map((cat: any) => {
              const widthPct = Math.round((cat.revenue / maxCatRev) * 100);

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#1C1917]">{cat.category}</span>
                    <span className="font-serif font-bold tabular-nums text-[#92400E]">
                      {formatPkr(cat.revenue)}
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF8F5] h-2 rounded-full overflow-hidden border border-[#E7E2DA]">
                    <div
                      className="bg-[#92400E] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Revenue Leaderboard */}
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E7E2DA]">
            <h3 className="font-serif font-bold text-base text-[#1C1917]">
              Top Selling Products by Revenue
            </h3>
            <span className="text-xs text-[#78716C]">Ranked by total PKR</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.productRevenue?.map((prod: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#1C1917] text-white font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-semibold text-[#1C1917] truncate">{prod.title}</p>
                    <p className="text-[10px] text-[#78716C]">{prod.quantity} units sold</p>
                  </div>
                </div>
                <div className="font-serif font-bold text-[#92400E] tabular-nums whitespace-nowrap pl-2">
                  {formatPkr(prod.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method & Order Status Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-2xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1C1917] pb-2 border-b border-[#E7E2DA]">
            Payment Method Share
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#FAF8F5]">
              <span className="font-medium text-[#1C1917]">Cash on Delivery (COD):</span>
              <span className="font-serif font-bold tabular-nums">
                {formatPkr(data?.paymentMethodBreakdown?.cod)}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#FAF8F5]">
              <span className="font-medium text-[#1C1917]">Direct Bank Transfer:</span>
              <span className="font-serif font-bold tabular-nums">
                {formatPkr(data?.paymentMethodBreakdown?.bank_transfer)}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#FAF8F5]">
              <span className="font-medium text-[#1C1917]">Online Card Gateways:</span>
              <span className="font-serif font-bold tabular-nums">
                {formatPkr(data?.paymentMethodBreakdown?.online || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-2xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1C1917] pb-2 border-b border-[#E7E2DA]">
            Order Status Volume Distribution
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.keys(data?.orderStatusBreakdown || {}).map((st) => (
              <div key={st} className="p-2.5 rounded bg-[#FAF8F5] border border-[#E7E2DA] flex justify-between">
                <span className="capitalize text-[#57534E]">{st}:</span>
                <span className="font-bold text-[#1C1917] font-mono">{data.orderStatusBreakdown[st]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
