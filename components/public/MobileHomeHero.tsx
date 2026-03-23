'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, MapPin, VolumeX, Share2 } from 'lucide-react';
import { fetchPrayerTimes, getNextPrayer, PrayerTimes } from '@/lib/api/jakim';

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getSecondsUntil(timeStr: string): number {
  const now = new Date();
  const [h, m] = timeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatGregorian(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function getCurrentPrayerName(pt: PrayerTimes): string | null {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const prayers = [
    { name: 'Subuh', time: pt.fajr },
    { name: 'Zohor', time: pt.dhuhr },
    { name: 'Asar', time: pt.asr },
    { name: 'Maghrib', time: pt.maghrib },
    { name: 'Isyak', time: pt.isha },
  ];
  let current: string | null = null;
  for (const p of prayers) {
    const [h, m] = p.time.split(':').map(Number);
    if (cur >= h * 60 + m) {
      current = p.name;
    } else {
      break;
    }
  }
  return current;
}

export default function MobileHomeHero() {
  const pathname = usePathname();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [bellActive, setBellActive] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPrayerTimes('KDH01').then((pt) => {
      if (pt) {
        setPrayerTimes(pt);
        const next = getNextPrayer(pt);
        setCountdown(getSecondsUntil(next.time));
      }
    });
  }, []);

  useEffect(() => {
    if (!prayerTimes) return;
    const interval = setInterval(() => {
      const next = getNextPrayer(prayerTimes);
      setCountdown(getSecondsUntil(next.time));
    }, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  if (pathname !== '/') return null;

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null;
  const activePrayer = prayerTimes ? getCurrentPrayerName(prayerTimes) : null;
  const dhuhaTime = prayerTimes ? addMinutes(prayerTimes.syuruk, 28) : '--:--';

  const stripItems = prayerTimes
    ? [
        { label: 'Imsak', time: prayerTimes.imsak },
        { label: 'Subuh', time: prayerTimes.fajr },
        { label: 'Syuruk', time: prayerTimes.syuruk },
        { label: 'Dhuha', time: dhuhaTime },
        { label: 'Zohor', time: prayerTimes.dhuhr },
      ]
    : [];

  const prayerList = prayerTimes
    ? [
        { key: 'Subuh', label: 'Subuh', sub: 'Fajar', time: prayerTimes.fajr },
        { key: 'Zohor', label: 'Zohor', sub: 'Waktu Tengah Hari', time: prayerTimes.dhuhr },
        { key: 'Asar', label: 'Asar', sub: 'Petang', time: prayerTimes.asr },
        { key: 'Maghrib', label: 'Maghrib', sub: 'Senja', time: prayerTimes.maghrib },
        { key: 'Isyak', label: 'Isyak', sub: 'Malam', time: prayerTimes.isha },
      ]
    : [];

  return (
    <div className="lg:hidden">
      {/* SECTION B — Prayer Hero */}
      <div className="bg-gray-900 relative overflow-hidden px-6 py-8">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/60 to-gray-900 z-0" />

        {/* Mosque silhouette */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          height="80"
          viewBox="0 0 375 80"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 L0,60 L30,60 L30,40 Q30,20 50,20 Q70,20 70,40 L70,60 L100,60 L100,50 Q100,10 150,5 Q200,0 250,5 Q300,10 300,50 L300,60 L330,60 L330,40 Q330,20 350,20 Q370,20 370,40 L370,60 L375,60 L375,80 Z"
            fill="rgba(55,65,81,0.3)"
          />
        </svg>

        {/* Top-right action buttons */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button
            type="button"
            aria-label="Bunyi"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400"
          >
            <VolumeX className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Kongsi"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <p className="text-[10px] tracking-[0.2em] text-teal-300 uppercase mb-1">
            WAKTU SOLAT SETERUSNYA
          </p>

          {prayerTimes && nextPrayer ? (
            <>
              <p className="text-5xl font-black text-white tracking-wide uppercase">
                {nextPrayer.name}
              </p>
              <p className="text-6xl font-black text-white leading-none mt-1">
                {nextPrayer.time}
              </p>

              {/* Countdown pill */}
              <div className="mt-4 inline-flex items-center gap-2 bg-gray-800/80 border border-teal-700/50 rounded-xl px-5 py-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="font-mono text-sm text-teal-200">
                  {nextPrayer.name} dalam {formatCountdown(countdown)}
                </span>
              </div>

              {/* Date row */}
              <div className="mt-4 flex justify-center gap-3 text-xs text-gray-300">
                <span>{formatGregorian(prayerTimes.date)}</span>
                <span className="text-gray-600">|</span>
                <span>{prayerTimes.hijri}</span>
              </div>

              {/* Location row */}
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>Masjid Al-Falah</span>
                <span>(KDH01)</span>
              </div>
            </>
          ) : (
            <div className="animate-pulse space-y-4 mt-4">
              <div className="h-12 bg-gray-700 rounded-lg mx-auto w-48" />
              <div className="h-16 bg-gray-700 rounded-lg mx-auto w-36" />
              <div className="h-8 bg-gray-700 rounded-full mx-auto w-56" />
            </div>
          )}
        </div>
      </div>

      {/* SECTION C — Time Info Strip */}
      <div className="bg-teal-900 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 w-max">
          {prayerTimes
            ? stripItems.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-[10px] text-teal-300 uppercase tracking-wide">{item.label}</span>
                  <span className="text-sm font-bold text-white">{item.time}</span>
                </div>
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-teal-700" />
                  <span className="w-8 h-2 bg-teal-700 rounded mt-0.5" />
                  <span className="w-10 h-3 bg-teal-700 rounded" />
                </div>
              ))}
        </div>
      </div>

      {/* SECTION D — Prayer List */}
      <div className="bg-white px-4 py-5 pb-24">
        {/* Title row */}
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-gray-800 text-base">Waktu Solat Hari Ini</span>
          {prayerTimes && (
            <span className="text-xs text-gray-400">{formatShortDate(prayerTimes.date)}</span>
          )}
        </div>

        {prayerTimes ? (
          <div className="relative">
            {prayerList.map((prayer, idx) => {
              const isActive = prayer.key === activePrayer;
              const isBellOn = bellActive[prayer.key] ?? false;
              const isLast = idx === prayerList.length - 1;

              return (
                <div
                  key={prayer.key}
                  className={`relative flex items-center gap-3 py-3 ${
                    isActive
                      ? 'bg-teal-50 -mx-4 px-4 rounded-r-2xl border-l-4 border-teal-500'
                      : ''
                  }`}
                >
                  {/* Dot + connector column */}
                  <div className="flex flex-col items-center self-stretch">
                    <div
                      className={
                        isActive
                          ? 'w-3 h-3 bg-teal-500 rounded-full ring-4 ring-teal-100'
                          : 'w-2.5 h-2.5 bg-gray-200 rounded-full border-2 border-gray-300'
                      }
                    />
                    {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>

                  {/* Middle */}
                  <div className="flex-1">
                    <p
                      className={`font-semibold text-sm ${
                        isActive ? 'text-teal-700' : 'text-gray-800'
                      }`}
                    >
                      {prayer.label}
                    </p>
                    <p className="text-xs text-gray-400">{prayer.sub}</p>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm ${
                        isActive ? 'text-teal-600' : 'text-gray-900'
                      }`}
                    >
                      {prayer.time}
                    </span>
                    <button
                      type="button"
                      aria-label={`Peringatan ${prayer.label}`}
                      onClick={() =>
                        setBellActive((prev) => ({ ...prev, [prayer.key]: !prev[prayer.key] }))
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isBellOn
                          ? 'bg-orange-100 text-orange-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
                  <div className="h-2 bg-gray-100 rounded w-28" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
