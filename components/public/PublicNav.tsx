'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Menu, X, Clock, MessageSquare, Phone, UserRoundCog, Download, Bell } from 'lucide-react';

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (deferredPrompt as any).prompt();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (deferredPrompt as any).userChoice;
      setDeferredPrompt(null);
    } else {
      // Already installed or prompt not available — show manual guide
      setShowInstallGuide(true);
    }
  };

  // 1. Removed Admin Login from here to manage it separately
  const navLinks = [
    { href: '/', label: 'Laman Utama', icon: Building2 },
    { href: '/prayer-times', label: 'Waktu Solat', icon: Clock },
    { href: '/announcements', label: 'Pengumuman', icon: MessageSquare },
    { href: '/contact', label: 'Hubungi Kami', icon: Phone },
  ];

  return (
    <nav className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
            <Building2 className="h-8 w-8" />
            <span className="hidden sm:inline">Masjid Al-Falah</span>
            <span className="sm:hidden">Al-Falah</span>
          </Link>

          {/* Right Side Icons/Menu */}
          <div className="flex items-center space-x-1">
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Notification Bell - Desktop only */}
            <Link
              href="/notifikasi"
              className="hidden md:flex p-2 rounded-lg hover:bg-emerald-700 transition-colors items-center"
              title="Notifikasi"
            >
              <Bell className="h-5 w-5" />
            </Link>

            {/* ADMIN LOGIN BUTTON - Visible on both Mobile and Desktop */}
            <Link
              href="/admin/login"
              className="p-2 md:px-4 md:py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
              title="Admin Login"
            >
              <UserRoundCog className="h-6 w-6 md:h-4 md:w-4" />
              <span className="hidden md:inline text-sm"></span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-emerald-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Install App Button */}
            <button
              onClick={() => { handleInstall(); setIsOpen(false); }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left bg-white/10 hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Muat Turun Aplikasi</span>
            </button>
          </div>
        )}
      </div>

      {/* Install Guide Modal — shown when app is already installed or prompt unavailable */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowInstallGuide(false)}>
          <div className="bg-white text-gray-800 rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Muat Turun Aplikasi</h3>
              <button onClick={() => setShowInstallGuide(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <p className="text-sm text-gray-600">
              Aplikasi ini mungkin sudah dipasang di peranti anda. Jika belum, ikuti langkah berikut:
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Buka laman web ini di <strong>Chrome</strong></span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>Tekan ikon <strong>menu (⋮)</strong> di penjuru kanan atas</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-emerald-100 text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Pilih <strong>&quot;Pasang aplikasi&quot;</strong> atau <strong>&quot;Tambah ke Skrin Utama&quot;</strong></span>
              </div>
            </div>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Faham
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}