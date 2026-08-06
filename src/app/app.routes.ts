import { Routes } from '@angular/router';
import { AdminGuard, AuthGuard, GuestGuard } from '@app/core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@app/features/public/landing-page/landing-page.component'),
  },
  {
    path: 'home',
    loadComponent: () => import('@app/features/auth/home/home.component'),
    data: { animation: 'login' },
    canActivate: [GuestGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('@app/features/auth/register/register.component').then(
      m => m.RegisterComponent,
    ),
    data: { animation: 'register' },
    canActivate: [GuestGuard],
  },
  {
    path: 'recuperar-senha',
    loadComponent: () => import('@app/features/auth/password-recovery/password-recovery.component').then(
      m => m.PasswordRecoveryComponent,
    ),
    data: { animation: 'password-recovery' },
    canActivate: [GuestGuard],
  },
  {
    path: 'nova-senha',
    loadComponent: () => import('@app/features/auth/new-password/new-password.component').then(
      m => m.NewPasswordComponent,
    ),
    data: { animation: 'new-password' },
    canActivate: [AuthGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('@app/features/auth/auth-callback/auth-callback.component').then(
      m => m.AuthCallbackComponent,
    ),
    data: { animation: 'auth-callback' },
  },
  {
    path: 'produto/:id',
    loadComponent: () => import('@app/features/public/product-detail/product-detail.component').then(
      m => m.ProductDetailComponent,
    ),
    data: { animation: 'product-detail' },
  },
  {
    path: 'carrinho',
    loadComponent: () => import('@app/features/public/cart-page/cart-page.component').then(
      m => m.CartPageComponent,
    ),
    data: { animation: 'cart' },
  },
  {
    path: 'perfil',
    loadComponent: () => import('@app/features/public/customer-profile/customer-profile.component').then(
      m => m.CustomerProfileComponent,
    ),
    data: { animation: 'profile' },
    canActivate: [AuthGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('@app/features/admin/admin-shell/admin-shell.component').then(
        m => m.AdminShellComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
    children: [
      {
        path: 'dash',
        loadComponent: () => import('@app/features/admin/dashboard/admin-dashboard/admin-dashboard.component').then(
          m => m.AdminDashboardComponent,
        ),
        canActivate: [AdminGuard],
        data: { animation: 'dashboard', allowedRoles: ['gerente', 'gerente_regional'] },
      },
      {
        path: 'products',
        loadComponent: () => import('@app/features/admin/products/product-list/produtos.component'),
        canActivate: [AdminGuard],
        data: { animation: 'products', allowedRoles: ['gerente', 'gerente_regional', 'estoquista'] },
      },
      {
        path: 'orders',
        loadComponent: () => import('@app/features/admin/orders/order-list/pedidos.component'),
        canActivate: [AdminGuard],
        data: { animation: 'orders', allowedRoles: ['gerente', 'gerente_regional', 'vendedor'] },
      },
      {
        path: 'stock',
        loadComponent: () => import('@app/features/admin/inventory/inventory-page/inventory-page.component').then(
          m => m.InventoryPageComponent,
        ),
        canActivate: [AdminGuard],
        data: { animation: 'stock', allowedRoles: ['gerente', 'gerente_regional', 'estoquista'] },
      },
      {
        path: 'deliveries',
        loadComponent: () => import('@app/features/admin/deliveries/deliveries-page/deliveries-page.component').then(
          m => m.DeliveriesPageComponent,
        ),
        canActivate: [AdminGuard],
        data: { animation: 'deliveries', allowedRoles: ['gerente', 'gerente_regional', 'vendedor'] },
      },
      {
        path: 'offers',
        loadComponent: () => import('@app/features/admin/offers/offer-management/offer-management.component').then(
          m => m.OfferManagementComponent,
        ),
        canActivate: [AdminGuard],
        data: { animation: 'offers', allowedRoles: ['gerente', 'gerente_regional', 'vendedor'] },
      },
      {
        path: 'clients',
        loadComponent: () => import('@app/features/admin/clients/client-list/clientes.component'),
        canActivate: [AdminGuard],
        data: { animation: 'clients', allowedRoles: ['gerente', 'gerente_regional', 'vendedor'] },
      },
      {
        path: 'customization',
        loadComponent: () => import('@app/features/admin/personalization/admin-personalization.component').then(
          m => m.AdminPersonalizationComponent,
        ),
        canActivate: [AdminGuard],
        data: {
          animation: 'customization',
          allowedRoles: ['gerente', 'gerente_regional', 'vendedor', 'estoquista'],
        },
      },
      {
        path: 'admin-profile',
        loadComponent: () => import('@app/features/admin/profile/admin-profile.component').then(
          m => m.AdminProfileComponent,
        ),
        canActivate: [AdminGuard],
        data: {
          animation: 'admin-profile',
          allowedRoles: ['gerente', 'gerente_regional', 'vendedor', 'estoquista'],
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
