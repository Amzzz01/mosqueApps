// app/admin/layout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { signOutAdmin } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import FCMProvider from '@/components/FCMProvider';
import { Menu, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

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

const SIDEBAR_KEY = 'admin-sidebar-collapsed';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Mobile drawer state (never persisted)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop collapsed state (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
    setMounted(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    const confirm = window.confirm('Adakah anda pasti untuk log keluar?');
    if (confirm) {
      toast.success('Log keluar berjaya');
      try {
        await signOutAdmin();
      } catch {
        // ignore
      }
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-admin-sidebar', handler);
    return () => window.removeEventListener('toggle-admin-sidebar', handler);
  }, []);

  // Check if current page is a public admin page (no auth required)
  const isPublicAdminPage = pathname === '/admin/login' || pathname === '/admin/forgot-password' || pathname === '/admin/register';

  // If it's a public admin page, don't wrap with ProtectedRoute
  if (isPublicAdminPage) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ProtectedRoute>
        <FCMProvider />
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <AdminSidebar
            collapsed={mounted ? collapsed : false}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onToggleCollapse={toggleCollapse}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg sticky top-0 z-30">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Hamburger - visible on ALL breakpoints */}
                  <button
                    onClick={() => {
                      // Mobile: toggle drawer. Desktop: toggle collapse.
                      if (window.innerWidth < 1024) {
                        setMobileOpen((prev) => !prev);
                      } else {
                        toggleCollapse();
                      }
                    }}
                    className="p-2 hover:bg-teal-500/30 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* Logo & Title */}
                  <div className="flex items-center gap-2.5">
                    <MosqueIcon className="w-7 h-7" />
                    <div>
                      <p className="text-white font-bold text-base leading-tight">Al-Falah</p>
                      <p className="text-white/60 text-[9px] leading-tight">Sistem Pengurusan Masjid</p>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold">Administrator</p>
                    <p className="text-xs text-teal-100">admin@masjid.com</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-500/30 rounded-lg transition-colors"
                    aria-label="Log Keluar"
                    title="Log Keluar"
                  >
                    <LogOut className="w-5 h-5 text-red-200 hover:text-white" />
                  </button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
