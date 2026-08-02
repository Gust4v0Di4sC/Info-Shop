import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-password-recovery',
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.scss',
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  isLoading = false;
  sentToEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  goToLogin(): void {
    this.router.navigate(['/home']);
  }

  goToStore(): void {
    this.router.navigate(['/']);
  }

  onSubmit(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const email = this.recoveryForm.value.email;

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.sentToEmail = email;
        this.snackBar.open('Enviamos o link para redefinir sua senha.', 'Fechar', {
          duration: 6000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      error: error => {
        this.isLoading = false;
        this.snackBar.open(error?.message || 'Nao foi possivel enviar o link.', 'Fechar', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
