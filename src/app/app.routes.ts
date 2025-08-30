import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/views/landing-page/landing-page.component'),
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'home',
    loadComponent: () => import('./components/views/home/home.component'),
    data: { animation: 'login' },
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'dash',
    loadComponent: () => import('./components/views/pedidos/pedidos.component'),
    data: { animation: 'dashboard' },
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./components/views/produtos/produtos.component'),
    data: { animation: 'products' },
    canActivate: [AuthGuard]
  },
  {
    path: 'clients',
    loadComponent: ()=> import('./components/views/clientes/clientes.component'),
    data: { animation: 'clients' },
    canActivate: [AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];