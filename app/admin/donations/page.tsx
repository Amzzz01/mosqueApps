// app/admin/donations/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, Timestamp, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { Donation } from '@/types';
import { Plus, Download, DollarSign, TrendingUp, Calendar, Edit, Trash2, Users, QrCode, Upload, X, Loader2, Trash } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// Helper function to convert Date | Timestamp to Date
const toDate = (dateValue: Date | Timestamp): Date => {
  if (dateValue instanceof Timestamp) {
    return dateValue.toDate();
  }
  if (dateValue instanceof Date) {
    return dateValue;
  }
  return new Date(dateValue);
};

export default function DonationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisMonth: 0,
    thisYear: 0,
  });

  // QR code state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrDeleting, setQrDeleting] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Derma']?.view) {
      toast.error('Anda tidak mempunyai akses ke modul ini');
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const canEdit = user?.role === 'super_admin' || user?.permissions?.['Derma']?.edit === true;
  const canDelete = user?.role === 'super_admin' || user?.permissions?.['Derma']?.delete === true;

  useEffect(() => {
    fetchDonations();
    fetchQrCode();
  }, []);

  const fetchQrCode = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'general'));
      if (snap.exists()) {
        setQrImageUrl(snap.data().qrCodeUrl || null);
      }
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Sila pilih fail imej sahaja');
      return;
    }
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleQrUpload = async () => {
    if (!qrFile) return;
    setQrUploading(true);
    try {
      const storageRef = ref(storage, 'settings/qr-code.jpg');
      await uploadBytes(storageRef, qrFile);
      const downloadUrl = await getDownloadURL(storageRef);
      await setDoc(doc(db, 'settings', 'general'), { qrCodeUrl: downloadUrl }, { merge: true });
      setQrImageUrl(downloadUrl);
      setQrFile(null);
      setQrPreview(null);
      toast.success('QR Code berjaya dikemas kini');
    } catch (err) {
      console.error('QR upload failed:', err);
      toast.error('Gagal memuat naik QR Code');
    } finally {
      setQrUploading(false);
    }
  };

  const handleQrDelete = async () => {
    if (!confirm('Adakah anda pasti mahu memadam QR Code ini?')) return;
    setQrDeleting(true);
    try {
      const storageRef = ref(storage, 'settings/qr-code.jpg');
      try { await deleteObject(storageRef); } catch {}
      await setDoc(doc(db, 'settings', 'general'), { qrCodeUrl: null }, { merge: true });
      setQrImageUrl(null);
      toast.success('QR Code berjaya dipadam');
    } catch (err) {
      console.error('QR delete failed:', err);
      toast.error('Gagal memadam QR Code');
    } finally {
      setQrDeleting(false);
    }
  };

  useEffect(() => {
    filterDonations();
    calculateStats();
  }, [dateFilter, donations]);

  const fetchDonations = async () => {
    try {
      const donationsQuery = query(
        collection(db, 'donations'),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(donationsQuery);
      const donationsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          donorId: data.donorId || '',
          donorName: data.donorName || '',
          amount: data.amount || 0,
          category: data.category || 'other',
          paymentMethod: data.paymentMethod || 'cash',
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          date: toDate(data.date),
          createdBy: data.createdBy || '',
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
        } as Donation;
      });
      
      setDonations(donationsData);
      setFilteredDonations(donationsData);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Gagal memuatkan data derma');
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    const now = new Date();
    let filtered = [...donations];

    switch (dateFilter) {
      case 'today':
        filtered = donations.filter(d => {
          const donationDate = toDate(d.date);
          return format(donationDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
        });
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = donations.filter(d => {
          const donationDate = toDate(d.date);
          return donationDate >= monthStart && donationDate <= monthEnd;
        });
        break;
      case 'year':
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        filtered = donations.filter(d => {
          const donationDate = toDate(d.date);
          return donationDate >= yearStart && donationDate <= yearEnd;
        });
        break;
      default:
        filtered = donations;
    }

    setFilteredDonations(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    
    const today = donations
      .filter(d => {
        const donationDate = toDate(d.date);
        return format(donationDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      })
      .reduce((sum, d) => sum + d.amount, 0);
    
    const thisMonth = donations
      .filter(d => {
        const donationDate = toDate(d.date);
        return donationDate >= monthStart && donationDate <= monthEnd;
      })
      .reduce((sum, d) => sum + d.amount, 0);
    
    const thisYear = donations
      .filter(d => {
        const donationDate = toDate(d.date);
        return donationDate >= yearStart && donationDate <= yearEnd;
      })
      .reduce((sum, d) => sum + d.amount, 0);

    setStats({ total, today, thisMonth, thisYear });
  };

  const exportToCSV = () => {
    const headers = ['Tarikh', 'Penderma', 'Jumlah', 'Kategori', 'Kaedah Bayaran'];
    const rows = filteredDonations.map(d => {
      const donationDate = toDate(d.date);
      return [
        format(donationDate, 'dd/MM/yyyy'),
        d.donorName,
        d.amount.toString(),
        getCategoryLabel(d.category),
        getPaymentMethodLabel(d.paymentMethod),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `derma-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();

    toast.success('Data derma berjaya diexport');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      zakat: 'Zakat',
      sedekah: 'Sedekah',
      derma: 'Derma',
      wakaf: 'Wakaf',
      fitrah: 'Fitrah',
      other: 'Lain-lain',
    };
    return labels[category] || category;
  };

  const handleDelete = async (id: string, donorName: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam rekod derma daripada "${donorName || 'Tanpa Nama'}"?`)) return;
    try {
      await deleteDoc(doc(db, 'donations', id));
      toast.success('Rekod derma berjaya dipadam');
      fetchDonations();
    } catch {
      toast.error('Gagal memadam rekod derma');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Tunai',
      bank_transfer: 'Pindahan Bank',
      cheque: 'Cek',
      online: 'Dalam Talian',
    };
    return labels[method] || method;
  };

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-100">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Pengurusan<br />Derma
            </h1>
            <p className="text-white/60 text-[10px] mt-1">{filteredDonations.length} rekod dijumpai</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                ↑ +23% bulan ini
              </span>
              <span className="bg-blue-400/20 border border-blue-400/30 text-blue-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {donations.length} penderma
              </span>
            </div>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
            <p className="text-white text-[10px] font-bold leading-tight">RM</p>
            <p className="text-white text-xl font-extrabold leading-tight">{stats.total.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            <p className="text-white/55 text-[9px] mt-1">Terkumpul</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

          {/* Stat Cards 2x2 */}
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Bulan Ini', value: formatCurrency(stats.thisMonth), icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
                { label: 'Tahun Ini', value: formatCurrency(stats.thisYear), icon: Calendar, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
                { label: 'Hari Ini', value: formatCurrency(stats.today), icon: Users, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-2.5 shadow-sm">
                    <div className={`w-7 h-7 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
                      <Icon size={13} className={s.iconColor} />
                    </div>
                    <p className="text-[9px] text-slate-400 mb-0.5">{s.label}</p>
                    <p className="text-xs font-extrabold text-slate-900 leading-tight">{s.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section header */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Senarai Derma</p>
            <button onClick={exportToCSV} className="text-[10px] text-[#0d7a6b] font-semibold">Eksport →</button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: 'Semua', value: 'all' },
              { label: 'Hari Ini', value: 'today' },
              { label: 'Bulan Ini', value: 'month' },
              { label: 'Tahun Ini', value: 'year' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setDateFilter(f.value as any)}
                className={`flex-shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold border transition-colors ${
                  dateFilter === f.value
                    ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Donation cards */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <DollarSign size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tiada rekod derma</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDonations.map((donation) => {
                const name = donation.donorName || 'Tanpa Nama';
                const initial = name.charAt(0).toUpperCase();
                const bgColors = ['bg-teal-50', 'bg-blue-50', 'bg-purple-50', 'bg-pink-50', 'bg-amber-50'];
                const textColors = ['text-teal-600', 'text-blue-600', 'text-purple-600', 'text-pink-600', 'text-amber-600'];
                const idx = name.charCodeAt(0) % 5;
                return (
                  <div key={donation.id} className="bg-white rounded-2xl px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${bgColors[idx]} flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-sm font-bold ${textColors[idx]}`}>{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {getCategoryLabel(donation.category)} · {donation.date ? format(toDate(donation.date), 'dd MMM yyyy') : '-'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-extrabold text-[#0d7a6b]">{formatCurrency(donation.amount)}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{getPaymentMethodLabel(donation.paymentMethod)}</p>
                      </div>
                    </div>
                    {(canEdit || canDelete) && (
                      <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                        {canEdit && (
                          <Link
                            href={`/admin/donations/${donation.id}/edit`}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                          >
                            <Edit size={11} />
                            Edit
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(donation.id!, donation.donorName)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-semibold"
                          >
                            <Trash2 size={11} />
                            Padam
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FABs */}
        <div className="fixed bottom-5 right-4 flex flex-col items-end gap-2 z-20">
          {canEdit && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="h-10 px-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 shadow-md"
            >
              <QrCode size={15} className="text-[#0d7a6b]" />
              <span className="text-[#0d7a6b] text-xs font-bold">QR Code</span>
            </button>
          )}
          <Link
            href="/admin/donations/new"
            className="h-11 px-4 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] flex items-center gap-2 shadow-lg shadow-teal-600/30"
          >
            <Plus size={16} className="text-white" />
            <span className="text-white text-xs font-bold">Rekod Baru</span>
          </Link>
        </div>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Memuatkan data derma...</p>
            </div>
          </div>
        ) : (
        <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Derma</h1>
          <p className="text-gray-600 mt-1">Rekod dan pantau semua derma masjid</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          {canEdit && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <QrCode className="h-5 w-5" />
              <span>QR Code</span>
            </button>
          )}
          <Link
            href="/admin/donations/new"
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Rekod Derma Baharu</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jumlah Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.today)}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.thisMonth)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tahun Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.thisYear)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Penapis:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
          <span className="text-sm text-gray-600">
            {filteredDonations.length} rekod dijumpai
          </span>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarikh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penderma
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jumlah
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kaedah
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tindakan
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDonations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Tiada rekod derma dijumpai
                </td>
              </tr>
            ) : (
              filteredDonations.map((donation) => {
                const donationDate = toDate(donation.date);
                return (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(donationDate, 'dd MMM yyyy', { locale: ms })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.donorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        donation.category === 'zakat' ? 'bg-purple-100 text-purple-800' :
                        donation.category === 'sedekah' ? 'bg-blue-100 text-blue-800' :
                        donation.category === 'wakaf' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getCategoryLabel(donation.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getPaymentMethodLabel(donation.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canEdit && (
                          <Link
                            href={`/admin/donations/${donation.id}/edit`}
                            className="text-emerald-600 hover:text-emerald-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(donation.id!, donation.donorName)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Padam"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        </div>
        )}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* QR CODE MODAL                          */}
      {/* ═══════════════════════════════════════ */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-gray-900">QR Code Derma</h2>
              </div>
              <button
                onClick={() => { setQrModalOpen(false); setQrFile(null); setQrPreview(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Current QR */}
              {qrImageUrl && !qrPreview && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">QR Code Semasa</p>
                  <div className="relative bg-gray-50 rounded-xl p-4 flex items-center justify-center border border-gray-200">
                    <Image
                      src={qrImageUrl}
                      alt="QR Code"
                      width={180}
                      height={180}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Preview of new upload */}
              {qrPreview && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Pratonton Baru</p>
                  <div className="relative bg-teal-50 rounded-xl p-4 flex items-center justify-center border border-teal-200">
                    <Image
                      src={qrPreview}
                      alt="Preview"
                      width={180}
                      height={180}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* No QR yet */}
              {!qrImageUrl && !qrPreview && (
                <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center border border-dashed border-gray-300 gap-2">
                  <QrCode className="w-10 h-10 text-gray-300" />
                  <p className="text-sm text-gray-400">Tiada QR Code ditetapkan</p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrFileChange}
              />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {/* Pick / Replace image */}
                <button
                  onClick={() => qrInputRef.current?.click()}
                  disabled={qrUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {qrImageUrl ? 'Ganti QR Code' : 'Pilih Imej QR Code'}
                </button>

                {/* Save upload */}
                {qrPreview && (
                  <button
                    onClick={handleQrUpload}
                    disabled={qrUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {qrUploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Memuat naik...</>
                    ) : (
                      <><Upload className="w-4 h-4" />Simpan QR Code</>
                    )}
                  </button>
                )}

                {/* Delete */}
                {qrImageUrl && !qrPreview && (
                  <button
                    onClick={handleQrDelete}
                    disabled={qrDeleting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {qrDeleting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Memadam...</>
                    ) : (
                      <><Trash className="w-4 h-4" />Padam QR Code</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}