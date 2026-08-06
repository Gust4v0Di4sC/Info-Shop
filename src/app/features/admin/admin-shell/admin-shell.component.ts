import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ADMIN_ROLE_ACCESS, ADMIN_ROLE_LABELS, AdminRole } from '@app/models/admin.model';
import { AdminStoreContext, TenantContextService } from '@app/core/tenant/tenant-context.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { GsapInteractiveMotionDirective } from '@app/shared/directives/gsap-interactive-motion.directive';
import { GsapPageMotionDirective } from '@app/shared/directives/gsap-page-motion.directive';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { Subscription } from 'rxjs';

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
export class AdminShellComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private tenantContext = inject(TenantContextService);
  readonly themeService = inject(AdminThemeService);
  private subscriptions = new Subscription();

  isExpanded = false;
  adminRole: AdminRole | null = null;
  stores: AdminStoreContext[] = [];
  selectedStoreId: string | null = null;

  navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dash' },
    { label: 'Produtos', icon: 'storefront', route: '/products' },
    { label: 'Pedidos', icon: 'receipt_long', route: '/orders' },
    { label: 'Estoque', icon: 'inventory_2', route: '/stock' },
    { label: 'Entregas', icon: 'local_shipping', route: '/deliveries' },
    { label: 'Ofertas', icon: 'sell', route: '/offers' },
    { label: 'Clientes', icon: 'people', route: '/clients' },
    { label: 'Personalizacao', icon: 'palette', route: '/customization' },
    { label: 'Meu perfil', icon: 'account_circle', route: '/admin-profile' },
  ];

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.tenantContext.stores$.subscribe(stores => {
        this.stores = stores;
      }),
    );
    this.subscriptions.add(
      this.tenantContext.selectedStoreId$.subscribe(storeId => {
        this.selectedStoreId = storeId;
      }),
    );

    await this.tenantContext.initialize();
    this.adminRole = await this.authService.getAdminRole();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  canSwitchStores(): boolean {
    return this.stores.length > 1;
  }

  selectedStoreLabel(): string {
    return this.stores.find(store => store.id === this.selectedStoreId)?.name || 'Loja';
  }

  selectStore(storeId: string): void {
    this.tenantContext.selectStore(storeId);
  }

  expandSidebar(): void {
    this.isExpanded = true;
  }

  collapseSidebar(): void {
    this.isExpanded = false;
  }

  logout(): void {
    this.tenantContext.reset();
    this.authService.logout();
  }
}
