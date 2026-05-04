// lib/api/client.ts
// Shared authenticated fetch client for all API calls.
// Components and hooks use this — never call fetch() directly in components.
//
// Usage:
//   const client = createApiClient(getToken)
//   const data = await client.get('/profile/me')

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type GetTokenFn = () => Promise<string | null>;

async function request<T>(
  path: string,
  options: RequestInit,
  getToken: GetTokenFn
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: ApiError = { error: res.statusText, code: "HTTP_ERROR" };
    try {
      body = await res.json();
    } catch {
      // ignore JSON parse failures
    }
    throw new ApiRequestError(res.status, body.code, body.error, body.details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/** Create a bound API client with an auth token provider. */
export function createApiClient(getToken: GetTokenFn) {
  return {
    get: <T>(path: string) =>
      request<T>(path, { method: "GET" }, getToken),

    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: JSON.stringify(body) }, getToken),

    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, getToken),

    delete: <T>(path: string) =>
      request<T>(path, { method: "DELETE" }, getToken),
  };
}
