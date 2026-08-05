import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export default class HomeComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  selectedRole: 'client' | 'admin' = 'client';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    readonly themeService: AdminThemeService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}

  goToHome() {
    this.router.navigate(['/']);
  }

  goToRegister() {
    if (this.isAdminView) {
      return;
    }

    this.router.navigate(['/registro']);
  }

  goToPasswordRecovery(): void {
    this.router.navigate(['/recuperar-senha']);
  }

  async loginWithGoogle() {
    if (this.isAdminView) {
      return;
    }

    this.isLoading = true;
    try {
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      this.snackBar.open(error.message || 'Erro ao fazer login com Google', 'Fechar', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    try {
      const success = await firstValueFrom(this.authService.login(email, password));

      if (!success) {
        this.snackBar.open('Email ou senha invalidos', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return;
      }

      if (this.isAdminView && !(await this.authService.isUserAdmin())) {
        await this.authService.logout();
        this.snackBar.open('Acesso administrativo restrito.', 'Fechar', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        return;
      }

      await this.authService.redirectAfterSignIn();
    } catch {
      this.snackBar.open('Erro ao fazer login', 'Fechar', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  get isAdminView(): boolean {
    return this.selectedRole === 'admin';
  }
}
