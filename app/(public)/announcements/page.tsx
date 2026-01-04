import { MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Announcement } from '@/types';
import AnnouncementCard from '@/components/public/AnnouncementCard';

export const revalidate = 300; // Revalidate every 5 minutes

async function getPublishedAnnouncements(): Promise<Announcement[]> {
  try {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Announcement[];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

export default async function AnnouncementsPage() {
  const announcements = await getPublishedAnnouncements();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pengumuman</h1>
          <p className="text-xl text-emerald-50">
            Maklumat dan berita terkini dari masjid
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {announcements.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tiada Pengumuman
              </h2>
              <p className="text-gray-600">
                Tiada pengumuman baharu buat masa ini. Sila semak semula kemudian.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="mb-8 bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {announcements.length} Pengumuman Aktif
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Dikemaskini setiap 5 minit
                </div>
              </div>
            </div>

            {/* Announcements Grid */}
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Ingin menerima pengumuman terkini?
              </h3>
              <p className="text-gray-600 text-sm">
                Ikuti laman media sosial kami atau hubungi pejabat untuk mendaftar ke senarai mel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}