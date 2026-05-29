import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  Info,
  Sparkles,
  ShoppingBag,
  Phone,
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  Package,
  MapPin,
  ChevronRight,
} from "lucide-react";

import { Logo } from "./Logo";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/about", label: "About", icon: Info },
  { to: "/services", label: "Services", icon: Sparkles },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/contact", label: "Contact", icon: Phone },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { count, setIsOpen } = useCart();
  const { user, isLoggedIn, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close dropdown outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  const initials = user
    ? (
        user.first_name?.charAt(0) ||
        user.email?.charAt(0) ||
        "?"
      ).toUpperCase()
    : null;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div
          className={`flex items-center justify-between rounded-2xl px-4 md:px-6 py-3 transition-all duration-500 ${
            scrolled ? "glass shadow-soft" : "bg-transparent"
          }`}
        >
          <Logo />

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;

              return (
                <Link
                  key={to}
                  to={to}
                  className="group relative px-4 py-2 rounded-full text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />

                  <span>{label}</span>

                  <span
                    className={`absolute left-4 right-4 -bottom-0.5 h-0.5 rounded-full bg-primary origin-left transition-transform duration-300 ${
                      active
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open cart"
              className="relative p-2.5 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform shadow-warm"
            >
              <ShoppingCart className="h-5 w-5" />

              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Profile */}
            {isLoggedIn && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((s) => !s)}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-warm hover:scale-105 active:scale-95 transition-transform"
                >
                  {initials}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-muted/20">
                        <p className="text-sm font-bold truncate">
                          {user.first_name || "Welcome"}
                        </p>

                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu */}
                      {[
                        {
                          to: "/profile?tab=orders",
                          label: "My Orders",
                          icon: Package,
                        },
                        {
                          to: "/profile?tab=addresses",
                          label: "Addresses",
                          icon: MapPin,
                        },
                        {
                          to: "/profile?tab=details",
                          label: "Account",
                          icon: User,
                        },
                      ].map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
                        >
                          <Icon className="w-4 h-4" />

                          {label}

                          <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                        </Link>
                      ))}

                      {/* Logout */}
                      <div className="border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
  to="/login"
  className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
>
  <User className="h-4 w-4" />
</Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Menu"
              className="lg:hidden p-2.5 rounded-full glass shadow-soft"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden mt-2 glass rounded-2xl p-3 shadow-warm"
            >
              {links.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;

                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}

              
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}