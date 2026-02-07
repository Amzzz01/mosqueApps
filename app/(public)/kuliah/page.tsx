import { BookOpen, Clock, Calendar, MapPin, AlertCircle, GraduationCap } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Kuliah } from '@/types';

export const revalidate = 30;

const kategoriLabels: Record<string, string> = {
  quran: 'Al-Quran',
  hadis: 'Hadis',
  fiqh: 'Fiqh',
  akhlak: 'Akhlak',
  umum: 'Umum',
};

const kategoriColors: Record<string, string> = {
  quran: 'bg-emerald-100 text-emerald-800',
  hadis: 'bg-blue-100 text-blue-800',
  fiqh: 'bg-purple-100 text-purple-800',
  akhlak: 'bg-orange-100 text-orange-800',
  umum: 'bg-gray-100 text-gray-800',
};

async function getActiveKuliah(): Promise<Kuliah[]> {
  const mapDocs = (snapshot: import('firebase/firestore').QuerySnapshot) =>
    snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: typeof data.createdAt?.toDate === 'function'
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        updatedAt: typeof data.updatedAt?.toDate === 'function'
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
      };
    }) as Kuliah[];

  // Try with orderBy first (requires composite index)
  try {
    console.log('[kuliah/public] Fetching active kuliah with orderBy...');
    const q = query(
      collection(db, 'kuliah'),
      where('aktif', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    console.log(`[kuliah/public] Found ${snapshot.size} active kuliah (with orderBy)`);
    return mapDocs(snapshot);
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code ?? '';
    const message = (error as { message?: string })?.message ?? '';
    console.warn(`[kuliah/public] OrderBy query failed (${code}):`, message);

    // If it's a missing index error, fallback to query without orderBy
    if (code === 'failed-precondition' || message.includes('index')) {
      console.log('[kuliah/public] Falling back to query without orderBy (missing index)...');
      try {
        const fallbackQ = query(
          collection(db, 'kuliah'),
          where('aktif', '==', true)
        );
        const snapshot = await getDocs(fallbackQ);
        console.log(`[kuliah/public] Found ${snapshot.size} active kuliah (fallback)`);
        return mapDocs(snapshot);
      } catch (fallbackError) {
        console.error('[kuliah/public] Fallback query also failed:', fallbackError);
        return [];
      }
    }

    console.error('[kuliah/public] Non-index error, returning empty:', error);
    return [];
  }
}

export default async function KuliahPage() {
  const kuliahList = await getActiveKuliah();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <GraduationCap className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Jadual Kuliah</h1>
          <p className="text-xl text-emerald-50">
            Program pendidikan dan kuliah mingguan di Masjid Al-Falah
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {kuliahList.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiada Kuliah</h2>
              <p className="text-gray-600">
                Tiada jadual kuliah buat masa ini. Sila semak semula kemudian.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {kuliahList.length} Kuliah Aktif
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kuliahList.map(kuliah => (
                <div
                  key={kuliah.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-emerald-200 hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${kategoriColors[kuliah.kategori] || 'bg-gray-100 text-gray-800'}`}>
                        {kategoriLabels[kuliah.kategori] || kuliah.kategori}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3">{kuliah.tajuk}</h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{kuliah.hari}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{kuliah.masa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{kuliah.lokasi}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-emerald-600">{kuliah.penceramah}</p>
                    </div>

                    {kuliah.keterangan && (
                      <p className="mt-3 text-sm text-gray-500 line-clamp-2">{kuliah.keterangan}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Maklumat</h3>
              <p className="text-gray-600 text-sm">
                Jadual kuliah mungkin berubah dari semasa ke semasa. Sila hubungi pejabat masjid untuk pengesahan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
