// src/app/admin/members/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';
import { Search, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
import { formatICNumber, formatPhoneNumber } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, statusFilter, members]);

  const fetchMembers = async () => {
    try {
      const membersQuery = query(
        collection(db, 'members'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(membersQuery);
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        dateOfBirth: doc.data().dateOfBirth?.toDate(),
      })) as Member[];
      
      setMembers(membersData);
      setFilteredMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Gagal memuatkan data ahli');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.icNumber.includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phoneNumber.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Adakah anda pasti ingin memadam ahli "${name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'members', id));
      toast.success('Ahli berjaya dipadam');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Gagal memadam ahli');
    }
  };

  const exportToCSV = () => {
    const headers = ['Nama', 'No. KP', 'Telefon', 'Email', 'Alamat', 'Status'];
    const rows = filteredMembers.map(member => [
      member.name,
      member.icNumber,
      member.phoneNumber,
      member.email || '-',
      member.address,
      member.status === 'active' ? 'Aktif' : 'Tidak Aktif',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ahli-masjid-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pengurusan Ahli</h1>
          <p className="text-gray-600 mt-1">
            Jumlah: {filteredMembers.length} ahli
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          <Link
            href="/admin/members/new"
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Ahli</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, No. KP, telefon, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. KP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Tiada ahli dijumpai'
                      : 'Belum ada ahli berdaftar'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatICNumber(member.icNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatPhoneNumber(member.phoneNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Lihat"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/admin/members/${member.id}/edit`}
                          className="text-emerald-600 hover:text-emerald-900 p-1"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(member.id!, member.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Padam"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}