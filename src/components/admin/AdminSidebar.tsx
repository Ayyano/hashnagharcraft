import React from 'react';
import {
  LayoutDashboard,
  Palette,
  Package,
  Image as ImageIcon,
  ShoppingBag,
  Users,
  Layers,
  BarChart3,
  Scale,
  MessageCircle,
  CreditCard,
  Settings,
  ShieldAlert,
  FileText,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Store,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'website_editor'
  | 'products'
  | 'media'
  | 'orders'
  | 'customers'
  | 'categories_inventory'
  | 'analytics'
  | 'adjustments'
  | 'whatsapp'
  | 'payments'
  | 'settings'
  | 'security'
  | 'audit'
  | 'inquiries';

export interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export interface NavSection {
  group: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  pendingOrdersCount: number;
  lowStockCount: number;
  inquiriesCount: number;
  onBackToStore: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  pendingOrdersCount,
  lowStockCount,
  inquiriesCount,
  onBackToStore,
}) => {
  const navSections: NavSection[] = [
    {
      group: 'Core Management',
      items: [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'website_editor', label: 'Website Editor', icon: Palette, badge: 'Live' },
      ],
    },
    {
      group: 'Commerce & Catalog',
      items: [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'media', label: 'Media Library', icon: ImageIcon },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : undefined, badgeColor: 'bg-[#92400E] text-white' },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'categories_inventory', label: 'Categories & Inventory', icon: Layers, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
      ],
    },
    {
      group: 'Financial Intelligence',
      items: [
        { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
        { id: 'adjustments', label: 'Manual Adjustments', icon: Scale },
      ],
    },
    {
      group: 'Operations & Settings',
      items: [
        { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageCircle },
        { id: 'payments', label: 'Payments & Checkout', icon: CreditCard },
        { id: 'settings', label: 'Business Settings', icon: Settings },
        { id: 'security', label: 'Security & Access', icon: ShieldAlert },
        { id: 'audit', label: 'Audit Trail Logs', icon: FileText },
        { id: 'inquiries', label: 'Customer Inquiries', icon: Mail, badge: inquiriesCount > 0 ? `${inquiriesCount}` : undefined },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#1C1917] text-[#D6D3D1] border-r border-[#292524] flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#292524] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-[#92400E] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0 shadow-sm border border-[#B45309]">
            HC
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h2 className="font-serif font-bold text-sm text-[#FAF8F5] tracking-tight truncate">
                Hashtnaghar Crafts
              </h2>
              <p className="text-[10px] text-[#A8A29E] tracking-wider uppercase">
                Admin Control Guild
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded text-[#78716C] hover:text-[#FAF8F5] hover:bg-[#292524] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.group} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] uppercase font-semibold text-[#78716C] tracking-wider pb-1">
                {section.group}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#92400E] text-white shadow-xs font-semibold'
                      : 'text-[#A8A29E] hover:text-[#FAF8F5] hover:bg-[#292524]'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#78716C]'}`} />
                  {!isCollapsed && <span className="truncate text-left flex-1">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                        item.badgeColor || 'bg-[#292524] text-[#D97706]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer shortcut to storefront */}
      <div className="p-3 border-t border-[#292524] space-y-2">
        <button
          onClick={onBackToStore}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#292524] text-xs font-medium text-[#FAF8F5] hover:bg-[#3E2723] hover:text-white transition-colors"
          title="Return to customer website"
        >
          <Store className="w-4 h-4 text-[#D97706]" />
          {!isCollapsed && <span>View Storefront</span>}
        </button>
      </div>
    </aside>
  );
};
