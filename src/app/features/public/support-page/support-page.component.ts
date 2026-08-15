import { Component, OnInit } from '@angular/core';
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
    summary: 'Use nossos canais de atendimento para tirar duvidas antes ou depois da compra.',
    items: [
      'Atendimento por e-mail em suporte@infoshop.com.',
      'Telefone comercial: +55 8 9999-9999.',
      'Endereco: Rua Tech, 123 - Esquina da Ciencia.',
    ],
  },
  {
    title: 'Perguntas frequentes',
    slug: 'perguntas-frequentes',
    summary: 'Respostas rapidas para as duvidas mais comuns da loja.',
    items: [
      'Produtos em estoque aparecem disponiveis no catalogo.',
      'Compras podem ser parceladas em ate 12 vezes sem juros.',
      'O prazo de entrega e calculado conforme o endereco informado.',
    ],
  },
  {
    title: 'Politica de compra',
    slug: 'politica-de-compra',
    summary: 'Regras principais para pedidos realizados na InfoShop.',
    items: [
      'O pedido e confirmado apos aprovacao do pagamento.',
      'Produtos podem ter preco promocional por tempo limitado.',
      'Dados de contato corretos ajudam a evitar atrasos na entrega.',
    ],
  },
  {
    title: 'Trocas e devolucoes',
    slug: 'trocas-e-devolucoes',
    summary: 'Orientacoes para solicitar troca, devolucao ou suporte de garantia.',
    items: [
      'Guarde nota fiscal, embalagem e acessorios do produto.',
      'Solicitacoes devem informar numero do pedido e motivo.',
      'A garantia padrao exibida na loja e de 12 meses.',
    ],
  },
  {
    title: 'Privacidade',
    slug: 'privacidade',
    summary: 'Como tratamos dados usados nos fluxos de cadastro, compra e entrega.',
    items: [
      'Usamos dados cadastrais para identificacao e envio de pedidos.',
      'Informacoes de pagamento sao processadas por provedores integrados.',
      'Dados de conta podem ser revisados na area de perfil do cliente.',
    ],
  },
];

@Component({
  selector: 'app-support-page',
  imports: [RouterLink],
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
