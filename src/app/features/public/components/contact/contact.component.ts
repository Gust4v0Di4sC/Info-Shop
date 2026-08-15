import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  feedbackMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly newsletterService: NewsletterService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  subscribe(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      this.feedbackMessage = '';
      this.errorMessage = 'Informe um e-mail valido para receber as ofertas.';
      return;
    }

    this.isSubmitting = true;
    this.feedbackMessage = '';
    this.errorMessage = '';

    this.newsletterService.subscribe(this.newsletterForm.value.email).subscribe({
      next: () => {
        this.feedbackMessage = 'Inscricao realizada. Voce recebera nossas ofertas por e-mail.';
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
}
