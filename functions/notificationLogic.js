// Pure rules for mosque notifications (no Firebase imports, so they can be unit tested).

export const TIME_ZONE = 'Asia/Kuala_Lumpur';
export const MAX_TITLE_LENGTH = 80;
export const MAX_BODY_LENGTH = 300;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const MYT_OFFSET_MS = 8 * 60 * MINUTE_MS; // Malaysia has no daylight saving
const MIN_SCHEDULE_LEAD_MS = 1 * MINUTE_MS;
const MAX_SCHEDULE_LEAD_MS = 60 * DAY_MS;

// ─── Content validation ───

const cleanText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
};

/** Returns { title, body } or null when either is missing. Long text is cut, not rejected. */
export const cleanContent = (raw) => {
  const title = cleanText(raw?.title, MAX_TITLE_LENGTH);
  const body = cleanText(raw?.body, MAX_BODY_LENGTH);
  return title && body ? { title, body } : null;
};

/** Only same-site paths, so a notification can never send someone to another website. */
export const cleanUrl = (url) => {
  if (typeof url !== 'string') return '/';
  const path = url.trim();
  return /^\/(?!\/)[^\s\\]*$/.test(path) ? path : '/';
};

/** Returns the time in ms, or null if unreadable, too soon or more than 60 days ahead. */
export const cleanScheduleTime = (value, now) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return time >= now + MIN_SCHEDULE_LEAD_MS && time <= now + MAX_SCHEDULE_LEAD_MS ? time : null;
};

export const isValidId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);

// ─── Malaysia time helpers ───

/** Calendar date in Malaysia as 'YYYY-MM-DD'. */
export const todayInMalaysia = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);

/** 'YYYY-MM' in Malaysia. */
export const monthInMalaysia = (now = new Date()) => todayInMalaysia(now).slice(0, 7);

/** Day of month in Malaysia (1–31). */
export const dayOfMonthInMalaysia = (now = new Date()) => Number(todayInMalaysia(now).slice(8, 10));

export const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** [start, end) of a Malaysian calendar day as real Date objects, for Firestore range queries. */
export const malaysiaDayRange = (isoDate) => {
  const start = new Date(new Date(`${isoDate}T00:00:00Z`).getTime() - MYT_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
};

const parseHHMM = (value) => {
  const match = typeof value === 'string' && value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes >= 0 && minutes < 24 * 60 ? minutes : null;
};

const minuteOfDayInMalaysia = (now) => {
  const myt = new Date(now.getTime() + MYT_OFFSET_MS);
  return myt.getUTCHours() * 60 + myt.getUTCMinutes();
};

/** True when quiet hours are switched on and `now` falls inside them (overnight ranges supported). */
export const isInQuietHours = (settings, now = new Date()) => {
  if (!settings?.quietHoursEnabled) return false;
  const start = parseHHMM(settings.quietHoursStart ?? '22:00');
  const end = parseHHMM(settings.quietHoursEnd ?? '06:00');
  if (start === null || end === null || start === end) return false;

  const current = minuteOfDayInMalaysia(now);
  return start < end ? current >= start && current < end : current >= start || current < end;
};

/** The next moment quiet hours end, as ms. Only meaningful when isInQuietHours() is true. */
export const quietHoursEnd = (settings, now = new Date()) => {
  const end = parseHHMM(settings?.quietHoursEnd ?? '06:00') ?? 6 * 60;
  const today = todayInMalaysia(now);
  const todayEnd = malaysiaDayRange(today).start.getTime() + end * MINUTE_MS;
  return todayEnd > now.getTime() ? todayEnd : todayEnd + DAY_MS;
};

/** '13:05:00' → '1:05 PTG' (PG = 00–11, PTG = 12–17, MLM = 18–23). */
export const formatMYT12h = (timeHHMM) => {
  const minutes = parseHHMM(timeHHMM);
  if (minutes === null) return String(timeHHMM ?? '');
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'PG' : h < 18 ? 'PTG' : 'MLM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export const buildPrayerSummary = (times) =>
  [
    ['Subuh', times.fajr],
    ['Zohor', times.dhuhr],
    ['Asar', times.asr],
    ['Maghrib', times.maghrib],
    ['Isyak', times.isha],
  ]
    .map(([name, time]) => `${name} ${formatMYT12h(time)}`)
    .join(' | ');

// ─── Tokens & push payload ───

/**
 * Groups token docs by token string. The first doc is the one we send to;
 * every doc is kept so a dead token can be removed everywhere it was saved.
 * Input: [{ token, ref, source }]. Output: [{ token, refs, source }].
 */
export const groupTokens = (tokenDocs) => {
  const byToken = new Map();
  for (const doc of tokenDocs) {
    if (typeof doc.token !== 'string' || !doc.token) continue;
    const entry = byToken.get(doc.token);
    if (entry) entry.refs.push(doc.ref);
    else byToken.set(doc.token, { token: doc.token, refs: [doc.ref], source: doc.source });
  }
  return [...byToken.values()];
};

export const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

// ─── Notification types (label shown at the start of the title, plus the main button) ───

export const CATEGORIES = {
  announcement: { label: 'Pengumuman', action: 'Baca' },
  prayer: { label: 'Waktu Solat', action: 'Lihat waktu' },
  activity: { label: 'Aktiviti', action: 'Lihat butiran' },
  donation: { label: 'Derma', action: 'Derma sekarang' },
  general: { label: 'Makluman', action: 'Buka' },
};

/** A known category, else one worked out from the link (announcements), else 'general'. */
export const cleanCategory = (category, url) => {
  if (typeof category === 'string' && Object.hasOwn(CATEGORIES, category)) return category;
  if (typeof url === 'string' && url.startsWith('/announcements')) return 'announcement';
  return 'general';
};

/** 'Pengumuman · Majlis Ilmu', unless the title already starts with the label ('Waktu Solat Hari Ini'). */
export const pushTitle = (title, category) => {
  const { label } = CATEGORIES[category] ?? CATEGORIES.general;
  return title.toLowerCase().startsWith(label.toLowerCase()) ? title : `${label} · ${title}`;
};

/** All FCM data values must be strings. Keys match worker/index.js. */
export const buildPushData = (notifId, { title, body, url, category }, baseUrl) => {
  const type = cleanCategory(category, url);
  return {
    title: pushTitle(title, type),
    body,
    url: url || '/',
    link: url || '/',
    category: type,
    action: CATEGORIES[type].action,
    notifId: notifId || '',
    tag: notifId || 'masjid-notification',
    icon: `${baseUrl}/icons/icon-192x192.png`,
    badge: `${baseUrl}/icons/badge-72x72.png`,
  };
};

/** Final status of a delivered notification. No devices still counts as sent (it shows in the in-app list). */
export const finalStatus = ({ attempted, sent }) => (attempted === 0 || sent > 0 ? 'sent' : 'failed');

// ─── Master switch ───

/** The super admin's master switch. Missing means on, so existing setups keep working. */
export const notificationsEnabled = (settings) => settings?.notificationsEnabled !== false;

// ─── Admin access ───

/** adminUsers/{uid} data → may this admin send notifications? */
export const canSendNotifications = (admin) => {
  if (!admin || admin.active === false) return false;
  if (admin.role === 'super_admin') return true;
  return admin.permissions?.Notifikasi?.add === true;
};
