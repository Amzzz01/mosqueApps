'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Loader2, Trash2, CheckCircle2, Circle, X } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { requestNotificationPermission, deleteFCMToken, getPermissionStatus, saveFCMToken } from '@/lib/firebase-messaging';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, arrayUnion, writeBatch, Timestamp,
} from 'firebase/firestore';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  readBy?: string[];
  deletedBy?: string[];
  createdAt?: Timestamp | null;
  url?: string;
}

function timeAgo(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  const now = Date.now();
  const diff = now - ts.toDate().getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Baru sahaja';
  if (mins < 60) return `${mins} minit lalu`;
  if (hrs < 24) return `${hrs} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return ts.toDate().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleDateString('ms-MY', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function groupLabel(ts: Timestamp | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Lain-lain';
  const d = ts.toDate();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notifDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - notifDate.getTime()) / 86400000);
  if (diffDays === 0) return 'Hari Ini';
  if (diffDays === 1) return 'Semalam';
  if (diffDays < 7) return 'Minggu Ini';
  return d.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
}

type FilterType = 'all' | 'unread' | 'read';

export default function MobileNotifikasiView() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [permStatus, setPermStatus] = useState<NotificationPermission | 'unsupported' | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('notif_deleted');
      return stored ? new Set<string>(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermStatus(getPermissionStatus());
    }
  }, []);

  // Persist guest deleted IDs to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('notif_deleted', JSON.stringify(Array.from(localDeletedIds)));
    } catch {}
  }, [localDeletedIds]);

  const handleEnableNotifications = async () => {
    setPermLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        const uid = auth.currentUser?.uid;
        if (uid) await saveFCMToken(uid, token);
      }
      setPermStatus(getPermissionStatus());
    } finally {
      setPermLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setPermLoading(true);
    try {
      await deleteFCMToken();
      setPermStatus(getPermissionStatus());
    } finally {
      setPermLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('status', '==', 'sent'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      const seen = new Set<string>();
      const items: NotifItem[] = [];
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          items.push({ id: d.id, ...d.data() } as NotifItem);
        }
      }
      setNotifications(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const uid = user?.uid || '';

  // Exclude notifications deleted by this user (Firestore for logged-in, local state for guests)
  const visible = useMemo(() => {
    return notifications.filter(n => {
      if (localDeletedIds.has(n.id)) return false;
      if (uid && (n.deletedBy || []).includes(uid)) return false;
      return true;
    });
  }, [notifications, uid, localDeletedIds]);

  const unreadCount = useMemo(() => {
    if (!uid) return 0;
    return visible.filter(n => !(n.readBy || []).includes(uid)).length;
  }, [visible, uid]);

  const filtered = useMemo(() => {
    if (!uid || filter === 'all') return visible;
    if (filter === 'unread') return visible.filter(n => !(n.readBy || []).includes(uid));
    return visible.filter(n => (n.readBy || []).includes(uid));
  }, [visible, uid, filter]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: NotifItem[] }[] = [];
    const labelMap = new Map<string, NotifItem[]>();
    filtered.forEach(n => {
      const label = groupLabel(n.createdAt);
      if (!labelMap.has(label)) {
        labelMap.set(label, []);
        groups.push({ label, items: labelMap.get(label)! });
      }
      labelMap.get(label)!.push(n);
    });
    return groups;
  }, [filtered]);

  const markAsRead = async (notifId: string) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), { readBy: arrayUnion(uid) });
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!uid) return;
    setMarkingAll(true);
    try {
      const unread = visible.filter(n => !(n.readBy || []).includes(uid));
      for (let i = 0; i < unread.length; i += 500) {
        const batch = writeBatch(db);
        unread.slice(i, i + 500).forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { readBy: arrayUnion(uid) });
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      if (uid) {
        // Logged-in: persist to Firestore
        for (let i = 0; i < ids.length; i += 500) {
          const batch = writeBatch(db);
          ids.slice(i, i + 500).forEach(id => {
            batch.update(doc(db, 'notifications', id), { deletedBy: arrayUnion(uid) });
          });
          await batch.commit();
        }
      } else {
        // Guest: hide locally (resets on refresh)
        setLocalDeletedIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => next.add(id));
          return next;
        });
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      console.error('Failed to delete notifications:', err);
    } finally {
      setDeleting(false);
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const isRead = (n: NotifItem) => uid ? (n.readBy || []).includes(uid) : true;

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Memuatkan notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col">

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0d2d3a] to-[#0a1f2e] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
        <div>
          <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
            Notifikasi
          </h1>
          <p className="text-white/60 text-[10px] mt-1">
            {uid ? `${unreadCount} belum dibaca` : 'Pemberitahuan terkini'}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="bg-teal-400/20 border border-teal-400/30 text-teal-300 text-[9px] font-semibold px-2 py-1 rounded-full">
              {visible.length} Notifikasi
            </span>
          </div>
        </div>
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
          <p className="text-teal-400 text-2xl font-extrabold leading-tight">{uid ? unreadCount : visible.length}</p>
          <p className="text-white/50 text-[9px] mt-1">{uid ? 'Belum Dibaca' : 'Jumlah'}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* Permission card — logged-in users only */}
        {uid && permStatus !== null && permStatus !== 'granted' && (
          <div className="mx-3 mt-3 bg-white border border-gray-200 rounded-2xl px-4 py-3">
            {permStatus === 'default' && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600">Notifikasi belum dibenarkan</span>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  disabled={permLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-white bg-[#0d9488] hover:bg-[#0a7a70] rounded-xl transition-colors disabled:opacity-50"
                >
                  {permLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Benarkan
                </button>
              </div>
            )}
            {permStatus === 'denied' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-700 font-semibold">Notifikasi disekat</p>
                  <p className="text-[10px] text-slate-400">Sila benarkan notifikasi di tetapan pelayar anda</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disable notifications option when granted */}
        {uid && permStatus === 'granted' && (
          <div className="mx-3 mt-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0d9488] flex-shrink-0" />
              <span className="text-xs text-slate-600">Notifikasi dibenarkan</span>
            </div>
            <button
              onClick={handleDisableNotifications}
              disabled={permLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-red-500 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {permLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Nyahaktifkan
            </button>
          </div>
        )}

        {/* Filter pills + Pilih button */}
        <div className="bg-white px-4 py-2.5 flex items-center gap-2 border-b border-gray-200 mt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {([
              { key: 'all' as FilterType, label: 'Semua' },
              { key: 'unread' as FilterType, label: 'Belum Dibaca' },
              { key: 'read' as FilterType, label: 'Sudah Dibaca' },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); exitSelection(); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-[#0d2d3a] text-white'
                    : 'bg-gray-100 text-slate-500 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <button
              onClick={() => selectionMode ? exitSelection() : setSelectionMode(true)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                selectionMode
                  ? 'bg-[#0d2d3a] text-white'
                  : 'bg-gray-100 text-slate-500 border border-gray-200'
              }`}
            >
              {selectionMode ? 'Batal' : 'Pilih'}
            </button>
          )}
        </div>

        {/* Action bar when in selection mode */}
        {selectionMode && (
          <div className="px-4 py-2 flex items-center justify-between bg-white border-b border-gray-100">
            <span className="text-[11px] text-slate-400">
              {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : 'Tiada dipilih'}
            </span>
            <div className="flex items-center gap-3">
              {filtered.length > 0 && (
                <button
                  onClick={() => {
                    const allIds = new Set(filtered.map(n => n.id));
                    setSelectedIds(prev =>
                      prev.size === allIds.size ? new Set() : allIds
                    );
                  }}
                  className="text-[11px] text-[#0d9488]"
                >
                  {selectedIds.size === filtered.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mark all as read */}
        {uid && unreadCount > 0 && !selectionMode && (
          <div className="bg-white px-4 py-1.5 border-b border-gray-100">
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-[#0d9488] text-xs disabled:opacity-50"
            >
              {markingAll && <Loader2 className="w-3 h-3 animate-spin" />}
              Tandai semua dibaca
            </button>
          </div>
        )}

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Bell size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-1">
              {filter === 'unread' ? 'Semua Telah Dibaca' : 'Tiada Notifikasi'}
            </p>
            <p className="text-xs text-slate-400 text-center">
              {filter === 'unread'
                ? 'Anda telah membaca semua notifikasi.'
                : 'Tiada notifikasi buat masa ini.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-xs text-[#0d9488] font-semibold"
              >
                Lihat semua notifikasi
              </button>
            )}
          </div>
        ) : (
          <div className="mt-2">
            {grouped.map(({ label, items }) => (
              <div key={label}>
                {/* Group label */}
                <p className="px-4 pt-4 pb-1 text-[10px] font-semibold text-[#0d7a6b] uppercase tracking-widest">
                  {label}
                </p>

                {/* Cards */}
                {items.map(n => {
                  const read = isRead(n);
                  const selected = selectedIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelect(n.id);
                        } else if (!read) {
                          markAsRead(n.id);
                        }
                      }}
                      className={`mx-3 mb-2 rounded-2xl overflow-hidden p-4 transition-all ${
                        selected
                          ? 'bg-teal-50 border border-teal-400/50'
                          : !read
                            ? 'bg-white border border-gray-200 border-l-[3px] border-l-[#0d9488]'
                            : 'bg-[#f8fafc] border border-gray-200 opacity-80'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {selectionMode && (
                            selected
                              ? <CheckCircle2 size={16} className="text-[#0d9488] flex-shrink-0" />
                              : <Circle size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          {!selectionMode && !read && (
                            <span className="w-2 h-2 rounded-full bg-[#0d9488] flex-shrink-0" />
                          )}
                          <p className={`text-sm leading-tight truncate ${read ? 'text-slate-400' : 'font-semibold text-[#0f172a]'}`}>
                            {n.title}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#94a3b8] whitespace-nowrap flex-shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>

                      {/* Body */}
                      <p className="text-[#475569] text-xs mt-1.5 line-clamp-2 leading-relaxed pl-3.5">
                        {n.body}
                      </p>

                      {/* Bottom row */}
                      {!selectionMode && (
                        <div className="flex items-center justify-between mt-2 pl-3.5">
                          <span className="text-[10px] text-[#94a3b8]">{formatDate(n.createdAt)}</span>
                          {uid && !read && (
                            <span className="text-[10px] text-[#0d9488]">Ketik untuk tandai dibaca</span>
                          )}
                        </div>
                      )}

                      {/* Link bar */}
                      {!selectionMode && n.url && n.url !== '/' && (
                        <a
                          href={n.url}
                          onClick={e => { e.stopPropagation(); if (!read) markAsRead(n.id); }}
                          className="block mt-3 -mx-4 -mb-4 px-4 py-2.5 bg-teal-50 border-t border-teal-100 text-[#0d9488] text-xs font-semibold"
                        >
                          Lihat selanjutnya →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed bottom action bar — selection mode */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={exitSelection}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-slate-600 text-sm font-medium"
          >
            <X size={15} />
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0 || deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/80 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            {deleting
              ? <Loader2 size={15} className="animate-spin" />
              : <Trash2 size={15} />
            }
            Padam {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
