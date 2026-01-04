import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react';

export default function ContactPage() {
  return (
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
  );
}