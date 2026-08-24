import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Authentication depends on the httpOnly Supabase session managed by the
  // Express API. Rendering these routes on the server would run their guards
  // without browser auth state and redirect valid deep links to /home.
  ...[
    'home',
    'registro',
    'recuperar-senha',
    'nova-senha',
    'auth/callback',
    'carrinho',
    'perfil',
    'minhas-entregas',
    'pagamento/retorno',
    'dash',
    'products',
    'orders',
    'stock',
    'deliveries',
    'offers',
    'clients',
    'customization',
    'admin-profile',
  ].map(path => ({ path, renderMode: RenderMode.Client } satisfies ServerRoute)),
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
