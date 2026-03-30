'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Megaphone, BookOpen, Heart, ImageIcon, UserPlus, Phone, ChevronRight, UserRoundCog, Download, X } from 'lucide-react';
import { requestNotificationPermission, saveFCMToken } from '@/lib/firebase-messaging';
import { auth } from '@/lib/firebase/config';
import QuotesSlideshow from '@/components/public/QuotesSlideshow';
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
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('');
  const [showInstallOptions, setShowInstallOptions] = useState(false);
  const [showApkGuide, setShowApkGuide] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isDismissed = localStorage.getItem('hideNotifBanner') === 'true';
      setNotifPermission(Notification.permission);
      setShowNotifBanner(Notification.permission === 'default' && !isDismissed);
    }
  }, []);

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

  // PWA install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleEnableNotification = async () => {
    localStorage.setItem('hideNotifBanner', 'true');
    const token = await requestNotificationPermission();
    if (token && auth.currentUser) {
      await saveFCMToken(auth.currentUser.uid, token);
    }
    setNotifPermission(Notification.permission);
    setShowNotifBanner(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).userChoice;
    setDeferredPrompt(null);
  };

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
        <div className="flex items-center gap-2">
          <Link
            href="/admin/login"
            className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600"
            title="Admin Login"
          >
            <UserRoundCog className="w-4 h-4 text-gray-300" />
          </Link>
          <Link
            href="/notifikasi"
            className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600"
          >
            <Bell className="w-4 h-4 text-cyan-100" />
          </Link>
        </div>
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
            {/* Link to full prayer times page */}
            <Link
              href="/prayer-times"
              className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-700 text-gray-400 text-xs font-medium active:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Lihat Waktu Solat Penuh & Tetapan Zon
            </Link>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Waktu solat tidak tersedia</p>
        )}
      </div>

      {/* C. White Body */}
      <div className="bg-white px-4 pt-4 pb-6">
        {/* Notification Banner */}
        {typeof window !== 'undefined' && 'Notification' in window && notifPermission === 'default' && showNotifBanner && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-3 mb-4">
            <div className="bg-teal-100 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-teal-900">Aktifkan Notifikasi</p>
              <p className="text-xs text-teal-600 leading-tight">Terima pemberitahuan solat &amp; pengumuman masjid</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  localStorage.setItem('hideNotifBanner', 'true');
                  setShowNotifBanner(false);
                }}
                className="w-6 h-6 flex items-center justify-center text-teal-400 hover:text-teal-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleEnableNotification}
                className="bg-teal-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
              >
                Aktifkan
              </button>
            </div>
          </div>
        )}

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
          {!isInstalled && (
            <div
              onClick={() => setShowInstallOptions(true)}
              className={`bg-indigo-50 rounded-2xl p-3 text-center cursor-pointer active:scale-95 transition-transform hover:bg-indigo-100`}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-xl mx-auto mb-1.5 flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] text-indigo-900 font-semibold leading-tight">
                Pasang App
              </span>
            </div>
          )}
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

      {/* D. Quotes Slideshow */}
      <QuotesSlideshow />

      {/* Install Options Modal */}
      {showInstallOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4" onClick={() => setShowInstallOptions(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Pilih Versi Aplikasi</h3>
              <button onClick={() => setShowInstallOptions(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Pilih versi aplikasi yang anda ingin pasang:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowInstallOptions(false);
                  handleInstall();
                }}
                disabled={!deferredPrompt}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Aplikasi Web (PWA)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sesuai untuk semua peranti (Tidak memakan memori, terus dari pelayar)</p>
                </div>
              </button>

              <button
                onClick={() => {
                  window.location.href = "/downloads/al-falah-app.apk";
                  setShowInstallOptions(false);
                  setShowApkGuide(true);
                }}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-start gap-3"
              >
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Aplikasi Android (APK)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Versi Android Penuh (Sila benarkan 'Unknown Sources' semasa memasang)</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK Install Guide Modal */}
      {showApkGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4" onClick={() => setShowApkGuide(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Panduan Pemasangan APK</h3>
              <button onClick={() => setShowApkGuide(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Fail APK sedang dimuat turun. Sila ikuti langkah berikut untuk memasang aplikasi:
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Buka fail <strong>al-falah-app.apk</strong> yang telah dimuat turun.</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Jika peranti anda meminta kebenaran, pilih <strong>Tetapan (Settings)</strong> dan aktifkan <strong>"Benarkan dari sumber ini" (Allow from this source)</strong>.</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Tekan <strong>Pasang (Install)</strong> dan tunggu sehingga selesai.</span>
              </div>
            </div>

            <button
              onClick={() => setShowApkGuide(false)}
              className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
