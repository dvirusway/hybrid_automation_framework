const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

function requireValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Date value is invalid.');
  }
}

export function addDays(date: Date, amount: number): Date {
  requireValidDate(date);
  if (!Number.isInteger(amount)) {
    throw new RangeError('Day offset must be an integer.');
  }

  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function startOfDay(date: Date): Date {
  requireValidDate(date);
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  requireValidDate(date);
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function formatDate(date: Date, locale = 'en-US'): string {
  requireValidDate(date);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function toIsoDate(date: Date): string {
  requireValidDate(date);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(first: Date, second: Date): number {
  requireValidDate(first);
  requireValidDate(second);
  const firstDay = Date.UTC(first.getFullYear(), first.getMonth(), first.getDate());
  const secondDay = Date.UTC(second.getFullYear(), second.getMonth(), second.getDate());
  return Math.round((secondDay - firstDay) / MILLISECONDS_PER_DAY);
}

export function isWithinRange(
  value: Date,
  start: Date,
  end: Date,
  inclusive = true,
): boolean {
  requireValidDate(value);
  requireValidDate(start);
  requireValidDate(end);
  if (start > end) {
    throw new RangeError('Range start must not be after range end.');
  }

  return inclusive ? value >= start && value <= end : value > start && value < end;
}
