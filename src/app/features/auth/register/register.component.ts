import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-register',
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  isResendingConfirmation = false;
  pendingConfirmationEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    readonly themeService: AdminThemeService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  goToStore(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/home']);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.passwordsMatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { fullName, email, password } = this.registerForm.value;

    this.authService.register(email, password, fullName).subscribe({
      next: result => {
        if (result.needsEmailConfirmation) {
          this.pendingConfirmationEmail = email;
          this.snackBar.open('Confira seu email para confirmar a conta.', 'Fechar', {
            duration: 6000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
          return;
        }

        this.authService.redirectAfterSignIn(result.user?.id);
      },
      error: error => {
        this.snackBar.open(error?.message || 'Nao foi possivel criar a conta.', 'Fechar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  resendConfirmation(): void {
    if (!this.pendingConfirmationEmail || this.isResendingConfirmation) {
      return;
    }

    this.isResendingConfirmation = true;

    this.authService.resendConfirmation(this.pendingConfirmationEmail).subscribe({
      next: () => {
        this.snackBar.open('Email de confirmacao reenviado.', 'Fechar', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: error => {
        this.isResendingConfirmation = false;
        this.snackBar.open(
          error?.message || 'Nao foi possivel reenviar a confirmacao.',
          'Fechar',
          {
            duration: 6000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          },
        );
      },
      complete: () => {
        this.isResendingConfirmation = false;
      },
    });
  }

  get passwordsMatch(): boolean {
    return this.registerForm.value.password === this.registerForm.value.confirmPassword;
  }

}
