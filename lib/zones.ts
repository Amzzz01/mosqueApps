// Malaysian Prayer Time Zones
// Complete list of zones for all states in Malaysia

export interface Zone {
  code: string;
  name: string;
  state: string;
}

export const MALAYSIAN_ZONES: Zone[] = [
  // Johor
  { code: 'JHR01', name: 'Pulau Aur dan Pulau Pemanggil', state: 'Johor' },
  { code: 'JHR02', name: 'Johor Bahru, Kota Tinggi, Mersing, Kulai', state: 'Johor' },
  { code: 'JHR03', name: 'Kluang, Pontian', state: 'Johor' },
  { code: 'JHR04', name: 'Batu Pahat, Muar, Segamat, Gemas, Tangkak', state: 'Johor' },
  
  // Kedah
  { code: 'KDH01', name: 'Kota Setar, Kubang Pasu, Pokok Sena', state: 'Kedah' },
  { code: 'KDH02', name: 'Kuala Muda, Yan, Pendang', state: 'Kedah' },
  { code: 'KDH03', name: 'Padang Terap, Sik', state: 'Kedah' },
  { code: 'KDH04', name: 'Baling', state: 'Kedah' },
  { code: 'KDH05', name: 'Bandar Baharu, Kulim', state: 'Kedah' },
  { code: 'KDH06', name: 'Langkawi', state: 'Kedah' },
  { code: 'KDH07', name: 'Gunung Jerai', state: 'Kedah' },
  
  // Kelantan
  { code: 'KTN01', name: 'Kota Bharu, Bachok, Pasir Puteh, Tumpat, Pasir Mas, Tanah Merah, Machang, Kuala Krai, Mukim Chiku', state: 'Kelantan' },
  { code: 'KTN03', name: 'Jeli, Gua Musang (Mukim Galas, Bertam)', state: 'Kelantan' },
  
  // Melaka
  { code: 'MLK01', name: 'Seluruh Negeri Melaka', state: 'Melaka' },
  
  // Negeri Sembilan
  { code: 'NGS01', name: 'Tampin, Jempol, Jelebu', state: 'Negeri Sembilan' },
  { code: 'NGS02', name: 'Port Dickson, Seremban, Kuala Pilah, Jelebu (Mukim Sg. Lui, Kenaboi, Jeram Padang), Rembau, Nilai', state: 'Negeri Sembilan' },
  
  // Pahang
  { code: 'PHG01', name: 'Pulau Tioman', state: 'Pahang' },
  { code: 'PHG02', name: 'Kuantan, Pekan, Rompin, Muadzam Shah', state: 'Pahang' },
  { code: 'PHG03', name: 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka', state: 'Pahang' },
  { code: 'PHG04', name: 'Bentong, Lipis, Raub', state: 'Pahang' },
  { code: 'PHG05', name: 'Genting Highlands, Cameron Highlands, Bukit Fraser', state: 'Pahang' },
  { code: 'PHG06', name: 'Bukit Tinggi', state: 'Pahang' },
  
  // Perlis
  { code: 'PLS01', name: 'Seluruh Negeri Perlis', state: 'Perlis' },
  
  // Pulau Pinang
  { code: 'PNG01', name: 'Seluruh Negeri Pulau Pinang', state: 'Pulau Pinang' },
  
  // Perak
  { code: 'PRK01', name: 'Tapah, Slim River, Tanjung Malim', state: 'Perak' },
  { code: 'PRK02', name: 'Ipoh, Batu Gajah, Kampar, Sg. Siput, Kuala Kangsar', state: 'Perak' },
  { code: 'PRK03', name: 'Pengkalan Hulu, Grik, Lenggong', state: 'Perak' },
  { code: 'PRK04', name: 'Temengor, Belum', state: 'Perak' },
  { code: 'PRK05', name: 'Teluk Intan, Bagan Datuk, Kg.Gajah, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Ayer Tawar', state: 'Perak' },
  { code: 'PRK06', name: 'Selama, Taiping, Bagan Serai, Parit Buntar', state: 'Perak' },
  { code: 'PRK07', name: 'Bukit Larut', state: 'Perak' },
  
  // Sabah
  { code: 'SBH01', name: 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau', state: 'Sabah' },
  { code: 'SBH02', name: 'Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)', state: 'Sabah' },
  { code: 'SBH03', name: 'Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)', state: 'Sabah' },
  { code: 'SBH04', name: 'Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)', state: 'Sabah' },
  { code: 'SBH05', name: 'Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat', state: 'Sabah' },
  { code: 'SBH06', name: 'Gunung Kinabalu', state: 'Sabah' },
  { code: 'SBH07', name: 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat', state: 'Sabah' },
  { code: 'SBH08', name: 'Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pendalaman (Atas)', state: 'Sabah' },
  { code: 'SBH09', name: 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pa Sia, Membakut, Weston, Bahagian Pendalaman (Bawah)', state: 'Sabah' },
  
  // Selangor
  { code: 'SGR01', name: 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Rawang, Shah Alam', state: 'Selangor' },
  { code: 'SGR02', name: 'Kuala Selangor, Sabak Bernam', state: 'Selangor' },
  { code: 'SGR03', name: 'Klang, Kuala Langat', state: 'Selangor' },
  
  // Sarawak
  { code: 'SWK01', name: 'Kuching, Bau, Lundu, Sematan', state: 'Sarawak' },
  { code: 'SWK02', name: 'Siburan, Serian, Simunjan, Samarahan, Sebuyau, Meludam', state: 'Sarawak' },
  { code: 'SWK03', name: 'Miri, Niah, Bekenu, Sibuti, Marudi', state: 'Sarawak' },
  { code: 'SWK04', name: 'Bintulu, Tatau, Sebauh', state: 'Sarawak' },
  { code: 'SWK05', name: 'Limbang, Sundar, Terusan, Lawas', state: 'Sarawak' },
  { code: 'SWK06', name: 'Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai', state: 'Sarawak' },
  { code: 'SWK07', name: 'Sibu, Mukah, Dalat, Oya, Balingian, Kanowit, Kapit, Song, Katibas', state: 'Sarawak' },
  { code: 'SWK08', name: 'Serian, Simunjan, Samarahan, Sebuyau, Meludam (Kawasan Kampung Baru Mambong)', state: 'Sarawak' },
  { code: 'SWK09', name: 'Betong, Spaoh, Pusa, Saratok, Debak, Kabong, Bau, Lundu, Sematan', state: 'Sarawak' },
  
  // Terengganu
  { code: 'TRG01', name: 'Kuala Terengganu, Marang', state: 'Terengganu' },
  { code: 'TRG02', name: 'Besut, Setiu', state: 'Terengganu' },
  { code: 'TRG03', name: 'Hulu Terengganu', state: 'Terengganu' },
  { code: 'TRG04', name: 'Dungun, Kemaman', state: 'Terengganu' },
  
  // Wilayah Persekutuan
  { code: 'WLY01', name: 'Kuala Lumpur', state: 'W.P. Kuala Lumpur' },
  { code: 'WLY02', name: 'Labuan', state: 'W.P. Labuan' },
  { code: 'WLY03', name: 'Putrajaya', state: 'W.P. Putrajaya' },
];

// Group zones by state
export const ZONES_BY_STATE = MALAYSIAN_ZONES.reduce((acc, zone) => {
  if (!acc[zone.state]) {
    acc[zone.state] = [];
  }
  acc[zone.state].push(zone);
  return acc;
}, {} as Record<string, Zone[]>);

// Get all states
export const STATES = Object.keys(ZONES_BY_STATE).sort();

// Helper function to get zone by code
export function getZoneByCode(code: string): Zone | undefined {
  return MALAYSIAN_ZONES.find(zone => zone.code === code);
}

// Helper function to get zones for a specific state
export function getZonesByState(state: string): Zone[] {
  return ZONES_BY_STATE[state] || [];
}

// Default zone (Shah Alam)
export const DEFAULT_ZONE = 'SGR01';