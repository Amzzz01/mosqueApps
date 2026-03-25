'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getKawasanById, updateKawasan, deleteKawasan } from '@/lib/kawasan';
import { Kawasan, GeoJSONPolygon } from '@/types/kariah';
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

export default function EditKawasanPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const kawasanId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kawasan, setKawasan] = useState<Kawasan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    isActive: true
  });
  const [boundaries, setBoundaries] = useState<GeoJSONPolygon | null>(null);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Pengurusan Ahli']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/pengurusan-ahli/kawasan');
    }
  }, [user, router]);

  useEffect(() => {
    loadKawasan();
  }, [kawasanId]);

  const loadKawasan = async () => {
    try {
      setLoading(true);
      const data = await getKawasanById(kawasanId);
      
      if (!data) {
        toast.error('Kawasan tidak dijumpai');
        router.push('/admin/pengurusan-ahli/kawasan');
        return;
      }

      setKawasan(data);
      setFormData({
        name: data.name,
        color: data.color,
        isActive: data.isActive
      });
      setBoundaries(data.boundaries);
    } catch (error) {
      toast.error('Gagal memuatkan data kawasan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Sila masukkan nama kawasan');
      return;
    }

    try {
      setSaving(true);
      await updateKawasan(kawasanId, {
        name: formData.name.trim(),
        color: formData.color,
        boundaries: boundaries,
        isActive: formData.isActive
      });

      toast.success('Kawasan berjaya dikemas kini');
      router.push('/admin/pengurusan-ahli/kawasan');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengemas kini kawasan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      `Adakah anda pasti untuk memadam kawasan "${formData.name}"?\n\nTindakan ini tidak boleh dibatalkan.`
    );
    if (!confirm) return;

    try {
      setDeleting(true);
      await deleteKawasan(kawasanId);
      toast.success('Kawasan berjaya dipadam');
      router.push('/admin/pengurusan-ahli/kawasan');
    } catch (error: any) {
      toast.error(error.message || 'Gagal memadam kawasan');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Kawasan</h1>
              <p className="text-gray-600 mt-1">
                Kemaskini maklumat kawasan kariah masjid
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memadam...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Padam Kawasan
                </>
              )}
            </button>
          </div>
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
                initialBoundaries={boundaries}
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
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
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
  );
}