import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {
  errorMessage = '';
  actionTitle = 'Processando login';
  actionDescription = 'Aguarde enquanto validamos sua sessao.';

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    try {
      const type = new URL(window.location.href).searchParams.get('type');

      if (type === 'recovery') {
        this.actionTitle = 'Validando recuperacao';
        this.actionDescription = 'Aguarde enquanto preparamos a redefinicao de senha.';
      }

      await this.authService.handleAuthCallback();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Nao foi possivel concluir o login.';
    }
  }
}
