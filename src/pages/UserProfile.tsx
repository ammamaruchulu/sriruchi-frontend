// src/pages/UserProfile.tsx
// Sri Ruchi Pachallu — User Profile Page
// Tabs: My Orders | Addresses | Account Details

import { useState, useEffect, useCallback } from "react";
import {
  Package, MapPin, LogOut, ChevronRight, User as UserIcon,
  Flame, Plus, Pencil, Trash2, Star, Loader2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService, orderService } from "@/services/api";
import { type SavedAddress } from "@/services/api";
import { toast } from "sonner";
import OrderHistory from "@/components/profile/OrderHistory";
import ProfileDetails from "@/components/profile/ProfileDetails";

type Tab = "orders" | "addresses" | "details";
const VALID_TABS: Tab[] = ["orders", "addresses", "details"];

const EMPTY_FORM = {
  label: "Home",
  first_name: "",
  last_name: "",
  address: "",
  apartment: "",
  city: "",
  state: "Telangana",
  zip_code: "",
  country: "India",
  phone: "",
  is_default: false,
};

export default function UserProfile() {
  const { logout, user: authUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") as Tab;
  const [activeTab, setActiveTab] = useState<Tab>(
    VALID_TABS.includes(tabParam) ? tabParam : "orders"
  );

  // ── Orders ────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<unknown[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // ── Addresses ─────────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState(EMPTY_FORM);
  const [submittingAddr, setSubmittingAddr] = useState(false);

  // ── Profile ───────────────────────────────────────────────────────────────
  const [updating, setUpdating] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) {
      navigate("/login", { state: { redirectTo: "/profile?tab=orders" } });
    }
  }, [authUser, navigate]);

  // ── Orders loader ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (page: number) => {
    setOrdersLoading(true);
    try {
      const data = await orderService.getUserOrders(page);
      if (data.results) {
        setOrders(data.results);
        setTotalOrders(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 10));
        setCurrentPage(page);
      } else {
        const arr = Array.isArray(data) ? data : [];
        setOrders(arr);
        setTotalOrders(arr.length);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Addresses loader ──────────────────────────────────────────────────────
  const loadAddresses = useCallback(async () => {
    setAddrLoading(true);
    try {
      const data = await authService.getSavedAddresses();
      setAddresses(Array.isArray(data) ? data : (data as any).results || []);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setAddrLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    if (activeTab === "orders") loadOrders(currentPage);
    if (activeTab === "addresses") loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authUser]);

  // ── Tab switch ────────────────────────────────────────────────────────────
  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    resetAddressForm();
  };

  // ── Profile update ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (formData: {
    first_name: string;
    last_name: string;
    phone: string;
  }) => {
    setUpdating(true);
    try {
      await authService.updateProfile(formData);
      await refreshUser();
      toast.success("Profile updated! 🌶️");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out. Come back soon! 🫙");
  };

  // ── Address CRUD ──────────────────────────────────────────────────────────
  const resetAddressForm = () => {
    setAddressForm(EMPTY_FORM);
    setEditingId(null);
    setShowAddForm(false);
  };

  const openEditForm = (addr: SavedAddress) => {
    setAddressForm({
      label: addr.label,
      first_name: addr.first_name,
      last_name: addr.last_name,
      address: addr.address,
      apartment: addr.apartment || "",
      city: addr.city,
      state: addr.state,
      zip_code: addr.zip_code,
      country: addr.country,
      phone: addr.phone,
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAddr(true);
    try {
      if (editingId) {
        await authService.saveAddress({ ...addressForm, id: editingId });
        toast.success("Address updated!");
      } else {
        await authService.saveAddress(addressForm);
        toast.success("Address saved!");
      }
      resetAddressForm();
      await loadAddresses();
    } catch (err: any) {
      const msg =
        err?.non_field_errors?.[0] ||
        (typeof err === "object"
          ? Object.values(err).flat().join(", ")
          : "Failed to save address");
      toast.error(msg);
    } finally {
      setSubmittingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await authService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await authService.setDefaultAddress(id);
      await loadAddresses();
      toast.success("Default address updated ✓");
    } catch {
      toast.error("Failed to update default");
    }
  };

  if (!authUser) return null;

  const initials = (
    authUser.first_name?.charAt(0) || authUser.email?.charAt(0) || "?"
  ).toUpperCase();

  // ── Render tab content ────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <div className="space-y-6">
            <SectionHeader title="Order History" subtitle="All your Sri Ruchi orders in one place" />
            <OrderHistory
              orders={orders as Parameters<typeof OrderHistory>[0]["orders"]}
              loading={ordersLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              totalOrders={totalOrders}
              onPageChange={(p: number) => loadOrders(p)}
              onRefresh={() => loadOrders(currentPage)}
            />
          </div>
        );

      case "addresses":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <h2 className="font-[Playfair_Display,serif] text-2xl font-extrabold text-gray-900 uppercase tracking-tight">
                  Saved Addresses
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Manage up to 3 delivery addresses
                </p>
              </div>
              {!showAddForm && addresses.length < 3 && (
                <button
                  onClick={() => { resetAddressForm(); setShowAddForm(true); }}
                  className="flex items-center gap-2 bg-[oklch(0.52_0.21_28)] text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              )}
            </div>

            {/* Add / Edit form */}
            {showAddForm && (
              <form
                onSubmit={handleSaveAddress}
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in slide-in-from-top-2"
              >
                <h3 className="font-bold text-lg mb-5 text-gray-900">
                  {editingId ? "Edit Address" : "New Address"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="First Name *"
                    value={addressForm.first_name}
                    onChange={e => setAddressForm({ ...addressForm, first_name: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="Last Name"
                    value={addressForm.last_name}
                    onChange={e => setAddressForm({ ...addressForm, last_name: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                  />
                  <input
                    placeholder="Label (Home / Office)"
                    value={addressForm.label}
                    onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="Phone *"
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="Street Address *"
                    value={addressForm.address}
                    onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                    className="sm:col-span-2 p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="Apartment / Flat (Optional)"
                    value={addressForm.apartment}
                    onChange={e => setAddressForm({ ...addressForm, apartment: e.target.value })}
                    className="sm:col-span-2 p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                  />
                  <input
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="PIN Code *"
                    value={addressForm.zip_code}
                    onChange={e => setAddressForm({ ...addressForm, zip_code: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                    required
                  />
                  <input
                    placeholder="State"
                    value={addressForm.state}
                    onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="p-3 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.21_28)]"
                  />
                </div>

                <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={e => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 accent-[oklch(0.52_0.21_28)] rounded"
                  />
                  <span className="text-sm text-gray-600">Set as default address</span>
                </label>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={submittingAddr}
                    className="bg-[oklch(0.52_0.21_28)] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
                  >
                    {submittingAddr && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submittingAddr ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="border px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Address cards */}
            {!showAddForm && (
              addrLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No addresses saved yet.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 text-sm font-bold text-[oklch(0.52_0.21_28)] hover:underline"
                  >
                    + Add your first address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`bg-white border p-5 rounded-2xl flex justify-between items-start shadow-sm transition-all ${
                        addr.is_default
                          ? "border-[oklch(0.52_0.21_28)] bg-[oklch(0.52_0.21_28_/_0.03)]"
                          : "border-gray-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[oklch(0.52_0.21_28)]">
                            {addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="text-[9px] bg-[oklch(0.52_0.21_28)] text-white px-2 py-0.5 rounded-full font-black tracking-wide">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {addr.first_name} {addr.last_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{addr.address}</p>
                        {addr.apartment && (
                          <p className="text-sm text-gray-600">{addr.apartment}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {addr.city} — {addr.zip_code}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">📞 {addr.phone}</p>
                      </div>

                      <div className="flex flex-col gap-1.5 ml-4 flex-shrink-0">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            title="Set as default"
                            className="p-2 rounded-full hover:bg-amber-50 text-amber-500 transition-colors"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditForm(addr)}
                          title="Edit"
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          title="Delete"
                          className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {addresses.length < 3 && (
                    <p className="text-xs text-center text-gray-400">
                      You can save {3 - addresses.length} more address{3 - addresses.length !== 1 ? "es" : ""}
                    </p>
                  )}
                  {addresses.length >= 3 && (
                    <p className="text-xs text-center text-gray-400">
                      Maximum 3 addresses reached. Delete one to add another.
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        );

      case "details":
        return (
          <div className="space-y-6">
            <SectionHeader title="Account Details" subtitle="Update your personal information" />
            <ProfileDetails user={authUser} onSave={handleUpdateProfile} loading={updating} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[oklch(0.985_0.018_85)] pt-10 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-36 self-start">
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-7">

              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.52_0.21_28)] to-[oklch(0.65_0.22_45)] text-white flex items-center justify-center font-extrabold text-2xl uppercase mb-4 shadow-[0_8px_24px_oklch(0.52_0.21_28_/_0.35)]">
                  {initials}
                </div>
                <p className="font-extrabold text-sm text-gray-900 uppercase tracking-widest truncate max-w-full">
                  {authUser.first_name || "Foodie"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1 truncate max-w-full">
                  {authUser.email}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[oklch(0.52_0.21_28)] font-bold">
                  <Flame className="w-3 h-3" /> Sri Ruchi Member
                </div>
              </div>

              {/* Nav */}
              <nav className="space-y-1.5">
                {([
                  { id: "orders",    label: "My Orders",  icon: Package,  badge: totalOrders > 0 ? totalOrders : null },
                  { id: "addresses", label: "Addresses",  icon: MapPin,   badge: addresses.length > 0 ? addresses.length : null },
                  { id: "details",   label: "Account",    icon: UserIcon, badge: null },
                ] as const).map(item => (
                  <button
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    className={[
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl",
                      "text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                      activeTab === item.id
                        ? "bg-[oklch(0.52_0.21_28)] text-white shadow-[0_4px_16px_oklch(0.52_0.21_28_/_0.35)]"
                        : "bg-transparent text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={14} />
                      {item.label}
                      {item.badge !== null && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          activeTab === item.id
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                    <ChevronRight
                      size={13}
                      className={activeTab === item.id ? "opacity-80" : "opacity-0"}
                    />
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-red-500 hover:bg-red-50 rounded-2xl mt-4 transition-colors"
                >
                  <LogOut size={14} /> Logout
                </button>
              </nav>
            </div>
          </aside>

          {/* ── Main Content ──────────────────────────────────────────────── */}
          <main className="flex-1 bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm min-h-[600px] w-full">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-gray-100 pb-5">
      <h2 className="font-[Playfair_Display,serif] text-2xl font-extrabold text-gray-900 uppercase tracking-tight">
        {title}
      </h2>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}