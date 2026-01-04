// src/components/admin/MemberForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { Save, X } from 'lucide-react';
import { validateICNumber, validatePhoneNumber } from '@/lib/utils/validators';
import toast from 'react-hot-toast';

interface MemberFormProps {
  member?: Member;
  mode: 'create' | 'edit';
}

export default function MemberForm({ member, mode }: MemberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: member?.name || '',
    icNumber: member?.icNumber || '',
    dateOfBirth: member?.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split('T')[0] : '',
    gender: member?.gender || 'male',
    phoneNumber: member?.phoneNumber || '',
    email: member?.email || '',
    address: member?.address || '',
    postcode: member?.postcode || '',
    city: member?.city || '',
    state: member?.state || '',
    status: member?.status || 'active',
    notes: member?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const malaysianStates = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Pulau Pinang', 'Perak', 'Perlis', 'Selangor',
    'Terengganu', 'Sabah', 'Sarawak', 'W.P. Kuala Lumpur',
    'W.P. Labuan', 'W.P. Putrajaya'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama diperlukan';
    }

    if (!validateICNumber(formData.icNumber)) {
      newErrors.icNumber = 'No. KP tidak sah (format: 123456-12-1234)';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Tarikh lahir diperlukan';
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'No. telefon tidak sah (format: 01X-XXXXXXX)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak sah';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat diperlukan';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Poskod diperlukan';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Bandar diperlukan';
    }

    if (!formData.state) {
      newErrors.state = 'Negeri diperlukan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Sila betulkan ralat dalam borang');
      return;
    }

    setLoading(true);

    try {
      const memberData = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth),
        updatedAt: serverTimestamp(),
      };

      if (mode === 'create') {
        await addDoc(collection(db, 'members'), {
          ...memberData,
          createdAt: serverTimestamp(),
        });
        toast.success('Ahli berjaya ditambah');
      } else if (member?.id) {
        await updateDoc(doc(db, 'members', member.id), memberData);
        toast.success('Ahli berjaya dikemas kini');
      }

      router.push('/admin/members');
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Gagal menyimpan data ahli');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maklumat Peribadi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Penuh <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nama penuh ahli"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* IC Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Kad Pengenalan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="icNumber"
              value={formData.icNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.icNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123456-12-1234"
            />
            {errors.icNumber && <p className="mt-1 text-sm text-red-600">{errors.icNumber}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarikh Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jantina <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="male">Lelaki</option>
              <option value="female">Perempuan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maklumat Hubungan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No. Telefon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="012-3456789"
            />
            {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Alamat lengkap"
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* Postcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poskod <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.postcode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="43650"
            />
            {errors.postcode && <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bandar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Bandar Baru Bangi"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Negeri <span className="text-red-500">*</span>
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Pilih Negeri</option>
              {malaysianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maklumat Tambahan
        </h3>
        <div className="space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          <X className="h-5 w-5" />
          <span>Batal</span>
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>
    </form>
  );
}