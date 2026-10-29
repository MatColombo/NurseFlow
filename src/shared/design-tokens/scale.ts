export const DEFAULT_UI_SCALE_PT = 13;

/** Point offsets are fixed; geometry compresses to its essential bounds at 4pt. */
export function createScaleTokens(s: number): Record<string, string> {
  if (!Number.isInteger(s) || s < 4 || s > 48) throw new RangeError('uiScalePt must be an integer from 4 to 48');
  const ratio = s / 13;
  const ornament = (s - 4) / 9;
  const px = (value: number) => `${Number(value.toFixed(3))}px`;
  return {
    '--nf-font-base': `${s}pt`, '--nf-font-title': `${s + 4}pt`, '--nf-font-step': `${s + 3}pt`,
    '--nf-font-note': `${Math.max(3, s - 1)}pt`, '--nf-font-meta': `${Math.max(2, s - 2)}pt`,
    '--nf-space-1': px(4 * ornament), '--nf-space-2': px(8 * ornament),
    '--nf-space-3': px(12 * ornament), '--nf-card-pad': px(10 * ornament),
    '--nf-radius': px(10 * ratio), '--nf-icon': px(20 * ratio),
    '--nf-control-min': px(Math.max(24, 48 * ratio)),
    '--nf-action-min': px(Math.max(44, 56 * ratio)),
    '--nf-control-pad': px(8 * ornament), '--nf-badge-pad': px(4 * ornament),
    '--nf-gallery-compact': px(96 * ratio), '--nf-gallery-medium': px(180 * ratio),
    '--nf-gallery-large': px(280 * ratio), '--nf-line-height': '1.4',
  };
}
