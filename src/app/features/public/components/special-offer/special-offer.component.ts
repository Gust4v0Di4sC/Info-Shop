import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-special-offer',
  imports: [BrlCurrencyPipe, RouterLink],
  templateUrl: './special-offer.component.html',
  styleUrls: ['./special-offer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialOfferComponent implements OnInit, OnDestroy {
  countdown: string = '';
  product: Product | null = null;
  isLoading = true;
  errorMessage = '';
  private intervalId: any;
  private readonly isBrowser: boolean;

  constructor(
    private productService: ProductService,
    private changeDetectorRef: ChangeDetectorRef,
    private injector: Injector,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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

          if (this.isBrowser) {
            this.intervalId = setInterval(() => this.updateCountdown(targetTime), 1000);
          }
        }

        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar a oferta.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  updateCountdown(target: number) {
    const now = new Date().getTime();
    const distance = target - now;

    if (distance <= 0) {
      this.countdown = "00:00:00";
      clearInterval(this.intervalId);
      this.changeDetectorRef.markForCheck();
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown = `00:${this.pad(minutes)}:${this.pad(seconds)}`;
    this.changeDetectorRef.markForCheck();
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

    void this.addProductToCart(this.product, sourceElement);
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

  private async animateToCart(sourceElement: HTMLElement): Promise<void> {
    const cartTopElement = document.querySelector<HTMLElement>('.cart-btn');

    if (!cartTopElement) {
      return;
    }

    const { gsap } = await import('gsap');

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

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'shopping_cart';
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

  private async addProductToCart(product: Product, sourceElement: HTMLElement): Promise<void> {
    const { CartServiceService } = await import('@app/services/cart-service.service');

    this.injector.get(CartServiceService).addProduct(product.id).subscribe({
      next: () => {
        this.showSnackbar(`${product.name} foi adicionado ao carrinho.`);
        void this.animateToCart(sourceElement);
      },
      error: () => {
        this.showSnackbar('Entre na sua conta para adicionar produtos ao carrinho.');
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
