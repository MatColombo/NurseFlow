import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Group } from '@domain/model';
import { Button, Sheet } from '@shared/components';
import { GroupDialogs } from '@features/library/GroupDialogs';
import { procedureService } from './service';

export function GroupPicker({ open, onClose, groups, selected, onSelect, onGroups }: {
  open: boolean; onClose(): void; groups: Group[]; selected: string | null; onSelect(id: string | null): void; onGroups(groups: Group[]): void;
}) {
  const { t } = useTranslation(); const [creating, setCreating] = useState(false);
  return createPortal(<><Sheet open={open && !creating} title={t('procedure.chooseGroup')} onClose={onClose}>
    {[{ id: null, name: t('library.ungrouped') }, ...groups].map((group) => <Button key={group.id ?? 'ungrouped'}
      aria-pressed={selected === group.id} onClick={() => { onSelect(group.id); onClose(); }}>{group.name}{selected === group.id ? ' ✓' : ''}</Button>)}
    <Button onClick={() => setCreating(true)}>{t('library.createGroup')}</Button>
  </Sheet>{creating && <GroupDialogs dialog={{ kind: 'create' }} groups={groups} procedures={[]} onClose={() => setCreating(false)}
    onSaved={async (id) => { const choices = await procedureService.choices(); onGroups(choices.groups);
      if (id) { onSelect(id); onClose(); }
    }} />}</>, document.body);
}
