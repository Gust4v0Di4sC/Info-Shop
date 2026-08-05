import { Component, OnInit, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ADMIN_ROLE_ACCESS, ADMIN_ROLE_LABELS, AdminRole } from '@app/models/admin.model';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { GsapInteractiveMotionDirective } from '@app/shared/directives/gsap-interactive-motion.directive';
import { GsapPageMotionDirective } from '@app/shared/directives/gsap-page-motion.directive';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [
    RouterOutlet,
    RouterModule,
    SharedMaterialModule,
    GsapInteractiveMotionDirective,
    GsapPageMotionDirective,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
})
export class AdminShellComponent implements OnInit {
  private authService = inject(AuthService);
  readonly themeService = inject(AdminThemeService);

  isExpanded = false;
  adminRole: AdminRole | null = null;

  navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dash' },
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
    { label: 'Clientes', icon: 'people', route: '/clients' },
    { label: 'Personalizacao', icon: 'palette', route: '/customization' },
  ];

  async ngOnInit(): Promise<void> {
    this.adminRole = await this.authService.getAdminRole();
  }

  visibleNavItems(): AdminNavItem[] {
    if (!this.adminRole) {
      return [];
    }

    const allowedRoutes = ADMIN_ROLE_ACCESS[this.adminRole];
    return this.navItems.filter(item => allowedRoutes.includes(item.route));
  }

  roleLabel(): string {
    return this.adminRole ? ADMIN_ROLE_LABELS[this.adminRole] : 'Administrador';
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
