'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, ChevronLeft, CheckCircle, KeyRound, Loader2 } from 'lucide-react';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal menghantar email. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* ── MOBILE / PWA ── */}
    <div className="lg:hidden min-h-screen bg-[#0d4f47] flex flex-col">

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(160deg,#0d4f47 0%,#0f766e 50%,#0e7490 100%)' }} className="pt-10 pb-8 px-6 text-center relative">
        <button
          onClick={() => router.push('/admin/login')}
          className="absolute top-4 left-4 w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/20"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="w-14 h-14 bg-white/15 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/25">
          <KeyRound className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-1">Lupa Kata Laluan?</h1>
        <p className="text-sm text-white/60">Kami akan hantar pautan reset ke email anda</p>
      </div>

      {/* WHITE CARD */}
      <div className="bg-white rounded-t-2xl -mt-3 relative flex-1 px-5 pt-5 pb-8">
        <h2 className="text-lg font-extrabold text-gray-900 mb-0.5">Reset Kata Laluan</h2>
        <p className="text-xs text-gray-400 mb-5">Masukkan email yang didaftarkan</p>

        {success ? (
          <>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 mb-5">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700">Email Dihantar!</p>
                <p className="text-xs text-gray-500 mt-0.5">Semak inbox anda dan ikut arahan untuk reset kata laluan.</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30"
              style={{ background: 'linear-gradient(135deg,#0f766e,#0e7490)' }}
            >
              Kembali ke Log Masuk
            </button>
          </>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Alamat Email</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@masjidalfalah.my"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 mb-5">Pautan reset akan dihantar ke email ini</p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0f766e,#0e7490)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hantar Pautan Reset'}
              </button>
            </form>
          </>
        )}

        <button
          onClick={() => router.push('/admin/login')}
          className="flex items-center justify-center gap-1.5 mt-6 text-gray-400 text-xs w-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Kembali ke Log Masuk
        </button>
      </div>
    </div>

    {/* ── DESKTOP ── */}
    <div className="hidden lg:flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-full">
              <KeyRound className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Masjid Al-Falah</h1>
          <p className="text-gray-600">Sistem Pengurusan Masjid</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Lupa Kata Laluan?</h2>
          <p className="text-gray-600 text-sm text-center mb-6">Masukkan email anda untuk menerima pautan reset kata laluan.</p>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-700 mb-1">Email Dihantar!</h3>
                <p className="text-sm text-green-600">
                  Pautan reset telah dihantar ke <strong>{email}</strong>.<br />
                  Sila semak peti masuk anda.
                </p>
              </div>
              <a href="/admin/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                ← Kembali ke Log Masuk
              </a>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">Ralat</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="d-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="d-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="admin@masjidalfalah.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Menghantar...
                    </span>
                  ) : 'Hantar Pautan Reset'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="/admin/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  ← Kembali ke Log Masuk
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
