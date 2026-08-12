import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';
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

  addToCart(event: MouseEvent): void {
    if (!this.product) {
      return;
    }

    const sourceElement = event.currentTarget as HTMLElement;

    this.cartService.addProduct(this.product.id).subscribe({
      next: () => this.animateToCart(sourceElement),
      error: () => {
        this.errorMessage = 'Entre na sua conta para adicionar produtos ao carrinho.';
      },
    });
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

  private animateToCart(sourceElement: HTMLElement): void {
    const cartTopElement = document.querySelector<HTMLElement>('.cart-btn');

    if (!cartTopElement) {
      return;
    }

    const start = sourceElement.getBoundingClientRect();
    const end = cartTopElement.getBoundingClientRect();
    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = end.left + end.width / 2;
    const endY = end.top + end.height / 2;

    const clone = document.createElement('div');
    clone.classList.add('flying-cart');
    clone.style.left = `${startX}px`;
    clone.style.top = `${startY}px`;

    const icon = document.createElement('i');
    icon.className = 'fas fa-shopping-cart';
    clone.appendChild(icon);
    document.body.appendChild(clone);

    gsap.to(clone, {
      x: endX - startX,
      y: endY - startY,
      scale: 0.32,
      autoAlpha: 0,
      duration: 0.68,
      ease: 'power3.inOut',
      onComplete: () => clone.remove(),
    });

    gsap.fromTo(
      cartTopElement,
      { scale: 0.94 },
      {
        scale: 1,
        duration: 0.42,
        ease: 'elastic.out(1, 0.45)',
        delay: 0.42,
        clearProps: 'transform',
      },
    );
  }
}
