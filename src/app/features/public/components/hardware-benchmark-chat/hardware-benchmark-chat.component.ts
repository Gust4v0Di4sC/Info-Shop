import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '@app/core/auth/auth.service';
import { HardwareBenchmarkMessage } from '@app/models/hardware-benchmark.model';
import { Product } from '@app/models/product.model';
import { HardwareBenchmarkService } from '@app/services/hardware-benchmark.service';

@Component({
  selector: 'app-hardware-benchmark-chat',
  imports: [ReactiveFormsModule],
  templateUrl: './hardware-benchmark-chat.component.html',
  styleUrl: './hardware-benchmark-chat.component.scss',
})
export class HardwareBenchmarkChatComponent implements OnInit {
  @Input({ required: true }) product!: Product;

  private readonly authService = inject(AuthService);
  private readonly benchmarkService = inject(HardwareBenchmarkService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly currentHardwareControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(1200)],
  });
  readonly messageControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(600)],
  });

  readonly fallbackAnswer = 'Nao possuo informacoes a respeito disso.';
  messages: HardwareBenchmarkMessage[] = [];
  isAuthenticated = false;
  isSending = false;
  validationMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.isAuthenticated = Boolean(user);
      });
  }

  sendMessage(): void {
    this.validationMessage = '';
    this.errorMessage = '';

    if (!this.isAuthenticated) {
      this.validationMessage = 'Entre na sua conta para comparar hardware com IA.';
      return;
    }

    const currentHardware = this.currentHardwareControl.value.trim();
    const message = this.messageControl.value.trim();

    if (!currentHardware) {
      this.validationMessage = 'Informe seu hardware atual para comparar.';
      this.currentHardwareControl.markAsTouched();
      return;
    }

    if (!message) {
      this.validationMessage = 'Digite uma pergunta sobre o benchmark.';
      this.messageControl.markAsTouched();
      return;
    }

    if (this.currentHardwareControl.invalid || this.messageControl.invalid) {
      this.validationMessage = 'Revise os campos antes de enviar.';
      return;
    }

    const history = this.messages.slice(-8);
    const userMessage: HardwareBenchmarkMessage = { role: 'user', text: message };
    this.messages = [...this.messages, userMessage];
    this.messageControl.setValue('');
    this.isSending = true;

    this.benchmarkService.compare({
      productId: Number(this.product.id),
      currentHardware,
      message,
      history,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        const answer = response.answer?.trim() || this.fallbackAnswer;
        this.messages = [...this.messages, { role: 'model', text: answer }];
        this.isSending = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel consultar a IA agora.';
        this.messages = [...this.messages, { role: 'model', text: this.fallbackAnswer }];
        this.isSending = false;
      },
    });
  }

  usePrompt(prompt: string): void {
    this.messageControl.setValue(prompt);
  }

  goToLogin(): void {
    void this.router.navigate(['/home']);
  }
}
