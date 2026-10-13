export interface HardwareComparisonProduct {
  name: string;
  model: string | null;
  category: string;
  description: string | null;
  price: number | null;
  offer_price: number | null;
}

export interface HardwareComparisonRequest {
  currentHardware: string;
  message: string;
}

interface CategoryGuidance {
  performance: string;
  compatibility: string;
}

const CATEGORY_GUIDANCE: Record<string, CategoryGuidance> = {
  smartphones: {
    performance: 'fluidez em aplicativos, multitarefa, jogos, armazenamento, autonomia, cameras e conectividade',
    compatibility: 'versao do Android, atualizacoes, bandas 4G/5G, chip/eSIM, carregador e migracao dos dados',
  },
  tablets: {
    performance: 'multitarefa, aplicativos, tela, armazenamento, autonomia e suporte a caneta ou teclado',
    compatibility: 'sistema e atualizacoes, acessorios, caneta, teclado, carregador e conectividade Wi-Fi/LTE',
  },
  notebooks: {
    performance: 'processador, GPU, memoria, armazenamento, tela, autonomia e refrigeracao',
    compatibility: 'possibilidade de expandir RAM/SSD, portas, carregador, sistema operacional e requisitos dos programas',
  },
  games: {
    performance: 'desempenho nos jogos, resolucao, taxa de quadros, armazenamento e recursos do produto',
    compatibility: 'plataforma, jogos suportados, conexoes, controles, TV ou monitor e servicos exigidos',
  },
  perifericos: {
    performance: 'qualidade, latencia, ergonomia e recursos que afetam o uso pretendido',
    compatibility: 'tipo de conexao, portas disponiveis, sistema operacional, drivers, dimensoes e alimentacao',
  },
  hardware: {
    performance: 'CPU, GPU, memoria, armazenamento e o gargalo real do computador',
    compatibility: 'socket e chipset da placa-mae, memoria suportada, potencia e conectores da fonte, gabinete e interfaces',
  },
};

export function categoryGuidance(category: string): CategoryGuidance {
  return CATEGORY_GUIDANCE[normalizeCategory(category)] || {
    performance: 'desempenho, capacidade e recursos relevantes para o uso pretendido',
    compatibility: 'conexoes, sistema suportado, dimensoes, alimentacao e acessorios necessarios',
  };
}

export function buildLocalHardwareComparison(
  product: HardwareComparisonProduct,
  request: HardwareComparisonRequest,
): string {
  const category = normalizeCategory(product.category);
  const productLabel = `${product.name}${product.model ? ` (${product.model})` : ''}`;

  if (category === 'smartphones') {
    return buildSmartphoneComparison(product, request, productLabel);
  }

  const guidance = categoryGuidance(category);
  const knownDetails = product.description?.trim()
    ? `A loja informa: ${product.description.trim()}`
    : 'A ficha da loja nao informa especificacoes suficientes para medir o ganho.';

  return [
    `Comparacao direta: ${productLabel} deve ser avaliado contra ${request.currentHardware} pelos itens que realmente mudam o uso: ${guidance.performance}.`,
    knownDetails,
    `Para responder "${request.message}", ainda e preciso confirmar ${guidance.compatibility}. Sem esses dados, nao e seguro prometer ganho de desempenho ou dizer que o gargalo sera resolvido.`,
    'Recomendacao: considere a compra somente se as especificacoes do produto superarem o equipamento atual justamente no limite que voce percebe no dia a dia.',
  ].join('\n\n');
}

function buildSmartphoneComparison(
  product: HardwareComparisonProduct,
  request: HardwareComparisonRequest,
  productLabel: string,
): string {
  const current = request.currentHardware.trim();
  const searchableProduct = `${product.name} ${product.model || ''} ${product.description || ''}`;
  const storage = searchableProduct.match(/\b(\d{2,4})\s?GB\b/i)?.[1];
  const has5g = /\b5G\b/i.test(searchableProduct);
  const isJ5Prime = /\b(?:samsung\s+)?(?:galaxy\s+)?j5\s*prime\b/i.test(current);
  const likelyBottlenecks = isJ5Prime
    ? 'No J5 Prime, os limites mais provaveis hoje sao pouco espaco para apps e fotos, lentidao ao alternar aplicativos e desempenho baixo em apps e jogos atuais.'
    : `Em ${current}, identifique primeiro se o incomodo e lentidao, falta de espaco, bateria, camera ou conectividade.`;
  const advertisedGains = [
    storage ? `${storage} GB de armazenamento` : '',
    has5g ? 'conectividade 5G' : '',
  ].filter(Boolean);
  const statedGain = advertisedGains.length
    ? `Pelo cadastro, ${productLabel} oferece ${joinNaturalLanguage(advertisedGains)}. Isso resolve diretamente ${storage ? 'a falta de espaco' : 'uma limitacao de conectividade'}${storage && has5g ? ' e adiciona acesso ao 5G onde houver cobertura' : ''}.`
    : `O cadastro de ${productLabel} nao traz capacidade ou conectividade suficientes para apontar um ganho concreto.`;

  return [
    `Comparacao direta: ${current} versus ${productLabel}. ${likelyBottlenecks}`,
    statedGain,
    'O ganho de velocidade nao pode ser quantificado com seguranca porque o cadastro nao informa claramente processador e memoria RAM. Confirme esses dois itens, alem de bateria, cameras e politica de atualizacoes do Android.',
    'Na compatibilidade, verifique bandas 4G/5G, chip/eSIM, carregador e como sera feita a migracao dos seus dados.',
    `Recomendacao: ${advertisedGains.length ? 'o produto elimina gargalos claros de armazenamento e conectividade' : 'faltam dados para confirmar se ele resolve o seu gargalo'}; antes da compra, confirme processador e RAM para saber se tambem havera uma melhora grande de fluidez.`,
  ].join('\n\n');
}

function normalizeCategory(category: string): string {
  return category.trim().toLocaleLowerCase('pt-BR');
}

function joinNaturalLanguage(items: string[]): string {
  if (items.length < 2) {
    return items[0] || '';
  }

  return `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;
}
