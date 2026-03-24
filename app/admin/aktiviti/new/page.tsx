// app/admin/aktiviti/new/page.tsx
'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, X, Upload, Trash2 } from 'lucide-react';
import { createAktiviti } from '@/lib/aktiviti';
import { uploadFiles, validateFile } from '@/lib/uploadHelpers';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function NewAktivitiPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    tajuk: '',
    keterangan: '',
    tarikh: new Date().toISOString().split('T')[0],
    kategori: 'keagamaan' as 'keagamaan' | 'pendidikan' | 'kemasyarakatan' | 'kebajikan' | 'lain',
    published: false,
  });

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

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrls(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.tajuk.trim() || !formData.keterangan.trim()) {
      toast.error('Sila isi semua medan yang diperlukan');
      return;
    }
    setLoading(true);
    try {
      let gambarUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadProgress('Memuat naik gambar...');
        gambarUrls = await uploadFiles(selectedFiles, 'aktiviti', (fileIdx, percent) => {
          setUploadProgress(`Memuat naik gambar ${fileIdx + 1}/${selectedFiles.length} (${percent}%)`);
        });
      }

      setUploadProgress('Menyimpan ke pangkalan data...');
      await createAktiviti({
        tajuk: formData.tajuk.trim(),
        keterangan: formData.keterangan.trim(),
        tarikh: new Date(formData.tarikh),
        kategori: formData.kategori,
        gambarUrls,
        published: formData.published,
      });
      setUploadProgress('');

      toast.success('Aktiviti berjaya ditambah');
      router.push('/admin/aktiviti');
    } catch (err) {
      console.error('[aktiviti/new] Submit failed:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menambah aktiviti';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/aktiviti" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Aktiviti Baru</h1>
          <p className="text-gray-600 mt-1">Masukkan maklumat aktiviti dan gambar</p>
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
              placeholder="cth: Majlis Maulidur Rasul 2025"
              disabled={loading}
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
              placeholder="Keterangan mengenai aktiviti..."
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              >
                <option value="keagamaan">Keagamaan</option>
                <option value="pendidikan">Pendidikan</option>
                <option value="kemasyarakatan">Kemasyarakatan</option>
                <option value="kebajikan">Kebajikan</option>
                <option value="lain">Lain-lain</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gambar</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Klik untuk memilih gambar</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF (maks 5MB setiap satu)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
                    <Image src={url} alt={`Preview ${i + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                disabled={loading}
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
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? (uploadProgress || 'Menyimpan...') : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
