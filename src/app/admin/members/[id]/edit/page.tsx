// src/app/admin/members/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import MemberForm from '@/components/admin/MemberForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditMemberPage() {
  const params = useParams();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMember();
  }, [params.id]);

  const fetchMember = async () => {
    try {
      const memberDoc = await getDoc(doc(db, 'members', params.id as string));
      if (memberDoc.exists()) {
        setMember({
          id: memberDoc.id,
          ...memberDoc.data(),
          createdAt: memberDoc.data().createdAt?.toDate(),
          dateOfBirth: memberDoc.data().dateOfBirth?.toDate(),
        } as Member);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Memuatkan data ahli...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800">Ahli tidak dijumpai</p>
          <Link href="/admin/members" className="text-red-600 hover:underline mt-2 inline-block">
            Kembali ke senarai ahli
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Ahli</h1>
          <p className="text-gray-600 mt-1">{member.name}</p>
        </div>
      </div>

      {/* Form */}
      <MemberForm member={member} mode="edit" />
    </div>
  );
}