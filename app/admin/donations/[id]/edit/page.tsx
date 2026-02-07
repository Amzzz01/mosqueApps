// app/admin/donations/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const toDateStr = (val: Date | Timestamp): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return new Date(val).toISOString().split('T')[0];
};

export default function EditDonationPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    date: '',
    type: 'general',
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => { fetchDonation(); }, [params.id]);

  const fetchDonation = async () => {
    try {
      const donationDoc = await getDoc(doc(db, 'donations', params.id as string));
      if (donationDoc.exists()) {
        const data = donationDoc.data();
        setFormData({
          donorName: data.donorName || '',
          amount: data.amount?.toString() || '',
          date: data.date ? toDateStr(data.date) : '',
          type: data.type || 'general',
          paymentMethod: data.paymentMethod || 'cash',
          notes: data.notes || '',
        });
      } else {
        toast.error('Rekod derma tidak dijumpai');
        router.push('/admin/donations');
      }
    } catch {
      toast.error('Gagal memuatkan rekod derma');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    try {
      await updateDoc(doc(db, 'donations', params.id as string), {
        donorName: formData.donorName || 'Tanpa Nama',
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        updatedAt: serverTimestamp(),
      });
      toast.success('Rekod derma berjaya dikemaskini');
      router.push('/admin/donations');
    } catch {
      toast.error('Gagal mengemaskini rekod derma');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan rekod derma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/donations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Rekod Derma</h1>
          <p className="text-gray-600 mt-1">Kemaskini maklumat derma</p>
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/admin/donations"
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
              <span>Batal</span>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
