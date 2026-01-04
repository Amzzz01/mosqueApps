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

// Selangor zones - you can expand this list
export const SELANGOR_ZONES = {
  'SGR01': 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Rawang, S.Alam',
  'SGR02': 'Kuala Selangor, Sabak Bernam',
  'SGR03': 'Klang, Kuala Langat',
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