// Utility Functions
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Malaysian IC Number (e.g., 920101-01-1234)
 */
export function formatICNumber(ic: string): string {
  const cleaned = ic.replace(/\D/g, '');
  if (cleaned.length !== 12) return ic;
  
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
}

/**
 * Validate Malaysian IC Number
 */
export function validateICNumber(ic: string): boolean {
  const cleaned = ic.replace(/\D/g, '');
  if (cleaned.length !== 12) return false;
  
  // Basic validation: check if it's 12 digits
  const year = parseInt(cleaned.slice(0, 2));
  const month = parseInt(cleaned.slice(2, 4));
  const day = parseInt(cleaned.slice(4, 6));
  
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * Format phone number (Malaysian format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Mobile format: 01X-XXX XXXX
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  // Landline format: 0X-XXXX XXXX
  if (cleaned.startsWith('0') && cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Validate Malaysian phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Mobile: 01X-XXXXXXX (10 digits)
  if (cleaned.startsWith('01') && cleaned.length === 10) return true;
  
  // Landline: 0X-XXXXXXXX (9 digits)
  if (cleaned.startsWith('0') && cleaned.length === 9) return true;
  
  return false;
}

/**
 * Format currency (Malaysian Ringgit)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
}

/**
 * Format date (Malaysian format)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date and time (Malaysian format)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate random color (for kariah areas)
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get month name in Malay
 */
export function getMonthNameMalay(month: number): string {
  const months = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];
  return months[month];
}

/**
 * Get day name in Malay
 */
export function getDayNameMalay(day: number): string {
  const days = [
    'Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'
  ];
  return days[day];
}

/**
 * Sleep function (for delays)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}