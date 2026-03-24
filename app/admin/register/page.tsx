'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, User, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft, UserPlus } from 'lucide-react';
import { registerAdmin } from '@/lib/auth';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationKey, setRegistrationKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password.length < 6) {
      setError('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Kata laluan tidak sepadan.');
      return;
    }

    setLoading(true);

    try {
      await registerAdmin(email, password, displayName, registrationKey);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Pendaftaran gagal. Sila cuba lagi.');
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
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <p className="text-white text-lg font-semibold">Masjid Al-Falah</p>
        <p className="text-white/60 text-xs mt-1">Daftar Admin Baharu</p>
      </div>

      {/* BOTTOM WHITE SHEET */}
      <div className="bg-white rounded-t-3xl -mt-5 flex-1 px-5 pt-6 pb-8">
        <p className="text-base font-semibold text-gray-900">Pendaftaran</p>
        <p className="text-xs text-gray-400 mt-1 mb-5">Lengkapkan maklumat di bawah</p>

        {success ? (
          <div className="flex flex-col items-center text-center pt-4">
            <CheckCircle className="size-12 text-green-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-800">Pendaftaran Berjaya!</p>
            <p className="text-sm text-gray-500 text-center mt-1">
              Akaun anda telah didaftarkan. Sila log masuk.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-semibold mt-5 flex items-center justify-center"
            >
              Pergi ke Log Masuk
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 mb-4">
                <AlertCircle className="size-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Nama Penuh */}
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Nama Penuh
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 gap-2">
                  <User className="size-4 text-gray-300 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    placeholder="Nama penuh anda"
                    disabled={loading}
                  />
                </div>
              </div>

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
                    placeholder="admin@masjid.com"
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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    placeholder="Min. 6 aksara"
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

              {/* Sahkan Kata Laluan */}
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Sahkan Kata Laluan
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 gap-2">
                  <Lock className="size-4 text-gray-300 flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    placeholder="Ulang kata laluan"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="flex-shrink-0"
                  >
                    {showConfirmPassword
                      ? <EyeOff className="size-4 text-gray-300" />
                      : <Eye className="size-4 text-gray-300" />
                    }
                  </button>
                </div>
              </div>

              {/* Kunci Pendaftaran */}
              <div>
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1.5 block">
                  Kunci Pendaftaran
                </label>
                <div className="flex items-center bg-amber-50 border border-amber-200 rounded-xl px-3 h-11 gap-2">
                  <KeyRound className="size-4 text-amber-400 flex-shrink-0" />
                  <input
                    type="password"
                    required
                    value={registrationKey}
                    onChange={(e) => setRegistrationKey(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-300"
                    placeholder="Masukkan kunci rahsia"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-semibold mt-5 flex items-center justify-center disabled:opacity-50"
              >
                {loading
                  ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Daftar Akaun'
                }
              </button>
            </form>

            <div className="border-t border-slate-100 my-4" />

            <p className="text-center text-xs text-gray-400">
              Sudah ada akaun?{' '}
              <Link href="/admin/login" className="text-[#0d7a6b] font-medium">
                Log Masuk
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
