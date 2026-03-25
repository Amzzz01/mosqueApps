'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, MapPin, User, UserPlus, CreditCard, Home, Phone, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getActiveKawasan } from '@/lib/kawasan';
import { createAnakKariah } from '@/lib/anakKariah';
import { useAuth } from '@/contexts/AuthContext';
import { geocodeAddress } from '@/lib/geocoding';
import { findKawasanByPoint } from '@/lib/pointInPolygon';
import { validateIC, autoFormatIC, autoFormatPhone, validatePhoneNumber, getBirthDateFromIC } from '@/lib/validation';
import { Kawasan, Coordinates } from '@/types/kariah';
import toast from 'react-hot-toast';

const KariahMapViewer = dynamic(
  () => import('@/components/KariahMapViewer'),
  { ssr: false }
);

export default function TambahAnakKariahPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [autoDetectedKawasan, setAutoDetectedKawasan] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    namaPenuh: '',
    ic: '',
    alamat: '',
    kawasanId: '',
    telefon: '',
    jantina: '' as 'Lelaki' | 'Perempuan' | '',
    tarikhLahir: '',
    status: 'aktif' as 'aktif' | 'tidak_aktif',
    catatan: ''
  });

  useEffect(() => {
    loadKawasan();
  }, []);

  const loadKawasan = async () => {
    try {
      const data = await getActiveKawasan();
      setKawasanList(data);
    } catch (error) {
      console.error('Error loading kawasan:', error);
    }
  };

  const handleAddressChange = async (address: string) => {
    setFormData((prev) => ({ ...prev, alamat: address }));
    setUserCoordinates(null);
    setAutoDetectedKawasan(null);

    if (address.length < 10) return;

    try {
      setDetecting(true);
      const result = await geocodeAddress(address);

      if (result.success && result.coordinates) {
        setUserCoordinates(result.coordinates);
        const detectedKawasanId = findKawasanByPoint(result.coordinates, kawasanList);

        if (detectedKawasanId) {
          setAutoDetectedKawasan(detectedKawasanId);
          setFormData((prev) => ({ ...prev, kawasanId: detectedKawasanId }));
          const kawasan = kawasanList.find((k) => k.id === detectedKawasanId);
          toast.success(`Kawasan dikesan: ${kawasan?.name}`);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setDetecting(false);
    }
  };

  const handleICChange = (ic: string) => {
    const formatted = autoFormatIC(ic);
    setFormData((prev) => ({ ...prev, ic: formatted }));

    if (formatted.replace(/\D/g, '').length === 12) {
      const birthDate = getBirthDateFromIC(formatted);
      if (birthDate) {
        const dateStr = birthDate.toISOString().split('T')[0];
        setFormData((prev) => ({ ...prev, tarikhLahir: dateStr }));
      }
    }
  };

  const handlePhoneChange = (phone: string) => {
    const formatted = autoFormatPhone(phone);
    setFormData((prev) => ({ ...prev, telefon: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateIC(formData.ic)) {
      toast.error('Format nombor IC tidak sah');
      return;
    }
    if (!validatePhoneNumber(formData.telefon)) {
      toast.error('Format nombor telefon tidak sah');
      return;
    }
    if (!formData.jantina) {
      toast.error('Sila pilih jantina');
      return;
    }
    if (!formData.kawasanId) {
      toast.error('Sila pilih kawasan');
      return;
    }

    try {
      setLoading(true);
      const kawasan = kawasanList.find((k) => k.id === formData.kawasanId);

      await createAnakKariah({
        namaPenuh: formData.namaPenuh.trim(),
        ic: formData.ic,
        alamat: formData.alamat.trim(),
        coordinates: userCoordinates,
        kawasanId: formData.kawasanId,
        kawasanName: kawasan?.name || '',
        detectionMethod: autoDetectedKawasan === formData.kawasanId ? 'auto' : 'manual',
        autoDetectedKawasan,
        telefon: formData.telefon,
        jantina: formData.jantina as 'Lelaki' | 'Perempuan',
        tarikhLahir: new Date(formData.tarikhLahir),
        status: formData.status,
        catatan: formData.catatan.trim()
      }, user?.email || 'admin');

      toast.success('Anak kariah berjaya ditambah!');
      router.push('/admin/pengurusan-ahli/anak-kariah');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambah anak kariah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile layout */}
      <div className="lg:hidden flex flex-col bg-slate-100 min-h-screen">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <button
              type="button"
              onClick={() => router.push('/admin/pengurusan-ahli/anak-kariah')}
              className="flex items-center gap-1.5 text-white/65 text-[10px] font-semibold mb-2"
            >
              <ArrowLeft size={11} />
              Kembali ke Senarai
            </button>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Tambah Anak<br />Kariah
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Daftarkan anak kariah baharu</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-3 py-3 text-center flex-shrink-0 ml-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-1">
              <UserPlus size={17} className="text-white" />
            </div>
            <p className="text-white/55 text-[9px]">Baharu</p>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-28 space-y-3">

          {/* Map card */}
          {kawasanList.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <MapPin size={13} className="text-[#0d7a6b]" />
                <p className="text-xs font-bold text-slate-800">Peta Kawasan</p>
              </div>
              <div className="p-2">
                <KariahMapViewer
                  kawasanList={kawasanList}
                  userLocation={userCoordinates}
                  highlightedKawasanId={formData.kawasanId || null}
                  height="200px"
                />
              </div>
            </div>
          )}

          {/* Form card */}
          <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-3">Maklumat Anak Kariah</p>

            {/* Nama Penuh */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Nama Penuh <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <User size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.namaPenuh}
                  onChange={e => setFormData(prev => ({ ...prev, namaPenuh: e.target.value }))}
                  placeholder="Nama penuh anak kariah"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* No IC */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">No. IC <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <CreditCard size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={formData.ic}
                  onChange={e => handleICChange(e.target.value)}
                  placeholder="000000-00-0000"
                  required
                  maxLength={14}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Alamat <span className="text-red-400">*</span></label>
              <div className="flex items-start bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 gap-2 focus-within:border-teal-400 transition-colors">
                <Home size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <textarea
                  value={formData.alamat}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder="Alamat penuh"
                  required
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0 resize-none"
                />
              </div>
            </div>

            {/* Kawasan */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Kawasan <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  value={formData.kawasanId}
                  onChange={e => setFormData(prev => ({ ...prev, kawasanId: e.target.value }))}
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0 appearance-none"
                >
                  <option value="">Pilih kawasan</option>
                  {kawasanList.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Telefon <span className="text-red-400">*</span></label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Phone size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="012-3456789"
                  required
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 border-0 border-none ring-0 focus:ring-0 focus:outline-none p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>

            {/* Jantina */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Jantina <span className="text-red-400">*</span></label>
              <div className="flex gap-3">
                {(['Lelaki', 'Perempuan'] as const).map(j => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, jantina: j }))}
                    className={`flex-1 h-11 rounded-2xl text-xs font-semibold border transition-colors ${
                      formData.jantina === j
                        ? 'bg-[#0d7a6b] text-white border-[#0d7a6b]'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>
            </div>

            {/* Tarikh Lahir */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Tarikh Lahir</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 h-11 gap-2 focus-within:border-teal-400 transition-colors">
                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={formData.tarikhLahir}
                  onChange={e => setFormData(prev => ({ ...prev, tarikhLahir: e.target.value }))}
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none border-0 border-none ring-0 focus:ring-0 p-0"
                  style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155', boxShadow: 'none', border: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 px-4 py-3 flex gap-3 z-20 shadow-lg">
          <button
            type="button"
            onClick={() => router.push('/admin/pengurusan-ahli/anak-kariah')}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 text-sm font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                Simpan Ahli
              </>
            )}
          </button>
        </div>

      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link
                href="/admin/pengurusan-ahli/anak-kariah"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Senarai
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Tambah Anak Kariah</h1>
              <p className="text-gray-600 mt-1">Daftarkan anak kariah baharu</p>
            </div>

            {/* Map */}
            {kawasanList.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Peta Kawasan</h2>
                </div>
                <KariahMapViewer
                  kawasanList={kawasanList}
                  userLocation={userCoordinates}
                  highlightedKawasanId={formData.kawasanId || null}
                  height="350px"
                />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b">Maklumat Anak Kariah</h2>

                {/* Nama Penuh */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4" />
                    Nama Penuh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.namaPenuh}
                    onChange={(e) => setFormData((prev) => ({ ...prev, namaPenuh: e.target.value }))}
                    placeholder="Masukkan nama penuh"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* IC */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <CreditCard className="w-4 h-4" />
                    Nombor IC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ic}
                    onChange={(e) => handleICChange(e.target.value)}
                    placeholder="Contoh: 890101-01-1234"
                    maxLength={14}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Alamat */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Home className="w-4 h-4" />
                    Alamat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    required
                  />
                  {detecting && (
                    <p className="text-sm text-teal-600 mt-1.5 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengesan kawasan...
                    </p>
                  )}
                </div>

                {/* Kawasan */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4" />
                    Kawasan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.kawasanId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kawasanId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Kawasan</option>
                    {kawasanList.map((kawasan) => (
                      <option key={kawasan.id} value={kawasan.id}>
                        {kawasan.name}
                        {autoDetectedKawasan === kawasan.id && ' (Dikesan)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Telefon */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4" />
                    Nombor Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Contoh: 012-3456789"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Jantina + Tarikh Lahir row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Jantina <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.jantina}
                      onChange={(e) => setFormData((prev) => ({ ...prev, jantina: e.target.value as 'Lelaki' | 'Perempuan' }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Jantina</option>
                      <option value="Lelaki">Lelaki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                      <Calendar className="w-4 h-4" />
                      Tarikh Lahir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.tarikhLahir}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tarikhLahir: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({
                      ...prev,
                      status: prev.status === 'aktif' ? 'tidak_aktif' : 'aktif'
                    }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      formData.status === 'aktif' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        formData.status === 'aktif' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="ml-3 text-sm text-gray-600">
                    {formData.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>

                {/* Catatan */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Catatan</label>
                  <textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData((prev) => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Nota tambahan untuk anak kariah ini (pilihan)"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <Link
                  href="/admin/pengurusan-ahli/anak-kariah"
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
