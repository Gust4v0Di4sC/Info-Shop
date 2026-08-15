import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
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
    Sentry.captureException(err);
    console.error(err);
  });
