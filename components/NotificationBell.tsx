'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, ChevronRight, X } from 'lucide-react';
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

  // Close on outside click (desktop only — mobile uses backdrop)
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

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(max-width: 639px)');
    if (mq.matches) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
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

  // Not logged in — show plain bell linking to notifikasi page
  if (!user) {
    return (
      <Link
        href="/notifikasi"
        className="relative p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
      </Link>
    );
  }

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
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile backdrop overlay */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Dropdown / Bottom Sheet */}
      {open && (
        <div
          className={[
            // Mobile: fixed bottom sheet, full width
            'fixed bottom-0 left-0 right-0 z-[60]',
            'w-[calc(100vw-0rem)]',
            'rounded-t-2xl',
            'max-h-[80vh]',
            // Desktop: absolute dropdown, positioned right
            'sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2',
            'sm:w-96',
            'sm:rounded-xl',
            'sm:max-h-[600px]',
            // Shared
            'bg-white shadow-2xl sm:shadow-xl border border-gray-200 overflow-hidden',
            'flex flex-col',
            // Animation
            'animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-2 duration-200',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 sm:py-2.5 border-b bg-gray-50 flex-shrink-0">
            <h3 className="font-semibold text-gray-900 text-base sm:text-sm">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">Tandai semua dibaca</span>
                  <span className="sm:hidden">Baca semua</span>
                </button>
              )}
              {/* Close button — mobile only */}
              <button
                onClick={() => setOpen(false)}
                className="sm:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center py-1.5 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {recent.length === 0 ? (
              <div className="py-12 sm:py-10 text-center">
                <Bell className="w-10 h-10 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-base sm:text-sm text-gray-500">Tiada notifikasi</p>
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
                    className={`w-full text-left px-4 py-3 min-h-[60px] border-b last:border-b-0 active:bg-gray-100 sm:hover:bg-gray-50 transition-colors ${
                      isRead ? 'bg-white' : 'bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-2 sm:mt-1.5 flex-shrink-0">
                        <span className={`block w-2.5 h-2.5 sm:w-2 sm:h-2 rounded-full ${
                          !isRead ? 'bg-emerald-500' : 'bg-transparent'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-base sm:text-sm line-clamp-1 ${
                            isRead ? 'text-gray-700' : 'font-semibold text-gray-900'
                          }`}>
                            {n.title}
                          </p>
                          <span className="text-xs sm:text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm sm:text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
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
            className="flex items-center justify-center gap-1 px-4 py-3 sm:py-2.5 border-t bg-gray-50 text-base sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 active:bg-gray-100 sm:hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            Lihat Semua
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
