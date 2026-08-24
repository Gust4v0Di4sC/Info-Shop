import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  AdminDashboardService,
  AdminOverview,
  ProductMovementMetric,
  ProductSalesMetric,
} from '@app/services/admin-dashboard.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { BrlCurrencyPipe } from '@app/shared/pipes/brl-currency.pipe';
import { DELIVERY_STATUS_LABELS } from '@app/models/delivery.model';

@Component({
  selector: 'app-admin-dashboard',
  imports: [SharedMaterialModule, RouterLink, NgOptimizedImage, BrlCurrencyPipe, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  overview: AdminOverview | null = null;
  isLoading = true;
  errorMessage = '';

  readonly salesByProductOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y} un. vendidas`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#667085', font: { weight: 700 } },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#667085', font: { weight: 700 } },
        grid: { color: '#edf2f7' },
      },
    },
  };

  readonly slowMovingOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.x} un. vendidas`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#667085', font: { weight: 700 } },
        grid: { color: '#edf2f7' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#667085', font: { weight: 700 } },
      },
    },
  };

  readonly revenueByMonthOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.38 },
      point: { radius: 4, hoverRadius: 6 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => this.formatCurrency(Number(context.parsed.y || 0)),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#667085', font: { weight: 700 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#667085',
          font: { weight: 700 },
          callback: value => this.formatCompactCurrency(Number(value)),
        },
        grid: { color: '#edf2f7' },
      },
    },
  };

  readonly pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          color: '#4f5967',
          font: { weight: 700 },
        },
      },
    },
  };

  salesByProductData: ChartData<'bar'> = this.emptyBarData();
  slowMovingData: ChartData<'bar'> = this.emptyBarData();
  revenueByMonthData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };
  ordersByStatusData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };
  inventoryByCategoryData: ChartData<'pie'> = {
    labels: [],
    datasets: [],
  };

  private readonly chartColors = ['#0f62cf', '#00a88f', '#f59e0b', '#ef4444', '#7c3aed', '#475569', '#14b8a6', '#f97316'];

  constructor(
    private dashboardService: AdminDashboardService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getOverview().subscribe({
      next: overview => {
        this.overview = overview;
        this.buildChartData(overview);
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Não foi possível carregar o painel agora. Tente novamente em alguns instantes.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  statusLabel(status: string): string {
    return DELIVERY_STATUS_LABELS[status] || status;
  }

  topSellingProduct(): ProductSalesMetric | null {
    return this.overview?.analytics.salesByProduct[0] || null;
  }

  leastMovingProduct(): ProductMovementMetric | null {
    return this.overview?.analytics.slowMovingProducts[0] || null;
  }

  hasChartData(data: ChartData<'bar' | 'line' | 'pie'>): boolean {
    return data.datasets.some(dataset => dataset.data.some(value => Number(value) > 0));
  }

  private buildChartData(overview: AdminOverview): void {
    this.salesByProductData = {
      labels: overview.analytics.salesByProduct.map(metric => this.shortLabel(metric.productName)),
      datasets: [
        {
          data: overview.analytics.salesByProduct.map(metric => metric.quantitySold),
          label: 'Unidades vendidas',
          backgroundColor: '#0f62cf',
          borderRadius: 6,
          maxBarThickness: 42,
        },
      ],
    };

    this.slowMovingData = {
      labels: overview.analytics.slowMovingProducts.map(metric => this.shortLabel(metric.productName, 28)),
      datasets: [
        {
          data: overview.analytics.slowMovingProducts.map(metric => metric.quantitySold),
          label: 'Unidades vendidas',
          backgroundColor: '#f59e0b',
          borderRadius: 6,
          maxBarThickness: 30,
        },
      ],
    };

    this.revenueByMonthData = {
      labels: overview.analytics.revenueByMonth.map(metric => metric.period),
      datasets: [
        {
          data: overview.analytics.revenueByMonth.map(metric => metric.revenue),
          label: 'Receita',
          borderColor: '#00a88f',
          backgroundColor: 'rgba(0, 168, 143, 0.14)',
          fill: true,
        },
      ],
    };

    this.ordersByStatusData = {
      labels: overview.analytics.ordersByStatus.map(metric => metric.label),
      datasets: [
        {
          data: overview.analytics.ordersByStatus.map(metric => metric.total),
          backgroundColor: this.chartColors,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };

    this.inventoryByCategoryData = {
      labels: overview.analytics.inventoryByCategory.map(metric => metric.category),
      datasets: [
        {
          data: overview.analytics.inventoryByCategory.map(metric => metric.units),
          backgroundColor: this.chartColors.slice().reverse(),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }

  private emptyBarData(): ChartData<'bar'> {
    return {
      labels: [],
      datasets: [],
    };
  }

  private shortLabel(label: string, maxLength = 22): string {
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatCompactCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

}
