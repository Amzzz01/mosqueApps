import MobileNotifikasiView from '@/components/public/MobileNotifikasiView';
import DesktopNotifikasiView from '@/components/public/DesktopNotifikasiView';
import MobileTopBar from '@/components/public/MobileTopBar';
import { Bell } from 'lucide-react';

export default function NotifikasiPage() {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <MobileNotifikasiView />
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="min-h-screen bg-gray-50">
          <MobileTopBar />
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Notifikasi</h1>
              <p className="text-xl text-emerald-50">Pemberitahuan dan maklumat terkini dari masjid</p>
            </div>
          </div>
          <DesktopNotifikasiView />
        </div>
      </div>
    </>
  );
}
