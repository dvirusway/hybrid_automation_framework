export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
  description?: string;
}

export class PollTimeoutError extends Error {
  constructor(
    readonly description: string,
    readonly timeoutMs: number,
  ) {
    super(`Timed out after ${timeoutMs}ms waiting for ${description}.`);
    this.name = 'PollTimeoutError';
  }
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Polling was aborted.'));
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);

    const abort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason ?? new Error('Polling was aborted.'));
    };

    signal?.addEventListener('abort', abort, { once: true });
  });
}

export async function waitFor<T>(
  readValue: () => T | Promise<T>,
  isReady: (value: T) => boolean,
  options: PollOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 5_000;
  const intervalMs = options.intervalMs ?? 100;
  const description = options.description ?? 'condition';
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new RangeError('Polling timeout must be a non-negative number.');
  }
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError('Polling interval must be a positive number.');
  }
  if (options.signal?.aborted) {
    throw options.signal.reason ?? new Error('Polling was aborted.');
  }

  const deadline = Date.now() + timeoutMs;
  let lastValue: T;
  let hasValue = false;

  while (true) {
    lastValue = await readValue();
    hasValue = true;
    if (isReady(lastValue)) {
      return lastValue;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      const error = new PollTimeoutError(description, timeoutMs);
      if (hasValue) {
        Object.assign(error, { lastValue });
      }
      throw error;
    }
    await delay(Math.min(intervalMs, remaining), options.signal);
  }
}
