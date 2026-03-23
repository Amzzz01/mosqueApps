'use client';

import { useState, useEffect } from 'react';
import { fetchPrayerTimes, getNextPrayer, formatMalaysianDate, PrayerTimes as PrayerTimesType } from '@/lib/api/jakim';
import { Clock, Calendar, Loader2 } from 'lucide-react';
import PrayerTimeCard from '@/components/public/PrayerTimeCard';
import NextPrayerCountdown from '@/components/public/NextPrayerCountdown';
import ZoneSelector from '@/components/public/ZoneSelector';
import { getZoneByCode, DEFAULT_ZONE } from '@/lib/zones';
import MobilePrayerTimesView from '@/components/public/MobilePrayerTimesView';

const STORAGE_KEY = 'selected_prayer_zone';

export default function PrayerTimesPage() {
  const [selectedZone, setSelectedZone] = useState<string>(DEFAULT_ZONE);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load saved zone from localStorage on mount
  useEffect(() => {
    const savedZone = localStorage.getItem(STORAGE_KEY);
    if (savedZone) {
      setSelectedZone(savedZone);
    }
  }, []);

  // Fetch prayer times when zone changes
  useEffect(() => {
    async function loadPrayerTimes() {
      setLoading(true);
      setError(false);
      
      try {
        const data = await fetchPrayerTimes(selectedZone);
        if (data) {
          setPrayerTimes(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error loading prayer times:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadPrayerTimes();
  }, [selectedZone]);

  // Handle zone change
  const handleZoneChange = (newZone: string) => {
    setSelectedZone(newZone);
    localStorage.setItem(STORAGE_KEY, newZone);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <MobilePrayerTimesView />
        <div className="hidden lg:flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-emerald-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Memuatkan waktu solat...
            </h2>
            <p className="text-gray-600">
              Sila tunggu sebentar
            </p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !prayerTimes) {
    return (
      <>
        <MobilePrayerTimesView />
        <div className="hidden lg:flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tidak dapat memuat waktu solat
            </h2>
            <p className="text-gray-600 mb-4">
              Sila cuba lagi sebentar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Cuba Lagi
            </button>
          </div>
        </div>
      </>
    );
  }

  const nextPrayer = getNextPrayer(prayerTimes);
  const zoneInfo = getZoneByCode(selectedZone);

  const prayers = [
    { name: 'Imsak', time: prayerTimes.imsak, color: 'from-indigo-500 to-purple-500' },
    { name: 'Subuh', time: prayerTimes.fajr, color: 'from-blue-500 to-cyan-500' },
    { name: 'Syuruk', time: prayerTimes.syuruk, color: 'from-orange-400 to-yellow-400' },
    { name: 'Zohor', time: prayerTimes.dhuhr, color: 'from-amber-500 to-orange-500' },
    { name: 'Asar', time: prayerTimes.asr, color: 'from-orange-500 to-red-500' },
    { name: 'Maghrib', time: prayerTimes.maghrib, color: 'from-pink-500 to-rose-500' },
    { name: 'Isyak', time: prayerTimes.isha, color: 'from-purple-600 to-indigo-600' },
  ];

  return (
    <>
      <MobilePrayerTimesView />
      <div className="hidden lg:block min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Clock className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Waktu Solat
            </h1>
            
            {/* Zone Selector */}
            <div className="flex justify-center mb-6">
              <ZoneSelector 
                currentZone={selectedZone}
                onZoneChange={handleZoneChange}
              />
            </div>

            {/* Date and Location Info */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-emerald-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="text-lg">
                  {formatMalaysianDate(prayerTimes.date)}
                </span>
              </div>
              <div className="hidden md:block">•</div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{prayerTimes.hijri}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Next Prayer Countdown */}
        <NextPrayerCountdown 
          nextPrayerName={nextPrayer.name}
          nextPrayerTime={nextPrayer.time}
        />

        {/* Prayer Times Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Jadual Waktu Solat Hari Ini
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {prayers.map((prayer) => (
              <PrayerTimeCard
                key={prayer.name}
                name={prayer.name}
                time={prayer.time}
                color={prayer.color}
                isNext={nextPrayer.name === prayer.name}
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Maklumat Waktu Solat
          </h3>
          <div className="space-y-3 text-gray-600">
            <p className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Waktu solat adalah berdasarkan zon {zoneInfo?.code} ({zoneInfo?.name})
            </p>
            <p className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Data waktu solat dikemaskini secara automatik dari JAKIM e-Solat
            </p>
            <p className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Waktu Imsak adalah 10 minit sebelum Subuh
            </p>
            <p className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Syuruk adalah waktu terbit matahari (bukan waktu solat)
            </p>
            <p className="flex items-start">
              <span className="text-emerald-600 mr-2">•</span>
              Zon yang dipilih akan disimpan untuk lawatan akan datang
            </p>
          </div>
        </div>

        {/* Source Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sumber: Jabatan Kemajuan Islam Malaysia (JAKIM)</p>
          <p className="mt-1">Dikemaskini secara langsung</p>
        </div>
      </div>
    </div>
    </>
  );
}