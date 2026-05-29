// src/pages/ProductsPage.tsx
// Sri Ruchi Pachallu — Products Listing Page (Refactored)
//
// Removed: food_type filter, FoodFilter type, FOOD_FILTERS constant, foodFilter state
// Kept:    category dropdown (fully dynamic from API), search, clear filters

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search,  X, Loader2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ProductCard } from '@/components/ProductCard';
import { storeService, type Product, type Category } from '@/services/api';

export default function ProductsPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Filters
  const [categorySlug, setCategorySlug] = useState<string>('all');
  const [query,        setQuery]        = useState('');

  useEffect(() => {
    document.title = 'Our Products — Sri Ruchi Pachallu';
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, cats] = await Promise.all([
        storeService.getProducts(),
        storeService.getCategories(),
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setError('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = useCallback(() => {
    setCategorySlug('all');
    setQuery('');
  }, []);

  const isFiltered = categorySlug !== 'all' || query.trim().length > 0;

  // Client-side filtering — fast, no extra API calls
  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (categorySlug !== 'all') {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat && p.category !== cat.id) return false;
      }
      // Search filter
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.telugu_name?.toLowerCase().includes(q) ?? false) ||
          p.short_description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categorySlug, query, categories]);

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative pt-12 pb-10 gradient-hero">
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="relative container mx-auto px-4 text-center">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Our Collection
            </span>
            <h1 className="mt-3 font-display text-5xl md:text-6xl font-bold">
              All <span className="text-gradient-spice">Products</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Handcrafted Andhra &amp; Telangana flavors — pick your jar, choose a size, delivered to your door.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">

          {/* ── Filter bar ── */}
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 justify-between glass rounded-2xl p-3 shadow-soft mb-8">

              {/* Dynamic category buttons */}
<div className="flex items-center gap-2 flex-wrap">
  <button
    onClick={() => setCategorySlug('all')}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
      categorySlug === 'all'
        ? 'bg-primary text-primary-foreground shadow-warm'
        : 'hover:bg-primary/10'
    }`}
  >
    All
  </button>

  {categories.map((c) => (
    <button
      key={c.slug}
      onClick={() => setCategorySlug(c.slug)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
        categorySlug === c.slug
          ? 'bg-primary text-primary-foreground shadow-warm'
          : 'hover:bg-primary/10'
      }`}
    >
      {c.name}
    </button>
  ))}
</div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-background border border-border focus:border-primary focus:outline-none text-sm"
                  />
                </div>

                {/* Clear filters */}
                {isFiltered && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-6">
              {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-primary hover:underline text-xs font-medium"
                >
                  (clear filters)
                </button>
              )}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading products…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-destructive font-medium">{error}</p>
              <button
                onClick={fetchAll}
                className="mt-4 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl mb-2">🫙</p>
              <p className="text-muted-foreground">No products match your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-primary hover:underline text-sm font-medium"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Product grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}

        </div>
      </section>
    </div>
  );
}