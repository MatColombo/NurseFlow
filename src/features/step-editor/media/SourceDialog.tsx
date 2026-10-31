import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { remoteImageUrlSchema, type MediaAsset, type Settings, type StepMedia } from '@domain/model';
import { Button, Sheet } from '@shared/components';
import { preparePhoto } from './images';
import { MediaImage } from './MediaImage';
import { mediaService } from './service';

function BlobPreview({ asset }: { asset: MediaAsset }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => { const next = URL.createObjectURL(asset.blob); const node = image.current; if (node) node.src = next;
    return () => { node?.removeAttribute('src'); URL.revokeObjectURL(next); }; }, [asset]);
  return <img ref={image} className="nf-photo-result" alt="" />;
}
export function SourceDialog({ mode: initialMode, existing, slot, settings, busy, failed, error, save, retry, close }: {
  mode: 'photo' | 'url' | 'recompress'; existing?: StepMedia | undefined; slot: StepMedia['slot']; settings: Settings;
  busy: boolean; failed: boolean; error: string | null; save(item: StepMedia, asset?: MediaAsset): Promise<boolean>; retry(): Promise<boolean>; close(): void;
}) {
  const { t } = useTranslation(); const [mode, setMode] = useState(initialMode); const [file, setFile] = useState<Blob | null>(null); const [prepared, setPrepared] = useState<MediaAsset | null>(null);
  const [preset, setPreset] = useState(settings.photoPreset); const [url, setUrl] = useState(existing?.source.kind === 'remote' ? existing.source.httpsUrl : '');
  const [caption, setCaption] = useState(existing?.caption ?? ''); const [alt, setAlt] = useState(existing?.altText ?? '');
  const [issue, setIssue] = useState<string | null>(null); const [preparing, setPreparing] = useState(false); const [urlPreview, setUrlPreview] = useState<StepMedia | null>(null);
  const generation = useRef(0); const id = useRef(existing?.id ?? crypto.randomUUID());
  useEffect(() => {
    let active = true;
    if (mode === 'recompress' && existing?.source.kind === 'local') void mediaService.asset(existing.source.assetId).then((asset) => { if (active && asset) setFile(asset.blob); else if (active) setIssue(t('status.unavailable')); }, () => { if (active) setIssue(t('status.unavailable')); });
    return () => { active = false; };
  }, [mode, existing, t]);
  useEffect(() => {
    if (!file || mode === 'url') return; const token = ++generation.current; let active = true;
    const frame = requestAnimationFrame(() => { setPreparing(true); setPrepared(null); setIssue(null);
      void preparePhoto(file, preset).then((asset) => { if (active && token === generation.current) setPrepared(asset); }, (reason: unknown) => {
        if (active) setIssue(t(reason instanceof Error && reason.message === 'image-size' ? 'media.sizeError' : 'media.imageError'));
      }).finally(() => { if (active) setPreparing(false); });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [file, preset, mode, t]);
  const validUrl = remoteImageUrlSchema.safeParse(url).success;
  async function submit() {
    if (failed) { if (await retry()) close(); return; }
    const source: StepMedia['source'] | null = mode === 'url' ? validUrl ? { kind: 'remote', httpsUrl: url } : null :
      prepared ? { kind: 'local', assetId: prepared.id, mime: prepared.mime } : null;
    if (!source) return;
    const item: StepMedia = { id: id.current, slot, order: existing?.order ?? 0, caption, altText: alt, source };
    if (await save(item, prepared ?? undefined)) close();
  }
  return <Sheet open title={t(existing ? 'media.replace' : mode === 'url' ? 'media.addUrl' : 'media.addPhoto')} onClose={() => { if (!busy) close(); }}>
    {error && <p role="alert">{error}</p>}{issue && <p role="alert">{issue}</p>}
    <fieldset className="nf-stack nf-metadata-fields" disabled={busy || failed}>
      {existing && initialMode !== 'recompress' && <div className="nf-row"><Button onClick={() => { setMode('photo'); setPrepared(null); }}>{t('media.local')}</Button><Button onClick={() => { setMode('url'); setPrepared(null); setPreparing(false); }}>{t('media.linked')}</Button></div>}
      {mode === 'url' ? <><label className="nf-stack">{t('media.url')}<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} onBlur={() => {
        if (validUrl) setUrlPreview({ id: 'url-preview', slot, order: 0, source: { kind: 'remote', httpsUrl: url } });
      }} aria-invalid={url.length > 0 && !validUrl} /></label><p className="nf-note">{t('media.privacy')}</p>{url && !validUrl && <p>{t('media.urlError')}</p>}
      {urlPreview && <MediaImage item={urlPreview} />}</> : <>
        {mode === 'photo' && <label className="nf-stack">{t('media.chooseFile')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const next = event.target.files?.[0] ?? null; setPrepared(null); setPreparing(Boolean(next)); setFile(next); }} /></label>}
        <label className="nf-stack">{t('media.preset')}<select value={preset} onChange={(event) => { setPrepared(null); setPreparing(Boolean(file)); setPreset(event.target.value as Settings['photoPreset']); }}>{(['small', 'medium', 'high', 'original'] as const).map((value) => <option key={value} value={value}>{t('media.' + value)}</option>)}</select></label>
        {file && <p className="nf-meta">{t('media.originalBytes', { bytes: file.size })}</p>}{preparing && <p role="status">{t('media.preparing')}</p>}
        {prepared && <><BlobPreview asset={prepared} /><output>{t('media.result', prepared)}</output></>}
      </>}
      <label className="nf-stack">{t('media.caption')}<input value={caption} onChange={(event) => setCaption(event.target.value)} /></label>
      <label className="nf-stack">{t('media.alt')}<input value={alt} onChange={(event) => setAlt(event.target.value)} /></label>
    </fieldset>
    <div className="nf-row"><Button disabled={busy} disabledReason={t('common.loading')} onClick={close}>{t('common.cancel')}</Button>
      <Button variant="primary" disabled={busy || preparing || (!failed && (mode === 'url' ? !validUrl : !prepared))} disabledReason={t('media.imageError')} onClick={() => { void submit(); }}>{t(failed ? 'common.retry' : existing ? 'media.apply' : 'media.add')}</Button></div>
  </Sheet>;
}
