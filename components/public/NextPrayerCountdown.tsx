'use client';

import { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';

interface NextPrayerCountdownProps {
  nextPrayerName: string;
  nextPrayerTime: string;
}

export default function NextPrayerCountdown({ nextPrayerName, nextPrayerTime }: NextPrayerCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const [hours, minutes] = nextPrayerTime.split(':').map(Number);

      const prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);

      // If prayer time has passed today, set it for tomorrow
      if (prayerDate < now) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }

      const diff = prayerDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

      if (hoursLeft > 0) {
        setTimeRemaining(`${hoursLeft} jam ${minutesLeft} minit ${secondsLeft} saat`);
      } else if (minutesLeft > 0) {
        setTimeRemaining(`${minutesLeft} minit ${secondsLeft} saat`);
      } else {
        setTimeRemaining(`${secondsLeft} saat`);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [nextPrayerTime]);

  return (
    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl shadow-2xl p-8 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side - Info */}
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <Clock className="h-10 w-10" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm font-medium mb-1">
              Solat Seterusnya
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              {nextPrayerName}
            </h2>
          </div>
        </div>

        {/* Middle - Arrow */}
        <ArrowRight className="h-8 w-8 hidden md:block opacity-70" />

        {/* Right Side - Countdown */}
        <div className="text-center md:text-right">
          <p className="text-emerald-100 text-sm font-medium mb-1">
            Masa Berbaki
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <p className="text-2xl md:text-3xl font-bold font-mono tabular-nums">
              {timeRemaining || 'Mengira...'}
            </p>
          </div>
          <p className="text-emerald-100 text-sm mt-2">
            pada {nextPrayerTime}
          </p>
        </div>
      </div>

      {/* Decorative Pulse Animation */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full animate-ping" 
             style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
}