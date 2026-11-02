import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@app/appearance-context';
import { AppearanceSaveError } from '@app/AppearanceSaveError';
import { Button, Card, List, ListItem, Sheet } from '@shared/components';

/** The same global appearance controls are used by Settings and the development showcase. */
export function AppearanceSettings() {
  const { preferences, update } = useAppearance();
  const { t } = useTranslation();
  const [picker, setPicker] = useState<'locale' | 'theme' | 'uiScalePt' | null>(null);
  const scaleId = useId();
  const radioName = useId();
  const titles = { locale: t('appearance.language'), theme: t('appearance.theme'), uiScalePt: t('appearance.scale') };
  const values = { locale: preferences.locale === 'it' ? 'Italiano' : 'English',
    theme: t(`appearance.${preferences.theme}`), uiScalePt: t('appearance.points', { value: preferences.uiScalePt }) };
  return (
    <Card><div className="nf-stack">
      <h3>{t('appearance.interface')}</h3>
      <List>{(['locale', 'uiScalePt', 'theme'] as const).map((key) => <ListItem key={key}>
        <Button className="nf-preference" onClick={() => setPicker(key)} aria-haspopup="dialog" aria-label={`${titles[key]} ${values[key]}`}>
          <span>{titles[key]}</span><span>{values[key]} <span aria-hidden="true">›</span></span>
        </Button>
      </ListItem>)}</List>
      <Button onClick={() => update({ uiScalePt: 13 })}>{t('appearance.reset')}</Button>
      <Sheet open={picker !== null} title={picker ? titles[picker] : ''} onClose={() => setPicker(null)}>
        <AppearanceSaveError />
        {picker === 'uiScalePt' && <div className="nf-stack">
          <label htmlFor={scaleId}>{t('appearance.scale')} · <output htmlFor={scaleId}>{values.uiScalePt}</output></label>
          <input id={scaleId} type="range" min={4} max={48} step={1} value={preferences.uiScalePt}
            aria-label={t('appearance.scale')} aria-valuetext={values.uiScalePt} onChange={(event) => update({ uiScalePt: event.currentTarget.valueAsNumber })} />
          {preferences.uiScalePt < 9 && <p className="nf-note">{t('appearance.small')}</p>}
          <Button onClick={() => update({ uiScalePt: 13 })}>{t('appearance.reset')}</Button>
        </div>}
        {picker === 'locale' && <fieldset><legend>{titles.locale}</legend>{(['it', 'en'] as const).map((locale) =>
          <label className="nf-choice" key={locale}><input type="radio" name={radioName} checked={preferences.locale === locale}
            onChange={() => update({ locale })} />{locale === 'it' ? 'Italiano' : 'English'}</label>)}</fieldset>}
        {picker === 'theme' && <fieldset><legend>{titles.theme}</legend>{(['system', 'light', 'dark'] as const).map((theme) =>
          <label className="nf-choice" key={theme}><input type="radio" name={radioName} checked={preferences.theme === theme}
            onChange={() => update({ theme })} />{t(`appearance.${theme}`)}</label>)}</fieldset>}
      </Sheet>
    </div></Card>
  );
}
