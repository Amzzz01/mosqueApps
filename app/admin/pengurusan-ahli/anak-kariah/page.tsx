'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2, MapPin, User, CreditCard, Home, Phone, Calendar, CheckCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getActiveKawasan } from '@/lib/kawasan';
import { createAnakKariah } from '@/lib/anakKariah';
import { geocodeAddress } from '@/lib/geocoding';
import { findKawasanByPoint } from '@/lib/pointInPolygon';
import { validateIC, autoFormatIC, autoFormatPhone, validatePhoneNumber, getBirthDateFromIC } from '@/lib/validation';
import { Kawasan, Coordinates } from '@/types/kariah';
import toast from 'react-hot-toast';

// Dynamically import map component (client-side only)
const KariahMapViewer = dynamic(
  () => import('@/components/KariahMapViewer'),
  { ssr: false }
);

export default function PendaftaranAnakKariahPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [autoDetectedKawasan, setAutoDetectedKawasan] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState<{
    namaPenuh: string;
    ic: string;
    alamat: string;
    kawasanId: string;
    telefon: string;
    jantina: 'Lelaki' | 'Perempuan' | '';
    tarikhLahir: string;
  }>({
    namaPenuh: '',
    ic: '',
    alamat: '',
    kawasanId: '',
    telefon: '',
    jantina: '',
    tarikhLahir: ''
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

  // Auto-detect kawasan when address changes
  const handleAddressChange = async (address: string) => {
    setFormData({ ...formData, alamat: address });

    // Reset previous detection
    setUserCoordinates(null);
    setAutoDetectedKawasan(null);

    // Only try to geocode if address is substantial
    if (address.length < 10) return;

    try {
      setDetecting(true);
      const result = await geocodeAddress(address);

      if (result.success && result.coordinates) {
        setUserCoordinates(result.coordinates);

        // Find which kawasan contains these coordinates
        const detectedKawasanId = findKawasanByPoint(
          result.coordinates,
          kawasanList
        );

        if (detectedKawasanId) {
          setAutoDetectedKawasan(detectedKawasanId);
          setFormData((prev) => ({ ...prev, kawasanId: detectedKawasanId }));
          
          const kawasan = kawasanList.find((k) => k.id === detectedKawasanId);
          toast.success(`Kawasan dikesan: ${kawasan?.name}`);
        } else {
          toast.error('Alamat tidak berada dalam mana-mana kawasan');
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setDetecting(false);
    }
  };

  // Auto-fill birth date from IC
  const handleICChange = (ic: string) => {
    const formatted = autoFormatIC(ic);
    setFormData({ ...formData, ic: formatted });

    // Auto-fill birth date if IC is complete
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
    setFormData({ ...formData, telefon: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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

    if (!agreedToTerms) {
      toast.error('Sila bersetuju dengan syarat penggunaan data');
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
        autoDetectedKawasan: autoDetectedKawasan,
        telefon: formData.telefon,
        jantina: formData.jantina as 'Lelaki' | 'Perempuan', // Type assertion here
        tarikhLahir: new Date(formData.tarikhLahir),
        status: 'pending'
      });

      toast.success('Pendaftaran berjaya dihantar!');
      
      // Redirect to success page or home
      setTimeout(() => {
        router.push('/?registered=true');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghantar pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Halaman Utama
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-6xl">🕌</div>
            <div>
              <h1 className="text-3xl font-bold">Pendaftaran Anak Kariah</h1>
              <p className="text-blue-100 mt-1">
                Masjid Al-Falah, Telok Bagan - Sila lengkapkan maklumat di bawah
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Map Section */}
        {kawasanList.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Peta Kawasan Kariah</h2>
            </div>
            <KariahMapViewer
              kawasanList={kawasanList}
              userLocation={userCoordinates}
              highlightedKawasanId={formData.kawasanId || null}
              height="400px"
            />
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 pb-4 border-b">
              Maklumat Pendaftaran
            </h2>

            {/* Nama Penuh */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <User className="w-4 h-4" />
                Nama Penuh <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.namaPenuh}
                onChange={(e) => setFormData({ ...formData, namaPenuh: e.target.value })}
                placeholder="Masukkan nama penuh anda"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Nombor IC */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <CreditCard className="w-4 h-4" />
                Nombor IC <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ic}
                onChange={(e) => handleICChange(e.target.value)}
                placeholder="Contoh: 890101-01-1234"
                maxLength={14}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: YYMMDD-PB-XXXX
              </p>
            </div>

            {/* Alamat */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Home className="w-4 h-4" />
                Alamat <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.alamat}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Masukkan alamat lengkap anda"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
              {detecting && (
                <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengesan kawasan...
                </p>
              )}
            </div>

            {/* Kawasan */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <MapPin className="w-4 h-4" />
                Kawasan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.kawasanId}
                onChange={(e) => setFormData({ ...formData, kawasanId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {autoDetectedKawasan && autoDetectedKawasan !== formData.kawasanId && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Anda telah menukar kawasan dari kawasan yang dikesan
                </p>
              )}
            </div>

            {/* Nombor Telefon */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Phone className="w-4 h-4" />
                Nombor Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.telefon}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Contoh: 012-3456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Jantina */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                Jantina <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.jantina}
                onChange={(e) => setFormData({ ...formData, jantina: e.target.value as 'Lelaki' | 'Perempuan' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Jantina</option>
                <option value="Lelaki">Lelaki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Tarikh Lahir */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <Calendar className="w-4 h-4" />
                Tarikh Lahir <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tarikhLahir}
                onChange={(e) => setFormData({ ...formData, tarikhLahir: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Terms and Conditions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <div className="text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  Saya bersetuju dengan penggunaan data peribadi saya oleh pihak masjid untuk tujuan pengurusan anak kariah dan program-program berkaitan.
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Menghantar...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}