/**
 * Date helper utilities for consistent local timezone handling
 * Prevents UTC vs Local timezone mismatches (e.g., UTC-based startsWith vs local calendar dates)
 */

export function formatLocalDate(dateInput: Date | string): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return String(dateInput).slice(0, 10);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalMonth(dateInput: Date | string): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return String(dateInput).slice(0, 7);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatLocalTime(dateInput: Date | string): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDisplayDate(dateInput: Date | string): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function getTodayDateStr(): string {
  return formatLocalDate(new Date());
}

export function getYesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

export function getCurrentMonthStr(): string {
  return formatLocalMonth(new Date());
}

export function isSessionOnDate(paymentDate: string, targetDateStr: string): boolean {
  if (!paymentDate || !targetDateStr) return false;
  return formatLocalDate(paymentDate) === targetDateStr;
}

export function isSessionInMonth(paymentDate: string, targetMonthStr: string): boolean {
  if (!paymentDate || !targetMonthStr) return false;
  return formatLocalMonth(paymentDate) === targetMonthStr;
}
