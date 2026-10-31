import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MediaAsset, Settings, StepMedia } from '@domain/model';
import { effectiveMediaLimit, type EditableStep, type StepEdit } from '@domain/editor/edits';
import { Button } from '@shared/components';
import { MediaImage } from './MediaImage';
import { mediaService } from './service';
function LocalInfo({ id }: { id: string }) {
  const { t } = useTranslation(); const [info, setInfo] = useState<Pick<MediaAsset, 'width' | 'height' | 'bytes'> | null>(null);
  useEffect(() => { let active = true; void mediaService.asset(id).then((asset) => { if (active && asset) setInfo({ width: asset.width, height: asset.height, bytes: asset.bytes }); }, () => {}); return () => { active = false; }; }, [id]);
  return info && <p className="nf-meta">{t('media.result', info)}</p>;
}
export function MediaEditor({ node, settings, busy, change, edit, source }: {
  node: Extract<EditableStep, { media: StepMedia[] }>; settings: Settings; busy: boolean; change(value: StepEdit): void; edit(value: StepEdit): void;
  source(mode: 'photo' | 'url' | 'recompress', slot: StepMedia['slot'], existing?: StepMedia): void;
}) {
  const { t } = useTranslation(); const limit = effectiveMediaLimit(settings); const blocked = node.media.length >= Math.min(32, limit);
  return <details className="nf-card nf-stack nf-editor-section" open={node.media.length > 0}><summary>{t('media.title', { count: node.media.length })}</summary>
    {(['before-note', 'after-note'] as const).map((slot) => {
      const items = node.media.filter((item) => item.slot === slot).sort((a, b) => a.order - b.order);
      const style = node.galleries[slot === 'before-note' ? 'beforeNote' : 'afterNote'];
      return <section key={slot} className="nf-stack" aria-label={t(slot === 'before-note' ? 'media.before' : 'media.after')} data-editor-gallery={slot}>
        <h3>{t(slot === 'before-note' ? 'media.before' : 'media.after')} ({items.length})</h3>
        <div className="nf-row"><Button disabled={busy || blocked} disabledReason={t('media.limit', { count: Math.min(32, limit) })} onClick={() => source('photo', slot)}>{t('media.addPhoto')}</Button>
          <Button disabled={busy || blocked} disabledReason={t('media.limit', { count: Math.min(32, limit) })} onClick={() => source('url', slot)}>{t('media.addUrl')}</Button></div>
        <label className="nf-stack">{t('media.layout')}<select value={style.layout} disabled={busy} onChange={(event) => edit({ type: 'gallery', slot, style: { ...style, layout: event.target.value as typeof style.layout } })}>
          {(['stacked-thumbnails', 'side-by-side', 'full-width'] as const).map((value, index) => <option key={value} value={value}>{t('media.' + ['stacked', 'side', 'full'][index])}</option>)}</select></label>
        <label className="nf-stack">{t('media.space')}<select value={style.imageSpace} disabled={busy} onChange={(event) => edit({ type: 'gallery', slot, style: { ...style, imageSpace: event.target.value as typeof style.imageSpace } })}>
          {(['compact', 'medium', 'large', 'natural'] as const).map((value) => <option key={value} value={value}>{t('media.' + value)}</option>)}</select></label>
        <ol className="nf-list nf-stack">{items.map((item, index) => <li className="nf-stack nf-card" key={item.id} data-media-row={item.id}>
          <MediaImage item={item} /><span className="nf-meta">{t(item.source.kind === 'local' ? 'media.local' : 'media.linked')}</span>{item.source.kind === 'local' && <LocalInfo id={item.source.assetId} />}
          <label className="nf-stack">{t('media.caption')}<input value={item.caption ?? ''} onChange={(event) => change({ type: 'media-text', id: item.id, caption: event.target.value, altText: item.altText ?? '' })} /></label>
          <label className="nf-stack">{t('media.alt')}<input value={item.altText ?? ''} onChange={(event) => change({ type: 'media-text', id: item.id, caption: item.caption ?? '', altText: event.target.value })} /></label>
          <div className="nf-row"><Button disabled={busy || index === 0} disabledReason={t('builder.boundary')} onClick={() => edit({ type: 'reorder-media', id: item.id, delta: -1 })}>{t('library.up')}</Button>
            <Button disabled={busy || index === items.length - 1} disabledReason={t('builder.boundary')} onClick={() => edit({ type: 'reorder-media', id: item.id, delta: 1 })}>{t('library.down')}</Button>
            <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => edit({ type: 'move-media', id: item.id, slot: slot === 'before-note' ? 'after-note' : 'before-note' })}>{t(slot === 'before-note' ? 'media.moveAfter' : 'media.moveBefore')}</Button></div>
          <div className="nf-row"><Button disabled={busy} disabledReason={t('common.loading')} onClick={() => source(item.source.kind === 'local' ? 'photo' : 'url', slot, item)}>{t('media.replace')}</Button>
            {item.source.kind === 'local' && <Button disabled={busy} disabledReason={t('common.loading')} onClick={() => source('recompress', slot, item)}>{t('media.recompress')}</Button>}
            <Button variant="danger" disabled={busy} disabledReason={t('common.loading')} onClick={() => edit({ type: 'remove-media', id: item.id })}>{t('media.remove')}</Button></div>
        </li>)}</ol>
      </section>;
    })}
  </details>;
}
