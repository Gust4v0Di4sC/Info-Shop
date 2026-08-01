import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@app/core/supabase/supabase.client';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<SupabaseUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private isInitialized = false;

  constructor(private router: Router) {
    console.log('🚀 AuthService inicializado');
    this.initializeAuth();
  }

  private async initializeAuth() {
    console.log('🔄 Inicializando autenticação...');

    // Registra primeiro o listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, {
        hasUser: !!session?.user,
      });

      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUserSubject.next(session.user);

        const currentUrl = this.router.url;
        if (
          currentUrl === '/' ||
          currentUrl === '/home' ||
          currentUrl.includes('login')
        ) {
          console.log('🔄 Redirecionando para /dash...');
          await this.router.navigate(['/dash']);
        }
      }

      if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
        await this.router.navigate(['/home']);
      }
    });

    // Depois, carrega a sessão (caso já exista no storage)
    await this.loadUserFromSession();

    this.isInitialized = true;
    console.log('✅ AuthService inicializado completamente');
  }

  /** Carrega usuário da sessão */
  private async loadUserFromSession() {
    try {
      console.log('🔍 Carregando usuário da sessão...');
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Erro ao carregar sessão:', error.message);
        return;
      }

      if (data?.session?.user) {
        console.log(
          '👤 Usuário encontrado na sessão:',
          data.session.user.email
        );
        this.currentUserSubject.next(data.session.user);
      } else {
        console.log('🔍 Nenhuma sessão ativa encontrada');
      }
    } catch (error) {
      console.error('💥 Erro inesperado ao carregar sessão:', error);
    }
  }

  /** Login Google */
  async signInWithGoogle() {
    try {
      console.log('🔄 Iniciando login com Google...');
      console.log('🌐 URL atual:', window.location.href);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Mudou de 'consent' para 'select_account'
          },
        },
      });

      if (error) {
        console.error('❌ Erro login Google:', error);
        throw new Error(`Erro no login Google: ${error.message}`);
      }

      console.log('✅ Redirecionamento para Google iniciado');
    } catch (error: any) {
      console.error('💥 Erro login Google:', error);
      throw new Error(`Falha no login com Google: ${error.message}`);
    }
  }

  /** Login com email/senha */
  login(email: string, password: string) {
    console.log('🔄 Tentando login com email:', email);

    return from(supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Erro no login:', error.message);
          return false;
        }

        if (!data.user) {
          console.error('❌ Nenhum usuário retornado');
          return false;
        }

        console.log('✅ Login email bem-sucedido:', data.user.email);
        // O onAuthStateChange vai lidar com o redirecionamento
        return true;
      }),
      catchError((error) => {
        console.error('💥 Erro no login:', error);
        return of(false);
      })
    );
  }

  /** Logout */
  async logout(): Promise<void> {
    try {
      console.log('🔄 Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erro no logout:', error);
      } else {
        console.log('✅ Logout realizado com sucesso');
      }
    } catch (error) {
      console.error('💥 Erro no logout:', error);
    }
  }

  isAuthenticated(): boolean {
    const isAuth = this.currentUserSubject.value !== null;
    console.log(
      '🔐 isAuthenticated chamado:',
      isAuth,
      this.currentUserSubject.value?.email
    );
    return isAuth;
  }

  getCurrentUser(): SupabaseUser | null {
    return this.currentUserSubject.value;
  }

  /** Força uma nova verificação da sessão - útil após callback OAuth */
  async forceSessionRefresh(): Promise<void> {
    console.log('🔄 Forçando verificação de sessão...');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('❌ Erro ao renovar sessão:', error);
      } else {
        console.log('✅ Sessão renovada:', data.user?.email);
      }
    } catch (error) {
      console.error('💥 Erro inesperado ao renovar sessão:', error);
    }
  }
}
