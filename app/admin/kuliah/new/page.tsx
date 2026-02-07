// app/admin/kuliah/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { createKuliah } from '@/lib/kuliah';
import toast from 'react-hot-toast';

export default function NewKuliahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      await createKuliah({
        tajuk: formData.tajuk.trim(),
        penceramah: formData.penceramah.trim(),
        hari: formData.hari.trim(),
        masa: formData.masa.trim(),
        lokasi: formData.lokasi.trim(),
        kategori: formData.kategori,
        keterangan: formData.keterangan.trim() || '',
        aktif: formData.aktif,
      });
      toast.success('Kuliah berjaya ditambah');
      router.push('/admin/kuliah');
    } catch (err) {
      console.error('[kuliah/new] Submit failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menambah kuliah';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/kuliah" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Kuliah Baru</h1>
          <p className="text-gray-600 mt-1">Masukkan maklumat kuliah</p>
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
              placeholder="cth: Kelas Mengaji Al-Quran"
              disabled={loading}
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
              placeholder="cth: Ustaz Ahmad"
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
              placeholder="cth: Dewan Solat Utama"
              disabled={loading}
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
              disabled={loading}
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
              placeholder="Keterangan tambahan (opsional)"
              disabled={loading}
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
                disabled={loading}
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
