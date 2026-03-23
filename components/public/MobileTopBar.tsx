'use client';

import { Bell } from 'lucide-react';

export default function MobileTopBar() {
  return (
    <div className="lg:hidden sticky top-0 z-40 bg-teal-800 text-white h-14 flex items-center justify-between px-4">
      {/* Left: gold arch icon + mosque name */}
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2,22 L2,12 Q12,2 22,12 L22,22"
            stroke="#D4AF37"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <line x1="12" y1="2" x2="12" y2="6" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="1" r="1" fill="#D4AF37" />
        </svg>
        <span className="font-bold text-base text-white">Masjid Al-Falah</span>
      </div>

      {/* Right: bell button */}
      <button
        type="button"
        aria-label="Notifikasi"
        className="bg-orange-500 rounded-full w-9 h-9 flex items-center justify-center"
      >
        <Bell className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
