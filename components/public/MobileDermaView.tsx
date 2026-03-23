'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CreditCard, X, Download, Loader2, Copy, Check, QrCode, Expand } from 'lucide-react';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';

const MONTHS_MY = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];

function toDate(val: unknown): Date {
  if (val && typeof (val as { toDate?: unknown }).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  if (val instanceof Date) return val;
  return new Date(val as string);
}

function relativeTime(val: unknown): string {
  const date = toDate(val);
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return 'Baru sahaja';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} hari lalu`;
  return `${date.getDate()} ${MONTHS_MY[date.getMonth()]} ${date.getFullYear()}`;
}

function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface Donation {
  id: string;
  donorName?: string;
  amount: number;
  date: unknown;
}

export default function MobileDermaView() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [bankNumber, setBankNumber] = useState('123456789012');
  const [bankName, setBankName] = useState('Maybank');
  const [bankHolder, setBankHolder] = useState('Masjid Al-Falah Telok Bagan');

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'donations'), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setQrImageUrl(data.qrCodeUrl || null);
          setBankNumber(data.bankNumber || '123456789012');
          setBankName(data.bankName || 'Maybank');
          setBankHolder(data.bankHolder || 'Masjid Al-Falah Telok Bagan');
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setQrLoading(false);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (qrViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [qrViewerOpen]);

  const handleCopyBank = async () => {
    try {
      await navigator.clipboard.writeText(bankNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDownloadQr = async () => {
    if (!qrImageUrl || isDownloadingQr) return;
    setIsDownloadingQr(true);
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'QR-Derma-MasjidAlFalah.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('QR download failed:', err);
    } finally {
      setIsDownloadingQr(false);
    }
  };

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  const thisMonth = donations
    .filter(d => { const dt = toDate(d.date); return dt >= monthStart && dt <= monthEnd; })
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const recentDonations = donations.slice(0, 5);

  return (
    <div className="lg:hidden flex flex-col min-h-screen bg-gray-50">
      {/* App Bar */}
      <div className="bg-gray-800 px-4 pt-4 pb-4">
        <p className="text-gray-400 text-xs">Masjid Al-Falah</p>
        <p className="text-white font-bold text-lg">Sumbangan & Derma</p>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-3 py-3 pb-24">

        {/* Section A — Stats */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider text-center mb-1">Jumlah Terkumpul</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-32 mx-auto mb-3" />
              <div className="bg-gray-800 rounded-xl p-2 flex gap-2">
                <div className="flex-1 h-10 bg-gray-700 rounded" />
                <div className="flex-1 h-10 bg-gray-700 rounded" />
                <div className="flex-1 h-10 bg-gray-700 rounded" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-cyan-400 text-2xl font-extrabold text-center">{formatRM(total)}</p>
              <div className="bg-gray-800 rounded-xl mt-3 p-2 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-gray-500 text-[10px]">Bulan Ini</p>
                  <p className="text-cyan-100 text-sm font-bold">{formatRM(thisMonth)}</p>
                </div>
                <div className="text-center border-x border-gray-700">
                  <p className="text-gray-500 text-[10px]">Penderma</p>
                  <p className="text-cyan-100 text-sm font-bold">{donations.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-[10px]">Transaksi</p>
                  <p className="text-cyan-100 text-sm font-bold">{donations.length}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section B — Cara Sumbangan */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Cara Sumbangan</p>
          <div className="flex flex-col gap-2">
            {/* Bank card */}
            <div className="bg-[#f0fdff] border border-cyan-200 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{bankName}</p>
                <p className="text-xs text-gray-500">{bankHolder}</p>
              </div>
              <button
                onClick={handleCopyBank}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-[#164e63] text-cyan-400 border border-cyan-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {bankNumber.replace(/(\d{4})(?=\d)/g, '$1-')}
                  </>
                )}
              </button>
            </div>

            {/* QR card */}
            <div
              className={`bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 ${qrImageUrl ? 'cursor-pointer active:bg-gray-50' : ''}`}
              onClick={() => qrImageUrl && setQrViewerOpen(true)}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {qrLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                ) : qrImageUrl ? (
                  <Image
                    src={qrImageUrl}
                    alt="QR Code"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <QrCode className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Imbas QR Code</p>
                <p className="text-xs text-gray-500">DuitNow / SarawakPay</p>
              </div>
              {qrImageUrl && (
                <div className="flex items-center gap-1 text-cyan-600">
                  <Expand className="w-4 h-4" />
                  <span className="text-xs font-medium">Lihat</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section C — Recent donations */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Sumbangan Terkini</p>
          {loading ? (
            <div className="flex flex-col gap-2 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-3 h-14 border border-gray-100" />
              ))}
            </div>
          ) : recentDonations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Tiada rekod sumbangan</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentDonations.map(d => {
                const name = d.donorName || 'Tanpa Nama';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div key={d.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#164e63] flex items-center justify-center flex-shrink-0">
                        <span className="text-cyan-400 font-bold text-sm">{initial}</span>
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm font-medium">{name}</p>
                        <p className="text-gray-400 text-xs">{relativeTime(d.date)}</p>
                      </div>
                    </div>
                    <p className="text-cyan-600 font-bold text-sm">{formatRM(d.amount)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* QR Fullscreen Modal */}
      {qrViewerOpen && qrImageUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black flex-shrink-0">
            <button
              onClick={() => setQrViewerOpen(false)}
              className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <p className="text-white text-sm font-semibold flex-1 text-center px-3">
              QR Code Derma
            </p>
            <button
              onClick={handleDownloadQr}
              disabled={isDownloadingQr}
              className="w-9 h-9 bg-[#164e63] border border-cyan-700 rounded-full flex items-center justify-center"
            >
              {isDownloadingQr
                ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                : <Download className="w-4 h-4 text-cyan-400" />
              }
            </button>
          </div>

          {/* QR Image */}
          <div className="flex-1 flex items-center justify-center px-6 py-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <Image
                src={qrImageUrl}
                alt="QR Code Derma"
                width={400}
                height={400}
                className="w-full h-auto object-contain"
                unoptimized
              />
              <p className="text-center text-gray-500 text-xs mt-4">
                Masjid Al-Falah Telok Bagan
              </p>
              <p className="text-center text-gray-400 text-xs mt-1">
                DuitNow / SarawakPay
              </p>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="bg-black py-3 text-center flex-shrink-0">
            <p className="text-xs text-gray-600">
              Tahan lama untuk simpan • Ketuk X untuk tutup
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
