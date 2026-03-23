import { HandHeart, Heart, Phone, AlertCircle, DollarSign } from 'lucide-react';
import MobileTopBar from '@/components/public/MobileTopBar';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import MobileDermaView from '@/components/public/MobileDermaView';

export const revalidate = 60;

const toDate = (val: unknown): Date => {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate();
  }
  if (val instanceof Date) return val;
  return new Date(val as string);
};

async function getDonationStats() {
  try {
    const q = query(collection(db, 'donations'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    let total = 0;
    let thisMonth = 0;
    let thisYear = 0;
    let count = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const amount = data.amount || 0;
      const date = toDate(data.date);
      count++;
      total += amount;
      if (date >= monthStart && date <= monthEnd) thisMonth += amount;
      if (date >= yearStart && date <= yearEnd) thisYear += amount;
    });

    return { total, thisMonth, thisYear, count };
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    return { total: 0, thisMonth: 0, thisYear: 0, count: 0 };
  }
}

function formatRM(amount: number) {
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DermaPage() {
  const stats = await getDonationStats();

  const donationCategories = [
    {
      title: 'Tabung Masjid',
      description: 'Sumbangan untuk penyelenggaraan dan pembaikan masjid',
      icon: '🕌',
    },
    {
      title: 'Zakat',
      description: 'Bayaran zakat fitrah dan zakat harta',
      icon: '💰',
    },
    {
      title: 'Sadaqah',
      description: 'Sumbangan ikhlas untuk kebajikan ummah',
      icon: '🤲',
    },
    {
      title: 'Wakaf',
      description: 'Sumbangan wakaf untuk pembangunan masjid',
      icon: '📖',
    },
  ];

  return (
    <>
      <div className="lg:hidden">
        <MobileDermaView />
      </div>
      <div className="hidden lg:block">
        <div className="min-h-screen bg-gray-50">
          <MobileTopBar />
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <HandHeart className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Sumbangan & Derma</h1>
              <p className="text-xl text-emerald-50">
                Sumbangan anda membantu pembangunan dan penyelenggaraan masjid
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                <DollarSign className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Jumlah Keseluruhan</p>
                <p className="text-2xl font-bold text-gray-900">{formatRM(stats.total)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.count} transaksi</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                <Heart className="h-10 w-10 text-pink-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Bulan Ini</p>
                <p className="text-2xl font-bold text-gray-900">{formatRM(stats.thisMonth)}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 text-center">
                <HandHeart className="h-10 w-10 text-teal-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-1">Tahun Ini</p>
                <p className="text-2xl font-bold text-gray-900">{formatRM(stats.thisYear)}</p>
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-8 md:p-12 text-white mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Maklumat Akaun Bank</h2>
              <div className="max-w-md mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <p className="text-emerald-200 text-sm mb-1">Nama Bank</p>
                <p className="text-xl font-bold mb-4">Maybank</p>
                <p className="text-emerald-200 text-sm mb-1">Nombor Akaun</p>
                <p className="text-xl font-bold mb-4">1234-5678-9012</p>
                <p className="text-emerald-200 text-sm mb-1">Nama Pemegang Akaun</p>
                <p className="text-xl font-bold">Masjid Al-Falah Telok Bagan</p>
              </div>
            </div>

            {/* Categories */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategori Sumbangan</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {donationCategories.map(cat => (
                <div key={cat.title} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
                  <div className="text-4xl mb-4">{cat.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.title}</h3>
                  <p className="text-sm text-gray-600">{cat.description}</p>
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <Phone className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Hubungi Kami</h3>
                  <p className="text-gray-600 text-sm">
                    Untuk maklumat lanjut mengenai sumbangan, hubungi pejabat masjid atau lawati
                    kami secara langsung pada waktu pejabat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
