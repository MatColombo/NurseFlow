import { expect, it } from 'vitest';
import { createUiI18n } from './index';
import { resources } from './resources';

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, nested]: [string, unknown]) => typeof nested === 'object' && nested !== null
    ? keys(nested, `${prefix}${key}.`) : [`${prefix}${key}`]);
}
it('cataloghi offline completi e con le stesse chiavi IT/EN', async () => {
  expect(keys(resources.it)).toEqual(keys(resources.en));
  const i18n = createUiI18n();
  expect(i18n.isInitialized).toBe(true);
  expect(i18n.t('appearance.reset')).toBe('Ripristina 13 pt');
  await i18n.changeLanguage('en');
  expect(i18n.t('appearance.reset')).toBe('Reset to 13 pt');
  const authored = '<b>Testo dell’autore</b>';
  expect(i18n.t('shell.pending', { page: authored })).toContain(authored);
  expect(i18n.options.backend).toBeUndefined();
});
