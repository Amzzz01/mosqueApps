// app/(public)/jadual-kuliah/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  BookOpen, Clock, Calendar, MapPin, AlertCircle, GraduationCap, User,
} from 'lucide-react';
import { getActiveJadualKuliah, getActiveKategori } from '@/lib/jadualKuliah';
import { JadualKuliah, KategoriKuliah } from '@/types';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

function getTodayMalay(): string {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  const map: Record<number, string> = {
    0: 'Ahad', 1: 'Isnin', 2: 'Selasa', 3: 'Rabu',
    4: 'Khamis', 5: 'Jumaat', 6: 'Sabtu',
  };
  return map[jsDay] || 'Isnin';
}

function formatTime(item: JadualKuliah): string {
  if (item.timeType === 'fixed' && item.fixedTime) return item.fixedTime;
  if (item.timeType === 'afterPrayer' && item.prayerReference) {
    const min = item.minutesAfterPrayer ?? 0;
    return min > 0
      ? `Selepas Solat ${item.prayerReference} ${min} minit`
      : `Selepas Solat ${item.prayerReference}`;
  }
  return '-';
}

function formatWeek(weeks: string[]): string {
  if (!weeks || weeks.length === 0) return '';
  if (weeks.includes('Semua')) return 'Setiap Minggu';
  return `Minggu ${weeks.join(', ')}`;
}

export default function JadualKuliahPublicPage() {
  const [jadualList, setJadualList] = useState<JadualKuliah[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriKuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jadual, kategori] = await Promise.all([
          getActiveJadualKuliah(),
          getActiveKategori(),
        ]);
        setJadualList(jadual);
        setKategoriList(kategori);
      } catch (err) {
        console.error('[jadual-kuliah/public] Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = activeDay === 'Semua' ? [...jadualList] : jadualList.filter(j => j.day === activeDay);
    if (categoryFilter !== 'all') {
      result = result.filter(j => j.category === categoryFilter);
    }
    return result;
  }, [jadualList, activeDay, categoryFilter]);

  const todayMalay = getTodayMalay();

  // Count per day for badges
  const countByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    DAYS.forEach(d => {
      counts[d] = jadualList.filter(j => j.day === d).length;
    });
    return counts;
  }, [jadualList]);

  const getKategoriColor = (catName: string) => {
    const kat = kategoriList.find(k => k.name === catName);
    return kat?.color || '#6b7280';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan jadual kuliah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3">Jadual Kuliah</h1>
          <p className="text-lg sm:text-xl text-emerald-50">
            Program pendidikan dan kuliah mingguan di Masjid Al-Falah
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {jadualList.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiada Kuliah</h2>
              <p className="text-gray-600">
                Tiada jadual kuliah buat masa ini. Sila semak semula kemudian.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Day Tabs */}
            <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-1.5 sm:gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                <button
                  onClick={() => setActiveDay('Semua')}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeDay === 'Semua'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Semua
                  <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeDay === 'Semua'
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {jadualList.length}
                  </span>
                </button>
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                      activeDay === day
                        ? 'bg-emerald-600 text-white shadow-md'
                        : day === todayMalay
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                    {countByDay[day] > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                        activeDay === day
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {countByDay[day]}
                      </span>
                    )}
                    {day === todayMalay && activeDay !== day && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {kategoriList.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Semua Kategori
                </button>
                {kategoriList.map(kat => (
                  <button
                    key={kat.id}
                    onClick={() => setCategoryFilter(kat.name)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1.5 ${
                      categoryFilter === kat.name
                        ? 'text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    style={categoryFilter === kat.name ? { backgroundColor: kat.color } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: kat.color }}
                    />
                    {kat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Kuliah Cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {activeDay === 'Semua' ? 'Tiada kuliah dijumpai' : `Tiada kuliah pada hari ${activeDay}`}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filtered.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-emerald-200 hover:-translate-y-1"
                  >
                    {item.posterUrl ? (
                      <Image
                        src={item.posterUrl}
                        alt={item.title}
                        width={800}
                        height={600}
                        className="w-full h-auto"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="h-1.5" style={{ backgroundColor: getKategoriColor(item.category) }} />
                    )}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span
                          className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getKategoriColor(item.category) }}
                        >
                          {item.category}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{formatTime(item)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{formatWeek(item.weekOfMonth)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{item.venue}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <p className="text-sm font-medium text-emerald-600">{item.ustaz}</p>
                      </div>

                      {item.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Maklumat</h3>
              <p className="text-gray-600 text-sm">
                Jadual kuliah mungkin berubah dari semasa ke semasa. Sila hubungi pejabat masjid untuk pengesahan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
