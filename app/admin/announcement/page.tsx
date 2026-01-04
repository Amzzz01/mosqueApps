// src/app/admin/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Announcement } from '@/types';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(announcementsQuery);
      const announcementsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Announcement[];
      
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Gagal memuatkan pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Adakah anda pasti ingin memadam pengumuman "${title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Pengumuman berjaya dipadam');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Gagal memadam pengumuman');
    }
  };

  const filteredAnnouncements = announcements.filter(a =>
    statusFilter === 'all' || a.status === statusFilter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Memuatkan pengumuman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Pengumuman</h1>
          <p className="text-gray-600 mt-1">Jumlah: {filteredAnnouncements.length} pengumuman</p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Buat Pengumuman</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'published'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Diterbitkan
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'draft'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Draf
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Tiada pengumuman dijumpai</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {announcement.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      announcement.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {announcement.status === 'published' ? 'Diterbitkan' : 'Draf'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {announcement.content}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  {announcement.createdAt && format(announcement.createdAt, 'dd MMM yyyy', { locale: ms })}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                  <Link
                    href={`/announcements`}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Lihat"
                    target="_blank"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`/admin/announcements/${announcement.id}/edit`}
                    className="text-emerald-600 hover:text-emerald-900 p-2"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(announcement.id!, announcement.title)}
                    className="text-red-600 hover:text-red-900 p-2"
                    title="Padam"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}