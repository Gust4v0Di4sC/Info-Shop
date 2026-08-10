import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { HardwareBenchmarkService } from './hardware-benchmark.service';

describe('HardwareBenchmarkService', () => {
  let service: HardwareBenchmarkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HardwareBenchmarkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should compare hardware through the edge function', async () => {
    const request = {
      productId: 12,
      currentHardware: 'Ryzen 5 3600, GTX 1660, 16GB RAM',
      message: 'Esse notebook e melhor para jogos?',
      history: [{ role: 'user' as const, text: 'Compare com meu PC.' }],
    };
    const invokeSpy = spyOn<any>(service, 'invokeFunction').and.resolveTo({
      answer: 'O produto tende a ser melhor em CPU, mas depende da GPU cadastrada.',
    });

    const result = await firstValueFrom(service.compare(request));

    expect(invokeSpy).toHaveBeenCalledWith('hardware-benchmark-chat', request);
    expect(result.answer).toContain('CPU');
  });
});
