'use client';

import { Clock } from 'lucide-react';

interface PrayerTimeCardProps {
  name: string;
  time: string;
  color: string;
  isNext?: boolean;
}

export default function PrayerTimeCard({ name, time, color, isNext = false }: PrayerTimeCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
        isNext 
          ? 'ring-4 ring-emerald-400 scale-105 shadow-2xl' 
          : 'hover:scale-105 hover:shadow-xl'
      }`}
    >
      {/* Gradient Background */}
      <div className={`bg-gradient-to-br ${color} p-6 text-white`}>
        {/* Next Prayer Badge */}
        {isNext && (
          <div className="absolute top-3 right-3">
            <span className="bg-white text-emerald-600 text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
              Seterusnya
            </span>
          </div>
        )}

        {/* Prayer Name */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold tracking-wide">{name}</h3>
        </div>

        {/* Prayer Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 opacity-90" />
            <span className="text-3xl font-bold tracking-wider">{time}</span>
          </div>
        </div>

        {/* Decorative Pattern */}
        <div className="absolute -bottom-6 -right-6 opacity-10">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="currentColor">
            <circle cx="60" cy="60" r="50" />
          </svg>
        </div>
      </div>

      {/* Bottom Highlight for Next Prayer */}
      {isNext && (
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
      )}
    </div>
  );
}