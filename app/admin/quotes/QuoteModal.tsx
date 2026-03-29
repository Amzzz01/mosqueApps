'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeft, Quote as QuoteIcon, Type, FileText, Tag, CheckSquare, Save, Menu } from 'lucide-react';

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 3 C9 3 7 5 7 7.5 L7 9 L17 9 L17 7.5 C17 5 15 3 12 3 Z" />
      <path d="M5 9 C3.5 9 2.5 10 2.5 11.5 L2.5 13 L7 13 L7 9 Z" />
      <path d="M19 9 C20.5 9 21.5 10 21.5 11.5 L21.5 13 L17 13 L17 9 Z" />
      <rect x="4" y="13" width="16" height="8" rx="0.5" />
      <path d="M10 21 L10 17 C10 15.9 10.9 15 12 15 C13.1 15 14 15.9 14 17 L14 21" />
      <rect x="1" y="11" width="2" height="10" rx="0.5" />
      <path d="M1 11 L1.5 9 L2 11" />
      <rect x="21" y="11" width="2" height="10" rx="0.5" />
      <path d="M21 11 L21.5 9 L22 11" />
      <path d="M12 1.5 C11 1.5 10.3 2.1 10 3 C10.6 2.8 11.3 2.8 12 3 C12.7 2.8 13.4 2.8 14 3 C13.7 2.1 13 1.5 12 1.5 Z" />
    </svg>
  );
}
import toast from 'react-hot-toast';
import { Quote, QUOTE_CATEGORIES, createQuote, updateQuote } from '@/lib/db/quotes';

interface Props {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function QuoteModal({ quote, isOpen, onClose, onSaved }: Props) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<string>('Hadis');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (quote) {
      setText(quote.text);
      setSource(quote.source);
      setCategory(quote.category);
      setIsActive(quote.isActive);
    } else {
      setText('');
      setSource('');
      setCategory('Hadis');
      setIsActive(true);
    }
  }, [isOpen, quote]);

  const handleSave = async () => {
    if (!text.trim()) { toast.error('Sila masukkan teks quote'); return; }
    if (!source.trim()) { toast.error('Sila masukkan sumber'); return; }
    setSaving(true);
    try {
      if (quote) {
        await updateQuote(quote.id!, { text, source, category: category as Quote['category'], isActive });
        toast.success('Quote berjaya dikemaskini');
      } else {
        await createQuote({ text, source, category: category as Quote['category'], isActive });
        toast.success('Quote berjaya ditambah');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Gagal menyimpan quote');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const title = quote ? 'Edit Quote' : 'Tambah Quote Baharu';

  return (
    <>
      {/* ── DESKTOP modal ── */}
      <div className="hidden lg:flex fixed inset-0 bg-black/40 z-50 items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teks Quote <span className="text-red-500">*</span></label>
              <textarea
                rows={4}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Masukkan teks quote..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm italic focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sumber <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="Contoh: Hadis Riwayat Bukhari"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {QUOTE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={e => setIsActive(e.target.value === 'active')}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70"
            >
              {saving ? 'Menyimpan...' : 'Simpan Quote'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE full-screen modal ── */}
      <div className="lg:hidden fixed inset-0 z-50 bg-slate-100 flex flex-col">
        {/* Faux Global Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg flex-shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="p-2 hover:bg-teal-500/30 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <MosqueIcon className="w-7 h-7" />
                <div>
                  <p className="text-white font-bold text-base leading-tight">Al-Falah</p>
                  <p className="text-white/60 text-[9px] leading-tight">Sistem Pengurusan Masjid</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Tambah kata-kata hikmah untuk jemaah</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <QuoteIcon size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Petikan</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Petikan</p>

            {/* Kandungan Quote */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Teks Quote <span className="text-red-400">*</span>
              </label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <QuoteIcon size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea
                  rows={4}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Masukkan teks quote..."
                  className="flex-1 bg-transparent text-sm italic text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0 resize-none"
                />
              </div>
            </div>

            {/* Sumber */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Sumber <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Type size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="Contoh: Hadis Riwayat Bukhari"
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                />
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Kategori
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUOTE_CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`h-10 rounded-xl text-[11px] font-bold border transition-colors ${category === c
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Switch */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Status Quote
              </label>
              <div
                className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 cursor-pointer transition-colors"
                onClick={() => setIsActive(!isActive)}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className={`${isActive ? 'text-teal-500' : 'text-slate-400'} flex-shrink-0`} />
                  <span className="text-sm text-slate-700 font-medium">Aktifkan untuk tatapan awam</span>
                </div>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
