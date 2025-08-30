import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from '@app/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@app/components/views/landing-page/landing-page.component'),
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'home',
    loadComponent: () => import('@app/components/views/home/home.component'),
    data: { animation: 'login' },
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'dash',
    loadComponent: () => import('@app/components/views/pedidos/pedidos.component'),
    data: { animation: 'dashboard' },
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('@app/components/views/produtos/produtos.component'),
    data: { animation: 'products' },
    canActivate: [AuthGuard]
  },
  {
    path: 'clients',
    loadComponent: ()=> import('@app/components/views/clientes/clientes.component'),
    data: { animation: 'clients' },
    canActivate: [AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];