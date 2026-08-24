import { Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResponsiveDialogService } from '@app/core/layout/responsive-dialog.service';
import { PedidoFormComponent } from '@app/features/admin/orders/order-form/pedido-form.component';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { Order } from '@app/models/order.model';
import { OrderService } from '@app/services/order.service';
import { ConfirmDialogComponent } from '@app/shared/dialogs/confirm-dialog/confirm-dialog.component';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { DisplayTextPipe } from '@app/shared/pipes/display-text.pipe';

@Component({
  selector: 'app-pedidos',
  imports: [SharedMaterialModule, AdminSectionTabsComponent, NgOptimizedImage, DisplayTextPipe, BrlCurrencyPipe],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export default class PedidosComponent implements OnInit {
  readonly orderTabs: AdminSectionTab[] = [
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
  ];

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  pageIndex = 0;
  pageSize = 4;
  readonly pageSizeOptions = [4, 8, 12];
  hoveredImage: string | null = null;
  hoveredImageX = 0;
  hoveredImageY = 0;

  constructor(
    private dialog: MatDialog,
    private responsiveDialog: ResponsiveDialogService,
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
        this.resetPagination();
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading orders:', error);
        this.showSnackbar('Não foi possível carregar os pedidos agora.');
        this.isLoading = false;
      },
    });
  }

  openOrderForm(order?: Order): void {
    const dialogRef = this.dialog.open(PedidoFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '720px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: order ? { order } : {},
      panelClass: 'admin-form-dialog',
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  openEditForm(order: Order): void {
    const dialogRef = this.dialog.open(PedidoFormComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '720px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: {
        order: order,
      },
      panelClass: 'admin-form-dialog',
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOrders();
      }
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Aberto',
      payment_pending: 'Aguardando pagamento',
      payment_failed: 'Pagamento não aprovado',
      confirmed: 'Confirmado',
      preparing: 'Em preparo',
      shipped: 'Enviado',
      delivered: 'Entregue',
      canceled: 'Cancelado',
    };

    return labels[status] || status;
  }

  pagedOrders(): Order[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  deleteOrder(id: string | number): void {
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
        this.orderService.deleteOrder(id).subscribe({
          next: () => {
            this.loadOrders();
            this.showSnackbar('Pedido excluído com sucesso');
          },
          error: error => {
            console.error('Error deleting order:', error);
            this.showSnackbar('Não foi possível excluir o pedido agora. Tente novamente.');
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

  private resetPagination(): void {
    this.pageIndex = 0;
  }
}
