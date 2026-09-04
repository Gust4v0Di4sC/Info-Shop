import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResponsiveDialogService } from '@app/core/layout/responsive-dialog.service';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { ProdutoFormComponent } from '@app/features/admin/products/product-form/produto-form.component';

@Component({
  selector: 'app-produtos',
  imports: [SharedMaterialModule, ReactiveFormsModule, AdminSectionTabsComponent, NgOptimizedImage, BrlCurrencyPipe, DisplayTextPipe],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss',
})
export default class ProdutosComponent implements OnInit, OnDestroy {
  readonly productTabs: AdminSectionTab[] = [
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
  ];

  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  pagedProducts: Product[] = [];
  isLoading = false;
  pageIndex = 0;
  pageSize = 3;
  readonly pageSizeOptions = [3, 6, 9];
  private readonly destroy$ = new Subject<void>();
  private productsSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    private responsiveDialog: ResponsiveDialogService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(searchTerm => {
      this.applySearch(searchTerm || '');
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
    this.productsSubscription = this.productService.getProducts().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (rawProducts: Product[]) => {
        this.products = rawProducts.filter(product => product.id !== undefined);
        this.applySearch(this.searchControl.value || '');
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading products:', error);
        this.showSnackbar('Não foi possível carregar os produtos agora.');
        this.isLoading = false;
      },
    });
  }

  openProductForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '760px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: product ? { product } : {},
      panelClass: 'admin-form-dialog',
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  openEditForm(produto: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '760px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        product: produto,
      },
      panelClass: 'admin-form-dialog',
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  stockStatus(product: Product): string {
    if (product.stock_quantity === 0) {
      return 'Sem estoque';
    }

    if (product.stock_quantity <= product.stock_minimum) {
      return 'Estoque baixo';
    }

    return 'Em estoque';
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

  deleteProduct(id: string | number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '350px',
      panelClass: 'custom-modal',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' },
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.products = this.products.filter(product => product.id !== Number(id));
            this.applySearch(this.searchControl.value || '', false);
            this.showSnackbar('Produto excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting product:', error);
            this.showSnackbar('Não foi possível excluir o produto agora. Tente novamente.');
          },
        });
      }
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private applySearch(searchTerm: string, resetPage = true): void {
    const normalized = searchTerm.trim().toLowerCase();

    this.filteredProducts = normalized
      ? this.products.filter(product =>
        product.name.toLowerCase().includes(normalized) ||
        (product.description || '').toLowerCase().includes(normalized) ||
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
