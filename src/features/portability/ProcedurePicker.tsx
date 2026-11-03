import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeSelection, repeatedTitle, type Candidate, type PortableFilters } from '@domain/portability/selection';
import type { Procedure } from '@domain/model';
import { normalize } from '@domain/library';
import { Button, Search, Sheet } from '@shared/components';
import { Identity } from '@features/library/ProcedureRow';
export function ProcedurePicker({ items, visible, filters, changeFilters, selected, select, preview, local }: {
  items: readonly Candidate[]; visible: readonly Candidate[]; filters: PortableFilters; changeFilters(value: PortableFilters): void;
  selected: ReadonlySet<string>; select(value: Set<string>): void; preview(item: Candidate): void; local: readonly Procedure[];
}) {
  const { t } = useTranslation(); const [picker, setPicker] = useState<'group' | 'tag' | null>(null); const [query, setQuery] = useState('');
  const groups = [...new Map(items.map((item) => [item.groupKey, { id: item.groupKey, name: item.group?.name ?? t('library.ungrouped'), source: item.source }])).values()];
  const tags = [...new Set(items.flatMap((item) => item.procedure.tags))].sort();
  const choices = picker === 'group' ? groups : tags.map((tag) => ({ id: tag, name: tag, source: '' })); const shown = new Set(visible.map((item) => item.key));
  const count = items.filter((item) => selected.has(item.key)).length;
  return <section className="nf-stack" aria-label={t('portable.choose')}>
    <h2>{t('portable.choose')}</h2><Search label={t('portable.search')} value={filters.search} onChange={(search) => changeFilters({ ...filters, search })} />
    <div className="nf-row">{(['group', 'tag'] as const).map((kind) => <Button key={kind} onClick={() => { setQuery(''); setPicker(kind); }}>
      {t('portable.' + kind)} · {kind === 'group' ? groups.find((group) => group.id === filters.group)?.name ?? t('portable.all') : filters.tag || t('portable.all')}</Button>)}
      <Button onClick={() => changeFilters({ search: '', group: '', tag: '' })}>{t('library.clearFilters')}</Button></div>
    <p role="status">{t('portable.selectedVisible', { selected: count, visible: visible.length })}</p>
    <div className="nf-row"><Button disabled={!visible.length} disabledReason={t('portable.noResults')} onClick={() => select(changeSelection(selected, visible.map((item) => item.key), true))}>{t('portable.selectVisible')}</Button>
      <Button disabled={!visible.length} disabledReason={t('portable.noResults')} onClick={() => select(changeSelection(selected, visible.map((item) => item.key), false))}>{t('portable.deselectVisible')}</Button>
      <Button disabled={!count} disabledReason={t('portable.noSelection')} onClick={() => select(new Set())}>{t('portable.clearSelection')}</Button></div>
    {!visible.length && <p>{t(items.length ? 'portable.noResults' : 'portable.empty')}</p>}
    {groups.filter((group) => !filters.group || filters.group === group.id).map((group) => {
      const members = items.filter((item) => item.groupKey === group.id); const rows = members.filter((item) => shown.has(item.key)); const all = members.every((item) => selected.has(item.key));
      return <section key={group.id} className="nf-stack nf-card" data-portable-group={group.id}>
        <h3>{group.name}</h3>{group.source && <p className="nf-meta">{group.source}</p>}
        <Button aria-label={t(all ? 'portable.deselectGroupNamed' : 'portable.selectGroupNamed', { name: group.name })} onClick={() => select(changeSelection(selected, members.map((item) => item.key), !all))}>
          {t(all ? 'portable.deselectGroup' : 'portable.selectGroup')} · {members.length}</Button>
        <p className="nf-meta">{t('portable.groupCount', { visible: rows.length, total: members.length })}</p>
        <ul className="nf-list nf-stack">{rows.map((item) => {
          const duplicate = item.source ? repeatedTitle(item, items, local) : { local: false, batch: false };
          return <li className="nf-portable-row nf-stack" key={item.key} data-procedure-key={item.key}>
            <label className="nf-choice"><input type="checkbox" checked={selected.has(item.key)} onChange={(event) => select(changeSelection(selected, [item.key], event.target.checked))} />
              <span><strong>{item.procedure.title}</strong><Identity procedure={item.procedure} /></span></label>
            <p className="nf-meta">{item.procedure.readyRevisionId && 'Ready'}{item.procedure.readyRevisionId && item.procedure.workingDraftId && ' + '}{item.procedure.workingDraftId && t('status.draft')}{item.procedure.archived && <> · {t('procedure.archived')}</>}</p>
            {item.source && <p className="nf-meta">{item.source}</p>}
            {item.procedure.tags.length > 0 && <p className="nf-meta">{item.procedure.tags.join(' · ')}</p>}
            {duplicate.local && <p className="nf-note">{t('portable.duplicateLocal')}</p>}{duplicate.batch && <p className="nf-note">{t('portable.duplicateBatch')}</p>}
            {item.warnings.length > 0 && <p className="nf-note">{[...new Set(item.warnings.map((issue) => issue.code))].join(' · ')}</p>}
            <Button purpose="preview" aria-label={t('portable.previewNamed', { title: item.procedure.title })} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); preview(item); }}>{t('portable.preview')}</Button>
          </li>;
        })}</ul>
      </section>;
    })}
    <Sheet open={picker !== null} title={t('portable.' + (picker ?? 'group'))} onClose={() => setPicker(null)}>
      <Search label={t('portable.searchFilter')} value={query} onChange={setQuery} />
      <Button onClick={() => { changeFilters({ ...filters, [picker!]: '' }); setPicker(null); }}>{t('portable.all')}</Button>
      {choices.filter((choice) => normalize(choice.name + ' ' + choice.source).includes(normalize(query))).map((choice) => <Button key={choice.id} aria-pressed={filters[picker!] === choice.id}
        onClick={() => { changeFilters({ ...filters, [picker!]: choice.id }); setPicker(null); }}>{choice.name}{choice.source && <small className="nf-meta"> · {choice.source}</small>}</Button>)}
    </Sheet>
  </section>;
}
