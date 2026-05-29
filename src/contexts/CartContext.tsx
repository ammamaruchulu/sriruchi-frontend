// src/contexts/CartContext.tsx
// Sri Ruchi Pachallu — Cart Context
// Added: buyNow() — clears cart, adds item, navigates to /checkout

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export interface CartItem {
  id: string;           // `${product.slug}-${variant.id}` — unique per product+variant combo
  productSlug: string;
  variantId: number;
  name: string;
  image: string;
  size: string;         // variant label: "250g", "Small Pack", etc.
  price: number;
  originalPrice?: number;
  quantity: number;
  stock: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clear: () => void;
  hasItem: (id: string) => boolean;
  /**
   * Buy Now: clears the cart, adds just this item, then navigates to /checkout.
   * NavigateFn must be passed in (from useNavigate) since context can't use router hooks.
   */
  buyNow: (item: Omit<CartItem, 'quantity'> & { quantity?: number }, navigate: (path: string) => void) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'srp-cart-v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* noop */ }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback<CartContextValue['addItem']>((item) => {
  setItems((prev) => {
    const qty = item.quantity ?? 1;

    const existing = prev.find((p) => p.id === item.id);

    if (existing) {
      const newQty = existing.quantity + qty;

      if (newQty > item.stock) {
        return prev;
      }

      return prev.map((p) =>
        p.id === item.id
          ? { ...p, quantity: newQty }
          : p
      );
    }

    if (qty > item.stock) {
      return prev;
    }

    return [...prev, { ...item, quantity: qty }];
  });

 
}, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setItems((prev) =>
  prev.map((p) => {
    if (p.id !== id) return p;

    return {
      ...p,
      quantity: Math.min(qty, p.stock),
    };
  })
);
  }, [removeItem]);

  const clear = useCallback(() => setItems([]), []);

  const hasItem = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  const buyNow = useCallback<CartContextValue['buyNow']>((item, navigate) => {
    // Replace cart with just this item
    const qty = item.quantity ?? 1;
    setItems([{ ...item, quantity: qty }]);
    setIsOpen(false);
    navigate('/checkout');
  }, []);

  const { count, total } = useMemo(() => {
    let c = 0, t = 0;
    for (const i of items) { c += i.quantity; t += i.quantity * i.price; }
    return { count: c, total: t };
  }, [items]);

  return (
    <CartContext.Provider value={{
      items, count, total,
      isOpen, setIsOpen,
      addItem, removeItem, updateQuantity, clear, hasItem,
      buyNow,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}