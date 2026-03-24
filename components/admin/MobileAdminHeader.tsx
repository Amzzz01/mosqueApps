'use client';

import { Menu, LogOut } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onLogout: () => void;
}

export default function MobileAdminHeader({ title, subtitle, onMenuClick, onLogout }: Props) {
  return (
    <div className="lg:hidden bg-gradient-to-r from-[#0d7a6b] to-[#085048] px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'));
          onMenuClick?.();
        }}
        className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0"
      >
        <Menu size={16} className="text-white" />
      </button>
      <div className="flex-1 text-center">
        <p className="text-white text-sm font-bold leading-tight">{title}</p>
        {subtitle && <p className="text-white/60 text-[10px] mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={onLogout}
        className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0"
      >
        <LogOut size={14} className="text-red-300" />
      </button>
    </div>
  );
}
