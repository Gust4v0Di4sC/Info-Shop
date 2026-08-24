import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { User } from '@supabase/supabase-js';

import { AuthService } from '@app/core/auth/auth.service';
import { HardwareBenchmarkService } from '@app/services/hardware-benchmark.service';
import { HardwareBenchmarkChatComponent } from './hardware-benchmark-chat.component';

describe('HardwareBenchmarkChatComponent', () => {
  let component: HardwareBenchmarkChatComponent;
  let fixture: ComponentFixture<HardwareBenchmarkChatComponent>;
  let currentUser$: BehaviorSubject<User | null>;
  let benchmarkService: jasmine.SpyObj<HardwareBenchmarkService>;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<User | null>(null);
    benchmarkService = jasmine.createSpyObj<HardwareBenchmarkService>('HardwareBenchmarkService', ['compare']);

    await TestBed.configureTestingModule({
      imports: [HardwareBenchmarkChatComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: currentUser$.asObservable(),
            isAuthenticated: () => Boolean(currentUser$.value),
          },
        },
        { provide: HardwareBenchmarkService, useValue: benchmarkService },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HardwareBenchmarkChatComponent);
    component = fixture.componentInstance;
    component.product = {
      id: 7,
      name: 'Notebook Gamer',
      model: 'RTX 4060',
      description: 'Notebook com GPU dedicada',
      price: 5999,
      offer_price: null,
    } as any;
    fixture.detectChanges();
  });

  it('should block sending when user is not logged in', () => {
    component.currentHardwareControl.setValue('Ryzen 5 3600, GTX 1660');
    component.messageControl.setValue('Compare para jogos.');

    component.sendMessage();

    expect(benchmarkService.compare).not.toHaveBeenCalled();
    expect(component.validationMessage).toContain('Entre');
  });

  it('should block sending without current hardware', () => {
    currentUser$.next({ id: 'user-1' } as User);
    component.currentHardwareControl.setValue('');
    component.messageControl.setValue('Compare para jogos.');

    component.sendMessage();

    expect(benchmarkService.compare).not.toHaveBeenCalled();
    expect(component.validationMessage).toContain('hardware atual');
  });

  it('should add user and model messages when the benchmark succeeds', () => {
    currentUser$.next({ id: 'user-1' } as User);
    benchmarkService.compare.and.returnValue(of({ answer: 'Este produto deve entregar mais FPS.' }));
    component.currentHardwareControl.setValue('Ryzen 5 3600, GTX 1660');
    component.messageControl.setValue('Compare para jogos.');

    component.sendMessage();

    expect(benchmarkService.compare).toHaveBeenCalledWith({
      productId: 7,
      currentHardware: 'Ryzen 5 3600, GTX 1660',
      message: 'Compare para jogos.',
      history: [],
    });
    expect(component.messages).toEqual([
      { role: 'user', text: 'Compare para jogos.' },
      { role: 'model', text: 'Este produto deve entregar mais FPS.' },
    ]);
  });

  it('should show a friendly error when the benchmark fails', () => {
    currentUser$.next({ id: 'user-1' } as User);
    benchmarkService.compare.and.returnValue(throwError(() => new Error('network')));
    component.currentHardwareControl.setValue('Ryzen 5 3600, GTX 1660');
    component.messageControl.setValue('Compare para jogos.');

    component.sendMessage();

    expect(component.errorMessage).toBe('Não foi possível consultar a IA agora.');
    expect(component.messages.at(-1)?.text).toBe(component.fallbackAnswer);
  });
});
