'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Announcement } from '@/types';
import { Timestamp } from 'firebase/firestore';

const MONTHS_MY = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

function relativeTime(ts: unknown): string {
  let date: Date;
  if (ts && typeof (ts as { toDate?: unknown }).toDate === 'function') {
    date = (ts as Timestamp).toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    date = new Date(ts as string);
  }
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return 'Baru sahaja';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} hari lalu`;
  return `${date.getDate()} ${MONTHS_MY[date.getMonth()]} ${date.getFullYear()}`;
}

const FILTERS = ['Semua', 'Penting', 'Umum'] as const;
type Filter = typeof FILTERS[number];

export default function MobileAnnouncementsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('Semua');

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'announcements'),
          where('published', '==', true),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = announcements.filter(a => {
    if (activeFilter === 'Penting') return a.priority === 'high';
    if (activeFilter === 'Umum') return a.priority !== 'high';
    return true;
  });

  const isImportant = (a: Announcement) => a.priority === 'high';

  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-gray-800 px-4 pt-4 pb-0">
        <p className="text-gray-400 text-xs">Masjid Al-Falah</p>
        <p className="text-white font-bold text-lg">Pengumuman</p>
        {/* Filter chips */}
        <div className="flex gap-2 mt-3 pb-3 overflow-x-auto scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === f
                  ? 'bg-[#164e63] border-cyan-700 text-cyan-400'
                  : 'bg-gray-700 border-transparent text-gray-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-3 py-3 pb-24">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
              <div className="border-l-4 border-gray-200 p-3 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-12" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">Tiada pengumuman</p>
        ) : (
          filtered.map(a => (
            <div
              key={a.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${
                isImportant(a) ? 'bg-[#f0fdff]' : ''
              }`}
            >
              <div className={`border-l-4 p-3 ${isImportant(a) ? 'border-cyan-600' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isImportant(a)
                      ? 'bg-[#164e63] text-cyan-400'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isImportant(a) ? 'Penting' : 'Umum'}
                  </span>
                  <span className="text-xs text-gray-400">{relativeTime(a.createdAt)}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
