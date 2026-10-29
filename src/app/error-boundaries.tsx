import { Component, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '@shared/components';

function ErrorFallback({ onRetry }: { onRetry(): void }) {
  const { t } = useTranslation();
  return <Card><div className="nf-stack" role="alert">
    <h2>{t('error.title')}</h2><p>{t('error.message')}</p>
    <Button onClick={onRetry}>{t('common.retry')}</Button><a href="#/library">{t('common.library')}</a>
  </div></Card>;
}

export class ErrorBoundary extends Component<PropsWithChildren<{ resetKey?: string }>, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidUpdate(previous: Readonly<PropsWithChildren<{ resetKey?: string }>>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  override render() {
    return this.state.failed ? <ErrorFallback onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}
