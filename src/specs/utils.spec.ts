import { expect, test } from '../fixture';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { authStatePath } from '../support/auth/auth-state';
import { getEnvironmentConfig } from '../config/environment';
import {
  cloneData,
  pickRandom,
  randomEmail,
  randomInteger,
  randomString,
  shuffle,
  uniqueId,
} from '../utils/data-factory';
import { addDays, daysBetween, isWithinRange, toIsoDate } from '../utils/date';
import { Logger, type LogRecord } from '../utils/logger';
import { PollTimeoutError, waitFor } from '../utils/poll';
import {
  readJsonFile,
  readTextFile,
  writeJsonFileAtomically,
  writeTextFile,
} from '../utils/file';

test.describe('data factory', () => {
  test('generates unique identifiers and valid example email addresses', () => {
    const firstId = uniqueId('account');
    const secondId = uniqueId('account');
    expect(firstId).toMatch(/^account-[\da-f-]{36}$/);
    expect(secondId).not.toBe(firstId);
    expect(randomEmail()).toMatch(/^qa-[a-z\d]{12}@example\.test$/);
  });

  test('honors random value bounds and rejects invalid input', () => {
    expect(randomString(12)).toMatch(/^[a-z\d]{12}$/);
    expect(randomInteger(4, 4)).toBe(4);
    expect([1, 2, 3]).toContain(pickRandom([1, 2, 3]));
    expect(shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
    expect(() => randomString(0)).toThrow(RangeError);
    expect(() => pickRandom([])).toThrow(RangeError);
    expect(() => randomInteger(3, 2)).toThrow(RangeError);
  });

  test('clones nested data without retaining mutable references', () => {
    const original = { profile: { labels: ['smoke'] } };
    const copy = cloneData(original);
    copy.profile.labels.push('api');

    expect(original.profile.labels).toEqual(['smoke']);
    expect(copy.profile.labels).toEqual(['smoke', 'api']);
  });
});

test.describe('date helpers', () => {
  test('calculates calendar-day offsets without mutating the input', () => {
    const start = new Date('2025-01-31T12:00:00.000Z');
    const nextDay = addDays(start, 1);

    expect(toIsoDate(nextDay)).toBe('2025-02-01');
    expect(daysBetween(start, nextDay)).toBe(1);
    expect(start.toISOString()).toBe('2025-01-31T12:00:00.000Z');
  });

  test('checks date ranges with explicit inclusive boundaries', () => {
    const start = new Date('2025-06-01T00:00:00Z');
    const end = new Date('2025-06-30T23:59:59Z');
    expect(isWithinRange(start, start, end)).toBe(true);
    expect(isWithinRange(start, start, end, false)).toBe(false);
    expect(() => isWithinRange(start, end, start)).toThrow(RangeError);
  });
});

test.describe('polling and logging helpers', () => {
  test('polls until a condition succeeds', async () => {
    let value = 0;
    const result = await waitFor(
      () => {
        value += 1;
        return value;
      },
      (candidate) => candidate === 3,
      { intervalMs: 1, timeoutMs: 100, description: 'counter to reach three' },
    );

    expect(result).toBe(3);
  });

  test('reports timeout details when a condition never succeeds', async () => {
    await expect(
      waitFor(() => 'pending', (value) => value === 'ready', {
        intervalMs: 1,
        timeoutMs: 5,
        description: 'a service to become ready',
      }),
    ).rejects.toBeInstanceOf(PollTimeoutError);
  });

  test('scopes structured log records and filters levels', () => {
    const records: LogRecord[] = [];
    const logger = new Logger('spec', 'warn', (record) => records.push(record));
    logger.info('filtered');
    logger.child('api').warn('request failed', { status: 503 });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      level: 'warn',
      scope: 'spec.api',
      message: 'request failed',
      data: { status: 503 },
    });
    expect(Number.isNaN(Date.parse(records[0].timestamp))).toBe(false);
  });
});

test('file helpers round-trip JSON and text and auth paths reject unsafe names', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hybrid-automation-'));
  try {
    const jsonPath = join(directory, 'nested', 'state.json');
    const textPath = join(directory, 'notes.txt');
    await writeJsonFileAtomically(jsonPath, { ready: true, count: 2 });
    await writeTextFile(textPath, 'test data');

    await expect(readJsonFile<{ ready: boolean; count: number }>(jsonPath)).resolves.toEqual({
      ready: true,
      count: 2,
    });
    await expect(readTextFile(textPath)).resolves.toBe('test data');
    expect(authStatePath('chromium')).toMatch(/chromium\.json$/);
    expect(() => authStatePath('../outside')).toThrow(/Invalid project name/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('environment settings can be read from an explicit environment', () => {
  const config = getEnvironmentConfig({
    UI_BASE_URL: 'https://ui.example.test/',
    API_BASE_URL: 'https://api.example.test/v1',
    API_TIMEOUT_MS: '12000',
    EXPECT_TIMEOUT_MS: '2000',
    PW_RETRIES: '1',
    PW_WORKERS: '3',
  });

  expect(config).toEqual({
    uiBaseUrl: 'https://ui.example.test',
    apiBaseUrl: 'https://api.example.test/v1',
    requestTimeoutMs: 12_000,
    expectTimeoutMs: 2_000,
    retries: 1,
    workers: 3,
  });
  expect(() =>
    getEnvironmentConfig({ API_TIMEOUT_MS: 'not-a-number' }),
  ).toThrow(/API_TIMEOUT_MS/);
});
