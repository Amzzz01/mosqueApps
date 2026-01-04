// src/app/admin/announcements/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ArrowLeft, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft' as 'draft' | 'published',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Sila isi semua medan');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Pengumuman berjaya dibuat');
      router.push('/admin/announcements');
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Gagal membuat pengumuman');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/announcements" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buat Pengumuman Baru</h1>
          <p className="text-gray-600 mt-1">Cipta pengumuman untuk jemaah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tajuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Masukkan tajuk pengumuman"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kandungan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Masukkan kandungan pengumuman..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="draft">Draf</option>
              <option value="published">Terbitkan</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">Draf tidak akan kelihatan kepada umum</p>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Link
              href="/admin/announcements"
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
              <span>Batal</span>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}