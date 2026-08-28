import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CartPageComponent } from './cart-page.component';
import { CartServiceService } from '@app/services/cart-service.service';
import { PaymentService } from '@app/services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViaCepService } from '@app/services/via-cep.service';

describe('CartPageComponent', () => {
  it('should create a Mercado Pago preference and redirect to its init point', () => {
    const cartService = cartServiceMock();
    const paymentService = paymentServiceMock();
    const component = new CartPageComponent(
      cartService,
      paymentService,
      new FormBuilder(),
      changeDetectorRefMock(),
      snackBarMock(),
      viaCepServiceMock(),
    );
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
    const snackBar = snackBarMock();
    const component = new CartPageComponent(
      cartService,
      paymentService,
      new FormBuilder(),
      changeDetectorRefMock(),
      snackBar,
      viaCepServiceMock(),
    );

    component.selectedServiceId = '1';
    fillAddress(component);
    component.checkout();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Não foi possível iniciar o pagamento agora. Tente novamente em alguns instantes.',
      'Fechar',
      jasmine.objectContaining({ duration: 3000 }),
    );
    expect(component.isCheckingOut).toBeFalse();
  });

  it('should keep shipping errors inline when no quotes are returned', () => {
    const cartService = cartServiceMock();
    const paymentService = paymentServiceMock();
    const component = new CartPageComponent(
      cartService,
      paymentService,
      new FormBuilder(),
      changeDetectorRefMock(),
      snackBarMock(),
      viaCepServiceMock(),
    );
    (cartService.calculateShipping as jasmine.Spy).and.returnValue(of([]));

    fillAddress(component);
    component.calculateShipping();

    expect(component.pageErrorMessage).toBe('');
    expect(component.actionErrorMessage).toBe('Não encontramos frete disponível para este endereço.');
    expect(component.shippingQuotes).toEqual([]);
    expect(component.selectedServiceId).toBe('');
    expect(component.isQuoting).toBeFalse();
  });

  it('should select the first shipping quote returned', () => {
    const cartService = cartServiceMock();
    const paymentService = paymentServiceMock();
    const component = new CartPageComponent(
      cartService,
      paymentService,
      new FormBuilder(),
      changeDetectorRefMock(),
      snackBarMock(),
      viaCepServiceMock(),
    );
    (cartService.calculateShipping as jasmine.Spy).and.returnValue(of([
      { id: '2', name: 'SEDEX', company: 'Correios', price: 29.9, deliveryTime: 2 },
    ]));

    fillAddress(component);
    component.calculateShipping();

    expect(component.actionErrorMessage).toBe('');
    expect(component.shippingQuotes.length).toBe(1);
    expect(component.selectedServiceId).toBe('2');
    expect(component.isQuoting).toBeFalse();
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

function snackBarMock(): MatSnackBar {
  return {
    open: jasmine.createSpy('open'),
  } as unknown as MatSnackBar;
}

function changeDetectorRefMock(): ChangeDetectorRef {
  return {
    checkNoChanges: jasmine.createSpy('checkNoChanges'),
    detach: jasmine.createSpy('detach'),
    detectChanges: jasmine.createSpy('detectChanges'),
    markForCheck: jasmine.createSpy('markForCheck'),
    reattach: jasmine.createSpy('reattach'),
  } as unknown as ChangeDetectorRef;
}

function viaCepServiceMock(): ViaCepService {
  return {
    lookup: jasmine.createSpy('lookup').and.returnValue(of(null)),
  } as unknown as ViaCepService;
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
