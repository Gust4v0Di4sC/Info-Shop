import { TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { of } from 'rxjs';

import { ProductFormService } from './product-form.service';

describe('ProductFormService', () => {
  let service: ProductFormService;

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
    service = TestBed.inject(ProductFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
