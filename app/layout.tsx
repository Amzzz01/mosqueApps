// src/app/layout.tsx (TEMPORARY - No PWA, No 404 Warnings)
// This version removes manifest and icons until you add them
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import PublicNav from '@/components/public/PublicNav';
import { Building2, Phone, MapPin, Mail } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masjid Al-Falah - Sistem Pengurusan Masjid',
  description: 'Sistem pengurusan masjid yang komprehensif untuk Masjid Al-Falah',
  // manifest and icons commented out until you add icon files
  // manifest: '/manifest.json',
  // icons: {
  //   icon: '/icons/icon-192x192.png',
  //   apple: '/icons/icon-192x192.png',
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* Navigation */}
          <PublicNav />

          {/* Main Content */}
          <main className="flex-grow">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white mt-auto">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* About Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                    <h3 className="text-lg font-bold">Masjid Al-Falah</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Sistem pengurusan masjid yang moden untuk komuniti Muslim yang lebih baik.
                  </p>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Hubungi Kami</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">
                        Jalan Masjid Al-Falah,<br />
                        43650 Bandar Baru Bangi,<br />
                        Selangor, Malaysia
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-5 w-5 text-emerald-400" />
                      <span className="text-gray-300">+60 3-8925 xxxx</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-emerald-400" />
                      <span className="text-gray-300">info@masjidalfalah.com</span>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Pautan Pantas</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="/" className="text-gray-300 hover:text-emerald-400 transition-colors">
                        Laman Utama
                      </a>
                    </li>
                    <li>
                      <a href="/prayer-times" className="text-gray-300 hover:text-emerald-400 transition-colors">
                        Waktu Solat
                      </a>
                    </li>
                    <li>
                      <a href="/announcements" className="text-gray-300 hover:text-emerald-400 transition-colors">
                        Pengumuman
                      </a>
                    </li>
                    <li>
                      <a href="/contact" className="text-gray-300 hover:text-emerald-400 transition-colors">
                        Hubungi Kami
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} Masjid Al-Falah. Hak Cipta Terpelihara.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}