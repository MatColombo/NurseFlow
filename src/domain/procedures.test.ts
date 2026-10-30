import { describe, expect, it } from 'vitest';
import { cloneProcedureGraph, metadataOf, parseMetadata, procedureState, readyStart, uniqueLabels } from './procedures';
import { exampleRecords, incompleteGraph, mediaGraph } from '@test/fixtures/domain';
import { assertGraphReferences } from './model/integrity';

describe('metadati e identità F04', () => {
  it('normalizza tag/alias per matching senza tradurre o cambiare il casing authored', () => {
    expect(uniqueLabels(['  Blù ', 'blu', 'ALFA', ' alfa ', '', '  A   B '])).toEqual(['Blù', 'ALFA', 'A B']);
    expect(parseMetadata({ ...metadataOf(), title: '  Titolo autore  ', aliases: ['Alias scritto', 'alias scritto'] }).aliases).toEqual(['Alias scritto']);
  });
  it('creazione valida titolo e allowlist; metadati non accettano puntatori a revisioni', () => {
    expect(() => parseMetadata({ ...metadataOf(), title: ' ' }, true)).toThrow();
    expect(() => parseMetadata({ ...metadataOf(), title: 'a'.repeat(121) }, true)).toThrow();
    expect(() => parseMetadata({ ...metadataOf(), title: 'Esempio', ribbon: { colorKey: 'url(remote)', iconKey: '<svg/>' } })).toThrow();
    expect(() => parseMetadata({ ...metadataOf(), title: 'Esempio', readyRevisionId: 'other' })).toThrow();
  });
  it('distingue Draft-only, Ready-only e Ready+Draft', () => {
    const procedure = exampleRecords().procedures[0]!;
    expect(procedureState(procedure)).toBe('ready');
    expect(procedureState({ ...procedure, workingDraftId: 'draft' })).toBe('ready-draft');
    expect(procedureState({ ...procedure, readyRevisionId: undefined, workingDraftId: 'draft' })).toBe('draft');
    expect(procedureState({ ...procedure, archived: true })).toBe('archived');
  });
  it('duplica convergenze e identità editoriali preservando asset immutabili e broken storico', () => {
    const graph = mediaGraph(); let sequence = 0; const copy = cloneProcedureGraph(graph, () => `copy-${++sequence}`);
    expect(copy).not.toBe(graph); expect(copy.nodes.every((node) => !graph.nodes.some((source) => source.id === node.id))).toBe(true);
    assertGraphReferences(copy);
    const sourceStep = graph.nodes.find((node) => node.kind === 'instruction')!;
    const copiedStep = copy.nodes.find((node) => node.kind === 'instruction')!;
    if (sourceStep.kind === 'instruction' && copiedStep.kind === 'instruction') {
      expect(copiedStep.media[1]?.source).toEqual(sourceStep.media[1]?.source);
      expect(copiedStep.media[1]?.id).not.toBe(sourceStep.media[1]?.id);
    }
    const incomplete = cloneProcedureGraph(incompleteGraph(), () => `next-${++sequence}`);
    const decision = incomplete.nodes.find((node) => node.kind === 'decision');
    if (decision?.kind === 'decision') expect(decision.outcomes[1]?.destination).toMatchObject({ kind: 'broken', formerNodeId: 'deleted' });
  });
  it('Start non indovina percorsi: rifiuta ciclo/unassigned e conserva W08 come broken', () => {
    const revision = exampleRecords().revisions[0]!; expect(readyStart(revision).id).toBe('start');
    const cyclic = structuredClone(revision); const step = cyclic.graph.nodes.find((node) => node.kind === 'instruction');
    if (step?.kind === 'instruction') step.next = { kind: 'node', nodeId: 'start' };
    expect(() => readyStart(cyclic)).toThrow('cycle');
    expect(() => readyStart({ ...revision, graph: incompleteGraph() })).toThrow('unassigned');
  });
});
