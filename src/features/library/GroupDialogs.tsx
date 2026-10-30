import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group, Procedure } from '@domain/model';
import { groupNameKey } from '@domain/library';
import { Button, Dialog } from '@shared/components';
import { libraryService } from './service';

export type GroupDialog = { kind: 'create' } | { kind: 'rename' | 'delete' | 'menu'; group: Group };
export function GroupDialogs({ dialog, groups, procedures, onClose, onSaved }: {
  dialog: GroupDialog; groups: Group[]; procedures: Procedure[]; onClose(): void; onSaved(id?: string): Promise<void>;
}) {
  const { t } = useTranslation(); const [name, setName] = useState(dialog.kind === 'rename' ? dialog.group.name : '');
  const [error, setError] = useState(false); const [busy, setBusy] = useState(false); const input = useRef<HTMLInputElement>(null);
  const form = dialog.kind === 'create' || dialog.kind === 'rename';
  useEffect(() => { if (form) input.current?.focus(); }, [form]);
  const duplicate = groups.some((group) => (dialog.kind === 'create' || group.id !== dialog.group.id) && groupNameKey(group.name) === groupNameKey(name));
  async function perform(operation: () => Promise<string | void>, focusId?: string) {
    setBusy(true); setError(false);
    try { const id = await operation(); await onSaved(focusId ?? id ?? undefined); onClose(); }
    catch { setError(true); } finally { setBusy(false); }
  }
  if (dialog.kind === 'menu') {
    const index = groups.findIndex((group) => group.id === dialog.group.id);
    // Menu selection is handled by the parent, keeping one native modal open at a time.
    return <GroupMenu group={dialog.group} groups={groups} procedures={procedures} index={index} count={groups.length} onClose={onClose} onSaved={onSaved} />;
  }
  const members = dialog.kind === 'delete' ? procedures.filter((procedure) => procedure.groupId === dialog.group.id).length : 0;
  return <Dialog open title={t(dialog.kind === 'create' ? 'library.createGroup' : dialog.kind === 'rename' ? 'library.rename' : 'library.deleteGroup')} onClose={onClose}>
    {form ? <form className="nf-stack" onSubmit={(event) => {
      event.preventDefault(); if (!name.trim() || duplicate || busy) return;
      void perform(async () => { const group = await libraryService.saveGroup({ name, ...(dialog.kind === 'rename' ? { id: dialog.group.id } : {}) });
        return group.id; });
    }}><label className="nf-stack">{t('library.groupName')}<input ref={input} value={name} onChange={(event) => setName(event.target.value)} /></label>
      {duplicate && <p role="alert">{t('library.duplicate')}</p>}{error && <p role="alert">{t('library.saveError')}</p>}
      <div className="nf-row"><Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={!name.trim() || duplicate || busy} disabledReason={t('library.groupName')}>
          {error ? t('common.retry') : t(dialog.kind === 'create' ? 'library.create' : 'library.save')}</Button></div></form> : <>
      <p>{t('library.deletePrompt', { name: dialog.group.name })}</p>{members > 0 && <p>{t('library.moveMembers', { count: members })}</p>}
      {error && <p role="alert">{t('library.saveError')}</p>}<div className="nf-row"><Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="danger" disabled={busy} disabledReason={t('common.loading')}
          onClick={() => { void perform(() => libraryService.deleteGroup(dialog.group.id)); }}>{error ? t('common.retry') : t('library.deleteGroup')}</Button></div>
    </>}
  </Dialog>;
}

function GroupMenu({ group, groups, procedures, index, count, onClose, onSaved }: {
  group: Group; groups: Group[]; procedures: Procedure[]; index: number; count: number; onClose(): void; onSaved(id?: string): Promise<void>;
}) {
  const { t } = useTranslation(); const [next, setNext] = useState<'rename' | 'delete' | null>(null);
  const [error, setError] = useState(false);
  if (next) return <GroupDialogs dialog={{ kind: next, group }} groups={groups} procedures={procedures} onClose={onClose} onSaved={onSaved} />;
  return <Dialog open title={t('library.groupMore', { name: group.name })} onClose={onClose}>
    {error && <p role="alert">{t('library.saveError')}</p>}
    <Button onClick={() => setNext('rename')}>{t('library.rename')}</Button>
    {([-1, 1] as const).map((direction) => <Button key={direction} disabled={direction === -1 ? index === 0 : index === count - 1}
      disabledReason={t(direction === -1 ? 'library.up' : 'library.down')} onClick={() => {
        void libraryService.moveGroup(group.id, direction).then(() => onSaved(group.id)).then(onClose, () => setError(true));
      }}>{t(direction === -1 ? 'library.up' : 'library.down')}</Button>)}
    <Button variant="danger" onClick={() => setNext('delete')}>{t('library.deleteGroup')}</Button>
  </Dialog>;
}
