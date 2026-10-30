import type { Activity, Graph, Node } from '../model';
import { cloneProcedureGraph } from '../procedures';
import { detachedOutlets } from './edits';
import { requireEdit, type EdgeRef } from './model';
import { activityScopeKey, assertEditableGraph, destinationAt, incoming, nodeAt, setDestination } from './structure';

export type ClipSelection = { kind: 'node'; nodeId: string } | { kind: 'activity'; nodeId: string; activityId: string };
export type GraphClip = {
  mode: 'copy' | 'cut'; procedureId: string; revisionId: string; editVersion: number;
  graph: Graph; selection: ClipSelection;
};
export type PasteTarget = { kind: 'edge'; edge: EdgeRef } | { kind: 'activity-list'; nodeId: string };
function prefixMatches(scope: readonly string[], prefix: readonly string[]) { return prefix.every((token, index) => scope[index] === token); }
export function clipRegion(clip: GraphClip) {
  const owners = assertEditableGraph(clip.graph); const selected = nodeAt(clip.graph, clip.selection.nodeId);
  let activity: Activity | undefined; let prefixes: string[][] = [];
  const parent = owners.get(selected.id) ?? [];
  if (clip.selection.kind === 'activity') {
    requireEdit(selected.kind === 'multitask'); const activityId = clip.selection.activityId;
    activity = selected.activities.find((item) => item.id === activityId); requireEdit(activity);
    prefixes = [[...parent, activityScopeKey(selected.id, activity.id)]];
  } else {
    requireEdit(selected.kind !== 'start');
    if (selected.kind === 'multitask') prefixes = selected.activities.map((item) => [...parent, activityScopeKey(selected.id, item.id)]);
  }
  const ids = new Set([...owners].filter(([, scope]) => prefixes.some((prefix) => prefixMatches(scope, prefix))).map(([id]) => id));
  if (!activity) ids.add(selected.id);
  // Include private authored exceptional Ends; shared boundary destinations remain outside.
  for (const node of clip.graph.nodes) if (prefixes.length > 0 && node.kind === 'end') {
    const inbound = incoming(clip.graph, node.id);
    if (inbound.length && inbound.every((item) => ids.has(item.edge.nodeId) && item.destination.kind === 'node' && item.destination.terminateProcedure)) ids.add(node.id);
  }
  return { selected, activity, ids };
}
export function assertMovable(clip: GraphClip) {
  const region = clipRegion(clip);
  const external = [...region.ids].flatMap((id) => incoming(clip.graph, id).filter((item) => !region.ids.has(item.edge.nodeId)));
  if (clip.selection.kind === 'node') requireEdit(external.length <= 1 &&
    external.every((item) => item.destination.kind === 'node' && item.destination.nodeId === region.selected.id), 'shared');
  else requireEdit(external.every((item) => item.edge.nodeId === clip.selection.nodeId && item.edge.itemId === region.activity?.id), 'shared');
  return region;
}
export function pasteGraph(source: Graph, target: PasteTarget, clip: GraphClip, context: {
  procedureId: string; revisionId: string; editVersion: number; newId(): string;
}): Graph {
  const moving = clip.mode === 'cut';
  if (moving) {
    requireEdit(clip.procedureId === context.procedureId && clip.revisionId === context.revisionId, 'moveScope');
    requireEdit(clip.editVersion === context.editVersion && JSON.stringify(clip.graph) === JSON.stringify(source), 'stale');
  }
  const region = moving ? assertMovable(clip) : clipRegion(clip); const graph = structuredClone(source);
  requireEdit((target.kind === 'activity-list') === (clip.selection.kind === 'activity'), 'clipboard');
  if (moving && target.kind === 'edge') requireEdit(!region.ids.has(target.edge.nodeId), 'cycle');
  let nodes: Node[]; let activity: Activity | undefined; let entryId = region.selected.id;
  if (moving) {
    nodes = graph.nodes.filter((node) => region.ids.has(node.id));
    activity = region.activity ? structuredClone(region.activity) : undefined;
    if (activity) {
      const parent = nodeAt(graph, clip.selection.nodeId); requireEdit(parent.kind === 'multitask');
      parent.activities = parent.activities.filter((item) => item.id !== activity!.id);
    } else {
      const sourceEdge = incoming(graph, region.selected.id)[0]; const node = nodeAt(graph, region.selected.id);
      const exit = 'next' in node ? node.next : node.kind === 'multitask' ? node.afterAll : { kind: 'unassigned' as const };
      if (sourceEdge) setDestination(graph, sourceEdge.edge, sourceEdge.edge.slot === 'activity' && exit.kind === 'activity-complete' ?
        { kind: 'unassigned' } : structuredClone(exit));
    }
  } else {
    nodes = structuredClone(clip.graph.nodes.filter((node) => region.ids.has(node.id)));
    for (const node of nodes) detachedOutlets(node, region.ids);
    const phaseIds = new Set(nodes.flatMap((node) => 'phaseId' in node && node.phaseId ? [node.phaseId] : []));
    const phases = clip.graph.phases.filter((phase) => phaseIds.has(phase.id));
    // A temporary shell carries the copied activity's entry through the same ID remapper.
    const shellId = context.newId();
    if (region.activity) {
      activity = structuredClone(region.activity);
      if (activity.first.kind === 'node' && !region.ids.has(activity.first.nodeId)) activity.first = { kind: 'unassigned' };
      nodes.push({ id: shellId, kind: 'multitask', title: '', activities: [activity], afterAll: { kind: 'unassigned' } });
    }
    const copied = cloneProcedureGraph({ schemaVersion: 1, nodes, phases }, context.newId);
    if (activity) {
      const shell = copied.nodes[nodes.length - 1]!; requireEdit(shell.kind === 'multitask');
      activity = shell.activities[0]!; nodes = copied.nodes.slice(0, -1);
    } else { entryId = copied.nodes.find((_, index) => nodes[index]?.id === region.selected.id)!.id; nodes = copied.nodes; }
    graph.phases.push(...copied.phases.map((phase, index) => ({ ...phase, order: graph.phases.length + index })));
    graph.nodes.push(...nodes);
  }
  if (target.kind === 'activity-list') {
    const parent = nodeAt(graph, target.nodeId); requireEdit(parent.kind === 'multitask' && activity);
    requireEdit(parent.activities.length < 32, 'limit');
    parent.activities.push({ ...activity, order: parent.activities.length });
    for (const node of graph.nodes) if (node.kind === 'multitask') node.activities.sort((a, b) => a.order - b.order).forEach((item, order) => { item.order = order; });
  } else {
    const old = destinationAt(graph, target.edge); const entry = nodeAt(graph, entryId);
    if ('next' in entry) entry.next = structuredClone(old);
    else if (entry.kind === 'multitask') entry.afterAll = structuredClone(old);
    setDestination(graph, target.edge, { kind: 'node', nodeId: entry.id });
  }
  assertEditableGraph(graph); return graph;
}
