import type { Group, Procedure, Revision, UiLocale } from '../model';
import { uiPreferencesSchema } from '../model';
import { normalize, selectLibrary, stepText } from '../library';
import type { ImportedRecords } from './records';
import type { Issue } from '../validation/validator';
export type Candidate = { key: string; fileId: string; source: string; procedure: Procedure; group?: Group; groupKey: string; revisions: Revision[]; warnings: Issue[] };
export type PortableFilters = { search: string; group: string; tag: string };
export const emptyPortableFilters = (): PortableFilters => ({ search: '', group: '', tag: '' });
export const candidateKey = (fileId: string, procedureId: string) => JSON.stringify([fileId, procedureId]);
export function candidates(records: Pick<ImportedRecords, 'procedures' | 'groups' | 'revisions'>, fileId: string, source: string, warnings = new Map<string, Issue[]>()): Candidate[] {
  return records.procedures.map((procedure) => {
    const group = records.groups.find((group) => group.id === procedure.groupId); const revisions = records.revisions.filter((revision) => revision.procedureId === procedure.id);
    return { key: candidateKey(fileId, procedure.id), fileId, source, procedure, ...(group ? { group } : {}), groupKey: group ? candidateKey(fileId, group.id) : '$ungrouped', revisions,
      warnings: revisions.flatMap((revision) => warnings.get(revision.id) ?? []) };
  });
}
export function visibleCandidates(items: readonly Candidate[], filters: PortableFilters, locale: UiLocale) {
  const groups = new Map(items.filter((item) => item.group).map((item) => [item.groupKey, { ...item.group!, id: item.groupKey }]));
  const revisionKey = (item: Candidate, id: string) => candidateKey(item.key, id);
  const procedures = items.map((item) => ({ ...item.procedure, id: item.key, archived: false, groupId: item.group ? item.groupKey : null,
    description: [item.procedure.description ?? '', ...item.revisions.map(stepText)].join(' '),
    ...(item.procedure.readyRevisionId ? { readyRevisionId: revisionKey(item, item.procedure.readyRevisionId) } : {}),
    ...(item.procedure.workingDraftId ? { workingDraftId: revisionKey(item, item.procedure.workingDraftId) } : {}) }));
  const revisions = items.flatMap((item) => item.revisions.map((revision) => ({ ...revision, id: revisionKey(item, revision.id) })));
  const view = uiPreferencesSchema.parse({ sortMode: 'az', searchText: filters.search, filters: { includeSteps: true, groupIds: filters.group ? [filters.group === '$ungrouped' ? 'ungrouped' : filters.group] : [], tags: filters.tag ? [filters.tag] : [] } });
  const found = new Set(selectLibrary(procedures, [...groups.values()], view, locale, revisions).map((procedure) => procedure.id));
  return items.filter((item) => found.has(item.key));
}
export function changeSelection(current: ReadonlySet<string>, keys: readonly string[], on: boolean) { const next = new Set(current); keys.forEach((key) => on ? next.add(key) : next.delete(key)); return next; }
export function repeatedTitle(item: Candidate, batch: readonly Candidate[], local: readonly Procedure[]) {
  return { local: local.some((procedure) => normalize(procedure.title) === normalize(item.procedure.title)), batch: batch.filter((candidate) => normalize(candidate.procedure.title) === normalize(item.procedure.title)).length > 1 };
}
