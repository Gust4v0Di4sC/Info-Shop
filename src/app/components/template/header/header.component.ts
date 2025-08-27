import { Component, OnInit } from '@angular/core';
import { CartServiceService } from '../../../services/cart-service.service';

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
  }
  
  goToHome() {
    this.router.navigate(['/home']); // rota configurada no app-routing.module.ts
  }
}
