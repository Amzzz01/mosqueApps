// src/lib/utils/validators.ts

/**
 * Validate Malaysian IC Number
 * Format: 123456-12-1234
 */
export function validateICNumber(ic: string): boolean {
  const icRegex = /^\d{6}-\d{2}-\d{4}$/;
  return icRegex.test(ic);
}

/**
 * Validate Malaysian Phone Number
 * Format: 01X-XXXXXXX or 01X-XXXXXXXX
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^01[0-9]-\d{7,8}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate Email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}