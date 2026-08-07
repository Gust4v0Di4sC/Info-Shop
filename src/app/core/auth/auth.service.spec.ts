import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let router: Router;
  const originalUrl = window.location.href;

  beforeEach(() => {
    spyOn(supabase.auth, 'onAuthStateChange').and.returnValue({
      data: {
        subscription: {
          unsubscribe: jasmine.createSpy('unsubscribe'),
        },
      },
    } as any);
    spyOn(supabase.auth, 'getSession').and.resolveTo({
      data: { session: null },
      error: null,
    } as any);

    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    window.history.pushState({}, '', originalUrl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request password reset email with auth callback redirect', async () => {
    const resetPasswordSpy = spyOn(supabase.auth, 'resetPasswordForEmail').and.resolveTo({
      data: {},
      error: null,
    } as any);

    await firstValueFrom(service.requestPasswordReset('cliente@teste.com'));

    expect(resetPasswordSpy).toHaveBeenCalledOnceWith('cliente@teste.com', {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
  });

  it('should route recovery callbacks from hash params to new password page', async () => {
    const user = {
      id: 'client-user-id',
      email: 'cliente@teste.com',
      user_metadata: {},
    };
    const setSessionSpy = spyOn(supabase.auth, 'setSession').and.resolveTo({
      data: { session: null, user: null },
      error: null,
    } as any);
    const navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    (supabase.auth.getSession as jasmine.Spy).and.resolveTo({
      data: {
        session: {
          user,
        },
      },
      error: null,
    } as any);
    window.history.pushState(
      {},
      '',
      '/auth/callback#access_token=access-token&refresh_token=refresh-token&type=recovery',
    );

    await service.handleAuthCallback();

    expect(setSessionSpy).toHaveBeenCalledOnceWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(navigateSpy).toHaveBeenCalledOnceWith(['/nova-senha']);
  });
});
