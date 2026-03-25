export interface Permission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type AdminPermissions = Record<string, Permission>;

export const ADMIN_MODULES = [
  'Dashboard',
  'Pengurusan Ahli',
  'Derma',
  'Jadual Kuliah',
  'Galeri Aktiviti',
  'Quotes',
  'Pengumuman',
  'Notifikasi',
] as const;

export const DEFAULT_PERMISSIONS: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, { view: true, add: false, edit: false, delete: false }])
);

export const FULL_PERMISSIONS: AdminPermissions = Object.fromEntries(
  ADMIN_MODULES.map(m => [m, { view: true, add: true, edit: true, delete: true }])
);
