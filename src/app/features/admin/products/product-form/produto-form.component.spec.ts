import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductFormService } from '@app/services/product-form.service';
import { of } from 'rxjs';

import { ProdutoFormComponent } from './produto-form.component';

describe('ProdutoFormComponent', () => {
  let component: ProdutoFormComponent;
  let fixture: ComponentFixture<ProdutoFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProdutoFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: ProductFormService,
          useValue: {
            createProduct: () => of({}),
            updateProduct: () => of({}),
            uploadImage: () => of({ imageUrl: '' }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProdutoFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
