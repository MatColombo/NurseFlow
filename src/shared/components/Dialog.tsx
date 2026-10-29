import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface DialogProps {
  open: boolean; title: string; description?: string; children: ReactNode; onClose(): void;
}

function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab' || (event.target instanceof Element && event.target.closest('dialog') !== event.currentTarget)) return;
  const candidates = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')]
    .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0
      && getComputedStyle(element).visibility !== 'hidden');
  const stops = candidates.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
    const group = candidates.filter((candidate): candidate is HTMLInputElement =>
      candidate instanceof HTMLInputElement && candidate.type === 'radio' && candidate.name === element.name);
    return element === (group.find((radio) => radio.checked) ?? group[0]);
  }).sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
  const active = document.activeElement;
  const first = stops[0]; const last = stops.at(-1);
  if (!first || !last) { event.preventDefault(); event.currentTarget.focus(); return; }
  if (event.shiftKey ? active === first || !stops.includes(active as HTMLElement) : active === last || !stops.includes(active as HTMLElement)) {
    event.preventDefault(); (event.shiftKey ? last : first).focus();
  }
}

/** Native modal provides inert background, focus containment and Escape. */
export function Dialog({ open, title, description, children, onClose, sheet = false }: DialogProps & { sheet?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { t } = useTranslation();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);
  return (
    <dialog ref={dialogRef} className={`nf-dialog ${sheet ? 'nf-sheet' : ''}`} aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined} aria-modal="true" onKeyDown={trapTab}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      {open && <div className="nf-stack">
        <header className="nf-row"><h2 ref={titleRef} tabIndex={-1} id={titleId} className="nf-title">{title}</h2>
          <Button icon="close" onClick={onClose}>{t('common.close')}</Button></header>
        {description && <p id={descriptionId}>{description}</p>}{children}
      </div>}
    </dialog>
  );
}
