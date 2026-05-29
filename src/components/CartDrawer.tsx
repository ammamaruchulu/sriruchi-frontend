// src/components/CartDrawer.tsx
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, total, clear } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout'); // Redirects to your new Checkout page
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 bottom-0 z-[70] flex w-full max-w-[100vw] flex-col bg-background shadow-warm sm:w-[520px]"
          >
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-display text-2xl font-bold text-primary">Your Cart</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <ShoppingBag className="h-10 w-10 text-primary/40" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl border p-3">
                      <img src={item.image} className="h-16 w-16 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                        <div className="flex items-center justify-between mt-2">
                           <div className="flex items-center bg-muted rounded-full">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1"><Minus className="h-3 w-3"/></button>
                              <span className="w-6 text-center text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1"><Plus className="h-3 w-3"/></button>
                           </div>
                           <div className="text-right">
  <p className="font-bold text-primary text-sm">
    ₹{(item.price * item.quantity).toLocaleString()}
  </p>

  {item.originalPrice && item.originalPrice > item.price && (
    <p className="text-[11px] text-muted-foreground line-through">
      ₹{(item.originalPrice * item.quantity).toLocaleString()}
    </p>
  )}
</div>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-card">
              <div className="mb-4 rounded-xl bg-muted/50 border border-border p-3 text-xs text-muted-foreground text-center leading-relaxed">
  Shipping charges & coupon discounts will be calculated at checkout
</div>
              <div className="flex justify-between mb-4">
                <span className="font-bold">Total</span>
                <span className="font-display text-2xl font-bold text-primary">₹{total}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-white py-3.5 rounded-full font-bold hover:bg-primary/90 transition-all"
              >
                Proceed to Checkout
              </button>
              <button
  onClick={clear}
  className="w-full mt-3 border border-destructive/20 text-destructive py-3 rounded-full font-medium hover:bg-destructive/10 transition-all"
>
  Clear Cart
</button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
