// app/admin/announcements/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { sendNotification } from '@/lib/notifications';
import { ArrowLeft, Save, X, Megaphone, Type, Tag, AlertCircle, AlignLeft, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'event' | 'urgent' | 'reminder',
    priority: 'low' as 'low' | 'medium' | 'high',
    published: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'announcements'), {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        published: formData.published,
        author: user?.email || 'Admin',
        authorId: user?.uid || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send notification if announcement is published
      if (formData.published) {
        try {
          const bodyPreview = formData.content.trim().length > 100
            ? formData.content.trim().slice(0, 100) + '...'
            : formData.content.trim();
          await sendNotification({
            title: formData.title.trim(),
            body: bodyPreview,
            recipientType: 'all',
            url: '/announcements',
            createdBy: user?.uid || 'system',
          });
        } catch (notifErr) {
          // Notification failure must not block announcement save
          console.error('Failed to send announcement notification:', notifErr);
        }
      }

      toast.success('Pengumuman berjaya dibuat');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Gagal membuat pengumuman');
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
              onClick={() => router.push('/admin/announcements')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Tambah Pengumuman Baru
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Cipta pengumuman untuk jemaah</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <Megaphone size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Hebahan</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Pengumuman</p>

            {/* Title */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Tajuk <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Type size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan tajuk pengumuman"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Kategori <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Tag size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="general">Umum</option>
                  <option value="event">Acara</option>
                  <option value="urgent">Segera</option>
                  <option value="reminder">Peringatan</option>
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Keutamaan <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <AlertCircle size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="low">Biasa</option>
                  <option value="medium">Sederhana</option>
                  <option value="high">Penting</option>
                </select>
              </div>
            </div>

            {/* Published Switch */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Status Terbitan
              </label>
              <div
                className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 cursor-pointer transition-colors"
                onClick={() => setFormData(p => ({ ...p, published: !p.published }))}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className={`${formData.published ? 'text-teal-500' : 'text-slate-400'} flex-shrink-0`} />
                  <span className="text-sm text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Terbitkan kepada jemaah</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${formData.published ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formData.published ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Kandungan <span className="text-red-400">*</span>
              </label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <AlignLeft size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan kandungan pengumuman..."
                  rows={8}
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
            onClick={() => router.push('/admin/announcements')}
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
          <Link
            href="/admin/announcements"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Pengumuman Baru</h1>
            <p className="text-gray-600 mt-1">Cipta pengumuman untuk jemaah</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tajuk <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan tajuk pengumuman"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
              >
                <option value="general">Umum</option>
                <option value="event">Acara</option>
                <option value="urgent">Segera</option>
                <option value="reminder">Peringatan</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Keutamaan <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
              >
                <option value="low">Biasa</option>
                <option value="medium">Sederhana</option>
                <option value="high">Penting</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Pengumuman penting akan dipaparkan di bahagian atas
              </p>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Kandungan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Masukkan kandungan pengumuman..."
                disabled={loading}
              />
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  checked={formData.published}
                  onChange={handleChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  disabled={loading}
                />
              </div>
              <div className="ml-3">
                <label htmlFor="published" className="font-medium text-gray-700">
                  Terbitkan pengumuman
                </label>
                <p className="text-sm text-gray-500">
                  Pengumuman yang diterbitkan akan kelihatan kepada umum. Jika tidak ditanda, pengumuman akan disimpan sebagai draf.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link
                href="/admin/announcements"
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5" />
                <span>Batal</span>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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