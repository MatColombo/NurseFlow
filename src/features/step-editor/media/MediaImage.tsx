import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { stepMediaSchema, type StepMedia } from '@domain/model';
import { Button } from '@shared/components';
import { mediaService } from './service';
import { remotePhoto } from './images';
import { MediaAssetContext } from './asset-context';
import './media.css';

export function MediaImage({ item, allowRemote = true, onInspect }: { item: StepMedia; allowRemote?: boolean; onInspect?: (item: StepMedia) => void }) {
  const { t } = useTranslation(); const assetReader = useContext(MediaAssetContext); const [state, setState] = useState<{ url: string; failed: boolean; key: string }>({ url: '', failed: false, key: '' });
  const [attempt, setAttempt] = useState(0); const source = item.source; const key = JSON.stringify(source);
  useEffect(() => {
    let active = true; let objectUrl = ''; const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10_000);
    const load = async () => {
      const resolved = stepMediaSchema.shape.source.parse(JSON.parse(key));
      const blob = resolved.kind === 'local' ? (await (assetReader ?? mediaService.asset)(resolved.assetId))?.blob : allowRemote ? await remotePhoto(resolved.httpsUrl, controller.signal) : undefined;
      if (!active) return; if (!blob) throw new Error('image-format');
      objectUrl = URL.createObjectURL(blob); setState({ key, url: objectUrl, failed: false });
    };
    void load().catch(() => { if (active) setState({ key, url: '', failed: true }); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [key, allowRemote, attempt, assetReader]);
  const unavailable = state.key === key && state.failed;
  return <figure className="nf-media-figure" data-media-id={item.id}>
    {unavailable ? <div className="nf-unavailable"><span>{source.kind === 'local' ? 'W07 · ' : ''}{t('status.unavailable')}</span>
      <Button onClick={() => setAttempt((value) => value + 1)}>{t('common.retry')}</Button></div> : state.key === key && state.url ?
      <button type="button" className="nf-media-zoom" aria-label={t('media.zoom') + ': ' + (item.altText || item.caption || t('media.image'))} disabled={!onInspect} onClick={() => onInspect?.(item)}>
        <img src={state.url} alt={item.altText ?? ''} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setState({ key, url: '', failed: true })} /></button> : <span className="nf-meta" role="status">{t('common.loading')}</span>}
    {item.caption && <figcaption>{item.caption}</figcaption>}
  </figure>;
}
