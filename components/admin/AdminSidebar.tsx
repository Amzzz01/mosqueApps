// src/components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Megaphone, 
  LogOut,
  Building2,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Ahli', icon: Users },
  { href: '/admin/donations', label: 'Derma', icon: DollarSign },
  { href: '/admin/announcements', label: 'Pengumuman', icon: Megaphone },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg">Al-Falah</h2>
                <p className="text-xs text-gray-400">Panel Admin</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            title={isCollapsed ? 'Buka' : 'Tutup'}
          >
            <ChevronLeft 
              className={`h-5 w-5 transition-transform ${
                isCollapsed ? 'rotate-180' : ''
              }`} 
            />
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
          title={isCollapsed ? 'Log Keluar' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Log Keluar</span>}
        </button>
      </div>
    </aside>
  );
}