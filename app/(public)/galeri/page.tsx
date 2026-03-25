'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageIcon, Calendar, X, ChevronLeft, ChevronRight, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { getPublishedAktiviti } from '@/lib/aktiviti';
import { Aktiviti } from '@/types';
import MobileTopBar from '@/components/public/MobileTopBar';
import MobileGaleriView from '@/components/public/MobileGaleriView';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';

const toDate = (val: Date | Timestamp): Date => {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  return new Date(val);
};

const kategoriLabels: Record<string, string> = {
  keagamaan: 'Keagamaan',
  pendidikan: 'Pendidikan',
  kemasyarakatan: 'Kemasyarakatan',
  kebajikan: 'Kebajikan',
  lain: 'Lain-lain',
};

export default function GaleriPage() {
  const [aktivitiList, setAktivitiList] = useState<Aktiviti[]>([]);
  const [filtered, setFiltered] = useState<Aktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; tajuk: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (categoryFilter === 'all') {
      setFiltered(aktivitiList);
    } else {
      setFiltered(aktivitiList.filter(a => a.kategori === categoryFilter));
    }
  }, [categoryFilter, aktivitiList]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublishedAktiviti();
      setAktivitiList(data);
      setFiltered(data);
    } catch (err) {
      console.error('Error fetching aktiviti:', err);
      setError('Gagal memuatkan galeri aktiviti. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (aktiviti: Aktiviti, index: number) => {
    setLightbox({ images: aktiviti.gambarUrls, index, tajuk: aktiviti.tajuk });
  };

  const closeLightbox = () => setLightbox(null);

  const prevImage = () => {
    if (!lightbox) return;
    setLightbox(prev => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null);
  };

  const nextImage = () => {
    if (!lightbox) return;
    setLightbox(prev => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null);
  };

  return (
    <>
      <div className="lg:hidden">
        <MobileGaleriView />
      </div>
      <div className="hidden lg:block">
        <div className="min-h-screen bg-gray-50">
          <MobileTopBar />
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <ImageIcon className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Galeri Aktiviti</h1>
              <p className="text-xl text-emerald-50">
                Koleksi gambar aktiviti dan program Masjid Al-Falah
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Category Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Kategori</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ value: 'all', label: 'Semua' }, ...Object.entries(kategoriLabels).map(([v, l]) => ({ value: v, label: l }))].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCategoryFilter(opt.value)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      categoryFilter === opt.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
                  <p className="mt-4 text-gray-600">Memuatkan galeri...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ralat</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Cuba Lagi
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiada Aktiviti</h2>
                  <p className="text-gray-600">
                    {categoryFilter !== 'all'
                      ? `Tiada aktiviti dalam kategori "${kategoriLabels[categoryFilter]}".`
                      : 'Tiada galeri aktiviti buat masa ini.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {filtered.map(aktiviti => (
                  <div key={aktiviti.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{aktiviti.tajuk}</h2>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(toDate(aktiviti.tarikh), 'dd MMMM yyyy', { locale: ms })}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                              {kategoriLabels[aktiviti.kategori] || aktiviti.kategori}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6">{aktiviti.keterangan}</p>

                      {/* Image Grid */}
                      {aktiviti.gambarUrls?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {aktiviti.gambarUrls.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => openLightbox(aktiviti, i)}
                              className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer"
                            >
                              <Image
                                src={url}
                                alt={`${aktiviti.tajuk} - ${i + 1}`}
                                fill
                                sizes="(max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox Modal */}
          {lightbox && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="absolute top-4 left-4 text-white/80 text-sm">
                <p className="font-medium">{lightbox.tajuk}</p>
                <p>{lightbox.index + 1} / {lightbox.images.length}</p>
              </div>

              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/40 rounded-full"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/40 rounded-full"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}

              <div
                className="relative w-full max-w-5xl max-h-[85vh] mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={lightbox.images[lightbox.index]}
                  alt={`${lightbox.tajuk} - ${lightbox.index + 1}`}
                  width={1200}
                  height={800}
                  className="object-contain w-full h-full max-h-[85vh]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
