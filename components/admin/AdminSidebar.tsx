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
  X,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  ImageIcon,
  Bell,
  Pencil,
  Shield,
} from 'lucide-react';

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main dome */}
      <path d="M12 3 C9 3 7 5 7 7.5 L7 9 L17 9 L17 7.5 C17 5 15 3 12 3 Z" />
      {/* Small side domes */}
      <path d="M5 9 C3.5 9 2.5 10 2.5 11.5 L2.5 13 L7 13 L7 9 Z" />
      <path d="M19 9 C20.5 9 21.5 10 21.5 11.5 L21.5 13 L17 13 L17 9 Z" />
      {/* Main body */}
      <rect x="4" y="13" width="16" height="8" rx="0.5" />
      {/* Door arch */}
      <path d="M10 21 L10 17 C10 15.9 10.9 15 12 15 C13.1 15 14 15.9 14 17 L14 21" />
      {/* Minaret left */}
      <rect x="1" y="11" width="2" height="10" rx="0.5" />
      <path d="M1 11 L1.5 9 L2 11" />
      {/* Minaret right */}
      <rect x="21" y="11" width="2" height="10" rx="0.5" />
      <path d="M21 11 L21.5 9 L22 11" />
      {/* Crescent on top */}
      <path d="M12 1.5 C11 1.5 10.3 2.1 10 3 C10.6 2.8 11.3 2.8 12 3 C12.7 2.8 13.4 2.8 14 3 C13.7 2.1 13 1.5 12 1.5 Z" />
    </svg>
  );
}
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import EditProfileModal from './EditProfileModal';

interface AdminSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({
  collapsed,
  mobileOpen,
  onClose,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [pengurusanAhliOpen, setPengurusanAhliOpen] = useState(
    pathname?.startsWith('/admin/pengurusan-ahli')
  );

  // Auto-close submenu when sidebar collapses on desktop
  useEffect(() => {
    if (collapsed) {
      setPengurusanAhliOpen(false);
    } else if (pathname?.startsWith('/admin/pengurusan-ahli')) {
      setPengurusanAhliOpen(true);
    }
  }, [collapsed, pathname]);

  const isActive = (path: string) => pathname === path;
  const isParentActive = (parentPath: string) => pathname?.startsWith(parentPath);

  const handleLogout = () => {
    const confirm = window.confirm('Adakah anda pasti untuk log keluar?');
    if (confirm) {
      toast.success('Log keluar berjaya');
      router.push('/');
    }
  };

  const handleNavClick = () => {
    // Only close on mobile
    onClose();
  };

  // Shared nav item classes
  const navItemBase = 'flex items-center rounded-lg transition-all text-sm';
  const navItemActive = 'bg-teal-600/20 text-teal-400';
  const navItemInactive = 'text-gray-300 hover:bg-gray-800/50 hover:text-white';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={[
          // Base
          'fixed top-0 left-0 h-screen flex flex-col z-50 bg-[#1a1f2e] text-white shadow-xl',
          // Mobile: overlay drawer, always w-72, slides in/out
          'lg:relative lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, width changes based on collapsed
          'lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-72',
          // Width on mobile is always full-size
          'w-72',
          // Transitions
          'transition-all duration-300 ease-in-out',
        ].join(' ')}
      >
        {/* Header */}
        <div className="p-3 bg-[#141824] border-b border-gray-800 flex items-center justify-between min-h-[60px]">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}
            onClick={handleNavClick}
          >
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <MosqueIcon className="w-5 h-5 text-white" />
            </div>
            <div className={`transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
              <h2 className="font-bold text-sm whitespace-nowrap">Al-Falah</h2>
              <p className="text-xs text-gray-400 whitespace-nowrap">Panel Admin</p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className={`bg-[#141824] border-b border-gray-800 ${collapsed ? 'lg:px-2 lg:py-3' : 'p-3'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                onClick={() => collapsed && setEditProfileOpen(true)}
                title={collapsed ? 'Edit Profil' : undefined}
                className={`w-9 h-9 rounded-full object-cover flex-shrink-0 ${collapsed ? 'lg:cursor-pointer' : ''}`}
              />
            ) : (
              <div
                onClick={() => collapsed && setEditProfileOpen(true)}
                title={collapsed ? 'Edit Profil' : undefined}
                className={`w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 ${collapsed ? 'lg:cursor-pointer' : ''}`}
              >
                <span className="text-xs font-bold">
                  {(user?.displayName || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className={`flex-1 min-w-0 transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-sm font-semibold truncate">{user?.displayName || 'Administrator'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@masjid.com'}</p>
            </div>
            <button
              onClick={() => setEditProfileOpen(true)}
              className={`w-7 h-7 rounded-lg bg-teal-600/15 border border-teal-600/30 flex items-center justify-center hover:bg-teal-600/25 transition-colors flex-shrink-0 ${collapsed ? 'lg:hidden' : ''}`}
              title="Edit Profil"
            >
              <Pencil className="w-3.5 h-3.5 text-teal-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {/* Dashboard */}
          <Link
            href="/admin/dashboard"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/dashboard') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Dashboard</span>
          </Link>

          {/* Pengurusan Ahli */}
          <div className="space-y-1">
            <button
              onClick={() => {
                if (collapsed) {
                  // On collapsed click, expand sidebar first then open submenu
                  onToggleCollapse();
                  setPengurusanAhliOpen(true);
                } else {
                  setPengurusanAhliOpen(!pengurusanAhliOpen);
                }
              }}
              className={`w-full ${navItemBase} justify-between gap-3 px-3 py-2.5 ${isParentActive('/admin/pengurusan-ahli') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              title={collapsed ? 'Pengurusan Ahli' : undefined}
            >
              <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Pengurusan Ahli</span>
              </div>
              <span className={collapsed ? 'lg:hidden' : ''}>
                {pengurusanAhliOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            </button>

            {/* Submenu */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                pengurusanAhliOpen && !collapsed
                  ? 'max-h-40 opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-3 pl-3 border-l border-gray-700 space-y-1">
                <Link
                  href="/admin/pengurusan-ahli/anak-kariah"
                  onClick={handleNavClick}
                  className={`${navItemBase} gap-3 px-3 py-2 ${
                    isActive('/admin/pengurusan-ahli/anak-kariah') ? navItemActive : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Anak Kariah</span>
                </Link>

                <Link
                  href="/admin/pengurusan-ahli/kawasan"
                  onClick={handleNavClick}
                  className={`${navItemBase} gap-3 px-3 py-2 ${
                    pathname?.startsWith('/admin/pengurusan-ahli/kawasan') ? navItemActive : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>Kawasan</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Derma */}
          <Link
            href="/admin/donations"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/donations') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Derma' : undefined}
          >
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Derma</span>
          </Link>

          {/* Jadual Kuliah */}
          <Link
            href="/admin/jadual-kuliah"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/jadual-kuliah') || isParentActive('/admin/jadual-kuliah') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Jadual Kuliah' : undefined}
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Jadual Kuliah</span>
          </Link>

          {/* Galeri Aktiviti */}
          <Link
            href="/admin/aktiviti"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/aktiviti') || isParentActive('/admin/aktiviti') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Galeri Aktiviti' : undefined}
          >
            <ImageIcon className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Galeri Aktiviti</span>
          </Link>

          {/* Pengumuman */}
          <Link
            href="/admin/announcements"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/announcements') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Pengumuman' : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Pengumuman</span>
          </Link>

          {/* Notifikasi */}
          <Link
            href="/admin/settings/notifications"
            onClick={handleNavClick}
            className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/settings/notifications') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
            title={collapsed ? 'Notifikasi' : undefined}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Notifikasi</span>
          </Link>

          {/* Pengurusan Admin — super_admin only */}
          {user?.role === 'super_admin' && (
            <Link
              href="/admin/pengurusan-admin"
              onClick={handleNavClick}
              className={`${navItemBase} gap-3 px-3 py-2.5 ${isActive('/admin/pengurusan-admin') ? navItemActive : navItemInactive} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              title={collapsed ? 'Pengurusan Admin' : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Pengurusan Admin</span>
            </Link>
          )}

          {/* Log Keluar */}
          <div className="pt-2 mt-2 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className={`w-full ${navItemBase} gap-3 px-3 py-2.5 text-red-400 hover:bg-red-600/20 hover:text-red-300 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              title={collapsed ? 'Log Keluar' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'lg:hidden' : ''}`}>Log Keluar</span>
            </button>
          </div>
        </nav>

        {/* Desktop collapse toggle */}
        <div className="hidden lg:block border-t border-gray-800 p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-white transition-all text-sm justify-center"
            title={collapsed ? 'Kembangkan' : 'Kecilkan'}
          >
            {collapsed ? (
              <ChevronsRight className="w-5 h-5 flex-shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Kecilkan Menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </>
  );
}
