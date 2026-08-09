import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

type JsonRecord = Record<string, unknown>;

export interface DeliveryAddress {
  postalCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

export interface ShippingQuote {
  id: string;
  name: string;
  company: string;
  price: number;
  deliveryTime: number | null;
  raw: unknown;
}

interface CartItemRow {
  id: string;
  product_id: string;
  quantity: number;
}

interface ProductRow {
  id: string;
  store_id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  offer_price: number | null;
  stock_quantity: number;
  shipping_weight: number | null;
  shipping_width: number | null;
  shipping_height: number | null;
  shipping_length: number | null;
  shipping_insurance_value: number | null;
}

interface StoreRow {
  id: string;
  name: string;
  sender_document: string | null;
  sender_email: string | null;
  sender_phone: string | null;
  sender_postal_code: string | null;
  sender_address: string | null;
  sender_number: string | null;
  sender_complement: string | null;
  sender_district: string | null;
  sender_city: string | null;
  sender_state: string | null;
  default_package_weight: number;
  default_package_width: number;
  default_package_height: number;
  default_package_length: number;
}

export interface LoadedCart {
  user: User;
  items: CartItemRow[];
  products: ProductRow[];
  store: StoreRow;
  subtotal: number;
}

export function getServiceClient(): SupabaseClient {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const serviceKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export function getUserClient(authHeader: string): SupabaseClient {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
}

export async function getAuthenticatedUser(authHeader: string): Promise<User> {
  if (!authHeader) {
    throw new Error('Entre na sua conta para continuar.');
  }

  const { data, error } = await getUserClient(authHeader).auth.getUser();
  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Sessao nao encontrada.');
  }

  return data.user;
}

export async function loadCartForUser(serviceClient: SupabaseClient, user: User): Promise<LoadedCart> {
  const { data: cartItems, error: cartError } = await serviceClient
    .from('cart_items')
    .select('id, product_id, quantity')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (cartError) {
    throw cartError;
  }

  const items = (cartItems || []) as CartItemRow[];
  if (items.length === 0) {
    throw new Error('Carrinho vazio.');
  }

  const productIds = items.map(item => item.product_id);
  const { data: productsResult, error: productsError } = await serviceClient
    .from('products')
    .select('*')
    .in('id', productIds);

  if (productsError) {
    throw productsError;
  }

  const products = (productsResult || []) as ProductRow[];
  const productsById = new Map(products.map(product => [String(product.id), product]));
  const missingProduct = items.find(item => !productsById.has(String(item.product_id)));
  if (missingProduct) {
    throw new Error('Um produto do carrinho nao foi encontrado.');
  }

  const storeIds = new Set(products.map(product => product.store_id));
  if (storeIds.size !== 1) {
    throw new Error('Finalize produtos de uma loja por vez.');
  }

  const storeId = products[0].store_id;
  const { data: store, error: storeError } = await serviceClient
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (storeError) {
    throw storeError;
  }

  const subtotal = items.reduce((sum, item) => {
    const product = productsById.get(String(item.product_id));
    const price = Number(product?.offer_price ?? product?.price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  return {
    user,
    items,
    products,
    store: store as StoreRow,
    subtotal,
  };
}

export async function calculateQuotes(cart: LoadedCart, address: DeliveryAddress): Promise<ShippingQuote[]> {
  const payload = buildCalculatePayload(cart, address);
  const response = await melhorEnvioRequest('/api/v2/me/shipment/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const list = Array.isArray(response) ? response : [];
  return list
    .filter(item => item && typeof item === 'object' && !('error' in (item as JsonRecord)))
    .map(item => normalizeQuote(item as JsonRecord))
    .filter((quote): quote is ShippingQuote => Boolean(quote));
}

export async function melhorEnvioRequest(path: string, init: RequestInit): Promise<unknown> {
  const serviceClient = getServiceClient();
  const token = await getValidAccessToken(serviceClient);
  const baseUrl = requiredEnv('ME_BASE_URL').replace(/\/$/, '');
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('User-Agent', requiredEnv('ME_USER_AGENT'));

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = typeof body?.message === 'string'
      ? body.message
      : 'Falha na comunicacao com o Melhor Envio.';
    throw new Error(message);
  }

  return body;
}

export async function saveTokenFromOAuth(code: string): Promise<void> {
  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: requiredEnv('ME_CLIENT_ID'),
    client_secret: requiredEnv('ME_CLIENT_SECRET'),
    redirect_uri: requiredEnv('ME_REDIRECT_URI'),
    code,
  });

  const token = await requestOAuthToken(tokenBody);
  await persistToken(getServiceClient(), token);
}

export function buildAuthorizeUrl(state: string): string {
  const baseUrl = requiredEnv('ME_BASE_URL').replace(/\/$/, '');
  const params = new URLSearchParams({
    client_id: requiredEnv('ME_CLIENT_ID'),
    redirect_uri: requiredEnv('ME_REDIRECT_URI'),
    response_type: 'code',
    state,
    scope: [
      'shipping-calculate',
      'cart-read',
      'cart-write',
      'shipping-checkout',
      'shipping-generate',
      'shipping-print',
      'shipping-tracking',
      'orders-read',
    ].join(' '),
  });

  return `${baseUrl}/oauth/authorize?${params.toString()}`;
}

export function normalizeAddress(address: DeliveryAddress): DeliveryAddress {
  return {
    postalCode: onlyDigits(address.postalCode),
    street: address.street.trim(),
    number: address.number.trim(),
    district: address.district.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    complement: address.complement?.trim() || null,
  };
}

export function formatAddress(address: DeliveryAddress): string {
  const normalized = normalizeAddress(address);
  return [
    `${normalized.street}, ${normalized.number}`,
    normalized.complement,
    normalized.district,
    `${normalized.city}/${normalized.state}`,
    `CEP ${normalized.postalCode}`,
  ].filter(Boolean).join(' - ');
}

export function mapMelhorEnvioStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('delivered')) {
    return 'delivered';
  }
  if (normalized.includes('cancel')) {
    return 'canceled';
  }
  if (['posted', 'received'].includes(normalized)) {
    return 'shipped';
  }
  if (['generated', 'released', 'pending', 'created'].includes(normalized)) {
    return 'preparing';
  }
  return 'out_for_delivery';
}

export function buildCartPayload(cart: LoadedCart, address: DeliveryAddress, selectedQuote: ShippingQuote): JsonRecord {
  const normalizedAddress = normalizeAddress(address);
  assertSenderData(cart.store);

  return {
    service: Number(selectedQuote.id),
    from: {
      name: cart.store.name,
      phone: onlyDigits(cart.store.sender_phone || ''),
      email: cart.store.sender_email,
      document: onlyDigits(cart.store.sender_document || ''),
      company_document: onlyDigits(cart.store.sender_document || ''),
      state_register: '',
      address: cart.store.sender_address,
      complement: cart.store.sender_complement || '',
      number: cart.store.sender_number,
      district: cart.store.sender_district,
      city: cart.store.sender_city,
      country_id: 'BR',
      postal_code: onlyDigits(cart.store.sender_postal_code || ''),
      state_abbr: cart.store.sender_state,
    },
    to: {
      name: cart.user.user_metadata?.['full_name'] || cart.user.email || 'Cliente InfoShop',
      phone: '',
      email: cart.user.email,
      document: '',
      address: normalizedAddress.street,
      complement: normalizedAddress.complement || '',
      number: normalizedAddress.number,
      district: normalizedAddress.district,
      city: normalizedAddress.city,
      country_id: 'BR',
      postal_code: normalizedAddress.postalCode,
      state_abbr: normalizedAddress.state,
    },
    products: buildProductsPayload(cart),
    options: {
      insurance_value: cart.subtotal,
      receipt: false,
      own_hand: false,
      collect: false,
    },
  };
}

export function extractMelhorEnvioOrderId(response: unknown): string {
  const body = response as JsonRecord;
  const data = typeof body['data'] === 'object' && body['data'] !== null
    ? body['data'] as JsonRecord
    : {};
  const id = body['id'] ?? body['order_id'] ?? data['id'];
  if (!id) {
    throw new Error('Melhor Envio nao retornou o id da etiqueta.');
  }

  return String(id);
}

export function extractProtocol(response: unknown): string | null {
  const body = response as JsonRecord;
  const data = typeof body['data'] === 'object' && body['data'] !== null
    ? body['data'] as JsonRecord
    : {};
  const protocol = body['protocol'] ?? data['protocol'];
  return protocol ? String(protocol) : null;
}

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Variavel ${name} nao configurada.`);
  }

  return value;
}

async function getValidAccessToken(serviceClient: SupabaseClient): Promise<string> {
  const { data, error } = await serviceClient
    .from('melhor_envio_tokens')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Autorize a conta Melhor Envio Sandbox antes de calcular frete.');
  }

  const expiresAt = new Date(String(data['expires_at'])).getTime();
  if (expiresAt - Date.now() > 5 * 60 * 1000) {
    return String(data['access_token']);
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: requiredEnv('ME_CLIENT_ID'),
    client_secret: requiredEnv('ME_CLIENT_SECRET'),
    refresh_token: String(data['refresh_token']),
  });

  const token = await requestOAuthToken(tokenBody);
  await persistToken(serviceClient, token);
  return String(token['access_token']);
}

async function requestOAuthToken(body: URLSearchParams): Promise<JsonRecord> {
  const response = await fetch(`${requiredEnv('ME_BASE_URL').replace(/\/$/, '')}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': requiredEnv('ME_USER_AGENT'),
    },
    body,
  });

  const text = await response.text();
  const token = text ? JSON.parse(text) as JsonRecord : {};

  if (!response.ok) {
    throw new Error(typeof token['message'] === 'string' ? token['message'] : 'Nao foi possivel obter token do Melhor Envio.');
  }

  return token;
}

async function persistToken(serviceClient: SupabaseClient, token: JsonRecord): Promise<void> {
  const expiresIn = Number(token['expires_in'] || 30 * 24 * 60 * 60);
  const refreshExpiresIn = Number(token['refresh_token_expires_in'] || 45 * 24 * 60 * 60);
  const now = Date.now();

  const { error } = await serviceClient
    .from('melhor_envio_tokens')
    .upsert({
      id: 'default',
      access_token: String(token['access_token']),
      refresh_token: String(token['refresh_token']),
      expires_at: new Date(now + expiresIn * 1000).toISOString(),
      refresh_expires_at: new Date(now + refreshExpiresIn * 1000).toISOString(),
      scopes: typeof token['scope'] === 'string' ? token['scope'] : null,
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

function buildCalculatePayload(cart: LoadedCart, address: DeliveryAddress): JsonRecord {
  const normalizedAddress = normalizeAddress(address);
  if (!cart.store.sender_postal_code) {
    throw new Error('Cadastre o CEP de origem da loja antes de calcular frete.');
  }

  return {
    from: {
      postal_code: onlyDigits(cart.store.sender_postal_code),
    },
    to: {
      postal_code: normalizedAddress.postalCode,
    },
    products: buildProductsPayload(cart),
    options: {
      receipt: false,
      own_hand: false,
      collect: false,
    },
  };
}

function buildProductsPayload(cart: LoadedCart): JsonRecord[] {
  const productById = new Map(cart.products.map(product => [String(product.id), product]));

  return cart.items.map(item => {
    const product = productById.get(String(item.product_id));
    if (!product) {
      throw new Error('Produto nao encontrado no carrinho.');
    }

    return {
      id: String(product.id),
      width: Number(product.shipping_width || cart.store.default_package_width),
      height: Number(product.shipping_height || cart.store.default_package_height),
      length: Number(product.shipping_length || cart.store.default_package_length),
      weight: Number(product.shipping_weight || cart.store.default_package_weight),
      insurance_value: Number(product.shipping_insurance_value || product.offer_price || product.price || 0),
      quantity: item.quantity,
    };
  });
}

function normalizeQuote(item: JsonRecord): ShippingQuote | null {
  const price = Number(item['custom_price'] ?? item['price']);
  if (!Number.isFinite(price)) {
    return null;
  }

  const company = item['company'] as JsonRecord | undefined;
  return {
    id: String(item['id']),
    name: String(item['name'] ?? 'Frete'),
    company: String(company?.['name'] ?? item['company_name'] ?? 'Transportadora'),
    price,
    deliveryTime: item['custom_delivery_time'] || item['delivery_time']
      ? Number(item['custom_delivery_time'] ?? item['delivery_time'])
      : null,
    raw: item,
  };
}

function assertSenderData(store: StoreRow): void {
  const missing = [
    ['documento', store.sender_document],
    ['email', store.sender_email],
    ['telefone', store.sender_phone],
    ['CEP', store.sender_postal_code],
    ['endereco', store.sender_address],
    ['numero', store.sender_number],
    ['bairro', store.sender_district],
    ['cidade', store.sender_city],
    ['UF', store.sender_state],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Complete o cadastro de remetente da loja: ${missing.map(([label]) => label).join(', ')}.`);
  }
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}
