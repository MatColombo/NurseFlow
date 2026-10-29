import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';

export function Search({ value, onChange, label }: { value: string; onChange(value: string): void; label?: string }) {
  const id = useId();
  const { t } = useTranslation();
  return (
    <div className="nf-stack" role="search" aria-label={label ?? t('common.search')}>
      <label htmlFor={id}>{label ?? t('common.search')}</label>
      <div className="nf-search">
        <Icon name="search" /><input id={id} type="search" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
        {value && <Button icon="close" aria-label={t('common.clearSearch')} onClick={() => onChange('')} />}
      </div>
    </div>
  );
}
