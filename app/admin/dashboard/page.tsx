// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Megaphone, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/admin/StatCard';
import QuickActions from '@/components/admin/QuickActions';
import { formatCurrency } from '@/lib/utils/formatters';

interface DashboardStats {
  totalMembers: number;
  totalDonations: number;
  activeAnnouncements: number;
  monthlyDonations: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalDonations: 0,
    activeAnnouncements: 0,
    monthlyDonations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get total members count
      const membersSnapshot = await getCountFromServer(collection(db, 'members'));
      const totalMembers = membersSnapshot.data().count;

      // Get published announcements count
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('status', '==', 'published')
      );
      const announcementsSnapshot = await getCountFromServer(announcementsQuery);
      const activeAnnouncements = announcementsSnapshot.data().count;

      // Get donations (all time and this month)
      const donationsSnapshot = await getDocs(collection(db, 'donations'));
      let totalDonations = 0;
      let monthlyDonations = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      donationsSnapshot.forEach((doc) => {
        const data = doc.data();
        const amount = data.amount || 0;
        totalDonations += amount;

        // Check if donation is from current month
        const donationDate = data.date?.toDate();
        if (
          donationDate &&
          donationDate.getMonth() === currentMonth &&
          donationDate.getFullYear() === currentYear
        ) {
          monthlyDonations += amount;
        }
      });

      setStats({
        totalMembers,
        totalDonations,
        activeAnnouncements,
        monthlyDonations,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Memuatkan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang kembali, {user?.name || 'Admin'}! 👋
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jumlah Ahli"
          value={stats.totalMembers}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Jumlah Derma"
          value={formatCurrency(stats.totalDonations)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Pengumuman Aktif"
          value={stats.activeAnnouncements}
          icon={Megaphone}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="Derma Bulan Ini"
          value={formatCurrency(stats.monthlyDonations)}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity / Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Sistem Pengurusan Masjid</h3>
          <p className="text-emerald-50 mb-4">
            Anda kini menggunakan Panel Pentadbir Masjid Al-Falah. Sistem ini membolehkan anda mengurus ahli, derma, dan pengumuman dengan mudah.
          </p>
          <div className="flex space-x-4">
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm flex-1">
              <p className="text-emerald-100 text-sm">Status Sistem</p>
              <p className="font-semibold text-lg">✓ Aktif</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm flex-1">
              <p className="text-emerald-100 text-sm">Versi</p>
              <p className="font-semibold text-lg">1.0.0</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ringkasan Pantas
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Ahli Berdaftar</span>
              <span className="font-semibold text-gray-900">{stats.totalMembers}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Derma Terkumpul</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(stats.totalDonations)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Pengumuman</span>
              <span className="font-semibold text-gray-900">{stats.activeAnnouncements}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}