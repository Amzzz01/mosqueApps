// app/admin/jadual-kuliah/new/page.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, X, Upload, Trash2, BookOpen, User, Clock, Tag, MapPin, FileText, CheckSquare } from 'lucide-react';
import { createJadualKuliah, getAllJadualKuliah, getActiveKategori } from '@/lib/jadualKuliah';
import { uploadFile, validateFile } from '@/lib/uploadHelpers';
import { KategoriKuliah } from '@/types';
import toast from 'react-hot-toast';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
const WEEKS = ['Pertama', 'Kedua', 'Ketiga', 'Keempat'];
const PRAYERS = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'] as const;

const iw = 'flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors';
const ii = 'flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0';
const ios = { WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' };

export default function NewJadualKuliahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getActiveKategori()
      .then(setKategoriList)
      .catch(() => toast.error('Gagal memuatkan kategori'));
  }, []);

  const handleWeekToggle = (week: string) => {
    if (week === 'Semua') { setWeekOfMonth(['Semua']); return; }
    let updated = weekOfMonth.filter(w => w !== 'Semua');
    if (updated.includes(week)) updated = updated.filter(w => w !== week);
    else updated.push(week);
    if (updated.length === 0 || updated.length === 4) updated = ['Semua'];
    setWeekOfMonth(updated);
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) { toast.error(error); return; }
    setPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPosterPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ustaz.trim() || !day) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    if (timeType === 'fixed' && !fixedTime) {
      toast.error('Sila masukkan masa');
      return;
    }
    setLoading(true);
    try {
      let posterUrl: string | null = null;
      if (posterFile) {
        setUploadProgress('Memuat naik poster...');
        posterUrl = await uploadFile(posterFile, 'jadual-kuliah');
        setUploadProgress('');
      }
      const allJadual = await getAllJadualKuliah();
      const maxSeq = allJadual.reduce((max, j) => Math.max(max, j.sequence ?? 0), 0);
      await createJadualKuliah({
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
        posterUrl,
        sequence: maxSeq + 1,
        isActive,
      });
      toast.success('Kuliah berjaya ditambah');
      router.push('/admin/jadual-kuliah');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah kuliah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Single hidden file input shared by both layouts */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handlePosterSelect} className="hidden" disabled={loading} />

      {/* ══════════════════════════════════════
          MOBILE  (lg:hidden)
      ══════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-5 pb-6 flex items-end justify-between">
          <div>
            <Link href="/admin/jadual-kuliah" className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2">
              <ArrowLeft size={11} />
              Kembali
            </Link>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">Tambah Kuliah Baru</h1>
            <p className="text-white/60 text-[10px] mt-1">Masukkan maklumat jadual kuliah</p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <BookOpen size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Kuliah</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="bg-slate-100 px-3 pt-3 pb-28 space-y-3">

          {/* Card 1: Maklumat Kuliah */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Kuliah</p>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tajuk <span className="text-red-400">*</span></label>
              <div className={iw}>
                <BookOpen size={14} className="text-slate-400 flex-shrink-0" />
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="cth: Kelas Mengaji Al-Quran" className={ii} style={ios} disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Ustaz / Penceramah <span className="text-red-400">*</span></label>
              <div className={iw}>
                <User size={14} className="text-slate-400 flex-shrink-0" />
                <input type="text" value={ustaz} onChange={e => setUstaz(e.target.value)} placeholder="cth: Ustaz Ahmad" className={ii} style={ios} disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kategori</label>
              {kategoriList.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-2xl px-3 py-3">
                  Tiada kategori. <Link href="/admin/jadual-kuliah" className="text-teal-600 underline">Tambah kategori</Link> terlebih dahulu.
                </p>
              ) : (
                <div className={iw}>
                  <Tag size={14} className="text-slate-400 flex-shrink-0" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className={`${ii} appearance-none`} disabled={loading}>
                    <option value="">Pilih kategori</option>
                    {kategoriList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tempat <span className="text-red-400">*</span></label>
              <div className={iw}>
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="cth: Dewan Solat Utama" className={ii} style={ios} disabled={loading} />
              </div>
            </div>
          </div>

          {/* Card 2: Jadual */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Jadual</p>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Hari <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => setDay(d)} disabled={loading}
                    className={`h-9 rounded-xl text-[11px] font-bold border transition-colors ${day === d ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {d.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Minggu</label>
              <div className="flex flex-wrap gap-2">
                {(['Semua', ...WEEKS]).map(w => (
                  <button key={w} type="button"
                    onClick={() => w === 'Semua' ? setWeekOfMonth(['Semua']) : handleWeekToggle(w)}
                    disabled={loading}
                    className={`px-3 h-9 rounded-xl text-[11px] font-bold border transition-colors ${weekOfMonth.includes(w) ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jenis Masa <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {(['fixed', 'afterPrayer'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTimeType(t)} disabled={loading}
                    className={`h-10 rounded-xl text-[11px] font-bold border transition-colors ${timeType === t ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {t === 'fixed' ? 'Masa Tetap' : 'Selepas Solat'}
                  </button>
                ))}
              </div>
            </div>

            {timeType === 'fixed' ? (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Masa <span className="text-red-400">*</span></label>
                <div className={iw}>
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <input type="time" value={fixedTime} onChange={e => setFixedTime(e.target.value)} className={ii} disabled={loading} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Selepas Solat <span className="text-red-400">*</span></label>
                  <div className={iw}>
                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                    <select value={prayerReference} onChange={e => setPrayerReference(e.target.value)} className={`${ii} appearance-none`} disabled={loading}>
                      {PRAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Minit Selepas</label>
                  <div className={iw}>
                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                    <input type="number" value={minutesAfterPrayer} onChange={e => setMinutesAfterPrayer(Number(e.target.value))} min={0} max={120} className={ii} disabled={loading} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Tambahan */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Tambahan</p>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Keterangan</label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <FileText size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Keterangan tambahan (opsional)" className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0 resize-none" disabled={loading} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Poster</label>
              {posterPreview ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200">
                  <Image src={posterPreview} alt="Pratonton poster" fill className="object-cover" />
                  <button type="button" onClick={removePoster} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full" disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-teal-400 transition-colors disabled:opacity-50">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <p className="text-xs font-medium text-slate-500">Klik untuk muat naik poster</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, GIF, WEBP (maks 5MB)</p>
                </button>
              )}
              {uploadProgress && <p className="text-xs text-teal-600 mt-2">{uploadProgress}</p>}
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Status Kuliah</label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 cursor-pointer"
                onClick={() => !loading && setIsActive(v => !v)}>
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className={isActive ? 'text-teal-500' : 'text-slate-400'} />
                  <span className="text-sm text-slate-700 font-medium">Aktifkan untuk tatapan awam</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <Link href="/admin/jadual-kuliah"
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
      <div className="hidden lg:block p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/jadual-kuliah" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tambah Kuliah Baru</h1>
            <p className="text-gray-600 mt-1">Masukkan maklumat jadual kuliah</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tajuk <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="cth: Kelas Mengaji Al-Quran" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ustaz / Penceramah <span className="text-red-500">*</span></label>
              <input type="text" value={ustaz} onChange={e => setUstaz(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="cth: Ustaz Ahmad" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hari <span className="text-red-500">*</span></label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading}>
                <option value="">Pilih hari</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minggu</label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setWeekOfMonth(['Semua'])} disabled={loading}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${weekOfMonth.includes('Semua') ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Semua
                </button>
                {WEEKS.map(w => (
                  <button key={w} type="button" onClick={() => handleWeekToggle(w)} disabled={loading}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${weekOfMonth.includes(w) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Masa <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="timeType" value="fixed" checked={timeType === 'fixed'} onChange={() => setTimeType('fixed')} className="text-emerald-600 focus:ring-emerald-500" disabled={loading} />
                  <span className="text-sm text-gray-700">Masa Tetap</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="timeType" value="afterPrayer" checked={timeType === 'afterPrayer'} onChange={() => setTimeType('afterPrayer')} className="text-emerald-600 focus:ring-emerald-500" disabled={loading} />
                  <span className="text-sm text-gray-700">Selepas Solat</span>
                </label>
              </div>
            </div>

            {timeType === 'fixed' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Masa <span className="text-red-500">*</span></label>
                <input type="time" value={fixedTime} onChange={e => setFixedTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selepas Solat <span className="text-red-500">*</span></label>
                  <select value={prayerReference} onChange={e => setPrayerReference(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading}>
                    {PRAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minit Selepas</label>
                  <input type="number" value={minutesAfterPrayer} onChange={e => setMinutesAfterPrayer(Number(e.target.value))} min={0} max={120} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
              {kategoriList.length === 0 ? (
                <p className="text-sm text-gray-500">Tiada kategori. Sila <Link href="/admin/jadual-kuliah" className="text-emerald-600 underline">tambah kategori</Link> terlebih dahulu.</p>
              ) : (
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading}>
                  <option value="">Pilih kategori</option>
                  {kategoriList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tempat <span className="text-red-500">*</span></label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="cth: Dewan Solat Utama" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Keterangan tambahan (opsional)" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poster</label>
              {posterPreview ? (
                <div className="relative w-full max-w-xs">
                  <Image src={posterPreview} alt="Pratonton poster" width={320} height={240} className="rounded-lg border border-gray-200 object-cover w-full" />
                  <button type="button" onClick={removePoster} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors" disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors" disabled={loading}>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Klik untuk muat naik poster</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (maks 5MB)</p>
                </button>
              )}
              {uploadProgress && <p className="text-sm text-emerald-600 mt-2">{uploadProgress}</p>}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="isActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" disabled={loading} />
              </div>
              <div className="ml-3">
                <label htmlFor="isActive" className="font-medium text-gray-700">Aktif</label>
                <p className="text-sm text-gray-500">Kuliah yang aktif akan dipaparkan di laman awam.</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Link href="/admin/jadual-kuliah" className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <X className="h-5 w-5" /><span>Batal</span>
              </Link>
              <button type="submit" disabled={loading} className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="h-5 w-5" /><span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </form>
  );
}
