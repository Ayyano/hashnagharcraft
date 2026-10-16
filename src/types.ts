export interface BusinessSettings {
  brandName: string;
  businessPhone: string;
  businessEmail: string;
  whatsappNumber: string;
  countryCode: string;
  whatsappInternational: string;
  address: string;
  city: string;
  region: string;
  country: string;
  workingHours: string;
  supportNote: string;
  socialInstagram: string;
  socialFacebook: string;
  currency: string;
  timezone: string;
  returnPolicy: string;
}

export interface EmailServiceStatus {
  configured: boolean;
  provider: 'smtp' | 'sendgrid' | 'resend';
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  fromEmail: string;
  lastTestedAt: string | null;
  testStatus: 'unconfigured' | 'pending' | 'success' | 'failed';
  testMessage: string | null;
  hasPassword?: boolean;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  title: string;
  slogan: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  sizes: string[];
  colors: string[];
  materials: string;
  tags: string[];
  status: 'published' | 'draft';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  seoTitle: string;
  seoDescription: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export type ProductItem = Product;

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isVisible: boolean;
}

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  alt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'online';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingNumber: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

export interface ManualAdjustment {
  id: string;
  amount: number;
  type: 'income' | 'deduction';
  date: string;
  category: string;
  description: string;
  referenceNumber: string;
  administrator: string;
  createdAt: string;
}

export interface HeaderConfig {
  websiteName: string;
  announcementText: string;
  showAnnouncement: boolean;
  contactPhone: string;
  contactEmail: string;
  promoTagline: string;
}

export interface HeroConfig {
  heading: string;
  subtitle: string;
  description: string;
  heroImageUrl: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  textAlignment: 'left' | 'center' | 'right';
  imagePosition: 'right' | 'left' | 'background';
  isVisible: boolean;
}

export interface HomepageSection {
  id: string;
  type:
    | 'featured_categories'
    | 'featured_products'
    | 'best_sellers'
    | 'new_arrivals'
    | 'brand_story'
    | 'craftsmanship'
    | 'testimonials'
    | 'promo_banner'
    | 'footer_info';
  title: string;
  subtitle: string;
  description?: string;
  isVisible: boolean;
  order: number;
  customData?: any;
}

export interface FooterConfig {
  aboutText: string;
  copyrightText: string;
  showNewsletter: boolean;
}

export interface WebsiteContent {
  header: HeaderConfig;
  hero: HeroConfig;
  sections: HomepageSection[];
  footer: FooterConfig;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  adminEmail: string;
  timestamp: string;
  metadata?: any;
}

export interface CheckoutSettings {
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  bankDetails: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    instructions: string;
  };
  onlinePaymentsEnabled: boolean;
  onlinePaymentProvider: 'none' | 'stripe' | 'jazzcash' | 'easypaisa';
  onlinePaymentNotes: string;
  shippingFee: number;
  freeShippingThreshold: number;
}

export interface WhatsAppSettings {
  enabled: boolean;
  phoneNumber: string;
  countryCode: string;
  defaultMessage: string;
  productMessageTemplate: string;
  orderConfirmationTemplate: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'new' | 'read' | 'replied';
}

export type DateFilterType =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'previous_month'
  | 'this_year'
  | 'previous_year'
  | 'all_time'
  | 'custom';

export interface OverviewStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  currentYearRevenue: number;
  allTimeRevenue: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averageOrderValue: number;
  salesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}
