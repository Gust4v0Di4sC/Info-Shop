import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';

import { AuthCallbackComponent } from './auth-callback.component';

describe('AuthCallbackComponent', () => {
  let component: AuthCallbackComponent;
  let fixture: ComponentFixture<AuthCallbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            handleAuthCallback: () => Promise.resolve(),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
