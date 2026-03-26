// app/admin/announcements/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { sendNotification } from '@/lib/notifications';
import { ArrowLeft, Save, Loader2, Megaphone, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prevPublished, setPrevPublished] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'event' | 'urgent' | 'reminder',
    priority: 'low' as 'low' | 'medium' | 'high',
    published: false,
  });

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Pengumuman']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/announcements');
    }
  }, [user, router]);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    try {
      const announcementDoc = await getDoc(doc(db, 'announcements', id));
      if (announcementDoc.exists()) {
        const data = announcementDoc.data();
        setFormData({
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'general',
          priority: data.priority || 'low',
          published: data.published ?? false,
        });
        setPrevPublished(data.published ?? false);
      } else {
        toast.error('Pengumuman tidak dijumpai');
        router.push('/admin/announcements');
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast.error('Gagal memuatkan pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'announcements', id), {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        published: formData.published,
        updatedAt: serverTimestamp(),
      });

      // Send notification only when transitioning from draft → published
      if (formData.published && !prevPublished) {
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
          console.error('Failed to send announcement notification:', notifErr);
        }
      }

      toast.success('Pengumuman berjaya dikemaskini');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Gagal mengemaskini pengumuman');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    );
  }

  const categoryLabel = { general: 'Umum', event: 'Acara', urgent: 'Segera', reminder: 'Peringatan' };
  const priorityLabel = { low: 'Biasa', medium: 'Sederhana', high: 'Penting' };

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
              onClick={() => router.push('/admin/announcements')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Edit<br />Pengumuman
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Kemas kini maklumat pengumuman</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <Megaphone size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Pengumuman</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">

          {/* Main form card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Pengumuman</p>

            {/* Tajuk */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Tajuk <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <FileText size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Tajuk pengumuman"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kategori</label>
              <div className="flex gap-2 flex-wrap">
                {(['general', 'event', 'urgent', 'reminder'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      formData.category === cat
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {categoryLabel[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Keutamaan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Keutamaan</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                    className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition-colors ${
                      formData.priority === p
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {priorityLabel[p]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Pengumuman penting akan dipaparkan di bahagian atas</p>
            </div>

            {/* Kandungan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Kandungan <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Kandungan pengumuman..."
                required
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 resize-none focus:border-teal-400 transition-colors"
              />
            </div>

            {/* Status terbit */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-800">Terbitkan Pengumuman</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formData.published ? 'Pengumuman diterbitkan kepada umum' : 'Disimpan sebagai draf'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, published: !prev.published }))}
                className={`w-12 h-6 rounded-full flex items-center transition-colors px-0.5 flex-shrink-0 ${
                  formData.published ? 'bg-[#0d7a6b] justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
              </button>
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
      <div className="hidden lg:block p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/announcements"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Senarai
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Pengumuman</h1>
            <p className="text-gray-600 mt-1">Kemaskini maklumat pengumuman</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b">Maklumat Pengumuman</h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tajuk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masukkan tajuk pengumuman"
                  disabled={saving}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as typeof formData.category }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={saving}
                >
                  <option value="general">Umum</option>
                  <option value="event">Acara</option>
                  <option value="urgent">Segera</option>
                  <option value="reminder">Peringatan</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keutamaan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as typeof formData.priority }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={saving}
                >
                  <option value="low">Biasa</option>
                  <option value="medium">Sederhana</option>
                  <option value="high">Penting</option>
                </select>
                <p className="mt-1.5 text-sm text-gray-500">Pengumuman penting akan dipaparkan di bahagian atas</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kandungan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Masukkan kandungan pengumuman..."
                  disabled={saving}
                />
              </div>

              {/* Published toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, published: !prev.published }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.published ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-600">
                    {formData.published ? 'Diterbitkan kepada umum' : 'Disimpan sebagai draf'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Link
                href="/admin/announcements"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Kemas Kini
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
