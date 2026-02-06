import { Timestamp } from 'firebase/firestore';

/**
 * Format date to Malaysian format: DD/MM/YYYY
 */
export function formatMalaysianDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date with time: DD/MM/YYYY HH:MM
 */
export function formatMalaysianDateTime(date: Date): string {
  const dateStr = formatMalaysianDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format Timestamp to Malaysian date
 */
export function formatFirestoreDate(timestamp: Timestamp): string {
  return formatMalaysianDate(timestamp.toDate());
}

/**
 * Format Timestamp to Malaysian date with time
 */
export function formatFirestoreDateTime(timestamp: Timestamp): string {
  return formatMalaysianDateTime(timestamp.toDate());
}

/**
 * Format currency to Malaysian Ringgit
 * Example: 1000 -> RM 1,000.00
 */
export function formatMalaysianCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format number with thousand separators
 * Example: 1000 -> 1,000
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ms-MY').format(num);
}

/**
 * Get relative time (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Baru sahaja';
  } else if (diffMin < 60) {
    return `${diffMin} minit lalu`;
  } else if (diffHour < 24) {
    return `${diffHour} jam lalu`;
  } else if (diffDay === 1) {
    return 'Semalam';
  } else if (diffDay < 7) {
    return `${diffDay} hari lalu`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks} minggu lalu`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months} bulan lalu`;
  } else {
    const years = Math.floor(diffDay / 365);
    return `${years} tahun lalu`;
  }
}

/**
 * Format time only: HH:MM
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Format day name in Malay
 */
export function getMalayDayName(date: Date): string {
  const days = [
    'Ahad',
    'Isnin',
    'Selasa',
    'Rabu',
    'Khamis',
    'Jumaat',
    'Sabtu'
  ];
  
  return days[date.getDay()];
}

/**
 * Format month name in Malay
 */
export function getMalayMonthName(date: Date): string {
  const months = [
    'Januari',
    'Februari',
    'Mac',
    'April',
    'Mei',
    'Jun',
    'Julai',
    'Ogos',
    'September',
    'Oktober',
    'November',
    'Disember'
  ];
  
  return months[date.getMonth()];
}

/**
 * Format full date in Malay: Isnin, 1 Januari 2024
 */
export function formatFullMalayDate(date: Date): string {
  const dayName = getMalayDayName(date);
  const day = date.getDate();
  const monthName = getMalayMonthName(date);
  const year = date.getFullYear();
  
  return `${dayName}, ${day} ${monthName} ${year}`;
}