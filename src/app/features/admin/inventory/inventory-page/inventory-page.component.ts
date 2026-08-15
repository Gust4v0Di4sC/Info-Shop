import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@app/models/product.model';
import { ProductFormService } from '@app/services/product-form.service';
import { ProductService } from '@app/services/product.service';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-inventory-page',
  imports: [SharedMaterialModule, ReactiveFormsModule, AdminSectionTabsComponent, NgOptimizedImage],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent implements OnInit {
  readonly productTabs: AdminSectionTab[] = [
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
  ];

  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = true;
  errorMessage = '';
  pageIndex = 0;
  pageSize = 3;
  readonly pageSizeOptions = [3, 4, 6];

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
      this.resetPagination();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.filteredProducts = products;
        this.resetPagination();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar o estoque agora. Tente novamente em alguns instantes.';
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
      error: () => {
        this.showSnackbar('Nao foi possivel atualizar o estoque agora. Tente novamente.');
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

  pagedProducts(): Product[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 2500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private resetPagination(): void {
    this.pageIndex = 0;
  }

}
