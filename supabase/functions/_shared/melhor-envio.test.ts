import { generateOAuthState, hashOAuthState } from './melhor-envio.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('generateOAuthState creates unique URL-safe values with enough entropy', () => {
  const first = generateOAuthState();
  const second = generateOAuthState();

  assert(first !== second, 'OAuth states must be unique');
  assert(first.length >= 43, 'OAuth state must contain at least 256 bits encoded as base64url');
  assert(/^[A-Za-z0-9_-]+$/.test(first), 'OAuth state must be URL-safe');
});

Deno.test('hashOAuthState creates a deterministic SHA-256 hash', async () => {
  const state = '12345678901234567890123456789012';
  const firstHash = await hashOAuthState(state);
  const secondHash = await hashOAuthState(state);

  assert(firstHash === secondHash, 'The same OAuth state must produce the same hash');
  assert(/^[a-f0-9]{64}$/.test(firstHash), 'OAuth state hash must be a hexadecimal SHA-256 digest');
});

Deno.test('hashOAuthState rejects short state values', async () => {
  let rejected = false;

  try {
    await hashOAuthState('too-short');
  } catch {
    rejected = true;
  }

  assert(rejected, 'Short OAuth states must be rejected');
});
