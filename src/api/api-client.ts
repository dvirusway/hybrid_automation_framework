import type { APIRequestContext, APIResponse } from '@playwright/test';

type RequestOptions = NonNullable<Parameters<APIRequestContext['fetch']>[1]>;
export type ApiRequestOptions = Omit<RequestOptions, 'method'>;
export type ApiRequestBody = NonNullable<RequestOptions['data']>;
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface ApiClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export class ApiClient {
  private readonly baseUrl: URL;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultTimeout?: number;

  constructor(
    private readonly request: APIRequestContext,
    baseUrl: string,
    options: ApiClientOptions = {},
  ) {
    let parsedBaseUrl: URL;

    try {
      parsedBaseUrl = new URL(baseUrl);
    } catch {
      throw new Error(`API base URL must be absolute; received "${baseUrl}".`);
    }

    if (parsedBaseUrl.protocol !== 'http:' && parsedBaseUrl.protocol !== 'https:') {
      throw new Error(`API base URL must use HTTP or HTTPS; received "${baseUrl}".`);
    }

    parsedBaseUrl.search = '';
    parsedBaseUrl.hash = '';
    parsedBaseUrl.pathname = `${parsedBaseUrl.pathname.replace(/\/+$/, '')}/`;
    this.baseUrl = parsedBaseUrl;
    this.defaultHeaders = { ...options.headers };
    this.defaultTimeout = options.timeout;
  }

  get<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<APIResponse<T>> {
    return this.send<T>('GET', path, options);
  }

  post<T = unknown>(
    path: string,
    data?: ApiRequestBody,
    options: ApiRequestOptions = {},
  ): Promise<APIResponse<T>> {
    return this.send<T>('POST', path, { ...options, data });
  }

  put<T = unknown>(
    path: string,
    data?: ApiRequestBody,
    options: ApiRequestOptions = {},
  ): Promise<APIResponse<T>> {
    return this.send<T>('PUT', path, { ...options, data });
  }

  patch<T = unknown>(
    path: string,
    data?: ApiRequestBody,
    options: ApiRequestOptions = {},
  ): Promise<APIResponse<T>> {
    return this.send<T>('PATCH', path, { ...options, data });
  }

  delete<T = unknown>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<APIResponse<T>> {
    return this.send<T>('DELETE', path, options);
  }

  head(path: string, options: ApiRequestOptions = {}): Promise<APIResponse> {
    return this.send('HEAD', path, options);
  }

  private async send<T>(
    method: ApiMethod,
    path: string,
    options: ApiRequestOptions,
  ): Promise<APIResponse<T>> {
    const url = this.resolveUrl(path);
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    return this.request.fetch<T>(url.toString(), {
      ...options,
      method,
      headers,
      timeout: options.timeout ?? this.defaultTimeout,
    });
  }

  private resolveUrl(path: string): URL {
    const normalizedPath = path.trim();
    if (
      normalizedPath.length === 0 ||
      normalizedPath.startsWith('//') ||
      /^[a-z][a-z\d+.-]*:/i.test(normalizedPath)
    ) {
      throw new Error(`API path must be a non-empty relative path; received "${path}".`);
    }

    const url = new URL(normalizedPath.replace(/^\/+/, ''), this.baseUrl);
    if (url.origin !== this.baseUrl.origin) {
      throw new Error(`API path must remain on the configured origin; received "${path}".`);
    }

    return url;
  }
}
