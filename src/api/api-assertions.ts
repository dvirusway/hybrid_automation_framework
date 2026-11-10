import type { APIResponse } from '@playwright/test';

export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
    readonly responseBody: string,
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export async function expectStatus(
  response: APIResponse,
  expectedStatus: number | readonly number[],
): Promise<void> {
  const expected =
    typeof expectedStatus === 'number' ? [expectedStatus] : expectedStatus;
  if (expected.includes(response.status())) {
    return;
  }

  const responseBody = await response.text();
  const expectedText = expected.join(' or ');
  throw new ApiResponseError(
    `Expected HTTP ${expectedText}, received ${response.status()} ${response.statusText()} for ${response.url()}.`,
    response.status(),
    response.statusText(),
    response.url(),
    responseBody,
  );
}

export async function readJson<T>(response: APIResponse): Promise<T> {
  const contentType = response.headers()['content-type'] ?? '';
  if (!contentType.toLowerCase().includes('json')) {
    throw new TypeError(
      `Expected a JSON response from ${response.url()}, received "${contentType || 'no content type'}".`,
    );
  }

  return (await response.json()) as T;
}
