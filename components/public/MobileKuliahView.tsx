'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Clock, Calendar, User, X, Download, Loader2, Search } from 'lucide-react';
import { getActiveJadualKuliah } from '@/lib/jadualKuliah';
import { JadualKuliah } from '@/types';

const DAYS = ['Semua', 'Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'] as const;

function formatTime(item: JadualKuliah): string {
  if (item.timeType === 'fixed' && item.fixedTime) return item.fixedTime;
  if (item.timeType === 'afterPrayer' && item.prayerReference) {
    const min = item.minutesAfterPrayer ?? 0;
    return min > 0
      ? `Selepas ${item.prayerReference} (${min} min)`
      : `Selepas ${item.prayerReference}`;
  }
  return '-';
}

export default function MobileKuliahView() {
  const [jadualList, setJadualList] = useState<JadualKuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Semua');
  const [viewerKuliah, setViewerKuliah] = useState<JadualKuliah | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    getActiveJadualKuliah()
      .then(setJadualList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (viewerKuliah) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [viewerKuliah]);

  const handleDownloadKuliah = async () => {
    if (!viewerKuliah?.posterUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(viewerKuliah.posterUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${viewerKuliah.title || 'kuliah'}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const filtered = useMemo(() =>
    selectedDay === 'Semua' ? jadualList : jadualList.filter(j => j.day === selectedDay),
    [jadualList, selectedDay]
  );

  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-gray-800 px-4 pt-4 pb-0">
        <p className="text-gray-400 text-xs">Masjid Al-Falah</p>
        <p className="text-white font-bold text-lg">Jadual Kuliah</p>
        {/* Day filter pills */}
        <div className="flex gap-2 mt-3 pb-3 overflow-x-auto scrollbar-none">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs border transition-colors ${
                selectedDay === day
                  ? 'bg-[#164e63] border-cyan-700 text-cyan-400 font-semibold'
                  : 'bg-gray-700 border-transparent text-gray-400'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-3 py-3 pb-24">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
              <div className="h-24 bg-gray-200 w-full" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">
            {selectedDay === 'Semua' ? 'Tiada kuliah' : `Tiada kuliah pada hari ${selectedDay}`}
          </p>
        ) : (
          filtered.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${!item.posterUrl ? 'border-l-4 border-cyan-600' : ''}`}>
              {item.posterUrl && (
                <div className="w-full relative cursor-pointer" onClick={() => setViewerKuliah(item)}>
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain block"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1">
                    <Search className="w-2.5 h-2.5 text-white" />
                    <span className="text-[10px] text-white">Ketuk untuk besarkan</span>
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="font-bold text-gray-900 text-sm leading-snug flex-1">{item.title}</p>
                  {item.category ? (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-[#164e63] text-cyan-400">
                      {item.category}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Kuliah
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                  <span>{formatTime(item)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                  <span>{item.day}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{item.ustaz}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fullscreen viewer */}
      {viewerKuliah && viewerKuliah.posterUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black">
            <button
              onClick={() => setViewerKuliah(null)}
              className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <p className="text-white text-sm font-semibold flex-1 text-center px-3 truncate">
              {viewerKuliah.title}
            </p>
            <button
              onClick={handleDownloadKuliah}
              disabled={isDownloading}
              className="w-9 h-9 bg-[#164e63] border border-cyan-700 rounded-full flex items-center justify-center"
            >
              {isDownloading
                ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                : <Download className="w-4 h-4 text-cyan-400" />
              }
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto px-2 py-4">
            <Image
              src={viewerKuliah.posterUrl}
              alt={viewerKuliah.title}
              width={800}
              height={1200}
              className="w-full h-auto object-contain rounded-lg"
              unoptimized
            />
          </div>
          <div className="bg-black py-3 text-center">
            <p className="text-xs text-gray-600">Tahan lama untuk simpan • Ketuk X untuk tutup</p>
          </div>
        </div>
      )}
    </div>
  );
}
