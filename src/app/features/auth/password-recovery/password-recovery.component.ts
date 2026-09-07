import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<PasswordRecoveryComponent>,
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  close(): void {
    this.dialogRef.close();
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
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Não foi possível enviar o link agora. Confira o e-mail e tente novamente.', 'Fechar', {
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
