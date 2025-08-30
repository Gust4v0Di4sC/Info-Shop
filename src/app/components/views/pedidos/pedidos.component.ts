
import { MatButton } from '@angular/material/button';
import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, } from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import { Order } from '@app/models/order.model';
import { PedidoFormComponent } from '@app/components/views/pedido-form/pedido-form.component';
 import { OrderService } from '@app/services/order.service';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavBarComponent } from "@app/components/template/nav-bar/nav-bar.component";
import { ConfirmDialogComponent } from '@app/components/views/confirm-dialog/confirm-dialog.component';



@Component({
  selector: 'app-pedidos',
  imports: [MatButton, MatIcon, MatCard, MatCardContent, MatChipsModule, NavBarComponent],
  providers: [OrderService],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss'
})
export default class PedidosComponent implements OnInit {
  searchControl = new FormControl('');
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  hoveredImage: string | null = null;
  hoveredImageX: number = 0;
  hoveredImageY: number = 0;

  constructor(
      private dialog: MatDialog,
      private orderService: OrderService,
      private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  onMouseEnter(imageUrl: string, event: MouseEvent) {
    const chipElement = event.target as HTMLElement;
    if (chipElement) {
      const rect = chipElement.getBoundingClientRect();
      this.hoveredImageX = rect.left + window.scrollX + rect.width / 2 - 650; // Centraliza a imagem acima do chip
      this.hoveredImageY = rect.top + window.scrollY - 150; // Ajusta para aparecer acima do chip
      this.hoveredImage = imageUrl;
    }
  }

  onMouseLeave() {
    this.hoveredImage = null; // Esconde a imagem ao tirar o mouse
  }

  loadOrders(): void {
      this.isLoading = true;
      this.orderService.getOrders().subscribe({
        next: (rawOrders: Order[]) => {
          this.orders = rawOrders.filter(order => order.id !== undefined); // Filtra produtos válidos
          this.filteredOrders = this.orders;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.showSnackbar('Erro ao carregar produtos');
          this.isLoading = false;
        }
      });
    }
    
  
    openOrderForm(order?: Order): void {
      const dialogRef = this.dialog.open(PedidoFormComponent, {
        width: '500px',
        enterAnimationDuration : '400ms',
        exitAnimationDuration : '300ms',
        data: {},
        // cria uma classe customizada para o modal
        panelClass: 'custom-modal'
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadOrders();
        }
      });
    }


     openEditForm(order: Order): void {
        const dialogRef = this.dialog.open(PedidoFormComponent, {
          width: '500px',
          enterAnimationDuration : '400ms',
          exitAnimationDuration : '300ms',
          data: { 
            order: order  // Passa o produto completo
          },
          panelClass: 'custom-modal'
        });
    
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Atualizar a lista de produtos ou fazer outras ações necessárias
            this.loadOrders(); // Método para recarregar a lista de produtos
          }
        });
      }

  deleteOrder(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'custom-modal',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
       this.orderService.deleteOrder(id).subscribe({
        next: () => {
          this.loadOrders();
          this.showSnackbar('Pedido excluído com sucesso');
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          this.showSnackbar('Erro ao excluir pedido');
        }
      });
      }
    });
  }
}
