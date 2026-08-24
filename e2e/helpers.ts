import { expect, Page, Route } from '@playwright/test';

export type AdminRole = 'gerente' | 'gerente_regional' | 'vendedor' | 'estoquista';

const testUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e.admin@example.com',
  user_metadata: {
    full_name: 'Admin E2E',
    name: 'Admin E2E',
  },
};

const testStore = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Loja E2E',
  region: 'SP',
  sender_document: '',
  sender_email: '',
  sender_phone: '',
  sender_postal_code: '',
  sender_address: '',
  sender_number: '',
  sender_complement: '',
  sender_district: '',
  sender_city: '',
  sender_state: '',
  default_package_weight: 1,
  default_package_width: 16,
  default_package_height: 8,
  default_package_length: 24,
};

function json(route: Route, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'access-control-expose-headers': 'content-range',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

export async function mockLoggedOut(page: Page) {
  await page.route('**/api/auth/session', route => json(route, { user: null }));
  await page.route('**/api/auth/logout', route => json(route, { ok: true }));
}

export async function mockAdminSession(page: Page, role: AdminRole) {
  let loggedIn = true;
  const admin = {
    id: '00000000-0000-4000-8000-000000000002',
    user_id: testUser.id,
    role,
    active: true,
    region: 'SP',
    store_name: 'Loja E2E',
    theme_id: 'corporate',
    store_logo_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  await page.route('**/api/auth/session', route => json(route, { user: loggedIn ? testUser : null }));
  await page.route('**/api/auth/logout', route => {
    loggedIn = false;
    return json(route, { ok: true });
  });
  await page.route('**/api/supabase/**', route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (pathname.includes('/rest/v1/admins')) {
      return json(route, admin);
    }

    if (pathname.includes('/rest/v1/users')) {
      return json(route, {
        id: testUser.id,
        email: testUser.email,
        full_name: 'Admin E2E',
        phone: '',
        document: '',
        address: '',
        avatar_url: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      });
    }

    if (pathname.includes('/rest/v1/admin_store_accesses')) {
      return json(route, [{ stores: testStore }]);
    }

    if (pathname.includes('/rest/v1/stores')) {
      return json(route, testStore);
    }

    if (route.request().method() === 'HEAD') {
      return route.fulfill({ status: 200, headers: { 'content-range': '0-0/0' } });
    }

    if (pathname.includes('/rpc/')) {
      return json(route, []);
    }

    return json(route, [], 200, { 'content-range': '0-0/0' });
  });
}

export async function expectUrlPath(page: Page, path: string | RegExp) {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toEqual(typeof path === 'string' ? path : expect.stringMatching(path));
}

export async function firstCatalogProduct(page: Page) {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: /todos os produtos/i })).toBeVisible();
  const product = page.locator('.product-card .product-title').first();
  await expect(product).toBeVisible();
  return product;
}
