// JAKIM Prayer Times API Service
// Fetches prayer times from Malaysia's official JAKIM e-Solat API

export interface PrayerTimes {
  hijri: string;
  date: string;
  day: string;
  imsak: string;
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface JakimResponse {
  prayerTime: PrayerTimes[];
  status: string;
  serverTime: string;
}

// Selangor zones - kept for backwards compatibility
export const SELANGOR_ZONES = {
  'SGR01': 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Rawang, S.Alam',
  'SGR02': 'Kuala Selangor, Sabak Bernam',
  'SGR03': 'Klang, Kuala Langat',
};

// All JAKIM prayer zones grouped by state
export const MALAYSIA_ZONES: Record<string, Record<string, string>> = {
  'Perlis': {
    'PLS01': 'Kangar, Padang Besar, Arau',
  },
  'Kedah': {
    'KDH01': 'Kota Setar, Kubang Pasu, Pokok Sena (Termasuk Kawasan Bandaraya Alor Setar)',
    'KDH02': 'Kuala Muda, Yan, Pendang',
    'KDH03': 'Kulim, Bandar Baharu',
    'KDH04': 'Baling',
    'KDH05': 'Sik, Merbok, Sidam, Gurun',
    'KDH06': 'Langkawi',
    'KDH07': 'Padang Terap, Ulu Selama',
  },
  'Pulau Pinang': {
    'PNG01': 'Seluruh Negeri Pulau Pinang',
  },
  'Perak': {
    'PRK01': 'Tapah, Slim River, Tanjung Malim',
    'PRK02': 'Kuala Kangsar, Sg. Siput (Termasuk Bandar Ipoh)',
    'PRK03': 'Lenggong, Pengkalan Hulu, Grik',
    'PRK04': 'Temengor, Belum',
    'PRK05': 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor',
    'PRK06': 'Selama, Taiping, Bagan Serai, Parit Buntar',
    'PRK07': 'Bukit Gantang, Pengkalan Hulu',
  },
  'Selangor': {
    'SGR01': 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Rawang, S.Alam',
    'SGR02': 'Kuala Selangor, Sabak Bernam',
    'SGR03': 'Klang, Kuala Langat',
  },
  'W.P. Kuala Lumpur': {
    'WLY01': 'Kuala Lumpur, Putrajaya',
  },
  'W.P. Labuan': {
    'WLY02': 'Labuan',
  },
  'Negeri Sembilan': {
    'NGS01': 'Jempol, Tampin',
    'NGS02': 'Jelebu, Kuala Pilah, Rembau',
    'NGS03': 'Port Dickson, Seremban, Nilai',
  },
  'Melaka': {
    'MLK01': 'Seluruh Negeri Melaka',
  },
  'Johor': {
    'JHR01': 'Pulau Aur, Pulau Pemanggil',
    'JHR02': 'Johor Bahru, Kota Tinggi, Mersing, Kulai',
    'JHR03': 'Kluang, Pontian',
    'JHR04': 'Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak',
  },
  'Pahang': {
    'PHG01': 'Pulau Tioman',
    'PHG02': 'Kuantan, Pekan, Rompin, Muadzam Shah',
    'PHG03': 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka',
    'PHG04': 'Bentong, Cameron Highland, Lipis',
    'PHG05': 'Temerloh, Raub',
    'PHG06': 'Kuala Lipis, Raub, Cameron Highland',
  },
  'Terengganu': {
    'TRG01': 'Kuala Terengganu, Marang, Kuala Nerus',
    'TRG02': 'Besut, Setiu',
    'TRG03': 'Hulu Terengganu',
    'TRG04': 'Dungun, Kemaman',
  },
  'Kelantan': {
    'KTN01': 'Kota Bharu, Bachok, Machang, Pasir Puteh, Pasir Mas, Tumpat, Kuala Krai, Mukim Chiku',
    'KTN03': 'Gua Musang (Termasuk Daerah Lipis, Raub)',
  },
  'Sabah': {
    'SBH01': 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan',
    'SBH02': 'Bahagian Kudat, Kota Marudu, Pitas, Pulau Banggi',
    'SBH03': 'Bahagian Labuk Sugut, Kinabatangan, Beluran, Telupid, Tongod',
    'SBH04': 'Bahagian Pedalaman (Papar, Ranau, Kota Belud, Tuaran, Penampang)',
    'SBH05': 'Bahagian Pantai Barat, Kota Kinabalu',
    'SBH06': 'Bahagian Lahad Datu, Kunak',
    'SBH07': 'Bahagian Semporna, Tawau',
    'SBH08': 'Bahagian Keningau, Tambunan',
    'SBH09': 'Bahagian Beaufort, Kuala Penyu, Menumbok, Sipitang',
  },
  'Sarawak': {
    'SWK01': 'Limbang, Lawas, Sundar, Trusan',
    'SWK02': 'Miri, Niah, Bekenu, Sibuti, Marudi',
    'SWK03': 'Pusa, Betong, Spaoh, Saratok',
    'SWK04': 'Sarikei, Matu, Julau, Rajang, Daro, Belawai',
    'SWK05': 'Kapit, Song, Kanowit, Lamanak',
    'SWK06': 'Sibu, Mukah, Dalat, Oya, Balingian, Tatau',
    'SWK07': 'Bau, Lundu, Sematan',
    'SWK08': 'Kuching, Samarahan, Simunjan, Serian, Sebuyau, Meludam',
    'SWK09': 'Sri Aman, Lubok Antu, Betong',
  },
};

/**
 * Fetch prayer times from JAKIM API
 * @param zone - Prayer zone code (e.g., 'SGR01' for Selangor areas)
 * @returns Prayer times data
 */
export async function fetchPrayerTimes(zone: string = 'SGR01'): Promise<PrayerTimes | null> {
  try {
    const response = await fetch(
      `https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=today&zone=${zone}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }

    const data: JakimResponse = await response.json();

    if (data.status === 'OK!' && data.prayerTime && data.prayerTime.length > 0) {
      return data.prayerTime[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
}

/**
 * Get the next prayer time and name
 * @param prayerTimes - Prayer times object
 * @returns Object with next prayer name and time
 */
export function getNextPrayer(prayerTimes: PrayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayers = [
    { name: 'Imsak', time: prayerTimes.imsak },
    { name: 'Subuh', time: prayerTimes.fajr },
    { name: 'Syuruk', time: prayerTimes.syuruk },
    { name: 'Zohor', time: prayerTimes.dhuhr },
    { name: 'Asar', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isyak', time: prayerTimes.isha },
  ];

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeInMinutes = hours * 60 + minutes;

    if (currentTime < prayerTimeInMinutes) {
      return prayer;
    }
  }

  // If no prayer found today, return Imsak for tomorrow
  return { name: 'Imsak (Esok)', time: prayerTimes.imsak };
}

/**
 * Calculate time remaining until next prayer
 * @param prayerTime - Prayer time string (HH:MM)
 * @returns Time remaining in format "X jam Y minit"
 */
export function getTimeUntilPrayer(prayerTime: string): string {
  const now = new Date();
  const [hours, minutes] = prayerTime.split(':').map(Number);

  const prayerDate = new Date();
  prayerDate.setHours(hours, minutes, 0, 0);

  // If prayer time has passed today, set it for tomorrow
  if (prayerDate < now) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  const diff = prayerDate.getTime() - now.getTime();
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursLeft > 0) {
    return `${hoursLeft} jam ${minutesLeft} minit`;
  }
  return `${minutesLeft} minit`;
}

/**
 * Format date to Malaysian format
 * @param dateString - Date string from API
 * @returns Formatted date string
 */
export function formatMalaysianDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ms-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}