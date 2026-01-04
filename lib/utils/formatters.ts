// lib/utils/formatters.ts
// Malaysian-specific formatting utilities

/**
 * Format Malaysian IC Number
 * Format: 123456-12-1234
 */
export function formatICNumber(ic: string): string {
  // Remove all non-digits
  const cleaned = ic.replace(/\D/g, '');
  
  // Format as 123456-12-1234
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }
  
  return ic;
}

/**
 * Format Malaysian Phone Number
 * Format: 01X-XXXXXXX or 01X-XXXXXXXX
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as 01X-XXXXXXX (10 digits) or 01X-XXXXXXXX (11 digits)
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  return phone;
}

/**
 * Format currency in Malaysian Ringgit
 * Format: RM 1,234.56
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date in Malaysian format
 * Format: DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time in Malaysian format
 * Format: DD/MM/YYYY HH:MM
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Parse formatted IC number back to plain digits
 */
export function parseICNumber(formattedIC: string): string {
  return formattedIC.replace(/\D/g, '');
}

/**
 * Parse formatted phone number back to plain digits
 */
export function parsePhoneNumber(formattedPhone: string): string {
  return formattedPhone.replace(/\D/g, '');
}