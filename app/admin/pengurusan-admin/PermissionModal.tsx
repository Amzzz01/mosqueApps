'use client';

import { useEffect, useState } from 'react';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';
import { X, ArrowLeft, Shield, User } from 'lucide-react';
import { Permission, AdminPermissions, ADMIN_MODULES, DEFAULT_PERMISSIONS, FULL_PERMISSIONS } from '@/types/admin-permissions';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin';
  active: boolean;
  createdAt: any;
  photoURL?: string;
}

interface Props {
  admin: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PermissionModal({ admin, isOpen, onClose }: Props) {
  const { user: currentUser } = useAuth();
  const [permissions, setPermissions] = useState<AdminPermissions>({ ...DEFAULT_PERMISSIONS });
  const [savedPermissions, setSavedPermissions] = useState<AdminPermissions>({ ...DEFAULT_PERMISSIONS });
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'admin'>('admin');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !admin) return;
    setSelectedRole(admin.role);
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'adminUsers', admin.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.permissions) {
            const loaded: AdminPermissions = {};
            for (const m of ADMIN_MODULES) {
              loaded[m] = data.permissions[m] ?? { view: true, add: false, edit: false, delete: false };
            }
            setPermissions(loaded);
            setSavedPermissions(loaded);
          } else {
            setPermissions({ ...DEFAULT_PERMISSIONS });
            setSavedPermissions({ ...DEFAULT_PERMISSIONS });
          }
        }
      } catch {
        setPermissions({ ...DEFAULT_PERMISSIONS });
        setSavedPermissions({ ...DEFAULT_PERMISSIONS });
      }
    };
    load();
  }, [isOpen, admin]);

  const handleRoleChange = (role: 'super_admin' | 'admin') => {
    setSelectedRole(role);
    if (role === 'super_admin') {
      setPermissions({ ...FULL_PERMISSIONS });
    } else {
      setPermissions({ ...savedPermissions });
    }
  };

  const togglePerm = (module: string, key: keyof Permission, value: boolean) => {
    if (selectedRole === 'super_admin') return;
    setPermissions(prev => {
      const cur = { ...prev[module] };
      if (key === 'view' && !value) {
        cur.view = false; cur.add = false; cur.edit = false; cur.delete = false;
      } else if ((key === 'add' || key === 'edit' || key === 'delete') && value) {
        cur[key] = true; cur.view = true;
      } else {
        cur[key] = value;
      }
      return { ...prev, [module]: cur };
    });
  };

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    try {
      const payload = { role: selectedRole, permissions };
      console.log('[PermissionModal] Saving to Firestore:', JSON.stringify(payload, null, 2));
      await updateDoc(doc(db, 'adminUsers', admin.uid), payload);
      if (admin.role !== selectedRole) {
        if (selectedRole === 'super_admin') {
          toast.success('Tahap akses dinaiktaraf ke Super Admin');
        } else {
          toast.success('Tahap akses diturunkan ke Admin');
        }
      } else {
        toast.success('Permission berjaya dikemaskini');
      }
      onClose();
    } catch {
      toast.error('Gagal mengemaskini permission');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !admin) return null;

  const initial = (admin.displayName || 'A').charAt(0).toUpperCase();
  const isSelf = currentUser?.uid === admin.uid;
  const isSuper = selectedRole === 'super_admin';

  const allSelected = !isSuper && ADMIN_MODULES.every(
    m => permissions[m]?.view && permissions[m]?.add && permissions[m]?.edit && permissions[m]?.delete
  );

  const handleSelectAll = () => {
    if (selectedRole === 'super_admin') return;
    setPermissions(allSelected ? { ...DEFAULT_PERMISSIONS } : { ...FULL_PERMISSIONS });
  };

  const RoleSelector = () => (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tahap Akses</p>
      {isSelf ? (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Anda tidak boleh mengubah tahap akses sendiri
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRoleChange('super_admin')}
            className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
              selectedRole === 'super_admin'
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedRole === 'super_admin' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs font-semibold ${selectedRole === 'super_admin' ? 'text-emerald-700' : 'text-gray-700'}`}>Super Admin</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Akses penuh ke semua modul</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
              selectedRole === 'admin'
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <User className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedRole === 'admin' ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div>
              <p className={`text-xs font-semibold ${selectedRole === 'admin' ? 'text-emerald-700' : 'text-gray-700'}`}>Admin</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Akses mengikut permission yang ditetapkan</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── DESKTOP modal ── */}
      <div className="hidden lg:flex fixed inset-0 bg-black/40 z-50 items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-xl">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {admin.photoURL ? (
                <img src={admin.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isSuper ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {initial}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{admin.displayName}</p>
                <p className="text-xs text-gray-500">{admin.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
            <RoleSelector />

            {/* Super admin note */}
            {isSuper && !isSelf && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
                Super Admin mempunyai akses penuh ke semua modul — permission tidak boleh diubah
              </p>
            )}

            {/* Permission table */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Permission Modul</p>
              {!isSuper && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  {allSelected ? 'Kosongkan Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Modul</th>
                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">View</th>
                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Add</th>
                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit</th>
                  <th className="text-center py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ADMIN_MODULES.map(m => (
                  <tr key={m} className={isSuper ? 'opacity-50' : ''}>
                    <td className="py-2.5 text-sm text-gray-700">{m}</td>
                    {(['view', 'add', 'edit', 'delete'] as (keyof Permission)[]).map(k => (
                      <td key={k} className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={permissions[m]?.[k] ?? false}
                          onChange={e => togglePerm(m, k, e.target.checked)}
                          disabled={isSuper}
                          className="accent-emerald-600 w-4 h-4 disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE full-screen modal ── */}
      <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 px-4 pt-4 pb-5 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg">
              <ArrowLeft size={16} className="text-white" />
            </button>
            <p className="text-white text-sm font-bold">Edit Permission</p>
          </div>
          <div className="bg-white/15 border border-white/20 rounded-xl px-3 py-2.5 flex items-center gap-3">
            {admin.photoURL ? (
              <img src={admin.photoURL} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initial}</span>
              </div>
            )}
            <div>
              <p className="text-white text-xs font-semibold">{admin.displayName}</p>
              <p className="text-white/60 text-[10px]">{admin.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {/* Role selector */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-700 mb-2.5">Tahap Akses</p>
            {isSelf ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Anda tidak boleh mengubah tahap akses sendiri
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('super_admin')}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'super_admin'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedRole === 'super_admin' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${selectedRole === 'super_admin' ? 'text-emerald-700' : 'text-gray-700'}`}>Super Admin</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Akses penuh ke semua modul</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('admin')}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                    selectedRole === 'admin'
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <User className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedRole === 'admin' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-xs font-semibold ${selectedRole === 'admin' ? 'text-emerald-700' : 'text-gray-700'}`}>Admin</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Akses mengikut permission yang ditetapkan</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Super admin note */}
          {isSuper && !isSelf && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <p className="text-xs text-emerald-700">
                Super Admin mempunyai akses penuh ke semua modul — permission tidak boleh diubah
              </p>
            </div>
          )}

          {/* Select All button */}
          {!isSuper && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              {allSelected ? 'Kosongkan Semua Permission' : 'Pilih Semua Permission'}
            </button>
          )}

          {/* Permission list */}
          {ADMIN_MODULES.map(m => (
            <div key={m} className={`bg-gray-50 rounded-xl px-4 py-3 ${isSuper ? 'opacity-50' : ''}`}>
              <p className="text-xs font-semibold text-gray-700 mb-2.5">{m}</p>
              <div className="flex gap-4 flex-wrap">
                {(['view', 'add', 'edit', 'delete'] as (keyof Permission)[]).map(k => (
                  <label key={k} className={`flex items-center gap-1.5 ${isSuper ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={permissions[m]?.[k] ?? false}
                      onChange={e => togglePerm(m, k, e.target.checked)}
                      disabled={isSuper}
                      className="accent-emerald-600 w-4 h-4 disabled:cursor-not-allowed"
                    />
                    <span className="text-[10px] font-semibold text-gray-500 capitalize">{k}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky bottom */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-2xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan Permission'}
          </button>
        </div>
      </div>
    </>
  );
}
