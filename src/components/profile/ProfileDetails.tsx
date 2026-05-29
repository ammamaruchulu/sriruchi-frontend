// src/components/profile/ProfileDetails.tsx
// Account details form — matches Sri Ruchi brand design.

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';

interface ProfileDetailsProps {
  user: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  onSave: (data: { first_name: string; last_name: string; phone: string }) => Promise<void>;
  loading?: boolean;
}

export default function ProfileDetails({ user, onSave, loading = false }: ProfileDetailsProps) {
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
      setIsDirty(false);
    }
  }, [user]);

  const handleChange = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    await onSave(form);
    setIsDirty(false);
  };

  const fields = [
    { key: 'first_name', label: 'First Name', icon: User, placeholder: 'Your first name', type: 'text', required: true },
    { key: 'last_name', label: 'Last Name', icon: User, placeholder: 'Your last name', type: 'text', required: false },
    { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '10-digit mobile number', type: 'tel', required: false },
  ];

  return (
    <div className="space-y-6 max-w-md">
      {/* Read-only email */}
      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
          Email Address
        </label>
        <div className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
          <Mail className="h-4 w-4 text-gray-300 flex-shrink-0" />
          <span className="text-sm text-gray-400 font-medium">{user?.email || '—'}</span>
          <span className="ml-auto text-[10px] text-gray-300 font-bold uppercase tracking-wider">
            Cannot change
          </span>
        </div>
      </div>

      {/* Editable fields */}
      {fields.map(({ key, label, icon: Icon, placeholder, type, required }) => (
        <div key={key}>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
            {label}{required && ' *'}
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
            <input
              type={type}
              value={(form as Record<string, string>)[key]}
              onChange={e => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:ring-2 focus:ring-[oklch(0.52_0.21_28)] focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading || !isDirty}
        className={[
          'flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-sm transition-all',
          loading || !isDirty
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[oklch(0.52_0.21_28)] hover:bg-[oklch(0.45_0.21_28)] text-white shadow-[0_8px_24px_oklch(0.52_0.21_28_/_0.3)] hover:shadow-lg active:scale-95',
        ].join(' ')}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : (
          <><Save className="h-4 w-4" /> Save Changes</>
        )}
      </button>

      {!isDirty && !loading && (
        <p className="text-xs text-gray-400 font-medium">All changes saved.</p>
      )}
    </div>
  );
}