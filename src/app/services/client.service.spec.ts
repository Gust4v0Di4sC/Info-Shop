import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ClientService } from './client.service';

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(ClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
