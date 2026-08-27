import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { HardwareBenchmarkChatComponent } from '@app/features/public/components/hardware-benchmark-chat/hardware-benchmark-chat.component';

@Component({
  selector: 'app-product-detail',
  imports: [BrlCurrencyPipe, MatIconModule, RouterLink, HardwareBenchmarkChatComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity = 1;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private changeDetectorRef: ChangeDetectorRef,
    private injector: Injector,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');

    if (!productId) {
      this.isLoading = false;
      this.errorMessage = 'Produto não encontrado.';
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.productService.getProduct(productId).subscribe({
      next: product => {
        this.product = product;
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar este produto.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
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

    void this.addProductToCart(this.product);
  }

  displayPrice(): number {
    return this.product?.offer_price || this.product?.price || 0;
  }

  private async addProductToCart(product: Product): Promise<void> {
    const { CartServiceService } = await import('@app/services/cart-service.service');

    this.injector.get(CartServiceService).addProduct(product.id, this.quantity).subscribe({
      next: () => {
        this.showSnackbar(`${product.name} foi adicionado ao carrinho.`);
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.showSnackbar('Não foi possível adicionar este produto ao carrinho. Entre na sua conta e tente novamente.');
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
