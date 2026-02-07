// app/admin/kuliah/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { getKuliahById, updateKuliah } from '@/lib/kuliah';
import toast from 'react-hot-toast';

export default function EditKuliahPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tajuk: '',
    penceramah: '',
    hari: '',
    masa: '',
    lokasi: '',
    kategori: 'umum' as 'quran' | 'hadis' | 'fiqh' | 'akhlak' | 'umum',
    keterangan: '',
    aktif: true,
  });

  useEffect(() => { fetchKuliah(); }, [params.id]);

  const fetchKuliah = async () => {
    try {
      const data = await getKuliahById(params.id as string);
      if (data) {
        setFormData({
          tajuk: data.tajuk || '',
          penceramah: data.penceramah || '',
          hari: data.hari || '',
          masa: data.masa || '',
          lokasi: data.lokasi || '',
          kategori: data.kategori || 'umum',
          keterangan: data.keterangan || '',
          aktif: data.aktif ?? true,
        });
      } else {
        toast.error('Kuliah tidak dijumpai');
        router.push('/admin/kuliah');
      }
    } catch (err) {
      console.error('[kuliah/edit] Fetch failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuatkan kuliah';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.tajuk.trim() || !formData.penceramah.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    setSaving(true);
    try {
      await updateKuliah(params.id as string, {
        tajuk: formData.tajuk.trim(),
        penceramah: formData.penceramah.trim(),
        hari: formData.hari.trim(),
        masa: formData.masa.trim(),
        lokasi: formData.lokasi.trim(),
        kategori: formData.kategori,
        keterangan: formData.keterangan.trim() || '',
        aktif: formData.aktif,
      });
      toast.success('Kuliah berjaya dikemaskini');
      router.push('/admin/kuliah');
    } catch (err) {
      console.error('[kuliah/edit] Submit failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengemaskini kuliah';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan kuliah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/kuliah" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Kuliah</h1>
          <p className="text-gray-600 mt-1">Kemaskini maklumat kuliah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tajuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tajuk"
              value={formData.tajuk}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Penceramah <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="penceramah"
              value={formData.penceramah}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hari <span className="text-red-500">*</span>
              </label>
              <select
                name="hari"
                value={formData.hari}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={saving}
              >
                <option value="">Pilih hari</option>
                <option value="Isnin">Isnin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Khamis">Khamis</option>
                <option value="Jumaat">Jumaat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Ahad">Ahad</option>
                <option value="Isnin & Khamis">Isnin & Khamis</option>
                <option value="Selasa & Jumaat">Selasa & Jumaat</option>
                <option value="Setiap Hari">Setiap Hari</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Masa <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="masa"
                value={formData.masa}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lokasi"
              value={formData.lokasi}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="kategori"
              value={formData.kategori}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            >
              <option value="quran">Al-Quran</option>
              <option value="hadis">Hadis</option>
              <option value="fiqh">Fiqh</option>
              <option value="akhlak">Akhlak</option>
              <option value="umum">Umum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="aktif"
                name="aktif"
                type="checkbox"
                checked={formData.aktif}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                disabled={saving}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="aktif" className="font-medium text-gray-700">Aktif</label>
              <p className="text-sm text-gray-500">Kuliah yang aktif akan dipaparkan di laman awam.</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/admin/kuliah"
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
              <Save className="h-5 w-5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
