// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { destinationSchema, graphSchema, settingsSchema } from './index';
import { assertGraphReferences } from './integrity';
import { prepareImportedRecords } from '../portability/records';
import { convergenceGraph, earlyEndGraph, exampleRecords, exampleRun, incompleteGraph, mediaGraph, multitaskGraph } from '@test/fixtures/domain';

describe('contratti dominio F01', () => {
  it.each([convergenceGraph, earlyEndGraph, incompleteGraph, mediaGraph, multitaskGraph, () => multitaskGraph(true)])(
    'fixture non cliniche serializzabili, schema e riferimenti coerenti: %#', (fixture) => {
      const graph = graphSchema.parse(JSON.parse(JSON.stringify(fixture())));
      expect(() => assertGraphReferences(graph)).not.toThrow();
    });
  it.each([
    { kind: 'node', nodeId: 'end' }, { kind: 'unassigned' },
    { kind: 'broken', formerNodeId: 'missing' }, { kind: 'activity-complete' },
  ])('preserva il terminale distinto $kind', (destination) => {
    expect(destinationSchema.parse(destination)).toEqual(destination);
  });
  it('consente Draft incomplete, rifiuta destinazioni live sconosciute e ID duplicati', () => {
    expect(() => assertGraphReferences(incompleteGraph())).not.toThrow();
    const graph = convergenceGraph(); graph.nodes.push({ id: 'start', kind: 'start', next: { kind: 'node', nodeId: 'missing' } });
    expect(() => assertGraphReferences(graph)).toThrow('Duplicate'); graph.nodes.pop();
    const start = graph.nodes[0]; if (start?.kind === 'start') start.next = { kind: 'node', nodeId: 'missing' };
    expect(() => assertGraphReferences(graph)).toThrow('Unknown live');
  });
  it.each([3, 49, 13.5])('rifiuta UI scale incompatibile %s', (uiScalePt) => {
    expect(settingsSchema.safeParse({ uiScalePt }).success).toBe(false);
  });
  it.each(['javascript:alert(1)', 'data:image/svg+xml,script', 'http://example.com/a.png', 'https://localhost/a.png',
    'https://127.0.0.1/a.png', 'https://192.168.1.1/a.png', 'https://example.com/a.svg', 'https://user:pass@example.com/a.png'])('rifiuta URL non consentito: %s', (url) => {
    const graph = mediaGraph(); const step = graph.nodes.find((node) => node.kind === 'instruction');
    if (step?.kind === 'instruction' && step.media[0]) step.media[0].source = { kind: 'remote', httpsUrl: url };
    expect(graphSchema.safeParse(graph).success).toBe(false);
  });
  it('remappa outcome, activity precedente ed End di run importati', () => {
    const source = exampleRecords(multitaskGraph(true));
    source.runSessions = [{ ...exampleRun('procedure', 'ready'), status: 'ended', currentNodeId: 'escalation', terminalEndNodeId: 'escalation',
      visited: [{ nodeId: 'choice', outcomeId: 'stop-all', previousActivityId: 'activity-1' }] }];
    let next = 0;
    const batch = prepareImportedRecords([source], () => `mapped-${++next}`)[0];
    const run = batch?.runSessions[0];
    if (!run || !('visited' in run)) throw new Error('Expected legacy fixture');
    expect(run?.currentNodeId).toBe(run?.terminalEndNodeId);
    expect(run?.visited[0]?.outcomeId).not.toBe('stop-all');
    expect(run?.visited[0]?.previousActivityId).not.toBe('activity-1');
  });
  it('scopa identità interne per procedura quando due procedure sorgenti riusano ID di nodi', () => {
    const first = exampleRecords(); const second = exampleRecords();
    const procedure = second.procedures[0]; const revision = second.revisions[0];
    if (!procedure || !revision) throw new Error('Fixture');
    procedure.id = 'second-procedure'; procedure.readyRevisionId = 'second-ready';
    revision.id = 'second-ready'; revision.procedureId = procedure.id;
    first.procedures.push(procedure); first.revisions.push(revision);
    let next = 0;
    const batch = prepareImportedRecords([first], () => `scoped-${++next}`)[0];
    const idsA = new Set(batch?.revisions[0]?.graph.nodes.map((node) => node.id));
    const idsB = batch?.revisions[1]?.graph.nodes.map((node) => node.id) ?? [];
    expect(idsB.some((id) => idsA.has(id))).toBe(false);
  });
  it('fallisce con un generatore di identità ripetute', () => {
    expect(() => prepareImportedRecords([exampleRecords()], () => 'same')).toThrow('fresh');
  });
});
