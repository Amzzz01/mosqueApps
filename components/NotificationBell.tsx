'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, Clock, ChevronRight } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import {
  collection, query, where, orderBy, limit,
  onSnapshot, updateDoc, doc, arrayUnion, Timestamp,
} from 'firebase/firestore';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  readBy?: string[];
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
  if (mins < 60) return `${mins}m lalu`;
  if (hrs < 24) return `${hrs}j lalu`;
  if (days < 7) return `${days}h lalu`;
  return ts.toDate().toLocaleDateString('ms-MY', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // Real-time notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('status', '==', 'sent'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      // Deduplicate by ID (safety net against any duplicate docs)
      const seen = new Set<string>();
      const items: NotifItem[] = [];
      for (const d of snap.docs) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          items.push({ id: d.id, ...d.data() } as NotifItem);
        }
      }
      setNotifications(items);
    }, (err) => {
      console.error('[NotifBell] Subscription error:', err);
    });

    return () => unsub();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const uid = user?.uid || '';
  const unreadCount = uid
    ? notifications.filter(n => !(n.readBy || []).includes(uid)).length
    : 0;
  const recent = notifications.slice(0, 5);

  const markAsRead = async (notifId: string) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        readBy: arrayUnion(uid),
      });
    } catch (err) {
      console.error('[NotifBell] Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!uid) return;
    const unread = notifications.filter(n => !(n.readBy || []).includes(uid));
    await Promise.all(unread.map(n => markAsRead(n.id)));
  };

  // Don't render if not logged in
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-[60] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Tiada notifikasi</p>
              </div>
            ) : (
              recent.map((n) => {
                const isRead = (n.readBy || []).includes(uid);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!isRead) markAsRead(n.id);
                      if (n.url && n.url !== '/') {
                        window.location.href = n.url;
                      }
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      isRead ? 'bg-white' : 'bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {!isRead ? (
                          <span className="block w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="block w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm line-clamp-1 ${isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifikasi"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 px-4 py-2.5 border-t bg-gray-50 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
          >
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
