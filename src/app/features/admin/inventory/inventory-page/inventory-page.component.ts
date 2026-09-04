import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@app/models/product.model';
import { ProductFormService } from '@app/services/product-form.service';
import { ProductService } from '@app/services/product.service';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { debounceTime, distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-inventory-page',
  imports: [SharedMaterialModule, ReactiveFormsModule, AdminSectionTabsComponent, NgOptimizedImage],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent implements OnInit, OnDestroy {
  readonly productTabs: AdminSectionTab[] = [
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
  ];

  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  pagedProducts: Product[] = [];
  isLoading = true;
  errorMessage = '';
  pageIndex = 0;
  pageSize = 3;
  readonly pageSizeOptions = [3, 4, 6];
  private readonly destroy$ = new Subject<void>();
  private productsSubscription?: Subscription;

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
      takeUntil(this.destroy$),
    ).subscribe(term => {
      this.applySearch(term || '');
    });
  }

  ngOnDestroy(): void {
    this.productsSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.productsSubscription?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';

    this.productsSubscription = this.productService.getProducts().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: products => {
        this.products = products;
        this.applySearch(this.searchControl.value || '');
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o estoque agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  updateStock(product: Product, field: 'stock_quantity' | 'stock_reserved' | 'stock_minimum', value: string): void {
    const nextValue = Math.max(0, Number(value) || 0);

    this.productFormService.updateProduct(product.id, { [field]: nextValue }).subscribe({
      next: updated => {
        this.products = this.products.map(item => item.id === updated.id ? updated : item);
        this.applySearch(this.searchControl.value || '', false);
        this.showSnackbar('Estoque atualizado.');
      },
      error: () => {
        this.showSnackbar('Não foi possível atualizar o estoque agora. Tente novamente.');
      },
    });
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

    return 'Disponível';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedProducts();
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (!image.src.endsWith('/product1.png')) {
      image.src = '/product1.png';
    }
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 2500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private applySearch(searchTerm: string, resetPage = true): void {
    const normalized = searchTerm.trim().toLowerCase();

    this.filteredProducts = normalized
      ? this.products.filter(product =>
        product.name.toLowerCase().includes(normalized) ||
        (product.model || '').toLowerCase().includes(normalized),
      )
      : this.products;

    if (resetPage) {
      this.pageIndex = 0;
    }

    this.updatePagedProducts();
  }

  private updatePagedProducts(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, start + this.pageSize);
  }

}
