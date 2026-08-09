import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DeliveryAddress } from '@app/models/shipping.model';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a Mercado Pago preference through the edge function', async () => {
    const address = deliveryAddress();
    const invokeSpy = spyOn<any>(service, 'invokeFunction').and.resolveTo({
      order: { id: 'order-1' },
      payment: { id: 'payment-1' },
      quote: { id: '1', name: 'PAC', company: 'Correios', price: 19.9, deliveryTime: 5 },
      initPoint: 'https://mercadopago.test/checkout',
      sandboxInitPoint: 'https://sandbox.mercadopago.test/checkout',
    });

    const result = await firstValueFrom(service.createPreference({
      address,
      selectedServiceId: '1',
    }));

    expect(invokeSpy).toHaveBeenCalledWith('mercado-pago-create-preference', {
      address,
      selectedServiceId: '1',
    });
    expect(result.initPoint).toContain('mercadopago');
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
