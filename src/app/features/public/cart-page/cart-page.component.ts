import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { CartItemWithProduct } from '@app/models/cart-item.model';
import { CartServiceService } from '@app/services/cart-service.service';
import { DeliveryAddress, ShippingQuoteOption } from '@app/models/shipping.model';
import { PaymentService } from '@app/services/payment.service';

@Component({
  selector: 'app-cart-page',
  imports: [HeaderComponent, FooterComponent, NgOptimizedImage, BrlCurrencyPipe, RouterLink, ReactiveFormsModule],
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
  feedbackMessage = '';
  isQuoting = false;
  isCheckingOut = false;

  constructor(
    private cartService: CartServiceService,
    private paymentService: PaymentService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.shippingForm = this.fb.group({
      postalCode: ['', [Validators.required, Validators.minLength(8)]],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      district: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
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
        this.actionErrorMessage = 'Nao foi possivel atualizar este item agora. Tente novamente.';
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  removeItem(item: CartItemWithProduct): void {
    this.actionErrorMessage = '';
    this.cartService.removeItem(item.id).subscribe({
      next: () => this.loadCart(),
      error: () => {
        this.actionErrorMessage = 'Nao foi possivel remover este item agora. Tente novamente.';
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
        this.feedbackMessage = 'Carrinho limpo.';
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.actionErrorMessage = 'Nao foi possivel limpar o carrinho agora. Tente novamente.';
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
    this.feedbackMessage = '';
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
      this.actionErrorMessage = 'Escolha uma opcao de frete antes de finalizar.';
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
        this.actionErrorMessage = 'Nao foi possivel iniciar o pagamento agora. Tente novamente em alguns instantes.';
        this.isCheckingOut = false;
        this.changeDetectorRef.markForCheck();
      },
    });
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

}
