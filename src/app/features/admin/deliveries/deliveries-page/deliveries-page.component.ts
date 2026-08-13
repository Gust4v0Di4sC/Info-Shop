import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { Delivery, DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';
import { DeliveryService } from '@app/services/delivery.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-deliveries-page',
  imports: [SharedMaterialModule, AdminSectionTabsComponent],
  templateUrl: './deliveries-page.component.html',
  styleUrl: './deliveries-page.component.scss'
})
export class DeliveriesPageComponent implements OnInit {
  readonly orderTabs: AdminSectionTab[] = [
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
  ];

  deliveries: Delivery[] = [];
  isLoading = true;
  errorMessage = '';
  pageIndex = 0;
  pageSize = 2;
  readonly pageSizeOptions = [2, 4, 6];
  statusOptions = Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  constructor(
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deliveryService.getDeliveries().subscribe({
      next: deliveries => {
        this.deliveries = deliveries;
        this.resetPagination();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar as entregas agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  updateDelivery(delivery: Delivery, field: 'status' | 'tracking_code' | 'carrier' | 'notes', value: string): void {
    const update = {
      [field]: value || null,
      ...(field === 'status' && value === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
    };

    this.deliveryService.updateDelivery(delivery.id, update).subscribe({
      next: updated => {
        this.deliveries = this.deliveries.map(item => item.id === updated.id ? updated : item);
        this.showSnackbar('Entrega atualizada.');
      },
      error: () => {
        this.showSnackbar('Nao foi possivel atualizar a entrega agora. Tente novamente.');
      },
    });
  }

  statusLabel(status: string): string {
    return DELIVERY_STATUS_LABELS[status] || status;
  }

  pagedDeliveries(): Delivery[] {
    const start = this.pageIndex * this.pageSize;
    return this.deliveries.slice(start, start + this.pageSize);
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
