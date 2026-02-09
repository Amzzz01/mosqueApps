'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Loader2,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { getAllAnakKariah, softDeleteAnakKariah, toggleMemberStatus } from '@/lib/anakKariah';
import { getAllKawasan } from '@/lib/kawasan';
import { AnakKariah, Kawasan } from '@/types/kariah';
import { useAuth } from '@/contexts/AuthContext';
import AkKariahTable from '@/components/admin/anak-kariah/AkKariahTable';
import AkKariahDetails from '@/components/admin/anak-kariah/AkKariahDetails';
import DeleteConfirmation from '@/components/admin/anak-kariah/DeleteConfirmation';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 15;

export default function AnakKariahListPage() {
  const { user } = useAuth();
  const [allMembers, setAllMembers] = useState<AnakKariah[]>([]);
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kawasanFilter, setKawasanFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedMember, setSelectedMember] = useState<AnakKariah | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnakKariah | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [members, kawasan] = await Promise.all([
        getAllAnakKariah(),
        getAllKawasan()
      ]);
      setAllMembers(members);
      setKawasanList(kawasan);
    } catch (error) {
      toast.error('Gagal memuatkan data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = allMembers;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.namaPenuh.toLowerCase().includes(term) ||
          m.ic.includes(searchTerm) ||
          m.telefon.includes(searchTerm) ||
          m.alamat.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Kawasan filter
    if (kawasanFilter !== 'all') {
      result = result.filter((m) => m.kawasanId === kawasanFilter);
    }

    return result;
  }, [allMembers, searchTerm, statusFilter, kawasanFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, kawasanFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: allMembers.length,
    aktif: allMembers.filter((m) => m.status === 'aktif').length,
    tidakAktif: allMembers.filter((m) => m.status === 'tidak_aktif').length,
  }), [allMembers]);

  // Handlers
  const handleViewDetails = (member: AnakKariah) => {
    setSelectedMember(member);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (member: AnakKariah) => {
    setDeleteTarget(member);
  };

  const handleToggleStatus = async (member: AnakKariah) => {
    try {
      setTogglingId(member.id);
      const newStatus = await toggleMemberStatus(member.id, user?.email || 'admin');
      toast.success(`Status ${member.namaPenuh} dikemas kini kepada ${newStatus === 'aktif' ? 'Aktif' : 'Tidak Aktif'}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengemas kini status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeletingId(deleteTarget.id);
      await softDeleteAnakKariah(deleteTarget.id);
      toast.success(`${deleteTarget.namaPenuh} telah dipadam`);
      setDeleteTarget(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memadam ahli');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setKawasanFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || kawasanFilter !== 'all';

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Senarai Anak Kariah</h1>
            <p className="text-gray-600 mt-1">Urus pendaftaran ahli kariah masjid</p>
          </div>
          <Link
            href="/admin/pengurusan-ahli/anak-kariah/tambah"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium self-start"
          >
            <Plus className="w-5 h-5" />
            Tambah Anak Kariah
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Jumlah</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Aktif</p>
                <p className="text-xl font-bold text-gray-900">{stats.aktif}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tidak Aktif</p>
                <p className="text-xl font-bold text-gray-900">{stats.tidakAktif}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, IC, atau telefon..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm min-w-[160px]"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>

            {/* Kawasan Filter */}
            <select
              value={kawasanFilter}
              onChange={(e) => setKawasanFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm min-w-[160px]"
            >
              <option value="all">Semua Kawasan</option>
              {kawasanList.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Bersihkan
              </button>
            )}
          </div>

          {/* Results count */}
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-3">
              {filteredMembers.length} daripada {allMembers.length} rekod ditemui
            </p>
          )}
        </div>

        {/* Table */}
        <AkKariahTable
          members={paginatedMembers}
          deletingId={deletingId}
          togglingId={togglingId}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
        />

        {/* Pagination */}
        {filteredMembers.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <p className="text-sm text-gray-600">
              Halaman {currentPage} daripada {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => {
                  const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                  return (
                    <span key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-teal-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Details Modal */}
        <AkKariahDetails
          member={selectedMember}
          isOpen={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedMember(null);
          }}
        />

        {/* Delete Confirmation */}
        <DeleteConfirmation
          isOpen={!!deleteTarget}
          memberName={deleteTarget?.namaPenuh || ''}
          loading={!!deletingId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
