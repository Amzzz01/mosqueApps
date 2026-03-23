'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ImageIcon, X, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublishedAktiviti } from '@/lib/aktiviti';
import { Aktiviti } from '@/types';
import { Timestamp } from 'firebase/firestore';

const MONTHS_MY = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

function formatTarikh(val: unknown): string {
  let date: Date;
  if (val && typeof (val as { toDate?: unknown }).toDate === 'function') {
    date = (val as Timestamp).toDate();
  } else if (val instanceof Date) {
    date = val;
  } else {
    date = new Date(val as string);
  }
  return `${MONTHS_MY[date.getMonth()]} ${date.getFullYear()}`;
}

const CATEGORY_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'keagamaan', label: 'Keagamaan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'kemasyarakatan', label: 'Kemasyarakatan' },
  { value: 'kebajikan', label: 'Kebajikan' },
];

export default function MobileGaleriView() {
  const [aktivitiList, setAktivitiList] = useState<Aktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lightboxAktiviti, setLightboxAktiviti] = useState<Aktiviti | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    getPublishedAktiviti()
      .then(setAktivitiList)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (lightboxAktiviti) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxAktiviti]);

  const openLightbox = (aktiviti: Aktiviti) => {
    setLightboxAktiviti(aktiviti);
    setLightboxIndex(0);
  };

  const closeLightbox = () => {
    setLightboxAktiviti(null);
    setLightboxIndex(0);
  };

  const goPrev = () => {
    setLightboxIndex(i => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (!lightboxAktiviti) return;
    setLightboxIndex(i => Math.min(lightboxAktiviti.gambarUrls.length - 1, i + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
  };

  const handleDownloadGaleri = async () => {
    if (!lightboxAktiviti || isDownloading) return;
    const imageUrl = lightboxAktiviti.gambarUrls[lightboxIndex];
    if (!imageUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${lightboxAktiviti.tajuk || 'gambar'}-${lightboxIndex + 1}.jpg`;
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
    selectedCategory === 'all'
      ? aktivitiList
      : aktivitiList.filter(a => a.kategori === selectedCategory),
    [aktivitiList, selectedCategory]
  );

  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-gray-800 px-4 pt-4 pb-0">
        <p className="text-gray-400 text-xs">Masjid Al-Falah</p>
        <p className="text-white font-bold text-lg">Galeri Aktiviti</p>
        {/* Category filter chips */}
        <div className="flex gap-2 mt-3 pb-3 overflow-x-auto scrollbar-none">
          {CATEGORY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setSelectedCategory(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === f.value
                  ? 'bg-[#164e63] border-cyan-700 text-cyan-400'
                  : 'bg-gray-700 border-transparent text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-12">Tiada aktiviti</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(aktiviti => (
              <div
                key={aktiviti.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                onClick={() => openLightbox(aktiviti)}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-200">
                  {aktiviti.gambarUrls?.[0] ? (
                    <Image
                      src={aktiviti.gambarUrls[0]}
                      alt={aktiviti.tajuk}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-[#164e63]/80 text-cyan-300">
                    {aktiviti.kategori}
                  </span>
                  {/* Bottom text */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-xs font-bold line-clamp-2">{aktiviti.tajuk}</p>
                    <p className="text-white/70 text-[10px] mt-0.5">{formatTarikh(aktiviti.tarikh)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxAktiviti && lightboxAktiviti.gambarUrls?.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
            <button
              onClick={closeLightbox}
              className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <p className="text-white text-sm font-semibold flex-1 text-center px-3 truncate">
              {lightboxAktiviti.tajuk}
            </p>
            <button
              onClick={handleDownloadGaleri}
              disabled={isDownloading}
              className="w-9 h-9 bg-[#164e63] border border-cyan-700 rounded-full flex items-center justify-center"
            >
              {isDownloading
                ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                : <Download className="w-4 h-4 text-cyan-400" />
              }
            </button>
          </div>

          {/* Image area with swipe support */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={lightboxAktiviti.gambarUrls[lightboxIndex]}
              alt={`${lightboxAktiviti.tajuk} ${lightboxIndex + 1}`}
              width={800}
              height={800}
              className="w-full h-auto max-h-full object-contain"
              unoptimized
            />

            {/* Left arrow */}
            {lightboxIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Right arrow */}
            {lightboxIndex < lightboxAktiviti.gambarUrls.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {/* Bottom: dot indicators + counter */}
          <div className="bg-black py-3 flex flex-col items-center gap-2 flex-shrink-0">
            {lightboxAktiviti.gambarUrls.length > 1 && (
              <div className="flex items-center gap-1.5">
                {lightboxAktiviti.gambarUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${
                      i === lightboxIndex
                        ? 'w-4 h-1.5 bg-cyan-400'
                        : 'w-1.5 h-1.5 bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600">
              {lightboxAktiviti.gambarUrls.length > 1
                ? `${lightboxIndex + 1} / ${lightboxAktiviti.gambarUrls.length} • Leret untuk tukar gambar`
                : 'Tahan lama untuk simpan • Ketuk X untuk tutup'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
