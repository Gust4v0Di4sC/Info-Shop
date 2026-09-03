import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
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
  @ViewChild('deliveryDetailsTemplate') private deliveryDetailsTemplate?: TemplateRef<unknown>;

  readonly orderTabs: AdminSectionTab[] = [
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
  ];

  deliveries: Delivery[] = [];
  pagedDeliveries: Delivery[] = [];
  selectedDelivery: Delivery | null = null;
  isLoading = true;
  errorMessage = '';
  pageIndex = 0;
  pageSize = 2;
  readonly pageSizeOptions = [2, 4, 6];
  statusOptions = Object.entries(DELIVERY_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  constructor(
    private dialog: MatDialog,
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
        this.updatePagedDeliveries();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar as entregas agora. Tente novamente em alguns instantes.';
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
        this.updatePagedDeliveries();
        this.showSnackbar('Entrega atualizada.');
      },
      error: () => {
        this.showSnackbar('Não foi possível atualizar a entrega agora. Tente novamente.');
      },
    });
  }

  statusLabel(status: string): string {
    return DELIVERY_STATUS_LABELS[status] || status;
  }

  statusTone(status: string): string {
    const tones: Record<string, string> = {
      pending: 'status-critical',
      preparing: 'status-attention',
      shipped: 'status-progress',
      out_for_delivery: 'status-urgent',
      delivered: 'status-success',
      canceled: 'status-muted',
    };

    return tones[status] || 'status-attention';
  }

  severityLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Alta prioridade',
      preparing: 'Atencao',
      shipped: 'Monitorar',
      out_for_delivery: 'Urgente',
      delivered: 'Concluida',
      canceled: 'Desativada',
    };

    return labels[status] || 'Atencao';
  }

  openDeliveryDetails(delivery: Delivery): void {
    if (!this.deliveryDetailsTemplate) {
      return;
    }

    this.selectedDelivery = delivery;
    this.dialog.open(this.deliveryDetailsTemplate, {
      width: 'min(560px, calc(100vw - 32px))',
      panelClass: 'admin-form-dialog',
      restoreFocus: true,
      enterAnimationDuration: '220ms',
      exitAnimationDuration: '180ms',
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedDeliveries();
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

  private updatePagedDeliveries(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedDeliveries = this.deliveries.slice(start, start + this.pageSize);
  }

}
