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
        loadComponent: () => import('@app/features/admin/orders/order-list/pedidos.component'),
        data: { animation: 'dashboard' },
      },
      {
        path: 'products',
        loadComponent: () => import('@app/features/admin/products/product-list/produtos.component'),
        data: { animation: 'products' },
      },
      {
        path: 'clients',
        loadComponent: () => import('@app/features/admin/clients/client-list/clientes.component'),
        data: { animation: 'clients' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
