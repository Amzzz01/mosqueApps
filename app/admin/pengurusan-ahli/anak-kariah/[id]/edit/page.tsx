'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, MapPin, User, CreditCard, Home, Phone, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getAnakKariahById, updateAnakKariah } from '@/lib/anakKariah';
import { getActiveKawasan } from '@/lib/kawasan';
import { useAuth } from '@/contexts/AuthContext';
import { geocodeAddress } from '@/lib/geocoding';
import { findKawasanByPoint } from '@/lib/pointInPolygon';
import { validateIC, autoFormatIC, autoFormatPhone, validatePhoneNumber, getBirthDateFromIC } from '@/lib/validation';
import { Kawasan, Coordinates, AnakKariah } from '@/types/kariah';
import toast from 'react-hot-toast';

const KariahMapViewer = dynamic(
  () => import('@/components/KariahMapViewer'),
  { ssr: false }
);

export default function EditAnakKariahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [autoDetectedKawasan, setAutoDetectedKawasan] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

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
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [member, kawasan] = await Promise.all([
        getAnakKariahById(id),
        getActiveKawasan()
      ]);

      setKawasanList(kawasan);

      if (!member || member.isDeleted) {
        setNotFound(true);
        return;
      }

      // Pre-fill form
      const birthDate = member.tarikhLahir?.toDate
        ? member.tarikhLahir.toDate().toISOString().split('T')[0]
        : '';

      setFormData({
        namaPenuh: member.namaPenuh,
        ic: member.ic,
        alamat: member.alamat,
        kawasanId: member.kawasanId,
        telefon: member.telefon,
        jantina: member.jantina,
        tarikhLahir: birthDate,
        status: member.status || 'aktif',
        catatan: member.catatan || ''
      });

      if (member.coordinates) {
        setUserCoordinates(member.coordinates);
      }
    } catch (error) {
      toast.error('Gagal memuatkan data ahli');
      console.error(error);
    } finally {
      setLoading(false);
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
      setSaving(true);
      const kawasan = kawasanList.find((k) => k.id === formData.kawasanId);

      await updateAnakKariah(id, {
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

      toast.success('Maklumat ahli berjaya dikemas kini');
      router.push('/admin/pengurusan-ahli/anak-kariah');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengemas kini maklumat');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rekod Tidak Ditemui</h2>
          <p className="text-gray-600 mb-6">Ahli kariah ini tidak wujud atau telah dipadam.</p>
          <Link
            href="/admin/pengurusan-ahli/anak-kariah"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Senarai
          </Link>
        </div>
      </div>
    );
  }

  return (
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
          <h1 className="text-3xl font-bold text-gray-900">Edit Anak Kariah</h1>
          <p className="text-gray-600 mt-1">Kemas kini maklumat ahli kariah</p>
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
            <h2 className="text-lg font-semibold text-gray-900 pb-4 border-b">Maklumat Ahli</h2>

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

            {/* Jantina + Tarikh Lahir */}
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
                placeholder="Nota tambahan untuk ahli ini (pilihan)"
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
              disabled={saving}
              className="flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Kemas Kini
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
