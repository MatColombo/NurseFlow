// @vitest-environment node
import { expect, it } from 'vitest';
import { remoteImageUrlSchema, settingsSchema } from '../model';
import { activitiesGraph, outlineGraph, outcomesGraph } from '@test/fixtures/builder';
import { editStep } from './edits';
import { inspectRaster, MAX_IMAGE_PIXELS } from './raster';
const settings = settingsSchema.parse({}); let sequence = 0; const id = () => 'new-' + ++sequence;
it('URL parziale o non sicuro produce un errore di validazione senza lanciare dalla refinement', () => {
  for (const value of ['', 'https:', 'abc', '%', 'javascript:alert(1)', 'https://media.example.com/a.%73vg', 'https://media.example.com/%XX']) expect(remoteImageUrlSchema.safeParse(value).success).toBe(false);
  expect(remoteImageUrlSchema.safeParse('https://media.example.com/card.gif').success).toBe(true);
});
it('contenuti incompleti e note sono authored verbatim; il DAG e l’originale restano invariati', () => {
  const before = outlineGraph(); const graph = editStep(before, 'shared', { type: 'content', patch: { title: '', text: '<img onerror=alert(1)>\nAutore', note: { text: 'nota', visibility: 'always-visible' } } }, settings, id);
  expect(graph.nodes.find((node) => node.id === 'shared')).toMatchObject({ title: '', text: '<img onerror=alert(1)>\nAutore', next: { kind: 'node', nodeId: 'end' } });
  expect(before.nodes.find((node) => node.id === 'shared')).not.toHaveProperty('note');
  expect(() => editStep(before, 'start', { type: 'content', patch: { title: 'no' } }, settings, id)).toThrow();
  expect(() => editStep(before, 'shared', { type: 'content', patch: { question: 'no' } }, settings, id)).toThrow();
});
it('Answer/note e Arrange conservano ID e destinazioni; rimozione lascia recuperabili i discendenti', () => {
  let graph = editStep(outlineGraph(), 'decision', { type: 'outcome', id: 'b', label: 'Risposta autore', note: { text: 'solo B', visibility: 'expandable' } }, settings, id);
  const before = structuredClone(graph); graph = editStep(graph, 'decision', { type: 'arrange', id: 'b', delta: -1 }, settings, id);
  const node = graph.nodes.find((node) => node.id === 'decision'); const original = before.nodes.find((node) => node.id === 'decision');
  if (node?.kind !== 'decision' || original?.kind !== 'decision') throw new Error('fixture');
  const records = (items: typeof node.outcomes) => items.map(({ id, label, note, destination }) => ({ id, label, note, destination })).sort((a, b) => a.id.localeCompare(b.id));
  expect(records(node.outcomes)).toEqual(records(original.outcomes));
  expect(node.outcomes.find((item) => item.id === 'b')).toMatchObject({ order: 0, destination: { kind: 'node', nodeId: 'b-step' }, note: { text: 'solo B' } });
  graph = editStep(graph, 'decision', { type: 'remove-outcome', id: 'b' }, settings, id); expect(graph.nodes.some((node) => node.id === 'b-step')).toBe(true);
  expect(() => editStep(outcomesGraph(), 'decision', { type: 'add-outcome' }, settings, id)).toThrow('limit');
});
it('crea e assegna la fase nella stessa modifica; cambio tipo elimina solo gli outlet del nodo', () => {
  const before = outlineGraph(); const graph = editStep(before, 'decision', { type: 'new-phase', id: 'phase-new', name: 'Fase autore' }, settings, id);
  expect(graph.phases.at(-1)).toMatchObject({ id: 'phase-new', name: 'Fase autore' }); expect(graph.nodes.find((node) => node.id === 'decision')).toMatchObject({ phaseId: 'phase-new' });
  const changed = editStep(graph, 'decision', { type: 'change-type', kind: 'instruction' }, settings, id);
  expect(changed.nodes.map((node) => node.id)).toEqual(before.nodes.map((node) => node.id)); expect(changed.nodes.find((node) => node.id === 'decision')).toMatchObject({ kind: 'instruction', next: { kind: 'unassigned' } });
});
it('cambiare un End autorizzato in un normale passo non permette di uscire dal braccio AND', () => {
  const graph = activitiesGraph(); const task = graph.nodes.find((node) => node.id === 'task-1'); if (task?.kind !== 'instruction') throw new Error('fixture');
  task.next = { kind: 'node', nodeId: 'stop', terminateProcedure: true }; graph.nodes.push({ id: 'stop', kind: 'end', endKind: 'stopped', heading: '', message: '' });
  expect(() => editStep(graph, 'stop', { type: 'change-type', kind: 'instruction' }, settings, id)).toThrow();
});
it('32 media combinati; soft cap riguarda solo Add, mai move/replace o contenuti esistenti', () => {
  let graph = outlineGraph(); const unlimited = settingsSchema.parse({ mediaAddSoftLimit: { enabled: false, max: 2 } });
  for (let i = 0; i < 32; i++) graph = editStep(graph, 'shared', { type: 'add-media', media: { id: 'm-' + i, slot: i % 2 ? 'after-note' : 'before-note', order: 0, source: { kind: 'local', assetId: 'shared-blob', mime: 'image/png' } } }, unlimited, id);
  const before = structuredClone(graph);
  expect(() => editStep(graph, 'shared', { type: 'add-media', media: { id: 'extra', slot: 'before-note', order: 0, source: { kind: 'remote', httpsUrl: 'https://example.com/a.gif' } } }, unlimited, id)).toThrow('limit');
  graph = editStep(graph, 'shared', { type: 'move-media', id: 'm-0', slot: 'after-note' }, settings, id);
  graph = editStep(graph, 'shared', { type: 'reorder-media', id: 'm-0', delta: -1 }, settings, id);
  graph = editStep(graph, 'shared', { type: 'replace-media', id: 'm-0', source: { kind: 'local', assetId: 'new-blob', mime: 'image/webp' }, caption: 'Nuova', altText: 'testo' }, settings, id);
  const node = graph.nodes.find((node) => node.id === 'shared'); if (!node || !('media' in node)) throw new Error('fixture');
  expect(node.media).toHaveLength(32); expect(node.media.find((item) => item.id === 'm-0')).toMatchObject({ slot: 'after-note', order: 15, caption: 'Nuova', altText: 'testo', source: { assetId: 'new-blob' } });
  expect(before).not.toEqual(graph);
  graph = editStep(graph, 'shared', { type: 'gallery', slot: 'before-note', style: { layout: 'side-by-side', imageSpace: 'large' } }, settings, id);
  const changed = graph.nodes.find((node) => node.id === 'shared'); if (!changed || !('media' in changed)) throw new Error('fixture');
  expect(changed.galleries.beforeNote).toEqual({ layout: 'side-by-side', imageSpace: 'large' }); expect(changed.galleries.afterNote).toEqual(node.galleries.afterNote);
});
it('raster: firme, dimensioni, GIF remoto e rifiuto di SVG, HTML, header troncati e bombe di pixel', () => {
  const png = new Uint8Array(32); png.set([137,80,78,71,13,10,26,10], 0); png.set([73,72,68,82],12); const view = new DataView(png.buffer); view.setUint32(16, 1280); view.setUint32(20, 720);
  expect(inspectRaster(png)).toEqual({ mime: 'image/png', width: 1280, height: 720 });
  const gif = new TextEncoder().encode('GIF89a' + String.fromCharCode(1,0,1,0)); expect(inspectRaster(gif, true).mime).toBe('image/gif'); expect(() => inspectRaster(gif)).toThrow();
  for (const text of ['<svg onload="alert(1)"/>', '<html>hello</html>', 'RIFFfakeWEBP']) expect(() => inspectRaster(new TextEncoder().encode(text))).toThrow();
  view.setUint32(16, MAX_IMAGE_PIXELS); expect(() => inspectRaster(png)).toThrow('image-size');
});
