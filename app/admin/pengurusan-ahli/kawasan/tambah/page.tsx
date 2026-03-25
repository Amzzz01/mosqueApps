'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, MapPin, Palette, Map, LayoutGrid } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createKawasan } from '@/lib/kawasan';
import { GeoJSONPolygon } from '@/types/kariah';
import toast from 'react-hot-toast';

// Dynamically import map component (client-side only)
const KariahMapEditor = dynamic(
  () => import('@/components/admin/KariahMapEditor'),
  { ssr: false }
);

const PRESET_COLORS = [
  { name: 'Biru', value: '#3B82F6' },
  { name: 'Merah', value: '#EF4444' },
  { name: 'Hijau', value: '#10B981' },
  { name: 'Kuning', value: '#F59E0B' },
  { name: 'Ungu', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
];

export default function TambahKawasanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    isActive: true
  });
  const [boundaries, setBoundaries] = useState<GeoJSONPolygon | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Sila masukkan nama kawasan');
      return;
    }

    try {
      setLoading(true);
      await createKawasan({
        name: formData.name.trim(),
        color: formData.color,
        boundaries: boundaries,
        isActive: formData.isActive
      });

      toast.success('Kawasan berjaya ditambah');
      router.push('/admin/pengurusan-ahli/kawasan');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambah kawasan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col bg-slate-100 min-h-screen">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => router.push('/admin/pengurusan-ahli/kawasan')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Tambah Kawasan<br />Baharu
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Daftarkan kawasan kariah baharu</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <LayoutGrid size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Baharu</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">

          {/* Maklumat Kawasan card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Kawasan</p>

            {/* Nama Kawasan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Nama Kawasan <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kampung Luar, Taman Bagan Luar"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Status toggle */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Status Kawasan</label>
              <div className="flex gap-3">
                {[
                  { label: 'Aktif', value: true },
                  { label: 'Tidak Aktif', value: false },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: opt.value })}
                    className={`flex-1 h-11 rounded-2xl text-xs font-semibold border transition-colors ${
                      formData.isActive === opt.value
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Kawasan aktif akan dipaparkan dalam borang pendaftaran</p>
            </div>
          </div>

          {/* Warna Kawasan card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette size={13} className="text-[#0d7a6b]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Warna Kawasan</p>
            </div>

            {/* Preset swatches */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 block">Pilih Warna</label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                    className={`relative h-9 rounded-xl border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-slate-700 scale-110 shadow-sm'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {formData.color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom color */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Atau warna sendiri</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl border-2 border-slate-200 flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: formData.color }}
                >
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors flex-1">
                  <span className="text-slate-400 text-xs font-mono">#</span>
                  <input
                    type="text"
                    value={formData.color.replace('#', '')}
                    onChange={e => setFormData({ ...formData, color: '#' + e.target.value })}
                    placeholder="3B82F6"
                    maxLength={6}
                    className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 ring-0 focus:ring-0 focus:outline-none p-0 font-mono"
                    style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Map Editor card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Map size={13} className="text-[#0d7a6b]" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800">Sempadan Kawasan</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Lukis sempadan untuk auto-detection (pilihan)</p>
              </div>
              {boundaries && (
                <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  {boundaries.coordinates[0].length} titik
                </span>
              )}
            </div>
            <div className="p-2">
              <KariahMapEditor
                color={formData.color}
                onBoundariesChange={setBoundaries}
                height="300px"
              />
            </div>
            {!boundaries && (
              <p className="px-4 pb-3 text-[10px] text-slate-400 text-center">
                Jika tidak dilukis, ahli perlu pilih kawasan secara manual
              </p>
            )}
          </div>

        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <button
            type="button"
            onClick={() => router.push('/admin/pengurusan-ahli/kawasan')}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Simpan Kawasan
              </>
            )}
          </button>
        </div>

      </div>

      {/* ── Desktop layout (unchanged) ── */}
      <div className="hidden lg:block">
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                href="/admin/pengurusan-ahli/kawasan"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali ke Senarai Kawasan
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Tambah Kawasan Baru</h1>
              <p className="text-gray-600 mt-1">
                Tambah kawasan kariah masjid dengan sempadan peta
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                {/* Nama Kawasan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nama Kawasan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Kampung Luar, Taman Bagan Luar"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Warna Kawasan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Warna Kawasan <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`relative h-12 rounded-lg border-2 transition-all ${
                          formData.color === color.value
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {formData.color === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-gray-900 rounded-full" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">
                      Atau pilih warna sendiri:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Aktifkan kawasan ini
                      </span>
                      <p className="text-xs text-gray-600">
                        Kawasan aktif akan dipaparkan dalam borang pendaftaran
                      </p>
                    </div>
                  </label>
                </div>

                {/* Map Editor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sempadan Kawasan (Pilihan)
                  </label>
                  <p className="text-sm text-gray-600 mb-4">
                    Lukis sempadan kawasan pada peta untuk auto-detection. Jika tidak dilukis,
                    ahli perlu pilih kawasan secara manual.
                  </p>
                  <KariahMapEditor
                    color={formData.color}
                    onBoundariesChange={setBoundaries}
                    height="500px"
                  />
                </div>

                {/* Boundaries Info */}
                {boundaries && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      ✓ Sempadan kawasan telah dilukis ({boundaries.coordinates[0].length} titik)
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Kawasan
                    </>
                  )}
                </button>
                <Link
                  href="/admin/pengurusan-ahli/kawasan"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
