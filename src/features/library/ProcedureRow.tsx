import { useTranslation } from 'react-i18next';
import type { Procedure } from '@domain/model';
import { Button, Icon } from '@shared/components';
import type { IconName } from '@shared/components/Icon';

const colors = ['neutral', 'primary', 'blue', 'purple', 'amber'] as const;
const icons: IconName[] = ['procedure', 'ready', 'draft', 'info', 'image'];
export function Identity({ procedure }: { procedure: Procedure }) {
  const color = colors.find((key) => key === procedure.ribbon.colorKey) ?? 'neutral';
  const icon = icons.find((key) => key === procedure.ribbon.iconKey) ?? 'procedure';
  return <span className={`nf-identity nf-identity--${color}`} aria-hidden="true"><Icon name={icon} /></span>;
}
export function ProcedureRow({ procedure, group, onOpen, onFavorite, recent = false }: {
  procedure: Procedure; group?: string; onOpen(): void; onFavorite?(): void; recent?: boolean;
}) {
  const { t, i18n } = useTranslation();
  return <li className="nf-procedure-row" data-procedure-id={procedure.id}>
    <button type="button" className="nf-procedure-open" aria-label={procedure.title} onClick={onOpen}>
      <Identity procedure={procedure} /><span className="nf-procedure-copy"><span className="nf-procedure-title">{procedure.title}</span>
        <span className="nf-meta">{procedure.readyRevisionId ? t('status.ready') : t('status.draft')}
          {procedure.readyRevisionId && procedure.workingDraftId ? ` · ${t('status.draft')}` : ''}
          {group ? ` · ${group}` : ''}{procedure.tags[0] ? ` · ${procedure.tags[0]}` : ''}
          {procedure.tags.length > 1 ? ` +${procedure.tags.length - 1}` : ''}</span>
        {recent && procedure.lastOpenedAt && <span className="nf-meta">{t('library.opened', {
          date: new Date(procedure.lastOpenedAt).toLocaleString(i18n.language),
        })}</span>}
      </span><span className="nf-priority" aria-label={t('library.priorityLabel', { value: procedure.priority })}>
        <span aria-hidden="true">{'!'.repeat(procedure.priority)}</span></span>
    </button>
    {onFavorite && <Button className="nf-favorite" aria-label={t(procedure.favorite ? 'library.unfavorite' : 'library.favorite', { title: procedure.title })}
      aria-pressed={procedure.favorite} onClick={onFavorite}>{procedure.favorite ? '★' : '☆'}</Button>}
  </li>;
}
