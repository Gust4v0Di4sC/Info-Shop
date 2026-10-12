import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should share one landing request between featured products and offer', async () => {
    const featuredPromise = firstValueFrom(service.getFeaturedProducts());
    const offerPromise = firstValueFrom(service.getOfferProduct());
    const request = httpMock.expectOne('/api/public/products/landing');

    request.flush({
      featured: [{ id: 1, name: 'Produto' }],
      offer: { id: 2, name: 'Oferta' },
    });

    expect((await featuredPromise)[0].name).toBe('Produto');
    expect((await offerPromise)?.name).toBe('Oferta');
  });
});
