// app/admin/jadual-kuliah/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, Upload, Trash2, BookOpen, MapPin, Clock } from 'lucide-react';
import { getJadualKuliahById, updateJadualKuliah, getActiveKategori } from '@/lib/jadualKuliah';
import { uploadFile, deleteFile, validateFile } from '@/lib/uploadHelpers';
import { KategoriKuliah } from '@/types';
import toast from 'react-hot-toast';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
const WEEKS = ['Pertama', 'Kedua', 'Ketiga', 'Keempat'];
const PRAYERS = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'] as const;

export default function EditJadualKuliahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriKuliah[]>([]);

  const [title, setTitle] = useState('');
  const [day, setDay] = useState('');
  const [weekOfMonth, setWeekOfMonth] = useState<string[]>(['Semua']);
  const [timeType, setTimeType] = useState<'fixed' | 'afterPrayer'>('fixed');
  const [fixedTime, setFixedTime] = useState('');
  const [prayerReference, setPrayerReference] = useState<string>('Maghrib');
  const [minutesAfterPrayer, setMinutesAfterPrayer] = useState(15);
  const [category, setCategory] = useState('');
  const [ustaz, setUstaz] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterRemoved, setPosterRemoved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Jadual Kuliah']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/jadual-kuliah');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, kategoris] = await Promise.all([
          getJadualKuliahById(id),
          getActiveKategori(),
        ]);
        setKategoriList(kategoris);

        if (data) {
          setTitle(data.title || '');
          setDay(data.day || '');
          setWeekOfMonth(data.weekOfMonth || ['Semua']);
          setTimeType(data.timeType || 'fixed');
          setFixedTime(data.fixedTime || '');
          setPrayerReference(data.prayerReference || 'Maghrib');
          setMinutesAfterPrayer(data.minutesAfterPrayer ?? 15);
          setCategory(data.category || '');
          setUstaz(data.ustaz || '');
          setVenue(data.venue || '');
          setDescription(data.description || '');
          setIsActive(data.isActive ?? true);
          if (data.posterUrl) setExistingPosterUrl(data.posterUrl);
        } else {
          toast.error('Kuliah tidak dijumpai');
          router.push('/admin/jadual-kuliah');
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal memuatkan data');
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleWeekToggle = (week: string) => {
    if (week === 'Semua') { setWeekOfMonth(['Semua']); return; }
    let updated = weekOfMonth.filter(w => w !== 'Semua');
    if (updated.includes(week)) {
      updated = updated.filter(w => w !== week);
    } else {
      updated.push(week);
    }
    if (updated.length === 0 || updated.length === 4) updated = ['Semua'];
    setWeekOfMonth(updated);
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { toast.error(error); return; }
    setPosterFile(file);
    setPosterRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => setPosterPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview('');
    setPosterRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !ustaz.trim() || !day) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    if (timeType === 'fixed' && !fixedTime) {
      toast.error('Sila masukkan masa');
      return;
    }

    setSaving(true);
    try {
      let posterUrl: string | null | undefined = undefined;
      if (posterFile) {
        setUploadProgress('Memuat naik poster...');
        posterUrl = await uploadFile(posterFile, 'jadual-kuliah');
        setUploadProgress('');
        if (existingPosterUrl) deleteFile(existingPosterUrl).catch(() => {});
      } else if (posterRemoved) {
        posterUrl = null;
        if (existingPosterUrl) deleteFile(existingPosterUrl).catch(() => {});
      }

      const updateData: Record<string, unknown> = {
        title: title.trim(),
        day,
        weekOfMonth,
        timeType,
        fixedTime: timeType === 'fixed' ? fixedTime : null,
        prayerReference: timeType === 'afterPrayer' ? prayerReference as typeof PRAYERS[number] : null,
        minutesAfterPrayer: timeType === 'afterPrayer' ? minutesAfterPrayer : null,
        category: category || (kategoriList[0]?.name ?? ''),
        ustaz: ustaz.trim(),
        venue: venue.trim(),
        description: description.trim(),
        isActive,
      };
      if (posterUrl !== undefined) updateData.posterUrl = posterUrl;

      await updateJadualKuliah(id, updateData);
      toast.success('Kuliah berjaya dikemaskini');
      router.push('/admin/jadual-kuliah');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengemaskini kuliah');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        </div>
      </div>
    );
  }

  const currentPosterSrc = posterPreview || (existingPosterUrl && !posterRemoved ? existingPosterUrl : null);

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
              onClick={() => router.push('/admin/jadual-kuliah')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Edit Jadual<br />Kuliah
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Kemas kini maklumat kuliah</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <BookOpen size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Kuliah</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">

          {/* Basic info card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Kuliah</p>

            {/* Tajuk */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tajuk <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <BookOpen size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Tajuk kuliah"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Ustaz */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Ustaz / Penceramah <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <input
                  type="text"
                  value={ustaz}
                  onChange={e => setUstaz(e.target.value)}
                  placeholder="Nama ustaz / penceramah"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Tempat */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tempat <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder="Tempat kuliah"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Jadual card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Jadual</p>

            {/* Hari */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Hari <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <select
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="">Pilih hari</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Minggu */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Minggu</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOfMonth(['Semua'])}
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold border transition-colors ${
                    weekOfMonth.includes('Semua') ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  Semua
                </button>
                {WEEKS.map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleWeekToggle(w)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-semibold border transition-colors ${
                      weekOfMonth.includes(w) ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Jenis Masa */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jenis Masa</label>
              <div className="flex gap-2">
                {(['fixed', 'afterPrayer'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeType(t)}
                    className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition-colors ${
                      timeType === t ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {t === 'fixed' ? 'Masa Tetap' : 'Selepas Solat'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional time fields */}
            {timeType === 'fixed' ? (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Masa <span className="text-red-400">*</span></label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="time"
                    value={fixedTime}
                    onChange={e => setFixedTime(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0"
                    style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Selepas Solat</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 focus-within:border-teal-400 transition-colors">
                    <select
                      value={prayerReference}
                      onChange={e => setPrayerReference(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0 appearance-none"
                    >
                      {PRAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Minit Selepas</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 focus-within:border-teal-400 transition-colors">
                    <input
                      type="number"
                      value={minutesAfterPrayer}
                      onChange={e => setMinutesAfterPrayer(Number(e.target.value))}
                      min={0}
                      max={120}
                      className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0"
                      style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Kategori */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kategori</label>
              {kategoriList.length === 0 ? (
                <p className="text-xs text-slate-500">Tiada kategori. Sila tambah kategori terlebih dahulu.</p>
              ) : (
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 focus-within:border-teal-400 transition-colors">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0 appearance-none"
                  >
                    <option value="">Pilih kategori</option>
                    {kategoriList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Poster & Details card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Poster & Keterangan</p>

            {/* Poster */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Poster</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePosterSelect}
                className="hidden"
              />
              {currentPosterSrc ? (
                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200">
                  <Image
                    src={currentPosterSrc}
                    alt="Poster kuliah"
                    width={320}
                    height={180}
                    className="w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-700 p-1.5 rounded-full shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={removePoster}
                      className="bg-red-500 text-white p-1.5 rounded-full"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center"
                >
                  <Upload className="h-6 w-6 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Klik untuk muat naik poster</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, GIF, WEBP (maks 5MB)</p>
                </button>
              )}
              {uploadProgress && <p className="text-xs text-teal-600 mt-1.5">{uploadProgress}</p>}
            </div>

            {/* Keterangan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Keterangan</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Keterangan tambahan (pilihan)"
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-300 resize-none focus:border-teal-400 transition-colors"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-800">Status Kuliah</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isActive ? 'Kuliah aktif dipaparkan di laman awam' : 'Kuliah tidak dipaparkan'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(prev => !prev)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors px-0.5 flex-shrink-0 ${
                  isActive ? 'bg-[#0d7a6b] justify-end' : 'bg-slate-300 justify-start'
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
            onClick={() => router.push('/admin/jadual-kuliah')}
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
              href="/admin/jadual-kuliah"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Senarai
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Kuliah</h1>
            <p className="text-gray-600 mt-1">Kemaskini maklumat jadual kuliah</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b">Maklumat Kuliah</h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tajuk <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Ustaz */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ustaz / Penceramah <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={ustaz}
                  onChange={e => setUstaz(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hari <span className="text-red-500">*</span></label>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={saving}
                >
                  <option value="">Pilih hari</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Week of Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minggu</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWeekOfMonth(['Semua'])}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      weekOfMonth.includes('Semua') ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={saving}
                  >
                    Semua
                  </button>
                  {WEEKS.map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWeekToggle(w)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        weekOfMonth.includes(w) ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={saving}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Masa <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeType"
                      value="fixed"
                      checked={timeType === 'fixed'}
                      onChange={() => setTimeType('fixed')}
                      className="text-amber-600 focus:ring-amber-500"
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-700">Masa Tetap</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="timeType"
                      value="afterPrayer"
                      checked={timeType === 'afterPrayer'}
                      onChange={() => setTimeType('afterPrayer')}
                      className="text-amber-600 focus:ring-amber-500"
                      disabled={saving}
                    />
                    <span className="text-sm text-gray-700">Selepas Solat</span>
                  </label>
                </div>
              </div>

              {/* Conditional Time Fields */}
              {timeType === 'fixed' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Masa <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={fixedTime}
                    onChange={e => setFixedTime(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={saving}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selepas Solat <span className="text-red-500">*</span></label>
                    <select
                      value={prayerReference}
                      onChange={e => setPrayerReference(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={saving}
                    >
                      {PRAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minit Selepas</label>
                    <input
                      type="number"
                      value={minutesAfterPrayer}
                      onChange={e => setMinutesAfterPrayer(Number(e.target.value))}
                      min={0}
                      max={120}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                {kategoriList.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Tiada kategori. Sila{' '}
                    <Link href="/admin/jadual-kuliah" className="text-amber-600 underline">tambah kategori</Link>{' '}
                    terlebih dahulu.
                  </p>
                ) : (
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={saving}
                  >
                    <option value="">Pilih kategori</option>
                    {kategoriList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                  </select>
                )}
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tempat <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  disabled={saving}
                />
              </div>

              {/* Poster Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Poster</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handlePosterSelect}
                  className="hidden"
                  disabled={saving}
                />
                {currentPosterSrc ? (
                  <div className="relative w-full max-w-xs">
                    <Image
                      src={currentPosterSrc}
                      alt="Poster kuliah"
                      width={320}
                      height={240}
                      className="rounded-lg border border-gray-200 object-cover w-full"
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-gray-100 shadow-sm"
                        disabled={saving}
                      >
                        <Upload className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={removePoster}
                        className="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-xs border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
                    disabled={saving}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Klik untuk muat naik poster</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (maks 5MB)</p>
                  </button>
                )}
                {uploadProgress && <p className="text-sm text-amber-600 mt-2">{uploadProgress}</p>}
              </div>

              {/* Active toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsActive(prev => !prev)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      isActive ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-600">
                    {isActive ? 'Aktif — dipaparkan di laman awam' : 'Tidak aktif'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <Link
                href="/admin/jadual-kuliah"
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
