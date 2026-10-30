import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group } from '@domain/model';
import { ribbonColors, ribbonIcons, type ProcedureMetadata } from '@domain/procedures';
import { Button, Icon } from '@shared/components';
import { GroupPicker } from './GroupPicker';
import { LabelInput } from './LabelInput';

export function MetadataFields({ value, onChange, groups, onGroups, suggestions, optionalCollapsed = false, creating = false }: {
  value: ProcedureMetadata; onChange(value: ProcedureMetadata): void; groups: Group[]; onGroups(groups: Group[]): void;
  suggestions: string[]; optionalCollapsed?: boolean; creating?: boolean;
}) {
  const { t } = useTranslation(); const [picker, setPicker] = useState(false); const [expanded, setExpanded] = useState(!optionalCollapsed);
  const patch = (change: Partial<ProcedureMetadata>) => onChange({ ...value, ...change });
  return <div className="nf-stack">
    <label className="nf-stack">{t('procedure.name')} *<input required maxLength={creating ? 120 : undefined} value={value.title}
      onChange={(event) => patch({ title: event.target.value })} /></label>
    <div className="nf-stack"><span>{t('library.group')}</span><Button aria-label={t('procedure.chooseGroup')}
      onClick={() => setPicker(true)}>{groups.find((group) => group.id === value.groupId)?.name ?? t('library.ungrouped')} ▾</Button></div>
    <LabelInput label={t('library.tags')} values={value.tags} onChange={(tags) => patch({ tags })} suggestions={suggestions} />
    {optionalCollapsed && <Button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{t('procedure.moreDetails')} {expanded ? '▾' : '▸'}</Button>}
    {expanded && <div className="nf-stack">
      <fieldset><legend>{t('procedure.ribbonColor')}</legend><div className="nf-row">{ribbonColors.map((colorKey) => <label key={colorKey} className="nf-choice">
        <input type="radio" name="ribbon-color" checked={value.ribbon.colorKey === colorKey} onChange={() => patch({ ribbon: { ...value.ribbon, colorKey } })} />
        {t(`procedure.colors.${colorKey}`)}</label>)}</div></fieldset>
      <fieldset><legend>{t('procedure.ribbonIcon')}</legend><div className="nf-row">{ribbonIcons.map((iconKey) => <label key={iconKey} className="nf-choice">
        <input type="radio" name="ribbon-icon" checked={value.ribbon.iconKey === iconKey} onChange={() => patch({ ribbon: { ...value.ribbon, iconKey } })} />
        <Icon name={iconKey} />{t(`procedure.icons.${iconKey}`)}</label>)}</div></fieldset>
      <fieldset><legend>{t('library.priority')}</legend><div className="nf-row">{([0, 1, 2] as const).map((priority) => <label key={priority} className="nf-choice">
        <input type="radio" name="procedure-priority" aria-label={t('library.priorityLabel', { value: priority })} checked={value.priority === priority}
          onChange={() => patch({ priority })} />{priority === 0 ? '0' : '!'.repeat(priority)}</label>)}</div></fieldset>
      <LabelInput label={t('procedure.aliases')} values={value.aliases} onChange={(aliases) => patch({ aliases })} addText={t('procedure.addAlias')} />
      <label className="nf-stack">{t('procedure.description')}<textarea aria-label={t('procedure.description')} value={value.description ?? ''} onChange={(event) => patch({ description: event.target.value })} /></label>
    </div>}
    <GroupPicker open={picker} onClose={() => setPicker(false)} groups={groups} selected={value.groupId} onSelect={(groupId) => patch({ groupId })} onGroups={onGroups} />
  </div>;
}
