import { expect, test } from '@playwright/test';

const liveEnabled = process.env['E2E_LIVE'] === 'true';

const adminAccounts = [
  {
    role: 'Gerente',
    email: process.env['E2E_MANAGER_EMAIL'],
    password: process.env['E2E_MANAGER_PASSWORD'],
    defaultPath: '/dash',
    heading: /dashboard gerencial/i,
    allowedPaths: ['/products', '/orders', '/stock', '/deliveries', '/offers', '/clients'],
  },
  {
    role: 'Vendedor',
    email: process.env['E2E_SELLER_EMAIL'],
    password: process.env['E2E_SELLER_PASSWORD'],
    defaultPath: '/orders',
    heading: /pedidos da loja/i,
    allowedPaths: ['/clients', '/deliveries', '/offers'],
    deniedPath: '/stock',
  },
  {
    role: 'Estoquista',
    email: process.env['E2E_STOCK_EMAIL'],
    password: process.env['E2E_STOCK_PASSWORD'],
    defaultPath: '/stock',
    heading: /controle de produtos/i,
    allowedPaths: ['/products'],
    deniedPath: '/orders',
  },
] as const;

test.describe('validacao real', () => {
  test.skip(!liveEnabled, 'Defina E2E_LIVE=true para acessar o Supabase real.');

  for (const account of adminAccounts) {
    test(`${account.role} autentica e respeita suas permissoes reais`, async ({ page }) => {
      test.skip(!account.email || !account.password, `Credenciais de ${account.role} nao configuradas.`);

      await page.goto('/home');
      await page.getByRole('radio', { name: /administrador/i }).click();
      await page.getByLabel(/e-mail/i).fill(account.email!);
      await page.getByRole('textbox', { name: /^senha$/i }).fill(account.password!);
      await page.getByRole('button', { name: /^entrar$/i }).click();

      await expect(page).toHaveURL(new RegExp(`${account.defaultPath}$`));
      await expect(page.getByRole('heading', { name: account.heading })).toBeVisible();
      await expect(page.getByRole('button', { name: /loja atual|selecionar loja atual/i })).toBeVisible();

      for (const path of account.allowedPaths) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.locator('main, .admin-content').getByRole('heading').first()).toBeVisible();
      }

      if (account.deniedPath) {
        await page.goto(account.deniedPath);
        await expect(page).toHaveURL(new RegExp(`${account.defaultPath}$`));
      }

      await page.locator('.logout-button').click();
      await expect(page).toHaveURL(/\/home$/);
    });
  }

  test('cadastro real cria cliente e valida os fluxos liberados pela configuracao de email', async ({ page }) => {
    test.setTimeout(120_000);
    const timestamp = Date.now();
    const email = process.env['E2E_NEW_CLIENT_EMAIL'] || `infoshop.e2e.${timestamp}@example.com`;
    const password = process.env['E2E_NEW_CLIENT_PASSWORD'] || `Cliente@${timestamp}`;

    const confirmationPanel = page.getByText(/confirmação enviada/i);
    const profileHeading = page.getByRole('heading', { name: /perfil do cliente/i });

    if (process.env['E2E_NEW_CLIENT_EMAIL'] && process.env['E2E_NEW_CLIENT_PASSWORD']) {
      await page.goto('/home');
      await page.getByLabel(/e-mail/i).fill(email);
      await page.getByRole('textbox', { name: /^senha$/i }).fill(password);
      await page.getByRole('button', { name: /^entrar$/i }).click();
      await expect(profileHeading).toBeVisible();
    } else {
      await page.goto('/registro');
      await page.getByLabel(/nome completo/i).fill('Cliente E2E Real');
      await page.getByLabel(/e-mail/i).fill(email);
      await page.getByRole('textbox', { name: /^senha$/i }).fill(password);
      await page.getByLabel(/confirmar senha/i).fill(password);
      await page.getByRole('button', { name: /criar conta/i }).click();
      await expect(confirmationPanel.or(profileHeading)).toBeVisible();
    }

    if (await confirmationPanel.isVisible()) {
      await expect(page.getByRole('button', { name: /reenviar e-mail/i })).toBeVisible();
      return;
    }

    await expect(page.getByLabel(/nome completo/i)).toHaveValue('Cliente E2E Real');
    await page.locator('[formControlName="phone"]').fill('11999999999');
    await page.locator('[formControlName="document"]').fill('12345678909');
    await page.locator('[formControlName="street"]').fill('Praca da Se');
    await page.locator('[formControlName="postalCode"]').fill('01001000');
    await page.locator('[formControlName="district"]').fill('Se');
    await page.locator('[formControlName="number"]').fill('100');
    await page.locator('[formControlName="state"]').fill('SP');
    await page.locator('input[type="file"]').setInputFiles('public/product1.webp');
    await page.getByRole('button', { name: /salvar perfil/i }).click();
    await expect(page.getByText(/perfil atualizado/i)).toBeVisible();

    await page.getByRole('link', { name: /minhas entregas/i }).click();
    await expect(page.getByRole('heading', { name: /acompanhamento de pedidos/i })).toBeVisible();
    await page.getByRole('link', { name: /minha conta/i }).click();
    await page.getByRole('link', { name: /ver carrinho/i }).click();
    await expect(page.getByRole('heading', { name: /sua compra/i })).toBeVisible();
    await page.getByRole('link', { name: /ver produtos|continuar comprando/i }).click();
    const productLink = page.locator('.product-card .product-title').first();
    await expect(productLink).toBeVisible();
    await productLink.click();

    await page.getByRole('heading', { name: /compare com seu hardware atual/i }).scrollIntoViewIfNeeded();
    await page.getByRole('textbox', { name: /^seu hardware atual$/i }).fill('Ryzen 5 3600, GTX 1660, 16GB RAM');
    await page.getByRole('textbox', { name: /^pergunta$/i }).fill('Esse produto e um upgrade relevante para jogos?');
    await page.locator('.chat-form .primary-action').click();
    await expect(page.locator('.message.model-message').last()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/não foi possível consultar a ia agora/i)).toHaveCount(0);

    await page.getByRole('button', { name: /adicionar ao carrinho/i }).click();
    await expect(page.getByText(/foi adicionado ao carrinho/i)).toBeVisible();
    await page.locator('.cart-btn').click();
    await expect(page.locator('.cart-item')).toHaveCount(1);

    await page.locator('#shipping-postal-code').fill('01001000');
    await page.locator('#shipping-state').fill('SP');
    await page.locator('#shipping-street').fill('Praca da Se');
    await page.locator('#shipping-number').fill('100');
    await page.locator('#shipping-district').fill('Se');
    await page.locator('#shipping-city').fill('Sao Paulo');
    await page.getByRole('button', { name: /calcular frete/i }).click();
    await expect(page.getByRole('radiogroup', { name: /opções de frete/i })).toBeVisible({ timeout: 45_000 });

    const paymentResponse = page.waitForResponse(response =>
      response.url().includes('/functions/v1/mercado-pago-create-preference'),
    );
    await page.getByRole('button', { name: /pagar com mercado pago/i }).click();
    await expect((await paymentResponse).ok()).toBeTruthy();
  });
});
