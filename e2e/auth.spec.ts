import { expect, test } from '@playwright/test';
import { mockLoggedOut } from './helpers';

test.beforeEach(async ({ page }) => {
  await mockLoggedOut(page);
});

test('login valida campos, alterna senha e rejeita credenciais invalidas', async ({ page }) => {
  await page.goto('/home');

  await page.getByLabel(/e-mail/i).fill('email-invalido');
  await page.getByLabel(/e-mail/i).blur();
  await expect(page.getByText(/informe um e-mail valido/i)).toBeVisible();

  const password = page.getByRole('textbox', { name: /^senha$/i });
  await password.fill('senhaerrada');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: /alternar visibilidade da senha/i }).click();
  await expect(password).toHaveAttribute('type', 'text');

  await page.getByLabel(/e-mail/i).fill('cliente.inexistente@example.com');
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await expect(page.getByText(/e-mail ou senha incorretos/i)).toBeVisible();
});

test('modo administrador bloqueia usuario autenticado sem perfil admin', async ({ page }) => {
  await page.route('**/api/auth/login**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        id: '00000000-0000-4000-8000-000000000020',
        email: 'cliente.e2e@example.com',
        user_metadata: { full_name: 'Cliente E2E' },
      },
    }),
  }));
  await page.route('**/api/supabase/rest/v1/admins**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: 'null',
  }));

  await page.goto('/home');
  await page.getByRole('radio', { name: /administrador/i }).click();
  await page.getByLabel(/e-mail/i).fill('cliente.e2e@example.com');
  await page.getByRole('textbox', { name: /^senha$/i }).fill('senhateste');
  await Promise.all([
    page.waitForResponse('**/api/auth/login**'),
    page.getByRole('button', { name: /^entrar$/i }).click(),
  ]);

  await expect(page.getByText(/acesso administrativo restrito/i)).toBeVisible();
});

test('cadastro valida campos e mostra confirmacao sem criar usuario real', async ({ page }) => {
  await page.route('**/api/auth/register**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: null,
      needsEmailConfirmation: true,
    }),
  }));
  await page.route('**/api/auth/resend-confirmation**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true }),
  }));

  await page.goto('/registro');
  await page.getByLabel(/nome completo/i).fill('Al');
  await page.getByLabel(/e-mail/i).fill('email-invalido');
  await page.getByRole('textbox', { name: /^senha$/i }).fill('123');
  await page.getByLabel(/confirmar senha/i).fill('456');
  await page.getByLabel(/confirmar senha/i).blur();

  await expect(page.getByText(/informe pelo menos 3 caracteres/i)).toBeVisible();
  await expect(page.getByText(/informe um e-mail valido/i)).toBeVisible();
  await expect(page.getByText(/use pelo menos 6 caracteres/i)).toBeVisible();
  await expect(page.getByText(/as senhas nao conferem/i)).toBeVisible();

  await page.getByLabel(/nome completo/i).fill('Cadastro E2E');
  await page.getByLabel(/e-mail/i).fill('cadastro.e2e@example.com');
  await page.getByRole('textbox', { name: /^senha$/i }).fill('senhateste');
  await page.getByLabel(/confirmar senha/i).fill('senhateste');
  await Promise.all([
    page.waitForResponse('**/api/auth/register**'),
    page.getByRole('button', { name: /criar conta/i }).click(),
  ]);

  await expect(page.getByText(/confirmacao enviada/i)).toBeVisible();
  await page.getByRole('button', { name: /reenviar email/i }).click();
  await expect(page.getByText(/email de confirmacao reenviado/i)).toBeVisible();
});

test('recuperacao de senha valida email e confirma envio via mock', async ({ page }) => {
  await page.route('**/api/auth/password-reset', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true }),
  }));

  await page.goto('/recuperar-senha');
  await page.getByLabel(/e-mail/i).fill('email-invalido');
  await page.getByLabel(/e-mail/i).blur();
  await expect(page.getByText(/informe um e-mail valido/i)).toBeVisible();

  await page.getByLabel(/e-mail/i).fill('cliente.e2e@example.com');
  await page.getByRole('button', { name: /enviar link/i }).click();
  await expect(page.getByText(/link enviado/i)).toBeVisible();
});

test('auth callback com erro mostra fallback para login', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied');
  await expect(page.getByRole('heading', { name: /login nao concluido/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /voltar para login/i })).toHaveAttribute('href', '/home');
});
