import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { GalleryStyle } from '@domain/model';
import { Icon } from './Icon';

/** Presentation only: no fetching or mutations. Empty galleries collapse. */
export function GalleryFrame({ slot, layout, imageSpace, children, unavailable = false }: GalleryStyle & {
  slot: 'before-note' | 'after-note'; children?: ReactNode; unavailable?: boolean;
}) {
  const { t } = useTranslation();
  if (!children && !unavailable) return null;
  return (
    <section className={`nf-gallery nf-gallery--${layout} nf-gallery--${imageSpace}`}
      aria-label={t(slot === 'before-note' ? 'gallery.before' : 'gallery.after')}>
      {unavailable && <div className="nf-unavailable"><Icon name="image" /><span>{t('status.unavailable')}</span></div>}{children}
    </section>
  );
}
