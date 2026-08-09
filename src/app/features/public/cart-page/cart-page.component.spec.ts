import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CartPageComponent } from './cart-page.component';
import { CartServiceService } from '@app/services/cart-service.service';
import { PaymentService } from '@app/services/payment.service';

describe('CartPageComponent', () => {
  it('should create a Mercado Pago preference and redirect to its init point', () => {
    const cartService = cartServiceMock();
    const paymentService = paymentServiceMock();
    const component = new CartPageComponent(cartService, paymentService, new FormBuilder());
    const redirectSpy = spyOn(component, 'redirectToPayment');

    component.selectedServiceId = '1';
    fillAddress(component);
    component.checkout();

    expect(paymentService.createPreference).toHaveBeenCalledWith({
      address: {
        postalCode: '01001000',
        street: 'Praca da Se',
        number: '1',
        district: 'Se',
        city: 'Sao Paulo',
        state: 'SP',
        complement: null,
      },
      selectedServiceId: '1',
    });
    expect(redirectSpy).toHaveBeenCalledWith('https://mercadopago.test/checkout');
    expect(component.isCheckingOut).toBeFalse();
  });

  it('should show an error when preference creation fails', () => {
    const cartService = cartServiceMock();
    const paymentService = {
      createPreference: jasmine.createSpy().and.returnValue(throwError(() => new Error('Falha MP'))),
    } as unknown as PaymentService;
    const component = new CartPageComponent(cartService, paymentService, new FormBuilder());

    component.selectedServiceId = '1';
    fillAddress(component);
    component.checkout();

    expect(component.errorMessage).toBe('Falha MP');
    expect(component.isCheckingOut).toBeFalse();
  });
});

function cartServiceMock(): CartServiceService {
  return {
    calculateShipping: jasmine.createSpy(),
    getCartItems: jasmine.createSpy(),
    refreshCartCount: jasmine.createSpy(),
  } as unknown as CartServiceService;
}

function paymentServiceMock(): PaymentService {
  return {
    createPreference: jasmine.createSpy().and.returnValue(of({
      order: { id: 'order-1' },
      payment: { id: 'payment-1' },
      quote: { id: '1', name: 'PAC', company: 'Correios', price: 19.9, deliveryTime: 5 },
      initPoint: 'https://mercadopago.test/checkout',
      sandboxInitPoint: 'https://sandbox.mercadopago.test/checkout',
    })),
  } as unknown as PaymentService;
}

function fillAddress(component: CartPageComponent): void {
  component.shippingForm.setValue({
    postalCode: '01001000',
    street: 'Praca da Se',
    number: '1',
    district: 'Se',
    city: 'Sao Paulo',
    state: 'SP',
    complement: '',
  });
}
