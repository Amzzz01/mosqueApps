// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Megaphone, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
        <p className="text-gray-600 mt-1">Selamat kembali, {user?.displayName}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jumlah Ahli"
          value={stats.totalMembers}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          trend={{
            value: "+12%",
            isPositive: true,
          }}
        />
        <StatCard
          title="Jumlah Derma"
          value={formatCurrency(stats.totalDonations)}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
          trend={{
            value: "+23%",
            isPositive: true,
          }}
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
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          trend={{
            value: "+8%",
            isPositive: true,
          }}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Aktiviti Terkini
        </h3>
        <p className="text-gray-600">Tiada aktiviti terkini</p>
      </div>
    </div>
  );
}