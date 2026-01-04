// app/admin/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Announcement } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Helper function to convert Timestamp to Date
const toDate = (dateValue: Date | Timestamp): Date => {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date) {
    return dateValue;
  }
  return new Date(dateValue);
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [searchTerm, categoryFilter, publishedFilter, announcements]);

  const fetchAnnouncements = async () => {
    try {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(announcementsQuery);
      const announcementsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          category: data.category || 'general',
          priority: data.priority || 'low',
          published: data.published ?? false,
          author: data.author || '',
          authorId: data.authorId || '',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Announcement;
      });
      
      setAnnouncements(announcementsData);
      setFilteredAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Gagal memuatkan pengumuman');
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    // Published filter
    if (publishedFilter !== 'all') {
      const isPublished = publishedFilter === 'published';
      filtered = filtered.filter(a => a.published === isPublished);
    }

    setFilteredAnnouncements(filtered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam pengumuman "${title}"?`)) {
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Umum',
      event: 'Acara',
      urgent: 'Segera',
      reminder: 'Peringatan',
    };
    return labels[category] || category;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      low: { color: 'bg-blue-100 text-blue-800', label: 'Biasa' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Sederhana' },
      high: { color: 'bg-red-100 text-red-800', label: 'Penting' },
    };
    return badges[priority] || badges.low;
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Pengumuman</h1>
          <p className="text-gray-600 mt-1">Jumlah: {filteredAnnouncements.length} pengumuman</p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Buat Pengumuman</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Kategori:</span>
          </div>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              categoryFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setCategoryFilter('general')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              categoryFilter === 'general'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Umum
          </button>
          <button
            onClick={() => setCategoryFilter('event')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              categoryFilter === 'event'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Acara
          </button>
          <button
            onClick={() => setCategoryFilter('urgent')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              categoryFilter === 'urgent'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Segera
          </button>
          <button
            onClick={() => setCategoryFilter('reminder')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              categoryFilter === 'reminder'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Peringatan
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <button
            onClick={() => setPublishedFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              publishedFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setPublishedFilter('published')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              publishedFilter === 'published'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Diterbitkan
          </button>
          <button
            onClick={() => setPublishedFilter('draft')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              publishedFilter === 'draft'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Draf
          </button>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">Tiada pengumuman dijumpai</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priorityBadge = getPriorityBadge(announcement.priority);
            return (
              <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header with badges */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                        {announcement.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {getCategoryLabel(announcement.category)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            announcement.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {announcement.published ? 'Diterbitkan' : 'Draf'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content preview */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {announcement.content}
                  </p>

                  {/* Meta info */}
                  <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <div>
                      Dicipta: {format(toDate(announcement.createdAt), 'dd MMM yyyy, HH:mm', { locale: ms })}
                    </div>
                    {announcement.author && (
                      <div>
                        Oleh: {announcement.author}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                    {announcement.published && (
                      <Link
                        href="/announcements"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900 p-2"
                        title="Lihat"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    )}
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
            );
          })
        )}
      </div>
    </div>
  );
}