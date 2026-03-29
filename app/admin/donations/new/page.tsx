// src/app/admin/donations/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Save, X, User, CircleDollarSign, Calendar, Tag, CreditCard, FileText, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewDonationPage() {
  const router = useRouter();
  const { user } = useAuth();
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
        createdBy: user?.uid || '',
        createdByName: user?.displayName || user?.email || 'Admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col bg-slate-100 min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => router.push('/admin/donations')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Tambah Derma
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Rekodkan derma atau sumbangan baru</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <HeartHandshake size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Baharu</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Derma</p>

            {/* Nama Penderma */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Nama Penderma</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <User size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  name="donorName"
                  value={formData.donorName}
                  onChange={handleChange}
                  placeholder="Nama penderma (opsional)"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                />
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jumlah (RM) <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <CircleDollarSign size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                />
              </div>
            </div>

            {/* Tarikh */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tarikh <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                />
              </div>
            </div>

            {/* Jenis Derma */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jenis Derma <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Tag size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="general">Umum</option>
                  <option value="zakat">Zakat</option>
                  <option value="sadaqah">Sadaqah</option>
                </select>
              </div>
            </div>

            {/* Cara Bayaran */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Cara Bayaran <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <CreditCard size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="cash">Tunai</option>
                  <option value="bank_transfer">Pindahan Bank</option>
                  <option value="online">Bayaran Online</option>
                </select>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Catatan</label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Catatan tambahan (opsional)"
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <button
            type="button"
            onClick={() => router.push('/admin/donations')}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-6 space-y-6">
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
    </>
  );
}