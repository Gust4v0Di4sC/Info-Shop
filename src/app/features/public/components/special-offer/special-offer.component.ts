import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@app/models/product.model';
import { CartServiceService } from '@app/services/cart-service.service';
import { ProductService } from '@app/services/product.service';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-special-offer',
  imports: [BrlCurrencyPipe, RouterLink],
  templateUrl: './special-offer.component.html',
  styleUrls: ['./special-offer.component.scss']
})
export class SpecialOfferComponent implements OnInit, OnDestroy {
  countdown: string = '';
  product: Product | null = null;
  isLoading = true;
  errorMessage = '';
  private intervalId: any;

  constructor(
    private productService: ProductService,
    private cartService: CartServiceService,
  ) {}

  ngOnInit(): void {
    this.productService.getOfferProduct().subscribe({
      next: product => {
        this.product = product;
        this.isLoading = false;

        if (product) {
          const targetTime = product.offer_ends_at
            ? new Date(product.offer_ends_at).getTime()
            : new Date().getTime() + 1000 * 60 * 50;

          this.updateCountdown(targetTime);
          this.intervalId = setInterval(() => this.updateCountdown(targetTime), 1000);
        }
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar a oferta.';
        this.isLoading = false;
      },
    });
  }

  updateCountdown(target: number) {
    const now = new Date().getTime();
    const distance = target - now;

    if (distance <= 0) {
      this.countdown = "00:00:00";
      clearInterval(this.intervalId);
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown = `00:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.cartService.addProduct(this.product.id).subscribe();
  }

  offerPrice(): number {
    return this.product?.offer_price || this.product?.price || 0;
  }

  savings(): number {
    if (!this.product?.offer_price) {
      return 0;
    }

    return Math.max(0, Number(this.product.price || 0) - this.product.offer_price);
  }
}
