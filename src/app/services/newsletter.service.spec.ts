import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { NewsletterService } from './newsletter.service';

describe('NewsletterService', () => {
  let service: NewsletterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NewsletterService);
  });

  it('should complete only after the confirmation email is sent', async () => {
    const invokeSpy = spyOn<any>(service, 'invokeFunction').and.resolveTo({ emailSent: true });

    await expectAsync(firstValueFrom(service.subscribe(' Cliente@Example.com '))).toBeResolved();
    expect(invokeSpy).toHaveBeenCalledWith('newsletter-subscribe', { email: 'cliente@example.com' });
  });

  it('should fail instead of silently saving without sending an email', async () => {
    spyOn<any>(service, 'invokeFunction').and.resolveTo({ emailSent: false });

    await expectAsync(firstValueFrom(service.subscribe('cliente@example.com')))
      .toBeRejectedWithError(/não foi enviado/);
  });
});
