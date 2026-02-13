// app/admin/jadual-kuliah/new/page.tsx
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, X, Upload, Trash2 } from 'lucide-react';
import { createJadualKuliah, getAllJadualKuliah, getActiveKategori } from '@/lib/jadualKuliah';
import { uploadFile, validateFile } from '@/lib/uploadHelpers';
import { KategoriKuliah } from '@/types';
import toast from 'react-hot-toast';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];
const WEEKS = ['Pertama', 'Kedua', 'Ketiga', 'Keempat'];
const PRAYERS = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'] as const;

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
    if (week === 'Semua') {
      setWeekOfMonth(['Semua']);
      return;
    }
    let updated = weekOfMonth.filter(w => w !== 'Semua');
    if (updated.includes(week)) {
      updated = updated.filter(w => w !== week);
    } else {
      updated.push(week);
    }
    if (updated.length === 0) updated = ['Semua'];
    if (updated.length === 4) updated = ['Semua'];
    setWeekOfMonth(updated);
  };

  const handlePosterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/jadual-kuliah" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tambah Kuliah Baru</h1>
          <p className="text-gray-600 mt-1">Masukkan maklumat jadual kuliah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tajuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="cth: Kelas Mengaji Al-Quran"
              disabled={loading}
            />
          </div>

          {/* Ustaz */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ustaz / Penceramah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ustaz}
              onChange={e => setUstaz(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="cth: Ustaz Ahmad"
              disabled={loading}
            />
          </div>

          {/* Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hari <span className="text-red-500">*</span>
            </label>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
            >
              <option value="">Pilih hari</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Week of Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minggu
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWeekOfMonth(['Semua'])}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  weekOfMonth.includes('Semua')
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                Semua
              </button>
              {WEEKS.map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleWeekToggle(w)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    weekOfMonth.includes(w)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={loading}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Time Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Masa <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeType"
                  value="fixed"
                  checked={timeType === 'fixed'}
                  onChange={() => setTimeType('fixed')}
                  className="text-emerald-600 focus:ring-emerald-500"
                  disabled={loading}
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
                  className="text-emerald-600 focus:ring-emerald-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Selepas Solat</span>
              </label>
            </div>
          </div>

          {/* Conditional Time Fields */}
          {timeType === 'fixed' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Masa <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={fixedTime}
                onChange={e => setFixedTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selepas Solat <span className="text-red-500">*</span>
                </label>
                <select
                  value={prayerReference}
                  onChange={e => setPrayerReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                >
                  {PRAYERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minit Selepas
                </label>
                <input
                  type="number"
                  value={minutesAfterPrayer}
                  onChange={e => setMinutesAfterPrayer(Number(e.target.value))}
                  min={0}
                  max={120}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            {kategoriList.length === 0 ? (
              <p className="text-sm text-gray-500">
                Tiada kategori. Sila{' '}
                <Link href="/admin/jadual-kuliah" className="text-emerald-600 underline">
                  tambah kategori
                </Link>{' '}
                terlebih dahulu.
              </p>
            ) : (
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={loading}
              >
                <option value="">Pilih kategori</option>
                {kategoriList.map(k => (
                  <option key={k.id} value={k.name}>{k.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tempat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={e => setVenue(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="cth: Dewan Solat Utama"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Keterangan tambahan (opsional)"
              disabled={loading}
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
              disabled={loading}
            />
            {posterPreview ? (
              <div className="relative w-full max-w-xs">
                <Image
                  src={posterPreview}
                  alt="Pratonton poster"
                  width={320}
                  height={240}
                  className="rounded-lg border border-gray-200 object-cover w-full"
                />
                <button
                  type="button"
                  onClick={removePoster}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xs border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                disabled={loading}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Klik untuk muat naik poster</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP (maks 5MB)</p>
              </button>
            )}
            {uploadProgress && (
              <p className="text-sm text-emerald-600 mt-2">{uploadProgress}</p>
            )}
          </div>

          {/* Active */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                disabled={loading}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="isActive" className="font-medium text-gray-700">Aktif</label>
              <p className="text-sm text-gray-500">Kuliah yang aktif akan dipaparkan di laman awam.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/admin/jadual-kuliah"
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
  );
}
