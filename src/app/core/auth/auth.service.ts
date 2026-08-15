import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { BehaviorSubject, catchError, firstValueFrom, from, map, of, tap } from 'rxjs';
import { Admin, ADMIN_DEFAULT_ROUTE, AdminRole, normalizeAdminRole } from '@app/models/admin.model';

interface AuthUserResponse {
  user: SupabaseUser | null;
}

interface AuthRegisterResponse extends AuthUserResponse {
  needsEmailConfirmation: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  private readonly isBrowser: boolean;
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async loadUserFromSession(): Promise<SupabaseUser | null> {
    if (!this.isBrowser) {
      this.currentUserSubject.next(null);
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<AuthUserResponse>('/api/auth/session', { withCredentials: true }),
      );
      this.currentUserSubject.next(response.user);
      return response.user;
    } catch {
      this.currentUserSubject.next(null);
      return null;
    }
  }

  async signInWithGoogle(): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<{ url: string }>('/api/auth/oauth/google', { withCredentials: true }),
    );

    window.location.href = response.url;
  }

  register(email: string, password: string, fullName: string) {
    return this.http
      .post<AuthRegisterResponse>('/api/auth/register', { email, password, fullName }, { withCredentials: true })
      .pipe(
        tap(response => this.currentUserSubject.next(response.user)),
        map(response => ({
          user: response.user,
          session: null,
          needsEmailConfirmation: response.needsEmailConfirmation,
        })),
      );
  }

  resendConfirmation(email: string) {
    return this.http
      .post<{ ok: boolean }>('/api/auth/resend-confirmation', { email }, { withCredentials: true })
      .pipe(map(() => true));
  }

  requestPasswordReset(email: string) {
    return this.http
      .post<{ ok: boolean }>('/api/auth/password-reset', { email }, { withCredentials: true })
      .pipe(map(() => true));
  }

  updatePassword(password: string) {
    return this.http
      .post<AuthUserResponse>('/api/auth/update-password', { password }, { withCredentials: true })
      .pipe(
        tap(response => this.currentUserSubject.next(response.user)),
        map(() => true),
      );
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthUserResponse>('/api/auth/login', { email, password }, { withCredentials: true })
      .pipe(
        map(response => {
          if (!response.user) {
            return false;
          }

          this.currentUserSubject.next(response.user);
          return true;
        }),
        catchError(() => of(false)),
      );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<{ ok: boolean }>('/api/auth/logout', {}, { withCredentials: true }),
      );
    } finally {
      this.currentUserSubject.next(null);
      await this.router.navigate(['/home']);
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): SupabaseUser | null {
    return this.currentUserSubject.value;
  }

  async getCurrentUserAsync(): Promise<SupabaseUser | null> {
    return this.currentUserSubject.value || this.loadUserFromSession();
  }

  async requireCurrentUser(message = 'Entre na sua conta para continuar.'): Promise<SupabaseUser> {
    const user = await this.getCurrentUserAsync();

    if (!user) {
      throw new Error(message);
    }

    return user;
  }

  async forceSessionRefresh(): Promise<void> {
    await this.loadUserFromSession();
  }

  async handleAuthCallback(): Promise<void> {
    const url = new URL(window.location.href);
    const callbackError = this.getCallbackParam(url, 'error_description') ||
      this.getCallbackParam(url, 'error');
    const code = this.getCallbackParam(url, 'code');
    const tokenHash = this.getCallbackParam(url, 'token_hash');
    const type = this.getCallbackParam(url, 'type');

    if (callbackError) {
      throw new Error(callbackError);
    }

    const hasImplicitTokens = Boolean(
      this.getCallbackParam(url, 'access_token') || this.getCallbackParam(url, 'refresh_token'),
    );

    if (hasImplicitTokens) {
      throw new Error('Callback inseguro com token no navegador. Solicite um novo link de acesso.');
    }

    const response = await firstValueFrom(
      this.http.post<AuthUserResponse & { type?: string }>(
        '/api/auth/callback',
        { code, tokenHash, type },
        { withCredentials: true },
      ),
    );

    if (!response.user) {
      throw new Error('Sessao de login nao encontrada.');
    }

    this.currentUserSubject.next(response.user);
    window.history.replaceState({}, document.title, '/auth/callback');

    if (response.type === 'recovery' || type === 'recovery') {
      await this.router.navigate(['/nova-senha']);
      return;
    }

    await this.redirectAfterSignIn(response.user.id);
  }

  async redirectAfterSignIn(userId?: string): Promise<void> {
    const currentUserId = userId || (await this.getCurrentUserAsync())?.id;

    if (!currentUserId) {
      await this.router.navigate(['/home']);
      return;
    }

    const adminRole = await this.getAdminRole(currentUserId);

    await this.router.navigate([adminRole ? ADMIN_DEFAULT_ROUTE[adminRole] : '/perfil']);
  }

  async isUserAdmin(userId?: string): Promise<boolean> {
    return Boolean(await this.getAdminProfile(userId));
  }

  async getAdminRole(userId?: string): Promise<AdminRole | null> {
    const admin = await this.getAdminProfile(userId);
    return admin ? normalizeAdminRole(admin.role) : null;
  }

  async getAdminProfile(userId?: string): Promise<Admin | null> {
    const currentUserId = userId || (await this.getCurrentUserAsync())?.id;

    if (!currentUserId) {
      return null;
    }

    const { supabase } = await import('@app/core/supabase/supabase.client');
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('active', true)
      .maybeSingle();

    return error ? null : data;
  }

  private getCallbackParam(url: URL, name: string): string | null {
    const queryValue = url.searchParams.get(name);

    if (queryValue) {
      return queryValue;
    }

    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    return hashParams.get(name);
  }
}
