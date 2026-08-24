export type AdminThemeId = 'corporate' | 'graphite' | 'emerald';

export interface AdminThemePalette {
  background: string;
  card: string;
  primary: string;
  foreground: string;
}

export interface AdminThemeOption {
  id: AdminThemeId;
  label: string;
  className: string;
  description: string;
  palette: AdminThemePalette;
}

export interface AdminPersonalization {
  themeId: AdminThemeId;
  storeLogoUrl: string | null;
}

export const DEFAULT_ADMIN_THEME_ID: AdminThemeId = 'corporate';

export const ADMIN_THEME_OPTIONS: AdminThemeOption[] = [
  {
    id: 'corporate',
    label: 'Azul Corporativo',
    className: 'admin-theme-corporate',
    description: 'Claro, sóbrio e alinhado à identidade principal da loja.',
    palette: {
      background: '#eef2f8',
      card: '#ffffff',
      primary: '#1e40af',
      foreground: '#0f172a',
    },
  },
  {
    id: 'graphite',
    label: 'Grafite Escuro',
    className: 'admin-theme-graphite',
    description: 'Escuro para uso prolongado, com destaque ambar.',
    palette: {
      background: '#15181d',
      card: '#1e232b',
      primary: '#f0a500',
      foreground: '#f5f7fa',
    },
  },
  {
    id: 'emerald',
    label: 'Esmeralda Contraste',
    className: 'admin-theme-emerald',
    description: 'Alto contraste com verde para métricas e operação.',
    palette: {
      background: '#f2f7f4',
      card: '#ffffff',
      primary: '#065f46',
      foreground: '#0b1f18',
    },
  },
];

export function normalizeAdminThemeId(themeId: string | null | undefined): AdminThemeId {
  return themeId === 'graphite' || themeId === 'emerald' ? themeId : DEFAULT_ADMIN_THEME_ID;
}
