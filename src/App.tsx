import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import ProductsPage from "@/pages/ProductsPage";
import ContactPage from "@/pages/ContactPage";
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import UserProfile from '@/pages/UserProfile';
import ProtectedRoute from '@/components/ProtectedRoute';
import Checkout from '@/pages/CheckoutPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you requested does not exist.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />

        <div className="min-h-screen bg-background text-foreground">
          <Navbar />

          <main className="pt-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* AUTH ROUTES */}
              <Route path="/login" element={<LoginPage />} />
              {/* PROTECTED ROUTES */}
<Route element={<ProtectedRoute />}>
  <Route path="/profile" element={<UserProfile />} />
  <Route path="/checkout" element={<Checkout />} />
</Route>

              <Route path="/home" element={<Navigate to="/" replace />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          <Footer />
          <CartDrawer />
          <FloatingWhatsApp />
          <Toaster position="top-center" richColors />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}