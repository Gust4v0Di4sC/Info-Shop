import { TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { of } from 'rxjs';

import { OrderFormService } from './order-form.service';

describe('OrderFormService', () => {
  let service: OrderFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUserAsync: () => Promise.resolve(null),
          },
        },
      ],
    });
    service = TestBed.inject(OrderFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
