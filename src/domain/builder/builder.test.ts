// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { convergenceGraph, incompleteGraph, mediaGraph, multitaskGraph } from '@test/fixtures/domain';
import type { Graph } from '../model';
import { applyEdit, freshNode } from './edits';
import { activityScopeKey, assertEditableGraph, destinationAt, edgeKey, impact, nodeAt } from './structure';
import { assertMovable, pasteGraph, type GraphClip } from './clipboard';
import { BuilderError } from './model';
let sequence = 0; const newId = () => 'edit-' + ++sequence;
const decisionEdge = { nodeId: 'decision', slot: 'outcome' as const, itemId: 'a' };
const context = { procedureId: 'p', revisionId: 'draft', editVersion: 1, newId };
function clip(graph: Graph, nodeId: string, mode: 'copy' | 'cut' = 'copy'): GraphClip {
  return { ...context, graph, mode, selection: { kind: 'node', nodeId } };
}
function linear(): Graph {
  return { schemaVersion: 1, phases: [], nodes: [
    { id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'a' } },
    { ...freshNode('instruction', newId), id: 'a', next: { kind: 'node', nodeId: 'b' } },
    { ...freshNode('instruction', newId), id: 'b', next: { kind: 'node', nodeId: 'end' } },
    { id: 'end', kind: 'end', endKind: 'neutral', heading: '', message: '' },
  ] } as Graph;
}
describe('comandi puri Outline', () => {
  it('edge e scope restano distinti anche con delimitatori negli ID editoriali', () => {
    expect(edgeKey({ nodeId: 'a/outcome/x', slot: 'next' })).not.toBe(edgeKey({ nodeId: 'a', slot: 'outcome', itemId: 'x/next/' }));
    expect(activityScopeKey('a:b', 'c')).not.toBe(activityScopeKey('a', 'b:c'));
    const graph: Graph = { schemaVersion: 1, phases: [], nodes: [
      { id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'a:b' } },
      { id: 'a:b', kind: 'multitask', title: '', activities: [{ id: 'c', name: '', order: 0, required: true, first: { kind: 'node', nodeId: 'shared' } }], afterAll: { kind: 'node', nodeId: 'a' } },
      { id: 'a', kind: 'multitask', title: '', activities: [{ id: 'b:c', name: '', order: 0, required: true, first: { kind: 'node', nodeId: 'shared' } }], afterAll: { kind: 'unassigned' } },
      { ...freshNode('instruction', newId), id: 'shared', next: { kind: 'activity-complete' } },
    ] } as Graph;
    expect(() => assertEditableGraph(graph)).toThrow('scope');
  });
  it('crea e collega solo l’outcome selezionato, senza contenuto inventato', () => {
    const graph = convergenceGraph(); const original = structuredClone(graph);
    const result = applyEdit(graph, { type: 'create', edge: decisionEdge, kind: 'instruction' }, newId);
    expect(graph).toEqual(original); expect(destinationAt(result.graph, decisionEdge)).toEqual({ kind: 'node', nodeId: result.createdId });
    expect(destinationAt(result.graph, { ...decisionEdge, itemId: 'b' })).toEqual(destinationAt(graph, { ...decisionEdge, itemId: 'b' }));
    expect(nodeAt(result.graph, result.createdId!)).toMatchObject({ kind: 'instruction', text: '', media: [], next: { kind: 'node', nodeId: 'shared' } });
  });
  it.each(['completed', 'stopped', 'escalation', 'neutral'] as const)('End intenzionale %s è un vero nodo, senza testo clinico precompilato', (endKind) => {
    const result = applyEdit(incompleteGraph(), { type: 'create', edge: decisionEdge, kind: 'end', endKind }, newId);
    expect(nodeAt(result.graph, result.createdId!)).toMatchObject({ kind: 'end', endKind, heading: '', message: '' });
  });
  it('Draft vuota resta incompleta: 0/1 voci consentite, oltre 32 rifiutato', () => {
    let graph = convergenceGraph();
    graph = applyEdit(graph, { type: 'remove-item', nodeId: 'decision', itemId: 'b' }, newId).graph;
    expect((nodeAt(graph, 'decision') as { outcomes: unknown[] }).outcomes).toHaveLength(1);
    for (let i = 1; i < 32; i++) graph = applyEdit(graph, { type: 'add-item', nodeId: 'decision' }, newId).graph;
    expect(() => applyEdit(graph, { type: 'add-item', nodeId: 'decision' }, newId)).toThrow('limit');
  });
  it('riordino mantiene ID, destinazioni e note; rinomina non traduce', () => {
    const graph = convergenceGraph();
    const renamed = applyEdit(graph, { type: 'rename-item', nodeId: 'decision', itemId: 'a', text: 'Risposta dell’autore' }, newId).graph;
    const reordered = applyEdit(renamed, { type: 'reorder-item', nodeId: 'decision', itemId: 'a', delta: 1 }, newId).graph;
    const node = nodeAt(reordered, 'decision'); expect(node.kind).toBe('decision');
    if (node.kind === 'decision') expect(node.outcomes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'a', label: 'Risposta dell’autore', order: 1, destination: { kind: 'node', nodeId: 'shared' } }),
    ]));
  });
  it('chiudere una rinomina senza cambiamenti non aggiunge campi opzionali vuoti al grafo', () => {
    const graph = convergenceGraph();
    expect(applyEdit(graph, { type: 'rename', nodeId: 'shared', title: '', phaseId: 'phase' }, newId).graph).toEqual(graph);
    expect(applyEdit(graph, { type: 'rename', nodeId: 'end', title: 'Esempio terminato', phaseId: null }, newId).graph).toEqual(graph);
  });
  it('rewiring mantiene i nodi, segnala orfani e mostra esattamente gli edge cambiati', () => {
    const graph = convergenceGraph();
    const onlyA = applyEdit(graph, { type: 'connect', edge: decisionEdge, destination: { kind: 'node', nodeId: 'end' } }, newId).graph;
    expect(impact(graph, onlyA).changed).toHaveLength(1); expect(impact(graph, onlyA).unreachable).toEqual([]);
    const both = applyEdit(onlyA, { type: 'connect', edge: { ...decisionEdge, itemId: 'b' }, destination: { kind: 'node', nodeId: 'end' } }, newId).graph;
    expect(impact(onlyA, both).unreachable.map((node) => node.id)).toEqual(['shared']);
    expect(both.nodes).toHaveLength(graph.nodes.length);
  });
  it('delete condiviso conserva W08 su tutti gli ingressi, distinto da unassigned', () => {
    const graph = convergenceGraph(); const result = applyEdit(graph, { type: 'delete', nodeId: 'shared' }, newId).graph;
    for (const itemId of ['a', 'b']) expect(destinationAt(result, { ...decisionEdge, itemId })).toMatchObject({ kind: 'broken', formerNodeId: 'shared' });
    expect(result.layout?.positions['shared']).toBeUndefined(); expect(nodeAt(result, 'end')).toEqual(nodeAt(graph, 'end'));
    expect(() => applyEdit(graph, { type: 'delete', nodeId: 'start' }, newId)).toThrow();
  });
  it('AND: Finish esplicito locale, niente End normale che salta attività richieste', () => {
    const graph = multitaskGraph(); const edge = { nodeId: 'task-1', slot: 'next' as const };
    const empty = applyEdit(graph, { type: 'disconnect', edge }, newId).graph;
    expect(destinationAt(empty, edge)).toEqual({ kind: 'unassigned' });
    const finished = applyEdit(empty, { type: 'finish', edge }, newId).graph;
    expect(destinationAt(finished, edge)).toEqual({ kind: 'activity-complete' });
    expect(() => applyEdit(graph, { type: 'create', edge, kind: 'end', endKind: 'completed' }, newId)).toThrow('scope');
    expect(() => applyEdit(graph, { type: 'finish', edge: { nodeId: 'tasks', slot: 'activity', itemId: 'activity-1' } }, newId)).toThrow('scope');
  });
  it.each(['stopped', 'escalation'] as const)('stop intero %s è esplicito e non modifica gli altri bracci', (endKind) => {
    const graph = multitaskGraph(); const edge = { nodeId: 'task-1', slot: 'next' as const };
    const result = applyEdit(graph, { type: 'create', edge, kind: 'end', endKind, stopEntire: true }, newId);
    expect(destinationAt(result.graph, edge)).toEqual({ kind: 'node', nodeId: result.createdId, terminateProcedure: true });
    expect(nodeAt(result.graph, 'task-2')).toEqual(nodeAt(graph, 'task-2'));
    expect(() => applyEdit(graph, { type: 'create', edge, kind: 'end', endKind: 'completed', stopEntire: true }, newId)).toThrow('scope');
  });
  it('rifiuta cicli, cross-arm e collegamenti root dentro attività; convergenze locali consentite', () => {
    const graph = multitaskGraph(); const edge = { nodeId: 'task-1', slot: 'next' as const };
    expect(() => applyEdit(graph, { type: 'connect', edge, destination: { kind: 'node', nodeId: 'task-2' } }, newId)).toThrow('scope');
    expect(() => applyEdit(graph, { type: 'connect', edge, destination: { kind: 'node', nodeId: 'tasks' } }, newId)).toThrow('cycle');
    expect(() => applyEdit(graph, { type: 'connect', edge: { nodeId: 'start', slot: 'next' }, destination: { kind: 'node', nodeId: 'task-2' } }, newId)).toThrow('scope');
    expect(() => assertEditableGraph(convergenceGraph())).not.toThrow();
  });
  it('legge ancora Decision e multitask annidati legacy; cancellazione conserva i discendenti', () => {
    const graph = multitaskGraph();
    const group = freshNode('multitask', newId); if (group.kind !== 'multitask') throw new Error('fixture');
    const choice = freshNode('decision', newId); graph.nodes.push(group, choice);
    const task = nodeAt(graph, 'task-1'); if (task.kind !== 'instruction') throw new Error('fixture');
    task.next = { kind: 'node', nodeId: group.id }; group.afterAll = { kind: 'activity-complete' };
    group.activities[0]!.first = { kind: 'node', nodeId: choice.id };
    expect(() => assertEditableGraph(graph)).not.toThrow();
    const removed = applyEdit(graph, { type: 'delete', nodeId: 'tasks' }, newId).graph;
    expect(nodeAt(removed, group.id).kind).toBe('multitask');
    expect(destinationAt(removed, { nodeId: 'start', slot: 'next' })).toMatchObject({ kind: 'broken', formerNodeId: 'tasks' });
    expect(removed.nodes).toHaveLength(graph.nodes.length - 1);
  });
  it('nuovo authoring AND: follow-up già terminabile, unico successore scelto nel picker, niente salti', () => {
    const graph = multitaskGraph(); const edge = { nodeId: 'task-1', slot: 'next' as const };
    const empty = applyEdit(graph, { type: 'disconnect', edge }, newId).graph;
    const result = applyEdit(empty, { type: 'create', edge, kind: 'alert' }, newId);
    expect(destinationAt(result.graph, { nodeId: result.createdId!, slot: 'next' })).toEqual({ kind: 'activity-complete' });
    const fork = nodeAt(result.graph, 'tasks'); if (fork.kind !== 'multitask') throw new Error('fixture');
    const linked = applyEdit(result.graph, { type: 'connect', edge: { nodeId: result.createdId!, slot: 'next' }, destination: fork.afterAll }, newId).graph;
    expect(destinationAt(linked, { nodeId: result.createdId!, slot: 'next' })).toEqual({ kind: 'activity-complete' });
    expect(nodeAt(linked, 'task-2')).toEqual(nodeAt(graph, 'task-2'));
    for (const kind of ['decision', 'multitask'] as const) expect(() => applyEdit(graph, { type: 'create', edge, kind }, newId)).toThrow('scope');
  });
  it('assegnare il collettore chiude i terminali semplici incompleti in un solo comando, senza riparare W08', () => {
    const graph = multitaskGraph(); const first = nodeAt(graph, 'task-1'); const second = nodeAt(graph, 'task-2');
    if (first.kind !== 'instruction' || second.kind !== 'instruction') throw new Error('fixture');
    first.next = { kind: 'unassigned' }; second.next = { kind: 'broken', formerNodeId: 'removed' };
    const before = structuredClone(graph);
    const changed = applyEdit(graph, { type: 'create', edge: { nodeId: 'tasks', slot: 'afterAll' }, kind: 'instruction' }, newId).graph;
    expect(destinationAt(changed, { nodeId: 'task-1', slot: 'next' })).toEqual({ kind: 'activity-complete' });
    expect(nodeAt(changed, 'task-2')).toEqual(second); expect(graph).toEqual(before);
    expect(impact(graph, changed).changed.map((change) => change.edge)).toContainEqual({ nodeId: 'task-1', slot: 'next' });
  });
});
describe('clipboard strutturale', () => {
  it('Copy crea ID e media nuovi, riusa asset immutabili e fasi remappate', () => {
    const graph = mediaGraph(); const copy = pasteGraph(graph, { kind: 'edge', edge: decisionEdge }, clip(graph, 'shared'), context);
    const entry = destinationAt(copy, decisionEdge); expect(entry.kind).toBe('node');
    if (entry.kind !== 'node') throw new Error('fixture');
    const node = nodeAt(copy, entry.nodeId); expect(node.id).not.toBe('shared');
    if (node.kind !== 'instruction') throw new Error('fixture');
    const original = nodeAt(graph, 'shared'); if (original.kind !== 'instruction') throw new Error('fixture');
    expect(node.media[1]?.id).not.toBe(original.media[1]?.id); expect(node.media[1]?.source).toEqual(original.media[1]?.source);
    expect(node.phaseId).not.toBe(original.phaseId); expect(copy.phases.find((phase) => phase.id === node.phaseId)?.name).toBe('Fase esempio');
    expect(destinationAt(copy, { ...decisionEdge, itemId: 'b' })).toEqual(destinationAt(graph, { ...decisionEdge, itemId: 'b' }));
  });
  it('Copy Decision lascia unresolved gli outlet esterni, non copia il resto della procedura', () => {
    const graph = convergenceGraph(); const copy = pasteGraph(graph, { kind: 'edge', edge: decisionEdge }, clip(graph, 'decision'), context);
    const added = copy.nodes.find((node) => !graph.nodes.some((old) => old.id === node.id));
    expect(added?.kind).toBe('decision'); if (added?.kind === 'decision') expect(added.outcomes.every((item) => item.destination.kind === 'unassigned')).toBe(true);
    expect(copy.nodes).toHaveLength(graph.nodes.length + 1);
  });
  it('Copy di un singolo passo non include il suo End esterno privato', () => {
    const graph = convergenceGraph();
    const copied = pasteGraph(graph, { kind: 'edge', edge: decisionEdge }, clip(graph, 'shared'), context);
    expect(copied.nodes).toHaveLength(graph.nodes.length + 1);
    expect(copied.nodes.filter((node) => node.kind === 'end')).toEqual(graph.nodes.filter((node) => node.kind === 'end'));
    const entry = destinationAt(copied, decisionEdge); if (entry.kind !== 'node') throw new Error('Entry missing');
    expect(nodeAt(copied, entry.nodeId)).toMatchObject({ next: { kind: 'node', nodeId: 'shared' } });
  });
  it('Copy attività include il proprio Stop esplicito, conservando il flag e remappando il terminale', () => {
    const source = applyEdit(multitaskGraph(), { type: 'create', edge: { nodeId: 'task-1', slot: 'next' }, kind: 'end', endKind: 'stopped', stopEntire: true }, newId).graph;
    const payload: GraphClip = { ...context, mode: 'copy', graph: source, selection: { kind: 'activity', nodeId: 'tasks', activityId: 'activity-1' } };
    const copied = pasteGraph(source, { kind: 'activity-list', nodeId: 'tasks' }, payload, context);
    expect(copied.nodes).toHaveLength(source.nodes.length + 2);
    const tasks = nodeAt(copied, 'tasks'); if (tasks.kind !== 'multitask') throw new Error('Group missing');
    const first = tasks.activities.at(-1)!.first; if (first.kind !== 'node') throw new Error('Entry missing');
    const stop = destinationAt(copied, { nodeId: first.nodeId, slot: 'next' });
    expect(stop).toMatchObject({ kind: 'node', terminateProcedure: true });
    if (stop.kind !== 'node') throw new Error('End missing');
    expect(source.nodes.some((node) => node.id === stop.nodeId)).toBe(false);
    expect(nodeAt(copied, stop.nodeId)).toMatchObject({ kind: 'end', endKind: 'stopped' });
  });
  it('Cut pending non muta nulla; move sposta sorgente e destinazione in un solo grafo valido', () => {
    const graph = linear(); const original = structuredClone(graph); const pending = clip(graph, 'a', 'cut'); assertMovable(pending);
    expect(graph).toEqual(original);
    const moved = pasteGraph(graph, { kind: 'edge', edge: { nodeId: 'b', slot: 'next' } }, pending, context);
    expect(destinationAt(moved, { nodeId: 'start', slot: 'next' })).toEqual({ kind: 'node', nodeId: 'b' });
    expect(destinationAt(moved, { nodeId: 'b', slot: 'next' })).toEqual({ kind: 'node', nodeId: 'a' });
    expect(destinationAt(moved, { nodeId: 'a', slot: 'next' })).toEqual({ kind: 'node', nodeId: 'end' });
    expect(moved.nodes.map((node) => node.id)).toEqual(graph.nodes.map((node) => node.id));
    expect(() => pasteGraph(graph, { kind: 'edge', edge: { nodeId: 'a', slot: 'next' } }, pending, context)).toThrow('cycle');
  });
  it('non muove nodi condivisi o Cut obsoleto/da altra procedura', () => {
    const graph = convergenceGraph(); expect(() => assertMovable(clip(graph, 'shared', 'cut'))).toThrow('shared');
    const source = linear(); const pending = clip(source, 'a', 'cut');
    expect(() => pasteGraph(source, { kind: 'edge', edge: { nodeId: 'b', slot: 'next' } }, pending, { ...context, procedureId: 'other' })).toThrow('moveScope');
    expect(() => pasteGraph(source, { kind: 'edge', edge: { nodeId: 'b', slot: 'next' } }, pending, { ...context, editVersion: 2 })).toThrow('stale');
  });
  it('copia/muove un’attività con tutto il suo sotto-grafo; limite 32 e confini preservati', () => {
    const graph = multitaskGraph();
    const payload: GraphClip = { ...context, mode: 'copy', graph, selection: { kind: 'activity', nodeId: 'tasks', activityId: 'activity-1' } };
    const copied = pasteGraph(graph, { kind: 'activity-list', nodeId: 'tasks' }, payload, context);
    const tasks = nodeAt(copied, 'tasks'); if (tasks.kind !== 'multitask') throw new Error('fixture');
    expect(tasks.activities).toHaveLength(4); expect(tasks.activities[3]?.id).not.toBe('activity-1');
    expect(copied.nodes).toHaveLength(graph.nodes.length + 1); assertEditableGraph(copied);
    const moved = pasteGraph(graph, { kind: 'activity-list', nodeId: 'tasks' }, { ...payload, mode: 'cut' }, context);
    const movedTasks = nodeAt(moved, 'tasks'); if (movedTasks.kind === 'multitask') expect(movedTasks.activities.at(-1)?.id).toBe('activity-1');
    expect(moved.nodes).toHaveLength(graph.nodes.length);
  });
  it('errore di identità o dati mai muta il grafo sorgente', () => {
    const graph = convergenceGraph(); const original = structuredClone(graph);
    expect(() => applyEdit(graph, { type: 'create', edge: decisionEdge, kind: 'instruction' }, () => 'shared')).toThrow();
    expect(graph).toEqual(original); expect(new BuilderError('cycle').code).toBe('cycle');
  });
});
