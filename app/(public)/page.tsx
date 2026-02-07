import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  MessageSquare,
  Phone,
  Heart,
  BookOpen,
  Calendar,
  ArrowRight,
  HandHeart,
  UserPlus,
  ImageIcon,
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Kuliah, Aktiviti } from '@/types';

export const revalidate = 30;

async function getActiveKuliah(): Promise<Kuliah[]> {
  try {
    const q = query(
      collection(db, 'kuliah'),
      where('aktif', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Kuliah;
    });
  } catch {
    return [];
  }
}

async function getRecentAktiviti(): Promise<Aktiviti[]> {
  try {
    const q = query(
      collection(db, 'activities'),
      where('published', '==', true),
      orderBy('tarikh', 'desc'),
      limit(4)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Aktiviti;
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [kuliahList, aktivitiList] = await Promise.all([
    getActiveKuliah(),
    getRecentAktiviti(),
  ]);

  const services = [
    {
      icon: Clock,
      title: 'Waktu Solat',
      description: 'Lihat waktu solat harian dari JAKIM untuk kawasan anda.',
      href: '/prayer-times',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: MessageSquare,
      title: 'Pengumuman',
      description: 'Maklumat dan berita terkini dari pihak masjid.',
      href: '/announcements',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Phone,
      title: 'Hubungi Kami',
      description: 'Alamat, lokasi, dan cara menghubungi masjid.',
      href: '/contact',
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 border border-white/30 rounded-full" />
          <div className="absolute bottom-10 right-10 w-96 h-96 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
          <div className="hidden xl:block absolute -top-20 -right-20 w-[500px] h-[500px] border border-white/15 rounded-full" />
          <div className="hidden xl:block absolute -bottom-32 -left-32 w-[400px] h-[400px] border border-white/10 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36 xl:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-emerald-200 text-sm lg:text-base font-medium tracking-widest uppercase mb-4 lg:mb-6">
              Bismillahirrahmanirrahim
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 lg:mb-8 leading-tight">
              Selamat Datang ke
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-200">
                Masjid Al-Falah
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-emerald-100 mb-10 lg:mb-12 leading-relaxed max-w-2xl lg:max-w-3xl mx-auto">
              Masjid yang berdedikasi untuk menyediakan perkhidmatan terbaik kepada
              masyarakat Islam dalam ibadah, pendidikan, dan aktiviti kemasyarakatan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/prayer-times"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-emerald-700 px-7 py-3.5 lg:px-9 lg:py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl text-sm lg:text-base"
              >
                <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
                Waktu Solat Hari Ini
              </Link>
              <Link
                href="/announcements"
                className="inline-flex items-center justify-center gap-2.5 bg-white/10 backdrop-blur-sm text-white px-7 py-3.5 lg:px-9 lg:py-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 text-sm lg:text-base"
              >
                Pengumuman
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 80V30C240 60 480 0 720 30C960 60 1200 0 1440 30V80H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ========== SERVICES ========== */}
      <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-emerald-600 font-semibold text-sm lg:text-base uppercase tracking-wider mb-3">
              Perkhidmatan
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Kemudahan Untuk Anda
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.href}
                  href={service.href}
                  className="group bg-white rounded-2xl p-7 lg:p-9 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200 hover:-translate-y-1"
                >
                  <div className={`bg-gradient-to-br ${service.color} w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-5 lg:mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 lg:mb-3 group-hover:text-emerald-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-4 lg:mb-5">
                    {service.description}
                  </p>
                  <span className="text-emerald-600 font-semibold text-sm lg:text-base flex items-center gap-1.5 group-hover:gap-3 transition-all">
                    Lihat <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== KULIAH ========== */}
      <section id="kuliah" className="py-16 md:py-20 lg:py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <p className="text-emerald-600 font-semibold text-sm lg:text-base uppercase tracking-wider mb-3">
              Jadual Kuliah
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Program Pendidikan Mingguan
            </h2>
            <p className="text-gray-500 mt-3 lg:mt-4 max-w-lg lg:max-w-xl mx-auto lg:text-lg">
              Pelbagai kuliah dan kelas untuk meningkatkan ilmu agama anda.
            </p>
          </div>

          {kuliahList.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 max-w-6xl mx-auto">
              {kuliahList.slice(0, 4).map((kuliah) => (
                <div
                  key={kuliah.id}
                  className="flex items-start gap-4 xl:flex-col xl:items-center xl:text-center bg-gray-50 rounded-xl p-5 lg:p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-11 h-11 lg:w-14 lg:h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 lg:text-lg">{kuliah.tajuk}</h3>
                    <div className="flex items-center gap-2 mt-1.5 lg:mt-2 text-sm text-gray-500 xl:justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{kuliah.hari}</span>
                      <span className="text-gray-300">|</span>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{kuliah.masa}</span>
                    </div>
                    <p className="text-sm lg:text-base text-emerald-600 mt-1 lg:mt-2 font-medium">{kuliah.penceramah}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Jadual kuliah akan dikemaskini tidak lama lagi.</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/kuliah"
              className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
            >
              Lihat Semua Kuliah
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== ACTIVITY GALLERY PREVIEW ========== */}
      {aktivitiList.length > 0 && (
        <section className="py-16 md:py-20 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-16">
              <p className="text-emerald-600 font-semibold text-sm lg:text-base uppercase tracking-wider mb-3">
                Galeri Aktiviti
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Aktiviti Terkini
              </h2>
              <p className="text-gray-500 mt-3 lg:mt-4 max-w-lg lg:max-w-xl mx-auto lg:text-lg">
                Gambar dan dokumentasi aktiviti terbaharu masjid kami.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aktivitiList.map(aktiviti => (
                <div
                  key={aktiviti.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {aktiviti.gambarUrls?.length > 0 ? (
                      <Image
                        src={aktiviti.gambarUrls[0]}
                        alt={aktiviti.tajuk}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{aktiviti.tajuk}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{aktiviti.keterangan}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/galeri"
                className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
              >
                Lihat Semua Aktiviti
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== DONATION ========== */}
      <section id="derma" className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:gap-16 xl:gap-20">
            {/* Left - text */}
            <div className="text-center lg:text-left lg:flex-1">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-white/20">
                <HandHeart className="w-8 h-8 lg:w-10 lg:h-10" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-5">
                Sumbangan & Derma
              </h2>
              <p className="text-emerald-100 leading-relaxed mb-8 lg:mb-0 max-w-xl mx-auto lg:mx-0 lg:text-lg">
                Sumbangan anda membantu kami menyelenggara masjid, menjalankan program pendidikan,
                dan membantu golongan yang memerlukan dalam komuniti.
              </p>
            </div>

            {/* Right - bank info + CTA */}
            <div className="lg:flex-shrink-0 lg:w-[420px]">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-10 border border-white/20 max-w-md mx-auto lg:max-w-none mb-8 lg:mb-6">
                <p className="text-sm lg:text-base text-emerald-200 mb-2">Akaun Bank Masjid</p>
                <p className="text-lg lg:text-2xl font-bold">Maybank &bull; 1234-5678-9012</p>
                <p className="text-sm lg:text-base text-emerald-200 mt-1">Masjid Al-Falah Telok Bagan</p>
              </div>
              <div className="text-center lg:text-left space-y-3">
                <Link
                  href="/derma"
                  className="inline-flex items-center gap-2.5 bg-white text-emerald-700 px-7 py-3.5 lg:px-9 lg:py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl text-sm lg:text-base"
                >
                  <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
                  Lihat Maklumat Derma
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== REGISTER CTA ========== */}
      <section id="daftar" className="py-16 md:py-20 lg:py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl lg:rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4">
                Daftar Sebagai Anak Kariah
              </h2>
              <p className="text-gray-400 leading-relaxed lg:text-lg lg:max-w-lg">
                Jadilah sebahagian daripada komuniti Masjid Al-Falah. Daftarkan diri anda
                untuk menerima maklumat terkini dan terlibat dalam aktiviti masjid.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 bg-emerald-500 text-white px-7 py-3.5 lg:px-9 lg:py-4 rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap text-sm lg:text-base flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 lg:w-5 lg:h-5" />
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* ========== QUOTE ========== */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-serif italic text-gray-800 leading-relaxed">
            &ldquo;Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya&rdquo;
          </blockquote>
          <p className="mt-5 lg:mt-8 text-gray-500 font-medium lg:text-lg">
            Hadis Riwayat Bukhari
          </p>
        </div>
      </section>
    </div>
  );
}
