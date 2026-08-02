import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { CartServiceService } from '@app/services/cart-service.service';

@Component({
  selector: 'app-product-detail',
  imports: [HeaderComponent, FooterComponent, BrlCurrencyPipe, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity = 1;
  isLoading = true;
  errorMessage = '';
  feedbackMessage = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartServiceService,
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');

    if (!productId) {
      this.isLoading = false;
      this.errorMessage = 'Produto nao encontrado.';
      return;
    }

    this.productService.getProduct(productId).subscribe({
      next: product => {
        this.product = product;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar este produto.';
        this.isLoading = false;
      },
    });
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    this.quantity += 1;
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.feedbackMessage = '';
    this.cartService.addProduct(this.product.id, this.quantity).subscribe({
      next: () => {
        this.feedbackMessage = 'Produto adicionado ao carrinho.';
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel adicionar ao carrinho.';
      },
    });
  }

}
