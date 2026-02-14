'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Menu, X, Clock, MessageSquare, Phone, UserRoundCog, Download } from 'lucide-react';

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
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

            {/* Install App Button — only shown when not already installed */}
            {!isInstalled && (
              <button
                onClick={() => { handleInstall(); setIsOpen(false); }}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left bg-white/10 hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Muat Turun Aplikasi</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}