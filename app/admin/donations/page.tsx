// src/app/admin/donations/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Donation } from '@/types';
import { Plus, Download, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ms } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
      const donationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Donation[];
      
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
        filtered = donations.filter(d => 
          d.date && format(d.date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        );
        break;
      case 'month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = donations.filter(d => 
          d.date && d.date >= monthStart && d.date <= monthEnd
        );
        break;
      case 'year':
        const yearStart = startOfYear(now);
        const yearEnd = endOfYear(now);
        filtered = donations.filter(d => 
          d.date && d.date >= yearStart && d.date <= yearEnd
        );
        break;
    }

    setFilteredDonations(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    const today = donations
      .filter(d => d.date && format(d.date, 'yyyy-MM-dd') === todayStr)
      .reduce((sum, d) => sum + d.amount, 0);
    const thisMonth = donations
      .filter(d => d.date && d.date >= monthStart && d.date <= monthEnd)
      .reduce((sum, d) => sum + d.amount, 0);
    const thisYear = donations
      .filter(d => d.date && d.date >= yearStart && d.date <= yearEnd)
      .reduce((sum, d) => sum + d.amount, 0);

    setStats({ total, today, thisMonth, thisYear });
  };

  const exportToCSV = () => {
    const headers = ['Tarikh', 'Nama', 'Jumlah', 'Jenis', 'Catatan'];
    const rows = filteredDonations.map(donation => [
      donation.date ? format(donation.date, 'dd/MM/yyyy') : '-',
      donation.donorName || 'Tanpa Nama',
      donation.amount.toString(),
      donation.type === 'general' ? 'Umum' : donation.type === 'zakat' ? 'Zakat' : 'Sadaqah',
      donation.notes || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `derma-masjid-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Memuatkan data derma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Derma</h1>
          <p className="text-gray-600 mt-1">
            Jumlah: {filteredDonations.length} rekod
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/donations/new"
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Rekod Derma</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jumlah Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.total)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.today)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.thisMonth)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tahun Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.thisYear)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'today'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'month'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setDateFilter('year')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              dateFilter === 'year'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tahun Ini
          </button>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarikh
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Penderma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Tiada rekod derma dijumpai
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.date && format(donation.date, 'dd MMM yyyy', { locale: ms })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {donation.donorName || 'Tanpa Nama'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.type === 'zakat'
                          ? 'bg-purple-100 text-purple-800'
                          : donation.type === 'sadaqah'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {donation.type === 'zakat' ? 'Zakat' : donation.type === 'sadaqah' ? 'Sadaqah' : 'Umum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {donation.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}