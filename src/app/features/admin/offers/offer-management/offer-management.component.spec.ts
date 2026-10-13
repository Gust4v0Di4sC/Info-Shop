import { FormBuilder } from '@angular/forms';
import { Product } from '@app/models/product.model';
import { OfferService } from '@app/services/offer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { OfferManagementComponent } from './offer-management.component';

describe('OfferManagementComponent', () => {
  it('keeps the preview paired with the newly selected product', () => {
    const ssd = product(1, 'SSD NVMe 1TB Turbo');
    const memory = product(2, 'Memoria DDR5 32GB 6000MHz');
    const offerService = {
      getProducts: () => of([ssd, memory]),
      getActiveOffer: () => of(ssd),
    } as Pick<OfferService, 'getProducts' | 'getActiveOffer'>;
    const snackBar = {
      open: jasmine.createSpy('open'),
    } as unknown as MatSnackBar;
    const component = new OfferManagementComponent(
      new FormBuilder(),
      offerService as OfferService,
      snackBar,
    );

    component.ngOnInit();
    component.offerForm.controls['productId'].setValue(memory.id);

    expect(component.selectedProduct).toBe(memory);
  });
});

function product(id: number, name: string): Product {
  return {
    id,
    name,
    description: `${name} description`,
    imageUrl: null,
    price: 100,
    offer_price: null,
    offer_badge: 'Oferta da semana',
    offer_ends_at: null,
    offer_sold_percent: 0,
  } as Product;
}
