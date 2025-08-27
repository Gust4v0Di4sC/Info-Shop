import { TestBed } from '@angular/core/testing';

import { ClientFormService } from './client-form.service';

describe('ClientFormService', () => {
  let service: ClientFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
