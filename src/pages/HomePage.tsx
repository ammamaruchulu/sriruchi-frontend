// src/pages/HomePage.tsx
// Sri Ruchi Pachallu — Home Page
//
// Changed from previous version:
//   - Removed static `products` import from @/data/products
//   - Bestsellers now fetched from API using storeService.getProducts({ best_seller: true })
//   - Shows up to 6 bestsellers; falls back gracefully if none returned

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Leaf, Flame, ShieldCheck, Truck, Heart, Star } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { ProductCard } from '@/components/ProductCard';
import { storeService, type Product } from '@/services/api';
import hero1 from '@/assets/hero-pickle-1.jpg';
import hero2 from '@/assets/hero-pickle-2.jpg';
import hero3 from '@/assets/hero-pickle-3.jpg';
import hero4 from '@/assets/hero-pickle-4.jpg';
import aboutImg from '@/assets/about-process.jpg';
import spices from '@/assets/spices-banner.jpg';

const heroImages = [hero1, hero2, hero3, hero4];

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState<Product[]>([]);

  useEffect(() => {
    storeService.getProducts({ best_seller: true })
      .then((data) => setBestsellers((Array.isArray(data) ? data : []).slice(0, 6)))
      .catch(() => {/* fail silently on home page */});
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative gradient-hero">
        <div className="absolute inset-0 pattern-dots opacity-40" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/60 text-secondary-foreground text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Homemade since tradition began
              </span>
              <h1 className="mt-5 font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95]">
                <span className="text-foreground">Sri Ruchi</span>
                <br />
                <span className="text-gradient-spice">Pachallu</span>
              </h1>
              <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-lg">
                Homemade taste. Pure trust. Hand-crafted Andhra &amp; Telangana
                pickles bottled with love — one batch at a time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold shadow-warm hover:shadow-glow hover:scale-105 transition-all"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-background border-2 border-primary/20 text-foreground font-semibold hover:border-primary hover:bg-primary/5 transition-all"
                >
                  Explore Story
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">1000+</span> happy families served
                </p>
              </div>
            </motion.div>

            {/* Hero collage */}
            <div className="relative h-[480px] md:h-[560px]">
              <motion.div
                className="absolute -top-6 right-8 h-44 w-44 md:h-56 md:w-56 rounded-full bg-secondary/60 blur-3xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-8 left-0 h-44 w-44 md:h-56 md:w-56 rounded-full bg-primary/30 blur-3xl"
                animate={{ scale: [1.1, 1, 1.1] }}
                transition={{ duration: 7, repeat: Infinity }}
              />
              {heroImages.map((src, i) => {
                const positions = [
                  'top-0 left-4 md:left-12 w-48 md:w-60 rotate-[-6deg]',
                  'top-12 right-0 w-44 md:w-56 rotate-[8deg]',
                  'bottom-12 left-0 w-44 md:w-52 rotate-[5deg]',
                  'bottom-0 right-8 w-48 md:w-60 rotate-[-7deg]',
                ];
                return (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute ${positions[i]} aspect-square rounded-3xl overflow-hidden shadow-warm ring-4 ring-background animate-float`}
                    style={{ animationDelay: `${i * 0.6}s` }}
                  >
                    <img
                      src={src}
                      alt={`Pickle ${i + 1}`}
                      className="h-full w-full object-cover hover:scale-110 transition-transform duration-700"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg className="block w-full h-12 md:h-20 -mb-px text-background" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,40 C320,100 720,0 1440,60 L1440,100 L0,100 Z" />
        </svg>
      </section>

      {/* ── ABOUT PREVIEW ── */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 bg-secondary/30 rounded-3xl rotate-3" />
              <img
                src={aboutImg}
                alt="Traditional pickle making"
                loading="lazy"
                className="relative rounded-3xl shadow-warm w-full"
              />
              <div className="absolute -bottom-6 -right-6 glass rounded-2xl px-5 py-4 shadow-warm">
                <p className="font-display text-3xl font-bold text-primary">25+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Years of recipes</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Our Story</span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold leading-tight">
              A jar of <em className="text-gradient-spice not-italic">tradition</em>,
              sealed with love.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Sri Ruchi Pachallu is a homemade pickle brand dedicated to bringing
              authentic Andhra flavors to your plate. Every jar is prepared with
              fresh ingredients, traditional family recipes, and a touch of
              homemade love — exactly the way your grandmother used to make.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
              {[
                { icon: Leaf,       label: 'Pure Ingredients' },
                { icon: Flame,      label: 'Andhra Recipes' },
                { icon: ShieldCheck,label: 'Hygienic Process' },
                { icon: Heart,      label: 'Made with Love' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-3 rounded-xl bg-card border shadow-soft">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
            <Link
              to="/about"
              className="mt-8 group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold hover:bg-primary transition-colors"
            >
              Read More
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0 opacity-[0.07] bg-cover bg-center"
          style={{ backgroundImage: `url(${spices})` }}
        />
        <div className="relative container mx-auto px-4">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What we offer</span>
            <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold">
              Crafted with <span className="text-gradient-spice">care</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">Four decades of tradition meet modern hygiene standards.</p>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Leaf,       title: 'Veg & Non-Veg', desc: 'From mango avakaya to spicy mutton — a jar for every craving.' },
              { icon: Flame,      title: 'Andhra Flavor',  desc: 'Traditional Andhra & Telangana recipes, fiery and full of soul.' },
              { icon: ShieldCheck,title: 'No Preservatives', desc: 'Pure ingredients only — never any artificial additives.' },
              { icon: Truck,      title: 'Fast Delivery',  desc: 'Local & nationwide delivery. Bulk orders welcomed.' },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="group h-full bg-card rounded-3xl p-6 border shadow-soft hover:shadow-warm hover:-translate-y-2 transition-all">
                  <div className="h-14 w-14 rounded-2xl gradient-spice flex items-center justify-center text-primary-foreground shadow-warm group-hover:scale-110 transition-transform">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── BESTSELLERS ── */}
      {bestsellers.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-transparent to-secondary/20">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
              <Reveal>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Bestsellers</span>
                <h2 className="mt-3 font-display text-4xl md:text-5xl font-bold">
                  Our jars of <span className="text-gradient-spice">love</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/5 font-semibold text-sm transition-all"
                >
                  View All Products
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Reveal>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestsellers.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}