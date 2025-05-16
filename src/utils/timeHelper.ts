import { DateTime } from 'luxon';

// Converts a local date/time to a UTC date/time in a specific timezone
// e.g "2025-05-01 19:00" in "America/New_York" to "2025-05-01T23:00:00Z" (UTC)
const convertFromTimezoneToUtc = (date: string | Date, timezone: string): Date | null => {
  if (!date) return null;

  // If input is a Date, convert to ISO string for consistency
  const isoString = typeof date === 'string' ? date : date.toISOString();
  // Parse the date in the given timezone, then convert to UTC
  const dt = DateTime.fromISO(isoString, { zone: timezone });
  return dt.toUTC().toJSDate();
};

// Converts a UTC date/time to a local date/time in a specific timezone
// e.g UTC date "2025-05-01T23:00:00Z" to "2025-05-01 19:00" in "America/New_York"
const convertFromUtcToTimezone = (date: string | Date, timezone: string): Date | null => {
  if (!date) return null;
  const dt = DateTime.fromJSDate(new Date(date), { zone: timezone });
  return dt.toJSDate();
};

export const timeHelper = {
  convertFromTimezoneToUtc,
  convertFromUtcToTimezone,
};
