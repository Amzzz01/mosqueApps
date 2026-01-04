import { fetchPrayerTimes, getNextPrayer, formatMalaysianDate } from '@/lib/api/jakim';
import { Clock, MapPin, Calendar } from 'lucide-react';
import PrayerTimeCard from '@/components/public/PrayerTimeCard';
import NextPrayerCountdown from '@/components/public/NextPrayerCountdown';

export const revalidate = 3600; // Revalidate every hour

export default async function PrayerTimesPage() {
  const prayerTimes = await fetchPrayerTimes('SGR01');

  if (!prayerTimes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tidak dapat memuat waktu solat
          </h2>
          <p className="text-gray-600">
            Sila cuba lagi sebentar.
          </p>
        </div>
      </div>
    );
  }

  const nextPrayer = getNextPrayer(prayerTimes);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Clock className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Waktu Solat
            </h1>
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
              <div className="hidden md:block">•</div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">Zon SGR01 - Shah Alam</span>
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
              Waktu solat adalah berdasarkan zon SGR01 (Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Rawang, Shah Alam)
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
          </div>
        </div>

        {/* Source Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Sumber: Jabatan Kemajuan Islam Malaysia (JAKIM)</p>
          <p className="mt-1">Kemaskini setiap jam</p>
        </div>
      </div>
    </div>
  );
}