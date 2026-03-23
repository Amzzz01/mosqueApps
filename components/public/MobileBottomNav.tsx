'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, BookOpen, Home, ImageIcon, MoreHorizontal } from 'lucide-react';

const tabs = [
  { icon: Heart, label: 'Derma', href: '/derma', center: false },
  { icon: BookOpen, label: 'Kuliah', href: '/jadual-kuliah', center: false },
  { icon: Home, label: 'Utama', href: '/', center: true },
  { icon: ImageIcon, label: 'Galeri', href: '/galeri', center: false },
  { icon: MoreHorizontal, label: 'Lagi', href: '/announcements', center: false },
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 h-16 flex items-end pb-2 justify-around px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.href === '/' ? pathname === '/' : pathname === tab.href;

        if (tab.center) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center -mt-4"
            >
              <div className="w-14 h-14 bg-cyan-700 rounded-full flex items-center justify-center shadow-lg shadow-cyan-700/40 border-4 border-white mb-1">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-cyan-700">{tab.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 pb-1"
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`} />
            <span className={`text-xs ${isActive ? 'font-semibold text-cyan-600' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
