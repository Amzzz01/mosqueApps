// app/admin/layout.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { signOutAdmin } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import FCMProvider from '@/components/FCMProvider';
import { Menu, Building2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

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
                    <Building2 className="w-7 h-7" />
                    <div>
                      <h1 className="text-lg font-bold leading-tight">Masjid Al-Falah</h1>
                      <p className="text-[11px] text-teal-100 leading-tight hidden sm:block">Sistem Pengurusan Masjid</p>
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
