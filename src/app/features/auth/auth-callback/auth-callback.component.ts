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

  constructor(private authService: AuthService) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.handleAuthCallback();
    } catch (error: any) {
      this.errorMessage = error?.message || 'Nao foi possivel concluir o login.';
    }
  }
}
