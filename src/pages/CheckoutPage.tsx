// src/pages/CheckoutPage.tsx
// Sri Ruchi Pachallu — Checkout Page with Saved Address Support

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import {
  Loader2, Wallet, CreditCard, MapPin, Plus, CheckCircle,
  Home, Briefcase, Star
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

        // Pre-fill name/phone from profile
        setFormData(prev => ({
          ...prev,
          first_name: user.first_name || "",
          phone: user.phone || "",
        }));

        // Auto-select default address if one exists
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
      last_name: addr.last_name || "",
      address: addr.address || "",
      apartment: addr.apartment || "",
      city: addr.city || "",
      state: addr.state || "",
      zip_code: addr.zip_code || "",
      phone: addr.phone || "",
      country: addr.country || "India",
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
    // If user edits the form manually, deselect saved address
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
    const flatRate = parseFloat(shipping.flat_rate || "60.00");
    const freeAbove = shipping.free_shipping_above ? parseFloat(shipping.free_shipping_above) : 0;
    const isFreeShipping = freeAbove > 0 && total >= freeAbove;
    const shippingCost = isFreeShipping ? 0 : flatRate;
    const codFee = paymentMethod === "COD" ? 60 : 0;
    const discount = couponData ? parseFloat(couponData.discount_amount) : 0;
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
      // If "new" address and save_as_default checked → save to profile first
      if (selectedAddressId === "new" && saveAsDefault) {
        try {
          await authService.saveAddress({
            first_name: formData.first_name,
            last_name: formData.last_name,
            address: formData.address,
            apartment: formData.apartment,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            phone: formData.phone,
            country: formData.country,
            is_default: true,
            label: "Home",
          });
        } catch {
          // If max 3 reached etc., we still proceed with the order
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
        phone: formData.phone,
        coupon_code: couponData ? couponCode : "",
      };

      const res = await orderService.createOrder(orderPayload);

      if (paymentMethod === "COD") {
        clear();
        toast.success("Order placed successfully! 🌶️");
        navigate("/profile?tab=orders");
      } else {
        const options = {
          key: res.key,
          amount: res.amount * 100,
          currency: "INR",
          name: "Sri Ruchi Pachallu",
          order_id: res.razorpay_order_id,
          prefill: {
            name: `${formData.first_name} ${formData.last_name}`.trim(),
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

  return (
    <div className="min-h-screen bg-background pt-10 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold mb-8 text-foreground">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* ── LEFT: Address + Payment ────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Saved Address Cards */}
            <div className="bg-card p-8 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="text-primary w-5 h-5" /> Delivery Address
              </h2>

              {savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {savedAddresses.map(addr => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => selectAddress(addr.id)}
                        className={`relative p-4 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-primary fill-primary/20" />
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          {addr.label === "Home"
                            ? <Home className="w-4 h-4 text-muted-foreground" />
                            : <Briefcase className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-bold text-sm text-primary">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold ml-auto">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{addr.first_name} {addr.last_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {addr.address}, {addr.city} — {addr.zip_code}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{addr.phone}</p>
                      </div>
                    );
                  })}

                  {/* Add new card */}
                  {savedAddresses.length < 3 && (
                    <div
                      onClick={() => selectAddress("new")}
                      className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-all ${
                        selectedAddressId === "new"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Plus className="w-6 h-6 text-primary mb-1" />
                      <span className="text-sm font-medium text-primary">New Address</span>
                    </div>
                  )}
                </div>
              )}

              {/* Address form (always visible — filled or blank) */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="first_name" placeholder="First Name"
                  value={formData.first_name} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="last_name" placeholder="Last Name"
                  value={formData.last_name} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="address" placeholder="Street Address"
                  value={formData.address} onChange={handleInputChange}
                  className="col-span-2 p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="apartment" placeholder="Apartment / Flat (Optional)"
                  value={formData.apartment} onChange={handleInputChange}
                  className="col-span-2 p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="city" placeholder="City"
                  value={formData.city} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="state" placeholder="State"
                  value={formData.state} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="zip_code" placeholder="PIN Code"
                  value={formData.zip_code} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  name="phone" placeholder="Phone"
                  value={formData.phone} onChange={handleInputChange}
                  className="p-3 border rounded-xl bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Save as default — only show when typing a new address */}
              {selectedAddressId === "new" && (
                <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={e => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-muted-foreground font-medium">
                    Save this address to my profile
                    {savedAddresses.length === 0 && " (as default)"}
                  </span>
                </label>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card p-8 rounded-2xl border shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> Payment Method
              </h3>
              <div className="grid gap-3">
                <button
                  onClick={() => setPaymentMethod("Online")}
                  className={`flex items-center p-4 border rounded-xl transition-all ${
                    paymentMethod === "Online"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <CreditCard className="mr-3 w-5 h-5" />
                  <span className="font-medium">Online Payment (UPI, Cards, NetBanking)</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("COD")}
                  className={`flex items-center p-4 border rounded-xl transition-all ${
                    paymentMethod === "COD"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Wallet className="mr-3 w-5 h-5" />
                  <div className="text-left">
                    <span className="font-medium">Cash on Delivery</span>
                    <p className="text-xs text-orange-600 font-medium mt-0.5">+ ₹60 handling fee</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ───────────────────────────────────────── */}
          <div className="bg-card p-8 rounded-2xl border shadow-sm h-fit sticky top-24">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>

            {/* Coupon */}
            <div className="flex gap-2 mb-6">
              <input
                placeholder="Coupon Code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 p-3 border rounded-xl text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary uppercase"
              />
              <button
                onClick={couponData ? () => { setCouponData(null); setCouponCode(""); } : handleApplyCoupon}
                disabled={isValidating}
                className="bg-primary text-primary-foreground px-5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {isValidating ? "..." : couponData ? "Remove" : "Apply"}
              </button>
            </div>

            {couponData && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-2 rounded-lg mb-4 text-center font-medium">
                🎉 Coupon applied! You saved <span className="font-display">₹</span>
{calculations.discount.toLocaleString()}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
  <span className="font-display">₹</span>{total.toLocaleString()}
</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className={calculations.isFreeShipping ? "text-green-600 font-bold" : "font-medium"}>
                  {calculations.isFreeShipping ? (
  "FREE"
) : (
  <>
    <span className="font-display">₹</span>
    {calculations.shippingCost.toLocaleString()}
  </>
)}
                </span>
              </div>
              {calculations.discount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Discount</span>
                  <span>
  -<span className="font-display">₹</span>
  {calculations.discount.toLocaleString()}
</span>
                </div>
              )}
              {paymentMethod === "COD" && (
                <div className="flex justify-between text-muted-foreground">
                  <span>COD Fee</span>
                  <span>
  <span className="font-display">₹</span>60
</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
  <span className="font-display">₹</span>
  {calculations.grandTotal.toLocaleString()}
</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                : (
  <>
    Place Order • <span className="font-display">₹</span>
    {calculations.grandTotal.toLocaleString()}
  </>
)}
            </button>

            {shipping.free_shipping_above && total < parseFloat(shipping.free_shipping_above) && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                Add <span className="font-display">₹</span>
{(parseFloat(shipping.free_shipping_above) - total).toLocaleString()} more for free shipping
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}