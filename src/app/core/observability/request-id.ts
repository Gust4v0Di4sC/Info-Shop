export const REQUEST_ID_HEADER = 'X-Request-ID';
export const REQUEST_ID_HEADER_LOWER = 'x-request-id';

export function createRequestId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function requestIdFromHeaders(headers: Headers): string {
  return headers.get(REQUEST_ID_HEADER) || headers.get(REQUEST_ID_HEADER_LOWER) || createRequestId();
}
