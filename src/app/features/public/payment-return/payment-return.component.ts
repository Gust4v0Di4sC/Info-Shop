import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-return',
  imports: [RouterLink],
  templateUrl: './payment-return.component.html',
  styleUrl: './payment-return.component.scss',
})
export class PaymentReturnComponent {
  private readonly route = inject(ActivatedRoute);

  readonly status = this.route.snapshot.queryParamMap.get('status') || 'pending';
  readonly orderId = this.route.snapshot.queryParamMap.get('order_id') || '';

  get title(): string {
    if (this.status === 'approved') {
      return 'Pagamento recebido';
    }

    if (this.status === 'failure') {
      return 'Pagamento não aprovado';
    }

    return 'Pagamento em análise';
  }

  get message(): string {
    if (this.status === 'approved') {
      return 'Estamos aguardando a confirmação do Mercado Pago para atualizar seu pedido e preparar a entrega.';
    }

    if (this.status === 'failure') {
      return 'O Mercado Pago não aprovou esta tentativa. Você pode voltar ao carrinho e tentar novamente.';
    }

    return 'Assim que o Mercado Pago confirmar o status, seu pedido será atualizado automaticamente.';
  }
}
