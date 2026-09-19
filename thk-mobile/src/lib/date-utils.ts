/**
 * AUTHORITATIVE DATE UTILITIES (Asia/Qatar)
 * Use these for all operational calculations to avoid UTC day-shift errors.
 */

const QATAR_TIMEZONE = 'Asia/Qatar';

/**
 * Returns the current date in Qatar as a string (YYYY-MM-DD).
 * Useful for operational/business keys in the database.
 */
export function getQatarDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: QATAR_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Returns the day of the week in Qatar (0-6, where 0 is Sunday).
 */
export function getQatarDayOfWeek(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: QATAR_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(date);

  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value);

  const localDate = new Date(year, month, day, hour);
  return localDate.getDay();
}

/**
 * Formats a date for localized display in Qatar (e.g., "Sept 21, 2026, 10:00 AM").
 * Use this for user-facing UI labels only.
 */
export function formatQatarDisplay(date: Date, locale: 'en' | 'ar' = 'en'): string {
  const language = locale === 'ar' ? 'ar-QA' : 'en-US';
  return new Intl.DateTimeFormat(language, {
    timeZone: QATAR_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Checks if a specific business deadline has passed according to the Qatar calendar.
 */
export function isDeadlinePassed(deadlineDate: Date): boolean {
  return new Date().getTime() > deadlineDate.getTime();
}

/**
 * Returns a standard ISO 8601 timestamp in UTC.
 * Use this for all database 'created_at' and absolute event logs.
 */
export function getUTCISO(): string {
  return new Date().toISOString();
}

/**
 * Adds or subtracts days from a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns a Date object representing the start of the day in Qatar time.
 */
export function getQatarStartOfDay(date: Date = new Date()): string {
  const qatarDate = getQatarDate(date);
  return `${qatarDate}T00:00:00+03:00`;
}

/**
 * Returns a Date object representing the end of the day in Qatar time.
 */
export function getQatarEndOfDay(date: Date = new Date()): string {
  const qatarDate = getQatarDate(date);
  return `${qatarDate}T23:59:59+03:00`;
}

/**
 * Utility to calculate days remaining until a deadline in Qatar time
 */
export function getDaysRemaining(deadlineIso: string): number {
  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
