import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

export default function ContactPage() {
  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="lg:hidden flex flex-col bg-[#f1f5f9] min-h-screen pb-10">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#0d2d3a] to-[#0a1f2e] px-4 pt-4 pb-6 flex-shrink-0">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-white text-2xl font-extrabold tracking-tight leading-tight">
                Hubungi Kami
              </h1>
              <p className="text-white/60 text-[10px] mt-1">Kami sedia membantu anda</p>
              <div className="flex gap-2 mt-3">
                <span className="bg-teal-400/20 border border-teal-400/30 text-teal-300 text-[9px] font-semibold px-2 py-1 rounded-full">
                  Masjid Al-Falah
                </span>
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-center flex-shrink-0 ml-3">
              <Phone className="w-7 h-7 text-teal-400 mx-auto" />
              <p className="text-white/50 text-[9px] mt-1">Hubungi</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pt-3 space-y-3">

          {/* Contact cards */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <p className="px-4 pt-3 pb-2 text-[10px] font-semibold text-[#0d7a6b] uppercase tracking-widest">Perhubungan</p>

            {/* Address */}
            <div className="px-4 py-3 flex items-start gap-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#0d9488]" />
              </div>
              <div>
                <p className="text-slate-800 text-xs font-semibold mb-1">Alamat</p>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Masjid Al-Falah<br />
                  Jalan Masjid 1/2,<br />
                  Taman Harmoni,<br />
                  40000 Shah Alam, Selangor
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="px-4 py-3 flex items-start gap-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="w-4 h-4 text-[#0d9488]" />
              </div>
              <div>
                <p className="text-slate-800 text-xs font-semibold mb-1">Telefon</p>
                <a href="tel:+60355441234" className="text-[#0d9488] text-[11px] font-semibold">
                  03-5544 1234
                </a>
                <p className="text-slate-400 text-[10px] mt-0.5">Isnin - Jumaat: 9:00 AM - 5:00 PM</p>
              </div>
            </div>

            {/* Email */}
            <div className="px-4 py-3 flex items-start gap-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-[#0d9488]" />
              </div>
              <div>
                <p className="text-slate-800 text-xs font-semibold mb-1">E-mel</p>
                <a href="mailto:info@masjidalfalah.my" className="text-[#0d9488] text-[11px] font-semibold">
                  info@masjidalfalah.my
                </a>
                <p className="text-slate-400 text-[10px] mt-0.5">Kami akan membalas dalam 24 jam</p>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
              </div>
              <p className="text-slate-800 text-xs font-semibold">Waktu Operasi Pejabat</p>
            </div>
            <div className="space-y-2">
              {[
                { day: 'Isnin - Khamis', time: '9:00 AM - 5:00 PM' },
                { day: 'Jumaat', time: '9:00 AM - 12:00 PM' },
                { day: 'Sabtu - Ahad', time: 'Tutup' },
              ].map(({ day, time }) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">{day}</span>
                  <span className={`text-[11px] font-semibold ${time === 'Tutup' ? 'text-red-400' : 'text-slate-800'}`}>{time}</span>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-[10px] mt-3">*Masjid dibuka untuk solat sepanjang masa</p>
          </div>

          {/* Social media */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
            <p className="text-slate-800 text-xs font-semibold mb-3">Ikuti Kami</p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com/masjidalfalah"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5"
              >
                <Facebook className="w-4 h-4 text-blue-500" />
                <span className="text-blue-500 text-[11px] font-semibold">Facebook</span>
              </a>
              <a
                href="https://instagram.com/masjidalfalah"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 bg-pink-50 border border-pink-100 rounded-xl px-3 py-2.5"
              >
                <Instagram className="w-4 h-4 text-pink-500" />
                <span className="text-pink-500 text-[11px] font-semibold">Instagram</span>
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-[10px] font-semibold text-[#0d7a6b] uppercase tracking-widest">Lokasi Masjid</p>
            <div className="h-52 overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.8158!2d101.5!3d3.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDAnMDAuMCJOIDEwMcKwMzAnMDAuMCJF!5e0!3m2!1sen!2smy!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Lokasi Masjid Al-Falah"
              />
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {[
                'Dari Shah Alam: Ikut Jalan Gombak, belok kanan di lampu isyarat pertama',
                'Parking tersedia di hadapan dan belakang masjid',
                'Masjid terletak bersebelahan dengan Taman Harmoni',
                'Berdekatan dengan stesen LRT (5 minit berjalan kaki)',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#0d9488] text-[10px] mt-0.5">•</span>
                  <span className="text-slate-500 text-[10px] leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
            <p className="text-[10px] font-semibold text-[#0d7a6b] uppercase tracking-widest mb-3">Soalan Lazim</p>
            <div className="space-y-4">
              {[
                {
                  q: 'Adakah masjid menerima zakat dan sedekah?',
                  a: 'Ya, kami menerima zakat, sedekah, dan derma. Sila hubungi pejabat untuk maklumat lanjut.',
                },
                {
                  q: 'Bagaimana untuk menjadi ahli kariah?',
                  a: 'Sila hubungi pejabat atau datang terus semasa waktu operasi untuk pendaftaran.',
                },
                {
                  q: 'Adakah terdapat kemudahan untuk OKU?',
                  a: 'Ya, masjid kami dilengkapi dengan kemudahan untuk OKU termasuk ram dan tandas khas.',
                },
              ].map(({ q, a }, i) => (
                <div key={i}>
                  <p className="text-slate-800 text-xs font-semibold mb-1">{q}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Desktop layout (unchanged) ── */}
      <div className="hidden lg:block">
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Phone className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Hubungi Kami</h1>
              <p className="text-xl text-emerald-50">
                Kami sedia membantu anda
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Maklumat Perhubungan
                </h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-emerald-100 rounded-full p-3 flex-shrink-0">
                        <MapPin className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Alamat
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Masjid Al-Falah<br />
                          Jalan Masjid 1/2,<br />
                          Taman Harmoni,<br />
                          40000 Shah Alam, Selangor
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                        <Phone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Telefon
                        </h3>
                        <a
                          href="tel:+60355441234"
                          className="text-gray-600 hover:text-emerald-600 transition-colors"
                        >
                          03-5544 1234
                        </a>
                        <p className="text-sm text-gray-500 mt-1">
                          Isnin - Jumaat: 9:00 AM - 5:00 PM
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                        <Mail className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          E-mel
                        </h3>
                        <a
                          href="mailto:info@masjidalfalah.my"
                          className="text-gray-600 hover:text-emerald-600 transition-colors"
                        >
                          info@masjidalfalah.my
                        </a>
                        <p className="text-sm text-gray-500 mt-1">
                          Kami akan membalas dalam 24 jam
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-orange-100 rounded-full p-3 flex-shrink-0">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Waktu Operasi Pejabat
                        </h3>
                        <div className="space-y-2 text-gray-600">
                          <div className="flex justify-between">
                            <span>Isnin - Khamis:</span>
                            <span className="font-semibold">9:00 AM - 5:00 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Jumaat:</span>
                            <span className="font-semibold">9:00 AM - 12:00 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sabtu - Ahad:</span>
                            <span className="font-semibold">Tutup</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                          *Masjid dibuka untuk solat sepanjang masa
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ikuti Kami
                  </h3>
                  <div className="flex space-x-4">
                    <a
                      href="https://facebook.com/masjidalfalah"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a
                      href="https://instagram.com/masjidalfalah"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-pink-600 text-white p-3 rounded-full hover:bg-pink-700 transition-colors"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Lokasi Masjid
                </h2>

                {/* Google Maps Embed */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[500px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.8158!2d101.5!3d3.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM8KwMDAnMDAuMCJOIDEwMcKwMzAnMDAuMCJF!5e0!3m2!1sen!2smy!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lokasi Masjid Al-Falah"
                  />
                </div>

                <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Panduan Arah
                  </h3>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">•</span>
                      <span>Dari Shah Alam: Ikut Jalan Gombak, belok kanan di lampu isyarat pertama</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">•</span>
                      <span>Parking tersedia di hadapan dan belakang masjid</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">•</span>
                      <span>Masjid terletak bersebelahan dengan Taman Harmoni</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-emerald-600 mr-2">•</span>
                      <span>Berdekatan dengan stesen LRT (5 minit berjalan kaki)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Soalan Lazim
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Adakah masjid menerima zakat dan sedekah?
                  </h3>
                  <p className="text-gray-600">
                    Ya, kami menerima zakat, sedekah, dan derma. Sila hubungi pejabat untuk maklumat lanjut.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Bagaimana untuk menjadi ahli kariah?
                  </h3>
                  <p className="text-gray-600">
                    Sila hubungi pejabat atau datang terus semasa waktu operasi untuk pendaftaran.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Adakah terdapat kemudahan untuk OKU?
                  </h3>
                  <p className="text-gray-600">
                    Ya, masjid kami dilengkapi dengan kemudahan untuk OKU termasuk ram dan tandas khas.
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
