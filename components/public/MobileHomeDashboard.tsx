'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Megaphone, BookOpen, Heart, ImageIcon, UserPlus, Phone, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { fetchPrayerTimes, PrayerTimes } from '@/lib/api/jakim';

const DAYS_MY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const MONTHS_MY = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

function getMalayDate(): string {
  const now = new Date();
  return `${DAYS_MY[now.getDay()]}, ${now.getDate()} ${MONTHS_MY[now.getMonth()]} ${now.getFullYear()}`;
}

interface Prayer {
  name: string;
  time: string;
}

function getPrayers(pt: PrayerTimes): Prayer[] {
  return [
    { name: 'Subuh', time: pt.fajr },
    { name: 'Syuruk', time: pt.syuruk },
    { name: 'Zuhur', time: pt.dhuhr },
    { name: 'Asar', time: pt.asr },
    { name: 'Maghrib', time: pt.maghrib },
    { name: 'Isyak', time: pt.isha },
  ];
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getNextPrayerIndex(prayers: Prayer[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < prayers.length; i++) {
    if (timeToMinutes(prayers[i].time) > currentMinutes) {
      return i;
    }
  }
  return 0;
}

function getCountdown(timeStr: string): string {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} jam ${minutes} minit lagi`;
  return `${minutes} minit lagi`;
}

function relativeTime(timestamp: unknown): string {
  let date: Date;
  if (timestamp && typeof (timestamp as { toDate?: unknown }).toDate === 'function') {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp as string);
  }
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return 'Baru sahaja';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} hari lalu`;
  return `${date.getDate()} ${MONTHS_MY[date.getMonth()]} ${date.getFullYear()}`;
}

interface Announcement {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  createdAt: unknown;
}

const quickActions = [
  { label: 'Pengumuman', href: '/announcements', icon: Megaphone, bg: 'bg-cyan-50', iconBg: 'bg-cyan-700', labelColor: 'text-cyan-900' },
  { label: 'Kuliah', href: '/jadual-kuliah', icon: BookOpen, bg: 'bg-sky-50', iconBg: 'bg-sky-600', labelColor: 'text-sky-900' },
  { label: 'Derma', href: '/derma', icon: Heart, bg: 'bg-yellow-50', iconBg: 'bg-yellow-600', labelColor: 'text-yellow-900' },
  { label: 'Galeri', href: '/galeri', icon: ImageIcon, bg: 'bg-purple-50', iconBg: 'bg-purple-600', labelColor: 'text-purple-900' },
  { label: 'Daftar', href: '/register', icon: UserPlus, bg: 'bg-teal-50', iconBg: 'bg-teal-600', labelColor: 'text-teal-900' },
  { label: 'Hubungi', href: '/contact', icon: Phone, bg: 'bg-gray-100', iconBg: 'bg-gray-500', labelColor: 'text-gray-700' },
];

export default function MobileHomeDashboard() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetchPrayerTimes('KDH01').then(data => {
      setPrayerTimes(data);
      setPrayerLoading(false);
    });
  }, []);

  // Refresh countdown every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const q = query(
          collection(db, 'announcements'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setAnnouncement({ id: doc.id, ...doc.data() } as Announcement);
        }
      } catch {
        // ignore
      } finally {
        setAnnouncementLoading(false);
      }
    }
    loadAnnouncement();
  }, []);

  const prayers = prayerTimes ? getPrayers(prayerTimes) : [];
  const nextIdx = prayers.length > 0 ? getNextPrayerIndex(prayers) : -1;
  const nextPrayer = nextIdx >= 0 ? prayers[nextIdx] : null;
  const upcomingPrayers = nextIdx >= 0 ? prayers.slice(nextIdx + 1, nextIdx + 3) : [];

  return (
    <div className="lg:hidden flex flex-col bg-gray-50">
      {/* A. App Header */}
      <div className="bg-gray-800 px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs">{getMalayDate()}</p>
          <p className="text-gray-50 font-bold text-base">Masjid Al-Falah</p>
        </div>
        <Link
          href="/notifikasi"
          className="w-9 h-9 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center"
        >
          <Bell className="w-5 h-5 text-cyan-100" />
        </Link>
      </div>

      {/* B. Prayer Time Hero Card */}
      <div className="bg-gray-900 px-4 pt-3 pb-6 rounded-b-3xl">
        {prayerLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-8 bg-white/10 rounded w-1/2" />
            <div className="h-6 bg-white/10 rounded w-1/3 mt-1" />
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-1 h-12 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        ) : prayerTimes && nextPrayer ? (
          <>
            {/* Top row: next prayer + upcoming */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-cyan-400 text-xs mb-1">Solat Seterusnya</p>
                <p className="text-gray-50 text-2xl font-extrabold leading-tight">{nextPrayer.name}</p>
                <p className="text-cyan-100 text-lg font-semibold">{nextPrayer.time}</p>
                <div className="flex items-center gap-1.5 mt-2 bg-[#1e3a4a] rounded-full px-3 py-1 self-start w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 text-xs">{getCountdown(nextPrayer.time)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs mb-2">Seterusnya</p>
                <div className="space-y-2">
                  {upcomingPrayers.map(p => (
                    <div key={p.name}>
                      <p className="text-gray-400 text-xs">{p.name}</p>
                      <p className="text-cyan-100 text-sm font-bold">{p.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-800 mb-3" />
            {/* All 6 prayer times */}
            <div className="flex gap-1.5">
              {prayers.map((p, i) => (
                <div
                  key={p.name}
                  className={`flex-1 flex flex-col items-center py-2 ${
                    i === nextIdx
                      ? 'bg-[#164e63] border border-cyan-700 rounded-xl px-2'
                      : ''
                  }`}
                >
                  <p className={`text-xs ${i === nextIdx ? 'text-cyan-400 font-semibold' : 'text-gray-500'}`}>
                    {p.name}
                  </p>
                  <p className={`text-xs mt-0.5 ${i === nextIdx ? 'text-cyan-100 font-bold' : 'text-gray-400 font-semibold'}`}>
                    {p.time}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Waktu solat tidak tersedia</p>
        )}
      </div>

      {/* C. White Body */}
      <div className="bg-white px-4 pt-4 pb-6">
        {/* C1. Quick Actions */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Akses Pantas</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.bg} rounded-2xl p-3 flex flex-col items-center gap-2`}
              >
                <div className={`${action.iconBg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-medium text-center ${action.labelColor}`}>{action.label}</span>
              </Link>
            );
          })}
        </div>

        {/* C2. Latest Announcement */}
        {announcementLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="bg-gray-100 rounded-xl p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ) : announcement ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Pengumuman Terkini</p>
              <Link
                href="/announcements"
                className="text-xs text-cyan-600 font-medium flex items-center gap-0.5"
              >
                Lihat semua <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-[#f0fdff] border border-cyan-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{announcement.title}</p>
                  {(announcement.excerpt || announcement.content) && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {announcement.excerpt || announcement.content}
                    </p>
                  )}
                  <p className="text-xs text-cyan-400 font-medium mt-2">{relativeTime(announcement.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
