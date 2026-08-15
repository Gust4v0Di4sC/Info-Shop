import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import { catchError, tap, throwError } from 'rxjs';
import { createRequestId, REQUEST_ID_HEADER } from './request-id';

const SLOW_REQUEST_THRESHOLD_MS = 2000;

export const telemetryInterceptor: HttpInterceptorFn = (req, next) => {
  const startedAt = performance.now();
  const requestId = req.headers.get(REQUEST_ID_HEADER) || createRequestId();
  const tracedRequest = req.clone({
    headers: req.headers.set(REQUEST_ID_HEADER, requestId),
  });

  return next(tracedRequest).pipe(
    tap(event => {
      if (event.type !== HttpEventType.Response) {
        return;
      }

      const durationMs = performance.now() - startedAt;
      if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
        Sentry.captureMessage('Slow HTTP request', {
          level: 'warning',
          tags: {
            requestId,
            method: req.method,
            status: String(event.status),
          },
          extra: {
            url: req.urlWithParams,
            durationMs: Math.round(durationMs),
          },
        });
      }
    }),
    catchError((error: unknown) => {
      const durationMs = performance.now() - startedAt;

      Sentry.captureException(error, {
        tags: {
          requestId,
          method: req.method,
          status: error instanceof HttpErrorResponse ? String(error.status) : 'unknown',
        },
        extra: {
          url: req.urlWithParams,
          durationMs: Math.round(durationMs),
        },
      });

      return throwError(() => error);
    }),
  );
};
