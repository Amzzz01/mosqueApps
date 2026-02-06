'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  MessageSquare,
  MapPin,
  UserCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Building2,
  X,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pengurusanAhliOpen, setPengurusanAhliOpen] = useState(
    pathname?.startsWith('/admin/pengurusan-ahli')
  );

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isParentActive = (parentPath: string) => {
    return pathname?.startsWith(parentPath);
  };

  const handleLogout = () => {
    const confirm = window.confirm('Adakah anda pasti untuk log keluar?');
    if (confirm) {
      toast.success('Log keluar berjaya');
      router.push('/');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 w-72 bg-[#1a1f2e] text-white h-screen flex flex-col z-50 shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with Close Button */}
        <div className="p-4 bg-[#141824] border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">Al-Falah</h2>
              <p className="text-xs text-gray-400">Panel Admin</p>
            </div>
          </Link>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info - Compact */}
        <div className="p-4 bg-[#141824] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Administrator</p>
              <p className="text-xs text-gray-400 truncate">admin@masjid.com</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Dashboard */}
          <Link
            href="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/admin')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          {/* Pengurusan Ahli */}
          <div className="space-y-1">
            <button
              onClick={() => setPengurusanAhliOpen(!pengurusanAhliOpen)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                isParentActive('/admin/pengurusan-ahli')
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>Pengurusan Ahli</span>
              </div>
              {pengurusanAhliOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Submenu */}
            {pengurusanAhliOpen && (
              <div className="ml-3 pl-3 border-l border-gray-700 space-y-1">
                <Link
                  href="/admin/pengurusan-ahli/anak-kariah"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    isActive('/admin/pengurusan-ahli/anak-kariah')
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Anak Kariah</span>
                </Link>

                <Link
                  href="/admin/pengurusan-ahli/kawasan"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    pathname?.startsWith('/admin/pengurusan-ahli/kawasan')
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Kawasan</span>
                </Link>
              </div>
            )}
          </div>

          {/* Derma */}
          <Link
            href="/admin/derma"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/admin/derma')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Derma</span>
          </Link>

          {/* Pengumuman */}
          <Link
            href="/admin/pengumuman"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
              isActive('/admin/pengumuman')
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Pengumuman</span>
          </Link>
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}