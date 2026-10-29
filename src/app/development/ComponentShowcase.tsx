import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppearanceSettings } from '@features/settings/AppearanceSettings';
import { Badge, Button, Card, Dialog, GalleryFrame, Icon, List, ListItem, Search, Sheet, ValidationRow } from '@shared/components';

/** Development only. Neutral fixture text, no data writes except real appearance preferences. */
export default function ComponentShowcase() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('Esempio');
  const [overlay, setOverlay] = useState<'sheet' | 'dialog' | null>(null);
  return <section className="nf-stack" aria-label={t('shell.components')}>
    <h2 className="nf-title">{t('shell.components')}</h2>
    <div className="nf-stack" data-testid="components">
      <Card><div className="nf-stack">
        <h3>Card</h3><p>Esempio non clinico</p><p className="nf-note">Nota dell’autore</p><p className="nf-meta">Metadata</p>
        <div className="nf-row"><Button variant="primary" action icon="check">Button</Button><Button>Button</Button>
          <Button variant="danger">Button</Button><Button disabled disabledReason="Esempio non disponibile">Button</Button></div>
        <div className="nf-row">{(['draft', 'ready', 'saved', 'warning', 'problem'] as const).map((status) => <Badge key={status} status={status} />)}</div>
        <Icon name="procedure" label="Icon" />
        <Search value={search} onChange={setSearch} />
        <List aria-label="List"><ListItem>Elemento A</ListItem><ListItem>Elemento B</ListItem></List>
      </div></Card>
      <GalleryFrame slot="before-note" layout="full-width" imageSpace="compact" unavailable />
      <GalleryFrame slot="after-note" layout="side-by-side" imageSpace="natural">
        <figure><img alt="Campione geometrico locale" width="120" height="60" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAAh0lEQVR4nO3QQQkAIADAQPuXs4Evg9hCYR4swLgx19aFxvODTwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbHUl8MlmA9jGzAAAAAElFTkSuQmCC" /><figcaption className="nf-note">GalleryFrame</figcaption></figure>
      </GalleryFrame>
      <ValidationRow severity="problem" code="P02" message="Esempio non collegato" location="Elemento A" onAction={() => setOverlay('dialog')} />
      <ValidationRow severity="warning" code="W07" message={t('status.unavailable')} onAction={() => setOverlay('sheet')} />
      <div className="nf-row"><Button onClick={() => setOverlay('sheet')}>Sheet</Button><Button onClick={() => setOverlay('dialog')}>Dialog</Button></div>
    </div>
    <Card><h3>{'Elemento'.repeat(20)}</h3><p className="nf-note">{'Nota dell’autore '.repeat(20)}</p></Card>
    <AppearanceSettings />
    <Sheet open={overlay === 'sheet'} title="Sheet" onClose={() => setOverlay(null)}><p>Esempio non clinico</p><Button onClick={() => setOverlay(null)}>{t('common.cancel')}</Button></Sheet>
    <Dialog open={overlay === 'dialog'} title="Dialog" description="Esempio non clinico" onClose={() => setOverlay(null)}>
      <p>{'Elemento molto lungo '.repeat(12)}</p><Button onClick={() => setOverlay(null)}>{t('common.cancel')}</Button>
    </Dialog>
  </section>;
}
