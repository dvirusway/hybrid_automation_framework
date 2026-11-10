import { randomInt, randomUUID } from 'node:crypto';

const DEFAULT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

export function uniqueId(prefix = 'test'): string {
  const normalizedPrefix = prefix.trim();
  if (normalizedPrefix === '') {
    throw new Error('ID prefix must not be empty.');
  }
  return `${normalizedPrefix}-${randomUUID()}`;
}

export function randomString(
  length: number,
  alphabet = DEFAULT_ALPHABET,
): string {
  assertPositiveInteger('length', length);
  if (alphabet.length < 2) {
    throw new Error('Random string alphabet must contain at least two characters.');
  }
  if (new Set(alphabet).size !== alphabet.length) {
    throw new Error('Random string alphabet must not contain duplicate characters.');
  }

  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');
}

export function randomInteger(minimum: number, maximum: number): number {
  if (
    !Number.isSafeInteger(minimum) ||
    !Number.isSafeInteger(maximum) ||
    minimum > maximum
  ) {
    throw new RangeError('Random integer bounds must be integers with minimum <= maximum.');
  }
  if (maximum - minimum >= 2 ** 48) {
    throw new RangeError('Random integer range must be smaller than 2^48.');
  }

  return randomInt(minimum, maximum + 1);
}

export function randomEmail(domain = 'example.test'): string {
  const normalizedDomain = domain.trim().toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalizedDomain)) {
    throw new Error(`Email domain is invalid: "${domain}".`);
  }

  return `qa-${randomString(12)}@${normalizedDomain}`;
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new RangeError('Cannot choose a random value from an empty collection.');
  }
  return items[randomInt(items.length)];
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function cloneData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneData(item)) as T;
  }

  const copy: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    copy[key] = cloneData(nestedValue);
  }
  return copy as T;
}
