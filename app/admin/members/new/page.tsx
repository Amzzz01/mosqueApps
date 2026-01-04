// src/app/admin/members/new/page.tsx
import MemberForm from '@/components/admin/MemberForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewMemberPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/members"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tambah Ahli Baru</h1>
          <p className="text-gray-600 mt-1">Masukkan maklumat ahli baru</p>
        </div>
      </div>

      {/* Form */}
      <MemberForm mode="create" />
    </div>
  );
}