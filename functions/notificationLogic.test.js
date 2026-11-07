import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  buildPrayerSummary,
  buildPushData,
  canSendNotifications,
  cleanCategory,
  cleanContent,
  cleanScheduleTime,
  cleanUrl,
  dayOfMonthInMalaysia,
  finalStatus,
  formatMYT12h,
  groupTokens,
  isInQuietHours,
  malaysiaDayRange,
  notificationsEnabled,
  pushTitle,
  quietHoursEnd,
  todayInMalaysia,
} from './notificationLogic.js';

test('content needs both title and body, trims and cuts long text', () => {
  assert.equal(cleanContent({ title: ' ', body: 'x' }), null);
  assert.equal(cleanContent({ title: 'a' }), null);
  const long = cleanContent({ title: ' Hi ', body: 'b'.repeat(500) });
  assert.equal(long.title, 'Hi');
  assert.equal(long.body.length, 300);
});

test('url only allows same-site paths', () => {
  assert.equal(cleanUrl('/derma'), '/derma');
  assert.equal(cleanUrl('/prayer-times?x=1'), '/prayer-times?x=1');
  assert.equal(cleanUrl('https://evil.com'), '/');
  assert.equal(cleanUrl('//evil.com'), '/');
  assert.equal(cleanUrl('javascript:alert(1)'), '/');
  assert.equal(cleanUrl(undefined), '/');
});

test('schedule time must be 1 minute to 60 days ahead', () => {
  const now = Date.parse('2026-11-07T00:00:00Z');
  assert.equal(cleanScheduleTime('2026-11-07T00:00:30Z', now), null);
  assert.equal(cleanScheduleTime('2026-11-07T00:05:00Z', now), Date.parse('2026-11-07T00:05:00Z'));
  assert.equal(cleanScheduleTime('2027-02-01T00:00:00Z', now), null);
  assert.equal(cleanScheduleTime('rubbish', now), null);
});

test('uses the Malaysian calendar date, not UTC', () => {
  assert.equal(todayInMalaysia(new Date('2026-11-06T20:00:00Z')), '2026-11-07');
  assert.equal(dayOfMonthInMalaysia(new Date('2026-11-30T17:00:00Z')), 1);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('Malaysian day range starts at 16:00 UTC the day before', () => {
  const { start, end } = malaysiaDayRange('2026-11-08');
  assert.equal(start.toISOString(), '2026-11-07T16:00:00.000Z');
  assert.equal(end.toISOString(), '2026-11-08T16:00:00.000Z');
});

test('quiet hours: overnight range and same-day range', () => {
  const overnight = { quietHoursEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '06:00' };
  assert.equal(isInQuietHours(overnight, new Date('2026-11-07T15:00:00Z')), true); // 23:00 MYT
  assert.equal(isInQuietHours(overnight, new Date('2026-11-06T21:59:00Z')), true); // 05:59 MYT
  assert.equal(isInQuietHours(overnight, new Date('2026-11-06T22:00:00Z')), false); // 06:00 MYT
  assert.equal(isInQuietHours({ ...overnight, quietHoursEnabled: false }, new Date('2026-11-07T15:00:00Z')), false);

  const daytime = { quietHoursEnabled: true, quietHoursStart: '13:00', quietHoursEnd: '14:00' };
  assert.equal(isInQuietHours(daytime, new Date('2026-11-07T05:30:00Z')), true); // 13:30 MYT
  assert.equal(isInQuietHours(daytime, new Date('2026-11-07T06:00:00Z')), false); // 14:00 MYT
});

test('quiet hours end rolls to the next morning when it is late evening', () => {
  const settings = { quietHoursEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '06:00' };
  // 23:00 MYT on 7 Nov → 06:00 MYT on 8 Nov
  assert.equal(new Date(quietHoursEnd(settings, new Date('2026-11-07T15:00:00Z'))).toISOString(), '2026-11-07T22:00:00.000Z');
  // 03:00 MYT on 8 Nov → 06:00 MYT same day
  assert.equal(new Date(quietHoursEnd(settings, new Date('2026-11-07T19:00:00Z'))).toISOString(), '2026-11-07T22:00:00.000Z');
});

test('prayer times format to Malaysian 12-hour', () => {
  assert.equal(formatMYT12h('05:52:00'), '5:52 PG');
  assert.equal(formatMYT12h('12:00'), '12:00 PTG');
  assert.equal(formatMYT12h('19:10:00'), '7:10 MLM');
  assert.equal(formatMYT12h('00:05'), '12:05 PG');
  assert.equal(
    buildPrayerSummary({ fajr: '05:52:00', dhuhr: '13:10:00', asr: '16:30:00', maghrib: '19:15:00', isha: '20:25:00' }),
    'Subuh 5:52 PG | Zohor 1:10 PTG | Asar 4:30 PTG | Maghrib 7:15 MLM | Isyak 8:25 MLM'
  );
});

test('tokens are de-duplicated but every saved copy is kept for cleanup', () => {
  const grouped = groupTokens([
    { token: 'a', ref: 'users/u1/fcmTokens/a', source: 'user' },
    { token: 'a', ref: 'guestTokens/a', source: 'guest' },
    { token: 'b', ref: 'guestTokens/b', source: 'guest' },
    { token: '', ref: 'guestTokens/empty', source: 'guest' },
  ]);
  assert.equal(grouped.length, 2);
  assert.deepEqual(grouped[0].refs, ['users/u1/fcmTokens/a', 'guestTokens/a']);
});

test('a notification with no devices still counts as sent', () => {
  assert.equal(finalStatus({ attempted: 0, sent: 0 }), 'sent');
  assert.equal(finalStatus({ attempted: 5, sent: 1 }), 'sent');
  assert.equal(finalStatus({ attempted: 5, sent: 0 }), 'failed');
});

test('category comes from the request, else from an announcements link, else general', () => {
  assert.equal(cleanCategory('prayer', '/'), 'prayer');
  assert.equal(cleanCategory(undefined, '/announcements'), 'announcement');
  assert.equal(cleanCategory('hack', '/derma'), 'general');
  assert.equal(cleanCategory('__proto__', '/'), 'general');
});

test('title gets the type label once, without repeating it', () => {
  assert.equal(pushTitle('Majlis Ilmu Malam Jumaat', 'announcement'), 'Pengumuman · Majlis Ilmu Malam Jumaat');
  assert.equal(pushTitle('Waktu Solat Hari Ini', 'prayer'), 'Waktu Solat Hari Ini');
  assert.equal(pushTitle('Aktiviti Esok: Gotong-royong', 'activity'), 'Aktiviti Esok: Gotong-royong');
});

test('push data carries the type and its button label', () => {
  const data = buildPushData('n1', { title: 'Peringatan Bulanan', body: 'b', url: '/derma', category: 'donation' }, 'https://x');
  assert.equal(data.title, 'Derma · Peringatan Bulanan');
  assert.equal(data.action, 'Derma sekarang');
  assert.equal(data.category, 'donation');
  assert.equal(data.tag, 'n1');
  assert.ok(Object.values(data).every(v => typeof v === 'string'));
});

test('master switch is on unless explicitly turned off', () => {
  assert.equal(notificationsEnabled(undefined), true);
  assert.equal(notificationsEnabled({}), true);
  assert.equal(notificationsEnabled({ notificationsEnabled: true }), true);
  assert.equal(notificationsEnabled({ notificationsEnabled: false }), false);
});

test('only active super admins or admins with Notifikasi add can send', () => {
  assert.equal(canSendNotifications({ role: 'super_admin', active: true }), true);
  assert.equal(canSendNotifications({ role: 'super_admin', active: false }), false);
  assert.equal(canSendNotifications({ role: 'admin', active: true }), false);
  assert.equal(canSendNotifications({ role: 'admin', active: true, permissions: { Notifikasi: { add: true } } }), true);
  assert.equal(canSendNotifications(undefined), false);
});
