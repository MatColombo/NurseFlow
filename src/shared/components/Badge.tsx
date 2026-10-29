import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';

const statusIcons: Record<Status, IconName> = {
  draft: 'draft', ready: 'ready', saved: 'check', problem: 'problem', warning: 'warning',
};
type Status = 'draft' | 'ready' | 'saved' | 'problem' | 'warning';

export function Badge({ status }: { status: Status }) {
  const { t } = useTranslation();
  return <span className={`nf-badge nf-tone--${status}`}><Icon name={statusIcons[status]} />{t(`status.${status}`)}</span>;
}
