import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProdutoFormComponent } from '@app/features/admin/products/product-form/produto-form.component';

@Component({
  selector: 'app-produtos',
  imports: [SharedMaterialModule, ReactiveFormsModule, BrlCurrencyPipe, DisplayTextPipe],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss',
})
export default class ProdutosComponent implements OnInit {
  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;

  constructor(
    private dialog: MatDialog,
    private productService: ProductService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(searchTerm => {
      if (!searchTerm) {
        this.filteredProducts = this.products;
        return;
      }

      const normalized = searchTerm.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(normalized) ||
        (product.description || '').toLowerCase().includes(normalized) ||
        (product.model || '').toLowerCase().includes(normalized),
      );
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (rawProducts: Product[]) => {
        this.products = rawProducts.filter(product => product.id !== undefined);
        this.filteredProducts = this.products;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading products:', error);
        this.showSnackbar('Erro ao carregar produtos');
        this.isLoading = false;
      },
    });
  }

  openProductForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, {
      width: '760px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: product ? { product } : {},
      panelClass: 'admin-form-dialog',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  openEditForm(produto: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, {
      width: '760px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        product: produto,
      },
      panelClass: 'admin-form-dialog',
    });

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

  deleteProduct(id: string | number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'custom-modal',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.loadProducts();
            this.showSnackbar('Produto excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting product:', error);
            this.showSnackbar('Erro ao excluir produto');
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
}
