import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartServiceService } from '../../../services/cart-service.service';

@Component({
  selector: 'app-featured-products',
  imports: [CommonModule],
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.scss']
})
export class FeaturedProductsComponent {
    products = [
    {
      name: 'MacBook ProM2',
      price: 'R$1890,00',
      rating: 4.9,
      image: '/product1.png'
    },
    {
      name: 'iPhone 13',
      price: 'R$1890,00',
      rating: 4.9,
      image: '/product2.png'
    },
    {
      name: 'Samsung Galaxy',
      price: 'R$1890,00',
      rating: 4.9,
      image: '/product3.png'
    },
    {
      name: 'Headphones',
      price: 'R$1890,00',
      rating: 4.9,
      image: '/product4.png'
    }
  ];

   @ViewChild('cartIcon', { static: false }) cartIcon!: ElementRef;

  constructor(private cartService: CartServiceService) {}

  addToCart(event: MouseEvent) {
    this.animateToCart(event);
    this.cartService.incrementCart();
  }

  animateToCart(event: MouseEvent) {
    const cartTopElement = document.querySelector('.cart-top-icon');
    if (!cartTopElement) {
    console.warn('Topo do carrinho não encontrado!');
    return;
  }

    const sourceElement = (event.currentTarget as HTMLElement);
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

     const deltaX = end.left - start.left;
  const deltaY = end.top - start.top;

    const animation = clone.animate([
    { transform: `translate(0px, 0px)`, opacity: 1 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.3)`, opacity: 0.2 }
  ], {
    duration: 700,
    easing: 'ease-in-out'
  });
  

    animation.onfinish = () => {
      clone.remove();
    };
  }
}