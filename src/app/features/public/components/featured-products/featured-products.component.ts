import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { CartServiceService } from '@app/services/cart-service.service';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-featured-products',
  imports: [BrlCurrencyPipe, RouterLink],
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.scss'],
})
export class FeaturedProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  @ViewChild('cartIcon', { static: false }) cartIcon!: ElementRef;

  constructor(
    private cartService: CartServiceService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    this.productService.getFeaturedProducts().subscribe({
      next: products => {
        this.products = products;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar os produtos.';
        this.isLoading = false;
      },
    });
  }

  addToCart(event: MouseEvent, product: Product): void {
    event.preventDefault();
    event.stopPropagation();
    const sourceElement = event.currentTarget as HTMLElement;

    this.cartService.addProduct(product.id).subscribe({
      next: () => {
        this.animateToCart(sourceElement);
      },
      error: () => {
        this.errorMessage = 'Entre na sua conta para adicionar produtos ao carrinho.';
      },
    });
  }

  animateToCart(sourceElement: HTMLElement): void {
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
