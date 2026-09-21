import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { AdminThemeService } from '@app/core/theme/admin-theme.service';
import { of } from 'rxjs';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUserAsync: () => Promise.resolve(null),
          },
        },
        {
          provide: AdminThemeService,
          useValue: {
            publicLogoUrl: () => 'https://assets.example/blocked-logo.png',
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the bundled logo when the personalized logo fails to load', async () => {
    const logo: HTMLImageElement = fixture.nativeElement.querySelector('.logo-image');

    expect(logo.src).toBe('https://assets.example/blocked-logo.png');

    logo.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(logo.src).toContain('/Logo3.svg');
  });
});
