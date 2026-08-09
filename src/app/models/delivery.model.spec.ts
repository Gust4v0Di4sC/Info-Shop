import { mapMelhorEnvioStatus } from './delivery.model';

describe('mapMelhorEnvioStatus', () => {
  it('should map Melhor Envio lifecycle statuses to internal delivery statuses', () => {
    expect(mapMelhorEnvioStatus('created')).toBe('preparing');
    expect(mapMelhorEnvioStatus('posted')).toBe('shipped');
    expect(mapMelhorEnvioStatus('order.delivered')).toBe('delivered');
    expect(mapMelhorEnvioStatus('cancelled')).toBe('canceled');
    expect(mapMelhorEnvioStatus('paused')).toBe('out_for_delivery');
  });
});
