import { expect, test } from '@playwright/test';
import { mockLoggedOut } from './helpers';

test('menu mobile abre drawer e acessa catalogo', async ({ page }) => {
  await mockLoggedOut(page);
  await page.goto('/');

  await page.getByRole('button', { name: /abrir menu de navegação/i }).click();
  await expect(page.getByRole('navigation', { name: /navegação principal mobile/i })).toBeVisible();
  await page.getByRole('link', { name: /^catálogo$/i }).click();

  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.getByRole('heading', { name: /todos os produtos/i })).toBeVisible();
});
