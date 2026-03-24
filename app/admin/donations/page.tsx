// app/admin/donations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Donation } from '@/types';
import { Plus, Download, DollarSign, TrendingUp, Calendar, Edit, Trash2, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';
import MobileAdminHeader from '@/components/admin/MobileAdminHeader';
import { signOutAdmin } from '@/lib/auth';

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

  useEffect(() => {
    fetchDonations();
  }, []);

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

        {/* Mobile Header */}
        <MobileAdminHeader
          title="Pengurusan Derma"
          subtitle={`${filteredDonations.length} rekod dijumpai`}
          onLogout={async () => {
            if (window.confirm('Adakah anda pasti untuk log keluar?')) {
              toast.success('Log keluar berjaya');
              try { await signOutAdmin(); } catch {}
            }
          }}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

          {/* Stat Cards 2x2 */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Jumlah Terkumpul', value: formatCurrency(stats.total), icon: DollarSign, iconBg: 'bg-teal-50', iconColor: 'text-teal-600', badge: '+23%' },
                { label: 'Bulan Ini', value: formatCurrency(stats.thisMonth), icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', badge: '+8%' },
                { label: 'Tahun Ini', value: formatCurrency(stats.thisYear), icon: Calendar, iconBg: 'bg-purple-50', iconColor: 'text-purple-600', badge: null },
                { label: 'Hari Ini', value: formatCurrency(stats.today), icon: Users, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badge: null },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-3 shadow-sm">
                    <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
                      <Icon size={15} className={s.iconColor} />
                    </div>
                    <p className="text-[10px] text-slate-400 mb-0.5">{s.label}</p>
                    <p className="text-sm font-extrabold text-slate-900 leading-tight">{s.value}</p>
                    {s.badge && (
                      <span className="text-[9px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">↑ {s.badge}</span>
                    )}
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
                  <div key={donation.id} className="bg-white rounded-2xl px-3 py-3 flex items-center gap-3 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl ${bgColors[idx]} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${textColors[idx]}`}>{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {donation.category || 'Umum'} · {donation.date ? format(toDate(donation.date), 'dd MMM yyyy') : '-'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-extrabold text-[#0d7a6b]">{formatCurrency(donation.amount)}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{donation.paymentMethod || 'Tunai'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAB */}
        <Link
          href="/admin/donations/new"
          className="fixed bottom-5 right-4 h-11 px-4 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] flex items-center gap-2 shadow-lg shadow-teal-600/30 z-20"
        >
          <Plus size={16} className="text-white" />
          <span className="text-white text-xs font-bold">Rekod Baru</span>
        </Link>

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
                        <Link
                          href={`/admin/donations/${donation.id}/edit`}
                          className="text-emerald-600 hover:text-emerald-900 p-1"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(donation.id!, donation.donorName)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Padam"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

    </div>
  );
}