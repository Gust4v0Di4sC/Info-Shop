import { expect, test } from '@playwright/test';
import { AdminRole, expectUrlPath, mockAdminSession, mockLoggedOut } from './helpers';

const roleDefaults: Record<AdminRole, string> = {
  gerente: '/dash',
  gerente_regional: '/dash',
  vendedor: '/orders',
  estoquista: '/stock',
};

test('visitante em rota admin e perfil protegido volta para login', async ({ page }) => {
  await mockLoggedOut(page);

  await page.goto('/dash');
  await expectUrlPath(page, '/home');

  await page.goto('/perfil');
  await expectUrlPath(page, '/home');

  await page.goto('/minhas-entregas');
  await expectUrlPath(page, '/home');
});

for (const role of Object.keys(roleDefaults) as AdminRole[]) {
  test(`admin ${role} acessa rota padrao correspondente`, async ({ page }) => {
    await mockAdminSession(page, role);

    await page.goto('/home');
    await expectUrlPath(page, roleDefaults[role]);
    await expect(page.getByRole('button', { name: /loja atual|selecionar loja atual/i })).toBeVisible();
  });
}

test('gerente visualiza menu administrativo completo e faz logout', async ({ page }) => {
  await mockAdminSession(page, 'gerente');

  await page.goto('/home');
  await expectUrlPath(page, '/dash');

  await expect(page.getByRole('heading', { name: /dashboard gerencial/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /loja atual|selecionar loja atual/i })).toBeVisible();

  await page.locator('.logout-button').click();
  await expectUrlPath(page, '/home');
});
