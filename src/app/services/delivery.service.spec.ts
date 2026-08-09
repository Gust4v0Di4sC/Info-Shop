import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

import { DeliveryService } from './delivery.service';

describe('DeliveryService', () => {
  let service: DeliveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DeliveryService,
        {
          provide: TenantContextService,
          useValue: {
            selectedStoreIdRequired$: () => of('store-1'),
            getSelectedStoreId: () => Promise.resolve('store-1'),
          },
        },
      ],
    });
    service = TestBed.inject(DeliveryService);
  });

  it('should load only deliveries owned by the current user', async () => {
    const query: any = {
      select: jasmine.createSpy('select').and.callFake(() => query),
      eq: jasmine.createSpy('eq').and.callFake(() => query),
      order: jasmine.createSpy('order').and.resolveTo({
        data: [
          {
            id: 'delivery-1',
            user_id: 'user-1',
            status: 'preparing',
          },
        ],
        error: null,
      }),
    };
    spyOn(supabase.auth, 'getUser').and.resolveTo({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);
    spyOn(supabase, 'from').and.returnValue(query);

    const deliveries = await firstValueFrom(service.getCurrentUserDeliveries());

    expect(supabase.from as jasmine.Spy).toHaveBeenCalledWith('deliveries');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(deliveries[0].id).toBe('delivery-1');
  });
});
