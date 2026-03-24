'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
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
      <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
        <div className="bg-emerald-600 px-4 pt-4 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg">
              <ArrowLeft size={16} className="text-white" />
            </button>
            <p className="text-white text-sm font-bold">{title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Teks Quote <span className="text-red-500">*</span></label>
            <textarea
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Masukkan teks quote..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm italic focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sumber <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="Contoh: Hadis Riwayat Bukhari"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {QUOTE_CATEGORIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    category === c
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                  !isActive ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Tidak Aktif
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-70"
          >
            {saving ? 'Menyimpan...' : 'Simpan Quote'}
          </button>
        </div>
      </div>
    </>
  );
}
