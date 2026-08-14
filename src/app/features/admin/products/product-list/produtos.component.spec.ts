import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { ProductService } from '@app/services/product.service';
import { of } from 'rxjs';

import ProdutosComponent from './produtos.component';

describe('ProdutosComponent', () => {
  let component: ProdutosComponent;
  let fixture: ComponentFixture<ProdutosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProdutosComponent],
      providers: [
        {
          provide: ProductService,
          useValue: {
            getProducts: () => of([]),
            deleteProduct: () => of(undefined),
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

    fixture = TestBed.createComponent(ProdutosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
