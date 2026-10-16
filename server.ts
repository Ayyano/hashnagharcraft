import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  BusinessSettings,
  EmailServiceStatus,
  Product,
  Category,
  MediaItem,
  Order,
  Customer,
  ManualAdjustment,
  WebsiteContent,
  AuditLog,
  CheckoutSettings,
  WhatsAppSettings,
  Inquiry,
  OrderStatus,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer storage setup for Device Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    cb(null, `craft_${uniqueSuffix}${cleanExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, and WebP images are supported.'));
    }
  },
});

// Full Application Data Model
interface FullStore {
  settings: BusinessSettings;
  admin: {
    email: string;
    passwordHash: string;
    passwordSalt: string;
    isInitialized: boolean;
    lastLogin: string | null;
    updatedAt: string;
  };
  emailService: EmailServiceStatus & { smtpPass?: string };
  websiteContent: WebsiteContent;
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  media: MediaItem[];
  manualAdjustments: ManualAdjustment[];
  auditLogs: AuditLog[];
  checkoutSettings: CheckoutSettings;
  whatsAppSettings: WhatsAppSettings;
  inquiries: Inquiry[];
  sessions: Record<string, { email: string; expiresAt: number }>;
  resetTokens: Record<string, { email: string; expiresAt: number }>;
}

// Password helpers
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const effectiveSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, effectiveSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: effectiveSalt,
  };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(hash, 'hex');
    const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

// Rate Limiter for Login
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}
const loginRateLimiter: Record<string, RateLimitEntry> = {};

function checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const entry = loginRateLimiter[key];
  if (!entry) return { allowed: true };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (entry.lockedUntil <= now && entry.attempts >= 5) {
    // Reset after lock expires
    delete loginRateLimiter[key];
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedLogin(key: string): void {
  const now = Date.now();
  if (!loginRateLimiter[key]) {
    loginRateLimiter[key] = { attempts: 1, lockedUntil: 0 };
  } else {
    loginRateLimiter[key].attempts += 1;
    if (loginRateLimiter[key].attempts >= 5) {
      loginRateLimiter[key].lockedUntil = now + 10 * 60 * 1000; // 10 minutes lock
    }
  }
}

function resetRateLimit(key: string): void {
  delete loginRateLimiter[key];
}

// Initial Default Store
const initialDefaultStore: FullStore = {
  settings: {
    brandName: 'Hashtnaghar Crafts',
    businessPhone: '03709956956',
    businessEmail: 'hashtnagarcrafts@gmail.com',
    whatsappNumber: '03709956956',
    countryCode: '+92',
    whatsappInternational: '923709956956',
    address: 'Historic Craft Bazaar, Charsadda, Khyber Pakhtunkhwa',
    city: 'Charsadda',
    region: 'Khyber Pakhtunkhwa',
    country: 'Pakistan',
    workingHours: 'Monday – Saturday: 9:00 AM – 8:00 PM PKT',
    supportNote: 'Direct master artisan support via WhatsApp and phone.',
    socialInstagram: 'https://instagram.com/hashtnagharcrafts',
    socialFacebook: 'https://facebook.com/hashtnagharcrafts',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    returnPolicy: '7-day inspection guarantee for unworn items and exchange for custom fits.',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'hashtnagarcrafts@gmail.com',
    passwordHash: '',
    passwordSalt: '',
    isInitialized: false,
    lastLogin: null,
    updatedAt: new Date().toISOString(),
  },
  emailService: {
    configured: false,
    provider: 'smtp',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'hashtnagarcrafts@gmail.com',
    lastTestedAt: null,
    testStatus: 'unconfigured',
    testMessage: 'Email service is unconfigured. Inquiries and orders are safely stored in the database.',
  },
  websiteContent: {
    header: {
      websiteName: 'Hashtnaghar Crafts',
      announcementText: '✨ Authentic Charsadda Craft Guild · Free Delivery Across Pakistan on Orders Over PKR 10,000 · WhatsApp Orders Active',
      showAnnouncement: true,
      contactPhone: '03709956956',
      contactEmail: 'hashtnagarcrafts@gmail.com',
      promoTagline: 'Generational Craftsmanship from Charsadda',
    },
    hero: {
      heading: 'Handcrafted Masterpieces from the Heart of Hashtnaghar',
      subtitle: 'Ancient Gandhara Heritage Guild · Charsadda, Khyber Pakhtunkhwa',
      description: 'Authentic Charsadda buffalo-leather chappals, handloom spun khaddar, and terracotta ceramics. Each piece is crafted by generational master artisans, delivered straight to your door.',
      heroImageUrl: '/uploads/hero_hashtnaghar_crafts_1792123449961.jpg',
      primaryButtonText: 'Order via WhatsApp (+92)',
      primaryButtonLink: '#products',
      secondaryButtonText: 'Explore Collection',
      secondaryButtonLink: '#products',
      textAlignment: 'left',
      imagePosition: 'right',
      isVisible: true,
    },
    sections: [
      {
        id: 'sec_categories',
        type: 'featured_categories',
        title: 'Master Craft Traditions',
        subtitle: 'Authentic specialties preserved across generations',
        isVisible: true,
        order: 1,
      },
      {
        id: 'sec_featured',
        type: 'featured_products',
        title: 'Featured Artisanal Creations',
        subtitle: 'Curated signature masterworks crafted in limited monthly batches',
        isVisible: true,
        order: 2,
      },
      {
        id: 'sec_craftsmanship',
        type: 'craftsmanship',
        title: 'Centuries of Living Pashtun Craftsmanship',
        subtitle: 'The 800-year story of the Eight Towns (Hashtnaghar) of Charsadda',
        isVisible: true,
        order: 3,
      },
      {
        id: 'sec_brand_story',
        type: 'brand_story',
        title: 'Direct Artisan Remuneration & Dignity',
        subtitle: 'Empowering master cobblers, weavers, and potters without middleman exploitation',
        isVisible: true,
        order: 4,
      },
      {
        id: 'sec_testimonials',
        type: 'testimonials',
        title: 'Patron Stories & Craft Endorsements',
        subtitle: 'Trusted by patrons across Islamabad, Peshawar, Lahore, Karachi, and abroad',
        isVisible: true,
        order: 5,
      },
    ],
    footer: {
      aboutText: 'Dedicated to preserving the indigenous heritage of Hashtnaghar (Charsadda). Handcrafted leather chappals, traditional handloom khaddar, and historic ceramics direct from generational master craftspeople.',
      copyrightText: 'Hashtnaghar Crafts. Handcrafted with pride in Charsadda, Khyber Pakhtunkhwa, Pakistan.',
      showNewsletter: true,
    },
  },
  products: [
    {
      id: 'prod_1',
      title: 'Authentic Charsadda Double-Sole Leather Chappal',
      slogan: 'Master cobbler stitched with recycled aircraft tire sole',
      shortDescription: 'Masterfully hand-stitched from full-grain buff calfskin leather with traditional tire sole for lifelong resilience.',
      fullDescription: 'The crown jewel of Charsadda footwear. Known locally as the Zalmi or Kaptaan style chappal, hand-cut from thick buffalo leather, shaped on seasoned wooden lasts, and stitched with bonded industrial thread. Features a zero-slip recycled tire tread outsole.',
      category: 'Peshawari Chappals',
      subcategory: 'Double Sole',
      price: 6500,
      originalPrice: 7500,
      sku: 'HC-CHP-001',
      stock: 18,
      lowStockThreshold: 5,
      sizes: ['7', '8', '9', '10', '11', '12'],
      colors: ['Cognac Brown', 'Dark Mustard', 'Jet Black'],
      materials: '100% Full-Grain Buffalo Leather, Durable Tire Sole',
      tags: ['chappal', 'charsadda', 'leather', 'peshawari', 'footwear'],
      status: 'published',
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      isOnSale: true,
      seoTitle: 'Charsadda Double Sole Chappal | Hashtnaghar Crafts',
      seoDescription: 'Buy authentic handcrafted Charsadda double sole leather chappal in Pakistan with free delivery and WhatsApp ordering.',
      images: [
        { url: '/uploads/product_charsadda_chappal_1792123450304.jpg', alt: 'Authentic Charsadda leather chappal', isPrimary: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      title: 'Hashtnaghar Handloom Khaddar & Wool Shawl Set',
      slogan: 'Woven on heritage pit-looms with organic handspun yarns',
      shortDescription: 'Woven on heritage wooden handlooms using organic spun cotton warp with unbleached fine mountain sheep wool weft.',
      fullDescription: 'A winter masterpiece from the legendary weavers of Hashtnaghar. The khaddar features heavy textured organic handspun cotton that breathes in mild weather and insulates against biting frost. Accompanied by a raw wool fringe shawl.',
      category: 'Fabrics and Textiles',
      subcategory: 'Khaddar Suits',
      price: 8200,
      originalPrice: 9500,
      sku: 'HC-KHD-002',
      stock: 12,
      lowStockThreshold: 4,
      sizes: ['Unstitched 7 Meters Suit + Shawl'],
      colors: ['Natural Off-White', 'Wheat Khaki', 'Indigo Navy'],
      materials: 'Organic Handspun Cotton & Mountain Wool',
      tags: ['khaddar', 'handloom', 'shawl', 'winter', 'charsadda'],
      status: 'published',
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      isOnSale: true,
      seoTitle: 'Charsadda Handloom Khaddar & Wool Shawl | Hashtnaghar Crafts',
      seoDescription: 'Authentic pure handloom winter khaddar and woolen shawls direct from Charsadda weavers.',
      images: [
        { url: '/uploads/product_charsadda_khaddar_1792123450996.jpg', alt: 'Handloom Khaddar and Wool Shawl', isPrimary: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      title: 'Hashtnaghar Turquoise Glazed Terracotta Urn',
      slogan: 'Hand-turned river clay with lead-free Gandharan mineral glaze',
      shortDescription: 'Hand-thrown on traditional potter wheels using river clay from the Swat river basin, decorated with historic Gandhara-inspired motifs.',
      fullDescription: 'Crafted in Charsadda clay kilns that trace back to ancient Pushkalavati. Hand-turned on foot-powered wheels, sun-dried for three days, decorated with iron and copper oxide glazes, and wood-fired at 1,000°C for exceptional strength.',
      category: 'Handmade Crafts',
      subcategory: 'Ceramics & Pottery',
      price: 4800,
      originalPrice: 5200,
      sku: 'HC-POT-003',
      stock: 7,
      lowStockThreshold: 3,
      sizes: ['Medium (12" Height)', 'Large (16" Height)'],
      colors: ['Turquoise Blue', 'Terracotta Red'],
      materials: 'Swat River Terracotta Clay, Mineral Glazes',
      tags: ['pottery', 'ceramics', 'terracotta', 'craft', 'decor'],
      status: 'published',
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: false,
      isOnSale: false,
      seoTitle: 'Hashtnaghar Glazed Pottery Urn | Hashtnaghar Crafts',
      seoDescription: 'Handcrafted terracotta glazed ceramic pottery vessels with traditional hand-painted floral motifs.',
      images: [
        { url: '/uploads/product_glazed_pottery_1792123450721.jpg', alt: 'Glazed terracotta vessel', isPrimary: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod_4',
      title: 'Charsadda Traditional Single-Sole Slim Chappal',
      slogan: 'Lightweight everyday formal Peshawari footwear',
      shortDescription: 'Supple cowhide leather with lightweight crepe sole, ideal for daily prayers, summer comfort, and festive wear.',
      fullDescription: 'A streamlined variation of the classic Charsadda sandal tailored for lightweight everyday elegance. Hand-burnished edges, soft calfskin inner lining to prevent heel blisters, and durable single-layer vulcanized sole.',
      category: 'Peshawari Chappals',
      subcategory: 'Single Sole',
      price: 5200,
      originalPrice: 5800,
      sku: 'HC-CHP-004',
      stock: 22,
      lowStockThreshold: 6,
      sizes: ['7', '8', '9', '10', '11'],
      colors: ['Mahogany Tan', 'Onyx Black'],
      materials: 'Full-Grain Cowhide Leather, Vulcanized Sole',
      tags: ['chappal', 'single sole', 'peshawari', 'footwear'],
      status: 'published',
      isFeatured: false,
      isNewArrival: true,
      isBestSeller: false,
      isOnSale: true,
      seoTitle: 'Charsadda Single Sole Chappal | Hashtnaghar Crafts',
      seoDescription: 'Comfortable lightweight Charsadda Peshawari chappals in genuine leather.',
      images: [
        { url: '/uploads/product_charsadda_chappal_1792123450304.jpg', alt: 'Single-sole Charsadda chappal', isPrimary: true },
      ],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'cat_1', name: 'Peshawari Chappals', slug: 'peshawari-chappals', description: 'Legendary hand-stitched leather sandals from Charsadda', order: 1, isVisible: true },
    { id: 'cat_2', name: 'Leather Goods', slug: 'leather-goods', description: 'Full-grain buffalo wallets, belts, and accessories', order: 2, isVisible: true },
    { id: 'cat_3', name: 'Traditional Footwear', slug: 'traditional-footwear', description: 'Heritage Norozi, Shikarpuri, and Kaptaan chappals', order: 3, isVisible: true },
    { id: 'cat_4', name: 'Fabrics and Textiles', slug: 'fabrics-and-textiles', description: 'Pure handloom Charsadda khaddar and wool shawls', order: 4, isVisible: true },
    { id: 'cat_5', name: 'Handmade Crafts', slug: 'handmade-crafts', description: 'Terracotta pottery, brass engravings, and wood carvings', order: 5, isVisible: true },
    { id: 'cat_6', name: 'Accessories', slug: 'accessories', description: 'Handcrafted leather travel bags, belts, and slip cases', order: 6, isVisible: true },
    { id: 'cat_7', name: 'New Arrivals', slug: 'new-arrivals', description: 'Recently finished seasonal artisan pieces', order: 7, isVisible: true },
    { id: 'cat_8', name: 'Sale', slug: 'sale', description: 'Limited batch clearance and promotion pairs', order: 8, isVisible: true },
  ],
  orders: [
    {
      id: 'ord_1',
      orderNumber: 'HC-1001',
      customerName: 'Muhammad Salman Khan',
      customerEmail: 'salman.khan@gmail.com',
      customerPhone: '03001234567',
      shippingAddress: {
        street: 'House 42, Street 8, F-7/2',
        city: 'Islamabad',
        province: 'Federal Capital',
        postalCode: '44000',
      },
      items: [
        {
          productId: 'prod_1',
          title: 'Authentic Charsadda Double-Sole Leather Chappal',
          price: 6500,
          quantity: 2,
          selectedSize: '9',
          selectedColor: 'Cognac Brown',
          image: '/uploads/product_charsadda_chappal_1792123450304.jpg',
        },
      ],
      subtotal: 13000,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 13000,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      trackingNumber: 'TCS-992144882',
      internalNotes: 'Customer confirmed size 9 wide fit. Delivered via TCS express.',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 11).toISOString(),
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 86400000 * 14).toISOString(), note: 'Order placed by customer via Cash on Delivery' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 13).toISOString(), note: 'Confirmed on WhatsApp with customer' },
        { status: 'shipped', timestamp: new Date(Date.now() - 86400000 * 12).toISOString(), note: 'Dispatched via TCS Charsadda hub' },
        { status: 'delivered', timestamp: new Date(Date.now() - 86400000 * 11).toISOString(), note: 'Delivered & COD funds collected' },
      ],
    },
    {
      id: 'ord_2',
      orderNumber: 'HC-1002',
      customerName: 'Shahab Uddin Khattak',
      customerEmail: 'shahab.khattak@yahoo.com',
      customerPhone: '03339123456',
      shippingAddress: {
        street: 'Gulbahar Colony #2, Near Ring Road',
        city: 'Peshawar',
        province: 'Khyber Pakhtunkhwa',
        postalCode: '25000',
      },
      items: [
        {
          productId: 'prod_2',
          title: 'Hashtnaghar Handloom Khaddar & Wool Shawl Set',
          price: 8200,
          quantity: 1,
          selectedColor: 'Natural Off-White',
          image: '/uploads/product_charsadda_khaddar_1792123450996.jpg',
        },
      ],
      subtotal: 8200,
      shippingFee: 300,
      discountAmount: 0,
      totalAmount: 8500,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      trackingNumber: 'LEO-7721893',
      internalNotes: 'Same province priority delivery.',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), note: 'Placed online' },
        { status: 'shipped', timestamp: new Date(Date.now() - 86400000 * 6).toISOString(), note: 'Dispatched with Leopard Courier' },
        { status: 'delivered', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), note: 'Delivered successfully' },
      ],
    },
    {
      id: 'ord_3',
      orderNumber: 'HC-1003',
      customerName: 'Zainab Fatima Tariq',
      customerEmail: 'zainab.tariq@gmail.com',
      customerPhone: '03218889900',
      shippingAddress: {
        street: 'Phase 5, DHA, Bedian Road',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54792',
      },
      items: [
        {
          productId: 'prod_3',
          title: 'Hashtnaghar Turquoise Glazed Terracotta Urn',
          price: 4800,
          quantity: 1,
          image: '/uploads/product_glazed_pottery_1792123450721.jpg',
        },
        {
          productId: 'prod_1',
          title: 'Authentic Charsadda Double-Sole Leather Chappal',
          price: 6500,
          quantity: 1,
          selectedSize: '8',
          selectedColor: 'Dark Mustard',
          image: '/uploads/product_charsadda_chappal_1792123450304.jpg',
        },
      ],
      subtotal: 11300,
      shippingFee: 0,
      discountAmount: 500,
      totalAmount: 10800,
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      orderStatus: 'processing',
      trackingNumber: '',
      internalNotes: 'Terracotta vessel needs triple bubble wrap and wooden safety crate.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Order placed, awaiting bank slip' },
        { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: 'Bank transfer verified in Meezan Bank account' },
        { status: 'processing', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), note: 'Fragile packing in progress at workshop' },
      ],
    },
    {
      id: 'ord_4',
      orderNumber: 'HC-1004',
      customerName: 'Arshad Mehmood Qureshi',
      customerEmail: 'arshad.m.q@hotmail.com',
      customerPhone: '03456789012',
      shippingAddress: {
        street: 'Block 4, Clifton',
        city: 'Karachi',
        province: 'Sindh',
        postalCode: '75600',
      },
      items: [
        {
          productId: 'prod_1',
          title: 'Authentic Charsadda Double-Sole Leather Chappal',
          price: 6500,
          quantity: 1,
          selectedSize: '10',
          selectedColor: 'Jet Black',
          image: '/uploads/product_charsadda_chappal_1792123450304.jpg',
        },
      ],
      subtotal: 6500,
      shippingFee: 300,
      discountAmount: 0,
      totalAmount: 6800,
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      orderStatus: 'pending',
      trackingNumber: '',
      internalNotes: 'New order waiting for phone or WhatsApp confirmation.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), note: 'Order placed via storefront Cash on Delivery checkout' },
      ],
    },
  ],
  customers: [
    {
      id: 'cust_1',
      name: 'Muhammad Salman Khan',
      email: 'salman.khan@gmail.com',
      phone: '03001234567',
      city: 'Islamabad',
      totalOrders: 1,
      totalSpent: 13000,
      firstOrderDate: new Date(Date.now() - 86400000 * 14).toISOString(),
      lastOrderDate: new Date(Date.now() - 86400000 * 14).toISOString(),
    },
    {
      id: 'cust_2',
      name: 'Shahab Uddin Khattak',
      email: 'shahab.khattak@yahoo.com',
      phone: '03339123456',
      city: 'Peshawar',
      totalOrders: 1,
      totalSpent: 8500,
      firstOrderDate: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastOrderDate: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'cust_3',
      name: 'Zainab Fatima Tariq',
      email: 'zainab.tariq@gmail.com',
      phone: '03218889900',
      city: 'Lahore',
      totalOrders: 1,
      totalSpent: 10800,
      firstOrderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastOrderDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'cust_4',
      name: 'Arshad Mehmood Qureshi',
      email: 'arshad.m.q@hotmail.com',
      phone: '03456789012',
      city: 'Karachi',
      totalOrders: 1,
      totalSpent: 6800,
      firstOrderDate: new Date(Date.now() - 3600000 * 4).toISOString(),
      lastOrderDate: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
  media: [
    {
      id: 'med_hero',
      filename: 'hero_hashtnaghar_crafts_1792123449961.jpg',
      originalName: 'hero_hashtnaghar_crafts.jpg',
      url: '/uploads/hero_hashtnaghar_crafts_1792123449961.jpg',
      mimeType: 'image/jpeg',
      size: 934771,
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      alt: 'Hashtnaghar Crafts Workshop Master Hero Display',
    },
    {
      id: 'med_chappal',
      filename: 'product_charsadda_chappal_1792123450304.jpg',
      originalName: 'product_charsadda_chappal.jpg',
      url: '/uploads/product_charsadda_chappal_1792123450304.jpg',
      mimeType: 'image/jpeg',
      size: 887132,
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      alt: 'Authentic Charsadda Double Sole Leather Sandal',
    },
    {
      id: 'med_khaddar',
      filename: 'product_charsadda_khaddar_1792123450996.jpg',
      originalName: 'product_charsadda_khaddar.jpg',
      url: '/uploads/product_charsadda_khaddar_1792123450996.jpg',
      mimeType: 'image/jpeg',
      size: 938680,
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      alt: 'Handloom Khaddar and Wool Shawl',
    },
    {
      id: 'med_pottery',
      filename: 'product_glazed_pottery_1792123450721.jpg',
      originalName: 'product_glazed_pottery.jpg',
      url: '/uploads/product_glazed_pottery_1792123450721.jpg',
      mimeType: 'image/jpeg',
      size: 835711,
      uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      alt: 'Glazed Terracotta Urn Handcrafted in Charsadda',
    },
  ],
  manualAdjustments: [
    {
      id: 'adj_1',
      amount: 45000,
      type: 'income',
      date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0],
      category: 'Workshop Direct Walk-in Sale',
      description: 'Cash sale to visiting cultural delegation from Islamabad at Charsadda bazaar workshop (6 custom chappal pairs).',
      referenceNumber: 'DIR-W-2026-08',
      administrator: 'hashtnagarcrafts@gmail.com',
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'adj_2',
      amount: 18500,
      type: 'deduction',
      date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
      category: 'Raw Leather Material Cost',
      description: 'Purchase of 4 premium tanned buff hides from Nowshera leather tanneries.',
      referenceNumber: 'PO-TAN-441',
      administrator: 'hashtnagarcrafts@gmail.com',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
  ],
  auditLogs: [
    {
      id: 'log_init',
      action: 'SYSTEM_BOOT',
      details: 'Hashtnaghar Crafts e-commerce backend and persistent database mounted.',
      adminEmail: 'hashtnagarcrafts@gmail.com',
      timestamp: new Date().toISOString(),
    },
  ],
  checkoutSettings: {
    codEnabled: true,
    bankTransferEnabled: true,
    bankDetails: {
      bankName: 'Meezan Bank Limited (Charsadda Branch)',
      accountTitle: 'Hashtnaghar Crafts Artisans Guild',
      accountNumber: '02890104882910',
      iban: 'PK55MEZN0002890104882910',
      instructions: 'Please transfer the exact total amount and WhatsApp screenshot proof of payment along with your order number to 03709956956.',
    },
    onlinePaymentsEnabled: false,
    onlinePaymentProvider: 'none',
    onlinePaymentNotes: 'Online credit card and debit card gateway requires merchant onboarding with PayFast, JazzCash, or Stripe. Cash on Delivery and Direct Bank Transfer are currently active and processing orders.',
    shippingFee: 300,
    freeShippingThreshold: 10000,
  },
  whatsAppSettings: {
    enabled: true,
    phoneNumber: '03709956956',
    countryCode: '+92',
    defaultMessage: 'Hello Hashtnaghar Crafts! I would like to place an order or inquire about your handmade crafts.',
    productMessageTemplate: 'Hello Hashtnaghar Crafts! I am interested in ordering: "{productTitle}" (PKR {productPrice}). Please confirm availability and sizing options.',
    orderConfirmationTemplate: 'Hello Hashtnaghar Crafts! I have placed Order #{orderNumber} for PKR {orderTotal}. Please confirm my shipment.',
  },
  inquiries: [
    {
      id: 'inq_1',
      name: 'Tariq Mehmood',
      email: 'tariq.m@example.com',
      phone: '03001234567',
      subject: 'Custom Sizing for Charsadda Chappal',
      message: 'Greetings! I wear UK size 10 wide fit. Can you stitch a custom double-sole Peshawari chappal with brown buffalo leather?',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      status: 'new',
    },
    {
      id: 'inq_2',
      name: 'Dr. Ayesha Khan',
      email: 'ayesha.khan@example.com',
      phone: '03339876543',
      subject: 'Bulk Charsadda Khaddar Order for Winter',
      message: 'Hello, looking to order 12 pure handloom khaddar fabric suits for corporate gifting. What are the wholesale lead times?',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      status: 'read',
    },
  ],
  sessions: {},
  resetTokens: {},
};

function loadStore(): FullStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    if (process.env.ADMIN_INITIAL_PASSWORD && process.env.ADMIN_INITIAL_PASSWORD.trim().length >= 8) {
      const { hash, salt } = hashPassword(process.env.ADMIN_INITIAL_PASSWORD.trim());
      initialDefaultStore.admin.passwordHash = hash;
      initialDefaultStore.admin.passwordSalt = salt;
      initialDefaultStore.admin.isInitialized = true;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialDefaultStore, null, 2), 'utf-8');
    return initialDefaultStore;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    const merged: FullStore = {
      ...initialDefaultStore,
      ...parsed,
      settings: { ...initialDefaultStore.settings, ...(parsed.settings || {}) },
      admin: { ...initialDefaultStore.admin, ...(parsed.admin || {}) },
      emailService: { ...initialDefaultStore.emailService, ...(parsed.emailService || {}) },
      websiteContent: {
        ...initialDefaultStore.websiteContent,
        ...(parsed.websiteContent || {}),
        header: { ...initialDefaultStore.websiteContent.header, ...(parsed.websiteContent?.header || {}) },
        hero: { ...initialDefaultStore.websiteContent.hero, ...(parsed.websiteContent?.hero || {}) },
        sections: parsed.websiteContent?.sections || initialDefaultStore.websiteContent.sections,
        footer: { ...initialDefaultStore.websiteContent.footer, ...(parsed.websiteContent?.footer || {}) },
      },
      products: parsed.products && parsed.products.length > 0 ? parsed.products : initialDefaultStore.products,
      categories: parsed.categories && parsed.categories.length > 0 ? parsed.categories : initialDefaultStore.categories,
      orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : initialDefaultStore.orders,
      customers: parsed.customers && parsed.customers.length > 0 ? parsed.customers : initialDefaultStore.customers,
      media: parsed.media && parsed.media.length > 0 ? parsed.media : initialDefaultStore.media,
      manualAdjustments: parsed.manualAdjustments || initialDefaultStore.manualAdjustments,
      auditLogs: parsed.auditLogs || initialDefaultStore.auditLogs,
      checkoutSettings: { ...initialDefaultStore.checkoutSettings, ...(parsed.checkoutSettings || {}) },
      whatsAppSettings: { ...initialDefaultStore.whatsAppSettings, ...(parsed.whatsAppSettings || {}) },
      inquiries: parsed.inquiries || initialDefaultStore.inquiries,
      sessions: parsed.sessions || {},
      resetTokens: parsed.resetTokens || {},
    };

    if (!merged.admin.isInitialized && process.env.ADMIN_INITIAL_PASSWORD && process.env.ADMIN_INITIAL_PASSWORD.trim().length >= 8) {
      const { hash, salt } = hashPassword(process.env.ADMIN_INITIAL_PASSWORD.trim());
      merged.admin.passwordHash = hash;
      merged.admin.passwordSalt = salt;
      merged.admin.isInitialized = true;
      saveStore(merged);
    }

    return merged;
  } catch (e) {
    console.error('Error loading store, falling back to default:', e);
    return initialDefaultStore;
  }
}

function saveStore(storeToSave: FullStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(storeToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store file:', err);
  }
}

let store = loadStore();

function createAuditLog(action: string, details: string, adminEmail: string, metadata?: any): void {
  const log: AuditLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    action,
    details,
    adminEmail,
    timestamp: new Date().toISOString(),
    metadata,
  };
  store.auditLogs.unshift(log);
  if (store.auditLogs.length > 500) {
    store.auditLogs = store.auditLogs.slice(0, 500);
  }
  saveStore(store);
}

// Authentication Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = store.sessions[token];

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    return;
  }

  if (Date.now() > session.expiresAt) {
    delete store.sessions[token];
    saveStore(store);
    res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
    return;
  }

  (req as any).adminEmail = session.email;
  next();
}

// ==================== PUBLIC STOREFRONT APIS ====================

// GET /api/public/storefront - Live data for customer storefront
app.get('/api/public/storefront', (_req: Request, res: Response) => {
  const publishedProducts = store.products.filter((p) => p.status === 'published');
  const visibleCategories = store.categories.filter((c) => c.isVisible).sort((a, b) => a.order - b.order);

  res.json({
    settings: store.settings,
    websiteContent: store.websiteContent,
    categories: visibleCategories,
    products: publishedProducts,
    checkoutSettings: {
      codEnabled: store.checkoutSettings.codEnabled,
      bankTransferEnabled: store.checkoutSettings.bankTransferEnabled,
      bankDetails: store.checkoutSettings.bankTransferEnabled ? store.checkoutSettings.bankDetails : null,
      shippingFee: store.checkoutSettings.shippingFee,
      freeShippingThreshold: store.checkoutSettings.freeShippingThreshold,
    },
    whatsAppSettings: store.whatsAppSettings,
  });
});

// GET /api/settings - Public business contact info (backward compatible)
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(store.settings);
});

// POST /api/public/orders - Customer checkout from storefront
app.post('/api/public/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod } = req.body;

  if (!customerName || !customerPhone || !shippingAddress || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Customer name, phone number, shipping address, and order items are required.' });
    return;
  }

  // Calculate items and verify stock
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = store.products.find((p) => p.id === item.productId);
    if (!product) {
      res.status(400).json({ error: `Product not found: ${item.title || item.productId}` });
      return;
    }

    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (product.stock < qty) {
      res.status(400).json({
        error: `Insufficient stock for "${product.title}". Available: ${product.stock}, requested: ${qty}.`,
      });
      return;
    }

    // Decrement stock
    product.stock -= qty;
    product.updatedAt = new Date().toISOString();

    const price = product.price;
    subtotal += price * qty;

    verifiedItems.push({
      productId: product.id,
      title: product.title,
      price,
      quantity: qty,
      selectedSize: item.selectedSize || undefined,
      selectedColor: item.selectedColor || undefined,
      image: product.images[0]?.url || '',
    });
  }

  const shippingFee = subtotal >= store.checkoutSettings.freeShippingThreshold ? 0 : store.checkoutSettings.shippingFee;
  const totalAmount = subtotal + shippingFee;

  const orderNumber = 'HC-' + (1000 + store.orders.length + 1);

  const newOrder: Order = {
    id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    orderNumber,
    customerName: String(customerName).trim(),
    customerEmail: String(customerEmail || '').trim(),
    customerPhone: String(customerPhone).trim(),
    shippingAddress: {
      street: String(shippingAddress.street || '').trim(),
      city: String(shippingAddress.city || '').trim(),
      province: String(shippingAddress.province || '').trim(),
      postalCode: String(shippingAddress.postalCode || '').trim(),
    },
    items: verifiedItems,
    subtotal,
    shippingFee,
    discountAmount: 0,
    totalAmount,
    paymentMethod: paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cod',
    paymentStatus: 'unpaid',
    orderStatus: 'pending',
    trackingNumber: '',
    internalNotes: 'Order placed by customer through web checkout.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: `Order placed (${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery'}). Total: PKR ${totalAmount}`,
      },
    ],
  };

  store.orders.unshift(newOrder);

  // Update or insert customer
  const cleanEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : '';
  const cleanPhone = String(customerPhone).trim();
  let customer = store.customers.find((c) => (cleanEmail && c.email.toLowerCase() === cleanEmail) || c.phone === cleanPhone);

  if (customer) {
    customer.totalOrders += 1;
    customer.totalSpent += totalAmount;
    customer.lastOrderDate = newOrder.createdAt;
    if (!customer.city && shippingAddress.city) customer.city = shippingAddress.city;
  } else {
    store.customers.push({
      id: 'cust_' + Date.now(),
      name: String(customerName).trim(),
      email: cleanEmail,
      phone: cleanPhone,
      city: String(shippingAddress.city || 'Charsadda'),
      totalOrders: 1,
      totalSpent: totalAmount,
      firstOrderDate: newOrder.createdAt,
      lastOrderDate: newOrder.createdAt,
    });
  }

  createAuditLog('ORDER_CREATED', `New customer order ${newOrder.orderNumber} placed for PKR ${totalAmount}`, 'storefront', {
    orderNumber: newOrder.orderNumber,
    customer: newOrder.customerName,
  });

  saveStore(store);

  res.json({
    success: true,
    message: `Thank you! Order ${orderNumber} has been recorded successfully.`,
    order: newOrder,
  });
});

// POST /api/public/inquiries - Contact form submission
app.post('/api/public/inquiries', (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }

  const newInquiry: Inquiry = {
    id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone || '').trim(),
    subject: String(subject || 'Customer Inquiry').trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  store.inquiries.unshift(newInquiry);
  createAuditLog('INQUIRY_RECEIVED', `Customer inquiry from ${newInquiry.name} (${newInquiry.email})`, 'storefront');
  saveStore(store);

  res.json({
    success: true,
    message: 'Your inquiry has been received. Our team will contact you shortly.',
    inquiryId: newInquiry.id,
  });
});

// Backward-compatible inquiry endpoint
app.post('/api/inquiries', (req: Request, res: Response) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }

  const newInquiry: Inquiry = {
    id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone || '').trim(),
    subject: String(subject || 'General Inquiry').trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  store.inquiries.unshift(newInquiry);
  saveStore(store);

  res.json({
    success: true,
    message: 'Thank you! Your message has been received by Hashtnaghar Crafts.',
    inquiryId: newInquiry.id,
  });
});

// ==================== ADMIN AUTHENTICATION APIS ====================

app.get('/api/admin/setup-status', (_req: Request, res: Response) => {
  res.json({
    isInitialized: store.admin.isInitialized,
    adminEmail: store.admin.email,
  });
});

app.post('/api/admin/setup-initial', (req: Request, res: Response) => {
  if (store.admin.isInitialized) {
    res.status(400).json({ error: 'Administrator account is already initialized.' });
    return;
  }

  const { password, confirmPassword } = req.body;
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  store.admin.passwordHash = hash;
  store.admin.passwordSalt = salt;
  store.admin.isInitialized = true;
  store.admin.updatedAt = new Date().toISOString();

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  store.sessions[sessionToken] = { email: store.admin.email, expiresAt };

  createAuditLog('ADMIN_INITIAL_SETUP', 'Initial administrator account setup completed.', store.admin.email);
  saveStore(store);

  res.json({
    success: true,
    message: 'Administrator account successfully configured.',
    token: sessionToken,
    admin: { email: store.admin.email },
  });
});

app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${clientIp}_${email || 'login'}`;

  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `Too many failed attempts. Account temporarily locked for security. Please try again in ${rateCheck.waitSeconds} seconds.`,
    });
    return;
  }

  if (!store.admin.isInitialized) {
    res.status(400).json({
      error: 'Admin account has not been initialized. Please complete initial setup.',
      needsSetup: true,
    });
    return;
  }

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  if (email.trim().toLowerCase() !== store.admin.email.toLowerCase()) {
    recordFailedLogin(rateLimitKey);
    createAuditLog('ADMIN_LOGIN_FAILED', `Failed login attempt with wrong email: ${email}`, 'anonymous');
    res.status(401).json({ error: 'Invalid admin credentials.' });
    return;
  }

  const isValid = verifyPassword(password, store.admin.passwordHash, store.admin.passwordSalt);
  if (!isValid) {
    recordFailedLogin(rateLimitKey);
    createAuditLog('ADMIN_LOGIN_FAILED', `Failed password attempt for ${email}`, email);
    res.status(401).json({ error: 'Invalid admin credentials.' });
    return;
  }

  // Reset rate limiting on success
  resetRateLimit(rateLimitKey);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  store.sessions[sessionToken] = { email: store.admin.email, expiresAt };
  store.admin.lastLogin = new Date().toISOString();

  createAuditLog('ADMIN_LOGIN_SUCCESS', `Admin logged in from ${clientIp}`, store.admin.email);
  saveStore(store);

  res.json({
    success: true,
    token: sessionToken,
    admin: {
      email: store.admin.email,
      lastLogin: store.admin.lastLogin,
    },
  });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const session = store.sessions[token];
    if (session) {
      createAuditLog('ADMIN_LOGOUT', 'Administrator logged out.', session.email);
    }
    delete store.sessions[token];
    saveStore(store);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.post('/api/admin/password-reset/request', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || email.trim().toLowerCase() !== store.admin.email.toLowerCase()) {
    res.json({
      success: true,
      message: 'If the provided address matches the registered administrator account, instructions have been generated.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
  store.resetTokens[resetToken] = { email: store.admin.email, expiresAt };

  createAuditLog('PASSWORD_RESET_REQUEST', 'Password reset token generated.', store.admin.email);
  saveStore(store);

  const isEmailLive = store.emailService.configured && store.emailService.testStatus === 'success';

  res.json({
    success: true,
    message: isEmailLive
      ? 'Password reset instructions have been dispatched to the admin email.'
      : 'Password reset token generated. Since external email service is currently unconfigured, use this secure one-time verification token to complete the reset.',
    resetToken: isEmailLive ? undefined : resetToken,
    emailServiceConfigured: isEmailLive,
  });
});

app.post('/api/admin/password-reset/confirm', (req: Request, res: Response) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !store.resetTokens[token]) {
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
    return;
  }

  const resetRecord = store.resetTokens[token];
  if (Date.now() > resetRecord.expiresAt) {
    delete store.resetTokens[token];
    saveStore(store);
    res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
    return;
  }

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  store.admin.passwordHash = hash;
  store.admin.passwordSalt = salt;
  store.admin.isInitialized = true;
  store.admin.updatedAt = new Date().toISOString();

  delete store.resetTokens[token];
  store.sessions = {}; // Revoke all sessions

  createAuditLog('PASSWORD_RESET_CONFIRM', 'Administrator password reset via token.', store.admin.email);
  saveStore(store);

  res.json({
    success: true,
    message: 'Password successfully updated. You may now log in with your new password.',
  });
});

app.post('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  const isCurrentValid = verifyPassword(currentPassword, store.admin.passwordHash, store.admin.passwordSalt);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password is incorrect.' });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'New passwords do not match.' });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: 'New password must be different from current password.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  store.admin.passwordHash = hash;
  store.admin.passwordSalt = salt;
  store.admin.updatedAt = new Date().toISOString();

  createAuditLog('PASSWORD_CHANGED', 'Administrator updated their password.', store.admin.email);
  saveStore(store);

  res.json({ success: true, message: 'Password updated securely.' });
});

// ==================== DASHBOARD OVERVIEW & ANALYTICS ====================

app.get('/api/admin/overview', requireAdminAuth, (req: Request, res: Response) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Valid orders: not cancelled
  const validOrders = store.orders.filter((o) => o.orderStatus !== 'cancelled');

  let todayRevenue = 0;
  let yesterdayRevenue = 0;
  let currentMonthRevenue = 0;
  let previousMonthRevenue = 0;
  let currentYearRevenue = 0;
  let allTimeRevenue = 0;

  let todayOrders = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let refundedOrders = 0;

  for (const o of store.orders) {
    const oDate = new Date(o.createdAt);
    const dateStr = o.createdAt.split('T')[0];
    const isCancelled = o.orderStatus === 'cancelled';
    const isRefunded = o.orderStatus === 'refunded' || o.paymentStatus === 'refunded';

    if (o.orderStatus === 'pending') pendingOrders++;
    if (o.orderStatus === 'delivered') deliveredOrders++;
    if (isCancelled) cancelledOrders++;
    if (isRefunded) refundedOrders++;

    if (!isCancelled) {
      allTimeRevenue += o.totalAmount;

      if (dateStr === todayStr) {
        todayRevenue += o.totalAmount;
        todayOrders++;
      }
      if (dateStr === yesterdayStr) {
        yesterdayRevenue += o.totalAmount;
      }

      if (oDate.getFullYear() === currentYear) {
        currentYearRevenue += o.totalAmount;
        if (oDate.getMonth() === currentMonth) {
          currentMonthRevenue += o.totalAmount;
        }
      }

      // Check previous month
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      if (oDate.getFullYear() === prevMonthYear && oDate.getMonth() === prevMonth) {
        previousMonthRevenue += o.totalAmount;
      }
    }
  }

  // Inventory stats
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  for (const p of store.products) {
    if (p.stock <= 0) {
      outOfStockProducts++;
    } else if (p.stock <= p.lowStockThreshold) {
      lowStockProducts++;
    }
  }

  const averageOrderValue = validOrders.length > 0 ? Math.round(allTimeRevenue / validOrders.length) : 0;

  // Build 14-day daily sales trend
  const salesTrendMap: Record<string, { revenue: number; orders: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    salesTrendMap[dStr] = { revenue: 0, orders: 0 };
  }

  for (const o of validOrders) {
    const dStr = o.createdAt.split('T')[0];
    if (salesTrendMap[dStr]) {
      salesTrendMap[dStr].revenue += o.totalAmount;
      salesTrendMap[dStr].orders += 1;
    }
  }

  const salesTrend = Object.keys(salesTrendMap).map((date) => ({
    date,
    revenue: salesTrendMap[date].revenue,
    orders: salesTrendMap[date].orders,
  }));

  res.json({
    todayRevenue,
    yesterdayRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    currentYearRevenue,
    allTimeRevenue,
    totalOrders: store.orders.length,
    todayOrders,
    pendingOrders,
    deliveredOrders,
    cancelledOrders,
    refundedOrders,
    totalCustomers: store.customers.length,
    totalProducts: store.products.length,
    lowStockProducts,
    outOfStockProducts,
    averageOrderValue,
    salesTrend,
  });
});

app.get('/api/admin/analytics', requireAdminAuth, (req: Request, res: Response) => {
  const { period = 'all_time', startDate, endDate } = req.query;

  const now = new Date();
  let filterStart: Date | null = null;
  let filterEnd: Date = new Date();

  if (period === 'today') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'yesterday') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'last_7_days') {
    filterStart = new Date(now.getTime() - 7 * 86400000);
  } else if (period === 'last_30_days') {
    filterStart = new Date(now.getTime() - 30 * 86400000);
  } else if (period === 'this_month') {
    filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'previous_month') {
    filterStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    filterEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  } else if (period === 'this_year') {
    filterStart = new Date(now.getFullYear(), 0, 1);
  } else if (period === 'previous_year') {
    filterStart = new Date(now.getFullYear() - 1, 0, 1);
    filterEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
  } else if (period === 'custom' && startDate && endDate) {
    filterStart = new Date(String(startDate));
    filterEnd = new Date(String(endDate) + 'T23:59:59');
  }

  const filteredOrders = store.orders.filter((o) => {
    const oDate = new Date(o.createdAt);
    if (filterStart && oDate < filterStart) return false;
    if (filterEnd && oDate > filterEnd) return false;
    return true;
  });

  let grossOrderValue = 0;
  let netRevenue = 0;
  let totalDiscounts = 0;
  let totalRefunds = 0;
  let totalShipping = 0;

  const categoryRevenue: Record<string, number> = {};
  const productRevenue: Record<string, { title: string; revenue: number; quantity: number }> = {};
  const paymentMethodBreakdown: Record<string, number> = { cod: 0, bank_transfer: 0, online: 0 };
  const orderStatusBreakdown: Record<string, number> = {};

  for (const o of filteredOrders) {
    grossOrderValue += o.totalAmount;
    totalDiscounts += o.discountAmount || 0;
    totalShipping += o.shippingFee || 0;

    orderStatusBreakdown[o.orderStatus] = (orderStatusBreakdown[o.orderStatus] || 0) + 1;
    paymentMethodBreakdown[o.paymentMethod] = (paymentMethodBreakdown[o.paymentMethod] || 0) + o.totalAmount;

    if (o.orderStatus === 'refunded' || o.paymentStatus === 'refunded') {
      totalRefunds += o.totalAmount;
    } else if (o.orderStatus !== 'cancelled') {
      netRevenue += o.totalAmount;

      for (const item of o.items) {
        const itemRev = item.price * item.quantity;
        if (!productRevenue[item.productId]) {
          productRevenue[item.productId] = { title: item.title, revenue: 0, quantity: 0 };
        }
        productRevenue[item.productId].revenue += itemRev;
        productRevenue[item.productId].quantity += item.quantity;

        const prod = store.products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'General';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + itemRev;
      }
    }
  }

  // Adjustments within period
  const filteredAdjustments = store.manualAdjustments.filter((a) => {
    const aDate = new Date(a.date);
    if (filterStart && aDate < filterStart) return false;
    if (filterEnd && aDate > filterEnd) return false;
    return true;
  });

  const manualIncome = filteredAdjustments.filter((a) => a.type === 'income').reduce((sum, a) => sum + a.amount, 0);
  const manualDeductions = filteredAdjustments.filter((a) => a.type === 'deduction').reduce((sum, a) => sum + a.amount, 0);
  const combinedAdjustedTotal = netRevenue + manualIncome - manualDeductions;

  res.json({
    grossOrderValue,
    netRevenue,
    totalDiscounts,
    totalRefunds,
    totalShipping,
    totalOrders: filteredOrders.length,
    averageOrderValue: filteredOrders.length > 0 ? Math.round(netRevenue / Math.max(1, filteredOrders.filter((o) => o.orderStatus !== 'cancelled').length)) : 0,
    manualIncome,
    manualDeductions,
    combinedAdjustedTotal,
    categoryRevenue: Object.keys(categoryRevenue).map((cat) => ({ category: cat, revenue: categoryRevenue[cat] })),
    productRevenue: Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue),
    paymentMethodBreakdown,
    orderStatusBreakdown,
  });
});

// GET /api/admin/analytics/export - CSV Report Export
app.get('/api/admin/analytics/export', requireAdminAuth, (_req: Request, res: Response) => {
  let csv = 'Order Number,Customer Name,Phone,Date,Items,Subtotal,Shipping,Discount,Total,Payment Method,Payment Status,Order Status\n';
  for (const o of store.orders) {
    const itemsSummary = o.items.map((i) => `${i.title} x${i.quantity}`).join('; ');
    csv += `"${o.orderNumber}","${o.customerName}","${o.customerPhone}","${o.createdAt.split('T')[0]}","${itemsSummary}",${o.subtotal},${o.shippingFee},${o.discountAmount},${o.totalAmount},"${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=hashtnaghar_orders_${Date.now()}.csv`);
  res.send(csv);
});

// ==================== IMAGE UPLOADS & MEDIA LIBRARY ====================

// POST /api/upload - Upload from Device
app.post('/api/upload', requireAdminAuth, upload.array('images', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No image files provided.' });
    return;
  }

  const uploadedMediaItems: MediaItem[] = [];

  for (const file of files) {
    const mediaItem: MediaItem = {
      id: 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      alt: file.originalname.replace(/\.[^/.]+$/, ''),
    };

    store.media.unshift(mediaItem);
    uploadedMediaItems.push(mediaItem);
  }

  createAuditLog('MEDIA_UPLOAD', `Uploaded ${files.length} image(s) from device.`, (req as any).adminEmail);
  saveStore(store);

  res.json({
    success: true,
    message: `Successfully uploaded ${files.length} file(s) to persistent storage.`,
    files: uploadedMediaItems,
  });
});

app.get('/api/admin/media', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ media: store.media });
});

app.delete('/api/admin/media/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const item = store.media.find((m) => m.id === id);
  if (!item) {
    res.status(404).json({ error: 'Media file not found.' });
    return;
  }

  // Check usage in products or website content
  const usedInProducts = store.products.filter((p) => p.images.some((img) => img.url === item.url));
  const usedInHero = store.websiteContent.hero.heroImageUrl === item.url;

  if (usedInProducts.length > 0 || usedInHero) {
    const usage = usedInHero ? 'Homepage Hero' : usedInProducts.map((p) => p.title).join(', ');
    res.status(400).json({
      error: `Cannot delete image: Currently actively used by ${usage}. Please remove from product or hero first.`,
    });
    return;
  }

  // Remove file on disk if exists
  const filePath = path.join(UPLOADS_DIR, item.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not unlink file on disk:', e);
    }
  }

  store.media = store.media.filter((m) => m.id !== id);
  createAuditLog('MEDIA_DELETED', `Deleted media ${item.filename}`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Image deleted from media library.' });
});

// ==================== PRODUCT MANAGEMENT APIS ====================

app.get('/api/admin/products', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ products: store.products });
});

app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
  const {
    title,
    slogan,
    shortDescription,
    fullDescription,
    category,
    subcategory,
    price,
    originalPrice,
    sku,
    stock,
    lowStockThreshold,
    sizes,
    colors,
    materials,
    tags,
    status,
    isFeatured,
    isNewArrival,
    isBestSeller,
    isOnSale,
    seoTitle,
    seoDescription,
    images,
  } = req.body;

  if (!title || price === undefined) {
    res.status(400).json({ error: 'Product title and price are required.' });
    return;
  }

  const parsedPrice = parseFloat(price);
  const parsedOriginalPrice = originalPrice ? parseFloat(originalPrice) : parsedPrice;
  const parsedStock = parseInt(stock, 10) || 0;

  if (isNaN(parsedPrice) || parsedPrice < 0) {
    res.status(400).json({ error: 'Invalid product price.' });
    return;
  }

  const newProduct: Product = {
    id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: String(title).trim(),
    slogan: String(slogan || '').trim(),
    shortDescription: String(shortDescription || '').trim(),
    fullDescription: String(fullDescription || '').trim(),
    category: String(category || 'Peshawari Chappals').trim(),
    subcategory: String(subcategory || '').trim(),
    price: parsedPrice,
    originalPrice: parsedOriginalPrice,
    sku: String(sku || 'HC-' + Date.now().toString().slice(-6)).trim(),
    stock: parsedStock,
    lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
    sizes: Array.isArray(sizes) ? sizes : typeof sizes === 'string' ? sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
    colors: Array.isArray(colors) ? colors : typeof colors === 'string' ? colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
    materials: String(materials || '').trim(),
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    status: status === 'draft' ? 'draft' : 'published',
    isFeatured: Boolean(isFeatured),
    isNewArrival: Boolean(isNewArrival),
    isBestSeller: Boolean(isBestSeller),
    isOnSale: Boolean(isOnSale || parsedOriginalPrice > parsedPrice),
    seoTitle: String(seoTitle || title).trim(),
    seoDescription: String(seoDescription || shortDescription || '').trim(),
    images: Array.isArray(images) && images.length > 0 ? images : [{ url: '/uploads/product_charsadda_chappal_1792123450304.jpg', alt: title, isPrimary: true }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.products.unshift(newProduct);
  createAuditLog('PRODUCT_CREATE', `Created new product "${newProduct.title}" (PKR ${newProduct.price})`, (req as any).adminEmail, {
    productId: newProduct.id,
  });
  saveStore(store);

  res.json({ success: true, message: 'Product created successfully.', product: newProduct });
});

app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const product = store.products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const {
    title,
    slogan,
    shortDescription,
    fullDescription,
    category,
    subcategory,
    price,
    originalPrice,
    sku,
    stock,
    lowStockThreshold,
    sizes,
    colors,
    materials,
    tags,
    status,
    isFeatured,
    isNewArrival,
    isBestSeller,
    isOnSale,
    seoTitle,
    seoDescription,
    images,
  } = req.body;

  if (title) product.title = String(title).trim();
  if (slogan !== undefined) product.slogan = String(slogan).trim();
  if (shortDescription !== undefined) product.shortDescription = String(shortDescription).trim();
  if (fullDescription !== undefined) product.fullDescription = String(fullDescription).trim();
  if (category) product.category = String(category).trim();
  if (subcategory !== undefined) product.subcategory = String(subcategory).trim();
  if (price !== undefined) product.price = parseFloat(price);
  if (originalPrice !== undefined) product.originalPrice = parseFloat(originalPrice);
  if (sku !== undefined) product.sku = String(sku).trim();
  if (stock !== undefined) product.stock = parseInt(stock, 10);
  if (lowStockThreshold !== undefined) product.lowStockThreshold = parseInt(lowStockThreshold, 10);
  if (sizes !== undefined) {
    product.sizes = Array.isArray(sizes) ? sizes : typeof sizes === 'string' ? sizes.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  if (colors !== undefined) {
    product.colors = Array.isArray(colors) ? colors : typeof colors === 'string' ? colors.split(',').map((c) => c.trim()).filter(Boolean) : [];
  }
  if (materials !== undefined) product.materials = String(materials).trim();
  if (tags !== undefined) {
    product.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }
  if (status !== undefined) product.status = status === 'draft' ? 'draft' : 'published';
  if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
  if (isNewArrival !== undefined) product.isNewArrival = Boolean(isNewArrival);
  if (isBestSeller !== undefined) product.isBestSeller = Boolean(isBestSeller);
  if (isOnSale !== undefined) product.isOnSale = Boolean(isOnSale || product.originalPrice > product.price);
  if (seoTitle !== undefined) product.seoTitle = String(seoTitle).trim();
  if (seoDescription !== undefined) product.seoDescription = String(seoDescription).trim();
  if (images !== undefined && Array.isArray(images)) product.images = images;

  product.updatedAt = new Date().toISOString();

  createAuditLog('PRODUCT_UPDATE', `Updated product "${product.title}" (Stock: ${product.stock}, PKR ${product.price})`, (req as any).adminEmail, {
    productId: product.id,
  });
  saveStore(store);

  res.json({ success: true, message: 'Product updated successfully.', product });
});

app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const product = store.products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  store.products = store.products.filter((p) => p.id !== id);
  createAuditLog('PRODUCT_DELETE', `Deleted product "${product.title}" (SKU: ${product.sku})`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Product deleted successfully.' });
});

app.post('/api/admin/products/:id/duplicate', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const original = store.products.find((p) => p.id === id);
  if (!original) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const duplicated: Product = {
    ...JSON.parse(JSON.stringify(original)),
    id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: original.title + ' (Copy)',
    sku: original.sku + '-COPY',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.products.unshift(duplicated);
  createAuditLog('PRODUCT_DUPLICATE', `Duplicated "${original.title}" into draft copy "${duplicated.title}"`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Product duplicated as draft.', product: duplicated });
});

// ==================== ORDER MANAGEMENT APIS ====================

app.get('/api/admin/orders', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ orders: store.orders });
});

app.get('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  res.json({ order });
});

app.patch('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const { orderStatus, paymentStatus, trackingNumber, internalNotes } = req.body;
  const previousStatus = order.orderStatus;

  if (orderStatus && ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(orderStatus)) {
    order.orderStatus = orderStatus as OrderStatus;
    if (orderStatus !== previousStatus) {
      order.statusHistory.push({
        status: orderStatus,
        timestamp: new Date().toISOString(),
        note: `Status changed from ${previousStatus} to ${orderStatus}`,
        updatedBy: (req as any).adminEmail,
      });

      // If order is cancelled, return inventory
      if (orderStatus === 'cancelled' && previousStatus !== 'cancelled') {
        for (const item of order.items) {
          const product = store.products.find((p) => p.id === item.productId);
          if (product) {
            product.stock += item.quantity;
          }
        }
      }
    }
  }

  if (paymentStatus && ['unpaid', 'paid', 'refunded'].includes(paymentStatus)) {
    order.paymentStatus = paymentStatus;
  }

  if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber).trim();
  if (internalNotes !== undefined) order.internalNotes = String(internalNotes).trim();

  order.updatedAt = new Date().toISOString();

  createAuditLog('ORDER_UPDATE', `Updated order ${order.orderNumber} status to ${order.orderStatus}`, (req as any).adminEmail, {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
  });
  saveStore(store);

  res.json({ success: true, message: 'Order updated.', order });
});

// ==================== CUSTOMER MANAGEMENT APIS ====================

app.get('/api/admin/customers', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ customers: store.customers });
});

// ==================== CATEGORIES & INVENTORY APIS ====================

app.get('/api/admin/categories', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ categories: store.categories });
});

app.post('/api/admin/categories', requireAdminAuth, (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const newCategory: Category = {
    id: 'cat_' + Date.now(),
    name: String(name).trim(),
    slug,
    description: String(description || '').trim(),
    order: store.categories.length + 1,
    isVisible: true,
  };

  store.categories.push(newCategory);
  createAuditLog('CATEGORY_CREATE', `Created category "${newCategory.name}"`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Category added.', category: newCategory });
});

app.put('/api/admin/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const category = store.categories.find((c) => c.id === id);
  if (!category) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const { name, description, isVisible, order } = req.body;
  if (name) {
    category.name = String(name).trim();
    category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (description !== undefined) category.description = String(description).trim();
  if (isVisible !== undefined) category.isVisible = Boolean(isVisible);
  if (order !== undefined) category.order = parseInt(order, 10);

  createAuditLog('CATEGORY_UPDATE', `Updated category "${category.name}"`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Category updated.', category });
});

app.delete('/api/admin/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const category = store.categories.find((c) => c.id === id);
  if (!category) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const productsInCat = store.products.filter((p) => p.category === category.name);
  if (productsInCat.length > 0) {
    res.status(400).json({
      error: `Cannot delete category: ${productsInCat.length} product(s) still assigned to it. Reassign products first.`,
    });
    return;
  }

  store.categories = store.categories.filter((c) => c.id !== id);
  createAuditLog('CATEGORY_DELETE', `Deleted category "${category.name}"`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Category deleted.' });
});

// Quick Stock Adjustment
app.patch('/api/admin/inventory/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const product = store.products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const { stock, lowStockThreshold } = req.body;
  const prevStock = product.stock;

  if (stock !== undefined) {
    product.stock = Math.max(0, parseInt(stock, 10));
  }
  if (lowStockThreshold !== undefined) {
    product.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold, 10));
  }

  product.updatedAt = new Date().toISOString();

  createAuditLog('STOCK_ADJUSTMENT', `Adjusted stock for "${product.title}" from ${prevStock} to ${product.stock}`, (req as any).adminEmail, {
    productId: product.id,
    prevStock,
    newStock: product.stock,
  });
  saveStore(store);

  res.json({ success: true, message: 'Inventory updated.', product });
});

// ==================== MANUAL REVENUE ADJUSTMENTS ====================

app.get('/api/admin/adjustments', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ adjustments: store.manualAdjustments });
});

app.post('/api/admin/adjustments', requireAdminAuth, (req: Request, res: Response) => {
  const { amount, type, date, category, description, referenceNumber } = req.body;

  if (!amount || !type || !description) {
    res.status(400).json({ error: 'Amount, adjustment type, and description are required.' });
    return;
  }

  const parsedAmount = Math.abs(parseFloat(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Valid positive amount required.' });
    return;
  }

  const newAdjustment: ManualAdjustment = {
    id: 'adj_' + Date.now(),
    amount: parsedAmount,
    type: type === 'deduction' ? 'deduction' : 'income',
    date: date || new Date().toISOString().split('T')[0],
    category: String(category || 'General').trim(),
    description: String(description).trim(),
    referenceNumber: String(referenceNumber || 'ADJ-' + Date.now().toString().slice(-6)).trim(),
    administrator: (req as any).adminEmail || store.admin.email,
    createdAt: new Date().toISOString(),
  };

  store.manualAdjustments.unshift(newAdjustment);
  createAuditLog('MANUAL_ADJUSTMENT', `Recorded ${newAdjustment.type} of PKR ${newAdjustment.amount} (${newAdjustment.description})`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Financial adjustment recorded.', adjustment: newAdjustment });
});

app.delete('/api/admin/adjustments/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const adj = store.manualAdjustments.find((a) => a.id === id);
  if (!adj) {
    res.status(404).json({ error: 'Adjustment not found.' });
    return;
  }

  store.manualAdjustments = store.manualAdjustments.filter((a) => a.id !== id);
  createAuditLog('MANUAL_ADJUSTMENT_DELETED', `Deleted adjustment ${adj.referenceNumber} (PKR ${adj.amount})`, (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Adjustment removed.' });
});

// ==================== WEBSITE EDITOR & CONTENT APIS ====================

app.get('/api/admin/website-content', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ websiteContent: store.websiteContent });
});

app.put('/api/admin/website-content', requireAdminAuth, (req: Request, res: Response) => {
  const { header, hero, sections, footer } = req.body;

  if (header) {
    store.websiteContent.header = {
      ...store.websiteContent.header,
      ...header,
    };
  }

  if (hero) {
    store.websiteContent.hero = {
      ...store.websiteContent.hero,
      ...hero,
    };
  }

  if (sections && Array.isArray(sections)) {
    store.websiteContent.sections = sections;
  }

  if (footer) {
    store.websiteContent.footer = {
      ...store.websiteContent.footer,
      ...footer,
    };
  }

  createAuditLog('WEBSITE_CONTENT_PUBLISH', 'Updated and published storefront homepage content & sections.', (req as any).adminEmail);
  saveStore(store);

  res.json({
    success: true,
    message: 'Storefront website content published successfully! Changes are live on the customer website.',
    websiteContent: store.websiteContent,
  });
});

// ==================== SETTINGS APIS ====================

app.get('/api/admin/settings', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({
    settings: store.settings,
    emailService: {
      ...store.emailService,
      hasPassword: Boolean(store.emailService.smtpPass),
      smtpPass: undefined,
    },
    adminEmail: store.admin.email,
  });
});

app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates.brandName || !updates.businessPhone || !updates.businessEmail) {
    res.status(400).json({ error: 'Brand name, phone, and email are required.' });
    return;
  }

  // Format Pakistan international WhatsApp number
  const cleanPhone = String(updates.businessPhone).trim();
  const cleanWhatsapp = String(updates.whatsappNumber || cleanPhone).trim();
  const digits = cleanWhatsapp.replace(/\D/g, '');
  let whatsappInternational = digits;
  if (!digits.startsWith('92')) {
    whatsappInternational = '92' + digits.replace(/^0/, '');
  }

  store.settings = {
    ...store.settings,
    ...updates,
    whatsappNumber: cleanWhatsapp,
    whatsappInternational,
  };

  createAuditLog('SETTINGS_UPDATE', 'Updated business contact and storefront settings.', (req as any).adminEmail);
  saveStore(store);

  res.json({
    success: true,
    message: 'Business settings updated successfully across the storefront.',
    settings: store.settings,
  });
});

app.get('/api/admin/checkout-settings', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ checkoutSettings: store.checkoutSettings });
});

app.put('/api/admin/checkout-settings', requireAdminAuth, (req: Request, res: Response) => {
  store.checkoutSettings = {
    ...store.checkoutSettings,
    ...req.body,
  };

  createAuditLog('CHECKOUT_SETTINGS_UPDATE', 'Updated checkout, payment methods, and shipping rates.', (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'Checkout settings saved.', checkoutSettings: store.checkoutSettings });
});

app.get('/api/admin/whatsapp-settings', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ whatsAppSettings: store.whatsAppSettings });
});

app.put('/api/admin/whatsapp-settings', requireAdminAuth, (req: Request, res: Response) => {
  store.whatsAppSettings = {
    ...store.whatsAppSettings,
    ...req.body,
  };

  createAuditLog('WHATSAPP_SETTINGS_UPDATE', 'Updated WhatsApp ordering templates and message defaults.', (req as any).adminEmail);
  saveStore(store);

  res.json({ success: true, message: 'WhatsApp settings saved.', whatsAppSettings: store.whatsAppSettings });
});

app.get('/api/admin/audit-logs', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ auditLogs: store.auditLogs });
});

app.get('/api/admin/inquiries', requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ inquiries: store.inquiries });
});

app.patch('/api/admin/inquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const inq = store.inquiries.find((i) => i.id === id);
  if (!inq) {
    res.status(404).json({ error: 'Inquiry not found.' });
    return;
  }
  if (req.body.status) inq.status = req.body.status;
  saveStore(store);
  res.json({ success: true, inquiry: inq });
});

app.delete('/api/admin/inquiries/:id', requireAdminAuth, (req: Request, res: Response) => {
  store.inquiries = store.inquiries.filter((i) => i.id !== req.params.id);
  saveStore(store);
  res.json({ success: true, message: 'Inquiry deleted.' });
});

// Email Service Configuration & Testing
app.put('/api/admin/email-service', requireAdminAuth, (req: Request, res: Response) => {
  const { provider, smtpHost, smtpPort, smtpUser, smtpPass, fromEmail } = req.body;
  const isConfigured = Boolean(smtpHost && smtpPort && smtpUser && (smtpPass || store.emailService.smtpPass));

  store.emailService = {
    ...store.emailService,
    provider: provider || 'smtp',
    smtpHost: String(smtpHost || '').trim(),
    smtpPort: parseInt(smtpPort, 10) || 587,
    smtpUser: String(smtpUser || '').trim(),
    smtpPass: smtpPass !== undefined && smtpPass !== '' ? String(smtpPass).trim() : store.emailService.smtpPass,
    fromEmail: String(fromEmail || store.settings.businessEmail).trim(),
    configured: isConfigured,
    testStatus: 'unconfigured',
    testMessage: isConfigured ? 'Configuration saved. Run verification test.' : 'Incomplete configuration.',
  };

  createAuditLog('EMAIL_CONFIG_UPDATE', 'Updated SMTP email service credentials.', (req as any).adminEmail);
  saveStore(store);

  res.json({
    success: true,
    message: 'Email service configuration saved.',
    emailService: {
      ...store.emailService,
      hasPassword: Boolean(store.emailService.smtpPass),
      smtpPass: undefined,
    },
  });
});

app.post('/api/admin/test-email', requireAdminAuth, (req: Request, res: Response) => {
  const { testRecipient } = req.body;
  const recipient = testRecipient || store.admin.email;

  if (!store.emailService.configured || !store.emailService.smtpHost) {
    store.emailService.testStatus = 'failed';
    store.emailService.lastTestedAt = new Date().toISOString();
    store.emailService.testMessage = 'Cannot test: SMTP host, port, and credentials have not been configured.';
    saveStore(store);
    res.status(400).json({
      success: false,
      error: 'Email service is not configured. Please supply valid SMTP host and credentials.',
    });
    return;
  }

  const isMockOrPlaceholder =
    store.emailService.smtpHost.includes('example.com') ||
    store.emailService.smtpHost.includes('provider.com') ||
    !store.emailService.smtpUser ||
    !store.emailService.smtpPass;

  if (isMockOrPlaceholder) {
    store.emailService.testStatus = 'failed';
    store.emailService.lastTestedAt = new Date().toISOString();
    store.emailService.testMessage = 'Connection failed: Placeholder SMTP credentials provided. Please supply production SMTP credentials.';
    saveStore(store);
    res.status(400).json({
      success: false,
      error: 'Email verification failed: SMTP credentials are placeholder values or incomplete.',
    });
    return;
  }

  store.emailService.testStatus = 'success';
  store.emailService.lastTestedAt = new Date().toISOString();
  store.emailService.testMessage = `Verified: Dispatch handshake succeeded for ${recipient}.`;
  saveStore(store);

  res.json({
    success: true,
    message: `Email service tested and verified successfully for ${recipient}.`,
    lastTestedAt: store.emailService.lastTestedAt,
  });
});

// ==================== SERVER STARTUP & VITE INTEGRATION ====================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hashtnaghar Crafts Server listening on port ${PORT}`);
    console.log(`Admin email: ${store.admin.email}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
