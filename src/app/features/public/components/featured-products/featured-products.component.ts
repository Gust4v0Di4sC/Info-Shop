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
    this.cartService.addProduct(product.id).subscribe({
      next: () => {
        this.animateToCart(event);
      },
      error: () => {
        this.errorMessage = 'Entre na sua conta para adicionar produtos ao carrinho.';
      },
    });
  }

  animateToCart(event: MouseEvent): void {
    const cartTopElement = document.querySelector('.cart-top-icon');

    if (!cartTopElement) {
      return;
    }

    const sourceElement = event.currentTarget as HTMLElement;
    const start = sourceElement.getBoundingClientRect();
    const end = cartTopElement.getBoundingClientRect();

    const clone = document.createElement('div');
    clone.classList.add('flying-cart');
    clone.style.left = `${start.left + start.width / 2}px`;
    clone.style.top = `${start.top + start.height / 2}px`;

    const icon = document.createElement('i');
    icon.className = 'fas fa-shopping-cart';
    clone.appendChild(icon);
    document.body.appendChild(clone);

    gsap.to(clone, {
      x: end.left - start.left,
      y: end.top - start.top,
      scale: 0.32,
      autoAlpha: 0,
      duration: 0.68,
      ease: 'power3.inOut',
      onComplete: () => clone.remove(),
    });
  }
}
