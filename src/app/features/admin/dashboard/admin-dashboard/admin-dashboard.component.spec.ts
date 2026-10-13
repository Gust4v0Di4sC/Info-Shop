import { ChangeDetectorRef, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveDialogService } from '@app/core/layout/responsive-dialog.service';
import { Order } from '@app/models/order.model';
import { AdminDashboardService } from '@app/services/admin-dashboard.service';

import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  const order: Order = {
    address: 'Rua das Flores, 10',
    clientId: 1,
    created_at: '2026-10-12T12:00:00.000Z',
    id: 42,
    imageClient: null,
    imageProd: null,
    name: 'Cliente com nome extenso',
    product: 'Produto com descrição muito extensa',
    productId: 2,
    quantity: 2,
    status: 'confirmed',
    store_id: 'store-id',
    total_amount: 999.9,
    updated_at: '2026-10-12T12:00:00.000Z',
    userId: null,
  };

  it('opens the recent order in a responsive accessible dialog', () => {
    const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    const responsiveDialog = jasmine.createSpyObj<ResponsiveDialogService>('ResponsiveDialogService', ['buildConfig']);
    responsiveDialog.buildConfig.and.callFake(config => config);

    const component = new AdminDashboardComponent(
      {} as AdminDashboardService,
      { markForCheck: () => undefined } as ChangeDetectorRef,
      dialog,
      responsiveDialog,
    );
    const template = {} as TemplateRef<unknown>;
    (component as unknown as { orderDetailsTemplate: TemplateRef<unknown> }).orderDetailsTemplate = template;

    component.openOrderDetails(order);

    expect(component.selectedOrder).toBe(order);
    expect(responsiveDialog.buildConfig).toHaveBeenCalledWith(jasmine.objectContaining({
      desktopWidth: '560px',
      ariaLabel: 'Detalhes do pedido 42',
      restoreFocus: true,
    }));
    expect(dialog.open).toHaveBeenCalledWith(template, jasmine.any(Object));
  });

  it('translates the order status shown in the dialog', () => {
    const component = new AdminDashboardComponent(
      {} as AdminDashboardService,
      { markForCheck: () => undefined } as ChangeDetectorRef,
      {} as MatDialog,
      {} as ResponsiveDialogService,
    );

    expect(component.orderStatusLabel('payment_pending')).toBe('Aguardando pagamento');
    expect(component.orderStatusLabel('unknown')).toBe('unknown');
  });
});
