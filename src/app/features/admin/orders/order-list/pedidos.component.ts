import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  imports: [SharedMaterialModule, ReactiveFormsModule, AdminSectionTabsComponent, NgOptimizedImage, DisplayTextPipe, BrlCurrencyPipe],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
})
export default class PedidosComponent implements OnInit, OnDestroy {
  @ViewChild('orderDetailsTemplate') private orderDetailsTemplate?: TemplateRef<unknown>;

  readonly orderTabs: AdminSectionTab[] = [
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
  ];

  searchControl = new FormControl('');
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  pagedOrders: Order[] = [];
  selectedOrder: Order | null = null;
  isLoading = false;
  pageIndex = 0;
  pageSize = 4;
  readonly pageSizeOptions = [4, 8, 12];
  hoveredImage: string | null = null;
  hoveredImageX = 0;
  hoveredImageY = 0;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private responsiveDialog: ResponsiveDialogService,
    private orderService: OrderService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadOrders();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(searchTerm => {
      this.applySearch(searchTerm || '');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
        this.applySearch(this.searchControl.value || '');
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading orders:', error);
        this.showSnackbar('Não foi possível carregar os pedidos agora.');
        this.isLoading = false;
      },
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

  openOrderDetails(order: Order): void {
    if (!this.orderDetailsTemplate) {
      return;
    }

    this.selectedOrder = order;
    this.dialog.open(this.orderDetailsTemplate, this.responsiveDialog.buildConfig({
      desktopWidth: '560px',
      panelClass: 'admin-form-dialog',
      restoreFocus: true,
      enterAnimationDuration: '220ms',
      exitAnimationDuration: '180ms',
    }));
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

  statusTone(status: string): string {
    const tones: Record<string, string> = {
      open: 'status-attention',
      payment_pending: 'status-attention',
      payment_failed: 'status-critical',
      confirmed: 'status-info',
      preparing: 'status-info',
      shipped: 'status-progress',
      delivered: 'status-success',
      canceled: 'status-muted',
    };

    return tones[status] || 'status-info';
  }

  isOrderCanceled(order: Order): boolean {
    return order.status === 'canceled';
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedOrders();
  }

  handleImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (!image.src.endsWith('/product1.png')) {
      image.src = '/product1.png';
    }
  }

  cancelOrder(order: Order): void {
    if (!order.id || this.isOrderCanceled(order)) {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, this.responsiveDialog.buildConfig({
      desktopWidth: '350px',
      panelClass: 'custom-modal',
      restoreFocus: true,
      enterAnimationDuration: '400ms',
      exitAnimationDuration: '300ms',
      data: { message: 'Cancelar este pedido? Ele ficara retido no historico, mas desativado.' },
    }));

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.orderService.cancelOrder(order.id).subscribe({
          next: updatedOrder => {
            this.orders = this.orders.map(item => item.id === updatedOrder.id ? updatedOrder : item);
            this.applySearch(this.searchControl.value || '', false);
            this.showSnackbar('Pedido cancelado e mantido no historico.');
          },
          error: error => {
            console.error('Error canceling order:', error);
            this.showSnackbar('Nao foi possivel cancelar o pedido agora. Tente novamente.');
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

  private applySearch(searchTerm: string, resetPage = true): void {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) {
      this.filteredOrders = this.orders;
      if (resetPage) {
        this.resetPagination();
      }
      this.updatePagedOrders();
      return;
    }

    this.filteredOrders = this.orders.filter(order =>
      (order.name || '').toLowerCase().includes(normalized) ||
      (order.product || '').toLowerCase().includes(normalized) ||
      (order.address || '').toLowerCase().includes(normalized) ||
      (order.status || '').toLowerCase().includes(normalized),
    );
    if (resetPage) {
      this.resetPagination();
    }
    this.updatePagedOrders();
  }

  private updatePagedOrders(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedOrders = this.filteredOrders.slice(start, start + this.pageSize);
  }
}
