import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const originalUrl = window.location.href;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  it('should load the current user only when session loading is requested', async () => {
    const resultPromise = service.loadUserFromSession();
    const request = httpMock.expectOne('/api/auth/session');

    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBeTrue();

    request.flush({ user: null });
    await expectAsync(resultPromise).toBeResolvedTo(null);
  });

  afterEach(() => {
    httpMock.verify();
    window.history.pushState({}, '', originalUrl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request password reset through the same-origin auth API', async () => {
    const resultPromise = firstValueFrom(service.requestPasswordReset('cliente@teste.com'));
    const request = httpMock.expectOne('/api/auth/password-reset');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.body).toEqual({ email: 'cliente@teste.com' });

    request.flush({ ok: true });
    await expectAsync(resultPromise).toBeResolvedTo(true);
  });

  it('should route recovery callbacks from query params to new password page', async () => {
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);
    window.history.pushState(
      {},
      '',
      '/auth/callback?code=auth-code&type=recovery',
    );

    const callbackPromise = service.handleAuthCallback();
    const request = httpMock.expectOne('/api/auth/callback');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.body).toEqual({
      code: 'auth-code',
      tokenHash: null,
      type: 'recovery',
    });

    request.flush({
      user: {
        id: 'client-user-id',
        email: 'cliente@teste.com',
        user_metadata: {},
      },
      type: 'recovery',
    });

    await callbackPromise;

    expect(navigateSpy).toHaveBeenCalledOnceWith(['/nova-senha']);
  });

  it('should reject callbacks that expose access tokens to the browser', async () => {
    window.history.pushState(
      {},
      '',
      '/auth/callback#access_token=access-token&refresh_token=refresh-token&type=recovery',
    );

    await expectAsync(service.handleAuthCallback()).toBeRejectedWithError(/Callback inseguro/);
  });
});
