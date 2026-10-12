import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@app/core/auth/auth.service';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';
import { AdminProfileService } from './admin-profile.service';

describe('AdminProfileService', () => {
  let service: AdminProfileService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TenantContextService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
    });

    service = TestBed.inject(AdminProfileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('inicia a autorizacao pelo BFF autenticado', async () => {
    const resultPromise = firstValueFrom(service.startMelhorEnvioAuthorization());
    const request = httpTesting.expectOne('/api/integrations/melhor-envio/authorization');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBeTrue();
    request.flush({
      authorizationUrl: 'https://sandbox.melhorenvio.com.br/oauth/authorize?state=secure-state',
    });

    await expectAsync(resultPromise).toBeResolvedTo({
      authorizationUrl: 'https://sandbox.melhorenvio.com.br/oauth/authorize?state=secure-state',
    });
  });

  it('rejeita URL de autorizacao fora dos dominios do Melhor Envio', async () => {
    const resultPromise = firstValueFrom(service.startMelhorEnvioAuthorization());
    const request = httpTesting.expectOne('/api/integrations/melhor-envio/authorization');

    request.flush({ authorizationUrl: 'https://example.com/oauth/authorize' });

    await expectAsync(resultPromise).toBeRejectedWithError(
      'O Melhor Envio nao retornou uma URL de autorizacao valida.',
    );
  });
});
