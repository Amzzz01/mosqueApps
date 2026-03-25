// app/admin/announcements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Announcement } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, Filter, CheckCircle, XCircle, Megaphone } from 'lucide-react';
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
  const { user } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Pengumuman']?.view) {
      toast.error('Anda tidak mempunyai akses ke modul ini');
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const canEdit = user?.role === 'super_admin' || user?.permissions?.['Pengumuman']?.edit === true;
  const canDelete = user?.role === 'super_admin' || user?.permissions?.['Pengumuman']?.delete === true;

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

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', id), {
        published: !currentStatus,
        updatedAt: Timestamp.now(),
      });
      toast.success(
        !currentStatus 
          ? 'Pengumuman berjaya diterbitkan' 
          : 'Pengumuman berjaya dijadikan draf'
      );
      fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast.error('Gagal mengemas kini status pengumuman');
    }
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
    <>
      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-100">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Pengurusan<br />Pengumuman
            </h1>
            <p className="text-white/60 text-[10px] mt-1">{filteredAnnouncements.length} pengumuman</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {announcements.filter(a => a.published).length} Aktif
              </span>
              <span className="bg-blue-400/20 border border-blue-400/30 text-blue-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {announcements.filter(a => !a.published).length} Draf
              </span>
              <span className="bg-red-400/20 border border-red-400/30 text-red-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {announcements.filter(a => a.category === 'urgent').length} Segera
              </span>
            </div>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
            <p className="text-white text-2xl font-extrabold leading-tight">{announcements.length}</p>
            <p className="text-white/55 text-[9px] mt-1">Jumlah</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'published', label: 'Diterbitkan' },
              { value: 'draft', label: 'Draf' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setPublishedFilter(f.value as any)}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold border transition-colors ${
                  publishedFilter === f.value
                    ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            {[
              { value: 'general', label: 'Umum' },
              { value: 'event', label: 'Acara' },
              { value: 'urgent', label: 'Segera' },
              { value: 'reminder', label: 'Peringatan' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setCategoryFilter(f.value === categoryFilter ? 'all' : f.value)}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold border transition-colors ${
                  categoryFilter === f.value
                    ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Announcement cards */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <Megaphone size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tiada pengumuman dijumpai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAnnouncements.map(ann => {
                const categoryColors: Record<string, string> = {
                  general: 'bg-blue-50 text-blue-700',
                  event: 'bg-purple-50 text-purple-700',
                  urgent: 'bg-red-50 text-red-700',
                  reminder: 'bg-amber-50 text-amber-700',
                };
                return (
                  <div key={ann.id} className="bg-white rounded-2xl px-3 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-slate-900 leading-tight flex-1">{ann.title}</p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {canEdit && (
                          <Link href={`/admin/announcements/${ann.id}/edit`} className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Edit size={12} className="text-[#0d7a6b]" />
                          </Link>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(ann.id!, ann.title)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{ann.content}</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`h-5 px-2 rounded-full text-[9px] font-semibold flex items-center ${categoryColors[ann.category] || 'bg-slate-50 text-slate-600'}`}>
                        {getCategoryLabel(ann.category)}
                      </span>
                      <span className={`h-5 px-2 rounded-full text-[9px] font-semibold flex items-center ${ann.published ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {ann.published ? 'Diterbitkan' : 'Draf'}
                      </span>
                      <button
                        onClick={() => handleTogglePublish(ann.id!, ann.published)}
                        className="h-5 px-2 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 flex items-center ml-auto"
                      >
                        {ann.published ? 'Jadikan Draf' : 'Terbitkan'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/admin/announcements/new"
          className="fixed bottom-5 right-4 h-11 px-4 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] flex items-center gap-2 shadow-lg shadow-teal-600/30 z-20"
        >
          <Plus size={16} className="text-white" />
          <span className="text-white text-xs font-bold">Tambah Pengumuman</span>
        </Link>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Pengumuman</h1>
          <p className="text-gray-600 mt-1">Jumlah: {filteredAnnouncements.length} pengumuman</p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Buat Pengumuman
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">Penapis</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Kategori:</span>
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
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Tiada pengumuman dijumpai</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priorityBadge = getPriorityBadge(announcement.priority);
            
            return (
              <div key={announcement.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Title and badges */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {getCategoryLabel(announcement.category)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${priorityBadge.color}`}>
                        {priorityBadge.label}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          announcement.published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {announcement.published ? 'Diterbitkan' : 'Draf'}
                      </span>
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
                  <div className="flex items-center justify-between pt-4 border-t">
                    {/* Publish/Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(announcement.id!, announcement.published)}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        announcement.published
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={announcement.published ? 'Jadikan Draf' : 'Terbitkan'}
                    >
                      {announcement.published ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Nyahterbit</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Terbitkan</span>
                        </>
                      )}
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {announcement.published && (
                        <Link
                          href="/announcements"
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900 p-2"
                          title="Lihat di laman awam"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      )}
                      {canEdit && (
                        <Link
                          href={`/admin/announcements/${announcement.id}/edit`}
                          className="text-emerald-600 hover:text-emerald-900 p-2"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(announcement.id!, announcement.title)}
                          className="text-red-600 hover:text-red-900 p-2"
                          title="Padam"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
      </div>
    </>
  );
}