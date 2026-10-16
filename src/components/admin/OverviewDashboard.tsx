import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Package,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Eye,
} from 'lucide-react';
import { OverviewStats, DateFilterType } from '../../types.ts';
import { AdminTab } from './AdminSidebar.tsx';

interface OverviewDashboardProps {
  token: string;
  onNavigateTab: (tab: AdminTab) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ token, onNavigateTab }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all_time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeChartMetric, setActiveChartMetric] = useState<'revenue' | 'orders'>('revenue');

  const fetchOverview = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/overview?period=${dateFilter}`;
      if (dateFilter === 'custom' && customStart && customEnd) {
        url += `&startDate=${customStart}&endDate=${customEnd}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch overview stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [dateFilter, customStart, customEnd]);

  const formatPkr = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return 'PKR 0';
    return 'PKR ' + val.toLocaleString('en-PK');
  };

  if (loading && !stats) {
    return (
      <div className="py-24 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin mx-auto" />
        <p className="text-xs text-[#57534E]">Loading real business analytics from database records...</p>
      </div>
    );
  }

  // Calculate highest point for chart scale
  const maxRevenue = Math.max(1, ...(stats?.salesTrend.map((p) => p.revenue) || [1]));
  const maxOrders = Math.max(1, ...(stats?.salesTrend.map((p) => p.orders) || [1]));

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Top Title & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1C1917]">
            Business Performance Overview
          </h1>
          <p className="text-xs text-[#57534E] mt-0.5">
            Real-time financial metrics, inventory indicators, and customer trends computed from verified database transactions.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#D6D3D1] rounded-lg p-1 text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#92400E] ml-1.5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="bg-transparent text-xs font-medium text-[#1C1917] focus:outline-none cursor-pointer pr-2"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="previous_month">Previous Month</option>
              <option value="this_year">This Year</option>
              <option value="previous_year">Previous Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-[#D6D3D1] rounded-lg p-1 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs text-[#1C1917] bg-transparent focus:outline-none"
              />
              <span className="text-[#A8A29E]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs text-[#1C1917] bg-transparent focus:outline-none"
              />
            </div>
          )}

          <button
            onClick={fetchOverview}
            className="p-2 text-[#78716C] hover:text-[#1C1917] bg-white border border-[#D6D3D1] rounded-lg transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. REVENUE METRICS ROW (Required Revenue Breakdown) */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
          Revenue Breakdown (PKR)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Today's Revenue */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-[#78716C]">Today's Revenue</span>
            <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
              {formatPkr(stats?.todayRevenue)}
            </p>
            <span className="text-[10px] text-[#A8A29E] block">Today's transactions</span>
          </div>

          {/* Yesterday's Revenue */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-[#78716C]">Yesterday's Revenue</span>
            <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
              {formatPkr(stats?.yesterdayRevenue)}
            </p>
            <span className="text-[10px] text-[#A8A29E] block">Previous day close</span>
          </div>

          {/* Current Month's Revenue */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-[#78716C]">Current Month</span>
            <p className="text-base font-bold font-serif text-[#059669] tabular-nums truncate">
              {formatPkr(stats?.currentMonthRevenue)}
            </p>
            <span className="text-[10px] text-[#A8A29E] block">Month-to-date sales</span>
          </div>

          {/* Previous Month's Revenue */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-[#78716C]">Previous Month</span>
            <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
              {formatPkr(stats?.previousMonthRevenue)}
            </p>
            <span className="text-[10px] text-[#A8A29E] block">Full previous month</span>
          </div>

          {/* Current Year's Revenue */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <span className="text-[11px] font-medium text-[#78716C]">Current Year</span>
            <p className="text-base font-bold font-serif text-[#92400E] tabular-nums truncate">
              {formatPkr(stats?.currentYearRevenue)}
            </p>
            <span className="text-[10px] text-[#A8A29E] block">Year-to-date</span>
          </div>

          {/* All-Time Revenue */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#B45309]/30 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-[#92400E]">All-Time Revenue</span>
            <p className="text-base font-bold font-serif text-[#78350F] tabular-nums truncate">
              {formatPkr(stats?.allTimeRevenue)}
            </p>
            <span className="text-[10px] text-[#78716C] block">Cumulative net</span>
          </div>
        </div>
      </div>

      {/* 2. ORDER & CUSTOMER SUMMARY CARDS */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase font-semibold text-[#78716C] tracking-wider">
          Order Status & Operational Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {/* Total Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1 cursor-pointer hover:border-[#92400E] transition-colors"
          >
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-[11px]">Total Orders</span>
              <ShoppingBag className="w-3.5 h-3.5 text-[#92400E]" />
            </div>
            <p className="text-xl font-bold font-serif text-[#1C1917] tabular-nums">{stats?.totalOrders}</p>
          </div>

          {/* Today's Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1 cursor-pointer hover:border-[#92400E] transition-colors"
          >
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-[11px]">Today's Orders</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xl font-bold font-serif text-[#1C1917] tabular-nums">{stats?.todayOrders}</p>
          </div>

          {/* Pending Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 shadow-2xs space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
          >
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-semibold">Pending</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold font-serif text-amber-900 tabular-nums">{stats?.pendingOrders}</p>
          </div>

          {/* Delivered Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 shadow-2xs space-y-1 cursor-pointer hover:border-emerald-400 transition-colors"
          >
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-semibold">Delivered</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold font-serif text-emerald-900 tabular-nums">{stats?.deliveredOrders}</p>
          </div>

          {/* Cancelled Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1 cursor-pointer hover:border-[#92400E] transition-colors"
          >
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-[11px]">Cancelled</span>
              <XCircle className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <p className="text-xl font-bold font-serif text-[#57534E] tabular-nums">{stats?.cancelledOrders}</p>
          </div>

          {/* Refunded Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1 cursor-pointer hover:border-[#92400E] transition-colors"
          >
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-[11px]">Refunded</span>
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-xl font-bold font-serif text-[#57534E] tabular-nums">{stats?.refundedOrders}</p>
          </div>

          {/* Average Order Value */}
          <div className="p-4 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[#78716C]">
              <span className="text-[11px]">Avg. Order Value</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#059669]" />
            </div>
            <p className="text-base font-bold font-serif text-[#1C1917] tabular-nums truncate">
              {formatPkr(stats?.averageOrderValue)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. INVENTORY & CUSTOMER HEALTH ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-5 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#92400E] transition-colors"
        >
          <div>
            <span className="text-xs text-[#78716C]">Total Registered Customers</span>
            <p className="text-2xl font-bold font-serif text-[#1C1917] tabular-nums mt-1">{stats?.totalCustomers}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center text-[#92400E]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Products */}
        <div
          onClick={() => onNavigateTab('products')}
          className="p-5 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#92400E] transition-colors"
        >
          <div>
            <span className="text-xs text-[#78716C]">Total Catalog Products</span>
            <p className="text-2xl font-bold font-serif text-[#1C1917] tabular-nums mt-1">{stats?.totalProducts}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] flex items-center justify-center text-[#92400E]">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Low-Stock Products */}
        <div
          onClick={() => onNavigateTab('categories_inventory')}
          className="p-5 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div>
            <span className="text-xs text-[#78716C]">Low-Stock Alerts</span>
            <p className={`text-2xl font-bold font-serif tabular-nums mt-1 ${(stats?.lowStockProducts || 0) > 0 ? 'text-amber-600' : 'text-[#1C1917]'}`}>
              {stats?.lowStockProducts}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Out-of-Stock Products */}
        <div
          onClick={() => onNavigateTab('categories_inventory')}
          className="p-5 rounded-xl bg-white border border-[#E7E2DA] shadow-2xs flex items-center justify-between cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div>
            <span className="text-xs text-[#78716C]">Out-of-Stock Products</span>
            <p className={`text-2xl font-bold font-serif tabular-nums mt-1 ${(stats?.outOfStockProducts || 0) > 0 ? 'text-rose-600' : 'text-[#1C1917]'}`}>
              {stats?.outOfStockProducts}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE SALES & ORDER TREND CHART */}
      <div className="bg-white rounded-xl border border-[#E7E2DA] p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1C1917]">
              14-Day Sales & Order Volume Trend
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Live transaction graph reflecting real order dates from the database.
            </p>
          </div>

          {/* Metric toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E7E2DA] rounded-lg">
            <button
              onClick={() => setActiveChartMetric('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeChartMetric === 'revenue'
                  ? 'bg-[#92400E] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Revenue (PKR)
            </button>
            <button
              onClick={() => setActiveChartMetric('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeChartMetric === 'orders'
                  ? 'bg-[#92400E] text-white shadow-2xs'
                  : 'text-[#78716C] hover:text-[#1C1917]'
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-2">
          {(!stats?.salesTrend || stats.salesTrend.length === 0) ? (
            <div className="py-16 text-center text-xs text-[#78716C]">
              No sales data recorded in this period.
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2">
              {stats.salesTrend.map((point) => {
                const heightPercent =
                  activeChartMetric === 'revenue'
                    ? Math.round((point.revenue / maxRevenue) * 100)
                    : Math.round((point.orders / maxOrders) * 100);

                const displayDate = new Date(point.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C1917] text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-20 font-mono">
                      {point.date}: {formatPkr(point.revenue)} ({point.orders} orders)
                    </div>

                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 min-h-[4px] ${
                        activeChartMetric === 'revenue'
                          ? 'bg-[#92400E] hover:bg-[#78350F]'
                          : 'bg-[#059669] hover:bg-[#047857]'
                      }`}
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                    <span className="text-[10px] text-[#A8A29E] mt-2 rotate-45 sm:rotate-0 truncate max-w-full font-mono">
                      {displayDate}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. QUICK ACTIONS STRIP */}
      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#57534E]">
          <span className="font-semibold text-[#1C1917]">Quick Administrator Actions:</span>
          <span>Instantly update catalog, edit storefront, or review pending orders.</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('products')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => onNavigateTab('website_editor')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-white border border-[#D6D3D1] hover:bg-neutral-50 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Edit Website</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-white border border-[#D6D3D1] hover:bg-neutral-50 rounded-md transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Process Orders</span>
          </button>
        </div>
      </div>
    </div>
  );
};
