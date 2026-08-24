import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { Product } from '@app/models/product.model';
import { ProductService } from '@app/services/product.service';
import { of } from 'rxjs';

import { SpecialOfferComponent } from './special-offer.component';

describe('SpecialOfferComponent', () => {
  let component: SpecialOfferComponent;
  let fixture: ComponentFixture<SpecialOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialOfferComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUserAsync: () => Promise.resolve(null),
          },
        },
        {
          provide: ProductService,
          useValue: {
            getOfferProduct: () => of(null),
          },
        },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('SpecialOfferComponent on the server', () => {
  it('does not start the countdown interval during server rendering', async () => {
    const setIntervalSpy = spyOn(window, 'setInterval');
    const product = {
      id: 1,
      name: 'Produto em oferta',
      price: 100,
      offer_price: 80,
    } as Product;

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [SpecialOfferComponent],
        providers: [
          provideRouter([]),
          { provide: PLATFORM_ID, useValue: 'server' },
          {
            provide: AuthService,
            useValue: {
              currentUser$: of(null),
              getCurrentUserAsync: () => Promise.resolve(null),
            },
          },
          {
            provide: ProductService,
            useValue: {
              getOfferProduct: () => of(product),
            },
          },
          { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
        ],
      })
      .compileComponents();

    const serverFixture = TestBed.createComponent(SpecialOfferComponent);
    serverFixture.detectChanges();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
