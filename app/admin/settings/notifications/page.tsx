// app/admin/settings/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft, Bell, Send, History, Settings, Save, Trash2,
  Clock, Eye, AlertCircle, CheckCircle, XCircle, Loader2,
  Calendar, Moon, ShieldCheck, Bug, Smartphone, CheckSquare,
} from 'lucide-react';
import { testNotificationPermissions, sendTestNotification } from '@/lib/notification-debug';
import {
  NotificationSettings, NotificationData, DEFAULT_SETTINGS,
  getNotificationSettings, saveNotificationSettings,
  sendNotification, scheduleNotification,
  subscribeToNotifications, deleteNotification,
  getNotificationStats,
} from '@/lib/notifications';
import { MALAYSIA_ZONES } from '@/lib/api/jakim';
import NotificationPreview from '@/components/admin/NotificationPreview';
import { auth } from '@/lib/firebase/config';
import { requestNotificationPermission, saveFCMToken, getPermissionStatus } from '@/lib/firebase-messaging';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

type TabType = 'settings' | 'send' | 'history';

function formatTimestamp(ts: Date | Timestamp | null | undefined): string {
  if (!ts) return '-';
  const date = typeof (ts as Timestamp).toDate === 'function'
    ? (ts as Timestamp).toDate()
    : new Date(ts as unknown as string);
  return date.toLocaleString('ms-MY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function recipientLabel(type: string): string {
  const map: Record<string, string> = {
    all: 'Semua Pengguna',
    members: 'Ahli Aktif',
    sponsors: 'Penaja Anak Kariah',
    donors: 'Penderma',
    specific: 'Pengguna Tertentu',
  };
  return map[type] || type;
}

function statusBadge(status: string) {
  switch (status) {
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" /> Dihantar
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" /> Gagal
        </span>
      );
    case 'scheduled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
          <Clock className="w-3 h-3" /> Dijadualkan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">
          <Loader2 className="w-3 h-3" /> Menunggu
        </span>
      );
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  // ─── Settings State ───
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ─── Cleanup State ───
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    totalScanned: number; valid: number; invalid: number; deleted: number;
  } | null>(null);

  // ─── Debug State ───
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    supported: boolean;
    permission: NotificationPermission | 'unsupported';
    serviceWorkerReady: boolean;
    pushManagerAvailable: boolean;
    details: string[];
  } | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // ─── Send State ───
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [topic, setTopic] = useState('');
  const [sendUrl, setSendUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // ─── History State ───
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, scheduled: 0, totalDelivered: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && !user.permissions?.['Notifikasi']?.view) {
      toast.error('Anda tidak mempunyai akses ke modul ini');
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  // ─── Load Settings ───
  useEffect(() => {
    getNotificationSettings()
      .then(setSettings)
      .catch(() => toast.error('Gagal memuatkan tetapan'))
      .finally(() => setSettingsLoading(false));
  }, []);

  // ─── Subscribe to History ───
  useEffect(() => {
    const unsub = subscribeToNotifications((list) => {
      setNotifications(list);
      setHistoryLoading(false);
    });
    getNotificationStats().then(setStats).catch(() => {});
    return () => unsub();
  }, []);

  // ─── Settings Handlers ───
  const updateSetting = <K extends keyof NotificationSettings>(
    key: K, value: NotificationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await saveNotificationSettings(settings);
      toast.success('Tetapan berjaya disimpan');
    } catch {
      toast.error('Gagal menyimpan tetapan');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ─── Cleanup Handler ───
  const handleCleanup = async () => {
    if (!confirm('Imbas dan padam semua token notifikasi yang tidak sah?')) return;
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/notifications/cleanup');
      const data = await res.json();
      if (res.ok) {
        setCleanupResult(data);
        if (data.deleted > 0) {
          toast.success(`Pembersihan selesai: ${data.deleted} token tidak sah dipadam daripada ${data.totalScanned} diimbas`);
        } else {
          toast.success(`Semua ${data.valid} token adalah sah. Tiada yang perlu dipadam.`);
        }
      } else {
        toast.error(data.error || 'Gagal membersihkan token');
      }
    } catch {
      toast.error('Gagal menghubungi pelayan');
    } finally {
      setCleaning(false);
    }
  };

  // ─── Debug Handlers ───
  const handleDebug = async () => {
    setDebugLoading(true);
    try {
      const info = await testNotificationPermissions();
      setDebugInfo(info);
      setShowDebug(true);
    } catch {
      toast.error('Gagal menjalankan diagnostik');
    } finally {
      setDebugLoading(false);
    }
  };

  const handleTestNotification = async () => {
    const { success, logs } = await sendTestNotification();
    console.log('[TestNotif]', logs.join('\n'));
    if (success) {
      toast.success('Notifikasi ujian berjaya dihantar');
    } else {
      const reason = logs.findLast((l) => l.startsWith('✗')) ?? logs.at(-1) ?? '';
      toast.error(`Gagal: ${reason}`, { duration: 6000 });
    }
  };

  // ─── Ensure this device has notification permission + FCM token ───
  const ensureNotificationSetup = async (): Promise<boolean> => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast.error('Sila log masuk terlebih dahulu');
      return false;
    }

    // Check/request permission
    const permission = getPermissionStatus();
    if (permission === 'denied') {
      toast.error('Notifikasi disekat oleh pelayar. Sila benarkan di tetapan pelayar.', { duration: 6000 });
      return false;
    }

    if (permission !== 'granted') {
      console.log('[Send] Requesting notification permission...');
      const token = await requestNotificationPermission();
      if (!token) {
        toast.error('Kebenaran notifikasi diperlukan untuk menghantar notifikasi ujian.', { duration: 5000 });
        return false;
      }
      await saveFCMToken(uid, token);
      console.log('[Send] FCM token registered for admin device');
    }

    return true;
  };

  // ─── Send Handlers ───
  const handleSend = async () => {
    if (!sendTitle.trim() || !sendBody.trim()) {
      toast.error('Sila isi tajuk dan kandungan');
      return;
    }

    const uid = auth.currentUser?.uid || 'admin';
    setSending(true);

    try {
      // Ensure at least this device can receive notifications
      await ensureNotificationSetup();

      if (isScheduled && scheduledDateTime) {
        const id = await scheduleNotification({
          title: sendTitle.trim(),
          body: sendBody.trim(),
          recipientType,
          scheduledFor: new Date(scheduledDateTime),
          url: sendUrl.trim() || '/',
          createdBy: uid,
        });
        toast.success(`Notifikasi dijadualkan (ID: ${id.slice(0, 6)}...)`);
      } else {
        console.log('[Send] Sending notification now...');
        const result = await sendNotification({
          title: sendTitle.trim(),
          body: sendBody.trim(),
          recipientType,
          topic: topic || undefined,
          url: sendUrl.trim() || '/',
          createdBy: uid,
        });
        console.log('[Send] Result:', JSON.stringify(result));
        const total = result.sent + (result.failed || 0);
        if (total === 0) {
          toast.error('Tiada peranti berdaftar untuk menerima notifikasi. Pastikan pengguna telah membenarkan notifikasi.', { duration: 6000 });
        } else if (result.sent === 0) {
          toast.error(`Gagal menghantar ke semua ${total} peranti. ${result.cleaned || 0} token tidak sah dipadam.`, { duration: 6000 });
        } else {
          const parts: string[] = [];
          parts.push(`${result.sent}/${total} berjaya`);
          if (result.failed > 0) parts.push(`${result.failed} gagal`);
          if (result.cleaned > 0) parts.push(`${result.cleaned} token tidak sah dipadam`);
          toast.success(`Notifikasi dihantar: ${parts.join(', ')}`, { duration: 5000 });
        }
      }

      // Reset form
      setSendTitle('');
      setSendBody('');
      setRecipientType('all');
      setTopic('');
      setSendUrl('');
      setIsScheduled(false);
      setScheduledDateTime('');
      setShowPreview(false);

      // Refresh stats
      getNotificationStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('[Send] Error:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal menghantar notifikasi');
    } finally {
      setSending(false);
    }
  };

  // ─── History Handlers ───
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Padam notifikasi "${title}"?`)) return;
    try {
      await deleteNotification(id);
      toast.success('Notifikasi berjaya dipadam');
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      getNotificationStats().then(setStats).catch(() => {});
    } catch {
      toast.error('Gagal memadam notifikasi');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id!)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Padam ${selectedIds.size} notifikasi yang dipilih?`)) return;
    setDeleting(true);
    let deleted = 0;
    for (const id of selectedIds) {
      try {
        await deleteNotification(id);
        deleted++;
      } catch { /* continue */ }
    }
    setSelectedIds(new Set());
    setDeleting(false);
    toast.success(`${deleted} notifikasi berjaya dipadam`);
    getNotificationStats().then(setStats).catch(() => {});
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'Tetapan', icon: <Settings className="w-4 h-4" /> },
    { key: 'send', label: 'Hantar', icon: <Send className="w-4 h-4" /> },
    { key: 'history', label: 'Sejarah', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* ═══════════════════════════════════════ */}
      {/* MOBILE LAYOUT — lg:hidden              */}
      {/* ═══════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col bg-slate-100 min-h-screen">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d7a6b] to-[#0a9e87] px-4 pt-4 pb-5 flex items-end justify-between flex-shrink-0">
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
              Notifikasi
            </h1>
            <p className="text-white/60 text-[10px] mt-1">Tetapan &amp; penghantaran</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-green-400/20 border border-green-400/30 text-green-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {stats.sent} Dihantar
              </span>
              <span className="bg-red-400/20 border border-red-400/30 text-red-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {stats.failed} Gagal
              </span>
              <span className="bg-blue-400/20 border border-blue-400/30 text-blue-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                {stats.scheduled} Dijadual
              </span>
            </div>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
            <p className="text-white text-2xl font-extrabold leading-tight">{stats.total}</p>
            <p className="text-white/55 text-[9px] mt-1">Jumlah</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-200/80 mx-3 mt-3 rounded-xl p-1 gap-1 flex-shrink-0">
          {([
            { key: 'settings', label: 'Tetapan', icon: <Settings size={11} /> },
            { key: 'send', label: 'Hantar', icon: <Send size={11} /> },
            { key: 'history', label: 'Sejarah', icon: <History size={11} /> },
          ] as { key: TabType; label: string; icon: React.ReactNode }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 h-8 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-[#0d7a6b] shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 pb-24 space-y-3">

          {/* ══════════ TETAPAN TAB ══════════ */}
          {activeTab === 'settings' && (
            <>
              {settingsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-[#0d7a6b] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Auto notifications */}
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Kawalan Broadcast Automatik (Sistem)</p>
                  <div className="bg-white rounded-2xl px-4 py-1 shadow-sm divide-y divide-slate-100">
                    {[
                      { key: 'prayerNotifications' as keyof NotificationSettings, label: 'Waktu Solat', sub: 'Hantar ringkasan solat harian' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                        </div>
                        <button
                          onClick={() => updateSetting(item.key, !settings[item.key])}
                          className={`w-10 h-6 rounded-full flex items-center transition-colors px-0.5 flex-shrink-0 ${
                            settings[item.key] ? 'bg-[#0d7a6b] justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Quiet hours */}
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Waktu Senyap</p>
                  <div className="bg-white rounded-2xl px-4 py-1 shadow-sm divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Aktifkan Waktu Senyap</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Jangan hantar notifikasi pada waktu ini</p>
                      </div>
                      <button
                        onClick={() => updateSetting('quietHoursEnabled', !settings.quietHoursEnabled)}
                        className={`w-10 h-6 rounded-full flex items-center transition-colors px-0.5 flex-shrink-0 ${
                          settings.quietHoursEnabled ? 'bg-[#0d7a6b] justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
                      </button>
                    </div>
                    {settings.quietHoursEnabled && (
                      <div className="py-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Mula</label>
                          <input
                            type="time"
                            value={settings.quietHoursStart || '22:00'}
                            onChange={e => updateSetting('quietHoursStart', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Tamat</label>
                          <input
                            type="time"
                            value={settings.quietHoursEnd || '06:00'}
                            onChange={e => updateSetting('quietHoursEnd', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prayer zone */}
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zon Waktu Solat</p>
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Zon Semasa</label>
                    <select
                      value={settings.prayerZone || 'KDH01'}
                      onChange={e => updateSetting('prayerZone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none"
                    >
                      {Object.entries(MALAYSIA_ZONES).map(([state, zones]) => (
                        <optgroup key={state} label={state}>
                          {Object.entries(zones).map(([code, label]) => (
                            <option key={code} value={code}>{code} — {label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={15} />
                        Simpan Tetapan
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 italic text-center px-2">
                    Tetapan ini mengawal notifikasi yang dihantar secara automatik kepada semua pengguna. Pengguna boleh mengurus kebenaran notifikasi masing-masing di telefon mereka.
                  </p>
                </>
              )}
            </>
          )}

          {/* ══════════ HANTAR TAB ══════════ */}
          {activeTab === 'send' && (
            <>
              <div className="bg-white rounded-2xl px-4 py-4 shadow-sm space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Tajuk</label>
                  <input
                    type="text"
                    placeholder="Tajuk notifikasi..."
                    value={sendTitle}
                    onChange={e => setSendTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:border-teal-400 transition-colors"
                    style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                  />
                </div>
                {/* Body */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Kandungan</label>
                  <textarea
                    placeholder="Kandungan notifikasi..."
                    value={sendBody}
                    onChange={e => setSendBody(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:border-teal-400 transition-colors resize-none"
                  />
                </div>
                {/* Recipient */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Penerima</label>
                  <select
                    value={recipientType}
                    onChange={e => setRecipientType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none"
                  >
                    <option value="all">Semua Pengguna</option>
                    <option value="members">Ahli Aktif</option>
                    <option value="donors">Penderma</option>
                  </select>
                </div>
                {/* URL */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">URL (opsional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={sendUrl}
                    onChange={e => setSendUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none placeholder:text-slate-300"
                    style={{ WebkitBoxShadow: '0 0 0 1000px #f8fafc inset', WebkitTextFillColor: '#334155' }}
                  />
                </div>
                {/* Schedule toggle */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Jadualkan</p>
                    <p className="text-[10px] text-slate-400">Hantar pada masa tertentu</p>
                  </div>
                  <button
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={`w-10 h-6 rounded-full flex items-center transition-colors px-0.5 flex-shrink-0 ${
                      isScheduled ? 'bg-[#0d7a6b] justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 bg-white rounded-full shadow-sm block" />
                  </button>
                </div>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={e => setScheduledDateTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs text-slate-700 outline-none"
                  />
                )}
              </div>

              {/* Preview */}
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">Pratonton</p>
                <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0d7a6b] flex items-center justify-center flex-shrink-0">
                    <Bell size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sendTitle || 'Tajuk Notifikasi'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{sendBody || 'Kandungan notifikasi akan dipaparkan di sini.'}</p>
                  </div>
                </div>
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#0d7a6b] to-[#085048] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={15} />
                    {isScheduled ? 'Jadualkan' : 'Hantar Sekarang'}
                  </>
                )}
              </button>
            </>
          )}

          {/* ══════════ SEJARAH TAB ══════════ */}
          {activeTab === 'history' && (
            <>
              {/* Mini stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Jumlah', value: stats.total, color: 'text-slate-900' },
                  { label: 'Dihantar', value: stats.sent, color: 'text-green-600' },
                  { label: 'Gagal', value: stats.failed, color: 'text-red-600' },
                  { label: 'Dijadual', value: stats.scheduled, color: 'text-blue-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl py-2.5 text-center shadow-sm">
                    <p className={`text-base font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bulk delete bar */}
              {selectedIds.size > 0 && (
                <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <span className="text-xs text-slate-600 font-semibold">{selectedIds.size} dipilih</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    {deleting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 size={12} />}
                    Padam
                  </button>
                </div>
              )}

              {/* Notification history cards */}
              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-[#0d7a6b] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                  <History size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Tiada notifikasi lagi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`bg-white rounded-2xl px-3 py-3 shadow-sm ${selectedIds.has(n.id!) ? 'ring-2 ring-teal-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <label className="flex items-start gap-2 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(n.id!)}
                            onChange={() => toggleSelect(n.id!)}
                            className="mt-0.5 h-3.5 w-3.5 rounded accent-teal-600 flex-shrink-0"
                          />
                          <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                        </label>
                        <button
                          onClick={() => handleDelete(n.id!, n.title)}
                          className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"
                        >
                          <Trash2 size={11} className="text-red-500" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mb-2 line-clamp-2 pl-5">{n.body}</p>
                      <div className="flex items-center gap-2 flex-wrap pl-5">
                        {statusBadge(n.status)}
                        <span className="h-5 px-2 rounded-full text-[9px] font-semibold bg-slate-50 text-slate-500 flex items-center">
                          {recipientLabel(n.recipientType)}
                        </span>
                        <span className="text-[9px] text-slate-300 ml-auto">{formatTimestamp(n.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — hidden lg:block       */}
      {/* ═══════════════════════════════════════ */}
      <div className="hidden lg:block">
      <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengurusan Notifikasi</h1>
          <p className="text-gray-600 mt-1">Tetapan, hantar, dan lihat sejarah notifikasi</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Jumlah</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Dihantar</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gagal</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Peranti Dicapai</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalDelivered}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ SETTINGS TAB ═══════════════ */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {settingsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
              <p className="mt-3 text-gray-500">Memuatkan tetapan...</p>
            </div>
          ) : (
            <>
              {/* Section label */}
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Kawalan Broadcast Automatik (Sistem)</h2>
              </div>

              {/* Prayer Notifications */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  Notifikasi Waktu Solat
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Aktifkan peringatan solat</p>
                    <p className="text-xs text-gray-500">Hantar notifikasi sebelum waktu solat</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('prayerNotifications', !settings.prayerNotifications)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.prayerNotifications ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      settings.prayerNotifications ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                {settings.prayerNotifications && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Minit sebelum waktu solat</label>
                      <input
                        type="number"
                        value={settings.prayerReminderMinutes}
                        onChange={e => updateSetting('prayerReminderMinutes', Number(e.target.value))}
                        min={5}
                        max={60}
                        className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Zon Waktu Solat (JAKIM)</label>
                      <select
                        value={settings.prayerZone ?? 'KDH01'}
                        onChange={e => updateSetting('prayerZone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      >
                        {Object.entries(MALAYSIA_ZONES).map(([state, zones]) => (
                          <optgroup key={state} label={state}>
                            {Object.entries(zones).map(([code, label]) => (
                              <option key={code} value={code}>{code} — {label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Event Notifications */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Notifikasi Aktiviti
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Peringatan aktiviti</p>
                    <p className="text-xs text-gray-500">Hantar peringatan sebelum aktiviti bermula</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('eventNotifications', !settings.eventNotifications)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.eventNotifications ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      settings.eventNotifications ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                {settings.eventNotifications && (
                  <div className="pl-4 border-l-2 border-emerald-200 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.eventReminder1Day}
                        onChange={e => updateSetting('eventReminder1Day', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Peringatan 1 hari sebelum</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Donation Reminder */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-emerald-600" />
                  Peringatan Derma
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Peringatan derma bulanan</p>
                    <p className="text-xs text-gray-500">Ingatkan penderma tentang sumbangan bulanan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('donationReminder', !settings.donationReminder)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.donationReminder ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      settings.donationReminder ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                {settings.donationReminder && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Hari dalam bulan</label>
                    <select
                      value={settings.donationReminderDay}
                      onChange={e => updateSetting('donationReminderDay', Number(e.target.value))}
                      className="w-40 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>Hari ke-{d}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Quiet Hours */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-emerald-600" />
                  Waktu Senyap
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Aktifkan waktu senyap</p>
                    <p className="text-xs text-gray-500">Jangan hantar notifikasi pada waktu tertentu</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSetting('quietHoursEnabled', !settings.quietHoursEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      settings.quietHoursEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                      settings.quietHoursEnabled ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                {settings.quietHoursEnabled && (
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mula</label>
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={e => updateSetting('quietHoursStart', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                    <span className="text-gray-400 mt-5">—</span>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tamat</label>
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={e => updateSetting('quietHoursEnd', e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {settingsSaving ? 'Menyimpan...' : 'Simpan Tetapan'}
              </button>
              <p className="text-xs text-gray-400 italic">
                Tetapan ini mengawal notifikasi yang dihantar secara automatik kepada semua pengguna. Pengguna boleh mengurus kebenaran notifikasi masing-masing di telefon mereka.
              </p>

              {/* Token Cleanup */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Pembersihan Token
                </h3>
                <p className="text-sm text-gray-500">
                  Imbas semua token FCM yang didaftarkan dan padam token yang tidak sah atau tamat tempoh.
                </p>
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleaning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {cleaning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  {cleaning ? 'Mengimbas...' : 'Bersihkan Token Tidak Sah'}
                </button>

                {cleanupResult && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Keputusan Pembersihan</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-600">Diimbas:</span>
                        <span className="font-medium">{cleanupResult.totalScanned}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-gray-600">Sah:</span>
                        <span className="font-medium text-green-600">{cleanupResult.valid}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600">Tidak sah:</span>
                        <span className="font-medium text-red-600">{cleanupResult.invalid}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-600">Dipadam:</span>
                        <span className="font-medium text-amber-600">{cleanupResult.deleted}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Debug Panel */}
              <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bug className="w-5 h-5 text-emerald-600" />
                  Diagnostik Notifikasi
                </h3>
                <p className="text-sm text-gray-500">
                  Semak status kebenaran notifikasi, Service Worker, dan Push Manager pada peranti ini.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDebug}
                    disabled={debugLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {debugLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Bug className="w-5 h-5" />
                    )}
                    {debugLoading ? 'Menyemak...' : 'Jalankan Diagnostik'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Smartphone className="w-5 h-5" />
                    Hantar Notifikasi Ujian
                  </button>
                </div>

                {showDebug && debugInfo && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Keputusan Diagnostik</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {debugInfo.supported ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Notifikasi Disokong:</span>
                        <span className={`font-medium ${debugInfo.supported ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.supported ? 'Ya' : 'Tidak'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {debugInfo.permission === 'granted' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Kebenaran:</span>
                        <span className={`font-medium ${debugInfo.permission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.permission}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {debugInfo.serviceWorkerReady ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Service Worker:</span>
                        <span className={`font-medium ${debugInfo.serviceWorkerReady ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.serviceWorkerReady ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {debugInfo.pushManagerAvailable ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-600">Push Manager:</span>
                        <span className={`font-medium ${debugInfo.pushManagerAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {debugInfo.pushManagerAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Butiran Penuh</h5>
                      <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono space-y-0.5 max-h-48 overflow-y-auto">
                        {debugInfo.details.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ SEND TAB ═══════════════ */}
      {activeTab === 'send' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white rounded-lg shadow-sm border p-5 space-y-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Hantar Notifikasi
              </h3>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tajuk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sendTitle}
                  onChange={e => setSendTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="cth: Pengumuman Solat Jumaat"
                  disabled={sending}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kandungan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={sendBody}
                  onChange={e => setSendBody(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Tulis kandungan notifikasi..."
                  disabled={sending}
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
                <select
                  value={recipientType}
                  onChange={e => setRecipientType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={sending}
                >
                  <option value="all">Semua Pengguna</option>
                  <option value="members">Ahli Aktif</option>
                  <option value="sponsors">Penaja Anak Kariah</option>
                  <option value="donors">Penderma</option>
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topik (Opsional)</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={sending}
                >
                  <option value="">Tiada topik</option>
                  <option value="announcements">Pengumuman</option>
                  <option value="events">Aktiviti</option>
                  <option value="prayer">Waktu Solat</option>
                  <option value="donations">Derma</option>
                  <option value="kuliah">Kuliah</option>
                </select>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pautan (Opsional)</label>
                <input
                  type="text"
                  value={sendUrl}
                  onChange={e => setSendUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="cth: /announcements"
                  disabled={sending}
                />
              </div>

              {/* Schedule */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                    disabled={sending}
                  />
                  <span className="text-sm font-medium text-gray-700">Jadualkan penghantaran</span>
                </label>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={e => setScheduledDateTime(e.target.value)}
                    required={isScheduled}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={sending}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  disabled={sending}
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Tutup Pratonton' : 'Pratonton'}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Menghantar...' : isScheduled ? 'Jadualkan' : 'Hantar Sekarang'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Pratonton Notifikasi</h3>
              <NotificationPreview
                title={sendTitle || 'Tajuk Notifikasi'}
                body={sendBody || 'Kandungan notifikasi akan dipaparkan di sini.'}
              />
              <div className="text-xs text-gray-400 text-center">
                Paparan anggaran pada peranti mudah alih
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ HISTORY TAB ═══════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
              <p className="mt-3 text-gray-500">Memuatkan sejarah...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tiada notifikasi dihantar lagi</p>
            </div>
          ) : (
            <>
              {/* Select All / Bulk Delete toolbar */}
              <div className="flex items-center justify-between bg-white rounded-lg border px-4 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.length > 0 && selectedIds.size === notifications.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">
                    {selectedIds.size > 0
                      ? `${selectedIds.size} / ${notifications.length} dipilih`
                      : 'Pilih Semua'}
                  </span>
                </label>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleting ? 'Memadam...' : `Padam (${selectedIds.size})`}
                  </button>
                )}
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className={`bg-white rounded-lg border p-4 space-y-2 ${selectedIds.has(n.id!) ? 'ring-2 ring-emerald-500 border-emerald-300' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(n.id!)}
                        onChange={() => toggleSelect(n.id!)}
                        className="h-4 w-4 mt-0.5 text-emerald-600 rounded focus:ring-emerald-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-gray-900 text-sm">{n.title}</h4>
                          {statusBadge(n.status)}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{n.body}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{recipientLabel(n.recipientType)}</span>
                      <span>{formatTimestamp(n.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        {n.sentCount ?? 0} dihantar
                      </span>
                      <button
                        onClick={() => handleDelete(n.id!, n.title)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={notifications.length > 0 && selectedIds.size === notifications.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tarikh</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tajuk</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Penerima</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Bilangan</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {notifications.map(n => (
                        <tr key={n.id} className={`hover:bg-gray-50 ${selectedIds.has(n.id!) ? 'bg-emerald-50' : ''}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(n.id!)}
                              onChange={() => toggleSelect(n.id!)}
                              className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatTimestamp(n.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{n.title}</p>
                            <p className="text-gray-500 text-xs line-clamp-1 mt-0.5">{n.body}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {recipientLabel(n.recipientType)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {n.sentCount ?? 0}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {statusBadge(n.status)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDelete(n.id!, n.title)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Padam"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
      </div>
    </>
  );
}
