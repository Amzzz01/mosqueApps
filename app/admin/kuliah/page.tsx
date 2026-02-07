// app/admin/kuliah/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Filter, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { getAllKuliah, deleteKuliah, toggleKuliahStatus } from '@/lib/kuliah';
import { Kuliah } from '@/types';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const toDate = (val: Date | Timestamp): Date => {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const kategoriLabels: Record<string, string> = {
  quran: 'Al-Quran',
  hadis: 'Hadis',
  fiqh: 'Fiqh',
  akhlak: 'Akhlak',
  umum: 'Umum',
};

export default function KuliahListPage() {
  const [kuliahList, setKuliahList] = useState<Kuliah[]>([]);
  const [filtered, setFiltered] = useState<Kuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [searchTerm, categoryFilter, kuliahList]);

  const fetchData = async () => {
    try {
      const data = await getAllKuliah();
      setKuliahList(data);
      setFiltered(data);
    } catch (err) {
      console.error('[kuliah] Fetch failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuatkan jadual kuliah';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...kuliahList];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        k => k.tajuk.toLowerCase().includes(term) || k.penceramah.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(k => k.kategori === categoryFilter);
    }
    setFiltered(result);
  };

  const handleToggle = async (id: string, aktif: boolean) => {
    try {
      await toggleKuliahStatus(id, !aktif);
      toast.success(aktif ? 'Kuliah dinyahaktifkan' : 'Kuliah diaktifkan');
      fetchData();
    } catch (err) {
      console.error('[kuliah] Toggle failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengemas kini status';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string, tajuk: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam kuliah "${tajuk}"?`)) return;
    try {
      await deleteKuliah(id);
      toast.success('Kuliah berjaya dipadam');
      fetchData();
    } catch (err) {
      console.error('[kuliah] Delete failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memadam kuliah';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan jadual kuliah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Jadual Kuliah</h1>
          <p className="text-gray-600 mt-1">Jumlah: {filtered.length} kuliah</p>
        </div>
        <Link
          href="/admin/kuliah/new"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Tambah Kuliah
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari tajuk atau penceramah..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">Kategori</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ value: 'all', label: 'Semua' }, ...Object.entries(kategoriLabels).map(([v, l]) => ({ value: v, label: l }))].map(opt => (
            <button
              key={opt.value}
              onClick={() => setCategoryFilter(opt.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                categoryFilter === opt.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kuliah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tiada kuliah dijumpai</p>
          </div>
        ) : (
          filtered.map(kuliah => (
            <div key={kuliah.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{kuliah.tajuk}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {kategoriLabels[kuliah.kategori] || kuliah.kategori}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      kuliah.aktif ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {kuliah.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p><span className="font-medium">Penceramah:</span> {kuliah.penceramah}</p>
                  <p><span className="font-medium">Hari:</span> {kuliah.hari}</p>
                  <p><span className="font-medium">Masa:</span> {kuliah.masa}</p>
                  <p><span className="font-medium">Lokasi:</span> {kuliah.lokasi}</p>
                </div>

                {kuliah.keterangan && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{kuliah.keterangan}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    onClick={() => handleToggle(kuliah.id!, kuliah.aktif)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      kuliah.aktif
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {kuliah.aktif ? (
                      <><XCircle className="h-4 w-4" /><span>Nyahaktif</span></>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /><span>Aktifkan</span></>
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/kuliah/${kuliah.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-900 p-2"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(kuliah.id!, kuliah.tajuk)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Padam"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
