import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { createRequestId, REQUEST_ID_HEADER } from './request-id';

const SLOW_REQUEST_THRESHOLD_MS = 2000;

export const telemetryInterceptor: HttpInterceptorFn = (req, next) => {
  const startedAt = performance.now();
  const requestId = req.headers.get(REQUEST_ID_HEADER) || createRequestId();
  const tracedRequest = isCrossOriginRequest(req.url)
    ? req
    : req.clone({
        headers: req.headers.set(REQUEST_ID_HEADER, requestId),
      });

  return next(tracedRequest).pipe(
    tap(event => {
      if (event.type !== HttpEventType.Response) {
        return;
      }

      const durationMs = performance.now() - startedAt;
      if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
        captureHttpMessage('Slow HTTP request', {
          requestId,
          method: req.method,
          status: String(event.status),
          url: req.urlWithParams,
          durationMs: Math.round(durationMs),
        });
      }
    }),
    catchError((error: unknown) => {
      const durationMs = performance.now() - startedAt;

      captureHttpException(error, {
        requestId,
        method: req.method,
        status: error instanceof HttpErrorResponse ? String(error.status) : 'unknown',
        url: req.urlWithParams,
        durationMs: Math.round(durationMs),
      });

      return throwError(() => error);
    }),
  );
};

function isCrossOriginRequest(url: string): boolean {
  if (!/^https?:\/\//i.test(url) || typeof location === 'undefined') {
    return false;
  }

  try {
    return new URL(url).origin !== location.origin;
  } catch {
    return false;
  }
}

function captureHttpMessage(
  message: string,
  context: { requestId: string; method: string; status: string; url: string; durationMs: number },
): void {
  if (!environment.sentryDsn) {
    return;
  }

  Sentry.captureMessage(message, {
    level: 'warning',
    tags: {
      requestId: context.requestId,
      method: context.method,
      status: context.status,
    },
    extra: {
      url: context.url,
      durationMs: context.durationMs,
    },
  });
}

function captureHttpException(
  error: unknown,
  context: { requestId: string; method: string; status: string; url: string; durationMs: number },
): void {
  if (!environment.sentryDsn) {
    return;
  }

  Sentry.captureException(error, {
    tags: {
      requestId: context.requestId,
      method: context.method,
      status: context.status,
    },
    extra: {
      url: context.url,
      durationMs: context.durationMs,
    },
  });
}
