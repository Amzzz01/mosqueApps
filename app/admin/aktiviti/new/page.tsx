// app/admin/aktiviti/new/page.tsx
'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, X, Upload, Trash2, CalendarDays, Tag, FileText, Type, CheckSquare } from 'lucide-react';
import { createAktiviti } from '@/lib/aktiviti';
import { uploadFiles, validateFile } from '@/lib/uploadHelpers';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

const KATEGORI = [
  { value: 'keagamaan', label: 'Keagamaan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'kemasyarakatan', label: 'Kemasyarakatan' },
  { value: 'kebajikan', label: 'Kebajikan' },
  { value: 'lain', label: 'Lain-lain' },
] as const;

const iw = 'flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors';
const ii = 'flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0';
const ios = { WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' };

export default function NewAktivitiPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    tajuk: '',
    keterangan: '',
    tarikh: new Date().toISOString().split('T')[0],
    kategori: 'keagamaan' as typeof KATEGORI[number]['value'],
    published: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) toast.error(error);
      else validFiles.push(file);
    }
    if (validFiles.length === 0) { if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    setSelectedFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrls(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.tajuk.trim() || !formData.keterangan.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    setLoading(true);
    try {
      let gambarUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadProgress('Memuat naik gambar...');
        gambarUrls = await uploadFiles(selectedFiles, 'aktiviti', (fileIdx, percent) => {
          setUploadProgress(`Memuat naik gambar ${fileIdx + 1}/${selectedFiles.length} (${percent}%)`);
        });
      }
      setUploadProgress('Menyimpan ke pangkalan data...');
      await createAktiviti({
        tajuk: formData.tajuk.trim(),
        keterangan: formData.keterangan.trim(),
        tarikh: new Date(formData.tarikh),
        kategori: formData.kategori,
        gambarUrls,
        published: formData.published,
      });
      setUploadProgress('');
      toast.success('Aktiviti berjaya ditambah');
      router.push('/admin/aktiviti');
    } catch (err) {
      console.error('[aktiviti/new] Submit failed:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal menambah aktiviti');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Single hidden file input shared by both layouts */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

      {/* ══════════════════════════════════════
          MOBILE  (lg:hidden)
      ══════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-5 pb-6 flex items-end justify-between">
          <div>
            <Link href="/admin/aktiviti" className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2">
              <ArrowLeft size={11} />
              Kembali
            </Link>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">Tambah Aktiviti Baru</h1>
            <p className="text-white/60 text-[10px] mt-1">Masukkan maklumat aktiviti dan gambar</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <CalendarDays size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Aktiviti</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="bg-slate-100 px-3 pt-3 pb-28 space-y-3">

          {/* Card 1: Maklumat Aktiviti */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Aktiviti</p>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tajuk <span className="text-red-400">*</span></label>
              <div className={iw}>
                <Type size={14} className="text-slate-400 flex-shrink-0" />
                <input type="text" name="tajuk" value={formData.tajuk} onChange={handleChange} placeholder="cth: Majlis Maulidur Rasul 2025" className={ii} style={ios} disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Keterangan <span className="text-red-400">*</span></label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} rows={4} placeholder="Keterangan mengenai aktiviti..." className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0 resize-none" disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tarikh <span className="text-red-400">*</span></label>
              <div className={iw}>
                <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
                <input type="date" name="tarikh" value={formData.tarikh} onChange={handleChange} className={ii} disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kategori</label>
              <div className="grid grid-cols-2 gap-2">
                {KATEGORI.map(k => (
                  <button key={k.value} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, kategori: k.value }))}
                    disabled={loading}
                    className={`h-10 rounded-xl text-[11px] font-bold border transition-colors ${formData.kategori === k.value ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Gambar & Penerbitan */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Gambar & Penerbitan</p>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Gambar</label>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
                className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:border-teal-400 transition-colors disabled:opacity-50">
                <Upload className="h-6 w-6 text-slate-400" />
                <p className="text-xs font-medium text-slate-500">Klik untuk memilih gambar</p>
                <p className="text-[10px] text-slate-400">JPG, PNG, GIF (maks 5MB setiap satu)</p>
              </button>
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200">
                      <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadProgress && <p className="text-xs text-teal-600 mt-2">{uploadProgress}</p>}
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Status Penerbitan</label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 cursor-pointer"
                onClick={() => !loading && setFormData(prev => ({ ...prev, published: !prev.published }))}>
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className={formData.published ? 'text-teal-500' : 'text-slate-400'} />
                  <span className="text-sm text-slate-700 font-medium">Terbitkan ke galeri awam</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${formData.published ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${formData.published ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <Link href="/admin/aktiviti"
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold flex items-center justify-center">
            Batal
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20">
            {loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Save size={14} />Simpan</>}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP  (hidden lg:block)
      ══════════════════════════════════════ */}
      <div className="hidden lg:block p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/aktiviti" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tambah Aktiviti Baru</h1>
            <p className="text-gray-600 mt-1">Masukkan maklumat aktiviti dan gambar</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tajuk <span className="text-red-500">*</span></label>
              <input type="text" name="tajuk" value={formData.tajuk} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="cth: Majlis Maulidur Rasul 2025" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan <span className="text-red-500">*</span></label>
              <textarea name="keterangan" value={formData.keterangan} onChange={handleChange} required rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Keterangan mengenai aktiviti..." disabled={loading} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarikh <span className="text-red-500">*</span></label>
                <input type="date" name="tarikh" value={formData.tarikh} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
                <select name="kategori" value={formData.kategori} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading}>
                  {KATEGORI.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Klik untuk memilih gambar</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (maks 5MB setiap satu)</p>
              </div>
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                      <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
                      <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="published" name="published" type="checkbox" checked={formData.published} onChange={handleChange} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" disabled={loading} />
              </div>
              <div className="ml-3">
                <label htmlFor="published" className="font-medium text-gray-700">Terbitkan</label>
                <p className="text-sm text-gray-500">Aktiviti yang diterbitkan akan dipaparkan di galeri awam.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link href="/admin/aktiviti" className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="h-5 w-5" /><span>Batal</span>
              </Link>
              <button type="submit" disabled={loading} className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-5 w-5" /><span>{loading ? (uploadProgress || 'Menyimpan...') : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </form>
  );
}
