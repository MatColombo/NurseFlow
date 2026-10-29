import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { Badge, Button, Card, Dialog, GalleryFrame, Icon, List, ListItem, Search, Sheet, ValidationRow } from './index';

function ui(children: React.ReactNode, locale: 'it' | 'en' = 'it') {
  return render(<I18nextProvider i18n={createUiI18n(locale)}>{children}</I18nextProvider>);
}

describe('Componenti semantici e accessibili', () => {
  it('mantiene nomi, descrizioni disabled, lista e testo escaped', () => {
    ui(<Card><Button icon="check">Azione</Button><Button aria-label="Chiudi" icon="close" />
      <Button disabled disabledReason="Nessuna selezione">Continua</Button>
      <Icon name="procedure" label="Procedura" /><Icon name="warning" />
      <List aria-label="Elementi"><ListItem>{'<script>alert(1)</script>'}</ListItem></List></Card>);
    expect(screen.getByRole('button', { name: 'Azione' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Chiudi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continua' })).toHaveAccessibleDescription('Nessuna selezione');
    expect(screen.getByRole('img', { name: 'Procedura' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('list', { name: 'Elementi' })).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
  it.each(['it', 'en'] as const)('Search ha label e cancella la ricerca in %s', (locale) => {
    function Harness() { const [value, onChange] = useState('Testo'); return <Search value={value} onChange={onChange} />; }
    ui(<Harness />, locale);
    const input = screen.getByRole('searchbox', { name: locale === 'it' ? 'Cerca' : 'Search' });
    fireEvent.change(input, { target: { value: 'Altro' } });
    expect(input).toHaveValue('Altro');
    fireEvent.click(screen.getByRole('button', { name: locale === 'it' ? 'Cancella ricerca' : 'Clear search' }));
    expect(input).toHaveValue('');
  });
  it('status e validation distinguono Problem e Warning senza dipendere dal colore', () => {
    const fix = vi.fn(); const inspect = vi.fn();
    ui(<><Badge status="draft" /><Badge status="ready" /><Badge status="saved" />
      <ValidationRow severity="problem" code="P02" message="Non collegato" location="A" onAction={fix} />
      <ValidationRow severity="warning" code="W08" message="Percorso non disponibile" onAction={inspect} /></>);
    expect(screen.getByText('Bozza')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Problema · P02')).toBeInTheDocument();
    expect(screen.getByText('Avviso · W08')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Correggi · P02 · A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Esamina · W08' }));
    expect(fix).toHaveBeenCalledOnce(); expect(inspect).toHaveBeenCalledOnce();
  });
  it('gallerie indipendenti, vuote collassate e W07 esplicito', () => {
    const { container } = ui(<><GalleryFrame slot="before-note" layout="full-width" imageSpace="compact" />
      <GalleryFrame slot="after-note" layout="side-by-side" imageSpace="natural" unavailable /></>);
    expect(screen.queryByRole('region', { name: 'Prima della nota' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Dopo la nota' })).toHaveTextContent('Immagine non disponibile');
    expect(container.querySelector('img')).toBeNull();
  });
  it.each([Dialog, Sheet])('overlay ha nome/descrizione, annulla e ripristina il focus', (Overlay) => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><Button onClick={() => setOpen(true)}>Apri</Button><Overlay open={open} title="Scelta" description="Descrizione"
        onClose={() => setOpen(false)}><p>Contenuto</p></Overlay></>;
    }
    ui(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Apri' });
    trigger.focus(); fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Scelta' });
    expect(dialog).toHaveAccessibleDescription('Descrizione');
    expect(screen.getByRole('heading', { name: 'Scelta' })).toHaveFocus();
    fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
  });
});
