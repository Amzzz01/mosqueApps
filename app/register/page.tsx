'use client';

import { useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Loader2, ArrowLeft, ChevronDown } from 'lucide-react';

const KariahMapForm = dynamic(() => import('@/components/KariahMapForm'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  )
});

function MosqueSVG() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 18C60 18 38 38 38 52H82C82 38 60 18 60 18Z" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"/>
      <circle cx="60" cy="14" r="4" fill="rgba(255,255,255,0.6)"/>
      <circle cx="62" cy="13" r="3" fill="rgba(16,185,129,0.4)"/>
      <rect x="34" y="52" width="52" height="38" rx="2" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <path d="M52 90V72C52 67.6 55.6 64 60 64C64.4 64 68 67.6 68 72V90" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <path d="M40 62V72C40 72 43 68 46 72V62" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="rgba(255,255,255,0.05)"/>
      <path d="M74 62V72C74 72 77 68 80 72V62" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="rgba(255,255,255,0.05)"/>
      <rect x="20" y="40" width="10" height="50" rx="1" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
      <path d="M25 28C25 28 20 36 20 40H30C30 36 25 28 25 28Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.5)"/>
      <rect x="90" y="40" width="10" height="50" rx="1" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
      <path d="M95 28C95 28 90 36 90 40H100C100 36 95 28 95 28Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
      <circle cx="95" cy="25" r="2" fill="rgba(255,255,255,0.5)"/>
      <rect x="16" y="90" width="88" height="6" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
    </svg>
  );
}

export default function RegisterPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen-safe bg-gradient-to-b from-teal-900 via-emerald-900 to-emerald-950 ios-scroll" style={{ touchAction: 'manipulation' }}>
      {/* Full-page Islamic geometric pattern */}
      <div className="islamic-pattern absolute inset-0 z-0 pointer-events-none" />

      {/* Radial glow accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-teal-400/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10">
        {/* Hero Header */}
        <section className="text-white">
          {/* Back button */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 animate-fade-in-down">
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 text-white/80 hover:text-white transition-all duration-300 text-base font-medium backdrop-blur-sm bg-white/10 hover:bg-white/15 rounded-full px-5 py-2.5 border border-white/15 hover:border-white/30 shadow-lg shadow-black/10"
            >
              <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
              Laman Utama
            </Link>
          </div>

          {/* Hero content */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 md:pt-14 md:pb-14 lg:pt-16 lg:pb-16">
            <div className="flex flex-col items-center text-center">
              {/* Mosque illustration */}
              <div className="animate-scale-in w-20 h-20 md:w-24 md:h-24 mb-6 animate-float">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 backdrop-blur-sm p-3 shadow-2xl shadow-emerald-950/50">
                  <MosqueSVG />
                </div>
              </div>

              {/* Badge */}
              <div className="animate-fade-in-up mb-4" style={{ animationDelay: '0.15s' }}>
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-4 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pendaftaran Terbuka
                </span>
              </div>

              {/* Title */}
              <h1
                className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight"
                style={{ animationDelay: '0.25s' }}
              >
                <span className="block">Daftar Sebagai</span>
                <span className="block mt-1 bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  Anak Kariah
                </span>
              </h1>

              {/* Subtitle */}
              <p
                className="animate-fade-in-up mt-4 md:mt-5 text-emerald-100/70 text-base md:text-lg max-w-2xl leading-relaxed"
                style={{ animationDelay: '0.35s' }}
              >
                Sertai komuniti kariah kami. Isikan maklumat anda dan tandakan lokasi rumah
                anda pada peta untuk pengesanan kawasan secara automatik.
              </p>

              {/* CTA Button */}
              <div className="animate-fade-in-up mt-6 md:mt-8" style={{ animationDelay: '0.45s' }}>
                <button
                  onClick={scrollToForm}
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 px-8 rounded-xl text-base transition-all duration-300 shadow-xl shadow-emerald-900/40 hover:shadow-emerald-800/60 hover:-translate-y-0.5"
                >
                  Daftar Sekarang
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Decorative divider */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
        </div>

        {/* Form Section — wide modal */}
        <section ref={formRef} className="max-w-[1200px] mx-auto px-0 lg:px-4 lg:px-6 lg:px-8 py-0 lg:py-8 md:py-12">
          <div className="animate-fade-in-up lg:bg-white/95 lg:rounded-3xl lg:overflow-hidden lg:shadow-2xl lg:shadow-black/20 lg:border lg:border-white/20">
            <KariahMapForm />
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-emerald-300/40 mt-6 pb-8 px-4">
            Maklumat anda akan dirahsiakan dan hanya digunakan untuk tujuan pengurusan kariah.
          </p>
        </section>
      </div>
    </div>
  );
}
