import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface SupportTopic {
  title: string;
  slug: string;
  summary: string;
  items: string[];
}

const SUPPORT_TOPICS: SupportTopic[] = [
  {
    title: 'Fale conosco',
    slug: 'fale-conosco',
    summary: 'Use nossos canais de atendimento para tirar dúvidas antes ou depois da compra.',
    items: [
      'Atendimento por e-mail em suporte@infoshop.com.',
      'Telefone comercial: +55 8 9999-9999.',
      'Endereço: Rua Tech, 123 - Esquina da Ciencia.',
    ],
  },
  {
    title: 'Perguntas frequentes',
    slug: 'perguntas-frequentes',
    summary: 'Respostas rápidas para as dúvidas mais comuns da loja.',
    items: [
      'Produtos em estoque aparecem disponíveis no catálogo.',
      'Compras podem ser parceladas em até 12 vezes sem juros.',
      'O prazo de entrega é calculado conforme o endereço informado.',
    ],
  },
  {
    title: 'Política de compra',
    slug: 'politica-de-compra',
    summary: 'Regras principais para pedidos realizados na InfoShop.',
    items: [
      'O pedido é confirmado após aprovação do pagamento.',
      'Produtos podem ter preço promocional por tempo limitado.',
      'Dados de contato corretos ajudam a evitar atrasos na entrega.',
    ],
  },
  {
    title: 'Trocas e devoluções',
    slug: 'trocas-e-devolucoes',
    summary: 'Orientações para solicitar troca, devolução ou suporte de garantia.',
    items: [
      'Guarde nota fiscal, embalagem e acessórios do produto.',
      'Solicitações devem informar número do pedido e motivo.',
      'A garantia padrão exibida na loja é de 12 meses.',
    ],
  },
  {
    title: 'Privacidade',
    slug: 'privacidade',
    summary: 'Como tratamos dados usados nos fluxos de cadastro, compra e entrega.',
    items: [
      'Usamos dados cadastrais para identificação e envio de pedidos.',
      'Informações de pagamento são processadas por provedores integrados.',
      'Dados de conta podem ser revisados na área de perfil do cliente.',
    ],
  },
];

@Component({
  selector: 'app-support-page',
  imports: [MatIconModule, RouterLink],
  templateUrl: './support-page.component.html',
  styleUrl: './support-page.component.scss',
})
export class SupportPageComponent implements OnInit {
  readonly topics = SUPPORT_TOPICS;
  topic: SupportTopic = SUPPORT_TOPICS[0];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('topic');
      this.topic = this.topics.find(topic => topic.slug === slug) || SUPPORT_TOPICS[0];
    });
  }
}
