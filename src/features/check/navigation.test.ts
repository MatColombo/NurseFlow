import { describe, expect, it } from 'vitest';
import { outlineGraph } from '@test/fixtures/builder';
import { validateGraph } from '@domain/validation/validator';
import { carryCheck, checkPath, issuePath, readCheckReturn, readCheckSelection } from './navigation';
describe('F08 route contestuali sicure', () => {
  it('preserva ID issue, scroll e outcome con caratteri riservati senza URL arbitrari', () => {
    const graph = outlineGraph(); const choice = graph.nodes.find((node) => node.kind === 'decision')!; if (choice.kind !== 'decision') throw new Error('fixture'); choice.outcomes[0]!.id = 'answer/with?&"'; choice.outcomes[0]!.destination = { kind: 'unassigned' }; const issue = validateGraph(graph).problems.find((issue) => issue.code === 'P02')!;
    const path = issuePath('proc/?&', 'draft/?&', issue, 145); const query = new URLSearchParams(path.slice(path.indexOf('?') + 1));
    expect(readCheckSelection(query, graph)).toEqual({ kind: 'edge', edge: issue.edge }); expect(readCheckReturn(query)).toEqual({ issue: issue.id, top: 145 }); expect(query.get('revision')).toBe('draft/?&');
    const copied = new URLSearchParams(); carryCheck(query, copied); expect(readCheckReturn(copied)).toEqual(readCheckReturn(query)); expect(checkPath('proc/?&', readCheckReturn(query))).toMatch(/^\/build\/proc%2F%3F%26\/check\?/);
  });
  it.each(['null', '{}', '{"issue":"x","top":-1}', '{"issue":"x","top":"0"}', 'https://evil.example'])('ignora contesto non valido %s', (value) => { expect(readCheckReturn(new URLSearchParams({ checkReturn: value }))).toBeUndefined(); });
  it('selezione inesistente o attività incompatibile non provoca crash del Builder', () => { const graph = outlineGraph(); for (const selection of [{ kind: 'node', nodeId: 'gone' }, { kind: 'edge', edge: { nodeId: 'decision', slot: 'outcome', itemId: 'gone' } }, { kind: 'activity', nodeId: 'decision', activityId: 'a' }]) expect(readCheckSelection(new URLSearchParams({ checkSelection: JSON.stringify(selection) }), graph)).toBeUndefined(); });
  it('P10 apre Page08 sul campo esatto, media sul proprio ID', () => { const graph = outlineGraph(); const choice = graph.nodes.find((node) => node.kind === 'decision')!; if (choice.kind === 'decision') choice.question = ''; const issue = validateGraph(graph).problems.find((issue) => issue.code === 'P10')!; const path = issuePath('procedure', 'draft', issue, 0); expect(path).toContain('/step/decision?'); expect(new URLSearchParams(path.split('?')[1]).get('focusField')).toBe('question'); });
});
