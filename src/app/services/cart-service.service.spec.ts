import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CartServiceService } from './cart-service.service';
import { DeliveryAddress } from '@app/models/shipping.model';

describe('CartServiceService', () => {
  let service: CartServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate shipping through the Melhor Envio quote function', async () => {
    const address = deliveryAddress();
    const invokeSpy = spyOn<any>(service, 'invokeFunction').and.resolveTo({
        quotes: [
          { id: '1', name: 'PAC', company: 'Correios', price: 19.9, deliveryTime: 5 },
        ],
    });

    const quotes = await firstValueFrom(service.calculateShipping(address));

    expect(invokeSpy).toHaveBeenCalledWith('melhor-envio-quote', { address });
    expect(quotes.length).toBe(1);
    expect(quotes[0].company).toBe('Correios');
  });

  it('should checkout through the Melhor Envio checkout function', async () => {
    const address = deliveryAddress();
    const invokeSpy = spyOn<any>(service, 'invokeFunction').and.resolveTo({
        order: { id: 'order-1' },
        delivery: { id: 'delivery-1' },
        quote: { id: '1', name: 'PAC', company: 'Correios', price: 19.9, deliveryTime: 5 },
    });

    const result = await firstValueFrom(service.checkoutCart({
      address,
      selectedServiceId: '1',
    }));

    expect(invokeSpy).toHaveBeenCalledWith('melhor-envio-checkout', {
        address,
        selectedServiceId: '1',
    });
    expect(result.delivery.id).toBe('delivery-1');
  });
});

function deliveryAddress(): DeliveryAddress {
  return {
    postalCode: '01001000',
    street: 'Praca da Se',
    number: '1',
    district: 'Se',
    city: 'Sao Paulo',
    state: 'SP',
    complement: null,
  };
}
