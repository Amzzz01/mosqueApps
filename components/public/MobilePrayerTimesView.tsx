'use client';

import { useState, useEffect } from 'react';
import { Settings, X, Check, Loader2 } from 'lucide-react';
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
    { name: 'Imsak', time: pt.imsak },
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

const ZONES = [
  { code: 'KDH01', name: 'Kota Setar, Kubang Pasu' },
  { code: 'KDH02', name: 'Kuala Muda, Yan, Pendang' },
  { code: 'PNG01', name: 'Pulau Pinang' },
  { code: 'PRK01', name: 'Tapah, Slim River' },
  { code: 'SGR01', name: 'Gombak, Petaling, Sepang' },
  { code: 'WLY01', name: 'Kuala Lumpur, Putrajaya' },
  { code: 'JHR01', name: 'Pulau Aur, Pemanggil' },
  { code: 'JHR02', name: 'Johor Bahru, Kota Tinggi' },
  { code: 'MLK01', name: 'Seluruh Melaka' },
  { code: 'NSS01', name: 'Nilai, Seremban' },
  { code: 'PHG02', name: 'Kuantan, Pekan, Rompin' },
  { code: 'KTN01', name: 'Kota Bharu, Pasir Mas' },
  { code: 'TRG01', name: 'Kuala Terengganu' },
  { code: 'SBH01', name: 'Kota Kinabalu' },
  { code: 'SRW01', name: 'Kuching' },
  { code: 'PLS01', name: 'Seluruh Perlis' },
];

export default function MobilePrayerTimesView() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [, setTick] = useState(0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState('KDH01');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifMinutesBefore, setNotifMinutesBefore] = useState(15);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedZone = localStorage.getItem('prayerZone') || 'KDH01';
    const savedNotif = localStorage.getItem('prayerNotif') === 'true';
    const savedMinutes = parseInt(localStorage.getItem('prayerNotifMinutes') || '15');
    setSelectedZone(savedZone);
    setNotifEnabled(savedNotif);
    setNotifMinutesBefore(savedMinutes);
  }, []);

  // Fetch prayer times when zone changes
  useEffect(() => {
    setPrayerLoading(true);
    fetchPrayerTimes(selectedZone).then(data => {
      setPrayerTimes(data);
      setPrayerLoading(false);
    });
  }, [selectedZone]);

  // Refresh countdown every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll lock when settings open
  useEffect(() => {
    if (settingsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [settingsOpen]);

  const handleSaveSettings = () => {
    setSavingSettings(true);
    localStorage.setItem('prayerZone', selectedZone);
    localStorage.setItem('prayerNotif', String(notifEnabled));
    localStorage.setItem('prayerNotifMinutes', String(notifMinutesBefore));
    setTimeout(() => {
      setSavingSettings(false);
      setSettingsOpen(false);
      window.location.reload();
    }, 600);
  };

  const prayers = prayerTimes ? getPrayers(prayerTimes) : [];
  const nextIdx = prayers.length > 0 ? getNextPrayerIndex(prayers) : -1;
  const nextPrayer = nextIdx >= 0 ? prayers[nextIdx] : null;
  const currentZoneLabel = ZONES.find(z => z.code === selectedZone)?.name || selectedZone;

  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-gray-800 px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs">{getMalayDate()}</p>
          <p className="text-gray-50 font-bold text-base">Waktu Solat</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600"
        >
          <Settings className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gray-900 px-4 pt-4 pb-6 rounded-b-3xl">
        {prayerLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-8 bg-white/10 rounded w-1/2" />
            <div className="h-6 bg-white/10 rounded w-1/3 mt-1" />
          </div>
        ) : prayerTimes && nextPrayer ? (
          <>
            <p className="text-cyan-400 text-xs mb-1">Solat Seterusnya</p>
            <p className="text-gray-50 text-2xl font-extrabold leading-tight">{nextPrayer.name}</p>
            <p className="text-cyan-100 text-lg font-semibold">{nextPrayer.time}</p>
            <div className="flex items-center gap-1.5 mt-2 bg-[#1e3a4a] rounded-full px-3 py-1 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-300 text-xs">{getCountdown(nextPrayer.time)}</span>
            </div>
            <p className="text-gray-600 text-xs mt-3">Zon: {currentZoneLabel} ({selectedZone})</p>
          </>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Waktu solat tidak tersedia</p>
        )}
      </div>

      {/* Prayer Times List */}
      <div className="flex flex-col gap-2 px-4 py-4 pb-24">
        {prayerLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))
        ) : prayers.map((p, i) => {
          const isNext = i === nextIdx;
          return (
            <div
              key={p.name}
              className={`rounded-2xl px-4 py-3 flex items-center justify-between border ${
                isNext
                  ? 'bg-[#164e63] border-cyan-700'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {isNext && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                )}
                <p className={`text-sm font-semibold ${isNext ? 'text-cyan-100' : 'text-gray-700'}`}>
                  {p.name}
                </p>
                {isNext && (
                  <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-medium">
                    Seterusnya
                  </span>
                )}
              </div>
              <p className={`text-sm font-bold ${isNext ? 'text-cyan-400' : 'text-gray-800'}`}>
                {p.time}
              </p>
            </div>
          );
        })}

        {/* Hijri date */}
        {prayerTimes?.hijri && (
          <p className="text-center text-xs text-gray-400 mt-2">{prayerTimes.hijri}</p>
        )}

        <p className="text-center text-xs text-gray-400 mt-1">
          Sumber: JAKIM e-Solat
        </p>
      </div>

      {/* Settings Bottom Sheet */}
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setSettingsOpen(false)}
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="text-base font-bold text-gray-900">Tetapan Waktu Solat</p>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-5 max-h-[70vh] overflow-y-auto pb-8">

              {/* Zone selector */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Zon Waktu Solat
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {ZONES.map(zone => (
                    <button
                      key={zone.code}
                      onClick={() => setSelectedZone(zone.code)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-left transition-all ${
                        selectedZone === zone.code
                          ? 'bg-[#f0fdff] border-cyan-400 text-cyan-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-sm">{zone.name}</span>
                      <span className={`text-xs font-bold ${
                        selectedZone === zone.code ? 'text-cyan-600' : 'text-gray-400'
                      }`}>
                        {zone.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification toggle */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Notifikasi Azan
                </p>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Peringatan Waktu Solat</p>
                    <p className="text-xs text-gray-500">Terima notifikasi sebelum azan</p>
                  </div>
                  <button
                    onClick={() => setNotifEnabled(!notifEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      notifEnabled ? 'bg-cyan-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                      notifEnabled ? 'left-6' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                {/* Minutes before - only show if notif enabled */}
                {notifEnabled && (
                  <div className="mt-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Minit sebelum azan
                    </p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20, 30].map(min => (
                        <button
                          key={min}
                          onClick={() => setNotifMinutesBefore(min)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            notifMinutesBefore === min
                              ? 'bg-[#164e63] border-cyan-700 text-cyan-400'
                              : 'bg-white border-gray-200 text-gray-600'
                          }`}
                        >
                          {min}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-3 bg-gray-900 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {savingSettings ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
