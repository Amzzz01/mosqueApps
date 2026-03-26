'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Loader2,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Download,
} from 'lucide-react';
import { getAllAnakKariah, softDeleteAnakKariah, toggleMemberStatus } from '@/lib/anakKariah';
import { getAllKawasan } from '@/lib/kawasan';
import { AnakKariah, Kawasan } from '@/types/kariah';
import { useAuth } from '@/contexts/AuthContext';
import AkKariahTable from '@/components/admin/anak-kariah/AkKariahTable';
import AkKariahDetails from '@/components/admin/anak-kariah/AkKariahDetails';
import DeleteConfirmation from '@/components/admin/anak-kariah/DeleteConfirmation';
import { exportAnakKariahToExcel, exportAnakKariahToPDF } from '@/lib/exportUtils';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 15;

export default function AnakKariahListPage() {
  const { user } = useAuth();
  const router = useRouter();
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

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Export dropdowns
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);
  const [mobileExportOpen, setMobileExportOpen] = useState(false);
  const excelDropdownRef = useRef<HTMLDivElement>(null);
  const pdfDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (excelDropdownRef.current && !excelDropdownRef.current.contains(e.target as Node)) {
        setExcelDropdownOpen(false);
      }
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(e.target as Node)) {
        setPdfDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Pengurusan Ahli']?.view) {
      toast.error('Anda tidak mempunyai akses ke modul ini');
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const canEdit = user?.role === 'super_admin' || user?.permissions?.['Pengurusan Ahli']?.edit === true;
  const canDelete = user?.role === 'super_admin' || user?.permissions?.['Pengurusan Ahli']?.delete === true;

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

  // Reset page + selectedIds when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, statusFilter, kawasanFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: allMembers.length,
    aktif: allMembers.filter((m) => m.status === 'aktif').length,
    tidakAktif: allMembers.filter((m) => m.status === 'tidak_aktif').length,
  }), [allMembers]);

  // Selection derived values
  const allSelected = paginatedMembers.length > 0 && paginatedMembers.every(m => selectedIds.has(m.id));
  const someSelected = paginatedMembers.some(m => selectedIds.has(m.id)) && !allSelected;

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedMembers.forEach(m => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedMembers.forEach(m => next.add(m.id));
        return next;
      });
    }
  }, [allSelected, paginatedMembers]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Export handlers
  const handleExportExcel = useCallback(() => {
    exportAnakKariahToExcel(filteredMembers);
    setExcelDropdownOpen(false);
  }, [filteredMembers]);

  const handleExportPDF = useCallback(() => {
    exportAnakKariahToPDF(filteredMembers);
    setPdfDropdownOpen(false);
  }, [filteredMembers]);

  const handleExportSelectedExcel = useCallback(() => {
    const selected = filteredMembers.filter(m => selectedIds.has(m.id));
    exportAnakKariahToExcel(selected, `Anak_Kariah_Terpilih_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExcelDropdownOpen(false);
  }, [filteredMembers, selectedIds]);

  const handleExportSelectedPDF = useCallback(() => {
    const selected = filteredMembers.filter(m => selectedIds.has(m.id));
    exportAnakKariahToPDF(selected, `Anak_Kariah_Terpilih_${new Date().toISOString().split('T')[0]}.pdf`, 'Senarai Anak Kariah Terpilih');
    setPdfDropdownOpen(false);
  }, [filteredMembers, selectedIds]);

  // Existing handlers
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
    <>
      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-100">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Anak<br />Kariah
            </h1>
            <p className="text-white/60 text-[10px] mt-1">{filteredMembers.length} ahli dijumpai</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {stats.aktif} Aktif
              </span>
              <span className="bg-blue-400/20 border border-blue-400/30 text-blue-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {stats.tidakAktif} Tidak Aktif
              </span>
              <span className="bg-white/15 border border-white/20 text-white/80 text-[9px] font-semibold px-2 py-1 rounded-full">
                {kawasanList.length} Kawasan
              </span>
            </div>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
            <p className="text-white text-2xl font-extrabold leading-tight">{stats.total}</p>
            <p className="text-white/55 text-[9px] mt-1">Ahli</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

          {/* Search bar */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3 h-10 gap-2 shadow-sm focus-within:border-teal-400 transition-colors">
            <Search size={13} className="text-slate-300 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama, IC, atau telefon..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 text-xs text-slate-700 placeholder:text-slate-300 border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 bg-transparent p-0"
              style={{
                WebkitBoxShadow: '0 0 0 1000px white inset',
                WebkitTextFillColor: '#334155',
                boxShadow: 'none',
                border: 'none',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="flex-shrink-0">
                <X size={13} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Row 1 — Status filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { value: 'all', label: 'Semua Status' },
              { value: 'aktif', label: 'Aktif' },
              { value: 'tidak_aktif', label: 'Tidak Aktif' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold border transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Row 2 — Kawasan color chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setKawasanFilter('all')}
              className={`flex-shrink-0 h-6 px-3 rounded-full text-[9px] font-semibold border transition-colors whitespace-nowrap ${
                kawasanFilter === 'all'
                  ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              Semua
            </button>
            {kawasanList.map(k => (
              <button
                key={k.id}
                onClick={() => setKawasanFilter(kawasanFilter === k.id ? 'all' : k.id)}
                className={`flex-shrink-0 h-6 px-2.5 rounded-full text-[9px] font-semibold border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  kawasanFilter === k.id
                    ? 'border-[#0d7a6b] text-[#0d7a6b] bg-teal-50'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: k.color || '#0d7a6b' }}
                />
                {k.name}
              </button>
            ))}
          </div>

          {/* Member cards */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : paginatedMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tiada ahli dijumpai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedMembers.map(member => {
                const initial = member.namaPenuh.charAt(0).toUpperCase();
                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl px-3 py-3 flex items-center gap-3 shadow-sm"
                    onClick={() => handleViewDetails(member)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#0d7a6b]">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{member.namaPenuh}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{member.kawasanName} · {member.ic}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`h-5 px-2 rounded-full text-[9px] font-semibold flex items-center whitespace-nowrap ${
                        member.status === 'aktif' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {member.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      {canEdit && (
                        <Link
                          href={`/admin/pengurusan-ahli/anak-kariah/${member.id}/edit`}
                          onClick={e => e.stopPropagation()}
                          className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0"
                        >
                          <Edit size={11} className="text-[#0d7a6b]" />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteClick(member); }}
                          className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"
                        >
                          <Trash2 size={11} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs text-[#0d7a6b] font-semibold disabled:opacity-30"
              >
                ← Sebelum
              </button>
              <span className="text-xs text-slate-500">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-xs text-[#0d7a6b] font-semibold disabled:opacity-30"
              >
                Seterus →
              </button>
            </div>
          )}
        </div>

        {/* Export FAB */}
        <button
          onClick={() => setMobileExportOpen(true)}
          className="fixed bottom-20 right-4 h-11 px-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 shadow-md z-20"
          title="Export"
        >
          <Download size={16} className="text-[#0d7a6b]" />
          <span className="text-[#0d7a6b] text-xs font-bold">Muat Turun Data</span>
        </button>

        {/* Tambah FAB */}
        <Link
          href="/admin/pengurusan-ahli/anak-kariah/tambah"
          className="fixed bottom-5 right-4 h-11 px-4 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] flex items-center gap-2 shadow-lg shadow-teal-600/30 z-20"
        >
          <Plus size={16} className="text-white" />
          <span className="text-white text-xs font-bold">Tambah Anak Kariah</span>
        </Link>

        {/* Mobile Export Bottom Sheet */}
        {mobileExportOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-30"
              onClick={() => setMobileExportOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-40 p-5 space-y-3 shadow-2xl">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <p className="text-sm font-semibold text-gray-700 mb-3">Export Senarai</p>
              <button
                onClick={() => { exportAnakKariahToExcel(filteredMembers); setMobileExportOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium"
              >
                <FileSpreadsheet size={18} />
                Export Excel ({filteredMembers.length} rekod)
              </button>
              <button
                onClick={() => { exportAnakKariahToPDF(filteredMembers); setMobileExportOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium"
              >
                <FileText size={18} />
                Export PDF ({filteredMembers.length} rekod)
              </button>
              <button
                onClick={() => setMobileExportOpen(false)}
                className="w-full px-4 py-3 text-gray-500 text-sm font-medium"
              >
                Batal
              </button>
            </div>
          </>
        )}

        {/* Modals */}
        {detailsOpen && selectedMember && (
          <AkKariahDetails
            member={selectedMember}
            isOpen={detailsOpen}
            onClose={() => setDetailsOpen(false)}
          />
        )}
        <DeleteConfirmation
          isOpen={!!deleteTarget}
          memberName={deleteTarget?.namaPenuh || ''}
          loading={!!deletingId}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block">
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Senarai Anak Kariah</h1>
            <p className="text-gray-600 mt-1">Urus pendaftaran ahli kariah masjid</p>
          </div>
          <div className="flex items-center gap-2 self-start flex-wrap">
            {/* Export Excel Dropdown */}
            <div className="relative" ref={excelDropdownRef}>
              <button
                onClick={() => { setExcelDropdownOpen(o => !o); setPdfDropdownOpen(false); }}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {excelDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Export Semua (Filtered) — {filteredMembers.length} rekod
                  </button>
                  <button
                    onClick={handleExportSelectedExcel}
                    disabled={selectedIds.size === 0}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Export Terpilih ({selectedIds.size} dipilih)
                  </button>
                </div>
              )}
            </div>

            {/* Export PDF Dropdown */}
            <div className="relative" ref={pdfDropdownRef}>
              <button
                onClick={() => { setPdfDropdownOpen(o => !o); setExcelDropdownOpen(false); }}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                <FileText className="w-4 h-4" />
                Export PDF
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {pdfDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Export Semua (Filtered) — {filteredMembers.length} rekod
                  </button>
                  <button
                    onClick={handleExportSelectedPDF}
                    disabled={selectedIds.size === 0}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Export Terpilih ({selectedIds.size} dipilih)
                  </button>
                </div>
              )}
            </div>

            <Link
              href="/admin/pengurusan-ahli/anak-kariah/tambah"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Tambah Anak Kariah
            </Link>
          </div>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
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

        {/* Selection Toolbar */}
        {selectedIds.size > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-teal-800">
              ✓ {selectedIds.size} ahli dipilih
            </span>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <button
                onClick={handleExportSelectedExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel Terpilih
              </button>
              <button
                onClick={handleExportSelectedPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Export PDF Terpilih
              </button>
              <button
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Batal Pilihan
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <AkKariahTable
          members={paginatedMembers}
          deletingId={deletingId}
          togglingId={togglingId}
          onViewDetails={handleViewDetails}
          onDelete={handleDeleteClick}
          onToggleStatus={handleToggleStatus}
          canEdit={canEdit}
          canDelete={canDelete}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          allSelected={allSelected}
          someSelected={someSelected}
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
      </div>
    </>
  );
}
