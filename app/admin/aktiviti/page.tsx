// app/admin/aktiviti/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Filter, CheckCircle, XCircle, ImageIcon } from 'lucide-react';
import { getAllAktiviti, deleteAktiviti, updateAktiviti } from '@/lib/aktiviti';
import { Aktiviti } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';

const toDate = (val: Date | Timestamp): Date => {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const kategoriLabels: Record<string, string> = {
  keagamaan: 'Keagamaan',
  pendidikan: 'Pendidikan',
  kemasyarakatan: 'Kemasyarakatan',
  kebajikan: 'Kebajikan',
  lain: 'Lain-lain',
};

export default function AktivitiListPage() {
  const [aktivitiList, setAktivitiList] = useState<Aktiviti[]>([]);
  const [filtered, setFiltered] = useState<Aktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [searchTerm, categoryFilter, aktivitiList]);

  const fetchData = async () => {
    try {
      const data = await getAllAktiviti();
      setAktivitiList(data);
      setFiltered(data);
    } catch {
      toast.error('Gagal memuatkan galeri aktiviti');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...aktivitiList];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a => a.tajuk.toLowerCase().includes(term) || a.keterangan.toLowerCase().includes(term));
    }
    if (categoryFilter !== 'all') {
      result = result.filter(a => a.kategori === categoryFilter);
    }
    setFiltered(result);
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      await updateAktiviti(id, { published: !published });
      toast.success(published ? 'Aktiviti dijadikan draf' : 'Aktiviti diterbitkan');
      fetchData();
    } catch {
      toast.error('Gagal mengemas kini status');
    }
  };

  const handleDelete = async (id: string, tajuk: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam aktiviti "${tajuk}"?\nSemua gambar juga akan dipadam.`)) return;
    try {
      await deleteAktiviti(id);
      toast.success('Aktiviti berjaya dipadam');
      fetchData();
    } catch {
      toast.error('Gagal memadam aktiviti');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan galeri aktiviti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Galeri Aktiviti</h1>
          <p className="text-gray-600 mt-1">Jumlah: {filtered.length} aktiviti</p>
        </div>
        <Link
          href="/admin/aktiviti/new"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Tambah Aktiviti
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari aktiviti..."
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

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tiada aktiviti dijumpai</p>
          </div>
        ) : (
          filtered.map(aktiviti => (
            <div key={aktiviti.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 relative">
                {aktiviti.gambarUrls?.length > 0 ? (
                  <Image
                    src={aktiviti.gambarUrls[0]}
                    alt={aktiviti.tajuk}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                {/* Photo count badge */}
                {aktiviti.gambarUrls?.length > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                    {aktiviti.gambarUrls.length} gambar
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{aktiviti.tajuk}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {kategoriLabels[aktiviti.kategori] || aktiviti.kategori}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      aktiviti.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aktiviti.published ? 'Diterbitkan' : 'Draf'}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {format(toDate(aktiviti.tarikh), 'dd MMM yyyy', { locale: ms })}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{aktiviti.keterangan}</p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    onClick={() => handleTogglePublish(aktiviti.id!, aktiviti.published)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      aktiviti.published
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {aktiviti.published ? (
                      <><XCircle className="h-4 w-4" /><span>Nyahterbit</span></>
                    ) : (
                      <><CheckCircle className="h-4 w-4" /><span>Terbitkan</span></>
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/aktiviti/${aktiviti.id}/edit`}
                      className="text-emerald-600 hover:text-emerald-900 p-2"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(aktiviti.id!, aktiviti.tajuk)}
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
