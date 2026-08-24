import { expect, test } from '@playwright/test';
import { expectUrlPath, firstCatalogProduct, mockLoggedOut } from './helpers';

test.describe('navegacao publica', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedOut(page);
  });

  test('landing page exibe secoes principais e menu desktop navega por ancoras', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /tecnologia que acompanha o seu ritmo/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /navegue por categoria/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /produtos em destaque/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /compare antes de comprar/i })).toBeVisible();

    await page.getByRole('link', { name: /^categorias$/i }).click();
    await expect(page).toHaveURL(/#categorias$/);
    await page.getByRole('link', { name: /^produtos$/i }).click();
    await expect(page).toHaveURL(/#produtos$/);
    await page.getByRole('link', { name: /^contato$/i }).click();
    await expect(page).toHaveURL(/#contato$/);
    await expect(page.getByRole('heading', { name: /fique ligado nas ofertas/i })).toBeVisible();
  });

  test('catalogo, categoria e busca do topo funcionam', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: /todos os produtos/i })).toBeVisible();

    await page.goto('/catalogo/notebooks');
    await expect(page.getByRole('heading', { name: /notebooks/i })).toBeVisible();

    await page.getByRole('searchbox', { name: /buscar produtos/i }).fill('notebook');
    await page.getByRole('button', { name: /^buscar$/i }).click();
    await expect(page).toHaveURL(/\/catalogo\?q=notebook/);
    await expect(page.getByRole('heading', { name: /busca por "notebook"/i })).toBeVisible();

    await page.getByRole('searchbox', { name: /buscar produtos/i }).fill('zzzz-produto-inexistente-e2e');
    await page.getByRole('button', { name: /^buscar$/i }).click();
    await expect(page).toHaveURL(/q=zzzz-produto-inexistente-e2e/);
    await expect(page.getByText(/nenhum produto encontrado para esta busca/i)).toBeVisible();

    await page.getByRole('searchbox', { name: /buscar produtos/i }).fill('');
    await page.getByRole('button', { name: /^buscar$/i }).click();
    await expect(page).toHaveURL(/\/catalogo$/);
  });

  test('paginas de suporte publicas abrem', async ({ page }) => {
    const topics = [
      'fale-conosco',
      'perguntas-frequentes',
      'politica-de-compra',
      'trocas-e-devolucoes',
      'privacidade',
    ];

    for (const topic of topics) {
      await page.goto(`/suporte/${topic}`);
      await expect(page.getByText('Suporte InfoShop')).toBeVisible();
      await expect(page.getByRole('link', { name: /ver catalogo/i })).toBeVisible();
    }
  });
});

test.describe('catalogo e produto', () => {
  test.beforeEach(async ({ page }) => {
    await mockLoggedOut(page);
  });

  test('abre produto pelo catalogo, ajusta quantidade e exige login para carrinho', async ({ page }) => {
    const product = await firstCatalogProduct(page);
    await product.click();

    await expect(page).toHaveURL(/\/produto\/\d+/);
    await expect(page.getByText(/produto infoshop/i)).toBeVisible();
    await expect(page.locator('.product-gallery img')).toBeVisible();
    await expect(page.locator('.product-summary h1')).toBeVisible();
    await expect(page.locator('.price-row')).toContainText('R$');

    await page.getByRole('button', { name: /aumentar quantidade/i }).click();
    await expect(page.locator('.quantity-row span')).toHaveText('2');
    await page.getByRole('button', { name: /diminuir quantidade/i }).click();
    await expect(page.locator('.quantity-row span')).toHaveText('1');

    await page.getByRole('button', { name: /adicionar ao carrinho/i }).click();
    await expect(page.getByText(/entre na sua conta/i)).toBeVisible();
    await expect(page.getByText(/entre para usar o comparador/i)).toBeVisible();
  });

  test('produto inexistente mostra erro', async ({ page }) => {
    await page.goto('/produto/999999999');
    await expect(page.getByText(/nao foi possivel carregar este produto/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /voltar para a loja/i })).toBeVisible();
  });

  test('carrinho sem login mostra estado de erro e link para login', async ({ page }) => {
    await page.goto('/carrinho');
    await expect(page.getByRole('heading', { name: /sua compra/i })).toBeVisible();
    await expect(page.getByText(/nao foi possivel carregar seu carrinho|entre na sua conta/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /entrar na conta/i })).toHaveAttribute('href', '/home');
  });
});

test('rota inexistente redireciona para a landing', async ({ page }) => {
  await mockLoggedOut(page);
  await page.goto('/rota-inexistente-e2e');
  await expectUrlPath(page, '/');
  await expect(page.getByRole('heading', { name: /tecnologia que acompanha o seu ritmo/i })).toBeVisible();
});
