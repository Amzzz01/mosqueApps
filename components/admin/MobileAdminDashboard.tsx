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
  CheckCircle,
  Clock,
  FileText,
  UserCheck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

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
}

const quickActions = [
  { label: 'Ahli Baru', href: '/admin/pengurusan-ahli/anak-kariah/tambah', bg: 'bg-blue-50', iconBg: 'bg-blue-600', icon: UserPlus },
  { label: 'Derma', href: '/admin/donations/new', bg: 'bg-teal-50', iconBg: 'bg-teal-600', icon: DollarSign },
  { label: 'Pengumuman', href: '/admin/announcements/new', bg: 'bg-purple-50', iconBg: 'bg-purple-600', icon: Megaphone },
  { label: 'Kuliah', href: '/admin/jadual-kuliah/new', bg: 'bg-amber-50', iconBg: 'bg-amber-600', icon: BookOpen },
  { label: 'Galeri', href: '/admin/aktiviti/new', bg: 'bg-rose-50', iconBg: 'bg-rose-600', icon: ImageIcon },
  { label: 'Notifikasi', href: '/admin/settings/notifications', bg: 'bg-gray-100', iconBg: 'bg-gray-500', icon: Bell },
];

const recentActivity = [
  { icon: UserCheck, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Ahli baharu didaftarkan', subtitle: 'Ahmad bin Yusof', time: '2 minit lalu' },
  { icon: DollarSign, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', title: 'Sumbangan diterima', subtitle: 'RM 200.00', time: '15 minit lalu' },
  { icon: FileText, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', title: 'Pengumuman diterbitkan', subtitle: 'Jadual Kuliah Ramadan', time: '1 jam lalu' },
  { icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600', title: 'Jadual kuliah dikemaskini', subtitle: 'Ustaz Hafizi — Ahad', time: '3 jam lalu' },
];

export default function MobileAdminDashboard({ stats, loading, userName }: Props) {
  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-slate-50">

      {/* 1. GREETING BANNER */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 pt-6 pb-8">
        <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4">
          <p className="text-teal-100 text-xs mb-0.5">Selamat kembali 👋</p>
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
            {/* Total Members */}
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

            {/* Total Donations */}
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

            {/* Active Announcements */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-0.5">Pengumuman Aktif</p>
              <p className="text-xl font-extrabold text-slate-900">{stats.activeAnnouncements}</p>
            </div>

            {/* Monthly Donations */}
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
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {recentActivity.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${i < recentActivity.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className={`w-9 h-9 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{item.title}</p>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <p className="text-[10px] text-slate-400">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
