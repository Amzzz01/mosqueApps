// src/app/admin/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ProtectedRoute from '@/components/admin/ProtectedRoute';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}