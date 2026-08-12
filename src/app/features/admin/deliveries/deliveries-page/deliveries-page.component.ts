import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Delivery, DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';
import { DeliveryService } from '@app/services/delivery.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-deliveries-page',
  imports: [SharedMaterialModule],
  templateUrl: './deliveries-page.component.html',
  styleUrl: './deliveries-page.component.scss'
})
export class DeliveriesPageComponent implements OnInit {
  deliveries: Delivery[] = [];
  isLoading = true;
  errorMessage = '';
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

  private showSnackbar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 2500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

}
