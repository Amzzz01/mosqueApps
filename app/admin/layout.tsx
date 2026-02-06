// app/admin/layout.tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import { Menu, Building2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  // For all other admin pages, use protected route with sidebar
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar */}
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
          />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg sticky top-0 z-30">
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-teal-700 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  
                  {/* Logo & Title */}
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8" />
                    <div>
                      <h1 className="text-xl font-bold">Masjid Al-Falah</h1>
                      <p className="text-xs text-teal-100">Sistem Pengurusan Masjid</p>
                    </div>
                  </div>
                </div>

                {/* Header Actions (Optional) */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">Administrator</p>
                    <p className="text-xs text-teal-100">admin@masjid.com</p>
                  </div>
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