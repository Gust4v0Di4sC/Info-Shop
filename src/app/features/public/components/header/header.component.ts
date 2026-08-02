import { Component, OnInit } from '@angular/core';
import { CartServiceService } from '@app/services/cart-service.service';
import { supabase } from '@app/core/supabase/supabase.client';

import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  cartCount = 0;

  constructor(private cartService: CartServiceService,private router: Router) {}

  ngOnInit() {
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });
    this.cartService.refreshCartCount().subscribe();
  }
  
  goToHome() {
    this.router.navigate(['/home']); // rota configurada no app-routing.module.ts
  }

  async goToProfile() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      this.router.navigate(['/home']);
      return;
    }

    this.router.navigate(['/perfil']);
  }

  goToCart() {
    this.router.navigate(['/carrinho']);
  }
}
