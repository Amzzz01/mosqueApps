'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { getAllKawasan, deleteKawasan, toggleKawasanStatus, getKawasanStats } from '@/lib/kawasan';
import { Kawasan } from '@/types/kariah';
import toast from 'react-hot-toast';

export default function KawasanListPage() {
  const router = useRouter();
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    loadKawasan();
  }, []);

  const loadKawasan = async () => {
    try {
      setLoading(true);
      const data = await getAllKawasan();
      setKawasanList(data);

      // Load stats for each kawasan
      const statsData: Record<string, any> = {};
      for (const kawasan of data) {
        const kawasanStats = await getKawasanStats(kawasan.id);
        statsData[kawasan.id] = kawasanStats;
      }
      setStats(statsData);
    } catch (error) {
      toast.error('Gagal memuatkan data kawasan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirm = window.confirm(
      `Adakah anda pasti untuk memadam kawasan "${name}"?`
    );
    if (!confirm) return;

    try {
      setDeleting(id);
      await deleteKawasan(id);
      toast.success('Kawasan berjaya dipadam');
      loadKawasan();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memadam kawasan');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleKawasanStatus(id, !currentStatus);
      toast.success(
        !currentStatus
          ? 'Kawasan diaktifkan'
          : 'Kawasan dinyahaktifkan'
      );
      loadKawasan();
    } catch (error) {
      toast.error('Gagal mengemas kini status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pengurusan Kawasan
              </h1>
              <p className="text-gray-600 mt-1">
                Urus kawasan kariah masjid
              </p>
            </div>
            <Link
              href="/admin/pengurusan-ahli/kawasan/tambah"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Kawasan
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Jumlah Kawasan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kawasanList.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Kawasan Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kawasanList.filter((k) => k.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Jumlah Ahli</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(stats).reduce((sum: number, s: any) => sum + (s.total || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kawasan List */}
        {kawasanList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tiada Kawasan
            </h3>
            <p className="text-gray-600 mb-6">
              Belum ada kawasan didaftarkan. Tambah kawasan pertama sekarang.
            </p>
            <Link
              href="/admin/pengurusan-ahli/kawasan/tambah"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Kawasan
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                      Nama Kawasan
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                      Warna
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                      Sempadan
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                      Jumlah Ahli
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-900">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kawasanList.map((kawasan) => (
                    <tr key={kawasan.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: kawasan.color }}
                          />
                          <span className="font-medium text-gray-900">
                            {kawasan.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm text-gray-600">
                          {kawasan.color}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {kawasan.boundaries ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                            <MapPin className="w-4 h-4" />
                            Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            Tiada
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-gray-900 font-medium">
                          {stats[kawasan.id]?.total || 0}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(kawasan.id, kawasan.isActive)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            kawasan.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {kawasan.isActive ? (
                            <>
                              <Eye className="w-4 h-4" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Tidak Aktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/pengurusan-ahli/kawasan/${kawasan.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(kawasan.id, kawasan.name)}
                            disabled={deleting === kawasan.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Padam"
                          >
                            {deleting === kawasan.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}