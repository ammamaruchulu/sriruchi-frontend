// src/components/ProductCard.tsx
// Sri Ruchi Pachallu — Product Card (Refactored)
//
// Pricing logic:
//   effectivePrice    = variant.effective_price  (backend computes: price_override ?? product.price)
//   strikethrough     = product.original_price   (always from product, never from variant)
//   discount display  = product.discount_percent (backend computed)
//
// Removed: food_type badge, variant-level original_price, discount_percent on variant

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Check, Trash2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Product, ProductVariant } from '@/services/api';
import { useCart } from '@/contexts/CartContext';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const activeVariants: ProductVariant[] = product.variants.filter((v) => v.is_active);
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const { addItem, hasItem, removeItem, setIsOpen, buyNow } = useCart();
  const navigate = useNavigate();

  const variant = activeVariants[variantIdx];
  if (!variant) return null; // No active variants — skip rendering

  const cartId = `${product.slug}-${variant.id}`;
  const inCart = hasItem(cartId);

  // Effective price — already computed by backend
  const effectivePrice    = parseFloat(variant.effective_price);
  const originalPrice = variant.effective_original_price
  ? parseFloat(variant.effective_original_price)
  : null;
  const showStrikethrough = originalPrice !== null && originalPrice > effectivePrice;

  const buildCartItem = () => ({
    id:          cartId,
    productSlug: product.slug,
    variantId:   variant.id,
    name:        product.name,
    image:       product.image_url || '',
    size:        variant.label,
    price:       effectivePrice,
    originalPrice: originalPrice || effectivePrice,
    quantity:    qty,
    stock:       variant.stock,
  });

  const handleAddToCart = () => {
    addItem(buildCartItem());
    setQty(1);
  };

  const handleBuyNow = () => {
    buyNow(buildCartItem(), navigate);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group bg-card rounded-2xl overflow-hidden border shadow-soft hover:shadow-warm transition-shadow flex flex-col"
    >
      {/* ── Image ── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image_url || '/placeholder.jpg'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Custom badge — "Hot", "Signature", "New", etc. */}
        {product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide shadow-warm">
            {product.badge}
          </span>
        )}

        {/* Bestseller ribbon */}
        {product.is_best_seller && !product.badge && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wide">
            Bestseller
          </span>
        )}

        {/* Discount badge — based on product-level discount_percent */}
        {product.discount_percent > 0 && (
          <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-wider">
            {product.discount_percent}% OFF
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-bold leading-tight">{product.name}</h3>

        {product.telugu_name && (
          <p className="text-sm text-muted-foreground mt-0.5">{product.telugu_name}</p>
        )}

        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {product.short_description}
        </p>

        {/* ── Variant picker ── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {activeVariants.map((v, i) => (
            <button
              key={v.id}
              onClick={() => { setVariantIdx(i); setQty(1); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                i === variantIdx
                  ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                  : 'bg-background border-border hover:border-primary/40'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* ── Price + Quantity ── */}
        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-display text-2xl font-bold text-primary">
              ₹{effectivePrice.toLocaleString('en-IN')}
            </span>
            {showStrikethrough && (
              <span className="text-xs text-muted-foreground line-through">
                ₹{originalPrice!.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs text-muted-foreground">/ {variant.label}</span>
          </div>

          {/* Quantity stepper */}
          <div className="inline-flex items-center bg-muted rounded-full">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="p-1.5 hover:text-primary transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-sm font-semibold w-6 text-center">{qty}</span>
            <button
              onClick={() =>
  setQty((q) => Math.min(variant.stock, q + 1))
}
              className="p-1.5 hover:text-primary transition-colors disabled:opacity-40"
disabled={qty >= variant.stock}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Out of stock */}
        {!variant.in_stock && (
          <p className="mt-3 text-xs font-bold text-destructive text-center uppercase tracking-wider">
            Out of Stock
          </p>
        )}

        {/* ── CTA Buttons ── */}
        {inCart ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsOpen(true)}
              className="py-3 rounded-full bg-leaf/15 text-leaf font-semibold flex items-center justify-center gap-2 hover:bg-leaf/25 transition-all text-sm"
            >
              <Check className="h-4 w-4" /> In Cart
            </button>
            <button
              onClick={() => removeItem(cartId)}
              className="py-3 rounded-full bg-muted text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all text-sm"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
  <button
    onClick={handleAddToCart}
    disabled={!variant.in_stock}
    className="py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all shadow-soft hover:shadow-warm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
  >
    <ShoppingCart className="h-4 w-4" />
    <span className="hidden sm:inline">Add to Cart</span>
  </button>

  <button
    onClick={handleBuyNow}
    disabled={!variant.in_stock}
    className="py-3 rounded-full border-2 border-primary text-primary font-semibold flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Zap className="h-4 w-4" />
    <span className="hidden sm:inline">Buy Now</span>
  </button>
</div>
        )}
      </div>
    </motion.div>
  );
}