import { getCurrency } from './currency';

export function formatCurrency(amount: number): string {
  const c = getCurrency();
  return new Intl.NumberFormat(c.locale, {
    style: 'currency',
    currency: c.code,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  const c = getCurrency();
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatCurrency(amount);
}

export function getCurrencySymbol(): string {
  return getCurrency().symbol;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    year: '2-digit',
  }).format(date).replace('.', '');
}

export function getMonthName(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMonthBounds(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(weekStart.getDate() + 6);
  const startStr = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(weekStart);
  const endStr = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(end);
  return `${startStr} – ${endStr}`;
}

export function isThisWeek(weekStart: Date): boolean {
  const thisWeek = getWeekStart(new Date());
  return weekStart.getTime() === thisWeek.getTime();
}

export function shiftWeek(weekStart: Date, weeks: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}
