import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@app/models/product.model';
import { ProductFormService } from '@app/services/product-form.service';
import { ProductService } from '@app/services/product.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-inventory-page',
  imports: [SharedMaterialModule, ReactiveFormsModule],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent implements OnInit {
  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private productService: ProductService,
    private productFormService: ProductFormService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
    ).subscribe(term => {
      const normalized = (term || '').toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(normalized) ||
        (product.model || '').toLowerCase().includes(normalized),
      );
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.filteredProducts = products;
        this.isLoading = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel carregar o estoque.';
        this.isLoading = false;
      },
    });
  }

  updateStock(product: Product, field: 'stock_quantity' | 'stock_reserved' | 'stock_minimum', value: string): void {
    const nextValue = Math.max(0, Number(value) || 0);

    this.productFormService.updateProduct(product.id, { [field]: nextValue }).subscribe({
      next: updated => {
        this.products = this.products.map(item => item.id === updated.id ? updated : item);
        this.filteredProducts = this.filteredProducts.map(item => item.id === updated.id ? updated : item);
        this.showSnackbar('Estoque atualizado.');
      },
      error: error => {
        this.showSnackbar(error?.message || 'Nao foi possivel atualizar o estoque.');
      },
    });
  }

  adjustStock(product: Product, delta: number): void {
    this.updateStock(product, 'stock_quantity', String(product.stock_quantity + delta));
  }

  availableStock(product: Product): number {
    return Math.max(0, product.stock_quantity - product.stock_reserved);
  }

  stockStatus(product: Product): string {
    if (product.stock_quantity === 0) {
      return 'Sem estoque';
    }

    if (product.stock_quantity <= product.stock_minimum) {
      return 'Estoque baixo';
    }

    return 'Disponivel';
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 2500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

}
