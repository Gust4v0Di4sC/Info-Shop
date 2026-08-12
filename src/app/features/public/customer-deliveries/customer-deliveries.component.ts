import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '@app/features/public/components/header/header.component';
import { FooterComponent } from '@app/features/public/components/footer/footer.component';
import { Delivery, DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';
import { DeliveryService } from '@app/services/delivery.service';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';

@Component({
  selector: 'app-customer-deliveries',
  imports: [HeaderComponent, FooterComponent, RouterLink, BrlCurrencyPipe],
  templateUrl: './customer-deliveries.component.html',
  styleUrl: './customer-deliveries.component.scss',
})
export class CustomerDeliveriesComponent implements OnInit {
  deliveries: Delivery[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deliveryService.getCurrentUserDeliveries().subscribe({
      next: deliveries => {
        this.deliveries = deliveries;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar suas entregas agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
      },
    });
  }

  statusLabel(status: string): string {
    return DELIVERY_STATUS_LABELS[status] || status;
  }

  progress(delivery: Delivery): number {
    const order = ['pending', 'preparing', 'shipped', 'out_for_delivery', 'delivered'];
    const index = order.indexOf(delivery.status);
    return index < 0 ? 0 : Math.round(((index + 1) / order.length) * 100);
  }

  dateLabel(value: string | null): string {
    if (!value) {
      return 'A confirmar';
    }

    return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
  }
}
