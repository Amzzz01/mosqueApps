// src/app/admin/members/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User, CreditCard } from 'lucide-react';
import { formatICNumber, formatPhoneNumber } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';

export default function MemberDetailPage() {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/members"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
            <p className="text-gray-600 mt-1">Maklumat Ahli</p>
          </div>
        </div>
        <Link
          href={`/admin/members/${member.id}/edit`}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Edit className="h-5 w-5" />
          <span>Edit</span>
        </Link>
      </div>

      {/* Member Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maklumat Peribadi</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nama Penuh</p>
                  <p className="font-medium text-gray-900">{member.name}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">No. Kad Pengenalan</p>
                  <p className="font-medium text-gray-900">{formatICNumber(member.icNumber)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Tarikh Lahir</p>
                  <p className="font-medium text-gray-900">
                    {member.dateOfBirth && format(new Date(member.dateOfBirth), 'dd MMMM yyyy', { locale: ms })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Jantina</p>
                  <p className="font-medium text-gray-900">
                    {member.gender === 'male' ? 'Lelaki' : 'Perempuan'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maklumat Hubungan</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">No. Telefon</p>
                  <p className="font-medium text-gray-900">{formatPhoneNumber(member.phoneNumber)}</p>
                </div>
              </div>

              {member.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{member.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Alamat</p>
                  <p className="font-medium text-gray-900">
                    {member.address}<br />
                    {member.postcode} {member.city}<br />
                    {member.state}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {member.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Catatan</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{member.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                member.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
            </span>
          </div>

          {/* Registration Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maklumat Pendaftaran</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Tarikh Daftar</p>
                <p className="font-medium text-gray-900">
                  {member.createdAt && format(new Date(member.createdAt), 'dd MMM yyyy, HH:mm', { locale: ms })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}