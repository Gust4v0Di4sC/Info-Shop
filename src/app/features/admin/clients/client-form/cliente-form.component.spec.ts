import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientFormService } from '@app/services/client-form.service';
import { of } from 'rxjs';

import { ClienteFormComponent } from './cliente-form.component';

describe('ClienteFormComponent', () => {
  let component: ClienteFormComponent;
  let fixture: ComponentFixture<ClienteFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteFormComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: ClientFormService,
          useValue: {
            createClient: () => of({}),
            updateClient: () => of({}),
            uploadImage: () => of({ imageUrl: '' }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
