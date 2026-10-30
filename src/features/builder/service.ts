import { createNurseFlowStorage } from '@storage/index';
import type { BuilderView } from '@domain/builder/model';
import type { GraphClip } from '@domain/builder/clipboard';
import type { Graph } from '@domain/model';
type Storage = ReturnType<typeof createNurseFlowStorage>;
export type BuilderSnapshot = Awaited<ReturnType<Storage['repositories']['builder']['get']>>;

export function createBuilderService(storage = createNurseFlowStorage()) {
  let queue: Promise<unknown> = Promise.resolve();
  function write<T>(operation: () => Promise<T>) { const result = queue.catch(() => {}).then(operation); queue = result; return result; }
  return {
    async load(id: string, revisionId?: string, opened = false) {
      const pending = queue; await pending.catch(() => {});
      if (queue === pending) queue = Promise.resolve();
      await storage.open(); const loaded = await storage.repositories.builder.get(id, revisionId);
      if (opened) loaded.procedure = await storage.commands.recordProcedureOpen(id); return loaded;
    },
    async flush() { await queue; },
    commit(snapshot: BuilderSnapshot, graph: Graph, label: string, view: BuilderView): Promise<BuilderSnapshot> {
      return write(async () => {
        const revision = await storage.commands.commitBuilderEdit({ procedureId: snapshot.procedure.id,
          sourceRevisionId: snapshot.revision.id, expectedEditVersion: snapshot.revision.editVersion,
          expectedGraph: snapshot.revision.graph, graph, label, view });
        return { ...snapshot, procedure: { ...snapshot.procedure, workingDraftId: revision.id, updatedAt: revision.updatedAt }, revision,
          history: { id: snapshot.procedure.id, revisionId: revision.id, editVersion: revision.editVersion,
            past: [...snapshot.history.past, { graph: snapshot.revision.graph, label }].slice(-30), future: [], view } };
      });
    },
    travel(snapshot: BuilderSnapshot, direction: 'undo' | 'redo'): Promise<BuilderSnapshot> {
      return write(async () => {
        const revision = await storage.commands.travelBuilderHistory({ procedureId: snapshot.procedure.id,
          sourceRevisionId: snapshot.revision.id, expectedEditVersion: snapshot.revision.editVersion, direction });
        const past = [...snapshot.history.past]; const future = [...snapshot.history.future];
        const entry = (direction === 'undo' ? past : future).pop()!;
        (direction === 'undo' ? future : past).push({ graph: snapshot.revision.graph, label: entry.label });
        return { ...snapshot, revision, history: { ...snapshot.history, editVersion: revision.editVersion, past, future } };
      });
    },
    saveView(snapshot: BuilderSnapshot, view: BuilderView) {
      return write(() => storage.commands.saveBuilderView({ procedureId: snapshot.procedure.id,
        sourceRevisionId: snapshot.revision.id, expectedEditVersion: snapshot.revision.editVersion, view }));
    },
    saveMode(mode: 'outline' | 'graph') { return write(() => storage.commands.setBuilderMode(mode)); },
  };
}
// The in-app graph clipboard never touches the OS clipboard or persistent Cut state.
let clipboard: GraphClip | null = null;
const listeners = new Set<() => void>();
export const graphClipboard = {
  get: () => clipboard,
  set(value: GraphClip | null) { clipboard = value; listeners.forEach((listener) => listener()); },
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
};
export const builderService = createBuilderService();
