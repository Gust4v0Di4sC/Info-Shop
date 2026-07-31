import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientService } from '@app/services/client.service';
import { of } from 'rxjs';

import ClientesComponent from './clientes.component';

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [
        {
          provide: ClientService,
          useValue: {
            getClients: () => of([]),
            deleteClient: () => of(undefined),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
