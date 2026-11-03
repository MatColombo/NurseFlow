import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { StepMedia } from '@domain/model';
import type { EditableStep } from '@domain/editor/edits';
import { Button, Dialog, GalleryFrame } from '@shared/components';
import { MediaImage } from '@features/step-editor/media/MediaImage';
import './step-content.css';

/** Shared content. Page08's local preview has inert actions; Guided Draft Preview uses RunScreen's explicit mode. */
export function StepContent({ node, phase, preview, inspection = false, allowRemote = true, onContinue, onChoose, busy = false, continueLabel, showEndType = true, stopOutcomeIds = [], finishOutcomeIds = [] }: {
  node: EditableStep; phase?: string | undefined; preview: boolean; allowRemote?: boolean;
  inspection?: boolean;
  onContinue?: () => void; onChoose?: (id: string) => void;
  busy?: boolean; continueLabel?: string; showEndType?: boolean; stopOutcomeIds?: string[]; finishOutcomeIds?: string[];
}) {
  const { t } = useTranslation(); const [noteOpen, setNoteOpen] = useState(true); const [outcomeNote, setOutcomeNote] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState<StepMedia | null>(null); const [zoom, setZoom] = useState(1);
  const title = node.kind === 'decision' ? node.question : node.kind === 'end' ? node.heading : node.title;
  const note = node.note?.text.trim() ? node.note : null;
  const figures = 'media' in node ? [...node.media].sort((a, b) => (a.slot === b.slot ? a.order - b.order : a.slot === 'before-note' ? -1 : 1)) : [];
  const gallery = (slot: StepMedia['slot']) => {
    if (!('media' in node)) return null; const items = node.media.filter((item) => item.slot === slot).sort((a, b) => a.order - b.order); if (!items.length) return null;
    const style = node.galleries[slot === 'before-note' ? 'beforeNote' : 'afterNote'];
    return <GalleryFrame slot={slot} {...style}>{items.map((item) => <MediaImage key={item.id} item={item} figureNumber={figures.findIndex((figure) => figure.id === item.id) + 1} allowRemote={allowRemote} onInspect={(item) => { setZoomed(item); setZoom(1); }} />)}</GalleryFrame>;
  };
  return <article className="nf-step-content nf-stack" data-step-content={node.id}>
    {phase && <p className="nf-meta">{phase}</p>}
    {node.kind === 'end' && showEndType && <p>{t('builder.ends.' + node.endKind)}</p>}
    <h2 tabIndex={-1}>{title || t('editor.incomplete')}</h2>
    {node.kind === 'instruction' && <p className="nf-authored">{node.text}</p>}
    {node.kind === 'alert' && <><p className="nf-step-warning nf-authored" role="alert">{node.text || t('editor.incomplete')}</p>{node.additionalText && <p className="nf-authored">{node.additionalText}</p>}</>}
    {node.kind === 'decision' && node.context && <p className="nf-authored">{node.context}</p>}
    {node.kind === 'end' && <p className="nf-authored">{node.message}</p>}
    {gallery('before-note')}
    {note && <section className="nf-stack nf-step-note" aria-label={t('editor.note')}>
      {note.visibility === 'expandable' && <Button className="nf-note-toggle" aria-expanded={noteOpen} onClick={() => setNoteOpen((value) => !value)}>{t(noteOpen ? 'editor.hideNote' : 'editor.showNote')}</Button>}
      {(note.visibility === 'always-visible' || noteOpen) && <p className="nf-authored">{note.text}</p>}
    </section>}
    {gallery('after-note')}
    {!inspection && node.kind === 'decision' && <div className="nf-stack">{[...node.outcomes].sort((a, b) => a.order - b.order).map((item) => <div className="nf-row" key={item.id} data-preview-outcome={item.id}>
      <Button action disabled={preview || busy} disabledReason={t(preview ? 'editor.previewOnly' : 'run.saving')} onClick={() => onChoose?.(item.id)}>{item.label || t('builder.unnamedOutcome')}{stopOutcomeIds.includes(item.id) && <small className="nf-meta"> · {t('run.stop')}</small>}{finishOutcomeIds.includes(item.id) && <small className="nf-meta"> · {t('run.finishActivity')}</small>}</Button>
      {item.note?.text.trim() && (item.note.visibility === 'always-visible' ? <p className="nf-authored nf-note">{item.note.text}</p> : <><Button aria-label={t('editor.outcomeInfo', { label: item.label })} aria-expanded={outcomeNote === item.id} onClick={() => setOutcomeNote(outcomeNote === item.id ? null : item.id)}>ⓘ</Button>
        {outcomeNote === item.id && <p className="nf-authored nf-note">{item.note.text}</p>}</>)}
    </div>)}</div>}
    {!inspection && node.kind !== 'decision' && node.kind !== 'end' && <Button action disabled={preview || busy} disabledReason={t(preview ? 'editor.previewOnly' : 'run.saving')} onClick={onContinue}>{continueLabel ?? t('editor.continue')}</Button>}
    <Dialog open={Boolean(zoomed)} title={t('media.image')} onClose={() => setZoomed(null)}>
      <div className="nf-row"><Button aria-label={t('canvas.zoomOut')} disabled={zoom <= 1} disabledReason={t('canvas.zoomLimit')} onClick={() => setZoom(Math.max(1, zoom / 1.5))}>−</Button>
        <Button aria-label={t('canvas.zoomIn')} disabled={zoom >= 4} disabledReason={t('canvas.zoomLimit')} onClick={() => setZoom(Math.min(4, zoom * 1.5))}>+</Button></div>
      {zoomed && <div className="nf-image-scroll"><div style={{ width: `${zoom * 100}%` }}><MediaImage item={zoomed} figureNumber={figures.findIndex((figure) => figure.id === zoomed.id) + 1} allowRemote={allowRemote} /></div></div>}
    </Dialog>
  </article>;
}
