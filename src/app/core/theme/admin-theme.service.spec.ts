import { TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { BehaviorSubject } from 'rxjs';

import { AdminThemeService } from './admin-theme.service';

describe('AdminThemeService', () => {
  const storageKey = 'infoshop-admin-personalization';
  const adminUser = { id: 'admin-user-id' };
  let currentUser: BehaviorSubject<typeof adminUser | null>;
  let service: AdminThemeService;

  beforeEach(() => {
    currentUser = new BehaviorSubject<typeof adminUser | null>(null);
    localStorage.setItem(storageKey, JSON.stringify({
      themeId: 'graphite',
      storeLogoUrl: 'https://assets.example.com/previous-admin-logo.png',
    }));

    TestBed.configureTestingModule({
      providers: [
        AdminThemeService,
        {
          provide: AuthService,
          useValue: {
            currentUser$: currentUser.asObservable(),
            getCurrentUserAsync: () => Promise.resolve(currentUser.value),
          },
        },
      ],
    });

    service = TestBed.inject(AdminThemeService);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should ignore and remove branding cached by a previous admin session', () => {
    expect(service.publicLogoUrl()).toBe('/Logo3.svg');
    expect(service.adminLogoUrl()).toBe('/Logo1.svg');
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should restore public defaults when the authenticated user logs out', async () => {
    spyOn(service as any, 'loadForUser').and.callFake(async () => {
      (service as any).setPersonalization({
        themeId: 'graphite',
        storeLogoUrl: 'https://assets.example.com/current-admin-logo.png',
      });
    });

    await service.initialize();
    currentUser.next(adminUser);
    await Promise.resolve();

    expect(service.publicLogoUrl()).toBe('https://assets.example.com/current-admin-logo.png');

    currentUser.next(null);

    expect(service.publicLogoUrl()).toBe('/Logo3.svg');
    expect(service.adminLogoUrl()).toBe('/Logo1.svg');
    expect(service.storeLogoUrl()).toBeNull();
  });
});
