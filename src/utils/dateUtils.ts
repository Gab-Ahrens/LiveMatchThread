/**
 * Date Utility Functions
 *
 * Provides consistent date formatting throughout the application
 */
import { DateTime } from "luxon";

// Constants for time zones
export const TIMEZONE_AMSTERDAM = "Europe/Amsterdam";
export const TIMEZONE_BRASILIA = "America/Sao_Paulo";
export const TIMEZONE_UTC = "utc";

/**
 * Formats a date for console output (Amsterdam time)
 */
export function formatConsoleTime(date: Date | string): string {
  const amsterdamTime = DateTime.fromISO(date.toString(), {
    zone: TIMEZONE_UTC,
  }).setZone(TIMEZONE_AMSTERDAM);

  return amsterdamTime.toFormat("cccc, dd MMM yyyy 'at' HH:mm:ss (z)");
}

/**
 * Formats a date for thread content (Brasilia time)
 */
export function formatThreadTime(date: Date | string): string {
  const brasiliaTime = DateTime.fromISO(date.toString(), { zone: TIMEZONE_UTC })
    .setZone(TIMEZONE_BRASILIA)
    .setLocale("pt-BR");

  return brasiliaTime.toFormat("cccc, dd 'de' LLLL 'de' yyyy 'às' HH:mm");
}

/**
 * Formats a DateTime object for console display with timezone information
 */
export function formatDateTimeForConsole(dateTime: DateTime): string {
  // Convert to Amsterdam time for console display
  const amsterdamTime = dateTime.setZone(TIMEZONE_AMSTERDAM);

  return (
    amsterdamTime.toFormat("cccc, dd MMM yyyy 'at' HH:mm:ss") +
    ` (${amsterdamTime.toFormat("z")})`
  );
}

/**
 * Converts a DateTime from one zone to another
 */
export function convertTimeZone(
  dateTime: DateTime,
  targetZone: string
): DateTime {
  return dateTime.setZone(targetZone);
}
