import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { Group } from '@domain/model';
import { defaultFilters, normalize, type LibraryFilters } from '@domain/library';
import { Button, Search, Sheet } from '@shared/components';

export function FiltersSheet({ open, onClose, filters, onChange, groups, tags }: {
  open: boolean; onClose(): void; filters: LibraryFilters; onChange(filters: LibraryFilters): void; groups: Group[]; tags: string[];
}) {
  const { t } = useTranslation();
  const [tagQuery, setTagQuery] = useState('');
  function toggle(key: 'groupIds' | 'tags', value: string) {
    const values = filters[key]; const matches = (item: string) => key === 'tags' ? normalize(item) === normalize(value) : item === value;
    onChange({ ...filters, [key]: values.some(matches) ? values.filter((item) => !matches(item)) : [...values, value] });
  }
  return <Sheet open={open} title={t('library.filters')} onClose={onClose}>
    <fieldset><legend>{t('library.group')}</legend>{[{ id: 'ungrouped', name: t('library.ungrouped') }, ...groups].map((group) =>
      <label className="nf-choice" key={group.id}><input type="checkbox" checked={filters.groupIds.includes(group.id)}
        onChange={() => toggle('groupIds', group.id)} />{group.name}</label>)}</fieldset>
    <fieldset><legend>{t('library.tags')}</legend><Search label={t('library.searchTags')} value={tagQuery} onChange={setTagQuery} />
      {tags.filter((tag) => normalize(tag).includes(normalize(tagQuery))).map((tag) => <label className="nf-choice" key={normalize(tag)}>
      <input type="checkbox" checked={filters.tags.some((value) => normalize(value) === normalize(tag))} onChange={() => toggle('tags', tag)} />{tag}</label>)}</fieldset>
    <fieldset><legend>{t('library.priority')}</legend><div className="nf-row nf-segments" role="radiogroup" aria-label={t('library.priority')}>
      {(['any', '0', '1', '2', 'high'] as const).map((value) => <label className="nf-choice" key={value}>
        <input type="radio" name="library-priority" checked={filters.priority === value}
          aria-label={value === 'any' ? t('library.any') : value === 'high' ? t('library.highPriority') : t('library.priorityLabel', { value })}
          onChange={() => onChange({ ...filters, priority: value })} />
        {value === 'any' ? t('library.any') : value === 'high' ? '≥!' : value === '0' ? '0' : '!'.repeat(Number(value))}
      </label>)}</div></fieldset>
    <fieldset><legend>{t('library.status')}</legend><div className="nf-row nf-segments" role="radiogroup" aria-label={t('library.status')}>
      {(['all', 'ready', 'draft'] as const).map((status) => <label className="nf-choice" key={status}>
        <input type="radio" name="library-status" checked={filters.status === status} onChange={() => onChange({ ...filters, status })} />
        {t(`library.${status}`)}</label>)}</div></fieldset>
    <label className="nf-choice"><input type="checkbox" checked={filters.includeSteps}
      onChange={(event) => onChange({ ...filters, includeSteps: event.target.checked })} />{t('library.includeSteps')}</label>
    <div className="nf-row"><Button onClick={() => { setTagQuery(''); onChange(defaultFilters()); }}>{t('library.reset')}</Button>
      <Button variant="primary" onClick={onClose}>{t('library.done')}</Button></div>
  </Sheet>;
}
