'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, AlertCircle, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-[#0d7a6b]">

      {/* TOP HERO */}
      <div className="relative bg-gradient-to-b from-[#0d7a6b] to-[#085048] pt-12 pb-10 px-5 text-center">
        <button
          onClick={() => router.push('/admin/login')}
          className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-3 mt-2">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <p className="text-white text-lg font-semibold">Masjid Al-Falah</p>
        <p className="text-white/60 text-xs mt-1">Tetapkan Semula Kata Laluan</p>
      </div>

      {/* BOTTOM WHITE SHEET */}
      <div className="bg-white rounded-t-3xl -mt-5 flex-1 px-5 pt-6 pb-8">
        <p className="text-base font-semibold text-gray-900">Lupa Kata Laluan?</p>
        <p className="text-xs text-gray-400 mt-1 mb-5">Kami akan hantar pautan reset ke email anda</p>

        {/* Success card — shown above form when success */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center mb-4">
            <CheckCircle className="size-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800">Email Dihantar!</p>
            <p className="text-xs text-gray-500 mt-1">
              Pautan reset telah dihantar ke <span className="font-medium">{email}</span>. Sila semak peti masuk anda.
            </p>
            <button
              onClick={() => { setSuccess(false); setEmail(''); }}
              className="text-xs text-[#0d7a6b] font-medium mt-3"
            >
              Hantar semula email
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
            <AlertCircle className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center leading-relaxed mb-4">
          Masukkan email anda dan kami akan menghantar pautan untuk menetapkan semula kata laluan anda.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Email */}
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
              Email
            </label>
            <div className={`flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 gap-2 ${success ? 'opacity-50' : ''}`}>
              <Mail className="size-4 text-gray-300 flex-shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                placeholder="admin@masjidalfalah.my"
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-semibold mt-5 flex items-center justify-center disabled:opacity-50"
          >
            {loading
              ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Hantar Pautan Reset'
            }
          </button>
        </form>

        {/* Back link */}
        <button
          onClick={() => router.push('/admin/login')}
          className="flex items-center justify-center gap-1.5 mt-4 text-xs text-[#0d7a6b] font-medium w-full"
        >
          <ArrowLeft size={12} />
          Kembali ke Log Masuk
        </button>
      </div>
    </div>
  );
}
