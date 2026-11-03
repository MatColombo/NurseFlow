// @vitest-environment node
import { expect, it } from 'vitest';
import { activitiesGraph, outlineGraph, outcomesGraph } from '@test/fixtures/builder';
import { graphMetrics, focusPath, makeScene } from './scene';
import { canvasViewSchema } from './model';
import { centerAt, fitViewport, zoomAt } from './viewport';
import { applyEdit } from './edits';
import { connectionProblem } from './targets';
import { projectMap } from '../map/projection';
import { mapScene } from '../map/scene';

it('proietta una sola identità canonica, due frecce dirette con estremità distinte, senza mutare il DAG', () => {
  const graph = outlineGraph(); const original = structuredClone(graph);
  const scene = makeScene(graph, {}, 768, graphMetrics(13, 768));
  expect(scene.nodes.filter((node) => node.id === 'shared')).toHaveLength(1);
  const inbound = scene.edges.filter((edge) => edge.targetId === 'shared'); expect(inbound).toHaveLength(2);
  expect(new Set(inbound.map((edge) => edge.path)).size).toBe(2); expect(inbound[0]!.end.y).not.toBe(inbound[1]!.end.y);
  expect(scene.nodes.map((node) => node.id).sort()).toEqual(graph.nodes.map((node) => node.id).sort()); expect(graph).toEqual(original);
});
it('32 attività: una corsia a 320px, fino a tre quando c’è spazio, completamenti direttamente sulla continuazione', () => {
  const graph = activitiesGraph(32); const original = structuredClone(graph);
  const narrow = makeScene(graph, { tasks: 'activity-27' }, 296, graphMetrics(13, 296));
  expect(narrow.capacity).toBe(1); expect(narrow.nodes.map((node) => node.id).sort()).toEqual(['start', 'tasks', 'task-27', 'end'].sort());
  expect(narrow.edges.find((edge) => edge.edge.nodeId === 'task-27')).toMatchObject({ targetId: 'end', completion: true, draw: true });
  const wide = makeScene(graph, { tasks: 'activity-27' }, 1280, graphMetrics(13, 1280));
  expect(wide.capacity).toBe(3); expect(wide.nodes.filter((node) => node.id.startsWith('task-')).map((node) => node.id).sort()).toEqual(['task-26', 'task-27', 'task-28']);
  expect(wide.edges.filter((edge) => edge.completion && edge.targetId === 'end')).toHaveLength(3); expect(graph).toEqual(original);
});
it('Browse/focus usa ID di attività/esiti e può rivelare il passo 27 senza cambiare i collegamenti', () => {
  const graph = activitiesGraph(32); const focus = focusPath(graph, 'task-27', {}); expect(focus.tasks).toBe('activity-27');
  const scene = makeScene(outcomesGraph(), { decision: 'outcome-19' }, 320, graphMetrics(13, 320));
  const decision = scene.nodes.find((node) => node.id === 'decision')!;
  expect(decision.ports).toHaveLength(1); expect(decision.ports[0]!.edge.itemId).toBe('outcome-19'); expect(decision.total).toBe(32);
});
it('AND annidato: Finish risolve la continuazione esterna senza introdurre nodi o collegamenti editoriali', () => {
  const graph = activitiesGraph(2); const template = graph.nodes.find((node) => node.id === 'task-1');
  if (template?.kind !== 'instruction') throw new Error('fixture');
  graph.nodes = graph.nodes.filter((node) => node.id !== 'task-1');
  graph.nodes.push({ id: 'task-1', kind: 'multitask', title: 'Sottogruppo', afterAll: { kind: 'activity-complete' },
    activities: [1, 2].map((index) => ({ id: 'inner-' + index, name: 'Parte ' + index, order: index - 1, required: true, first: { kind: 'node', nodeId: 'inner-step-' + index } })) },
  ...[1, 2].map((index) => ({ ...structuredClone(template), id: 'inner-step-' + index })));
  const before = structuredClone(graph); const scene = makeScene(graph, {}, 1280, graphMetrics(13, 1280));
  const completions = scene.edges.filter((edge) => edge.completion && edge.draw);
  expect(completions.map((edge) => edge.edge.nodeId).sort()).toEqual(['inner-step-1', 'inner-step-2', 'task-2']);
  expect(completions.every((edge) => edge.targetId === 'end')).toBe(true);
  expect(scene.nodes.map((node) => node.id).sort()).toEqual(graph.nodes.map((node) => node.id).sort()); expect(graph).toEqual(before);
});
it('focus conserva ID arbitrari senza interpretarli come proprietà del prototipo', () => {
  const graph = activitiesGraph(32); graph.layout = { positions: {} };
  graph.nodes = graph.nodes.map((node) => node.id === 'tasks' ? { ...node, id: '__proto__' } :
    node.kind === 'start' ? { ...node, next: { kind: 'node', nodeId: '__proto__' } } : node);
  const focus = focusPath(graph, 'task-27', {}); expect(Object.hasOwn(focus, '__proto__')).toBe(true); expect(focus.__proto__).toBe('activity-27');
  const scene = makeScene(graph, focus, 320, graphMetrics(13, 320)); expect(scene.nodes.map((node) => node.id)).toContain('task-27');
  expect(scene.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
});
it('property: geometria finita, senza sovrapposizioni dei nodi a 320/390/768px × 4/13/30/48pt', () => {
  for (const width of [320, 390, 768]) for (const scale of [4, 13, 30, 48]) {
    const scene = makeScene(outlineGraph(), {}, width, graphMetrics(scale, width));
    for (const a of scene.nodes) {
      expect([a.x, a.y, a.width, a.height].every(Number.isFinite)).toBe(true);
      for (const b of scene.nodes) if (a.id !== b.id) expect(a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y).toBe(true);
    }
    for (const edge of scene.edges.filter((edge) => edge.draw)) {
      const target = scene.nodes.find((node) => node.id === edge.targetId)!;
      expect(edge.end.x).toBe(target.x); expect(edge.end.x).toBeGreaterThan(edge.start.x);
      const coordinates = edge.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      const curve = coordinates.slice(4, 10);
      expect(curve[1]).toBe(edge.start.y); // first control is horizontally aligned
      expect(curve[3]).toBe(edge.end.y); // terminal tangent is perpendicular to left face
      expect(curve[2]).toBeLessThan(edge.end.x);
      expect(coordinates.slice(-2)).toEqual([edge.end.x, edge.end.y]);
      expect(curve[4]).toBeLessThan(edge.end.x); expect(curve[5]).toBe(edge.end.y);
    }
  }
});
it('layout è un comando del medesimo DAG, conserva contenuti e rifiuta riferimenti/coordinate non validi', () => {
  const graph = outlineGraph(); const original = structuredClone(graph);
  const changed = applyEdit(graph, { type: 'layout', positions: { shared: { x: 150, y: 300 } } }, () => 'unused').graph;
  expect(changed.nodes).toEqual(graph.nodes); expect(changed.layout?.positions.shared).toEqual({ x: 150, y: 300 }); expect(graph).toEqual(original);
  expect(() => applyEdit(graph, { type: 'layout', positions: { missing: { x: 1, y: 2 } } }, () => 'unused')).toThrow();
  expect(() => applyEdit(graph, { type: 'layout', positions: { shared: { x: NaN, y: 2 } } }, () => 'unused')).toThrow();
});
it('AND con rami disuguali: corsie stabili e linee mai sotto un altro passo, in Builder e Map a tutte le scale', () => {
  const initial = activitiesGraph(3); let sequence = 0; const id = () => 'follow-' + ++sequence;
  const first = applyEdit(initial, { type: 'create', edge: { nodeId: 'task-1', slot: 'next' }, kind: 'alert' }, id);
  const graph = applyEdit(first.graph, { type: 'create', edge: { nodeId: first.createdId!, slot: 'next' }, kind: 'instruction' }, id).graph;
  for (const width of [320, 390, 768]) for (const scale of [4, 13, 30, 48]) {
    for (const scene of [makeScene(graph, {}, width, graphMetrics(scale, width)), mapScene(graph, projectMap(graph), scale, width)]) {
      const boxes = new Map(scene.nodes.map((node) => [node.id, node]));
      expect(boxes.get('task-1')!.y).toBeCloseTo(boxes.get(first.createdId!)!.y);
      const group = boxes.get('tasks')!; const end = boxes.get('end')!;
      expect(group.y + group.height / 2).toBeCloseTo(end.y + end.height / 2);
      for (const edge of scene.edges.filter((edge) => !('draw' in edge) || edge.draw)) {
        const values = edge.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        const [x0, y0, x1, y1, x2, y2, x3, y3] = values.slice(2) as [number, number, number, number, number, number, number, number];
        const samples = Array.from({ length: 101 }, (_, index) => {
          const t = index / 100; const u = 1 - t;
          return { x: u ** 3 * x0 + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3,
            y: u ** 3 * y0 + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3 };
        });
        for (const box of scene.nodes.filter((node) => node.id !== edge.edge.nodeId && node.id !== edge.targetId)) {
          expect(samples.some((point) => point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height)).toBe(false);
          expect(edge.start.y > box.y && edge.start.y < box.y + box.height && edge.start.x < box.x + box.width && x0 > box.x).toBe(false);
        }
      }
    }
  }
});
it('target picker usa le stesse regole di scrittura: ciclo, cross-arm e target già assegnato', () => {
  const edge = { nodeId: 'decision', slot: 'outcome' as const, itemId: 'a' };
  expect(connectionProblem(outlineGraph(), edge, 'decision')).toBe('cycle'); expect(connectionProblem(outlineGraph(), edge, 'shared')).toBeNull();
  expect(connectionProblem(outlineGraph(), edge, 'a-step')).toBe('connected');
  expect(connectionProblem(activitiesGraph(), { nodeId: 'task-1', slot: 'next' }, 'task-2')).toBe('scope');
});
it('pan/zoom/fit trasformano solo la camera: zoom ancorato e modifica sempre a dimensione leggibile', () => {
  const original = canvasViewSchema.parse({}); const zoomed = zoomAt(original, 2, { x: 100, y: 150 });
  expect(zoomed).toMatchObject({ x: -100, y: -150, zoom: 2 }); expect(zoomAt(zoomed, 1, { x: 100, y: 150 })).toMatchObject({ x: 0, y: 0, zoom: 1 });
  const fit = fitViewport(original, { width: 1000, height: 2000 }, 320, 500); expect(fit.zoom).toBeLessThan(1);
  expect(centerAt(fit, { x: 0, y: 0, width: 240, height: 200 }, 320, 500).zoom).toBe(1);
  expect(zoomAt(original, 100, { x: 0, y: 0 }).zoom).toBe(3); expect(original.initialized).toBe(false);
});
