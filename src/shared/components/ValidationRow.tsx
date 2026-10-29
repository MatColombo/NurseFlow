import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Icon } from './Icon';

type Issue = { severity: 'problem'; code: `P${string}` } | { severity: 'warning'; code: `W${string}` };
export function ValidationRow({ severity, code, message, location, onAction }: Issue & {
  message: string; location?: string; onAction(): void;
}) {
  const { t } = useTranslation();
  const action = t(severity === 'problem' ? 'status.fix' : 'status.inspect');
  return (
    <div className={`nf-validation nf-tone--${severity}`}>
      <p className="nf-row"><Icon name={severity} /><strong>{t(`status.${severity}`)} · {code}</strong></p>
      <p>{message}</p>{location && <p className="nf-note">{location}</p>}
      <Button onClick={onAction} aria-label={`${action} · ${code}${location ? ` · ${location}` : ''}`}>{action}</Button>
    </div>
  );
}
