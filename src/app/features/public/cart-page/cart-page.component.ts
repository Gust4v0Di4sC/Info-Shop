import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { CartItemWithProduct } from '@app/models/cart-item.model';
import { CartServiceService } from '@app/services/cart-service.service';
import { DeliveryAddress, ShippingQuoteOption } from '@app/models/shipping.model';
import { PaymentService } from '@app/services/payment.service';

@Component({
  selector: 'app-cart-page',
  imports: [NgOptimizedImage, BrlCurrencyPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent implements OnInit {
  shippingForm: FormGroup;
  items: CartItemWithProduct[] = [];
  shippingQuotes: ShippingQuoteOption[] = [];
  selectedServiceId = '';
  isLoading = true;
  pageErrorMessage = '';
  actionErrorMessage = '';
  isQuoting = false;
  isCheckingOut = false;

  constructor(
    private cartService: CartServiceService,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {
    this.shippingForm = this.fb.group({
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      district: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
      complement: [''],
    });
  }

  ngOnInit(): void {
    this.loadCart();
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
        this.pageErrorMessage = 'Nao foi possivel carregar seu carrinho agora. Tente novamente em alguns instantes.';
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
        this.showSnackbar('Nao foi possivel atualizar este item agora. Tente novamente.');
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
        this.showSnackbar('Nao foi possivel remover este item agora. Tente novamente.');
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
        this.showSnackbar('Nao foi possivel limpar o carrinho agora. Tente novamente.');
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  calculateShipping(): void {
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
          this.actionErrorMessage = 'Nao encontramos frete disponivel para este endereco.';
        }
        this.changeDetectorRef.markForCheck();
      },
      error: error => {
        this.actionErrorMessage = error instanceof Error && error.message
          ? error.message
          : 'Nao foi possivel calcular o frete agora. Confira o endereco e tente novamente.';
        this.isQuoting = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  checkout(): void {
    if (!this.selectedServiceId) {
      this.showSnackbar('Escolha uma opcao de frete antes de finalizar.');
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
        this.showSnackbar('Nao foi possivel iniciar o pagamento agora. Tente novamente em alguns instantes.');
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
      return 'Digite um CEP valido com 8 numeros.';
    }

    if (fieldName === 'state' && control.hasError('pattern')) {
      return 'Digite a UF com 2 letras.';
    }

    return 'Confira este campo.';
  }

  private deliveryAddress(): DeliveryAddress {
    const value = this.shippingForm.value;
    return {
      postalCode: this.onlyDigits(value.postalCode || ''),
      street: value.street || '',
      number: value.number || '',
      district: value.district || '',
      city: value.city || '',
      state: (value.state || '').toUpperCase(),
      complement: value.complement || null,
    };
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  redirectToPayment(url: string): void {
    window.location.href = url;
  }

  private requiredFieldMessage(fieldName: string): string {
    const messages: Record<string, string> = {
      postalCode: 'O CEP e obrigatorio para calcular o frete.',
      state: 'A UF e obrigatoria.',
      street: 'A rua e obrigatoria.',
      number: 'O numero e obrigatorio.',
      district: 'O bairro e obrigatorio.',
      city: 'A cidade e obrigatoria.',
    };

    return messages[fieldName] || 'Campo obrigatorio.';
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

}
