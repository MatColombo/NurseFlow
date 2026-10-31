import { describe, expect, it } from 'vitest';
import { activitiesGraph, outlineGraph } from '@test/fixtures/builder';
import type { Graph, Node } from '../model';
import { canonical, LARGE_ASSET_BYTES, LARGE_STORAGE_BYTES, validateGraph, type ValidationFacts } from './validator';

function valid() { const graph = structuredClone(outlineGraph()); graph.phases = []; for (const node of graph.nodes) if ('phaseId' in node) node.phaseId = null; return graph; }
const codes = (graph: unknown, facts?: ValidationFacts) => { const result = validateGraph(graph, facts); return [...result.problems, ...result.warnings].map((issue) => issue.code); };
function instruction(graph: Graph) { return graph.nodes.find((node): node is Extract<Node, { kind: 'instruction' }> => node.id === 'shared' && node.kind === 'instruction')!; }
function decision(graph: Graph) { return graph.nodes.find((node): node is Extract<Node, { kind: 'decision' }> => node.kind === 'decision')!; }
function raw(graph: Graph) { return graph as unknown as { nodes: Record<string, unknown>[]; schemaVersion: number }; }
describe('F08 matrice P01–P12', () => {
  it('accetta convergenze e contenuti editoriali senza warning opzionali', () => { expect(codes(valid())).toEqual([]); });
  it.each(['missing', 'duplicate', 'unassigned'])('P01 Start %s', (kind) => {
    const graph = valid(); if (kind === 'missing') graph.nodes = graph.nodes.filter((node) => node.kind !== 'start');
    else if (kind === 'duplicate') graph.nodes.push({ id: 'start-2', kind: 'start', next: { kind: 'node', nodeId: 'decision' } });
    else { const node = graph.nodes.find((node) => node.kind === 'start')!; if (node.kind === 'start') node.next = { kind: 'unassigned' }; }
    expect(codes(graph)).toContain('P01');
  });
  it.each(['broken', 'dangling'])('Start %s conserva W08 ma P01 richiede un primo passo valido', (kind) => {
    const graph: Graph = { schemaVersion: 1, phases: [], nodes: [{ id: 'start', kind: 'start', next: kind === 'broken' ? { kind: 'broken', formerNodeId: 'gone' } : { kind: 'node', nodeId: 'gone' } }] };
    expect(codes(graph)).toEqual(['P01', 'W08']);
  });
  it('P02 e P04 per outlet reachable, senza P05 ridondante', () => {
    const graph = valid(); decision(graph).outcomes[0]!.destination = { kind: 'unassigned' }; instruction(graph).next = { kind: 'unassigned' };
    const result = validateGraph(graph); expect(result.problems.filter((issue) => ['P02', 'P04', 'P05'].includes(issue.code)).map((issue) => issue.code)).toEqual(['P02', 'P04']);
    expect(result.problems.find((issue) => issue.code === 'P02')?.edge?.itemId).toBe('a');
  });
  it.each([0, 1, 33])('P03 conta %i risposte', (count) => { const graph = valid(); const template = decision(graph).outcomes[0]!; decision(graph).outcomes = Array.from({ length: count }, (_, index) => ({ ...template, id: 'answer-' + index, label: 'Answer ' + index })); expect(codes(graph)).toContain('P03'); });
  it.each(['', ' A ', 'a', 'A\u200b'])('P03 label vuota/indistinguibile %s', (label) => { const graph = valid(); decision(graph).outcomes[1]!.label = label; expect(codes(graph)).toContain('P03'); });
  it('P05 continuazione ordinaria After all non assegnata', () => { const graph = activitiesGraph(); const task = graph.nodes.find((node) => node.kind === 'multitask')!; if (task.kind === 'multitask') task.afterAll = { kind: 'unassigned' }; expect(codes(graph)).toContain('P05'); });
  it.each([0, 1, 33])('P06 conta %i attività', (count) => { expect(codes(activitiesGraph(count))).toContain('P06'); });
  it('P06 attività vuota e P09 nodo rimasto orfano', () => { const graph = activitiesGraph(); const task = graph.nodes.find((node) => node.kind === 'multitask')!; if (task.kind === 'multitask') task.activities[0]!.first = { kind: 'unassigned' }; expect(codes(graph)).toContain('P06'); expect(codes(graph)).toContain('P09'); });
  it('P07 cross-arm e bypass via End normale', () => {
    const graph = activitiesGraph(); const step = graph.nodes.find((node) => node.id === 'task-1')!;
    if (step.kind === 'instruction') step.next = { kind: 'node', nodeId: 'task-2' }; expect(codes(graph)).toContain('P07');
    if (step.kind === 'instruction') step.next = { kind: 'node', nodeId: 'end' }; expect(codes(graph)).toContain('P07');
  });
  it('P07 completion interna non autorizzata e first vuoto dichiarato completo', () => { const graph = valid(); instruction(graph).next = { kind: 'activity-complete' }; expect(codes(graph)).toContain('P07'); const tasks = activitiesGraph(); const task = tasks.nodes.find((node) => node.kind === 'multitask')!; if (task.kind === 'multitask') task.activities[0]!.first = { kind: 'activity-complete' }; expect(codes(tasks)).toContain('P07'); expect(codes(tasks)).toContain('P06'); });
  it('P08 anche in un componente scollegato', () => { const graph = valid(); instruction(graph).next = { kind: 'node', nodeId: 'decision' }; expect(codes(graph)).toContain('P08'); const detached = valid(); detached.nodes.push({ ...instruction(detached), id: 'detached', next: { kind: 'node', nodeId: 'detached' } }); expect(codes(detached)).toContain('P08'); });
  it.each(['title', 'text'])('P10 campo istruzione %s', (field) => { const graph = valid(); Object.assign(instruction(graph), { [field]: ' ' }); const issue = validateGraph(graph).problems.find((issue) => issue.code === 'P10'); expect(issue?.field).toBe(field); });
  it('P10 testo formato solo da controlli invisibili; conserva il contenuto authored', () => { const graph = valid(); decision(graph).question = '\u200b\u200e'; expect(codes(graph)).toContain('P10'); expect(decision(graph).question).toBe('\u200b\u200e'); });
  it('P10 domanda e tipo/titolo/messaggio finale malformati', () => { const graph = valid(); decision(graph).question = ''; for (const node of raw(graph).nodes) if (node.kind === 'end') Object.assign(node, { endKind: 'automatic', heading: null, message: '' }); expect(validateGraph(graph).problems.filter((issue) => issue.code === 'P10').map((issue) => issue.field).sort()).toEqual(['endKind', 'heading', 'message', 'question']); });
  it('P11 duplicate IDs, phase reference e schema sconosciuto', () => { const graph = valid(); instruction(graph).phaseId = 'unknown'; decision(graph).outcomes[1]!.id = 'a'; raw(graph).schemaVersion = 42; expect(codes(graph)).toContain('P11'); });
  it.each(['url', 'slot', 'gallery', 'cap', 'mime'])('P12 schema media %s', (kind) => {
    const graph = valid(); const step = instruction(graph); step.media = [{ id: 'photo', order: 0, slot: 'before-note', source: { kind: 'remote', httpsUrl: 'https://example.com/photo.gif' } }];
    const media = step.media[0] as unknown as Record<string, unknown>;
    if (kind === 'url') media.source = { kind: 'remote', httpsUrl: 'javascript:alert(1)' };
    if (kind === 'slot') media.slot = 'html'; if (kind === 'gallery') Object.assign(step.galleries, { beforeNote: { layout: 'overlay', imageSpace: 'tiny' } });
    if (kind === 'mime') media.source = { kind: 'local', assetId: 'file', mime: 'image/svg+xml' };
    if (kind === 'cap') step.media = Array.from({ length: 33 }, (_, index) => ({ ...step.media[0]!, id: 'photo-' + index }));
    expect(codes(graph)).toContain('P12');
  });
  it('non genera P02/P04 per contenuto scollegato', () => { const graph = valid(); graph.nodes.push({ ...instruction(graph), id: 'detached', next: { kind: 'unassigned' } }); expect(codes(graph).filter((code) => code.startsWith('P'))).toEqual(['P09']); });
  it.each([null, {}, { nodes: [null] }, { nodes: [{ id: 'x', kind: 'unexpected' }] }])('classifica corruzione raw senza eccezioni %j', (graph) => { expect(() => validateGraph(graph)).not.toThrow(); expect(codes(graph)).toContain('P11'); });
});
describe('F08 matrice W01–W08 e precedenze', () => {
  it('W01/W02 offline, una riga per regola e step, nessun fetch', () => { const graph = valid(); instruction(graph).media = [1, 2].map((index) => ({ id: 'remote-' + index, order: index, altText: 'Cartoncino', slot: 'before-note', source: { kind: 'remote', httpsUrl: 'https://example.com/unavailable.gif' } })); expect(codes(graph)).toEqual(['W01', 'W02']); });
  it('W03 soglie tecniche e W04 aggregata, nessun limite soft nel validator', () => { const graph = valid(); instruction(graph).media = Array.from({ length: 5 }, (_, index) => ({ id: 'photo-' + index, order: index, slot: 'before-note', source: { kind: 'local', assetId: 'asset', mime: 'image/png' } })); const facts: ValidationFacts = { assets: new Map([['asset', { status: 'available', bytes: LARGE_ASSET_BYTES, mime: 'image/png' }]]), storageBytes: LARGE_STORAGE_BYTES }; expect(codes(graph, facts)).toEqual(['W03', 'W03', 'W04']); });
  it('W05 solo se esistono fasi', () => { const graph = valid(); graph.phases.push({ id: 'phase', name: 'Cartoncini', order: 0 }); expect(codes(graph)).toContain('W05'); graph.phases = []; expect(codes(graph)).not.toContain('W05'); });
  it('W06 confronta label e note, mai soltanto destinazioni', () => { const graph = valid(); expect(codes(graph)).not.toContain('W06'); decision(graph).outcomes[0]!.label = 'Opzione A'; decision(graph).outcomes[1]!.label = 'Opzione A!'; expect(codes(graph)).toContain('W06'); decision(graph).outcomes[1]!.note = { text: 'Un significato diverso', visibility: 'expandable' }; expect(codes(graph)).not.toContain('W06'); });
  it.each(['missing', 'unreadable'] as const)('W07 Blob %s senza P12', (status) => { const graph = valid(); instruction(graph).media = [{ id: 'photo', order: 0, altText: 'Cartoncino', slot: 'after-note', source: { kind: 'local', assetId: 'asset', mime: 'image/png' } }]; expect(codes(graph, { assets: new Map([['asset', { status }]]) })).toEqual(['W07']); });
  it.each(['broken', 'dangling'] as const)('W08 %s non diventa P02/P04/P05/P11', (kind) => { const graph = valid(); const path = kind === 'broken' ? { kind: 'broken' as const, formerNodeId: 'gone', formerTitle: 'Vecchio passo' } : { kind: 'node' as const, nodeId: 'gone' }; instruction(graph).next = path; graph.nodes = graph.nodes.filter((node) => node.kind !== 'end'); const result = validateGraph(graph); expect(result.problems).toEqual([]); expect(result.warnings.map((issue) => issue.code)).toEqual(['W08']); expect(result.warnings[0]?.edge).toEqual({ nodeId: 'shared', slot: 'next' }); });
  it('W08 da Decision conserva il singolo outcome e non copre altri unassigned', () => { const graph = valid(); decision(graph).outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'gone' }; decision(graph).outcomes[1]!.destination = { kind: 'unassigned' }; const result = validateGraph(graph); expect(result.warnings.find((issue) => issue.code === 'W08')?.edge?.itemId).toBe('a'); expect(result.problems.find((issue) => issue.code === 'P02')?.edge?.itemId).toBe('b'); });
  it('W08 dentro attività non causa P06 aggiuntivo', () => { const graph = activitiesGraph(); const node = graph.nodes.find((node) => node.id === 'task-1')!; if (node.kind === 'instruction') node.next = { kind: 'broken', formerNodeId: 'gone' }; expect(codes(graph)).toEqual(['W08']); });
});
describe('F08 invarianti e determinismo', () => {
  it('non muta input/facts, ID issue indipendenti dall’ordine', () => {
    const graph = valid(); instruction(graph).next = { kind: 'broken', formerNodeId: 'gone' }; decision(graph).outcomes[0]!.destination = { kind: 'unassigned' };
    const before = canonical(graph); const first = validateGraph(graph); expect(validateGraph(graph)).toEqual(first); expect(canonical(graph)).toBe(before);
    graph.nodes.reverse(); decision(graph).outcomes.reverse(); const next = validateGraph(graph); expect(next).toEqual(first);
  });
  it('2 problemi precisi per outcome vuoto e attività vuota', () => { const graph = activitiesGraph(); const task = graph.nodes.find((node) => node.kind === 'multitask')!; if (task.kind !== 'multitask') throw new Error('fixture'); const choice = decision(valid()); choice.outcomes.forEach((item, index) => { item.destination = index ? { kind: 'unassigned' } : { kind: 'node', nodeId: 'tasks' }; }); const start = graph.nodes.find((node) => node.kind === 'start')!; if (start.kind === 'start') start.next = { kind: 'node', nodeId: choice.id }; graph.nodes.push(choice); task.activities[0]!.first = { kind: 'unassigned' }; graph.nodes = graph.nodes.filter((node) => node.id !== 'task-1'); expect(validateGraph(graph).problems.map((issue) => issue.code)).toEqual(['P02', 'P06']); });
  it.each(['completed', 'stopped', 'escalation', 'neutral'] as const)('End anticipato %s valido', (endKind) => { const graph = valid(); decision(graph).outcomes[0]!.destination = { kind: 'node', nodeId: 'short-end' }; graph.nodes = graph.nodes.filter((node) => node.id !== 'a-step'); graph.nodes.push({ id: 'short-end', kind: 'end', endKind, heading: 'Fine esempio', message: 'Conclusione esplicita.' }); expect(codes(graph)).toEqual([]); });
  it('AND annidato, completamento attività e Stop autorizzato', () => {
    const graph = activitiesGraph(); const nested = activitiesGraph(2); const remap = (value: unknown): unknown => { if (Array.isArray(value)) return value.map(remap); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, ['id', 'nodeId'].includes(key) && typeof item === 'string' ? 'nested-' + item : remap(item)])); return value; };
    const extra = remap(nested.nodes.filter((node) => !['start', 'end'].includes(node.kind))) as Graph['nodes']; const fork = extra.find((node) => node.kind === 'multitask')!; if (fork.kind === 'multitask') fork.afterAll = { kind: 'activity-complete' }; const first = graph.nodes.find((node) => node.id === 'task-1')!; if (first.kind === 'instruction') first.next = { kind: 'node', nodeId: fork.id }; graph.nodes.push(...extra); expect(codes(graph)).toEqual([]);
    const step = graph.nodes.find((node) => node.id === 'nested-task-1')!; if (step.kind === 'instruction') step.next = { kind: 'node', nodeId: 'stop', terminateProcedure: true }; graph.nodes.push({ id: 'stop', kind: 'end', endKind: 'stopped', heading: 'Stop esempio', message: 'Tutte le attività si interrompono.' }); expect(codes(graph)).toEqual([]);
  });
  it('permutazioni di 2–32 outcome condivisi preservano invarianti e zero falsi W06', () => {
    for (let count = 2; count <= 32; count++) { const graph = valid(); graph.nodes = graph.nodes.filter((node) => !['a-step', 'b-step'].includes(node.id)); decision(graph).outcomes = Array.from({ length: count }, (_, index) => ({ id: 'o-' + index, order: count - index, label: 'Cartoncino ' + index, destination: { kind: 'node', nodeId: 'shared' } })); expect(codes(graph)).toEqual([]); expect(validateGraph({ ...graph, nodes: [...graph.nodes].reverse() })).toEqual(validateGraph(graph)); }
  });
  it('2–32 attività complete e permutazioni restano valide', () => {
    for (let count = 2; count <= 32; count++) { const graph = activitiesGraph(count); expect(codes(graph)).toEqual([]); graph.nodes.reverse(); const fork = graph.nodes.find((node) => node.kind === 'multitask')!; if (fork.kind === 'multitask') fork.activities.reverse(); expect(codes(graph)).toEqual([]); }
  });
  it('anche i cicli hanno diagnosi stabile dopo il riordino', () => { const graph = valid(); instruction(graph).next = { kind: 'node', nodeId: 'decision' }; const result = validateGraph(graph); graph.nodes.reverse(); decision(graph).outcomes.reverse(); expect(validateGraph(graph)).toEqual(result); });
});
