// src/pages/CheckoutPage.tsx
// Sri Ruchi Pachallu — Checkout Page with Saved Address Support (Fully Responsive)

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Wallet, CreditCard, MapPin, Plus, CheckCircle,
  Home, Briefcase,
} from "lucide-react";
import { storeService, orderService, authService } from "@/services/api";
import { type SavedAddress, type ShippingConfig } from "@/services/api";
import { toast } from "sonner";

declare global {
  interface Window { Razorpay: any; }
}

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  // ── Address state ─────────────────────────────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">("new");

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", address: "", apartment: "",
    city: "", state: "", zip_code: "", phone: "", country: "India",
  });
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // ── Other state ───────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"Online" | "COD">("Online");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [shipping, setShipping] = useState<ShippingConfig>({
    name: "Standard Delivery", flat_rate: "60.00", free_shipping_above: null,
  });

  // ── Auth guard + data init ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("sriruchiToken");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login", { state: { redirectTo: "/checkout" } });
      return;
    }
    if (items.length === 0) {
      navigate("/products");
      return;
    }

    const init = async () => {
      try {
        const [config, user, addrList] = await Promise.all([
          storeService.getShippingConfig(),
          authService.getProfile(),
          authService.getSavedAddresses(),
        ]);

        setShipping(config);

        const addresses = Array.isArray(addrList) ? addrList : (addrList as any).results || [];
        setSavedAddresses(addresses);

        setFormData(prev => ({
          ...prev,
          first_name: user.first_name || "",
          phone: user.phone || "",
        }));

        const defaultAddr = addresses.find((a: SavedAddress) => a.is_default);
        if (defaultAddr) {
          fillAddressForm(defaultAddr);
          setSelectedAddressId(defaultAddr.id);
        }
      } catch {
        // silently ignore config errors
      } finally {
        setInitLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fillAddressForm = (addr: SavedAddress) => {
    setFormData({
      first_name: addr.first_name || "",
      last_name:  addr.last_name  || "",
      address:    addr.address    || "",
      apartment:  addr.apartment  || "",
      city:       addr.city       || "",
      state:      addr.state      || "",
      zip_code:   addr.zip_code   || "",
      phone:      addr.phone      || "",
      country:    addr.country    || "India",
    });
  };

  const selectAddress = (id: number | "new") => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFormData({
        first_name: "", last_name: "", address: "", apartment: "",
        city: "", state: "", zip_code: "", phone: "", country: "India",
      });
    } else {
      const addr = savedAddresses.find(a => a.id === id);
      if (addr) fillAddressForm(addr);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (selectedAddressId !== "new") setSelectedAddressId("new");
  };

  // ── Coupon ────────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const res = await storeService.validateCoupon(couponCode, total);
      if (res.valid) {
        setCouponData(res);
        toast.success("Coupon applied!");
      }
    } catch (err: any) {
      setCouponData(null);
      toast.error(err.error || err.code || "Invalid coupon");
    } finally {
      setIsValidating(false);
    }
  };

  // ── Calculations ──────────────────────────────────────────────────────────
  const calculations = useMemo(() => {
    const flatRate   = parseFloat(shipping.flat_rate || "60.00");
    const freeAbove  = shipping.free_shipping_above ? parseFloat(shipping.free_shipping_above) : 0;
    const isFreeShipping = freeAbove > 0 && total >= freeAbove;
    const shippingCost   = isFreeShipping ? 0 : flatRate;
    const codFee         = paymentMethod === "COD" ? 60 : 0;
    const discount       = couponData ? parseFloat(couponData.discount_amount) : 0;
    return {
      shippingCost, isFreeShipping, codFee, discount,
      grandTotal: Math.max(0, total - discount) + shippingCost + codFee,
    };
  }, [total, shipping, paymentMethod, couponData]);

  // ── Place order ───────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!formData.address || !formData.phone || !formData.zip_code) {
      return toast.error("Please fill in address, PIN code, and phone");
    }
    setLoading(true);

    try {
      if (selectedAddressId === "new" && saveAsDefault) {
        try {
          await authService.saveAddress({
            first_name: formData.first_name,
            last_name:  formData.last_name,
            address:    formData.address,
            apartment:  formData.apartment,
            city:       formData.city,
            state:      formData.state,
            zip_code:   formData.zip_code,
            phone:      formData.phone,
            country:    formData.country,
            is_default: true,
            label:      "Home",
          });
        } catch {
          toast.info("Could not save address (max 3 reached), but order will proceed.");
        }
      }

      const orderPayload = {
        items: items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
        payment_method: paymentMethod,
        address: [
          formData.address,
          formData.apartment,
          formData.city,
          `${formData.state} - ${formData.zip_code}`,
        ].filter(Boolean).join(", "),
        phone:       formData.phone,
        coupon_code: couponData ? couponCode : "",
      };

      const res = await orderService.createOrder(orderPayload);

      if (paymentMethod === "COD") {
        clear();
        toast.success("Order placed successfully! 🌶️");
        navigate("/profile?tab=orders");
      } else {
        const options = {
          key:      res.key,
          amount:   res.amount * 100,
          currency: "INR",
          name:     "Sri Ruchi Pachallu",
          order_id: res.razorpay_order_id,
          prefill: {
            name:    `${formData.first_name} ${formData.last_name}`.trim(),
            contact: formData.phone,
          },
          handler: async (response: any) => {
            try {
              await orderService.verifyPayment(response);
              clear();
              toast.success("Payment successful! 🎉");
              navigate("/profile?tab=orders");
            } catch {
              toast.error("Payment verification failed. Contact support.");
              navigate("/profile?tab=orders");
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              toast("Payment cancelled");
            },
          },
          theme: { color: "#C0392B" },
        };
        new window.Razorpay(options).open();
      }
    } catch (err: any) {
      toast.error(err.error || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Shared input class ────────────────────────────────────────────────────
  const inputCls =
    "w-full px-3.5 py-3 text-sm border border-border rounded-xl bg-background " +
    "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 " +
    "focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 md:pt-32 pb-16 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">

        {/* ── Page title ───────────────────────────────────────────────────── */}
        <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-foreground">
          Checkout
        </h1>

        {/* ── Two-column grid (stacked on mobile) ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start">

          {/* ════════════════════════════════════════════════════════════════
              LEFT COLUMN — Address + Payment
          ════════════════════════════════════════════════════════════════ */}
          <div className="space-y-5 sm:space-y-6 min-w-0">

            {/* ── Delivery Address card ─────────────────────────────────── */}
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <MapPin className="text-primary w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  Delivery Address
                </h2>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">

                {/* Saved address picker */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2.5">
                    {savedAddresses.map(addr => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => selectAddress(addr.id)}
                          className={[
                            "relative w-full text-left p-4 border rounded-xl transition-all",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40 hover:bg-muted/30",
                          ].join(" ")}
                        >
                          {isSelected && (
                            <CheckCircle className="absolute top-3 right-3 w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          )}

                          {/* Label row */}
                          <div className="flex items-center gap-2 mb-1.5 pr-7">
                            {addr.label === "Home"
                              ? <Home className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              : <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                            <span className="font-bold text-xs sm:text-sm text-primary leading-none">
                              {addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold leading-none">
                                DEFAULT
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {addr.first_name} {addr.last_name}
                          </p>

                          {/* Address lines */}
                          <p className="text-xs text-muted-foreground mt-0.5 break-words leading-relaxed">
                            {addr.address}
                            {addr.apartment ? `, ${addr.apartment}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {addr.city}{addr.state ? `, ${addr.state}` : ""} — {addr.zip_code}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                        </button>
                      );
                    })}

                    {/* "New address" tile */}
                    {savedAddresses.length < 3 && (
                      <button
                        type="button"
                        onClick={() => selectAddress("new")}
                        className={[
                          "w-full flex items-center justify-center gap-2 py-3.5 border border-dashed",
                          "rounded-xl transition-all text-sm font-medium",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          selectedAddressId === "new"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted/20",
                        ].join(" ")}
                      >
                        <Plus className="w-4 h-4" />
                        Enter a new address
                      </button>
                    )}
                  </div>
                )}

                {/* Address input grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    name="first_name" placeholder="First Name"
                    value={formData.first_name} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="given-name"
                  />
                  <input
                    name="last_name" placeholder="Last Name"
                    value={formData.last_name} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="family-name"
                  />
                  <input
                    name="address" placeholder="Street Address *"
                    value={formData.address} onChange={handleInputChange}
                    className={`${inputCls} sm:col-span-2`}
                    autoComplete="street-address"
                  />
                  <input
                    name="apartment" placeholder="Apartment / Flat (Optional)"
                    value={formData.apartment} onChange={handleInputChange}
                    className={`${inputCls} sm:col-span-2`}
                    autoComplete="address-line2"
                  />
                  <input
                    name="city" placeholder="City *"
                    value={formData.city} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="address-level2"
                  />
                  <input
                    name="state" placeholder="State"
                    value={formData.state} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="address-level1"
                  />
                  <input
                    name="zip_code" placeholder="PIN Code *"
                    value={formData.zip_code} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="postal-code"
                    inputMode="numeric"
                  />
                  <input
                    name="phone" placeholder="Phone *"
                    value={formData.phone} onChange={handleInputChange}
                    className={inputCls}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>

                {/* Save-as-default checkbox */}
                {selectedAddressId === "new" && (
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <span
                      className={[
                        "relative flex items-center justify-center w-5 h-5 rounded border-2 shrink-0",
                        "transition-colors",
                        saveAsDefault
                          ? "bg-primary border-primary"
                          : "border-border bg-background group-hover:border-primary/50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={saveAsDefault}
                        onChange={e => setSaveAsDefault(e.target.checked)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                      {saveAsDefault && (
                        <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium leading-tight">
                      Save this address to my profile
                      {savedAddresses.length === 0 && (
                        <span className="text-muted-foreground/60"> (as default)</span>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </section>

            {/* ── Payment Method card ───────────────────────────────────── */}
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  Payment Method
                </h3>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-3">
                {/* Online */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("Online")}
                  className={[
                    "w-full flex items-center gap-3 p-4 border rounded-xl transition-all text-left",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    paymentMethod === "Online"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/20",
                  ].join(" ")}
                >
                  <div className={[
                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                    paymentMethod === "Online" ? "border-primary" : "border-border",
                  ].join(" ")}>
                    {paymentMethod === "Online" && (
                      <span className="w-2 h-2 rounded-full bg-primary block" />
                    )}
                  </div>
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm sm:text-base font-medium leading-tight">
                    Online Payment
                    <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                      UPI, Cards, NetBanking via Razorpay
                    </span>
                  </span>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={[
                    "w-full flex items-center gap-3 p-4 border rounded-xl transition-all text-left",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/20",
                  ].join(" ")}
                >
                  <div className={[
                    "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                    paymentMethod === "COD" ? "border-primary" : "border-border",
                  ].join(" ")}>
                    {paymentMethod === "COD" && (
                      <span className="w-2 h-2 rounded-full bg-primary block" />
                    )}
                  </div>
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm sm:text-base font-medium leading-tight">
                    Cash on Delivery
                    <span className="block text-xs text-orange-600 font-medium mt-0.5">
                      + ₹60 handling fee applies
                    </span>
                  </span>
                </button>
              </div>
            </section>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Order Summary
              On mobile this sits below the left column.
              On lg+ it sticks to the top of the viewport.
          ════════════════════════════════════════════════════════════════ */}
          <div className="lg:sticky lg:top-24 min-w-0">
            <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-border/60">
                <h3 className="text-base sm:text-lg font-bold">Order Summary</h3>
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">

                {/* ── Coupon input ─────────────────────────────────────── */}
                <div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className={`${inputCls} flex-1 uppercase tracking-widest`}
                      autoCapitalize="characters"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={
                        couponData
                          ? () => { setCouponData(null); setCouponCode(""); }
                          : handleApplyCoupon
                      }
                      disabled={isValidating}
                      className={[
                        "shrink-0 px-4 sm:px-5 py-3 rounded-xl text-sm font-bold transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                        couponData
                          ? "bg-muted text-foreground hover:bg-muted/80"
                          : "bg-primary text-primary-foreground hover:opacity-90",
                      ].join(" ")}
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : couponData ? "Remove" : "Apply"}
                    </button>
                  </div>

                  {couponData && (
                    <div className="mt-2.5 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg text-center font-medium">
                      🎉 Coupon applied! You saved ₹{calculations.discount.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* ── Price rows ───────────────────────────────────────── */}
                <div className="space-y-2.5 text-sm">

                  {/* Subtotal */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Subtotal</span>
                    <span className="font-medium tabular-nums">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Shipping</span>
                    <span className={[
                      "tabular-nums font-medium",
                      calculations.isFreeShipping ? "text-green-600 font-bold" : "",
                    ].join(" ")}>
                      {calculations.isFreeShipping
                        ? "FREE"
                        : `₹${calculations.shippingCost.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Discount */}
                  {calculations.discount > 0 && (
                    <div className="flex items-center justify-between gap-4 text-green-600 font-bold">
                      <span className="shrink-0">Discount</span>
                      <span className="tabular-nums">
                        −₹{calculations.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* COD fee */}
                  {paymentMethod === "COD" && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground shrink-0">COD Fee</span>
                      <span className="font-medium tabular-nums text-orange-600">₹60</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-3 mt-1 border-t border-border/60 flex items-center justify-between gap-4">
                    <span className="font-bold text-base sm:text-lg">Total</span>
                    <span className="font-bold text-base sm:text-lg text-primary tabular-nums">
                      ₹{calculations.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ── Free shipping nudge ──────────────────────────────── */}
                {shipping.free_shipping_above &&
                  total < parseFloat(shipping.free_shipping_above) && (
                    <p className="text-xs text-center text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                      Add ₹{(parseFloat(shipping.free_shipping_above) - total).toLocaleString()} more for{" "}
                      <span className="font-bold text-green-600">free shipping</span>
                    </p>
                  )}

                {/* ── Place order CTA ──────────────────────────────────── */}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className={[
                    "w-full py-4 rounded-xl font-bold text-sm sm:text-base transition-all",
                    "bg-primary text-primary-foreground hover:opacity-90",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2",
                  ].join(" ")}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    `Place Order  •  ₹${calculations.grandTotal.toLocaleString()}`
                  )}
                </button>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}