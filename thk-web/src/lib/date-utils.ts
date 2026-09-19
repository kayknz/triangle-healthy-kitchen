/**
 * AUTHORITATIVE DATE UTILITIES (Asia/Qatar)
 * Use these for all operational calculations to avoid UTC day-shift errors.
 */

const QATAR_TIMEZONE = 'Asia/Qatar';

/**
 * Returns the current date in Qatar as a string (YYYY-MM-DD).
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
 * Adds or subtracts days from a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
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
