import { act, renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { PropsWithChildren } from 'react';
import { expect, it, vi } from 'vitest';
import { createUiI18n } from '@shared/i18n';
import { graphSchema, revisionSchema, settingsSchema, type Graph } from '@domain/model';
import { builderStateSchema } from '@domain/builder/model';
import { exampleRecords } from '@test/fixtures/domain';
import { outlineGraph } from '@test/fixtures/builder';
import { builderService, type BuilderSnapshot } from '@features/builder/service';
import { useStepDraft } from './useStepDraft';
vi.mock('@features/builder/service', () => ({ builderService: { commit: vi.fn(), saveView: vi.fn(async () => {}) } }));
function initial(): BuilderSnapshot {
  const records = exampleRecords(outlineGraph()); const revision = revisionSchema.parse(records.revisions[0]);
  return { procedure: records.procedures[0]!, revision, editorMode: 'outline', history: builderStateSchema.parse({ id: 'procedure', revisionId: revision.id, editVersion: revision.editVersion, past: [], future: [], view: {} }) };
}
function normalized(before: BuilderSnapshot, graph: Graph): BuilderSnapshot { return { ...before, revision: { ...before.revision, graph: graphSchema.parse(graph), editVersion: before.revision.editVersion + 1 } }; }
function wrapper({ children }: PropsWithChildren) { return <I18nextProvider i18n={createUiI18n()}>{children}</I18nextProvider>; }
it('la normalizzazione del repository non produce un secondo autosave né un falso errore', async () => {
  const commit = vi.mocked(builderService.commit).mockImplementation(async (before, graph) => normalized(before, graph));
  const { result } = renderHook(() => useStepDraft(initial(), 'shared', settingsSchema.parse({}), vi.fn()), { wrapper });
  act(() => result.current.change({ type: 'content', patch: { note: { text: 'Nota aggiunta', visibility: 'expandable' } } }));
  await act(async () => { expect(await result.current.flush()).toBe(true); });
  expect(commit).toHaveBeenCalledTimes(1); expect(result.current.dirty).toBe(false); expect(result.current.failed).toBe(false);
});
it('digitare durante una scrittura salva anche l’ultimo testo senza sostituirlo con il primo', async () => {
  let release!: () => void; const gate = new Promise<void>((resolve) => { release = resolve; });
  const commit = vi.mocked(builderService.commit); commit.mockClear(); commit.mockImplementationOnce(async (before, graph) => { await gate; return normalized(before, graph); }).mockImplementation(async (before, graph) => normalized(before, graph));
  const { result } = renderHook(() => useStepDraft(initial(), 'shared', settingsSchema.parse({}), vi.fn()), { wrapper });
  act(() => result.current.change({ type: 'content', patch: { text: 'Primo testo' } })); let flushing!: Promise<boolean>;
  act(() => { flushing = result.current.flush(); });
  act(() => result.current.change({ type: 'content', patch: { text: 'Ultimo testo autore' } }));
  await act(async () => { release(); expect(await flushing).toBe(true); });
  expect(commit).toHaveBeenCalledTimes(2); expect(result.current.current().revision.graph.nodes.find((node) => node.id === 'shared')).toMatchObject({ text: 'Ultimo testo autore' });
  expect(result.current.dirty).toBe(false);
});
