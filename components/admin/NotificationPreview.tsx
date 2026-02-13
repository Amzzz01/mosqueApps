// components/admin/NotificationPreview.tsx
'use client';

import { Bell, X } from 'lucide-react';

interface NotificationPreviewProps {
  title: string;
  body: string;
  onClose?: () => void;
}

export default function NotificationPreview({ title, body, onClose }: NotificationPreviewProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-4 max-w-sm mx-auto shadow-2xl">
      {/* Phone status bar */}
      <div className="flex items-center justify-between text-white/60 text-xs mb-3 px-1">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 border border-white/60 rounded-sm">
            <div className="w-3 h-1.5 bg-green-400 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Notification card */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            {/* App name and time */}
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Masjid Al-Falah
              </span>
              <span className="text-xs text-gray-400">sekarang</span>
            </div>

            {/* Title */}
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {title || 'Tajuk Notifikasi'}
            </p>

            {/* Body */}
            <p className="text-sm text-gray-600 leading-snug mt-0.5 line-clamp-3">
              {body || 'Kandungan notifikasi akan dipaparkan di sini.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dismiss hint */}
      <div className="flex justify-center mt-3">
        <div className="w-32 h-1 bg-white/20 rounded-full" />
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white/40 hover:text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
