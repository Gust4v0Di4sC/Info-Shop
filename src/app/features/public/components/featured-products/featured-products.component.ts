import { Component, ElementRef, ViewChild } from '@angular/core';

import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-featured-products',
  imports: [],
  templateUrl: './featured-products.component.html',
  styleUrls: ['./featured-products.component.scss']
})
export class FeaturedProductsComponent {
  products = [
    {
      name: 'Notebook UltraBook Pro M2',
      description: '16GB RAM - 512GB SSD',
      price: 'R$ 1.890,00',
      installments: '12x de R$ 157,50 sem juros',
      rating: '4,9 (214 avaliacoes)',
      badge: 'Mais vendido',
      image: '/product1.png',
    },
    {
      name: 'Smartphone Nova 5G',
      description: '256GB - Tela 6,7"',
      price: 'R$ 2.450,00',
      installments: '12x de R$ 204,16 sem juros',
      rating: '4,7 (168 avaliacoes)',
      badge: '',
      image: '/product2.png',
    },
    {
      name: 'Headset Studio ANC',
      description: 'Cancelamento de ruido - 40h',
      price: 'R$ 690,00',
      installments: '10x de R$ 69,00 sem juros',
      rating: '4,8 (302 avaliacoes)',
      badge: 'Novo',
      image: '/product3.png',
    },
    {
      name: 'Kit Teclado + Mouse Gamer',
      description: 'Mecanico - 16.000 DPI',
      price: 'R$ 420,00',
      installments: '8x de R$ 52,50 sem juros',
      rating: '4,6 (121 avaliacoes)',
      badge: '',
      image: '/product4.png',
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
