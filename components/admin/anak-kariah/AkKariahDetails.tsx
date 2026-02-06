'use client';

import { X, User, CreditCard, Home, Phone, MapPin, Calendar, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { AnakKariah } from '@/types/kariah';
import { formatFirestoreDate, formatFirestoreDateTime } from '@/lib/formatters';

interface AkKariahDetailsProps {
  member: AnakKariah | null;
  isOpen: boolean;
  onClose: () => void;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-4 h-4" />
          Diluluskan
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
          <AlertCircle className="w-4 h-4" />
          Menunggu
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
          <XCircle className="w-4 h-4" />
          Ditolak
        </span>
      );
    default:
      return null;
  }
}

export default function AkKariahDetails({ member, isOpen, onClose }: AkKariahDetailsProps) {
  if (!isOpen || !member) return null;

  const birthDate = member.tarikhLahir && typeof member.tarikhLahir.toDate === 'function'
    ? formatFirestoreDate(member.tarikhLahir)
    : '-';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Maklumat Anak Kariah</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Name + Status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nama Penuh</p>
              <p className="text-xl font-semibold text-gray-900">{member.namaPenuh}</p>
            </div>
            <StatusBadge status={member.status} />
          </div>

          <hr className="border-gray-100" />

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Nombor IC</p>
                <p className="text-sm font-medium text-gray-900">{member.ic}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Telefon</p>
                <p className="text-sm font-medium text-gray-900">{member.telefon}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Jantina</p>
                <p className="text-sm font-medium text-gray-900">{member.jantina}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Tarikh Lahir</p>
                <p className="text-sm font-medium text-gray-900">{birthDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Alamat</p>
                <p className="text-sm font-medium text-gray-900">{member.alamat}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Kawasan</p>
                <p className="text-sm font-medium text-gray-900">{member.kawasanName || '-'}</p>
                {member.detectionMethod === 'auto' && (
                  <p className="text-xs text-teal-600">Dikesan automatik</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Tarikh Daftar</p>
                <p className="text-sm font-medium text-gray-900">
                  {member.createdAt && typeof member.createdAt.toDate === 'function'
                    ? formatFirestoreDateTime(member.createdAt)
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
