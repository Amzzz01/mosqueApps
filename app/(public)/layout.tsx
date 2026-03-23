import Link from 'next/link';
import Navigation from '@/components/Navigation';
import NotificationPermission from '@/components/NotificationPermission';
import FCMProvider from '@/components/FCMProvider';
import MobileBottomNav from '@/components/public/MobileBottomNav';
import { Building2, Phone, MapPin, Mail, Clock, MessageSquare } from 'lucide-react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation - desktop only */}
      <div className="hidden lg:block">
        <Navigation />
      </div>

      {/* Spacer - desktop only */}
      <div className="hidden lg:block h-16 lg:h-[72px]" />

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* FCM token registration + foreground message listener */}
      <FCMProvider />
      {/* Permission prompt UI (bell button) */}
      <NotificationPermission />

      {/* Footer - desktop only */}
      <div className="hidden lg:block mt-auto">
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* About Section */}
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Masjid Al-Falah</h3>
                  <p className="text-xs text-gray-500">Telok Bagan, Butterworth</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sistem pengurusan masjid yang moden untuk komuniti Muslim yang lebih baik.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4 lg:mb-5">Hubungi Kami</h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 leading-relaxed">
                    Jalan Masjid Al-Falah,<br />
                    43650 Bandar Baru Bangi,<br />
                    Selangor, Malaysia
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-gray-400">+60 3-8925 xxxx</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-gray-400">info@masjidalfalah.com</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4 lg:mb-5">Pautan Pantas</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    Laman Utama
                  </Link>
                </li>
                <li>
                  <Link href="/prayer-times" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    Waktu Solat
                  </Link>
                </li>
                <li>
                  <Link href="/announcements" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    Pengumuman
                  </Link>
                </li>
                <li>
                  <Link href="/notifikasi" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    Notifikasi
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-2">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Waktu Operasi */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4 lg:mb-5">Waktu Operasi</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 font-medium">Pejabat Masjid</p>
                    <p className="text-gray-500">Isnin - Jumaat: 9:00 AM - 5:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-300 font-medium">Solat Berjemaah</p>
                    <p className="text-gray-500">5 waktu solat harian</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-10 lg:mt-14 pt-6 lg:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Masjid Al-Falah. Hak Cipta Terpelihara.</p>
            <div className="flex items-center gap-6">
              <Link href="/contact" className="hover:text-emerald-400 transition-colors">
                Hubungi Kami
              </Link>
              <Link href="/admin/login" className="hover:text-emerald-400 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>

      <MobileBottomNav />
    </div>
  );
}
