import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User as SupabaseUser } from '@supabase/supabase-js';
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
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUserSubject.next(session.user);

        const currentUrl = this.router.url;
        if (
          currentUrl === '/' ||
          currentUrl === '/home' ||
          currentUrl.includes('login') ||
          currentUrl.includes('registro') ||
          currentUrl.includes('auth/callback')
        ) {
          await this.ensurePublicUser(session.user);
          await this.redirectAfterSignIn(session.user.id);
        }
      }

      if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
        await this.router.navigate(['/home']);
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    const code = url.searchParams.get('code');

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        throw error;
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
    await this.ensurePublicUser(data.session.user);
    await this.redirectAfterSignIn(data.session.user.id);
  }

  async redirectAfterSignIn(userId?: string): Promise<void> {
    const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id;

    if (!currentUserId) {
      await this.router.navigate(['/home']);
      return;
    }

    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('active', true)
      .maybeSingle();

    await this.router.navigate([data ? '/dash' : '/perfil']);
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
}
