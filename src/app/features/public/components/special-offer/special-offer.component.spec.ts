import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@app/core/auth/auth.service';
import { of } from 'rxjs';

import { SpecialOfferComponent } from './special-offer.component';

describe('SpecialOfferComponent', () => {
  let component: SpecialOfferComponent;
  let fixture: ComponentFixture<SpecialOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialOfferComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUserAsync: () => Promise.resolve(null),
          },
        },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
