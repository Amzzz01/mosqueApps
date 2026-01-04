// src/app/admin/donations/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewDonationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'general' as 'general' | 'zakat' | 'sadaqah',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'online',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Sila masukkan jumlah yang sah');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'donations'), {
        donorName: formData.donorName || 'Tanpa Nama',
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        createdAt: serverTimestamp(),
      });

      toast.success('Derma berjaya direkodkan');
      router.push('/admin/donations');
    } catch (error) {
      console.error('Error adding donation:', error);
      toast.error('Gagal merekod derma');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/donations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rekod Derma Baru</h1>
          <p className="text-gray-600 mt-1">Masukkan maklumat derma</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Penderma</label>
            <input
              type="text"
              name="donorName"
              value={formData.donorName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Nama penderma (opsional)"
            />
            <p className="mt-1 text-sm text-gray-500">Kosongkan jika tanpa nama</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah (RM) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarikh <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Derma <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="general">Umum</option>
              <option value="zakat">Zakat</option>
              <option value="sadaqah">Sadaqah</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cara Bayaran <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="cash">Tunai</option>
              <option value="bank_transfer">Pindahan Bank</option>
              <option value="online">Bayaran Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/admin/donations"
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
              <span>Batal</span>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}