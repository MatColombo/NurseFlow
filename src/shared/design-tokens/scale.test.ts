import { describe, expect, it } from 'vitest';
import { createScaleTokens } from './scale';

describe('Scala globale', () => {
  it.each([4, 13, 30, 48])('mantiene gli offset fissi e limiti touch a %ipt', (s) => {
    const tokens = createScaleTokens(s);
    expect(tokens['--nf-font-base']).toBe(`${s}pt`);
    expect(tokens['--nf-font-title']).toBe(`${s + 4}pt`);
    expect(tokens['--nf-font-step']).toBe(`${s + 3}pt`);
    expect(tokens['--nf-font-note']).toBe(`${s - 1}pt`);
    expect(tokens['--nf-font-meta']).toBe(`${s - 2}pt`);
    expect(parseFloat(tokens['--nf-control-min']!)).toBeGreaterThanOrEqual(24);
    expect(parseFloat(tokens['--nf-action-min']!)).toBeGreaterThanOrEqual(44);
  });
  it.each([3, 49, 4.5, NaN, Infinity])('rifiuta %s senza correggere silenziosamente', (s) => {
    expect(() => createScaleTokens(s)).toThrow(RangeError);
  });
  it('elimina spazi ornamentali a 4pt e dimensiona anche box, icone e spazi', () => {
    expect(createScaleTokens(4)['--nf-card-pad']).toBe('0px');
    for (const key of ['--nf-icon', '--nf-card-pad', '--nf-radius', '--nf-space-2', '--nf-control-min']) {
      expect(parseFloat(createScaleTokens(48)[key]!)).toBeGreaterThan(parseFloat(createScaleTokens(13)[key]!));
    }
  });
});
