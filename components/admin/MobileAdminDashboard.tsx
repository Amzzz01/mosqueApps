'use client';

import Link from 'next/link';
import {
  Users,
  DollarSign,
  Megaphone,
  TrendingUp,
  UserPlus,
  Bell,
  BookOpen,
  ImageIcon,
  Clock,
  FileText,
  UserCheck,
  HandCoins,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { RecentActivityItem } from '@/types';

const DAYS_MY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const MONTHS_MY = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

function getMalayDate(): string {
  const now = new Date();
  return `${DAYS_MY[now.getDay()]}, ${now.getDate()} ${MONTHS_MY[now.getMonth()]} ${now.getFullYear()}`;
}

interface Stats {
  totalMembers: number;
  totalDonations: number;
  activeAnnouncements: number;
  monthlyDonations: number;
}

interface Props {
  stats: Stats;
  loading: boolean;
  userName: string;
  recentActivities: RecentActivityItem[];
}

const quickActions = [
  { label: 'Ahli Baru', href: '/admin/pengurusan-ahli/anak-kariah/tambah', bg: 'bg-blue-50', iconBg: 'bg-blue-600', icon: UserPlus },
  { label: 'Derma', href: '/admin/donations/new', bg: 'bg-teal-50', iconBg: 'bg-teal-600', icon: DollarSign },
  { label: 'Pengumuman', href: '/admin/announcements/new', bg: 'bg-purple-50', iconBg: 'bg-purple-600', icon: Megaphone },
  { label: 'Kuliah', href: '/admin/jadual-kuliah/new', bg: 'bg-amber-50', iconBg: 'bg-amber-600', icon: BookOpen },
  { label: 'Galeri', href: '/admin/aktiviti/new', bg: 'bg-rose-50', iconBg: 'bg-rose-600', icon: ImageIcon },
  { label: 'Notifikasi', href: '/admin/settings/notifications', bg: 'bg-gray-100', iconBg: 'bg-gray-500', icon: Bell },
];

function ActivityIcon({ type }: { type: RecentActivityItem['type'] }) {
  if (type === 'member') return <UserCheck className="w-4 h-4 text-blue-600" />;
  if (type === 'donation') return <HandCoins className="w-4 h-4 text-teal-600" />;
  return <FileText className="w-4 h-4 text-purple-600" />;
}

function activityIconBg(type: RecentActivityItem['type']) {
  if (type === 'member') return 'bg-blue-100';
  if (type === 'donation') return 'bg-teal-100';
  return 'bg-purple-100';
}

export default function MobileAdminDashboard({ stats, loading, userName, recentActivities }: Props) {
  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-slate-50">

      {/* 1. GREETING BANNER */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 pt-6 pb-8">
        <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4">
          <p className="text-teal-100 text-xs mb-0.5">Selamat kembali</p>
          <p className="text-white font-extrabold text-lg leading-tight">{userName || 'Administrator'}</p>
          <p className="text-teal-200 text-xs mt-1">{getMalayDate()}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 -mt-4 pb-24">

        {/* 2. STAT CARDS */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Jumlah Ahli</p>
              <p className="text-xl font-extrabold text-slate-900">{stats.totalMembers.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+23%</span>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Jumlah Derma</p>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(stats.totalDonations)}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Pengumuman Aktif</p>
              <p className="text-xl font-extrabold text-slate-900">{stats.activeAnnouncements}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+8%</span>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Derma Bulan Ini</p>
              <p className="text-xl font-extrabold text-slate-900">{formatCurrency(stats.monthlyDonations)}</p>
            </div>
          </div>
        )}

        {/* 3. QUICK ACTIONS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Tindakan Pantas</p>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`${action.bg} rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform`}
                >
                  <div className={`${action.iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. RECENT ACTIVITY */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Aktiviti Terkini</p>
            <Link href="/admin/announcements" className="text-xs text-teal-600 font-medium">
              Lihat semua →
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-sm text-slate-400">Tiada aktiviti terkini</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {recentActivities.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${i < recentActivities.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className={`w-9 h-9 ${activityIconBg(item.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <ActivityIcon type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                    {item.addedBy && (
                      <p className="text-[10px] text-slate-300 truncate">oleh {item.addedBy}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <p className="text-[10px] text-slate-400">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
