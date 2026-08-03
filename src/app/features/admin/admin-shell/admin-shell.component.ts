import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterModule, SharedMaterialModule],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
})
export class AdminShellComponent {
  private authService = inject(AuthService);

  isExpanded = false;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dash' },
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
    { label: 'Clientes', icon: 'people', route: '/clients' },
  ];

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'] ?? 'default';
  }

  expandSidebar(): void {
    this.isExpanded = true;
  }

  collapseSidebar(): void {
    this.isExpanded = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
