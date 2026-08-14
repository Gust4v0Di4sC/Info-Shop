import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.112.3';
import {
  DeliveryAddress,
  ShippingQuote,
  buildCartPayload,
  calculateQuotes,
  extractMelhorEnvioOrderId,
  extractProtocol,
  formatAddress,
  getServiceClient,
  loadCartForUser,
  melhorEnvioRequest,
  requiredEnv,
} from './melhor-envio.ts';

type JsonRecord = Record<string, unknown>;

interface ProductSnapshot {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  offer_price: number | null;
  stock_quantity: number;
  stock_reserved: number;
}

interface OrderItemRow {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface PendingCheckout {
  order: JsonRecord;
  payment: JsonRecord;
  quote: ShippingQuote;
  initPoint: string;
  sandboxInitPoint: string | null;
}

export function mercadoPagoBaseUrl(): string {
  return Deno.env.get('MP_BASE_URL')?.replace(/\/$/, '') || 'https://api.mercadopago.com';
}

export async function mercadoPagoRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${requiredEnv('MP_ACCESS_TOKEN')}`);

  const response = await fetch(`${mercadoPagoBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = typeof body?.message === 'string'
      ? body.message
      : 'Falha na comunicacao com o Mercado Pago.';
    throw new Error(message);
  }

  return body;
}

export async function createMercadoPagoPreference(
  serviceClient: SupabaseClient,
  user: User,
  address: DeliveryAddress,
  selectedServiceId: string,
): Promise<PendingCheckout> {
  const cart = await loadCartForUser(serviceClient, user);
  const quotes = await calculateQuotes(cart, address);
  const selectedQuote = quotes.find(quote => quote.id === String(selectedServiceId));

  if (!selectedQuote) {
    throw new Error('Frete selecionado indisponivel. Calcule novamente.');
  }

  const productById = new Map(cart.products.map(product => [String(product.id), product as ProductSnapshot]));
  assertStockAvailable(cart.items, productById);

  const profileName = user.user_metadata?.['full_name'] || user.email || 'Cliente InfoShop';
  const deliveryAddress = formatAddress(address);
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = roundMoney(cart.subtotal + selectedQuote.price);
  const firstProduct = productById.get(String(cart.items[0].product_id));
  const productNames = cart.items.map(item => {
    const product = productById.get(String(item.product_id));
    return `${item.quantity}x ${product?.name || 'Produto'}`;
  }).join(', ');

  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .insert({
      store_id: cart.store.id,
      name: profileName,
      userId: user.id,
      address: deliveryAddress,
      productId: firstProduct?.id || null,
      product: productNames,
      imageProd: firstProduct?.imageUrl || null,
      quantity: totalQuantity,
      total_amount: totalAmount,
      status: 'payment_pending',
    })
    .select()
    .single();

  if (orderError) {
    throw orderError;
  }

  const orderId = String(order.id);
  const orderItems = cart.items.map(item => {
    const product = productById.get(String(item.product_id));
    if (!product) {
      throw new Error('Produto nao encontrado no carrinho.');
    }

    const unitPrice = Number(product.offer_price ?? product.price ?? 0);
    return {
      order_id: orderId,
      product_id: product.id,
      store_id: cart.store.id,
      product_name: product.name,
      product_image_url: product.imageUrl,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_amount: roundMoney(unitPrice * item.quantity),
    };
  });

  let stockReserved = false;

  try {
    const { error: itemsError } = await serviceClient.from('order_items').insert(orderItems);
    if (itemsError) {
      throw itemsError;
    }

    await reserveStock(serviceClient, orderItems);
    stockReserved = true;

    const externalReference = orderId;
    const preferencePayload = buildPreferencePayload(
      orderId,
      externalReference,
      user,
      orderItems,
      selectedQuote,
      address,
    );
    const preference = await mercadoPagoRequest('/checkout/preferences', {
      method: 'POST',
      body: JSON.stringify(preferencePayload),
    }) as JsonRecord;
    const preferenceId = String(preference['id'] || '');
    const initPoint = String(preference['init_point'] || preference['sandbox_init_point'] || '');
    const sandboxInitPoint = preference['sandbox_init_point'] ? String(preference['sandbox_init_point']) : null;

    if (!preferenceId || !initPoint) {
      throw new Error('Mercado Pago nao retornou link de pagamento.');
    }

    const { data: payment, error: paymentError } = await serviceClient
      .from('payments')
      .insert({
        order_id: orderId,
        store_id: cart.store.id,
        user_id: user.id,
        preference_id: preferenceId,
        external_reference: externalReference,
        status: 'pending',
        amount: totalAmount,
        currency: 'BRL',
        init_point: initPoint,
        sandbox_init_point: sandboxInitPoint,
        payer_email: user.email,
        raw_payload: {
          preference,
          checkout: {
            address,
            selected_service_id: selectedQuote.id,
          },
        },
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    return {
      order: order as JsonRecord,
      payment: payment as JsonRecord,
      quote: selectedQuote,
      initPoint,
      sandboxInitPoint,
    };
  } catch (error) {
    if (stockReserved) {
      await releaseReservedStock(serviceClient, orderItems);
    }

    await serviceClient
      .from('orders')
      .update({ status: 'payment_failed' })
      .eq('id', orderId);

    throw error;
  }
}

export async function syncMercadoPagoPayment(providerPaymentId: string, webhookPayload: JsonRecord): Promise<void> {
  const serviceClient = getServiceClient();
  const mercadoPagoPayment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(providerPaymentId)}`) as JsonRecord;
  const externalReference = String(mercadoPagoPayment['external_reference'] || webhookPayload['external_reference'] || '');
  const paymentStatus = normalizePaymentStatus(String(mercadoPagoPayment['status'] || 'pending'));

  if (!externalReference) {
    throw new Error('Pagamento sem referencia externa.');
  }

  const { data: existingPayment, error: existingError } = await serviceClient
    .from('payments')
    .select('*')
    .eq('external_reference', externalReference)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existingPayment) {
    throw new Error('Pagamento nao encontrado para a referencia informada.');
  }

  const paymentId = String(existingPayment.id);
  const existingRawPayload = (existingPayment.raw_payload || {}) as JsonRecord;
  const eventId = String(webhookPayload['id'] || `${providerPaymentId}:${webhookPayload['action'] || paymentStatus}`);
  const { error: eventError } = await serviceClient
    .from('payment_events')
    .insert({
      id: eventId,
      payment_id: paymentId,
      provider_payment_id: providerPaymentId,
      event_type: String(webhookPayload['type'] || 'payment'),
      action: webhookPayload['action'] ? String(webhookPayload['action']) : null,
      payload: webhookPayload,
    });

  if (eventError && eventError.code !== '23505') {
    throw eventError;
  }

  const alreadyProcessed = eventError?.code === '23505';
  const { error: updateError } = await serviceClient
    .from('payments')
    .update({
      payment_id: providerPaymentId,
      status: paymentStatus,
      status_detail: mercadoPagoPayment['status_detail'] ? String(mercadoPagoPayment['status_detail']) : null,
      payment_method_id: mercadoPagoPayment['payment_method_id'] ? String(mercadoPagoPayment['payment_method_id']) : null,
      payment_type_id: mercadoPagoPayment['payment_type_id'] ? String(mercadoPagoPayment['payment_type_id']) : null,
      approved_at: mercadoPagoPayment['date_approved'] ? String(mercadoPagoPayment['date_approved']) : null,
      raw_payload: {
        ...existingRawPayload,
        mercado_pago_payment: mercadoPagoPayment,
      },
    })
    .eq('id', paymentId);

  if (updateError) {
    throw updateError;
  }

  if (alreadyProcessed) {
    return;
  }

  if (paymentStatus === 'approved') {
    await approveOrder(serviceClient, String(existingPayment.order_id), paymentId);
  } else if (['rejected', 'cancelled', 'refunded', 'charged_back', 'failed'].includes(paymentStatus)) {
    await failOrder(serviceClient, String(existingPayment.order_id), paymentId);
  }

  await serviceClient
    .from('payment_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('id', eventId);
}

export async function validateMercadoPagoSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) {
    return (Deno.env.get('ENVIRONMENT') || '').toLowerCase() !== 'production';
  }

  const signature = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';
  const parts = new Map(signature.split(',').map(part => {
    const [key, value] = part.split('=');
    return [key?.trim(), value?.trim()];
  }));
  const timestamp = parts.get('ts');
  const expectedHash = parts.get('v1');

  if (!timestamp || !expectedHash) {
    return false;
  }

  const manifest = [
    dataId ? `id:${dataId};` : '',
    requestId ? `request-id:${requestId};` : '',
    `ts:${timestamp};`,
  ].join('');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const actualHash = Array.from(new Uint8Array(signatureBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(actualHash, expectedHash);
}

async function approveOrder(serviceClient: SupabaseClient, orderId: string, paymentId: string): Promise<void> {
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    throw orderError;
  }

  if (String(order.status) === 'confirmed') {
    return;
  }

  const { data: items, error: itemsError } = await serviceClient
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    throw itemsError;
  }

  for (const item of (items || []) as OrderItemRow[]) {
    const { data: product, error: productError } = await serviceClient
      .from('products')
      .select('stock_quantity, stock_reserved')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      throw productError;
    }

    await serviceClient
      .from('products')
      .update({
        stock_quantity: Math.max(0, Number(product.stock_quantity || 0) - item.quantity),
        stock_reserved: Math.max(0, Number(product.stock_reserved || 0) - item.quantity),
      })
      .eq('id', item.product_id);
  }

  const { error: orderUpdateError } = await serviceClient
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId);

  if (orderUpdateError) {
    throw orderUpdateError;
  }

  const { data: payment } = await serviceClient
    .from('payments')
    .select('raw_payload')
    .eq('id', paymentId)
    .maybeSingle();
  const checkout = ((payment?.raw_payload as JsonRecord | null)?.['checkout'] || {}) as JsonRecord;
  const address = checkout['address'] as DeliveryAddress | undefined;
  const selectedServiceId = checkout['selected_service_id'] ? String(checkout['selected_service_id']) : '';

  if (address && selectedServiceId) {
    await createDeliveryLabel(serviceClient, order as JsonRecord, address, selectedServiceId);
  }

  await serviceClient
    .from('cart_items')
    .delete()
    .eq('user_id', String(order.userId));
}

async function failOrder(serviceClient: SupabaseClient, orderId: string, paymentId: string): Promise<void> {
  const { data: order, error: orderError } = await serviceClient
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError) {
    throw orderError;
  }

  if (!['payment_pending', 'open'].includes(String(order.status))) {
    return;
  }

  const { data: items, error: itemsError } = await serviceClient
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsError) {
    throw itemsError;
  }

  for (const item of (items || []) as OrderItemRow[]) {
    const { data: product, error: productError } = await serviceClient
      .from('products')
      .select('stock_reserved')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      throw productError;
    }

    await serviceClient
      .from('products')
      .update({ stock_reserved: Math.max(0, Number(product.stock_reserved || 0) - item.quantity) })
      .eq('id', item.product_id);
  }

  const { error: orderUpdateError } = await serviceClient
    .from('orders')
    .update({ status: 'payment_failed' })
    .eq('id', orderId);

  if (orderUpdateError) {
    throw orderUpdateError;
  }

  await serviceClient
    .from('payments')
    .update({ status: 'failed' })
    .eq('id', paymentId)
    .eq('status', 'pending');
}

async function createDeliveryLabel(
  serviceClient: SupabaseClient,
  order: JsonRecord,
  address: DeliveryAddress,
  selectedServiceId: string,
): Promise<void> {
  const user = { id: String(order['userId']), email: null, user_metadata: { full_name: order['name'] } } as User;
  const cart = await loadOrderAsCart(serviceClient, order, user);
  const quotes = await calculateQuotes(cart, address);
  const selectedQuote = quotes.find(quote => quote.id === selectedServiceId);

  if (!selectedQuote) {
    throw new Error('Frete aprovado indisponivel para gerar entrega.');
  }

  const cartPayload = buildCartPayload(cart, address, selectedQuote);
  const addToCartResponse = await melhorEnvioRequest('/api/v2/me/cart', {
    method: 'POST',
    body: JSON.stringify(cartPayload),
  });
  const melhorEnvioOrderId = extractMelhorEnvioOrderId(addToCartResponse);
  const protocol = extractProtocol(addToCartResponse);

  await melhorEnvioRequest('/api/v2/me/shipment/checkout', {
    method: 'POST',
    body: JSON.stringify({ orders: [melhorEnvioOrderId] }),
  });

  await melhorEnvioRequest('/api/v2/me/shipment/generate', {
    method: 'POST',
    body: JSON.stringify({ orders: [melhorEnvioOrderId] }),
  });

  const deliveryUpdate = {
    store_id: String(order['store_id']),
    order_id: String(order['id']),
    user_id: String(order['userId']),
    customer_name: String(order['name']),
    address: String(order['address']),
    status: 'preparing',
    melhor_envio_order_id: melhorEnvioOrderId,
    melhor_envio_protocol: protocol,
    selected_service_id: selectedQuote.id,
    selected_service_name: `${selectedQuote.company} - ${selectedQuote.name}`,
    shipping_price: selectedQuote.price,
    shipping_deadline: selectedQuote.deliveryTime,
    label_status: 'generated',
    notes: 'Etiqueta criada apos pagamento aprovado no Mercado Pago.',
  };

  const { data: existingDelivery } = await serviceClient
    .from('deliveries')
    .select('id')
    .eq('order_id', String(order['id']))
    .maybeSingle();

  const result = existingDelivery
    ? await serviceClient.from('deliveries').update(deliveryUpdate).eq('id', existingDelivery.id)
    : await serviceClient.from('deliveries').insert(deliveryUpdate);

  if (result.error) {
    throw result.error;
  }
}

async function loadOrderAsCart(serviceClient: SupabaseClient, order: JsonRecord, user: User) {
  const { data: items, error: itemsError } = await serviceClient
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', String(order['id']));

  if (itemsError) {
    throw itemsError;
  }

  const productIds = (items || []).map(item => item.product_id);
  const { data: products, error: productsError } = await serviceClient
    .from('products')
    .select('*')
    .in('id', productIds);

  if (productsError) {
    throw productsError;
  }

  const { data: store, error: storeError } = await serviceClient
    .from('stores')
    .select('*')
    .eq('id', String(order['store_id']))
    .single();

  if (storeError) {
    throw storeError;
  }

  const productById = new Map((products || []).map(product => [String(product.id), product]));
  const subtotal = (items || []).reduce((sum, item) => {
    const product = productById.get(String(item.product_id));
    return sum + Number(product?.offer_price ?? product?.price ?? 0) * item.quantity;
  }, 0);

  return {
    user,
    items: items || [],
    products: products || [],
    store,
    subtotal,
  };
}

async function reserveStock(serviceClient: SupabaseClient, items: OrderItemRow[]): Promise<void> {
  for (const item of items) {
    const { data: product, error: productError } = await serviceClient
      .from('products')
      .select('stock_quantity, stock_reserved')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      throw productError;
    }

    const available = Number(product.stock_quantity || 0) - Number(product.stock_reserved || 0);
    if (available < item.quantity) {
      throw new Error('Estoque indisponivel para concluir a compra.');
    }

    const { error: updateError } = await serviceClient
      .from('products')
      .update({ stock_reserved: Number(product.stock_reserved || 0) + item.quantity })
      .eq('id', item.product_id);

    if (updateError) {
      throw updateError;
    }
  }
}

async function releaseReservedStock(serviceClient: SupabaseClient, items: OrderItemRow[]): Promise<void> {
  for (const item of items) {
    const { data: product, error: productError } = await serviceClient
      .from('products')
      .select('stock_reserved')
      .eq('id', item.product_id)
      .single();

    if (productError) {
      throw productError;
    }

    const { error: updateError } = await serviceClient
      .from('products')
      .update({ stock_reserved: Math.max(0, Number(product.stock_reserved || 0) - item.quantity) })
      .eq('id', item.product_id);

    if (updateError) {
      throw updateError;
    }
  }
}

function buildPreferencePayload(
  orderId: string,
  externalReference: string,
  user: User,
  orderItems: Array<OrderItemRow & { product_name: string }>,
  selectedQuote: ShippingQuote,
  address: DeliveryAddress,
): JsonRecord {
  const siteUrl = requiredEnv('PUBLIC_SITE_URL').replace(/\/$/, '');
  const payload: JsonRecord = {
    external_reference: externalReference,
    notification_url: `${requiredEnv('SUPABASE_URL').replace(/\/$/, '')}/functions/v1/mercado-pago-webhook`,
    back_urls: {
      success: `${siteUrl}/pagamento/retorno?status=approved&order_id=${encodeURIComponent(orderId)}`,
      pending: `${siteUrl}/pagamento/retorno?status=pending&order_id=${encodeURIComponent(orderId)}`,
      failure: `${siteUrl}/pagamento/retorno?status=failure&order_id=${encodeURIComponent(orderId)}`,
    },
    payer: {
      email: user.email,
      name: user.user_metadata?.['full_name'] || user.email || 'Cliente InfoShop',
    },
    items: [
      ...orderItems.map(item => ({
        id: item.product_id,
        title: item.product_name,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: roundMoney(item.unit_price),
      })),
      {
        id: selectedQuote.id,
        title: `Frete ${selectedQuote.company} - ${selectedQuote.name}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: roundMoney(selectedQuote.price),
      },
    ],
    metadata: {
      order_id: orderId,
      selected_service_id: selectedQuote.id,
      postal_code: address.postalCode,
    },
  };

  if (siteUrl.startsWith('https://')) {
    payload['auto_return'] = 'approved';
  }

  return payload;
}

function assertStockAvailable(items: Array<{ product_id: string; quantity: number }>, productById: Map<string, ProductSnapshot>): void {
  for (const item of items) {
    const product = productById.get(String(item.product_id));
    if (!product) {
      throw new Error('Produto nao encontrado no carrinho.');
    }

    const available = Number(product.stock_quantity || 0) - Number(product.stock_reserved || 0);
    if (available < item.quantity) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
  }
}

function normalizePaymentStatus(status: string): string {
  if (['pending', 'in_process', 'approved', 'authorized', 'rejected', 'cancelled', 'refunded', 'charged_back'].includes(status)) {
    return status;
  }

  return 'failed';
}

function roundMoney(value: number): number {
  return Math.round(Number(value || 0) * 100) / 100;
}

function timingSafeEqual(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < actual.length; index += 1) {
    result |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  }

  return result === 0;
}
