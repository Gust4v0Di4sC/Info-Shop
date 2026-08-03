import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { EmailOtpType, User as SupabaseUser } from '@supabase/supabase-js';
import { BehaviorSubject, catchError, from, map, of } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUserSubject.next(session.user);

        const currentUrl = this.router.url;
        if (
          currentUrl === '/' ||
          currentUrl === '/home' ||
          currentUrl.includes('login') ||
          currentUrl.includes('registro')
        ) {
          setTimeout(() => {
            void this.finishSignIn(session.user);
          });
        }
      }

      if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
        setTimeout(() => {
          void this.router.navigate(['/home']);
        });
      }
    });

    await this.loadUserFromSession();
  }

  private async loadUserFromSession(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session?.user) {
      this.currentUserSubject.next(data.session.user);
    }
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: this.getAuthCallbackUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      throw new Error(`Erro no login Google: ${error.message}`);
    }
  }

  register(email: string, password: string, fullName: string) {
    return from(
      supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: this.getAuthCallbackUrl(),
          data: {
            full_name: fullName,
            name: fullName,
          },
        },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return {
          user: data.user,
          session: data.session,
          needsEmailConfirmation: Boolean(data.user && !data.session),
        };
      }),
    );
  }

  resendConfirmation(email: string) {
    return from(
      supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: this.getAuthCallbackUrl(),
        },
      }),
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }

        return true;
      }),
    );
  }

  requestPasswordReset(email: string) {
    return from(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: this.getAuthCallbackUrl(),
      }),
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }

        return true;
      }),
    );
  }

  updatePassword(password: string) {
    return from(supabase.auth.updateUser({ password })).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }

        return true;
      }),
    );
  }

  login(email: string, password: string) {
    return from(supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error || !data.user) {
          return false;
        }

        this.currentUserSubject.next(data.user);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): SupabaseUser | null {
    return this.currentUserSubject.value;
  }

  async forceSessionRefresh(): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession();

    if (!error && data.user) {
      this.currentUserSubject.next(data.user);
    }
  }

  async handleAuthCallback(): Promise<void> {
    const url = new URL(window.location.href);
    const callbackError = url.searchParams.get('error_description') ||
      url.searchParams.get('error');
    const code = url.searchParams.get('code');
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type') as EmailOtpType | null;

    if (callbackError) {
      throw new Error(callbackError);
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (error) {
        throw error;
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        throw error;
      }
    } else {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          throw error;
        }
      }
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data.session?.user) {
      throw new Error('Sessao de login nao encontrada.');
    }

    this.currentUserSubject.next(data.session.user);

    if (type === 'recovery') {
      await this.router.navigate(['/nova-senha']);
      return;
    }

    await this.finishSignIn(data.session.user);
  }

  async redirectAfterSignIn(userId?: string): Promise<void> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      await this.router.navigate(['/home']);
      return;
    }

    const isAdmin = await this.isUserAdmin(currentUserId);

    await this.router.navigate([isAdmin ? '/dash' : '/perfil']);
  }

  async isUserAdmin(userId?: string): Promise<boolean> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      return false;
    }

    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('active', true)
      .maybeSingle();

    return !error && Boolean(data);
  }

  private async finishSignIn(user: SupabaseUser): Promise<void> {
    await this.ensurePublicUser(user);
    await this.redirectAfterSignIn(user.id);
  }

  private async ensurePublicUser(user: SupabaseUser): Promise<void> {
    const metadata = user.user_metadata || {};
    const fullName = this.getMetadataValue(metadata, 'full_name') ||
      this.getMetadataValue(metadata, 'name');
    const avatarUrl = this.getMetadataValue(metadata, 'avatar_url') ||
      this.getMetadataValue(metadata, 'picture');

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        avatar_url: avatarUrl,
      }, { onConflict: 'id' });

    if (error) {
      throw error;
    }
  }

  private getMetadataValue(metadata: Record<string, unknown>, key: string): string | null {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : null;
  }

  private getAuthCallbackUrl(): string {
    return `${window.location.origin}/auth/callback`;
  }
}
