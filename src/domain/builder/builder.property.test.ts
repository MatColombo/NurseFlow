// @vitest-environment node
import { expect, it } from 'vitest';
import { convergenceGraph, multitaskGraph } from '@test/fixtures/domain';
import type { Graph } from '../model';
import { applyEdit } from './edits';
import { assertEditableGraph, destinationAt, outlets } from './structure';
import { pasteGraph } from './clipboard';
function random(seed: number) { let state = seed; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 2 ** 32; }; }
// Independent Kahn oracle, separate from the editor's DFS.
function isDag(graph: Graph) {
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const node of graph.nodes) for (const { destination } of outlets(node)) if (destination.kind === 'node') indegree.set(destination.nodeId, indegree.get(destination.nodeId)! + 1);
  const pending = [...indegree].filter(([, count]) => !count).map(([id]) => id); let count = 0;
  while (pending.length) {
    const id = pending.pop()!; count++;
    for (const { destination } of outlets(graph.nodes.find((node) => node.id === id)!)) if (destination.kind === 'node') {
      const next = indegree.get(destination.nodeId)! - 1; indegree.set(destination.nodeId, next); if (!next) pending.push(destination.nodeId);
    }
  }
  return count === graph.nodes.length;
}
it('property: 200 sequenze riproducibili di rewiring preservano gli altri outlet e non introducono cicli', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rand = random(seed); let graph = convergenceGraph(); let sequence = 0;
    for (let step = 0; step < 12; step++) {
      const original = structuredClone(graph); const itemId = rand() < 0.5 ? 'a' : 'b'; const sibling = itemId === 'a' ? 'b' : 'a';
      const target = graph.nodes[Math.floor(rand() * graph.nodes.length)]!;
      let result: Graph;
      try { result = applyEdit(graph, { type: 'connect', edge: { nodeId: 'decision', slot: 'outcome', itemId }, destination: { kind: 'node', nodeId: target.id } }, () => 'p-' + seed + '-' + ++sequence).graph; }
      catch {
        expect(['start', 'decision']).toContain(target.id); expect(graph).toEqual(original); continue;
      }
      expect(isDag(result)).toBe(true);
      expect(destinationAt(result, { nodeId: 'decision', slot: 'outcome', itemId: sibling })).toEqual(destinationAt(graph, { nodeId: 'decision', slot: 'outcome', itemId: sibling }));
      expect(result.nodes.map((node) => node.id)).toEqual(graph.nodes.map((node) => node.id)); graph = result;
    }
  }
}, 15_000);
it('property: 2–32 attività, coppie generate su tutti i bracci rifiutano cross-arm; 33 non entra nel Draft', () => {
  for (let count = 2; count <= 32; count++) {
    const graph = multitaskGraph(); const tasks = graph.nodes.find((node) => node.kind === 'multitask')!;
    if (tasks.kind !== 'multitask') throw new Error('fixture');
    const template = graph.nodes.find((node) => node.id === 'task-1')!;
    tasks.activities = Array.from({ length: count }, (_, index) => ({ id: 'activity-' + index, name: 'Esempio ' + index,
      order: index, required: true, first: { kind: 'node', nodeId: 'generated-' + index } }));
    graph.nodes = graph.nodes.filter((node) => !node.id.startsWith('task-'));
    graph.nodes.push(...tasks.activities.map((_, index) => ({ ...structuredClone(template), id: 'generated-' + index })));
    expect(() => assertEditableGraph(graph)).not.toThrow();
    for (let index = 0; index < count; index++) expect(() => applyEdit(graph, { type: 'connect', edge: { nodeId: 'generated-' + index, slot: 'next' },
      destination: { kind: 'node', nodeId: 'generated-' + (index + 1) % count } }, () => 'none')).toThrow('scope');
    if (count === 32) expect(() => applyEdit(graph, { type: 'add-item', nodeId: 'tasks' }, () => 'none')).toThrow('limit');
  }
});
it('property: 100 Copy/Paste generano nuove identità senza toccare originali o dati condivisi', () => {
  let graph = convergenceGraph(); let sequence = 0;
  for (let i = 0; i < 100; i++) {
    const before = structuredClone(graph);
    const next = pasteGraph(graph, { kind: 'edge', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'a' } },
      { mode: 'copy', graph, selection: { kind: 'node', nodeId: 'shared' }, procedureId: 'p', revisionId: 'd', editVersion: 1 },
      { procedureId: 'p', revisionId: 'd', editVersion: 1, newId: () => 'copy-' + ++sequence });
    expect(new Set(next.nodes.map((node) => node.id)).size).toBe(next.nodes.length); expect(isDag(next)).toBe(true);
    expect(graph).toEqual(before); expect(next.nodes.find((node) => node.id === 'shared')).toEqual(before.nodes.find((node) => node.id === 'shared')); graph = next;
  }
});
