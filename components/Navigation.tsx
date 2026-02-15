'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRoundCog, Building2, Download } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const navLinks = [
  { href: '/', label: 'Utama' },
  { href: '/announcements', label: 'Pengumuman' },
  { href: '/jadual-kuliah', label: 'Kuliah' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/derma', label: 'Derma' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // PWA install prompt
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
      setShowInstallGuide(true);
    }
  };

  // Detect scroll for backdrop effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md'
          : 'bg-white shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
              <Building2 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-gray-900 text-lg lg:text-xl block">Masjid Al-Falah</span>
              <span className="text-[10px] lg:text-xs text-gray-500 hidden sm:block tracking-wide">Telok Bagan, Butterworth</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-emerald-700 bg-emerald-50 shadow-sm'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Bell + Admin + Hamburger */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Admin Login - Desktop */}
            <Link
              href="/admin/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
            >
              <UserRoundCog className="w-4 h-4" />
              <span>Admin</span>
            </Link>

            {/* Mobile admin icon */}
            <Link
              href="/admin/login"
              className="sm:hidden p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Admin Login"
            >
              <UserRoundCog className="w-5 h-5" />
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 relative">
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current rounded transition-all duration-300 ${
                    mobileOpen ? 'top-[9px] rotate-45' : 'top-[3px]'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[9px] w-5 h-0.5 bg-current rounded transition-all duration-300 ${
                    mobileOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 w-5 h-0.5 bg-current rounded transition-all duration-300 ${
                    mobileOpen ? 'top-[9px] -rotate-45' : 'top-[15px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 top-16 bg-black/40 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(link.href)
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-700'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <hr className="my-3 border-gray-100" />

          {/* PWA Install Button */}
          <button
            onClick={() => { handleInstall(); setMobileOpen(false); }}
            className="flex items-center gap-2.5 px-4 py-3 text-emerald-700 bg-emerald-50 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors w-full text-left"
          >
            <Download className="w-4 h-4" />
            Muat Turun Aplikasi
          </button>

          <Link
            href="/admin/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <UserRoundCog className="w-4 h-4" />
            Admin Login
          </Link>
        </nav>
      </div>
      {/* Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-4" onClick={() => setShowInstallGuide(false)}>
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
    </header>
  );
}
