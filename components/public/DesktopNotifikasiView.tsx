'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bell, Clock, AlertCircle, Check, CheckCheck, Loader2, Trash2, CheckCircle2, Circle } from 'lucide-react';
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

export default function DesktopNotifikasiView() {
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermStatus(getPermissionStatus());
    }
  }, []);

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

  // Exclude notifications deleted by this user
  const visible = useMemo(() => {
    if (!uid) return notifications;
    return notifications.filter(n => !(n.deletedBy || []).includes(uid));
  }, [notifications, uid]);

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

  const isRead = (n: NotifItem) => uid ? (n.readBy || []).includes(uid) : true;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!uid || selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      for (let i = 0; i < ids.length; i += 500) {
        const batch = writeBatch(db);
        ids.slice(i, i + 500).forEach(id => {
          batch.update(doc(db, 'notifications', id), { deletedBy: arrayUnion(uid) });
        });
        await batch.commit();
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

      {/* Tetapan Notifikasi Saya — logged-in users only */}
      {uid && permStatus !== null && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            Tetapan Notifikasi Saya
          </h2>

          {permStatus === 'granted' && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Notifikasi dibenarkan</span>
              </div>
              <button
                onClick={handleDisableNotifications}
                disabled={permLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {permLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Nyahaktifkan
              </button>
            </div>
          )}

          {permStatus === 'default' && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">Notifikasi belum dibenarkan</span>
              </div>
              <button
                onClick={handleEnableNotifications}
                disabled={permLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {permLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Benarkan Notifikasi
              </button>
            </div>
          )}

          {permStatus === 'denied' && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">Notifikasi disekat</span>
              </div>
              <p className="text-xs text-gray-500 pl-4">Sila benarkan notifikasi di tetapan pelayar anda</p>
            </div>
          )}
        </div>
      )}

      {/* Filter + actions */}
      {uid && visible.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex gap-1 bg-white rounded-lg border p-1">
            {([
              { key: 'all' as FilterType, label: 'Semua', count: visible.length },
              { key: 'unread' as FilterType, label: 'Belum Dibaca', count: unreadCount },
              { key: 'read' as FilterType, label: 'Dibaca', count: visible.length - unreadCount },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key); exitSelection(); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && !selectionMode && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Tandai semua dibaca
              </button>
            )}
            {selectionMode ? (
              <>
                {filtered.length > 0 && (
                  <button
                    onClick={() => {
                      const allIds = new Set(filtered.map(n => n.id));
                      setSelectedIds(prev => prev.size === allIds.size ? new Set() : allIds);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-3 py-1.5"
                  >
                    {selectedIds.size === filtered.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={selectedIds.size === 0 || deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-40"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Padam {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </button>
                <button
                  onClick={exitSelection}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Pilih &amp; Padam
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading || authLoading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
          <p className="mt-3 text-gray-500">Memuatkan notifikasi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md mx-auto">
            <Bell className="h-14 w-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'unread' ? 'Semua Telah Dibaca' : 'Tiada Notifikasi'}
            </h2>
            <p className="text-gray-500 text-sm">
              {filter === 'unread'
                ? 'Anda telah membaca semua notifikasi. Syabas!'
                : 'Tiada notifikasi buat masa ini.'}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Lihat semua notifikasi
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {label}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-2.5">
                {items.map((n) => {
                  const read = isRead(n);
                  const selected = selectedIds.has(n.id);
                  return (
                    <div
                      key={n.id}
                      onClick={() => selectionMode && toggleSelect(n.id)}
                      className={`rounded-xl border overflow-hidden transition-all ${
                        selectionMode ? 'cursor-pointer' : ''
                      } ${
                        selected
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                          : read
                            ? 'bg-white border-gray-100'
                            : 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          {/* Selection circle or bell icon */}
                          {selectionMode ? (
                            selected
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              read ? 'bg-gray-100' : 'bg-emerald-200'
                            }`}>
                              <Bell className={`w-5 h-5 ${read ? 'text-gray-400' : 'text-emerald-700'}`} />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`text-sm sm:text-base ${read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                                {n.title}
                              </h3>
                              <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm mt-1 leading-relaxed ${read ? 'text-gray-500' : 'text-gray-600'}`}>
                              {n.body}
                            </p>

                            {!selectionMode && (
                              <div className="flex items-center gap-3 mt-3">
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(n.createdAt)}
                                </span>

                                {uid && !read && (
                                  <button
                                    onClick={() => markAsRead(n.id)}
                                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium ml-auto"
                                  >
                                    <Check className="w-3 h-3" />
                                    Tandai dibaca
                                  </button>
                                )}

                                {uid && read && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                    <CheckCheck className="w-3 h-3" />
                                    Dibaca
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {!selectionMode && n.url && n.url !== '/' && (
                        <a
                          href={n.url}
                          onClick={() => { if (!read) markAsRead(n.id); }}
                          className="block px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                        >
                          Lihat selanjutnya &rarr;
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">
              Aktifkan Notifikasi Push
            </h3>
            <p className="text-gray-600 text-sm">
              Klik ikon loceng di bahagian bawah kanan skrin untuk menerima pemberitahuan terus di peranti anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
