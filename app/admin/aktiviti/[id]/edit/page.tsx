// app/admin/aktiviti/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, Upload, Trash2, ImageIcon, Calendar, FileText } from 'lucide-react';
import { getAktivitiById, updateAktiviti } from '@/lib/aktiviti';
import { uploadFiles, deleteFile, validateFile } from '@/lib/uploadHelpers';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

const toDateStr = (val: Date | Timestamp): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return new Date(val).toISOString().split('T')[0];
};

const KATEGORI_OPTIONS = [
  { value: 'keagamaan', label: 'Keagamaan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'kemasyarakatan', label: 'Kemasyarakatan' },
  { value: 'kebajikan', label: 'Kebajikan' },
  { value: 'lain', label: 'Lain-lain' },
] as const;

export default function EditAktivitiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    tajuk: '',
    keterangan: '',
    tarikh: '',
    kategori: 'keagamaan' as 'keagamaan' | 'pendidikan' | 'kemasyarakatan' | 'kebajikan' | 'lain',
    published: false,
  });

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Galeri Aktiviti']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/aktiviti');
    }
  }, [user, router]);

  useEffect(() => { fetchAktiviti(); }, [id]);

  const fetchAktiviti = async () => {
    try {
      const data = await getAktivitiById(id);
      if (data) {
        setFormData({
          tajuk: data.tajuk || '',
          keterangan: data.keterangan || '',
          tarikh: data.tarikh ? toDateStr(data.tarikh) : '',
          kategori: data.kategori || 'keagamaan',
          published: data.published ?? false,
        });
        setExistingImages(data.gambarUrls || []);
      } else {
        toast.error('Aktiviti tidak dijumpai');
        router.push('/admin/aktiviti');
      }
    } catch {
      toast.error('Gagal memuatkan aktiviti');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) { toast.error(error); } else { validFiles.push(file); }
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setNewFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url));
    setRemovedImages(prev => [...prev, url]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.tajuk.trim() || !formData.keterangan.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(removedImages.map(url => deleteFile(url)));

      let newUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploadProgress('Memuat naik gambar...');
        newUrls = await uploadFiles(newFiles, 'aktiviti', (fileIdx, percent) => {
          setUploadProgress(`Memuat naik gambar ${fileIdx + 1}/${newFiles.length} (${percent}%)`);
        });
      }

      setUploadProgress('Menyimpan ke pangkalan data...');
      await updateAktiviti(id, {
        tajuk: formData.tajuk.trim(),
        keterangan: formData.keterangan.trim(),
        tarikh: new Date(formData.tarikh),
        kategori: formData.kategori,
        gambarUrls: [...existingImages, ...newUrls],
        published: formData.published,
      });
      setUploadProgress('');

      toast.success('Aktiviti berjaya dikemaskini');
      router.push('/admin/aktiviti');
    } catch (err) {
      console.error('[aktiviti/edit] Submit failed:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal mengemaskini aktiviti');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          </div>
        </div>
      </div>
    );
  }

  const totalImages = existingImages.length + newPreviews.length;

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
              onClick={() => router.push('/admin/aktiviti')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Edit<br />Aktiviti
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Kemas kini maklumat galeri aktiviti</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <ImageIcon size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Galeri</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">

          {/* Main info card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Aktiviti</p>

            {/* Tajuk */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tajuk <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <FileText size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.tajuk}
                  onChange={e => setFormData(prev => ({ ...prev, tajuk: e.target.value }))}
                  placeholder="Tajuk aktiviti"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
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
                  value={formData.tarikh}
                  onChange={e => setFormData(prev => ({ ...prev, tarikh: e.target.value }))}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {KATEGORI_OPTIONS.map(k => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, kategori: k.value }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      formData.kategori === k.value
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Keterangan <span className="text-red-400">*</span></label>
              <textarea
                value={formData.keterangan}
                onChange={e => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Keterangan aktiviti..."
                required
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 resize-none focus:border-teal-400 transition-colors"
              />
            </div>

            {/* Terbitkan toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-800">Terbitkan Aktiviti</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formData.published ? 'Dipaparkan di galeri awam' : 'Disimpan sebagai draf'}
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

          {/* Gambar card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gambar</p>
              {totalImages > 0 && (
                <span className="text-[10px] text-slate-400">{totalImages} gambar</span>
              )}
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-2">Gambar sedia ada</p>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200">
                      <Image src={url} alt={`Gambar ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images */}
            {newPreviews.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 mb-2">Gambar baru</p>
                <div className="grid grid-cols-3 gap-2">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-rose-200">
                      <Image src={url} alt={`Baru ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add image button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center"
            >
              <Upload className="h-5 w-5 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500">Tambah gambar</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadProgress && <p className="text-xs text-teal-600">{uploadProgress}</p>}
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <button
            type="button"
            onClick={() => router.push('/admin/aktiviti')}
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin/aktiviti"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Senarai
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Aktiviti</h1>
            <p className="text-gray-600 mt-1">Kemaskini maklumat aktiviti</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b">Maklumat Aktiviti</h2>

              {/* Tajuk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tajuk <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.tajuk}
                  onChange={e => setFormData(prev => ({ ...prev, tajuk: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan <span className="text-red-500">*</span></label>
                <textarea
                  value={formData.keterangan}
                  onChange={e => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Tarikh & Kategori */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={formData.tarikh}
                    onChange={e => setFormData(prev => ({ ...prev, tarikh: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
                  <select
                    value={formData.kategori}
                    onChange={e => setFormData(prev => ({ ...prev, kategori: e.target.value as typeof formData.kategori }))}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    disabled={saving}
                  >
                    {KATEGORI_OPTIONS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Image Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>

                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Gambar sedia ada:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {existingImages.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                          <Image src={url} alt={`Gambar ${i + 1}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(url)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newPreviews.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Gambar baru:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {newPreviews.map((url, i) => (
                        <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-rose-300">
                          <Image src={url} alt={`Baru ${i + 1}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewFile(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-rose-400 transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Tambah gambar</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
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
                      formData.published ? 'bg-rose-500' : 'bg-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-600">
                    {formData.published ? 'Diterbitkan di galeri awam' : 'Disimpan sebagai draf'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Link
                href="/admin/aktiviti"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadProgress || 'Menyimpan...'}
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
