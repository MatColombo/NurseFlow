import { expect, it } from 'vitest';
import { applyTextStyle, changedTextFormat, formatSegments, textFormatSchema } from './text';
import { graphSchema } from './graph';
import { outlineGraph } from '@test/fixtures/builder';

it('applies overlapping styles only to the selection and toggles each style independently', () => {
  const bold = applyTextStyle('abcdef', [], 1, 5, 'bold');
  const italic = applyTextStyle('abcdef', bold, 3, 6, 'italic');
  expect(formatSegments('abcdef', italic)).toEqual([
    { start: 0, end: 1, text: 'a' }, { start: 1, end: 3, text: 'bc', bold: true },
    { start: 3, end: 5, text: 'de', bold: true, italic: true }, { start: 5, end: 6, text: 'f', italic: true },
  ]);
  const toggled = applyTextStyle('abcdef', italic, 3, 5, 'bold');
  expect(formatSegments('abcdef', toggled).find((part) => part.start === 3)).toMatchObject({ italic: true });
  expect(formatSegments('abcdef', toggled).find((part) => part.start === 3)?.bold).toBeUndefined();
  expect(applyTextStyle('abc', [], 0, 0, 'color', 'info')).toEqual([{ start: 0, end: 3, color: 'info' }]);
});
it('preserves ranges on insertion and deletion and rejects executable styles', () => {
  expect(changedTextFormat('abcdef', 'aXYbcdef', [{ start: 1, end: 4, bold: true }])).toEqual([{ start: 1, end: 6, bold: true }]);
  expect(changedTextFormat('abcdef', 'af', [{ start: 2, end: 4, bold: true }])).toEqual([]);
  expect(textFormatSchema.safeParse([{ start: 0, end: 2, color: 'url(javascript:alert(1))' }]).success).toBe(false);
  expect(textFormatSchema.safeParse([{ start: 0, end: 2, html: '<script>' }]).success).toBe(false);
  const graph = outlineGraph(); const node = graph.nodes.find((node) => node.kind === 'instruction')!;
  if (node.kind !== 'instruction') throw new Error('fixture');
  node.textFormat = [{ start: 0, end: 2, underline: true }];
  node.note = { text: 'One\nTwo', visibility: 'always-visible', bulleted: true, format: [{ start: 0, end: 3, bold: true }] };
  node.galleries.beforeNote.layout = 'grid-4';
  expect(graphSchema.parse(JSON.parse(JSON.stringify(graph)))).toEqual(graph);
});
