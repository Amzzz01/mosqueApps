import { Timestamp } from 'firebase/firestore';

// GeoJSON types for map boundaries
export interface GeoJSONCoordinate {
  lat: number;
  lng: number;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [[[lng, lat], [lng, lat], ...]]
}

// Kawasan (Area/Zone) types
export interface Kawasan {
  id: string;
  name: string;
  color: string;
  boundaries: GeoJSONPolygon | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KawasanFormData {
  name: string;
  color: string;
  boundaries: GeoJSONPolygon | null;
  isActive: boolean;
}

// Anak Kariah (Parish Member) types
export type JantinaType = 'Lelaki' | 'Perempuan';
export type StatusType = 'aktif' | 'tidak_aktif';
export type DetectionMethodType = 'auto' | 'manual';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AnakKariah {
  id: string;
  namaPenuh: string;
  ic: string;
  alamat: string;
  coordinates: Coordinates | null;
  kawasanId: string;
  kawasanName: string;
  detectionMethod: DetectionMethodType;
  autoDetectedKawasan: string | null;
  telefon: string;
  jantina: JantinaType;
  tarikhLahir: Timestamp;
  status: StatusType;
  catatan?: string;
  activatedBy?: string | null;
  activatedAt?: Timestamp | null;
  deactivatedBy?: string | null;
  deactivatedAt?: Timestamp | null;
  lastModifiedBy?: string | null;
  lastModifiedAt?: Timestamp | null;
  isDeleted?: boolean;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AnakKariahFormData {
  namaPenuh: string;
  ic: string;
  alamat: string;
  coordinates: Coordinates | null;
  kawasanId: string;
  kawasanName: string;
  detectionMethod: DetectionMethodType;
  autoDetectedKawasan: string | null;
  telefon: string;
  jantina: JantinaType;
  tarikhLahir: Date;
  status: StatusType;
  catatan?: string;
}

// Statistics types
export interface KawasanStats {
  kawasanId: string;
  kawasanName: string;
  totalMembers: number;
  aktifMembers: number;
  tidakAktifMembers: number;
  color: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalKawasan: number;
  aktifMembers: number;
  tidakAktifMembers: number;
  recentRegistrations: number;
  membersByKawasan: KawasanStats[];
}