'use client';

import { useRef, useState, useEffect } from 'react';
import { updateProfile, updatePassword } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { X, Camera, Eye, EyeOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: Props) {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user?.displayName || '');
      setNewPassword('');
      setConfirmPassword('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setUploading(false);
      setSaving(false);
      setShowPassword(false);
      setShowConfirm(false);
    }
  }, [isOpen, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Saiz gambar tidak boleh melebihi 2MB');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error('Kata laluan tidak sepadan');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('Kata laluan mestilah sekurang-kurangnya 6 aksara');
        return;
      }
    }

    setSaving(true);
    try {
      let photoURL: string | undefined;

      if (photoFile && auth.currentUser) {
        setUploading(true);
        const storageRef = ref(storage, `adminProfiles/${auth.currentUser.uid}/avatar.jpg`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
        setUploading(false);
      }

      if (auth.currentUser) {
        const updates: Record<string, string> = { displayName };
        if (photoURL) updates.photoURL = photoURL;

        await updateDoc(doc(db, 'adminUsers', auth.currentUser.uid), updates);
        await updateProfile(auth.currentUser, {
          displayName,
          ...(photoURL ? { photoURL } : {}),
        });

        if (newPassword) {
          try {
            await updatePassword(auth.currentUser, newPassword);
          } catch (err: any) {
            if (err.code === 'auth/requires-recent-login') {
              toast.error('Sila log masuk semula untuk tukar kata laluan');
            } else {
              throw err;
            }
          }
        }
      }

      await refreshUser();
      toast.success('Profil berjaya dikemaskini');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengemaskini profil');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const avatarSrc = photoPreview || user?.photoURL;
  const initial = (user?.displayName || 'A').charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f2e] border border-white/10 rounded-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#141824] px-4 py-3 flex justify-between items-center border-b border-white/[0.08] rounded-t-xl">
          <p className="text-white text-sm font-semibold">Edit Profil</p>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{initial}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center border-2 border-[#1a1f2e]"
              >
                <Camera size={11} className="text-white" />
              </button>
            </div>
            {photoFile && (
              <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{photoFile.name}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Nama Paparan */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Nama Paparan</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="bg-[#141824] border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              Email <span className="normal-case text-gray-500">(tidak boleh ditukar)</span>
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-500 text-sm w-full cursor-not-allowed focus:outline-none"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Kata Laluan Baharu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Kosongkan jika tidak tukar"
                className="bg-[#141824] border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm w-full focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Sahkan Kata Laluan Baharu</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulang kata laluan baharu"
                className="bg-[#141824] border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm w-full focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#141824] px-4 py-3 border-t border-white/[0.08] flex gap-2 justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="border border-white/15 text-gray-400 px-4 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-70"
          >
            {saving || uploading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
