import { Component, OnInit } from '@angular/core';
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
  imports: [HeaderComponent, FooterComponent, BrlCurrencyPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent implements OnInit {
  shippingForm: FormGroup;
  items: CartItemWithProduct[] = [];
  shippingQuotes: ShippingQuoteOption[] = [];
  selectedServiceId = '';
  isLoading = true;
  errorMessage = '';
  feedbackMessage = '';
  isQuoting = false;
  isCheckingOut = false;

  constructor(
    private cartService: CartServiceService,
    private paymentService: PaymentService,
    private fb: FormBuilder,
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
    this.errorMessage = '';

    this.cartService.getCartItems().subscribe({
      next: items => {
        this.items = items;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar seu carrinho agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  changeQuantity(item: CartItemWithProduct, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity).subscribe({
      next: () => this.loadCart(),
      error: () => {
        this.errorMessage = 'Nao foi possivel atualizar este item agora. Tente novamente.';
      },
    });
  }

  removeItem(item: CartItemWithProduct): void {
    this.cartService.removeItem(item.id).subscribe({
      next: () => this.loadCart(),
      error: () => {
        this.errorMessage = 'Nao foi possivel remover este item agora. Tente novamente.';
      },
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.items = [];
        this.shippingQuotes = [];
        this.selectedServiceId = '';
        this.feedbackMessage = 'Carrinho limpo.';
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel limpar o carrinho agora. Tente novamente.';
      },
    });
  }

  calculateShipping(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isQuoting = true;
    this.errorMessage = '';
    this.feedbackMessage = '';
    this.shippingQuotes = [];
    this.selectedServiceId = '';

    this.cartService.calculateShipping(this.deliveryAddress()).subscribe({
      next: quotes => {
        this.shippingQuotes = quotes;
        this.selectedServiceId = quotes[0]?.id || '';
        this.isQuoting = false;
        if (quotes.length === 0) {
          this.errorMessage = 'Nao encontramos frete disponivel para este endereco.';
        }
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel calcular o frete agora. Confira o endereco e tente novamente.';
        this.isQuoting = false;
      },
    });
  }

  checkout(): void {
    if (!this.selectedServiceId) {
      this.errorMessage = 'Escolha uma opcao de frete antes de finalizar.';
      return;
    }

    this.isCheckingOut = true;
    this.errorMessage = '';

    this.paymentService.createPreference({
      address: this.deliveryAddress(),
      selectedServiceId: this.selectedServiceId,
    }).subscribe({
      next: result => {
        this.redirectToPayment(result.initPoint);
        this.isCheckingOut = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel iniciar o pagamento agora. Tente novamente em alguns instantes.';
        this.isCheckingOut = false;
      },
    });
  }

  private deliveryAddress(): DeliveryAddress {
    const value = this.shippingForm.value;
    return {
      postalCode: value.postalCode || '',
      street: value.street || '',
      number: value.number || '',
      district: value.district || '',
      city: value.city || '',
      state: (value.state || '').toUpperCase(),
      complement: value.complement || null,
    };
  }

  redirectToPayment(url: string): void {
    window.location.href = url;
  }

}
