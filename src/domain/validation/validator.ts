import { graphSchema, stepMediaSchema } from '../model';
import type { EdgeRef } from '../builder/model';

export const VALIDATOR_VERSION = 1;
export const LARGE_ASSET_BYTES = 5 * 1024 * 1024;
export const LARGE_STORAGE_BYTES = 50 * 1024 * 1024;
export type ProblemCode = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10' | 'P11' | 'P12';
export type WarningCode = 'W01' | 'W02' | 'W03' | 'W04' | 'W05' | 'W06' | 'W07' | 'W08';
export type IssueTarget = { nodeId?: string; edge?: EdgeRef; field?: string; itemId?: string; editor?: boolean };
export type Issue = IssueTarget & { id: string; code: ProblemCode | WarningCode; severity: 'problem' | 'warning'; location: string; detail?: string };
export type AssetFact = { status: 'available' | 'missing' | 'unreadable'; bytes?: number; mime?: string };
export type ValidationFacts = { assets?: ReadonlyMap<string, AssetFact>; storageBytes?: number };
export type ValidationResult = { validatorSchemaVersion: number; problems: Issue[]; warnings: Issue[] };
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RecordValue : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value as unknown[] : [];
const text = (value: unknown) => typeof value === 'string' ? value : '';
const normalize = (value: unknown) => text(value).normalize('NFKC').replace(/\p{Cf}/gu, '').trim().replace(/\s+/g, ' ').toLowerCase();
const equivalent = (value: unknown) => normalize(value).normalize('NFD').replace(/[\p{M}\p{P}\p{S}\s]/gu, '');
/** Stable serialization, independent of object property order. No clock, I/O or mutation. */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
type Outlet = { edge: EdgeRef; destination: RecordValue };
type Vertex = { id: string; kind: string; raw: RecordValue; outlets: Outlet[]; label: string };
function vertex(value: unknown): Vertex {
  const raw = record(value); const id = text(raw.id) || '$invalid:' + canonical(raw); const kind = text(raw.kind);
  const outlets: Outlet[] = [];
  const add = (slot: EdgeRef['slot'], destination: unknown, itemId?: string) => outlets.push({ edge: { nodeId: id, slot, ...(itemId ? { itemId } : {}) }, destination: record(destination) });
  if (['start', 'instruction', 'alert'].includes(kind)) add('next', raw.next);
  if (kind === 'decision') for (const item of list(raw.outcomes).map(record)) add('outcome', item.destination, text(item.id) || '$invalid:' + canonical(item));
  if (kind === 'multitask') { for (const item of list(raw.activities).map(record)) add('activity', item.first, text(item.id) || '$invalid:' + canonical(item)); add('afterAll', raw.afterAll); }
  outlets.sort((a, b) => canonical(a.edge) < canonical(b.edge) ? -1 : canonical(a.edge) > canonical(b.edge) ? 1 : 0);
  return { id, raw, kind, outlets, label: text(raw.title) || text(raw.question) || text(raw.heading) || id };
}

/** Tolerates invalid imported/raw graphs so corruption becomes a precise P issue, not an exception. */
export function validateGraph(input: unknown, facts: ValidationFacts = {}): ValidationResult {
  const graph = record(input); const rawVertices = list(graph.nodes).map(vertex);
  const vertices = [...rawVertices].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : canonical(a.raw) < canonical(b.raw) ? -1 : 1);
  const nodes = new Map(vertices.map((node) => [node.id, node]));
  const issues = new Map<string, Issue>();
  function add(code: Issue['code'], target: IssueTarget = {}, detail?: string) {
    const id = canonical([code, target.nodeId ?? null, target.edge?.slot ?? null, target.edge?.itemId ?? target.itemId ?? null, target.field ?? null]);
    const node = target.nodeId ? nodes.get(target.nodeId) : undefined;
    const itemId = target.edge?.itemId ?? target.itemId;
    const item = node && itemId ? [...list(node.raw.outcomes), ...list(node.raw.activities), ...list(node.raw.media)].map(record).find((item) => item.id === itemId) : undefined;
    const location = [node?.label, item ? text(item.label) || text(item.name) || text(item.caption) || text(item.altText) || text(item.id) : undefined].filter(Boolean).join(' / ');
    issues.set(id, { id, code, severity: code.startsWith('P') ? 'problem' : 'warning', ...target, editor: Boolean(node && !['start', 'multitask'].includes(node.kind)), location, ...(detail ? { detail } : {}) });
  }
  const parsed = graphSchema.safeParse(input);
  if (!parsed.success) for (const error of parsed.error.issues) {
    const path = error.path; const index = path[0] === 'nodes' && typeof path[1] === 'number' ? path[1] : undefined;
    const node = index === undefined ? undefined : rawVertices[index]; const field = text(path[2]) || text(path[0]) || 'graph';
    const media = field === 'media' || field === 'galleries';
    const required = ['title', 'text', 'question', 'heading', 'message', 'endKind'].includes(field);
    const code = media ? 'P12' : required ? 'P10' : field === 'outcomes' && (path.length === 3 || path[4] === 'label') ? 'P03' : field === 'activities' && path.length === 3 ? 'P06' : 'P11';
    const item = node && typeof path[3] === 'number' ? record(list(node.raw[field])[path[3]]) : undefined;
    add(code, { ...(node ? { nodeId: node.id } : {}), field, ...(item && text(item.id) ? { itemId: text(item.id) } : {}) });
  }
  const identities = new Map<string, IssueTarget>();
  function identity(value: unknown, target: IssueTarget) {
    const id = text(record(value).id); if (!id) return;
    if (identities.has(id)) { add('P11', identities.get(id), id); add('P11', target, id); } else identities.set(id, target);
  }
  const phases = list(graph.phases).map(record); for (const phase of phases) identity(phase, { field: 'phases', itemId: text(phase.id) });
  for (const id of Object.keys(record(record(graph.layout).positions))) if (!nodes.has(id)) add('P11', { field: 'layout', itemId: id });
  for (const node of vertices) {
    identity(node.raw, { nodeId: node.id, field: 'id' });
    for (const field of ['outcomes', 'activities', 'media']) for (const item of list(node.raw[field])) identity(item, { nodeId: node.id, field, itemId: text(record(item).id) });
    if (node.raw.phaseId != null && !phases.some((phase) => phase.id === node.raw.phaseId)) add('P11', { nodeId: node.id, field: 'phaseId' });
    if (node.kind !== 'start' && phases.length && !node.raw.phaseId) add('W05', { nodeId: node.id, field: 'phaseId' });
    const required = node.kind === 'instruction' || node.kind === 'alert' ? ['title', 'text'] : node.kind === 'decision' ? ['question'] : node.kind === 'end' ? ['heading', 'message', 'endKind'] : node.kind === 'multitask' ? ['title'] : [];
    for (const field of required) if (!normalize(node.raw[field])) add('P10', { nodeId: node.id, field });
    if (node.kind === 'decision') {
      const answers = list(node.raw.outcomes).map(record);
      if (answers.length < 2 || answers.length > 32) add('P03', { nodeId: node.id, field: 'outcomes' });
      for (const answer of answers) {
        if (!normalize(answer.label) || answers.some((other) => other !== answer && normalize(other.label) === normalize(answer.label))) add('P03', { nodeId: node.id, field: 'outcomes', itemId: text(answer.id) });
        else if (equivalent(answer.label) && answers.some((other) => other !== answer && equivalent(other.label) === equivalent(answer.label) && equivalent(record(other.note).text) === equivalent(record(answer.note).text))) add('W06', { nodeId: node.id, field: 'outcomes' });
      }
    }
    const media = list(node.raw.media).map(record); const validMedia = media.filter((item) => stepMediaSchema.safeParse(item).success);
    if (validMedia.some((item) => record(item.source).kind === 'remote')) { add('W01', { nodeId: node.id, field: 'media' }); add('W02', { nodeId: node.id, field: 'media' }); }
    if (validMedia.some((item) => !normalize(item.altText))) add('W04', { nodeId: node.id, field: 'media' });
    let large = false;
    for (const item of validMedia) {
      const source = record(item.source); if (source.kind !== 'local') continue;
      const fact = facts.assets?.get(text(source.assetId));
      if (!fact || fact.status !== 'available' || fact.mime !== undefined && fact.mime !== source.mime) add('W07', { nodeId: node.id, field: 'media', itemId: text(item.id) });
      if ((fact?.bytes ?? 0) >= LARGE_ASSET_BYTES) large = true;
    }
    if (large) add('W03', { nodeId: node.id, field: 'media' });
  }
  if ((facts.storageBytes ?? 0) >= LARGE_STORAGE_BYTES) add('W03', { field: 'storage' });
  const starts = vertices.filter((node) => node.kind === 'start');
  // Scope errors must not hide an independent cycle, including a detached cycle.
  const colors = new Map<string, number>();
  function cycle(id: string) {
    if (colors.get(id) === 2) return; colors.set(id, 1);
    for (const outlet of nodes.get(id)?.outlets ?? []) {
      const to = text(outlet.destination.nodeId); if (outlet.destination.kind !== 'node' || !nodes.has(to)) continue;
      if (colors.get(to) === 1) add('P08', { nodeId: id, edge: outlet.edge }); else if (!colors.has(to)) cycle(to);
    }
    colors.set(id, 2);
  }
  for (const node of vertices) if (!colors.has(node.id)) cycle(node.id);
  if (starts.length !== 1) add('P01', { ...(starts[0] ? { nodeId: starts[0].id } : {}), field: 'start' });
  for (const start of starts) {
    const first = start.outlets[0]; const target = nodes.get(text(first?.destination.nodeId));
    if (!first || first.destination.kind !== 'node' || !target || target.kind === 'start') add('P01', { nodeId: start.id, ...(first ? { edge: first.edge } : {}) });
  }
  const reachable = new Set<string>(); const owners = new Map<string, string>(); const active = new Set<string>(); const walked = new Set<string>();
  function visit(id: string, scope: string[], incoming?: Outlet) {
    const node = nodes.get(id); if (!node) return;
    reachable.add(id);
    const key = canonical(scope); const prior = owners.get(id);
    if (node.kind !== 'end' && prior !== undefined && prior !== key) { add('P07', { nodeId: incoming?.edge.nodeId ?? id, ...(incoming ? { edge: incoming.edge } : {}) }); return; }
    owners.set(id, key);
    if (active.has(id)) { add('P08', { nodeId: incoming?.edge.nodeId ?? id, ...(incoming ? { edge: incoming.edge } : {}) }); return; }
    if (walked.has(id)) return; walked.add(id); active.add(id);
    for (const outlet of node.outlets) {
      const { edge, destination } = outlet; const target: IssueTarget = { nodeId: id, edge };
      const nextScope = edge.slot === 'activity' ? [...scope, canonical([id, edge.itemId])] : scope;
      const to = nodes.get(text(destination.nodeId));
      if (destination.kind === 'broken' || destination.kind === 'node' && !to) { add('W08', target, text(destination.formerTitle) || text(destination.formerNodeId) || text(destination.nodeId)); continue; }
      if (destination.kind === 'unassigned') {
        if (node.kind === 'decision') add('P02', target);
        else if (node.kind === 'instruction' || node.kind === 'alert') add('P04', target);
        else if (edge.slot === 'activity') add('P06', target);
        else if (node.kind !== 'start') add('P05', target);
      }
      if (destination.kind === 'activity-complete' && (!nextScope.length || edge.slot === 'activity')) add('P07', target);
      if (!to || destination.kind !== 'node') continue;
      const authorized = to.kind === 'end' && ['stopped', 'escalation'].includes(text(to.raw.endKind)) && destination.terminateProcedure === true && nextScope.length > 0;
      if (destination.terminateProcedure && !authorized || to.kind === 'end' && nextScope.length && !authorized) add('P07', target);
      if (to.kind === 'start') add('P08', target);
      visit(to.id, nextScope, outlet);
    }
    active.delete(id);
  }
  for (const start of starts) visit(start.id, []);
  // Cycles and crossed activity scopes are invalid even in a detached component.
  const fromStart = new Set(reachable);
  const referenced = new Set(vertices.flatMap((node) => node.outlets.filter((outlet) => outlet.destination.kind === 'node').map((outlet) => text(outlet.destination.nodeId))));
  for (const node of vertices) if (!walked.has(node.id) && !referenced.has(node.id)) visit(node.id, []);
  for (const node of vertices) if (!walked.has(node.id) && node.kind === 'multitask') visit(node.id, []);
  for (const node of vertices) if (!walked.has(node.id)) visit(node.id, []);
  for (const node of vertices) if (!fromStart.has(node.id) && node.kind !== 'start') add('P09', { nodeId: node.id });
  // Unassigned continuations are reported only when reachable. Avoid cascades on the same outlet.
  for (const [id, issue] of issues) if (['P02', 'P04', 'P05'].includes(issue.code) && issue.nodeId && !fromStart.has(issue.nodeId)) issues.delete(id);
  const completed = new Map<string, boolean>();
  function completion(destination: RecordValue, seen: Set<string>): boolean {
    if (destination.kind === 'broken' || destination.kind === 'node' && !nodes.has(text(destination.nodeId))) return true; // W08, never duplicate as P06/P05.
    if (destination.kind === 'activity-complete') return true;
    if (destination.kind !== 'node') return false;
    const node = nodes.get(text(destination.nodeId))!;
    if (node.kind === 'end') return destination.terminateProcedure === true && ['stopped', 'escalation'].includes(text(node.raw.endKind));
    if (seen.has(node.id)) return false; const next = new Set(seen).add(node.id);
    const cached = completed.get(node.id); if (cached !== undefined) return cached;
    const outlets = node.kind === 'multitask' ? node.outlets.filter((outlet) => outlet.edge.slot === 'afterAll') : node.outlets;
    const result = outlets.length > 0 && outlets.every((outlet) => completion(outlet.destination, next)); completed.set(node.id, result); return result;
  }
  for (const node of vertices.filter((node) => node.kind === 'multitask')) {
    const activities = list(node.raw.activities).map(record);
    if (activities.length < 2 || activities.length > 32) add('P06', { nodeId: node.id, field: 'activities' });
    for (const activity of activities) {
      const edge: EdgeRef = { nodeId: node.id, slot: 'activity', itemId: text(activity.id) };
      if (!normalize(activity.name)) add('P10', { nodeId: node.id, edge, field: 'name' });
      if (!completion(record(activity.first), new Set()) || record(activity.first).kind === 'activity-complete') {
        // An exact P02/P04 in this activity already identifies its missing completion.
        const scope = canonical([node.id, activity.id]);
        const specific = [...issues.values()].some((issue) => ['P02', 'P04'].includes(issue.code) && issue.nodeId && (owners.get(issue.nodeId) ?? '').includes(JSON.stringify(scope)));
        if (!specific) add('P06', { nodeId: node.id, edge });
      }
    }
  }
  if (!vertices.some((node) => node.kind === 'end' && fromStart.has(node.id)) && ![...issues.values()].some((issue) => ['P01', 'P02', 'P04', 'P05', 'P06', 'P07', 'P08', 'W08'].includes(issue.code))) add('P05', { field: 'end' });
  const ordered = [...issues.values()].sort((a, b) => a.code < b.code ? -1 : a.code > b.code ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return { validatorSchemaVersion: VALIDATOR_VERSION, problems: ordered.filter((issue) => issue.severity === 'problem'), warnings: ordered.filter((issue) => issue.severity === 'warning') };
}
