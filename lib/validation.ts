/**
 * Validate Malaysian IC number format
 * Format: YYMMDD-PB-XXXX
 * Example: 890101-01-1234
 */
export function validateIC(ic: string): boolean {
  // Remove all spaces and dashes
  const cleanIC = ic.replace(/[\s-]/g, '');

  // Must be exactly 12 digits
  if (cleanIC.length !== 12 || !/^\d+$/.test(cleanIC)) {
    return false;
  }

  // Extract components
  const year = cleanIC.substring(0, 2);
  const month = cleanIC.substring(2, 4);
  const day = cleanIC.substring(4, 6);

  // Validate month (01-12)
  const monthNum = parseInt(month, 10);
  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  // Validate day (01-31)
  const dayNum = parseInt(day, 10);
  if (dayNum < 1 || dayNum > 31) {
    return false;
  }

  return true;
}

/**
 * Format IC number to standard format: YYMMDD-PB-XXXX
 */
export function formatIC(ic: string): string {
  // Remove all spaces and dashes
  const cleanIC = ic.replace(/[\s-]/g, '');

  if (cleanIC.length !== 12) {
    return ic; // Return original if not valid length
  }

  // Format: YYMMDD-PB-XXXX
  return `${cleanIC.substring(0, 6)}-${cleanIC.substring(6, 8)}-${cleanIC.substring(8, 12)}`;
}

/**
 * Validate Malaysian phone number
 * Formats accepted:
 * - 012-3456789
 * - 0123456789
 * - 60123456789
 * - +60123456789
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all spaces, dashes, and plus signs
  const cleanPhone = phone.replace(/[\s\-+]/g, '');

  // Must be digits only
  if (!/^\d+$/.test(cleanPhone)) {
    return false;
  }

  // Check for valid Malaysian phone formats
  // Starting with 01 (10-11 digits total)
  if (cleanPhone.startsWith('01')) {
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  // Starting with 60 (country code - 11-12 digits total)
  if (cleanPhone.startsWith('60')) {
    return cleanPhone.length >= 11 && cleanPhone.length <= 12;
  }

  return false;
}

/**
 * Format phone number to standard format: 01X-XXXXXXX
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all spaces, dashes, and plus signs
  let cleanPhone = phone.replace(/[\s\-+]/g, '');

  // Remove country code if present
  if (cleanPhone.startsWith('60')) {
    cleanPhone = '0' + cleanPhone.substring(2);
  }

  // Format: 01X-XXXXXXX or 01X-XXXXXXXX
  if (cleanPhone.length === 10) {
    return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3)}`;
  } else if (cleanPhone.length === 11) {
    return `${cleanPhone.substring(0, 3)}-${cleanPhone.substring(3)}`;
  }

  return phone; // Return original if not valid format
}

/**
 * Get age from IC number
 */
export function getAgeFromIC(ic: string): number | null {
  const cleanIC = ic.replace(/[\s-]/g, '');
  
  if (cleanIC.length !== 12) {
    return null;
  }

  const yearStr = cleanIC.substring(0, 2);
  const month = parseInt(cleanIC.substring(2, 4), 10);
  const day = parseInt(cleanIC.substring(4, 6), 10);

  // Determine century (assume <30 is 2000s, >=30 is 1900s)
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const previousCentury = currentCentury - 100;
  
  const year = parseInt(yearStr, 10);
  const fullYear = year < 30 ? currentCentury + year : previousCentury + year;

  const birthDate = new Date(fullYear, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get birth date from IC number
 */
export function getBirthDateFromIC(ic: string): Date | null {
  const cleanIC = ic.replace(/[\s-]/g, '');
  
  if (cleanIC.length !== 12) {
    return null;
  }

  const yearStr = cleanIC.substring(0, 2);
  const month = parseInt(cleanIC.substring(2, 4), 10);
  const day = parseInt(cleanIC.substring(4, 6), 10);

  // Determine century
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const previousCentury = currentCentury - 100;
  
  const year = parseInt(yearStr, 10);
  const fullYear = year < 30 ? currentCentury + year : previousCentury + year;

  return new Date(fullYear, month - 1, day);
}

/**
 * Auto-format IC as user types
 */
export function autoFormatIC(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 12 digits
  const limited = digits.substring(0, 12);
  
  // Add dashes at appropriate positions
  if (limited.length <= 6) {
    return limited;
  } else if (limited.length <= 8) {
    return `${limited.substring(0, 6)}-${limited.substring(6)}`;
  } else {
    return `${limited.substring(0, 6)}-${limited.substring(6, 8)}-${limited.substring(8)}`;
  }
}

/**
 * Auto-format phone number as user types
 */
export function autoFormatPhone(value: string): string {
  // Remove all non-digits
  let digits = value.replace(/\D/g, '');
  
  // Remove country code if present
  if (digits.startsWith('60')) {
    digits = '0' + digits.substring(2);
  }
  
  // Limit to 11 digits
  const limited = digits.substring(0, 11);
  
  // Add dash after 3rd digit
  if (limited.length <= 3) {
    return limited;
  } else {
    return `${limited.substring(0, 3)}-${limited.substring(3)}`;
  }
}

/**
 * Validate date is not in the future
 */
export function validateBirthDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date <= today;
}

/**
 * Validate minimum age
 */
export function validateMinimumAge(birthDate: Date, minAge: number = 0): boolean {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return (age - 1) >= minAge;
  }
  
  return age >= minAge;
}