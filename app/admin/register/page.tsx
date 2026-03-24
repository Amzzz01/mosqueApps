'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Lock, User, KeyRound, AlertCircle, CheckCircle, Eye, EyeOff, ChevronLeft, UserPlus, Loader2 } from 'lucide-react';
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
          <UserPlus className="w-7 h-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-extrabold text-white mb-1">Daftar Akaun</h1>
        <p className="text-sm text-white/60">Pentadbir baru</p>
      </div>

      {/* WHITE CARD */}
      <div className="bg-white rounded-t-2xl -mt-3 relative flex-1 px-5 pt-5 pb-8">
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
            <h3 className="text-lg font-extrabold text-gray-900">Pendaftaran Berjaya!</h3>
            <p className="text-sm text-gray-400 mt-2 mb-6">
              Akaun anda telah didaftarkan.<br />Sila log masuk untuk meneruskan.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-teal-500/30"
              style={{ background: 'linear-gradient(135deg,#0f766e,#0e7490)' }}
            >
              Pergi ke Log Masuk
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-gray-900 mb-0.5">Buat Akaun</h2>
            <p className="text-xs text-gray-400 mb-5">Isi maklumat pentadbir baru</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nama Penuh</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama penuh anda"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
              </div>

              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@masjid.com"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
              </div>

              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Kata Laluan</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 aksara"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Sahkan Kata Laluan</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-100">
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-gray-400 hover:text-gray-500">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Kunci Pendaftaran</label>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
                <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <input
                  type="password"
                  required
                  value={registrationKey}
                  onChange={(e) => setRegistrationKey(e.target.value)}
                  placeholder="Masukkan kunci rahsia"
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 p-0 text-sm text-slate-700 font-medium placeholder:text-slate-300"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #fffbeb inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0f766e,#0e7490)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftar Akaun'}
              </button>
            </form>

            <div className="border-t border-gray-100 my-5" />
            <p className="text-center text-xs text-gray-400">
              Sudah ada akaun?{' '}
              <Link href="/admin/login" className="text-teal-600 font-semibold">Log Masuk</Link>
            </p>
          </>
        )}
      </div>
    </div>

    {/* ── DESKTOP ── */}
    <div className="hidden lg:flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-full">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Masjid Al-Falah</h1>
          <p className="text-gray-600">Sistem Pengurusan Masjid</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Daftar Admin</h2>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pendaftaran Berjaya!</h3>
              <p className="text-gray-600 mb-6">Akaun anda telah didaftarkan.<br />Sila log masuk untuk meneruskan.</p>
              <button
                onClick={() => router.push('/admin/login')}
                className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Pergi ke Log Masuk
              </button>
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

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="d-displayName" className="block text-sm font-medium text-gray-700 mb-2">Nama Penuh</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="d-displayName"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Nama penuh anda"
                      disabled={loading}
                    />
                  </div>
                </div>

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

                <div>
                  <label htmlFor="d-password" className="block text-sm font-medium text-gray-700 mb-2">Kata Laluan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="d-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Min. 6 aksara"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="d-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Sahkan Kata Laluan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="d-confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ulang kata laluan"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="d-regKey" className="block text-sm font-medium text-gray-700 mb-2">Kunci Pendaftaran</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-amber-500" />
                    </div>
                    <input
                      id="d-regKey"
                      type="password"
                      required
                      value={registrationKey}
                      onChange={(e) => setRegistrationKey(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-amber-50"
                      placeholder="Masukkan kunci rahsia"
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
                      Mendaftar...
                    </span>
                  ) : 'Daftar Akaun'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Sudah ada akaun?{' '}
                  <Link href="/admin/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Log Masuk
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
