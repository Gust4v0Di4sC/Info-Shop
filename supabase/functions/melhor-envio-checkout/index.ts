import {
  DeliveryAddress,
  buildCartPayload,
  calculateQuotes,
  extractMelhorEnvioOrderId,
  extractProtocol,
  formatAddress,
  getAuthenticatedUser,
  getServiceClient,
  loadCartForUser,
  melhorEnvioRequest,
  normalizeAddress,
} from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { assertRateLimit } from '../_shared/rate-limit.ts';
import { createLogContext, logCompleted, logError, logInfo } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'melhor-envio-checkout');

  if (req.method !== 'POST') {
    logCompleted(logContext, 'METHOD_NOT_ALLOWED', 405, { method: req.method, provider: 'melhor-envio' });
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  let userId = '';
  let orderId = '';

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const user = await getAuthenticatedUser(authHeader);
    userId = user.id;
    const serviceClient = getServiceClient();
    await assertRateLimit(serviceClient, {
      scope: 'melhor-envio-checkout',
      subject: user.id,
      maxRequests: 5,
      windowSeconds: 600,
    });
    const body = await req.json() as { address: DeliveryAddress; selectedServiceId: string };
    const address = normalizeAddress(body.address);
    const cart = await loadCartForUser(serviceClient, user);
    const quotes = await calculateQuotes(cart, address);
    const selectedQuote = quotes.find(quote => quote.id === String(body.selectedServiceId));

    if (!selectedQuote) {
      throw new Error('Frete selecionado indisponivel. Calcule novamente.');
    }

    const cartPayload = buildCartPayload(cart, address, selectedQuote);
    logInfo(logContext, 'SHIPPING_CHECKOUT_STARTED', { userId, provider: 'melhor-envio' });
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

    const productById = new Map(cart.products.map(product => [String(product.id), product]));
    const productNames = cart.items.map(item => {
      const product = productById.get(String(item.product_id));
      return `${item.quantity}x ${product?.name || 'Produto'}`;
    }).join(', ');
    const firstProduct = productById.get(String(cart.items[0].product_id));
    const profileName = user.user_metadata?.['full_name'] || user.email || 'Cliente InfoShop';
    const deliveryAddress = formatAddress(address);
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.subtotal + selectedQuote.price;

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
        status: 'confirmed',
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }
    orderId = String(order.id);

    for (const item of cart.items) {
      const product = productById.get(String(item.product_id));
      if (!product) {
        continue;
      }

      await serviceClient
        .from('products')
        .update({ stock_quantity: Math.max(0, Number(product.stock_quantity || 0) - item.quantity) })
        .eq('id', item.product_id);
    }

    const { data: existingDelivery } = await serviceClient
      .from('deliveries')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle();

    const deliveryUpdate = {
      store_id: cart.store.id,
      order_id: order.id,
      user_id: user.id,
      customer_name: profileName,
      address: deliveryAddress,
      status: 'preparing',
      melhor_envio_order_id: melhorEnvioOrderId,
      melhor_envio_protocol: protocol,
      selected_service_id: selectedQuote.id,
      selected_service_name: `${selectedQuote.company} - ${selectedQuote.name}`,
      shipping_price: selectedQuote.price,
      shipping_deadline: selectedQuote.deliveryTime,
      label_status: 'generated',
      notes: 'Etiqueta sandbox criada pelo checkout do cliente.',
    };

    const deliveryResult = existingDelivery
      ? await serviceClient.from('deliveries').update(deliveryUpdate).eq('id', existingDelivery.id).select().single()
      : await serviceClient.from('deliveries').insert(deliveryUpdate).select().single();

    if (deliveryResult.error) {
      throw deliveryResult.error;
    }

    const { error: clearError } = await serviceClient
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (clearError) {
      throw clearError;
    }

    logCompleted(logContext, 'SHIPPING_CHECKOUT_COMPLETED', 200, {
      userId,
      orderId,
      provider: 'melhor-envio',
      melhorEnvioOrderId,
    });

    return jsonResponse({
      order,
      delivery: deliveryResult.data,
      quote: selectedQuote,
    }, 200, req);
  } catch (error) {
    logError(logContext, 'SHIPPING_CHECKOUT_FAILED', error, {
      userId,
      orderId,
      status: 400,
      provider: 'melhor-envio',
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel finalizar a compra.' }, 400, req);
  }
});
