import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

cleanupLocalServiceWorker();

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    dataCollection: {
    },
    environment: environment.sentryEnvironment,
    release: environment.sentryRelease || undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracePropagationTargets: [
      'localhost',
      /^\/api\/supabase/,
      environment.supabaseUrl,
    ].filter(Boolean),
    tracesSampleRate: environment.sentryTracesSampleRate,
    replaysSessionSampleRate: environment.sentryReplaysSessionSampleRate,
    replaysOnErrorSampleRate: environment.sentryReplaysOnErrorSampleRate,
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    if (environment.sentryDsn) {
      Sentry.captureException(err);
    }

    console.error(err);
  });

function cleanupLocalServiceWorker(): void {
  const isLocalHost = typeof location !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(location.hostname);

  if (
    (environment.production && !isLocalHost) ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }

  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);

    void Promise.all([
      navigator.serviceWorker.getRegistrations().then(registrations =>
        Promise.all(registrations.map(registration => registration.unregister())),
      ),
      'caches' in window
        ? caches.keys().then(cacheNames =>
            Promise.all(
              cacheNames
                .filter(cacheName => cacheName.startsWith('ngsw:') || cacheName.includes('info-shop'))
                .map(cacheName => caches.delete(cacheName)),
            ),
          )
        : Promise.resolve([]),
    ]).then(() => {
      if (!hadController || sessionStorage.getItem('info-shop-local-sw-cleaned') === 'true') {
        return;
      }

      sessionStorage.setItem('info-shop-local-sw-cleaned', 'true');
      window.location.reload();
    });
  });
}
