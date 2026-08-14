import { TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { of } from 'rxjs';

import { ClientFormService } from './client-form.service';

describe('ClientFormService', () => {
  let service: ClientFormService;

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
    service = TestBed.inject(ClientFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
