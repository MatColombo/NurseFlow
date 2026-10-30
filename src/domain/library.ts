import { z } from 'zod';
import type { Group, LibraryViewState, Procedure, Revision, UiLocale } from './model';

export const libraryFiltersSchema = z.object({
  quick: z.enum(['all', 'favorites', 'drafts']).default('all'),
  groupIds: z.array(z.string()).default([]), tags: z.array(z.string()).default([]),
  priority: z.enum(['any', '0', '1', '2', 'high']).default('any'),
  status: z.enum(['all', 'ready', 'draft']).default('all'), includeSteps: z.boolean().default(false),
});
export type LibraryFilters = z.infer<typeof libraryFiltersSchema>;
export const defaultFilters = (): LibraryFilters => libraryFiltersSchema.parse({});
export const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
export const groupNameKey = (text: string) => text.normalize('NFC').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
export function browserLocale(languages: readonly string[]): UiLocale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'it' || base === 'en') return base;
  }
  return 'en';
}
export function hasFilters(filters: LibraryFilters) {
  return filters.quick !== 'all' || filters.groupIds.length > 0 || filters.tags.length > 0 || filters.priority !== 'any'
    || filters.status !== 'all' || filters.includeSteps;
}
function stepText(revision: Revision | undefined): string {
  if (!revision) return '';
  return revision.graph.nodes.map((node) => {
    const parts: string[] = [];
    if ('title' in node) parts.push(node.title ?? '');
    if ('text' in node) parts.push(node.text);
    if ('question' in node) parts.push(node.question);
    if ('message' in node) parts.push(node.heading, node.message);
    if ('note' in node) parts.push(node.note?.text ?? '');
    if (node.kind === 'decision') parts.push(...node.outcomes.map((outcome) => `${outcome.label} ${outcome.note?.text ?? ''}`));
    if (node.kind === 'multitask') parts.push(...node.activities.map((activity) => activity.name));
    return parts.join(' ');
  }).join(' ');
}
export function selectLibrary(procedures: readonly Procedure[], groups: readonly Group[], view: LibraryViewState,
  locale: UiLocale, revisions: readonly Revision[] = []) {
  const filters = libraryFiltersSchema.parse(view.filters ?? {});
  const terms = normalize(view.searchText ?? '').split(' ').filter(Boolean);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const revisionById = new Map(revisions.map((revision) => [revision.id, revision]));
  const scores = new Map<string, number>();
  const result = procedures.filter((procedure) => {
    if (procedure.archived || (filters.quick === 'favorites' && !procedure.favorite)
      || (filters.quick === 'drafts' && !procedure.workingDraftId)) return false;
    const groupId = procedure.groupId && groupNames.has(procedure.groupId) ? procedure.groupId : 'ungrouped';
    if (filters.groupIds.length && !filters.groupIds.includes(groupId)) return false;
    if (filters.tags.length && !filters.tags.some((tag) => procedure.tags.some((value) => normalize(tag) === normalize(value)))) return false;
    if (filters.priority !== 'any' && !(filters.priority === 'high' ? procedure.priority > 0 : String(procedure.priority) === filters.priority)) return false;
    if (filters.status === 'ready' && !procedure.readyRevisionId || filters.status === 'draft' && !procedure.workingDraftId) return false;
    const fields = [procedure.title, [...procedure.tags, groupNames.get(procedure.groupId ?? '') ?? ''].join(' '),
      procedure.aliases.join(' '), procedure.description ?? '', filters.includeSteps
        ? stepText(revisionById.get(procedure.workingDraftId ?? procedure.readyRevisionId ?? '')) : ''].map(normalize);
    let score = 0;
    for (const term of terms) {
      const index = fields.findIndex((field) => field.includes(term));
      if (index < 0) return false;
      score += 5 - index;
    }
    scores.set(procedure.id, score); return true;
  });
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  const alphabetical = (a: Procedure, b: Procedure) => collator.compare(a.title, b.title) || a.id.localeCompare(b.id);
  const recent = (a: Procedure, b: Procedure) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? '') || alphabetical(a, b);
  return result.sort((a, b) => {
    if (view.sortMode === 'priority') return b.priority - a.priority || recent(a, b);
    if (view.sortMode === 'recent') return recent(a, b);
    return (terms.length ? (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) : 0) || alphabetical(a, b);
  });
}
export function recentProcedures(procedures: readonly Procedure[]) {
  return procedures.filter((procedure) => !procedure.archived && procedure.lastOpenedAt)
    .sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? '') || a.title.localeCompare(b.title)).slice(0, 20);
}
