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
