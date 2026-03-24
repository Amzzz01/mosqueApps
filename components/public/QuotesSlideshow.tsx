'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllQuotes, Quote } from '@/lib/db/quotes';

const CATEGORY_BADGE: Record<string, { bg: string; color: string }> = {
  'Al-Quran': { bg: 'rgba(16,185,129,0.2)', color: 'rgb(52,211,153)' },
  'Hadis':    { bg: 'rgba(59,130,246,0.2)', color: 'rgb(96,165,250)' },
  'Ulama':    { bg: 'rgba(168,85,247,0.2)', color: 'rgb(196,148,255)' },
  'Umum':     { bg: 'rgba(245,158,11,0.2)', color: 'rgb(251,191,36)' },
};

export default function QuotesSlideshow() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getAllQuotes()
      .then(all => setQuotes(all.filter(q => q.isActive)))
      .catch(() => setQuotes([]));
  }, []);

  const startInterval = useCallback((quotes: Quote[]) => {
    const id = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % quotes.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return id;
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;
    const id = startInterval(quotes);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [quotes, startInterval]);

  const goTo = (index: number) => {
    if (intervalId) clearInterval(intervalId);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 300);
    const id = startInterval(quotes);
    setIntervalId(id);
  };

  const prev = () => goTo((currentIndex - 1 + quotes.length) % quotes.length);
  const next = () => goTo((currentIndex + 1) % quotes.length);

  if (quotes.length === 0) return null;

  const quote = quotes[currentIndex];
  const badge = CATEGORY_BADGE[quote.category] ?? CATEGORY_BADGE['Umum'];

  return (
    <section id="quotes" className="bg-[#1a2332] py-16 lg:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        {/* Category badge */}
        <div className="flex justify-center mb-6">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {quote.category}
          </span>
        </div>

        {/* Quote content */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: isAnimating ? 0 : 1 }}
        >
          {/* Decorative quote mark */}
          <div className="text-6xl text-emerald-500 font-serif leading-none mb-2 select-none">&ldquo;</div>

          {/* Quote text */}
          <p className="text-white italic text-lg sm:text-xl leading-relaxed mb-6">
            {quote.text}
          </p>

          {/* Divider + source */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-white/20" />
            <p className="text-white/60 text-sm font-medium">{quote.source}</p>
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {quotes.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-5 bg-emerald-500' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="w-9 h-9 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
