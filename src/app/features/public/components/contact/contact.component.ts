import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NewsletterService } from '@app/services/newsletter.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  newsletterForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly newsletterService: NewsletterService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar,
  ) {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  subscribe(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      this.errorMessage = 'Informe um e-mail valido para receber as ofertas.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.newsletterService.subscribe(this.newsletterForm.value.email).subscribe({
      next: () => {
        this.showSnackbar('Inscricao realizada. Voce recebera nossas ofertas por e-mail.');
        this.newsletterForm.reset();
        this.isSubmitting = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel concluir sua inscricao agora. Tente novamente em alguns instantes.';
        this.isSubmitting = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
