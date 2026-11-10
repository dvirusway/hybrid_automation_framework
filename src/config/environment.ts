const DEFAULT_UI_BASE_URL = 'https://www.google.com';
const DEFAULT_API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export interface EnvironmentConfig {
  uiBaseUrl: string;
  apiBaseUrl: string;
  requestTimeoutMs: number;
  expectTimeoutMs: number;
  retries: number;
  workers?: number;
}

function readPositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  allowZero = false,
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (
    !Number.isInteger(parsed) ||
    (allowZero ? parsed < 0 : parsed <= 0)
  ) {
    throw new Error(
      `${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer; received "${value}".`,
    );
  }

  return parsed;
}

function readHttpUrl(name: string, value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${name} must be a valid absolute HTTP(S) URL; received "${candidate}".`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use HTTP or HTTPS; received "${candidate}".`);
  }

  return url.toString().replace(/\/$/, '');
}

export function getEnvironmentConfig(
  environment: NodeJS.ProcessEnv = process.env,
): EnvironmentConfig {
  const workers = environment.PW_WORKERS
    ? readPositiveInteger('PW_WORKERS', environment.PW_WORKERS, 1)
    : undefined;

  return {
    uiBaseUrl: readHttpUrl('UI_BASE_URL', environment.UI_BASE_URL, DEFAULT_UI_BASE_URL),
    apiBaseUrl: readHttpUrl('API_BASE_URL', environment.API_BASE_URL, DEFAULT_API_BASE_URL),
    requestTimeoutMs: readPositiveInteger(
      'API_TIMEOUT_MS',
      environment.API_TIMEOUT_MS,
      30_000,
    ),
    expectTimeoutMs: readPositiveInteger(
      'EXPECT_TIMEOUT_MS',
      environment.EXPECT_TIMEOUT_MS,
      5_000,
    ),
    retries: readPositiveInteger('PW_RETRIES', environment.PW_RETRIES, 0, true),
    workers,
  };
}
