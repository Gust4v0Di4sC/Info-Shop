import { TestBed } from '@angular/core/testing';

import { ProductFormService } from './product-form.service';

describe('ProductFormService', () => {
  let service: ProductFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
