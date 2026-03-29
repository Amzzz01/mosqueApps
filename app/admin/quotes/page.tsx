'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Pencil, Trash2, Quote as QuoteIcon, BookOpen, BookMarked, Users, Layers, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Quote, QUOTE_CATEGORIES, subscribeToQuotes, toggleQuoteStatus, deleteQuote } from '@/lib/db/quotes';
import QuoteModal from './QuoteModal';

const CATEGORY_COLORS: Record<string, string> = {
  'Al-Quran': 'bg-green-100 text-green-700',
  'Hadis': 'bg-blue-100 text-blue-700',
  'Ulama': 'bg-purple-100 text-purple-700',
  'Umum': 'bg-yellow-100 text-yellow-700',
};

const CATEGORY_MOBILE_COLORS: Record<string, string> = {
  'Al-Quran': 'bg-green-50 text-green-700',
  'Hadis': 'bg-blue-50 text-blue-700',
  'Ulama': 'bg-purple-50 text-purple-700',
  'Umum': 'bg-yellow-50 text-yellow-700',
};

export default function QuotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [quoteList, setQuoteList] = useState<Quote[]>([]);
  const [filtered, setFiltered] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Quotes']?.view) {
      toast.error('Anda tidak mempunyai akses ke modul ini');
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  const canEdit = user?.role === 'super_admin' || user?.permissions?.['Quotes']?.edit === true;
  const canDelete = user?.role === 'super_admin' || user?.permissions?.['Quotes']?.delete === true;

  useEffect(() => {
    const unsub = subscribeToQuotes(quotes => {
      setQuoteList(quotes);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let result = quoteList;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.text.toLowerCase().includes(lower) || q.source.toLowerCase().includes(lower)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(q => q.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(q => statusFilter === 'active' ? q.isActive : !q.isActive);
    }
    setFiltered(result);
  }, [quoteList, searchTerm, categoryFilter, statusFilter]);

  const total = quoteList.length;
  const totalQuran = quoteList.filter(q => q.category === 'Al-Quran').length;
  const totalHadis = quoteList.filter(q => q.category === 'Hadis').length;
  const totalUlama = quoteList.filter(q => q.category === 'Ulama').length;
  const totalUmum = quoteList.filter(q => q.category === 'Umum').length;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Padam quote ini?')) return;
    await deleteQuote(id);
    toast.success('Quote berjaya dipadam');
  };

  const handleToggleStatus = async (quote: Quote) => {
    await toggleQuoteStatus(quote.id!, quote.isActive);
    toast.success(quote.isActive ? 'Quote dinyahaktifkan' : 'Quote diaktifkan');
  };

  return (
    <>
      {/* ── MOBILE ── */}
      <div className="lg:hidden flex flex-col bg-slate-100 min-h-screen">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Senarai Quotes
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Urus kata-kata hikmah jemaah</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <QuoteIcon size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Petikan</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-4">
          {/* Stats 2x2 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
              <BookOpen size={14} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-green-600 font-semibold">Al-Quran</p>
                <p className="text-lg font-bold text-green-700 leading-tight">{totalQuran}</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
              <BookMarked size={14} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-blue-600 font-semibold">Hadis</p>
                <p className="text-lg font-bold text-blue-700 leading-tight">{totalHadis}</p>
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-2">
              <Users size={14} className="text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-purple-600 font-semibold">Ulama</p>
                <p className="text-lg font-bold text-purple-700 leading-tight">{totalUlama}</p>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 flex items-center gap-2">
              <Layers size={14} className="text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-yellow-600 font-semibold">Umum</p>
                <p className="text-lg font-bold text-yellow-700 leading-tight">{totalUmum}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari quote..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {['all', ...QUOTE_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>

          {/* Quote cards */}
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Memuatkan...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <QuoteIcon size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Tiada quotes dijumpai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(quote => (
                <div key={quote.id} className={`bg-white rounded-xl p-3.5 border border-gray-100 ${!quote.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_MOBILE_COLORS[quote.category]}`}>
                      {quote.category}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quote.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {quote.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <p className="text-sm italic text-gray-700 line-clamp-2 mb-2">&ldquo;{quote.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate flex-1 mr-2">{quote.source}</p>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {canEdit && (
                        <button
                          onClick={() => { setEditingQuote(quote); setShowModal(true); }}
                          className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(quote.id!)}
                          className="p-1.5 bg-red-50 text-red-500 rounded-lg"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={() => { setEditingQuote(null); setShowModal(true); }}
          className="fixed bottom-6 right-4 lg:hidden z-30 px-5 h-14 rounded-full bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(13,122,107,0.3)] active:scale-95 transition-transform"
        >
          <Plus size={20} />
          Tambah Quotes
        </button>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pengurusan Quotes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Urus kata-kata hikmah untuk laman awam</p>
          </div>
          <button
            onClick={() => { setEditingQuote(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} />
            Tambah Quote
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-semibold mb-1">Jumlah</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 font-semibold mb-1">Al-Quran</p>
            <p className="text-2xl font-bold text-green-700">{totalQuran}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-1">Hadis</p>
            <p className="text-2xl font-bold text-blue-700">{totalHadis}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-purple-600 font-semibold mb-1">Ulama</p>
            <p className="text-2xl font-bold text-purple-700">{totalUlama}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-xs text-yellow-600 font-semibold mb-1">Umum</p>
            <p className="text-2xl font-bold text-yellow-700">{totalUmum}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari quote atau sumber..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Kategori</option>
            {QUOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Memuatkan quotes...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <QuoteIcon size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Tiada quotes dijumpai</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[42%]">Teks Quote</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[18%]">Sumber</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[13%]">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[13%]">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[14%]">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(quote => (
                  <tr key={quote.id} className={!quote.isActive ? 'opacity-60' : ''}>
                    <td className="px-4 py-3">
                      <p className="italic text-gray-700 line-clamp-2 text-sm">&ldquo;{quote.text}&rdquo;</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-500 text-xs">{quote.source}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[quote.category]}`}>
                        {quote.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(quote)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-70 ${quote.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {quote.isActive ? 'Aktif' : 'Tidak Aktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => { setEditingQuote(quote); setShowModal(true); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(quote.id!)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Padam"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <QuoteModal
        quote={editingQuote}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => {}}
      />
    </>
  );
}
