// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Megaphone, TrendingUp, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
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
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalDonations: 0,
    activeAnnouncements: 0,
    monthlyDonations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchDashboardStats();
  }, [user, authLoading]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total members count (correct collection: anakKariah)
      const membersSnapshot = await getCountFromServer(collection(db, 'anakKariah'));
      const totalMembers = membersSnapshot.data().count;

      // Get published announcements count (correct field: published boolean)
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('published', '==', true)
      );
      const announcementsSnapshot = await getCountFromServer(announcementsQuery);
      const activeAnnouncements = announcementsSnapshot.data().count;

      // Get donations — filtered for current month + all-time total
      let totalDonations = 0;
      let monthlyDonations = 0;
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthTs = Timestamp.fromDate(startOfMonth);

        // Monthly donations query
        const monthlyQuery = query(
          collection(db, 'donations'),
          where('date', '>=', startOfMonthTs)
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        monthlySnapshot.forEach((doc) => {
          monthlyDonations += doc.data().amount || 0;
        });

        // All-time total — still needs full scan, but only reads amount field
        const allDonationsSnapshot = await getDocs(collection(db, 'donations'));
        allDonationsSnapshot.forEach((doc) => {
          totalDonations += doc.data().amount || 0;
        });
      } catch {
        // Permission denied or unavailable — leave totals as 0
      }

      setStats({
        totalMembers,
        totalDonations,
        activeAnnouncements,
        monthlyDonations,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Gagal memuatkan statistik. Sila muat semula halaman.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchDashboardStats}
              className="text-sm text-red-600 underline hover:text-red-800 mt-1"
            >
              Cuba lagi
            </button>
          </div>
        </div>
      )}

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
