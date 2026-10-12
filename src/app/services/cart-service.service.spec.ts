import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { CartServiceService } from './cart-service.service';
import { DeliveryAddress } from '@app/models/shipping.model';
import { AuthService } from '@app/core/auth/auth.service';

describe('CartServiceService', () => {
  let service: CartServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    });
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

  it('should update the optimistic cart count with the total returned by the atomic operation', async () => {
    spyOn<any>(service, 'addProductToCart').and.resolveTo(7);
    const counts: number[] = [];
    const subscription = service.cartCount$.subscribe(count => counts.push(count));

    await firstValueFrom(service.addProduct(42, 2));

    expect(counts).toEqual([0, 2, 7]);
    subscription.unsubscribe();
  });

  it('should roll back the optimistic cart count when adding fails', async () => {
    spyOn<any>(service, 'addProductToCart').and.rejectWith(new Error('Falha'));
    const counts: number[] = [];
    const subscription = service.cartCount$.subscribe(count => counts.push(count));

    await expectAsync(firstValueFrom(service.addProduct(42, 2))).toBeRejected();

    expect(counts).toEqual([0, 2, 0]);
    subscription.unsubscribe();
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
