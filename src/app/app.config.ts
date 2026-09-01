import { IMAGE_LOADER } from '@angular/common';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, Provider, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';
import { supabaseImageLoader } from '@app/core/images/supabase-image-loader';
import { telemetryInterceptor } from '@app/core/observability/telemetry.interceptor';
import { AuthService } from '@app/core/auth/auth.service';
import { environment } from '@environments/environment';

const sentryProviders: Provider[] = environment.sentryDsn
  ? [
      {
        provide: ErrorHandler,
        useValue: Sentry.createErrorHandler(),
      },
      {
        provide: Sentry.TraceService,
        deps: [Router],
      },
      {
        provide: APP_INITIALIZER,
        useFactory: () => () => {},
        deps: [Sentry.TraceService],
        multi: true,
      },
    ]
  : [];

const serviceWorkerEnabled = false;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    provideHttpClient(withFetch(), withInterceptors([telemetryInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    ...sentryProviders,
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.loadUserFromSession(),
      deps: [AuthService],
      multi: true,
    },
    { provide: IMAGE_LOADER, useValue: supabaseImageLoader },
    provideServiceWorker('ngsw-worker.js', {
      enabled: serviceWorkerEnabled,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

