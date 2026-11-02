import { draftRevisionSchema, type MediaAsset } from '@domain/model';
import type { ImportedRecords } from '@domain/portability/records';
import { outlineGraph } from './builder';
import { exampleRecords, fixtureDate } from './domain';
export const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAHgAAAA8CAIAAAAiz+n/AAAAh0lEQVR4nO3QQQkAIADAQPuXs4Evg9hCYR4swLgx19aFxvODTwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbgQbdCjToVqBBtwINuhVo0K1Ag24FGnQr0KBbHUl8MlmA9jGzAAAAAElFTkSuQmCC';
export async function portableAsset(id = 'asset'): Promise<MediaAsset> {
  const data = Uint8Array.from(atob(pngBase64), (char) => char.charCodeAt(0)); const blob = new Blob([data], { type: 'image/png' });
  const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { id, blob, bytes: blob.size, width: 120, height: 60, mime: 'image/png', sha256 };
}
export async function portableRecords(count = 3, withMedia = true): Promise<ImportedRecords> {
  const records: ImportedRecords = { procedures: [], groups: [
    { id: 'g-a', name: 'Materiali', order: 0, createdAt: fixtureDate }, { id: 'g-b', name: 'Cartoncini', order: 1, createdAt: fixtureDate }, { id: 'empty', name: 'Gruppo vuoto', order: 2, createdAt: fixtureDate },
  ], revisions: [], mediaAssets: withMedia ? [await portableAsset()] : [], runSessions: [] };
  for (let index = 0; index < count; index++) {
    const source = exampleRecords(outlineGraph()); const procedure = source.procedures[0]!; const revision = source.revisions[0]!;
    procedure.id = 'p-' + index; procedure.title = 'Cartoncino ' + index; procedure.groupId = index < Math.ceil(count / 2) ? 'g-a' : 'g-b';
    procedure.tags = [index % 2 ? 'rosso' : 'blu']; procedure.aliases = ['sinonimo ' + index]; procedure.readyRevisionId = 'r-' + index;
    revision.id = 'r-' + index; revision.procedureId = procedure.id;
    const step = revision.graph.nodes.find((node) => node.id === 'shared')!;
    if (step.kind === 'instruction') {
      step.text = 'Contenuto authored: materiale ' + index; step.note = { text: 'Nota dimostrativa ' + index, visibility: 'always-visible' };
      if (withMedia) step.media = [
        { id: 'm-real', order: 0, slot: 'before-note', source: { kind: 'local', assetId: 'asset', mime: 'image/png' }, caption: 'Prima della nota', altText: 'Cartoncino locale' },
        { id: 'm-url', order: 0, slot: 'after-note', source: { kind: 'remote', httpsUrl: 'https://example.com/cartoncino.gif', expectedMime: 'image/gif' }, caption: 'Dopo la nota', altText: 'Collegamento authored' },
        ...(index === 0 ? [{ id: 'm-missing', order: 1, slot: 'after-note' as const, source: { kind: 'local' as const, assetId: 'missing', mime: 'image/png' as const }, altText: 'Immagine assente dichiarata' }] : []),
      ];
    }
    records.procedures.push(procedure); records.revisions.push(revision);
  }
  if (records.procedures[0]) {
    records.procedures[0].workingDraftId = 'draft-0'; records.revisions.push(draftRevisionSchema.parse({ id: 'draft-0', procedureId: 'p-0', state: 'working-draft', revisionNumber: 2, editVersion: 1, validatorSchemaVersion: 0,
      createdAt: fixtureDate, updatedAt: fixtureDate, graph: { schemaVersion: 1, phases: [], nodes: [{ id: 'draft-start', kind: 'start', next: { kind: 'unassigned' } }] } }));
  }
  return records;
}
