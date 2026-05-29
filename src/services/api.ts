// src/services/api.ts
// Sri Ruchi Pachallu — Complete API service layer (Refactored)

import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  full_name?: string;
  avatar?: string | null;
}

export interface SavedAddress {
  id: number;
  label: string;
  first_name: string;
  last_name: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  landmark: string;
  is_default: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// ── Store Types ───────────────────────────────────────────────────────────────

export interface ProductVariant {
  id: number;
  label: string;           // "250g", "500g", "1 Kg", "Small Pack" — admin-defined
  price_override: string | null; // null → use product.price
  effective_price: string; // computed by backend: price_override ?? product.price
  effective_original_price: string | null;
  stock: number;
  in_stock: boolean;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  telugu_name?: string;       // e.g. "మామిడి ఆవకాయ"
  short_description: string;
  badge?: string;             // "Bestseller", "Hot", "Signature", "New", or blank
  category?: number;
  category_name?: string;
  image_url?: string | null;
  price: string;              // Base selling price (Decimal as string)
  original_price?: string | null; // MRP / strikethrough (always from product)
  discount_percent: number;   // Computed by backend
  variants: ProductVariant[];
  is_best_seller: boolean;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  product_count: number;
}

export interface CouponResult {
  valid: boolean;
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: string;
  discount_amount: string;
  description: string;
}

export interface ShippingConfig {
  name: string;
  flat_rate: string;
  free_shipping_above?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sriruchiToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/google') ||
        url.includes('/auth/signup');
      if (!isAuthRoute) {
        localStorage.removeItem('sriruchiToken');
        localStorage.removeItem('sriruchiUser');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const res = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = res.data;
    if (access) {
      localStorage.setItem('sriruchiToken', access);
      localStorage.setItem('sriruchiRefresh', refresh);
      localStorage.setItem('sriruchiUser', JSON.stringify(user));
    }
    return res.data;
  },

googleLogin: async (access_token: string): Promise<LoginResponse> => {
  const res = await api.post('/auth/google/', { access_token });
    const { access, refresh, user } = res.data;
    if (access) {
      localStorage.setItem('sriruchiToken', access);
      localStorage.setItem('sriruchiRefresh', refresh);
      localStorage.setItem('sriruchiUser', JSON.stringify(user));
    }
    return res.data;
  },

  signup: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
    phone?: string;
  }): Promise<LoginResponse> => {
    const res = await api.post('/auth/signup/', data);
    const { access, refresh, user } = res.data;
    if (access) {
      localStorage.setItem('sriruchiToken', access);
      localStorage.setItem('sriruchiRefresh', refresh);
      localStorage.setItem('sriruchiUser', JSON.stringify(user));
    }
    return res.data;
  },

  getProfile: async (): Promise<User> => (await api.get('/auth/user/')).data,

  updateProfile: async (
    data: FormData | Partial<{ first_name: string; last_name: string; phone: string }>
  ): Promise<User> => {
    const isFormData = data instanceof FormData;
    const res = await api.patch('/auth/user/', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    localStorage.setItem('sriruchiUser', JSON.stringify(res.data));
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('sriruchiToken');
    localStorage.removeItem('sriruchiRefresh');
    localStorage.removeItem('sriruchiUser');
  },

  isLoggedIn: () => !!localStorage.getItem('sriruchiToken'),

  getStoredUser: (): User | null => {
    const u = localStorage.getItem('sriruchiUser');
    return u ? JSON.parse(u) : null;
  },

  getSavedAddresses: async (): Promise<SavedAddress[]> =>
    (await api.get('/auth/addresses/')).data,

  saveAddress: async (data: Partial<SavedAddress> & { id?: number }): Promise<SavedAddress> => {
    if (data.id) return (await api.put(`/auth/addresses/${data.id}/`, data)).data;
    return (await api.post('/auth/addresses/', data)).data;
  },

  deleteAddress: async (id: number): Promise<void> =>
    (await api.delete(`/auth/addresses/${id}/`)).data,

  setDefaultAddress: async (id: number): Promise<SavedAddress> =>
    (await api.post(`/auth/addresses/${id}/set-default/`)).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const storeService = {
  getProducts: async (params?: {
    category?: string;    // category slug
    best_seller?: boolean;
    search?: string;
  }): Promise<Product[]> => {
    const query: Record<string, unknown> = { ...params };
    if (params?.best_seller) query.best_seller = 'true';
    return (await api.get('/store/products/', { params: query })).data;
  },

  getCategories: async (): Promise<Category[]> =>
    (await api.get('/store/categories/')).data,

  searchProducts: async (
    query: string
  ): Promise<{ products: Product[]; categories: Category[] }> => {
    if (!query.trim()) return { products: [], categories: [] };
    return (await api.get('/store/search/', { params: { q: query.trim() } })).data;
  },

  validateCoupon: async (code: string, orderTotal: number): Promise<CouponResult> =>
    (await api.post('/store/validate-coupon/', { code, order_total: orderTotal })).data,

  getActiveCoupons: async () => (await api.get('/store/active-coupons/')).data,

  getShippingConfig: async (): Promise<ShippingConfig> =>
    (await api.get('/store/shipping/')).data,
};

// ─────────────────────────────────────────────────────────────────────────────
// ORDER SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const orderService = {
  createOrder: async (orderData: unknown) =>
    (await api.post('/orders/checkout/', orderData)).data,

  getUserOrders: async (page = 1) =>
    (await api.get(`/orders/?page=${page}`)).data,

  getOrderDetail: async (id: number) =>
    (await api.get(`/orders/${id}/`)).data,

  cancelOrder: async (orderId: number) =>
    (await api.post(`/orders/${orderId}/cancel/`)).data,

  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => (await api.post('/payments/verify/', paymentData)).data,
};

export default api;