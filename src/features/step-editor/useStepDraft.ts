import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Graph, MediaAsset, Settings } from '@domain/model';
import { editStep, type StepEdit } from '@domain/editor/edits';
import { BuilderError } from '@domain/builder/model';
import { builderService, type BuilderSnapshot } from '@features/builder/service';

/** One editing buffer, one durable snapshot; concurrent typing never overwrites a later keystroke. */
export function useStepDraft(initial: BuilderSnapshot, nodeId: string, settings: Settings, revisionChanged: (id: string) => void) {
  const { t } = useTranslation(); const [snapshot, setSnapshot] = useState(initial); const saved = useRef(initial);
  const [graph, setGraph] = useState(initial.revision.graph); const live = useRef(graph);
  const [writing, setWriting] = useState(false); const [error, setError] = useState<string | null>(null); const [failed, setFailed] = useState(false);
  const failure = useRef(false); const label = useRef('step-content'); const assets = useRef(new Map<string, MediaAsset>()); const addition = useRef<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const active = useRef<Promise<boolean> | null>(null); const locked = useRef(false);
  const callback = useRef(revisionChanged); useLayoutEffect(() => { callback.current = revisionChanged; });
  function view(graph = live.current) { return { ...saved.current.history.view, selection: graph.nodes.some((node) => node.id === nodeId) ? { kind: 'node' as const, nodeId } : null }; }
  function explain(reason: unknown) {
    return t(reason instanceof BuilderError ? reason.code === 'limit' ? 'media.limit' : 'builder.errors.' + reason.code :
      reason instanceof Error && reason.name === 'ConflictError' ? 'builder.errors.stale' : 'editor.saveError', { count: settings.mediaAddSoftLimit.enabled ? settings.mediaAddSoftLimit.max : 32 });
  }
  function flush(force = false): Promise<boolean> {
    if (timer.current) clearTimeout(timer.current);
    if (active.current) return active.current;
    if (failure.current && !force) return Promise.resolve(false);
    const work = async () => {
      setWriting(true);
      try {
        while (JSON.stringify(live.current) !== JSON.stringify(saved.current.revision.graph)) {
          const target = live.current; const prepared = [...assets.current.values()]; const before = saved.current;
          const result = await builderService.commit(before, target, label.current, view(target), prepared, addition.current);
          saved.current = result; setSnapshot(result); prepared.forEach((asset) => assets.current.delete(asset.id)); addition.current = undefined;
          // The repository normalizes optional fields/property order. Adopt that durable
          // graph only if no later keystroke replaced the buffer while the write ran.
          if (live.current === target) { live.current = result.revision.graph; setGraph(live.current); }
          if (before.revision.id !== result.revision.id) callback.current(result.revision.id);
        }
        failure.current = false; setFailed(false); setError(null); return true;
      } catch (reason) { failure.current = true; setFailed(true); setError(explain(reason)); return false; }
      finally { setWriting(false); }
    };
    const promise = work().finally(() => { if (active.current === promise) active.current = null; }); active.current = promise; return promise;
  }
  function change(edit: StepEdit) {
    try {
      const next = editStep(live.current, nodeId, edit, settings, () => crypto.randomUUID()); live.current = next; setGraph(next); label.current = edit.type === 'outcome' ? 'outcome-content' : 'step-content';
      if (timer.current) clearTimeout(timer.current); if (!failure.current) timer.current = setTimeout(() => { void flush(); }, 350);
    } catch (reason) { setError(explain(reason)); }
  }
  async function transaction(propose: (graph: Graph) => Graph, prepared: MediaAsset[] = [], adding = false) {
    if (locked.current) return false; locked.current = true;
    try {
      if (!await flush()) return false;
      const next = propose(live.current); prepared.forEach((asset) => assets.current.set(asset.id, asset));
      live.current = next; setGraph(next); label.current = 'step-structure'; addition.current = adding ? nodeId : undefined; return await flush();
    } catch (reason) { setError(explain(reason)); return false; }
    finally { locked.current = false; }
  }
  function discardProposal() {
    live.current = saved.current.revision.graph; setGraph(live.current); assets.current.clear(); addition.current = undefined;
    failure.current = false; setFailed(false); setError(null);
  }
  async function saveSelection() { if (!await flush()) return false; await builderService.saveView(saved.current, view()); return true; }
  useLayoutEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { snapshot, current: () => saved.current, graph, writing, error, failed, dirty: JSON.stringify(graph) !== JSON.stringify(snapshot.revision.graph), change, flush,
    transaction, edit: (edit: StepEdit, prepared: MediaAsset[] = []) => transaction((source) => editStep(source, nodeId, edit, settings, () => crypto.randomUUID()), prepared, edit.type === 'add-media'),
    discardProposal, saveSelection };
}
