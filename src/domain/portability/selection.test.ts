// @vitest-environment node
import { expect, it } from 'vitest';
import { candidates, changeSelection, emptyPortableFilters, repeatedTitle, visibleCandidates } from './selection';
import { portableRecords } from '@test/fixtures/portable';
it('I02/E10 group means every member while visible means conjunctive keyword/group/label matches; hidden selection survives filters', async () => {
  const records = await portableRecords(10, false); const items = candidates(records, 'file', 'source.nflib'); const initial = structuredClone(records);
  let selected = new Set<string>(); const group = items[0]!.groupKey;
  const filtered = visibleCandidates(items, { search: 'materiale', group, tag: 'blu' }, 'it'); expect(filtered.map((item) => item.procedure.id)).toEqual(['p-0', 'p-2', 'p-4']);
  selected = changeSelection(selected, filtered.map((item) => item.key), true); expect(selected.size).toBe(3);
  selected = changeSelection(selected, items.filter((item) => item.groupKey === group).map((item) => item.key), true); expect(selected.size).toBe(5);
  const none = visibleCandidates(items, { search: 'absent', group: '', tag: '' }, 'en'); expect(none).toHaveLength(0); expect(selected.size).toBe(5);
  expect(visibleCandidates(items, emptyPortableFilters(), 'en')).toHaveLength(10); expect(records).toEqual(initial);
});
it('I14/E11 files with identical source IDs are distinct, names conflict visibly and a newly added file can start selected independently', async () => {
  const records = await portableRecords(2, false); const first = candidates(records, 'file1', 'one.nfproc'); const second = candidates(records, 'file2', 'two.nfproc'); const all = [...first, ...second];
  expect(new Set(all.map((item) => item.key)).size).toBe(4); expect(first[0]!.groupKey).not.toBe(second[0]!.groupKey);
  let selected = new Set(first.map((item) => item.key)); selected = changeSelection(selected, [first[0]!.key], false); selected = changeSelection(selected, second.map((item) => item.key), true);
  expect(selected.has(first[0]!.key)).toBe(false); expect(selected.size).toBe(3); expect(repeatedTitle(first[0]!, all, records.procedures)).toEqual({ local: true, batch: true });
});
