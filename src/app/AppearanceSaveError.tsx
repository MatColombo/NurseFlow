import { useTranslation } from 'react-i18next';
import { Button, Card } from '@shared/components';
import { useAppearance } from './appearance-context';

export function AppearanceSaveError() {
  const { saveFailed, retry } = useAppearance();
  const { t } = useTranslation();
  return saveFailed ? <Card><p role="alert">{t('appearance.saveError')}</p>
    <Button onClick={retry}>{t('common.retry')}</Button></Card> : null;
}
