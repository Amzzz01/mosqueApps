// app/admin/aktiviti/[id]/edit/page.tsx
'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, X, Upload, Trash2 } from 'lucide-react';
import { getAktivitiById, updateAktiviti } from '@/lib/aktiviti';
import { uploadFiles, deleteFile, validateFile } from '@/lib/uploadHelpers';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

const toDateStr = (val: Date | Timestamp): string => {
  if (val instanceof Timestamp) return val.toDate().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return new Date(val).toISOString().split('T')[0];
};

export default function EditAktivitiPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    tajuk: '',
    keterangan: '',
    tarikh: '',
    kategori: 'keagamaan' as 'keagamaan' | 'pendidikan' | 'kemasyarakatan' | 'kebajikan' | 'lain',
    published: false,
  });

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Galeri Aktiviti']?.edit) {
      toast.error('Anda tidak mempunyai akses untuk mengedit modul ini');
      router.replace('/admin/aktiviti');
    }
  }, [user, router]);

  useEffect(() => { fetchAktiviti(); }, [params.id]);

  const fetchAktiviti = async () => {
    try {
      const data = await getAktivitiById(params.id as string);
      if (data) {
        setFormData({
          tajuk: data.tajuk || '',
          keterangan: data.keterangan || '',
          tarikh: data.tarikh ? toDateStr(data.tarikh) : '',
          kategori: data.kategori || 'keagamaan',
          published: data.published ?? false,
        });
        setExistingImages(data.gambarUrls || []);
      } else {
        toast.error('Aktiviti tidak dijumpai');
        router.push('/admin/aktiviti');
      }
    } catch {
      toast.error('Gagal memuatkan aktiviti');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate each file before adding
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setNewFiles(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewPreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url));
    setRemovedImages(prev => [...prev, url]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.tajuk.trim() || !formData.keterangan.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    setSaving(true);
    try {
      // Delete removed images from storage
      await Promise.all(removedImages.map(url => deleteFile(url)));

      // Upload new images
      let newUrls: string[] = [];
      if (newFiles.length > 0) {
        setUploadProgress('Memuat naik gambar...');
        newUrls = await uploadFiles(newFiles, 'aktiviti', (fileIdx, percent) => {
          setUploadProgress(`Memuat naik gambar ${fileIdx + 1}/${newFiles.length} (${percent}%)`);
        });
      }

      setUploadProgress('Menyimpan ke pangkalan data...');
      await updateAktiviti(params.id as string, {
        tajuk: formData.tajuk.trim(),
        keterangan: formData.keterangan.trim(),
        tarikh: new Date(formData.tarikh),
        kategori: formData.kategori,
        gambarUrls: [...existingImages, ...newUrls],
        published: formData.published,
      });
      setUploadProgress('');

      toast.success('Aktiviti berjaya dikemaskini');
      router.push('/admin/aktiviti');
    } catch (err) {
      console.error('[aktiviti/edit] Submit failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal mengemaskini aktiviti';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan aktiviti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/aktiviti" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Aktiviti</h1>
          <p className="text-gray-600 mt-1">Kemaskini maklumat aktiviti</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tajuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tajuk"
              value={formData.tajuk}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keterangan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarikh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="tarikh"
                value={formData.tarikh}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={saving}
              >
                <option value="keagamaan">Keagamaan</option>
                <option value="pendidikan">Pendidikan</option>
                <option value="kemasyarakatan">Kemasyarakatan</option>
                <option value="kebajikan">Kebajikan</option>
                <option value="lain">Lain-lain</option>
              </select>
            </div>
          </div>

          {/* Image Management */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Gambar sedia ada:</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                      <Image src={url} alt={`Gambar ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images */}
            {newPreviews.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Gambar baru:</p>
                <div className="grid grid-cols-3 gap-3">
                  {newPreviews.map((url, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-emerald-300">
                      <Image src={url} alt={`Baru ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors cursor-pointer"
            >
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Tambah gambar</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="published"
                name="published"
                type="checkbox"
                checked={formData.published}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                disabled={saving}
              />
            </div>
            <div className="ml-3">
              <label htmlFor="published" className="font-medium text-gray-700">Terbitkan</label>
              <p className="text-sm text-gray-500">Aktiviti yang diterbitkan akan dipaparkan di galeri awam.</p>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/admin/aktiviti"
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
              <span>Batal</span>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? (uploadProgress || 'Menyimpan...') : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
