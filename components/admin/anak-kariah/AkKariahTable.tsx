'use client';

import Link from 'next/link';
import { Eye, Edit, Trash2, Loader2, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { AnakKariah } from '@/types/kariah';
import { formatFirestoreDate } from '@/lib/formatters';

interface AkKariahTableProps {
  members: AnakKariah[];
  deletingId: string | null;
  togglingId: string | null;
  onViewDetails: (member: AnakKariah) => void;
  onDelete: (member: AnakKariah) => void;
  onToggleStatus: (member: AnakKariah) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'aktif') {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Aktif
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      Tidak Aktif
    </span>
  );
}

export default function AkKariahTable({ members, deletingId, togglingId, onViewDetails, onDelete, onToggleStatus, canEdit = true, canDelete = true }: AkKariahTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Tiada Rekod</h3>
        <p className="text-gray-500 text-sm">Tiada anak kariah ditemui berdasarkan carian atau tapisan anda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Nama</th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">IC</th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Alamat</th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Kawasan</th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">Telefon</th>
              <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">Tarikh Daftar</th>
              <th className="text-center py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900 text-sm">{member.namaPenuh}</p>
                  <p className="text-xs text-gray-500">{member.jantina}</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 font-mono">{member.ic}</td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <p className="text-sm text-gray-600 truncate max-w-[200px]" title={member.alamat}>
                    {member.alamat}
                  </p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">{member.kawasanName || '-'}</td>
                <td className="py-3 px-4 text-sm text-gray-700 hidden xl:table-cell">{member.telefon}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onToggleStatus(member)}
                    disabled={togglingId === member.id}
                    className="inline-flex items-center gap-1 group"
                    title={member.status === 'aktif' ? 'Tukar ke Tidak Aktif' : 'Tukar ke Aktif'}
                  >
                    {togglingId === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <StatusBadge status={member.status} />
                    )}
                  </button>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 hidden xl:table-cell">
                  {member.createdAt && typeof member.createdAt.toDate === 'function' ? formatFirestoreDate(member.createdAt) : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onViewDetails(member)}
                      className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Lihat"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <Link
                        href={`/admin/pengurusan-ahli/anak-kariah/${member.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(member)}
                        disabled={deletingId === member.id}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Padam"
                      >
                        {deletingId === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {members.map((member) => (
          <div key={member.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">{member.namaPenuh}</p>
                <p className="text-sm text-gray-500 font-mono">{member.ic}</p>
              </div>
              <button
                onClick={() => onToggleStatus(member)}
                disabled={togglingId === member.id}
                title={member.status === 'aktif' ? 'Tukar ke Tidak Aktif' : 'Tukar ke Aktif'}
              >
                {togglingId === member.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <StatusBadge status={member.status} />
                )}
              </button>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p>{member.kawasanName || '-'}</p>
              <p>{member.telefon}</p>
              <p className="text-xs text-gray-400">
                {member.createdAt && typeof member.createdAt.toDate === 'function' ? formatFirestoreDate(member.createdAt) : '-'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => onViewDetails(member)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Lihat
              </button>
              <Link
                href={`/admin/pengurusan-ahli/anak-kariah/${member.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => onDelete(member)}
                disabled={deletingId === member.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === member.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Padam
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
