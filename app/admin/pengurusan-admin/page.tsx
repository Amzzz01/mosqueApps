'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Ban, RotateCcw, Trash2, Shield, Users, UserCheck } from 'lucide-react';
import PermissionModal from './PermissionModal';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
  active: boolean;
  createdAt: any;
  photoURL?: string;
}

export default function PengurusanAdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [filtered, setFiltered] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Redirect non-super_admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'adminUsers'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      const list: AdminUser[] = snap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || '',
          displayName: data.displayName || data.name || 'Admin',
          role: data.role || 'admin',
          active: data.active !== false,
          createdAt: data.createdAt,
          photoURL: data.photoURL,
        };
      });
      setAdminList(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...adminList];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.displayName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term)
      );
    }
    if (roleFilter !== 'all') result = result.filter(a => a.role === roleFilter);
    if (statusFilter !== 'all') result = result.filter(a => statusFilter === 'aktif' ? a.active : !a.active);
    setFiltered(result);
  }, [searchTerm, roleFilter, statusFilter, adminList]);

  const handleToggleActive = async (admin: AdminUser) => {
    try {
      await updateDoc(doc(db, 'adminUsers', admin.uid), { active: !admin.active });
      toast.success(admin.active ? 'Akaun dinonaktifkan' : 'Akaun diaktifkan');
    } catch {
      toast.error('Gagal mengemas kini status');
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'adminUsers', uid));
      toast.success('Admin berjaya dipadam');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Gagal memadam admin');
    }
  };

  const totalAdmins = adminList.length;
  const totalSuperAdmin = adminList.filter(a => a.role === 'super_admin').length;
  const totalActive = adminList.filter(a => a.active).length;

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const Avatar = ({ admin, size = 'sm' }: { admin: AdminUser; size?: 'sm' | 'md' }) => {
    const sz = size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
    const color = admin.role === 'super_admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
    if (admin.photoURL) return <img src={admin.photoURL} alt="" className={`${sz} rounded-full object-cover flex-shrink-0`} />;
    return (
      <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
        {admin.displayName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const RoleBadge = ({ role }: { role: string }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${role === 'super_admin' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
      {role === 'super_admin' ? 'Super Admin' : 'Admin'}
    </span>
  );

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {active ? 'Aktif' : 'Tidak Aktif'}
    </span>
  );

  if (user && user.role !== 'super_admin') return null;

  return (
    <>
      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col min-h-screen bg-slate-100">

        {/* Sticky header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div>
            <p className="text-white font-bold text-sm leading-tight">Pengurusan Admin</p>
            <p className="text-white/60 text-[10px]">{totalAdmins} akaun berdaftar</p>
          </div>
          <Link
            href="/admin/register"
            className="h-8 px-3 bg-white/20 border border-white/30 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus size={13} />
            Tambah
          </Link>
        </div>

        <div className="px-3 py-3 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Jumlah', value: totalAdmins, icon: Users },
              { label: 'Super Admin', value: totalSuperAdmin, icon: Shield },
              { label: 'Aktif', value: totalActive, icon: UserCheck },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl p-2.5 shadow-sm text-center">
                  <p className="text-base font-extrabold text-emerald-600">{s.value}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3 h-10 gap-2 shadow-sm">
            <Search size={13} className="text-slate-300 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 text-xs text-slate-700 placeholder:text-slate-300 bg-transparent outline-none border-0 p-0"
              style={{ WebkitBoxShadow: '0 0 0 1000px white inset', WebkitTextFillColor: '#334155' }}
            />
          </div>

          {/* Admin cards */}
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Tiada admin dijumpai</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(admin => {
                const isSelf = admin.uid === user?.uid;
                return (
                  <div
                    key={admin.uid}
                    className={`bg-white rounded-2xl px-3 py-3 shadow-sm border ${isSelf ? 'bg-emerald-50 border-emerald-200' : 'border-transparent'} ${!admin.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar admin={admin} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-slate-900 truncate">{admin.displayName}</p>
                          {isSelf && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Anda</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-100">
                      <div className="flex gap-1.5">
                        <RoleBadge role={admin.role} />
                        <StatusBadge active={admin.active} />
                      </div>
                      {!isSelf && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setSelectedAdmin(admin); setShowPermissionModal(true); }}
                            className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center"
                          >
                            <Pencil size={11} className="text-emerald-600" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(admin)}
                            className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center"
                          >
                            {admin.active
                              ? <Ban size={11} className="text-slate-500" />
                              : <RotateCcw size={11} className="text-slate-500" />
                            }
                          </button>
                          {!admin.active && admin.role !== 'super_admin' && (
                            <button
                              onClick={() => setShowDeleteConfirm(admin.uid)}
                              className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center"
                            >
                              <Trash2 size={11} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pengurusan Admin</h1>
            <p className="text-gray-500 mt-1">Urus akaun dan kebenaran pentadbir sistem</p>
          </div>
          <Link
            href="/admin/register"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Tambah Admin
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Jumlah Admin', value: totalAdmins, icon: Users, color: 'text-gray-700' },
            { label: 'Super Admin', value: totalSuperAdmin, icon: Shield, color: 'text-emerald-600' },
            { label: 'Akaun Aktif', value: totalActive, icon: UserCheck, color: 'text-green-600' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                <Icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Semua Role</option>
            <option value="super_admin">super_admin</option>
            <option value="admin">admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Tiada admin dijumpai</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarikh Daftar</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(admin => {
                  const isSelf = admin.uid === user?.uid;
                  return (
                    <tr key={admin.uid} className={isSelf ? 'bg-emerald-50' : 'hover:bg-gray-50'}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar admin={admin} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{admin.displayName}</p>
                              {isSelf && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Anda</span>}
                            </div>
                            <p className="text-xs text-gray-500">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><RoleBadge role={admin.role} /></td>
                      <td className="px-5 py-3"><StatusBadge active={admin.active} /></td>
                      <td className="px-5 py-3 text-sm text-gray-500">{formatDate(admin.createdAt)}</td>
                      <td className="px-5 py-3">
                        {isSelf ? (
                          <div className="flex justify-end">
                            <span className="text-xs text-emerald-600 font-semibold">Anda</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => { setSelectedAdmin(admin); setShowPermissionModal(true); }}
                              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit Permission"
                            >
                              <Pencil size={15} className="text-emerald-600" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(admin)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title={admin.active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {admin.active
                                ? <Ban size={15} className="text-gray-500" />
                                : <RotateCcw size={15} className="text-gray-500" />
                              }
                            </button>
                            {!admin.active && admin.role !== 'super_admin' && (
                              <button
                                onClick={() => setShowDeleteConfirm(admin.uid)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Padam"
                              >
                                <Trash2 size={15} className="text-red-500" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Permission Modal */}
      <PermissionModal
        admin={selectedAdmin}
        isOpen={showPermissionModal}
        onClose={() => { setShowPermissionModal(false); setSelectedAdmin(null); }}
      />

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-sm p-5 shadow-xl">
            <p className="text-sm font-semibold text-gray-900 mb-1">Padam Admin?</p>
            <p className="text-xs text-gray-500 mb-4">Tindakan ini tidak boleh dibatalkan.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
