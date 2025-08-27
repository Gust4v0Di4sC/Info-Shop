import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProdutoFormComponent } from '../produto-form/produto-form.component';
import { ProductService } from '../../../services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import { NavBarComponent } from "../../template/nav-bar/nav-bar.component";
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReactiveFormsModule } from '@angular/forms';
import { Product } from '../../../models/product.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-produtos',
  imports: [MatFormFieldModule, MatIcon, MatCardModule, MatToolbarModule, MatMenuModule, CommonModule, MatInputModule, MatButtonModule, NavBarComponent, ReactiveFormsModule],
  providers: [ProductService],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})
export class ProdutosComponent implements OnInit {
  searchControl = new FormControl('');
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;

  constructor(
    private dialog: MatDialog,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      console.log('Buscando por:', searchTerm);
      if (!searchTerm) {
        this.filteredProducts = this.products; // Restaura lista completa
        return;
      }
    
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('Produtos filtrados:', this.filteredProducts);
    });

  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (rawProducts: Product[]) => {
        this.products = rawProducts.filter(product => product.id !== undefined); // Filtra produtos válidos
        this.filteredProducts = this.products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.showSnackbar('Erro ao carregar produtos');
        this.isLoading = false;
      }
    });
  }
  

  openProductForm(product?: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, {
      width: '500px',
      enterAnimationDuration : '400ms',
      exitAnimationDuration : '300ms',
      data: {},
      panelClass: 'custom-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  openEditForm(produto: Product): void {
    const dialogRef = this.dialog.open(ProdutoFormComponent, {
      width: '500px',
      enterAnimationDuration : '400ms',
      exitAnimationDuration : '300ms',
      data: { 
        product: produto  // Passa o produto completo
      },
      panelClass: 'custom-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Atualizar a lista de produtos ou fazer outras ações necessárias
        this.loadProducts(); // Método para recarregar a lista de produtos
      }
    });
  }

  deleteProduct(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'custom-modal',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.loadProducts();
            this.showSnackbar('Produto excluído com sucesso');
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.showSnackbar('Erro ao excluir produto');
          }
        });
      }
    });
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}


