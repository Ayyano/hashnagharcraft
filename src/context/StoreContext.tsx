import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BusinessSettings,
  Product,
  Category,
  WebsiteContent,
  CheckoutSettings,
  WhatsAppSettings,
  OrderItem,
} from '../types.ts';

interface CartItem extends OrderItem {
  maxStock: number;
}

interface StoreContextType {
  settings: BusinessSettings;
  websiteContent: WebsiteContent | null;
  categories: Category[];
  products: Product[];
  checkoutSettings: CheckoutSettings | null;
  whatsAppSettings: WhatsAppSettings | null;
  loading: boolean;
  refreshStoreData: () => Promise<void>;
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // WhatsApp helper
  getWhatsappUrl: (message?: string) => string;
  getProductWhatsappUrl: (product: Product) => string;
  getOrderWhatsappUrl: (orderNumber: string, total: number) => string;
}

const defaultSettings: BusinessSettings = {
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
};

const StoreContext = createContext<StoreContextType>({
  settings: defaultSettings,
  websiteContent: null,
  categories: [],
  products: [],
  checkoutSettings: null,
  whatsAppSettings: null,
  loading: true,
  refreshStoreData: async () => {},
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartQuantity: () => {},
  clearCart: () => {},
  cartCount: 0,
  cartSubtotal: 0,
  isCartOpen: false,
  setIsCartOpen: () => {},
  getWhatsappUrl: () => 'https://wa.me/923709956956',
  getProductWhatsappUrl: () => 'https://wa.me/923709956956',
  getOrderWhatsappUrl: () => 'https://wa.me/923709956956',
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings | null>(null);
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Cart in local state with sessionStorage cache
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('hc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('hc_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const refreshStoreData = useCallback(async () => {
    try {
      const res = await fetch('/api/public/storefront');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.websiteContent) setWebsiteContent(data.websiteContent);
        if (data.categories) setCategories(data.categories);
        if (data.products) setProducts(data.products);
        if (data.checkoutSettings) setCheckoutSettings(data.checkoutSettings);
        if (data.whatsAppSettings) setWhatsAppSettings(data.whatsAppSettings);
      }
    } catch (err) {
      console.warn('Could not fetch public storefront data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStoreData();
  }, [refreshStoreData]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        const primaryImg = product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || '';
        const newItem: CartItem = {
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: Math.min(product.stock, quantity),
          selectedSize: size || product.sizes[0],
          selectedColor: color || product.colors[0],
          image: primaryImg,
          maxStock: product.stock,
        };
        return [...prev, newItem];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.selectedSize === size && item.selectedColor === color))
    );
  };

  const updateCartQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.selectedSize === size && item.selectedColor === color) {
          return { ...item, quantity: Math.min(item.maxStock, quantity) };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // WhatsApp helper
  const getWhatsappUrl = useCallback(
    (message?: string) => {
      const number = settings.whatsappInternational || '923709956956';
      const text = message || whatsAppSettings?.defaultMessage || `Hello ${settings.brandName}! I am inquiring about your handcrafted products.`;
      return `https://wa.me/${number}?text=${encodeURIComponent(text.trim())}`;
    },
    [settings.whatsappInternational, settings.brandName, whatsAppSettings?.defaultMessage]
  );

  const getProductWhatsappUrl = useCallback(
    (product: Product) => {
      const number = settings.whatsappInternational || '923709956956';
      let template = whatsAppSettings?.productMessageTemplate || 'Hello Hashtnaghar Crafts! I am interested in ordering: "{productTitle}" (PKR {productPrice}). Please confirm availability and sizing options.';
      template = template
        .replace('{productTitle}', product.title)
        .replace('{productPrice}', product.price.toLocaleString('en-PK'));
      return `https://wa.me/${number}?text=${encodeURIComponent(template)}`;
    },
    [settings.whatsappInternational, whatsAppSettings?.productMessageTemplate]
  );

  const getOrderWhatsappUrl = useCallback(
    (orderNumber: string, total: number) => {
      const number = settings.whatsappInternational || '923709956956';
      let template = whatsAppSettings?.orderConfirmationTemplate || 'Hello Hashtnaghar Crafts! I have placed Order #{orderNumber} for PKR {orderTotal}. Please confirm my shipment.';
      template = template
        .replace('{orderNumber}', orderNumber)
        .replace('{orderTotal}', total.toLocaleString('en-PK'));
      return `https://wa.me/${number}?text=${encodeURIComponent(template)}`;
    },
    [settings.whatsappInternational, whatsAppSettings?.orderConfirmationTemplate]
  );

  return (
    <StoreContext.Provider
      value={{
        settings,
        websiteContent,
        categories,
        products,
        checkoutSettings,
        whatsAppSettings,
        loading,
        refreshStoreData,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        getWhatsappUrl,
        getProductWhatsappUrl,
        getOrderWhatsappUrl,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
