// src/app/admin/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInAdmin } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInAdmin(email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal log masuk. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d7a6b]">

      {/* TOP HERO */}
      <div className="relative bg-gradient-to-b from-[#0d7a6b] to-[#085048] pt-12 pb-10 px-5 text-center">
        <button
          onClick={() => router.push('/')}
          className="absolute top-5 left-5 w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-3 mt-2">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <p className="text-white text-lg font-semibold">Masjid Al-Falah</p>
        <p className="text-white/60 text-xs mt-1">Panel Pengurusan Admin</p>
      </div>

      {/* BOTTOM WHITE SHEET */}
      <div className="bg-white rounded-t-3xl -mt-5 flex-1 px-5 pt-6 pb-8">
        <p className="text-base font-semibold text-gray-900">Log Masuk</p>
        <p className="text-xs text-gray-400 mt-1 mb-5">Masukkan kelayakan admin anda</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
            <AlertCircle className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email */}
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
              Email
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 gap-2">
              <Mail className="size-4 text-gray-300 flex-shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                placeholder="admin@masjidalfalah.my"
                disabled={loading}
              />
            </div>
          </div>

          {/* Kata Laluan */}
          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
              Kata Laluan
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 gap-2">
              <Lock className="size-4 text-gray-300 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="flex-shrink-0"
              >
                {showPassword
                  ? <EyeOff className="size-4 text-gray-300" />
                  : <Eye className="size-4 text-gray-300" />
                }
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-teal-600"
                disabled={loading}
              />
              <span className="text-xs text-gray-400">Ingat saya</span>
            </label>
            <Link href="/admin/forgot-password" className="text-xs text-[#0d7a6b] font-medium">
              Lupa Kata Laluan?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-semibold mt-5 flex items-center justify-center disabled:opacity-50"
          >
            {loading
              ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Log Masuk'
            }
          </button>
        </form>

        <div className="border-t border-slate-100 my-4" />

        <p className="text-center text-xs text-gray-400">
          Belum ada akaun?{' '}
          <Link href="/admin/register" className="text-[#0d7a6b] font-medium">
            Daftar Admin
          </Link>
        </p>
      </div>
    </div>
  );
}
