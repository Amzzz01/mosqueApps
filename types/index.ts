// Type definitions for Mosque Management System

import { Timestamp } from 'firebase/firestore';

// Donation Types
export interface Donation {
  id?: string;
  donorId: string; // Reference to member ID
  donorName: string;
  amount: number;
  category: 'zakat' | 'sedekah' | 'derma' | 'wakaf' | 'fitrah' | 'other';
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'online';
  referenceNumber?: string;
  notes?: string;
  date: Date | Timestamp;
  createdBy: string; // Admin ID
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Kariah Area Types
export interface KariahArea {
  id?: string;
  name: string;
  code: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  }[];
  memberCount?: number;
  color?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Announcement Types
export interface Announcement {
  id?: string;
  title: string;
  content: string;
  category: 'general' | 'event' | 'urgent' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  published: boolean;
  author: string; // Admin name
  authorId: string; // Admin ID
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Activity Types
export interface Activity {
  id?: string;
  name: string;
  description: string;
  category: 'religious' | 'education' | 'social' | 'charity' | 'other';
  date: Date | Timestamp;
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  location: string;
  capacity?: number;
  registeredCount?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Schedule Types (Recurring programs)
export interface Schedule {
  id?: string;
  name: string;
  description: string;
  type: 'weekly' | 'monthly' | 'daily';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // Format: "HH:MM"
  duration: number; // in minutes
  location: string;
  instructor?: string;
  active: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Event Types
export interface Event {
  id?: string;
  title: string;
  description: string;
  type: 'fundraising' | 'seminar' | 'competition' | 'celebration' | 'other';
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  location: string;
  organizer: string;
  contactPerson: string;
  contactNumber: string;
  registrationRequired: boolean;
  registrationDeadline?: Date | Timestamp;
  maxParticipants?: number;
  currentParticipants?: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Admin User Types
export interface AdminUser {
  id?: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'staff';
  permissions: string[];
  active: boolean;
  lastLogin?: Date | Timestamp;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Mosque Settings Types
export interface MosqueSettings {
  id?: string;
  mosqueName: string;
  arabicName?: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  phoneNumber: string;
  email: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  prayerZone: string; // e.g., "SGR01"
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  logoUrl?: string;
  updatedAt: Date | Timestamp;
}

// Prayer Times Types (from JAKIM API)
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

// Statistics Types
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalDonations: number;
  monthlyDonations: number;
  totalKariahAreas: number;
  recentActivities: number;
}

// Lecture Schedule Types (Jadual Kuliah) — legacy
export interface Kuliah {
  id?: string;
  tajuk: string;
  penceramah: string;
  hari: string;
  masa: string;
  lokasi: string;
  kategori: 'quran' | 'hadis' | 'fiqh' | 'akhlak' | 'umum';
  keterangan?: string;
  aktif: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Jadual Kuliah v2
export interface JadualKuliah {
  id?: string;
  title: string;
  day: string; // Isnin, Selasa, Rabu, Khamis, Jumaat, Sabtu, Ahad
  weekOfMonth: string[]; // ['Semua'] or ['Pertama','Kedua','Ketiga','Keempat']
  timeType: 'fixed' | 'afterPrayer';
  fixedTime?: string | null; // HH:MM format
  prayerReference?: 'Subuh' | 'Zohor' | 'Asar' | 'Maghrib' | 'Isyak' | null;
  minutesAfterPrayer?: number | null;
  category: string; // reference to KategoriKuliah name
  ustaz: string;
  venue: string;
  description?: string;
  posterUrl?: string | null;
  sequence: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface KategoriKuliah {
  id?: string;
  name: string;
  color: string; // hex color e.g. '#10b981'
  sequence: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
}

// Activity Gallery Types (Galeri Aktiviti)
export interface Aktiviti {
  id?: string;
  tajuk: string;
  keterangan: string;
  tarikh: Date | Timestamp;
  kategori: 'keagamaan' | 'pendidikan' | 'kemasyarakatan' | 'kebajikan' | 'lain';
  gambarUrls: string[];
  published: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Filter Types
export interface DonationFilter {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  donorId?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}