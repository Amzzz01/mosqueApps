// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, Megaphone, TrendingUp, AlertCircle, UserCheck, FileText } from 'lucide-react';
import { collection, query, where, getDocs, getCountFromServer, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/admin/StatCard';
import QuickActions from '@/components/admin/QuickActions';
import MobileAdminDashboard from '@/components/admin/MobileAdminDashboard';
import { formatCurrency } from '@/lib/utils/formatters';
import { RecentActivityItem } from '@/types';

interface DashboardStats {
  totalMembers: number;
  totalDonations: number;
  activeAnnouncements: number;
  monthlyDonations: number;
}

function relativeTime(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date();
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru sahaja';
  if (mins < 60) return `${mins} minit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Semalam';
  if (days < 30) return `${days} hari lalu`;
  return date.toLocaleDateString('ms-MY');
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalDonations: 0,
    activeAnnouncements: 0,
    monthlyDonations: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
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

      // Get total members count
      const membersSnapshot = await getCountFromServer(collection(db, 'anakKariah'));
      const totalMembers = membersSnapshot.data().count;

      // Get published announcements count
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('published', '==', true)
      );
      const announcementsSnapshot = await getCountFromServer(announcementsQuery);
      const activeAnnouncements = announcementsSnapshot.data().count;

      // Get donations
      let totalDonations = 0;
      let monthlyDonations = 0;
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthTs = Timestamp.fromDate(startOfMonth);

        const monthlyQuery = query(collection(db, 'donations'), where('date', '>=', startOfMonthTs));
        const monthlySnap = await getDocs(monthlyQuery);
        monthlySnap.forEach((doc) => { monthlyDonations += doc.data().amount || 0; });

        const allDonationsSnap = await getDocs(collection(db, 'donations'));
        allDonationsSnap.forEach((doc) => { totalDonations += doc.data().amount || 0; });
      } catch {
        // Permission denied or unavailable
      }

      setStats({ totalMembers, totalDonations, activeAnnouncements, monthlyDonations });

      // Fetch recent activities
      try {
        const activities: RecentActivityItem[] = [];

        // Recent new members
        const recentMembersQ = query(
          collection(db, 'anakKariah'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        const recentMembersSnap = await getDocs(recentMembersQ);
        recentMembersSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (d.isDeleted) return;
          const ts = d.createdAt as Timestamp | null;
          activities.push({
            type: 'member',
            title: 'Ahli baharu didaftarkan',
            subtitle: d.namaPenuh || '—',
            time: relativeTime(ts),
            timestamp: ts ? ts.toDate().getTime() : 0,
          });
        });

        // Recent announcements
        const recentAnnouncementsQ = query(
          collection(db, 'announcements'),
          orderBy('updatedAt', 'desc'),
          limit(4)
        );
        const recentAnnouncementsSnap = await getDocs(recentAnnouncementsQ);
        recentAnnouncementsSnap.docs.forEach((doc) => {
          const d = doc.data();
          const ts = d.updatedAt as Timestamp | null;
          activities.push({
            type: 'announcement',
            title: d.published ? 'Pengumuman diterbitkan' : 'Pengumuman dikemaskini',
            subtitle: d.title || '—',
            time: relativeTime(ts),
            timestamp: ts ? ts.toDate().getTime() : 0,
          });
        });

        // Sort by most recent, take top 5
        activities.sort((a, b) => b.timestamp - a.timestamp);
        setRecentActivities(activities.slice(0, 5));
      } catch {
        setRecentActivities([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Gagal memuatkan statistik. Sila muat semula halaman.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <MobileAdminDashboard stats={stats} loading={true} userName="" recentActivities={[]} />
        <div className="hidden lg:flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Memuatkan data...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileAdminDashboard
        stats={stats}
        loading={false}
        userName={user?.displayName || 'Administrator'}
        recentActivities={recentActivities}
      />
      <div className="hidden lg:block p-6 space-y-6">
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
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatCard
            title="Jumlah Derma"
            value={formatCurrency(stats.totalDonations)}
            icon={DollarSign}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
            trend={{ value: "+23%", isPositive: true }}
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
            trend={{ value: "+8%", isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktiviti Terkini</h3>
          {recentActivities.length === 0 ? (
            <p className="text-gray-500 text-sm">Tiada aktiviti terkini</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.type === 'member' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    {item.type === 'member' ? (
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{item.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
