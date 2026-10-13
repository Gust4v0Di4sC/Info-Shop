import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLocalHardwareComparison } from './hardware-comparison.ts';

test('compares a smartphone with a J5 Prime using relevant bottlenecks', () => {
  const answer = buildLocalHardwareComparison({
    name: 'Smartphone Galaxy Ultra 5G',
    model: 'GLX-U-512',
    category: 'smartphones',
    description: 'Smartphone 5G com 512GB, camera avancada e tela de alto brilho.',
    price: 4999.9,
    offer_price: null,
  }, {
    currentHardware: 'tenho um samsung j5 prime',
    message: 'Qual gargalo esse produto pode resolver no meu setup?',
  });

  assert.match(answer, /pouco espaco/i);
  assert.match(answer, /512 GB/);
  assert.match(answer, /conectividade 5G/);
  assert.match(answer, /processador e memoria RAM/);
  assert.doesNotMatch(answer, /placa-mae|fonte|gabinete/i);
});

test('keeps desktop compatibility guidance for PC hardware', () => {
  const answer = buildLocalHardwareComparison({
    name: 'Memoria DDR5 32GB 6000MHz',
    model: 'DDR5-32-6000',
    category: 'hardware',
    description: 'Kit de memoria DDR5 para setups modernos.',
    price: 899.9,
    offer_price: null,
  }, {
    currentHardware: 'Ryzen 5 3600, placa-mae B450 e 16 GB DDR4',
    message: 'Isso resolve meu gargalo?',
  });

  assert.match(answer, /socket e chipset da placa-mae/i);
  assert.match(answer, /memoria suportada/i);
});
