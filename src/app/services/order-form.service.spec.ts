import { TestBed } from '@angular/core/testing';

import { OrderFormService } from './order-form.service';

describe('OrderFormService', () => {
  let service: OrderFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
