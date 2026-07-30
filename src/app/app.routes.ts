import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from '@app/core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('@app/features/public/landing-page/landing-page.component'),
    canActivate: [GuestGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('@app/features/auth/home/home.component'),
    data: { animation: 'login' },
    canActivate: [GuestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('@app/features/admin/admin-shell/admin-shell.component').then(
        m => m.AdminShellComponent,
      ),
    canActivate: [AuthGuard],
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
