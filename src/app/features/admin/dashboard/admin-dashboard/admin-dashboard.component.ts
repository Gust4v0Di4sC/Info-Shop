import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDashboardService, AdminOverview } from '@app/services/admin-dashboard.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [SharedMaterialModule, RouterLink, BrlCurrencyPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  overview: AdminOverview | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(private dashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getOverview().subscribe({
      next: overview => {
        this.overview = overview;
        this.isLoading = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Nao foi possivel carregar o dashboard.';
        this.isLoading = false;
      },
    });
  }

  statusLabel(status: string): string {
    return DELIVERY_STATUS_LABELS[status] || status;
  }

}
