import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard } from './guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./components/views/landing-page/landing-page.component').then(m=>m.LandingPageComponent),
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'home',
    loadChildren: () => import('./components/views/home/home.component').then(m => m.HomeComponent),
    data: { animation: 'login' },
    canActivate: [GuestGuard] // Redireciona para /dash se já estiver logado
  },
  {
    path: 'dash',
    loadChildren: () => import('./components/views/pedidos/pedidos.component').then(m=> m.PedidosComponent),
    data: { animation: 'dashboard' },
    canActivate: [AuthGuard]
  },
  {
    path: 'products',
    loadChildren: () => import('./components/views/produtos/produtos.component').then(m=>m.ProdutosComponent),
    data: { animation: 'products' },
    canActivate: [AuthGuard]
  },
  {
    path: 'clients',
    loadChildren: ()=> import('./components/views/clientes/clientes.component').then(m=> m.ClientesComponent),
    data: { animation: 'clients' },
    canActivate: [AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: '' 
  }
];