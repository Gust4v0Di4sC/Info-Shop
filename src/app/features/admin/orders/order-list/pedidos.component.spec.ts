import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { OrderService } from '@app/services/order.service';
import { of } from 'rxjs';

import PedidosComponent from './pedidos.component';

describe('PedidosComponent', () => {
  let component: PedidosComponent;
  let fixture: ComponentFixture<PedidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosComponent],
      providers: [
        {
          provide: OrderService,
          useValue: {
            getOrders: () => of([]),
            cancelOrder: () => of({}),
          },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUserAsync: () => Promise.resolve(null),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
