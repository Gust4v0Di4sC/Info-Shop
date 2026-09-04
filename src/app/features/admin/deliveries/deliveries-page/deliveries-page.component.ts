import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminSectionTab, AdminSectionTabsComponent } from '@app/features/admin/shared/admin-section-tabs/admin-section-tabs.component';
import { Delivery, DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';
import { DeliveryService } from '@app/services/delivery.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-deliveries-page',
  imports: [SharedMaterialModule, AdminSectionTabsComponent, BrlCurrencyPipe],
  templateUrl: './deliveries-page.component.html',
  styleUrl: './deliveries-page.component.scss'
})
export class DeliveriesPageComponent implements OnInit, OnDestroy {
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
  private readonly destroy$ = new Subject<void>();
  private deliveriesSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  ngOnDestroy(): void {
    this.deliveriesSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDeliveries(): void {
    this.deliveriesSubscription?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';

    this.deliveriesSubscription = this.deliveryService.getDeliveries().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
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

  registeredLabel(createdAt: string): string {
    const createdTime = new Date(createdAt).getTime();

    if (Number.isNaN(createdTime)) {
      return 'Pedido registrado recentemente';
    }

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

    if (elapsedMinutes < 1) {
      return 'Pedido registrado agora';
    }

    if (elapsedMinutes < 60) {
      return `Pedido registrado ha ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `Pedido registrado ha ${elapsedHours} h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `Pedido registrado ha ${elapsedDays} d`;
  }

  labelTone(labelStatus: string | null): string {
    const normalized = (labelStatus || '').toLowerCase();

    if (normalized.includes('impresso') || normalized.includes('gerado')) {
      return 'summary-success';
    }

    if (normalized.includes('erro') || normalized.includes('falha')) {
      return 'summary-critical';
    }

    return 'summary-attention';
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
