import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { ADMIN_DEFAULT_ROUTE, ADMIN_ROLE_ACCESS, ADMIN_ROLE_LABELS, AdminRole } from '@app/models/admin.model';
import { AdminStoreContext, TenantContextService } from '@app/core/tenant/tenant-context.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { AdminProfileService } from '@app/services/admin-profile.service';
import { GsapInteractiveMotionDirective } from '@app/shared/directives/gsap-interactive-motion.directive';
import { GsapPageMotionDirective } from '@app/shared/directives/gsap-page-motion.directive';
import { SharedMaterialModule } from '@app/shared/material/shared-material.module';
import { Subscription } from 'rxjs';

interface AdminNavItem {
  label: string;
  icon: string;
  routes: string[];
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
  private adminProfileService = inject(AdminProfileService);
  private router = inject(Router);
  readonly themeService = inject(AdminThemeService);
  private subscriptions = new Subscription();

  isExpanded = false;
  adminRole: AdminRole | null = null;
  stores: AdminStoreContext[] = [];
  selectedStoreId: string | null = null;
  adminName = 'Administrador';

  navItems: AdminNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', routes: ['/dash'] },
    { label: 'Produtos', icon: 'storefront', routes: ['/products', '/stock', '/offers'] },
    { label: 'Pedidos', icon: 'receipt_long', routes: ['/orders', '/deliveries'] },
    { label: 'Clientes', icon: 'people', routes: ['/clients'] },
    { label: 'Perfil', icon: 'account_circle', routes: ['/admin-profile', '/customization'] },
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

    await this.themeService.initialize();
    await this.tenantContext.initialize();
    this.adminRole = await this.authService.getAdminRole();
    this.loadAdminName();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  visibleNavItems(): AdminNavItem[] {
    if (!this.adminRole) {
      return [];
    }

    const allowedRoutes = ADMIN_ROLE_ACCESS[this.adminRole];
    return this.navItems.filter(item => item.routes.some(route => allowedRoutes.includes(route)));
  }

  navItemRoute(item: AdminNavItem): string {
    if (!this.adminRole) {
      return item.routes[0];
    }

    const allowedRoutes = ADMIN_ROLE_ACCESS[this.adminRole];
    return item.routes.find(route => allowedRoutes.includes(route)) || item.routes[0];
  }

  isNavItemActive(item: AdminNavItem): boolean {
    const currentPath = this.router.url.split(/[?#]/)[0];
    return item.routes.includes(currentPath);
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

  goToAdminHome(): void {
    if (!this.adminRole) {
      return;
    }

    this.collapseSidebar();
    void this.router.navigate([ADMIN_DEFAULT_ROUTE[this.adminRole]]);
  }

  userInitials(): string {
    return this.adminName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'AD';
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

  private loadAdminName(): void {
    this.subscriptions.add(
      this.adminProfileService.getCurrentAdminProfile().subscribe({
        next: profile => {
          this.adminName = profile.user.full_name || profile.user.email || 'Administrador';
        },
        error: () => {
          const user = this.authService.getCurrentUser();
          const metadata = user?.user_metadata || {};
          this.adminName = String(metadata['full_name'] || metadata['name'] || user?.email || 'Administrador');
        },
      }),
    );
  }
}
