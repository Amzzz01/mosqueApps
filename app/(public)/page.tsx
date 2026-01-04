import Link from 'next/link';
import { Clock, MessageSquare, Phone, Users, Heart, BookOpen } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Waktu Solat',
      description: 'Lihat waktu solat harian dari JAKIM',
      href: '/prayer-times',
      color: 'bg-blue-500',
    },
    {
      icon: MessageSquare,
      title: 'Pengumuman',
      description: 'Maklumat dan berita terkini masjid',
      href: '/announcements',
      color: 'bg-purple-500',
    },
    {
      icon: Phone,
      title: 'Hubungi Kami',
      description: 'Alamat dan cara menghubungi masjid',
      href: '/contact',
      color: 'bg-emerald-500',
    },
  ];

  const activities = [
    {
      icon: BookOpen,
      title: 'Kelas Mengaji',
      description: 'Setiap Isnin & Khamis, 8:30 PM',
    },
    {
      icon: Users,
      title: 'Kuliah Jumaat',
      description: 'Setiap Jumaat, 1:00 PM',
    },
    {
      icon: Heart,
      title: 'Program Amal',
      description: 'Setiap bulan, lihat pengumuman',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Assalamualaikum
            </h1>
            <p className="text-xl md:text-2xl text-emerald-50 mb-4">
              Selamat Datang ke Masjid Al-Falah
            </p>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-8">
              Masjid yang berdedikasi untuk menyediakan perkhidmatan terbaik kepada 
              masyarakat Islam dalam ibadah, pendidikan, dan aktiviti kemasyarakatan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/prayer-times"
                className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl"
              >
                Lihat Waktu Solat
              </Link>
              <Link
                href="/contact"
                className="bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl border-2 border-white"
              >
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perkhidmatan Masjid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-emerald-200"
                >
                  <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 text-emerald-600 font-semibold flex items-center group-hover:translate-x-2 transition-transform">
                    Lihat →
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Aktiviti Masjid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 rounded-full p-3 flex-shrink-0">
                      <Icon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {activity.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-serif italic leading-relaxed">
            "Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya"
          </blockquote>
          <p className="mt-6 text-emerald-100 text-lg">
            - Hadis Riwayat Bukhari
          </p>
        </div>
      </section>
    </div>
  );
}