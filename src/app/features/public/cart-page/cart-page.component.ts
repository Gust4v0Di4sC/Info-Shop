import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { CartItemWithProduct } from '@app/models/cart-item.model';
import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-cart-page',
  imports: [HeaderComponent, FooterComponent, BrlCurrencyPipe, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent implements OnInit {
  items: CartItemWithProduct[] = [];
  isLoading = true;
  errorMessage = '';
  feedbackMessage = '';

  constructor(private cartService: CartServiceService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => {
      return sum + ((item.product?.price || 0) * item.quantity);
    }, 0);
  }

  loadCart(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cartService.getCartItems().subscribe({
      next: items => {
        this.items = items;
        this.isLoading = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel carregar o carrinho.';
        this.isLoading = false;
      },
    });
  }

  changeQuantity(item: CartItemWithProduct, quantity: number): void {
    this.cartService.updateQuantity(item.id, quantity).subscribe({
      next: () => this.loadCart(),
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel atualizar o item.';
      },
    });
  }

  removeItem(item: CartItemWithProduct): void {
    this.cartService.removeItem(item.id).subscribe({
      next: () => this.loadCart(),
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel remover o item.';
      },
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        this.items = [];
        this.feedbackMessage = 'Carrinho limpo.';
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel limpar o carrinho.';
      },
    });
  }

}
