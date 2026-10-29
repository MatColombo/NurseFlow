import { z } from 'zod';
import { groupSchema, mediaAssetSchema, procedureSchema, revisionSchema, runSessionSchema } from '@domain/model';
import type { Destination, Graph, Procedure, Revision, RunSession } from '@domain/model';
import { assertGraphReferences, assertRunReferences, invariant, uniqueIds } from '@domain/model/integrity';

// Internal record staging only. Archive parsing/security and scope routing are F13/F14.
// Settings intentionally cannot be passed to this additive command.
export const importedRecordsSchema = z.strictObject({
  procedures: z.array(procedureSchema), groups: z.array(groupSchema), revisions: z.array(revisionSchema),
  mediaAssets: z.array(mediaAssetSchema), runSessions: z.array(runSessionSchema),
});
export type ImportedRecords = z.infer<typeof importedRecordsSchema>;

export function assertImportedReferences(records: ImportedRecords): void {
  const procedures = new Map(records.procedures.map((record) => [record.id, record]));
  const revisions = new Map(records.revisions.map((record) => [record.id, record]));
  const groups = uniqueIds(records.groups);
  uniqueIds(records.procedures); uniqueIds(records.revisions);
  uniqueIds(records.mediaAssets); uniqueIds(records.runSessions);
  for (const procedure of records.procedures) {
    invariant(procedure.groupId === null || groups.has(procedure.groupId), 'Unknown imported group');
    invariant(procedure.workingDraftId !== undefined || procedure.readyRevisionId !== undefined, 'Imported procedure has no revision');
    for (const [id, state] of [[procedure.workingDraftId, 'working-draft'], [procedure.readyRevisionId, 'ready']] as const) {
      if (id !== undefined) invariant(revisions.get(id)?.procedureId === procedure.id && revisions.get(id)?.state === state,
        'Invalid imported revision pointer');
    }
  }
  for (const revision of records.revisions) {
    invariant(procedures.has(revision.procedureId), 'Unknown revision owner');
    assertGraphReferences(revision.graph);
  }
  for (const run of records.runSessions) {
    const revision = revisions.get(run.pinnedRevisionId);
    invariant(procedures.has(run.procedureId) && revision, 'Unknown imported pinned revision');
    assertRunReferences(run, revision);
  }
}

function graphIdentities(graph: Graph): string[] {
  return [...graph.phases.map((phase) => phase.id), ...graph.nodes.flatMap((node) => [node.id,
    ...(node.kind === 'decision' ? node.outcomes.map((outcome) => outcome.id) : []),
    ...(node.kind === 'multitask' ? node.activities.map((activity) => activity.id) : []),
    ...('media' in node ? node.media.map((media) => media.id) : []),
  ])];
}
export function assetReferences(graph: Graph): string[] {
  return graph.nodes.flatMap((node) => 'media' in node ? node.media.flatMap((media) =>
    media.source.kind === 'local' ? [media.source.assetId] : []) : []);
}
function mapped(map: ReadonlyMap<string, string>, id: string): string {
  const value = map.get(id);
  invariant(value !== undefined, `Unmapped reference: ${id}`);
  return value;
}

/** Each array item is an independent source file, even if source IDs coincide. */
export function prepareImportedRecords(input: unknown, newId: () => string): ImportedRecords[] {
  const batches = z.array(importedRecordsSchema).parse(input);
  batches.forEach(assertImportedReferences);
  const sourceIds = new Set(batches.flatMap((batch) => [
    ...batch.procedures.map((item) => item.id), ...batch.groups.map((item) => item.id),
    ...batch.revisions.map((item) => item.id), ...batch.mediaAssets.map((item) => item.id),
    ...batch.runSessions.map((item) => item.id),
    ...batch.revisions.flatMap((item) => [...graphIdentities(item.graph), ...assetReferences(item.graph)]),
  ]));
  const generated = new Set<string>();
  const freshId = () => {
    const id = newId();
    invariant(id.length > 0 && !sourceIds.has(id) && !generated.has(id), 'ID generator did not produce a fresh identity');
    generated.add(id);
    return id;
  };
  return batches.map((batch) => {
    const procedureIds = new Map(batch.procedures.map((item) => [item.id, freshId()]));
    const revisionIds = new Map(batch.revisions.map((item) => [item.id, freshId()]));
    const usedGroups = new Set(batch.procedures.flatMap((item) => item.groupId === null ? [] : [item.groupId]));
    const groupIds = new Map([...usedGroups].map((id) => [id, freshId()]));
    // Allocate missing asset references too (W07) without inventing a Blob.
    const usedAssets = new Set(batch.revisions.flatMap((revision) => assetReferences(revision.graph)));
    const assetIds = new Map([...usedAssets].map((id) => [id, freshId()]));
    const internalIdsByProcedure = new Map(batch.procedures.map((procedure) => {
      const ids = new Set(batch.revisions.filter((revision) => revision.procedureId === procedure.id)
        .flatMap((revision) => graphIdentities(revision.graph)));
      return [procedure.id, new Map([...ids].map((id) => [id, freshId()]))];
    }));
    const graphMap = (procedureId: string) => {
      const map = internalIdsByProcedure.get(procedureId);
      invariant(map, 'Unknown imported procedure');
      return map;
    };
    const remapGraph = (graph: Graph, ids: Map<string, string>): Graph => {
      const destination = (value: Destination) => value.kind === 'node' ?
        { ...value, nodeId: mapped(ids, value.nodeId) } : { ...value };
      return {
        ...graph,
        phases: graph.phases.map((phase) => ({ ...phase, id: mapped(ids, phase.id) })),
        nodes: graph.nodes.map((node) => {
          const common = { id: mapped(ids, node.id),
            ...('phaseId' in node && node.phaseId != null ? { phaseId: mapped(ids, node.phaseId) } : {}) };
          switch (node.kind) {
            case 'start': return { ...node, ...common, next: destination(node.next) };
            case 'instruction': case 'alert': case 'decision': {
              const media = node.media.map((item) => ({ ...item, id: mapped(ids, item.id), source: item.source.kind === 'local' ?
                { ...item.source, assetId: mapped(assetIds, item.source.assetId) } : { ...item.source } }));
              if (node.kind === 'decision') return { ...node, ...common, kind: node.kind, media,
                outcomes: node.outcomes.map((outcome) => ({ ...outcome, id: mapped(ids, outcome.id), destination: destination(outcome.destination) })) };
              return { ...node, ...common, kind: node.kind, media, next: destination(node.next) };
            }
            case 'multitask': return { ...node, ...common, kind: node.kind, afterAll: destination(node.afterAll),
              activities: node.activities.map((activity) => ({ ...activity, id: mapped(ids, activity.id), first: destination(activity.first) })) };
            case 'end': return { ...node, ...common, kind: node.kind };
          }
        }),
        ...(graph.layout ? { layout: { positions: Object.fromEntries(Object.entries(graph.layout.positions)
          .map(([id, position]) => [mapped(ids, id), { ...position }])) } } : {}),
      };
    };
    const remapRun = (run: RunSession): RunSession => {
      const ids = graphMap(run.procedureId);
      const id = (value: string) => mapped(ids, value);
      return { ...run, id: freshId(), procedureId: mapped(procedureIds, run.procedureId),
        pinnedRevisionId: mapped(revisionIds, run.pinnedRevisionId), currentNodeId: id(run.currentNodeId),
        visited: run.visited.map((visit) => ({ ...visit, nodeId: id(visit.nodeId),
          ...(visit.outcomeId !== undefined ? { outcomeId: id(visit.outcomeId) } : {}),
          ...(visit.previousActivityId !== undefined ? { previousActivityId: id(visit.previousActivityId) } : {}) })),
        multitaskProgress: Object.fromEntries(Object.entries(run.multitaskProgress).map(([nodeId, progress]) => [id(nodeId), {
          completedActivityIds: progress.completedActivityIds.map(id),
          cursorByActivityId: Object.fromEntries(Object.entries(progress.cursorByActivityId).map(([activityId, cursor]) => [id(activityId), id(cursor)])),
          pathByActivityId: Object.fromEntries(Object.entries(progress.pathByActivityId).map(([activityId, path]) => [id(activityId), path.map(id)])),
        }])),
        ...(run.terminalEndNodeId !== undefined ? { terminalEndNodeId: id(run.terminalEndNodeId) } : {}),
      };
    };
    const records = importedRecordsSchema.parse({
      procedures: batch.procedures.map((procedure): Procedure => ({ ...procedure, id: mapped(procedureIds, procedure.id),
        groupId: procedure.groupId === null ? null : mapped(groupIds, procedure.groupId),
        ...(procedure.workingDraftId !== undefined ? { workingDraftId: mapped(revisionIds, procedure.workingDraftId) } : {}),
        ...(procedure.readyRevisionId !== undefined ? { readyRevisionId: mapped(revisionIds, procedure.readyRevisionId) } : {}),
      })),
      groups: batch.groups.filter((group) => usedGroups.has(group.id)).map((group) => ({ ...group, id: mapped(groupIds, group.id) })),
      revisions: batch.revisions.map((revision): Revision => ({ ...revision, id: mapped(revisionIds, revision.id),
        procedureId: mapped(procedureIds, revision.procedureId), graph: remapGraph(revision.graph, graphMap(revision.procedureId)),
        ...(revision.state === 'ready' ? { warningsAtConfirmation: revision.warningsAtConfirmation.map((warning) => ({ ...warning,
          ...(warning.locationId !== undefined ? { locationId: mapped(new Map([...assetIds, ...graphMap(revision.procedureId)]), warning.locationId) } : {}) })) } : {}),
      })),
      mediaAssets: batch.mediaAssets.filter((asset) => usedAssets.has(asset.id)).map((asset) => ({ ...asset, id: mapped(assetIds, asset.id) })),
      runSessions: batch.runSessions.map(remapRun),
    });
    assertImportedReferences(records);
    return records;
  });
}
