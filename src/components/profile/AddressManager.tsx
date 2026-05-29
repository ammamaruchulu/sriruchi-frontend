// src/components/profile/AddressManager.tsx
// Saved Addresses CRUD — max 3 per user. Works in profile and checkout mode.

import { useState, useEffect } from 'react';
import { authService, SavedAddress } from '@/services/api';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Star, Edit2, Check, Loader2 } from 'lucide-react';

const EMPTY_FORM = {
  label: 'Home',
  first_name: '',
  last_name: '',
  address: '',
  apartment: '',
  city: '',
  state: 'Telangana',
  zip_code: '',
  country: 'India',
  phone: '',
  landmark: '',
};

const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

interface Props {
  /** Checkout mode: call onSelect when address changes */
  onSelect?: (addr: SavedAddress) => void;
  selectedId?: number | null;
}

export default function AddressManager({ onSelect, selectedId }: Props) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isCheckoutMode = !!onSelect;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authService.getSavedAddresses();
      const list: SavedAddress[] = Array.isArray(data) ? data : [];
      setAddresses(list);
      if (onSelect) {
        const def = list.find(a => a.is_default) || list[0];
        if (def) onSelect(def);
      }
    } catch { setAddresses([]); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditing(addr);
    setForm({
      label: addr.label, first_name: addr.first_name, last_name: addr.last_name,
      address: addr.address, apartment: addr.apartment, city: addr.city,
      state: addr.state, zip_code: addr.zip_code, country: addr.country,
      phone: addr.phone, landmark: addr.landmark,
    });
    setErrors({});
    setShowForm(true);
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setForm(f => ({ ...f, phone: cleaned }));
    if (phoneRegex.test(cleaned)) setErrors(e => { const n = { ...e }; delete n.phone; return n; });
  };

  const handlePincodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setForm(f => ({ ...f, zip_code: cleaned }));
    if (pincodeRegex.test(cleaned)) setErrors(e => { const n = { ...e }; delete n.zip_code; return n; });
  };

const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit number';
    if (!form.zip_code.trim()) newErrors.zip_code = 'PIN code is required';
    else if (!pincodeRegex.test(form.zip_code)) newErrors.zip_code = 'Enter a valid 6-digit PIN';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      // FIX: Define the payload before using it
      const payload = editing ? { ...form, id: editing.id } : form;
      
      const saved = await authService.saveAddress(payload);
      
      // Refresh list
      const updatedList = await authService.getSavedAddresses();
      setAddresses(updatedList);
      
      // If in checkout, notify parent
      if (onSelect) {
        onSelect(saved); 
      }
      
      setShowForm(false);
      setErrors({});
      toast.success(editing ? 'Address updated!' : 'Address saved!');
    } catch (err: any) {
      toast.error(err.non_field_errors?.[0] || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await authService.deleteAddress(id);
      await load();
      toast.success('Address removed');
    } catch { toast.error('Failed to delete'); }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await authService.setDefaultAddress(id);
      await load();
      toast.success('Default address updated');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading addresses...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[Playfair_Display,serif] font-bold text-gray-900">
          {isCheckoutMode ? 'Shipping Address' : 'Saved Addresses'}
        </h3>
        {addresses.length < 3 && !showForm && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 text-sm font-bold text-[oklch(0.52_0.21_28)] hover:underline"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        )}
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="text-center py-8 space-y-3">
          <MapPin className="w-8 h-8 mx-auto text-gray-300" />
          <p className="text-sm text-gray-400">No saved addresses yet</p>
          <button
            onClick={openNew}
            className="bg-[oklch(0.52_0.21_28)] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_16px_oklch(0.52_0.21_28_/_0.3)] hover:bg-[oklch(0.45_0.21_28)] transition-all"
          >
            Add Shipping Address
          </button>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => {
          const isSelected = isCheckoutMode ? selectedId === addr.id : addr.is_default;
          return (
            <div
              key={addr.id}
              onClick={() => isCheckoutMode && onSelect(addr)}
              className={`relative border rounded-2xl p-4 transition-all ${
                isCheckoutMode ? 'cursor-pointer' : ''
              } ${isSelected
                ? 'border-[oklch(0.52_0.21_28)] bg-[oklch(0.52_0.21_28)]/5 shadow-sm'
                : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {isCheckoutMode && (
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-[oklch(0.52_0.21_28)] bg-[oklch(0.52_0.21_28)]' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}

              {!isCheckoutMode && addr.is_default && (
                <span className="absolute top-3 right-3 text-[9px] bg-[oklch(0.52_0.21_28)]/10 text-[oklch(0.52_0.21_28)] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Default
                </span>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{addr.label}</p>
                  <p className="font-semibold text-sm text-gray-900">{addr.first_name} {addr.last_name}</p>
                  <p className="text-sm text-gray-500">{addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                  <p className="text-sm text-gray-500">{addr.city}, {addr.state} — {addr.zip_code}</p>
                  <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                </div>
              </div>

              <div className="flex gap-4 mt-3 pl-7">
                <button
                  onClick={(e) => { e.stopPropagation(); openEdit(addr); }}
                  className="text-xs text-[oklch(0.52_0.21_28)] font-bold hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (deletingId === addr.id) {
                      handleDelete(addr.id);
                      setDeletingId(null);
                    } else {
                      setDeletingId(addr.id);
                      setTimeout(() => setDeletingId(null), 3000);
                    }
                  }}
                  className={`text-xs font-bold hover:underline flex items-center gap-1 text-red-500`}
                >
                  <Trash2 className="w-3 h-3" />
                  {deletingId === addr.id ? 'Confirm?' : 'Delete'}
                </button>
                {!addr.is_default && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                    className="text-xs text-gray-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Set Default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/50">
          <h4 className="font-bold text-sm text-gray-900">{editing ? 'Edit Address' : 'New Address'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'first_name', label: 'First Name *', placeholder: 'e.g. Ravi' },
              { key: 'last_name', label: 'Last Name', placeholder: 'e.g. Kumar' },
              { key: 'phone', label: 'Phone *', placeholder: '10-digit number', type: 'tel' },
              { key: 'address', label: 'Street Address *', placeholder: 'Flat, Building, Street, Area', full: true, hint: 'Include Block, Street and Area details.' },
              { key: 'city', label: 'City *', placeholder: 'e.g. Hyderabad' },
              { key: 'state', label: 'State *', placeholder: 'e.g. Telangana' },
              { key: 'zip_code', label: 'PIN Code *', placeholder: '6-digit PIN' },
            ].map(({ key, label, full, placeholder, hint, type = 'text' }) => (
              <div key={key} className={full ? 'sm:col-span-2' : ''}>
                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => {
                    if (key === 'phone') handlePhoneChange(e.target.value);
                    else if (key === 'zip_code') handlePincodeChange(e.target.value);
                    else setForm(f => ({ ...f, [key]: e.target.value }));
                  }}
                  placeholder={placeholder}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[oklch(0.52_0.21_28)] outline-none placeholder:text-gray-300 transition-all ${
                    errors[key] ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {hint && <span className="text-[10px] text-gray-400 mt-1 block italic">{hint}</span>}
                {errors[key] && <span className="text-[10px] text-red-500 mt-1 block font-medium">{errors[key]}</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[oklch(0.52_0.21_28)] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-60 hover:bg-[oklch(0.45_0.21_28)] transition-all shadow-[0_4px_16px_oklch(0.52_0.21_28_/_0.3)] flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}