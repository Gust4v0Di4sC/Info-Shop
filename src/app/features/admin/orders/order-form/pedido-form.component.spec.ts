import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrderFormService } from '@app/services/order-form.service';
import { of } from 'rxjs';

import { PedidoFormComponent } from './pedido-form.component';

describe('PedidoFormComponent', () => {
  let component: PedidoFormComponent;
  let fixture: ComponentFixture<PedidoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: OrderFormService,
          useValue: {
            getClients: () => of([]),
            getProducts: () => of([]),
            updateOrder: () => of({}),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
