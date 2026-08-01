import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PedidoFormComponent } from '@app/features/admin/orders/order-form/pedido-form.component';
import { Order } from '@app/models/order.model';
import { OrderService } from '@app/services/order.service';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';

@Component({
  selector: 'app-pedidos',
  imports: [SharedMaterialModule, DisplayTextPipe],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export default class PedidosComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  hoveredImage: string | null = null;
  hoveredImageX = 0;
  hoveredImageY = 0;

  constructor(
    private dialog: MatDialog,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  onMouseEnter(imageUrl: string, event: MouseEvent) {
    const chipElement = event.target as HTMLElement;
    if (chipElement) {
      const rect = chipElement.getBoundingClientRect();
      this.hoveredImageX = rect.left + window.scrollX + rect.width / 2 - 650;
      this.hoveredImageY = rect.top + window.scrollY - 150;
      this.hoveredImage = imageUrl;
    }
  }

  onMouseLeave() {
    this.hoveredImage = null;
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getOrders().subscribe({
      next: (rawOrders: Order[]) => {
        this.orders = rawOrders.filter(order => order.id !== undefined);
        this.filteredOrders = this.orders;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading orders:', error);
        this.showSnackbar('Erro ao carregar pedidos');
        this.isLoading = false;
      },
    });
  }

  openOrderForm(order?: Order): void {
    const dialogRef = this.dialog.open(PedidoFormComponent, {
      width: '500px',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: order ? { order } : {},
      panelClass: 'custom-modal',
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
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        order: order,
      },
      panelClass: 'custom-modal',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  deleteOrder(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      panelClass: 'custom-modal',
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Tem certeza que deseja excluir este item?' },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.orderService.deleteOrder(id).subscribe({
          next: () => {
            this.loadOrders();
            this.showSnackbar('Pedido excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting order:', error);
            this.showSnackbar('Erro ao excluir pedido');
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
