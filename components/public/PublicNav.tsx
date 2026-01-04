// src/components/public/PublicNav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Menu, X, Clock, MessageSquare, Phone } from 'lucide-react';

export default function PublicNav() {
  const [isOpen, setIsOpen] = useState(false);

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

          {/* Desktop Navigation */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-emerald-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
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
          </div>
        )}
      </div>
    </nav>
  );
}