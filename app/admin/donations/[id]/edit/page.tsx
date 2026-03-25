// app/admin/donations/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, Save, X, User, Banknote, Calendar, Tag, CreditCard, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const toDateStr = (val: Date | Timestamp): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return new Date(val).toISOString().split('T')[0];
};

export default function EditDonationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
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

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Derma']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/donations');
    }
  }, [user, router]);

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

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
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
      <div className="flex items-center justify-center min-h-screen bg-slate-100 lg:bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0d7a6b] mx-auto" />
          <p className="mt-3 text-slate-500 text-sm">Memuatkan rekod derma...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
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
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Edit Rekod<br />Derma
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Kemas kini maklumat derma</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <Banknote size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Derma</p>
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
                  disabled={saving}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Kosongkan jika tanpa nama</p>
            </div>

            {/* Jumlah */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jumlah (RM) <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Banknote size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  disabled={saving}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
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
                  disabled={saving}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
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
                  disabled={saving}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 ring-0 focus:ring-0 p-0 appearance-none"
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
                  disabled={saving}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 ring-0 focus:ring-0 p-0 appearance-none"
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
                  rows={3}
                  disabled={saving}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 ring-0 focus:ring-0 focus:outline-none p-0 resize-none"
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
            onClick={() => handleSubmit()}
            disabled={saving}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Kemas Kini
              </>
            )}
          </button>
        </div>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block p-6 space-y-6">
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
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
