import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, of, Subject, switchMap, takeUntil } from 'rxjs';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { CartItemWithProduct } from '@app/models/cart-item.model';
import { CartServiceService } from '@app/services/cart-service.service';
import { DeliveryAddress, ShippingQuoteOption } from '@app/models/shipping.model';
import { PaymentService } from '@app/services/payment.service';
import { ViaCepService } from '@app/services/via-cep.service';
import { formatCep, onlyDigits } from '@app/shared/utils/input-masks';

@Component({
  selector: 'app-cart-page',
  imports: [BrlCurrencyPipe, MatIconModule, RouterLink, ReactiveFormsModule],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent implements OnInit, OnDestroy {
  shippingForm: FormGroup;
  items: CartItemWithProduct[] = [];
  shippingQuotes: ShippingQuoteOption[] = [];
  selectedServiceId = '';
  isLoading = true;
  pageErrorMessage = '';
  actionErrorMessage = '';
  isQuoting = false;
  isCheckingOut = false;
  isFetchingCep = false;
  cepErrorMessage = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private cartService: CartServiceService,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private viaCepService: ViaCepService,
  ) {
    this.shippingForm = this.fb.group({
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}-?\d{3}$/)]],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      district: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      complement: [''],
    });
  }

  ngOnInit(): void {
    this.bindPostalCodeAutocomplete();
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => {
      return sum + (this.itemPrice(item) * item.quantity);
    }, 0);
  }

  get selectedQuote(): ShippingQuoteOption | null {
    return this.shippingQuotes.find(quote => quote.id === this.selectedServiceId) || null;
  }

  get total(): number {
    return this.subtotal + (this.selectedQuote?.price || 0);
  }

  itemPrice(item: CartItemWithProduct): number {
    return item.product?.offer_price || item.product?.price || 0;
  }

  loadCart(): void {
    this.isLoading = true;
    this.pageErrorMessage = '';
    this.actionErrorMessage = '';
    this.changeDetectorRef.markForCheck();

    this.cartService.getCartItems().subscribe({
      next: items => {
        this.items = items;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.pageErrorMessage = 'Não foi possível carregar seu carrinho agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  changeQuantity(item: CartItemWithProduct, quantity: number): void {
    this.actionErrorMessage = '';
    this.cartService.updateQuantity(item.id, quantity).subscribe({
      next: () => this.loadCart(),
      error: () => {
        this.showSnackbar('Não foi possível atualizar este item agora. Tente novamente.');
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  removeItem(item: CartItemWithProduct): void {
    this.actionErrorMessage = '';
    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.showSnackbar(`${this.itemName(item)} foi removido do carrinho.`);
        this.loadCart();
      },
      error: () => {
        this.showSnackbar('Não foi possível remover este item agora. Tente novamente.');
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  clearCart(): void {
    this.actionErrorMessage = '';
    this.cartService.clearCart().subscribe({
      next: () => {
        this.items = [];
        this.shippingQuotes = [];
        this.selectedServiceId = '';
        this.actionErrorMessage = '';
        this.showSnackbar('Carrinho limpo.');
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.showSnackbar('Não foi possível limpar o carrinho agora. Tente novamente.');
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  calculateShipping(): void {
    if (this.isFetchingCep) {
      this.actionErrorMessage = 'Aguarde a busca do CEP terminar antes de calcular o frete.';
      return;
    }

    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isQuoting = true;
    this.actionErrorMessage = '';
    this.shippingQuotes = [];
    this.selectedServiceId = '';
    this.changeDetectorRef.markForCheck();

    this.cartService.calculateShipping(this.deliveryAddress()).subscribe({
      next: quotes => {
        this.shippingQuotes = quotes;
        this.selectedServiceId = quotes[0]?.id || '';
        this.isQuoting = false;
        if (quotes.length === 0) {
          this.actionErrorMessage = 'Não encontramos frete disponível para este endereço.';
        }
        this.changeDetectorRef.markForCheck();
      },
      error: error => {
        this.actionErrorMessage = this.shippingErrorMessage(error);
        this.isQuoting = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  checkout(): void {
    if (!this.selectedServiceId) {
      this.showSnackbar('Escolha uma opção de frete antes de finalizar.');
      return;
    }

    this.isCheckingOut = true;
    this.actionErrorMessage = '';

    this.paymentService.createPreference({
      address: this.deliveryAddress(),
      selectedServiceId: this.selectedServiceId,
    }).subscribe({
      next: result => {
        this.redirectToPayment(result.initPoint);
        this.isCheckingOut = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.showSnackbar('Não foi possível iniciar o pagamento agora. Tente novamente em alguns instantes.');
        this.isCheckingOut = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  itemName(item: CartItemWithProduct): string {
    return item.product?.name || 'Produto';
  }

  fieldInvalid(fieldName: string): boolean {
    const control = this.shippingForm.get(fieldName);
    return Boolean(control && control.touched && control.invalid);
  }

  fieldErrorMessage(fieldName: string): string {
    const control = this.shippingForm.get(fieldName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return this.requiredFieldMessage(fieldName);
    }

    if (fieldName === 'postalCode' && control.hasError('pattern')) {
      return 'Digite um CEP válido com 8 números.';
    }

    if (fieldName === 'state' && control.hasError('pattern')) {
      return 'Digite a UF com 2 letras.';
    }

    return 'Confira este campo.';
  }

  formatPostalCodeField(): void {
    const control = this.shippingForm.get('postalCode');
    const formatted = formatCep(String(control?.value || ''));

    if (control && control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  private deliveryAddress(): DeliveryAddress {
    const value = this.shippingForm.value;
    return {
      postalCode: onlyDigits(value.postalCode || ''),
      street: value.street || '',
      number: value.number || '',
      district: value.district || '',
      city: value.city || '',
      state: (value.state || '').toUpperCase(),
      complement: value.complement || null,
    };
  }

  private bindPostalCodeAutocomplete(): void {
    this.shippingForm.get('postalCode')?.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(value => {
        const postalCode = onlyDigits(String(value || ''));

        if (postalCode.length !== 8) {
          this.isFetchingCep = false;
          this.cepErrorMessage = '';
          this.changeDetectorRef.markForCheck();
          return of(null);
        }

        this.isFetchingCep = true;
        this.cepErrorMessage = '';
        this.changeDetectorRef.markForCheck();

        return this.viaCepService.lookup(postalCode).pipe(
          finalize(() => {
            this.isFetchingCep = false;
            this.changeDetectorRef.markForCheck();
          }),
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(address => {
      if (!address) {
        const postalCode = onlyDigits(String(this.shippingForm.get('postalCode')?.value || ''));
        if (postalCode.length === 8) {
          this.cepErrorMessage = 'CEP nao encontrado. Confira os numeros ou preencha o endereco manualmente.';
        }
        this.changeDetectorRef.markForCheck();
        return;
      }

      this.shippingForm.patchValue({
        street: address.street || this.shippingForm.value.street || '',
        district: address.district || this.shippingForm.value.district || '',
        city: address.city || this.shippingForm.value.city || '',
        state: address.state || this.shippingForm.value.state || '',
      }, { emitEvent: false });
      this.cepErrorMessage = '';
      this.changeDetectorRef.markForCheck();
    });
  }

  redirectToPayment(url: string): void {
    window.location.href = url;
  }

  private requiredFieldMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      postalCode: 'O CEP é obrigatório para calcular o frete.',
      state: 'A UF é obrigatória.',
      street: 'A rua é obrigatória.',
      number: 'O número é obrigatório.',
      district: 'O bairro é obrigatório.',
      city: 'A cidade é obrigatória.',
    };

    return messages[fieldName] || 'Campo obrigatório.';
  }

  private shippingErrorMessage(error: unknown): string {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'O calculo de frete demorou mais que o esperado. Tente novamente em instantes.';
    }

    return error instanceof Error && error.message
      ? error.message
      : 'Não foi possível calcular o frete agora. Confira o endereço e tente novamente.';
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

}
