import type { Revision } from '../model';
import { metadataSchema } from '../procedures';
import { validateGraph, type Issue } from '../validation/validator';
import { assertImportedReferences, assetReferences, type ImportedRecords } from './records';
import { PackageError, requirePackage } from './zip';
import { assertEditableGraph } from '../builder/structure';
export function importedReadyValidation(revision: Revision, ids: ReadonlySet<string>) {
  const result = validateGraph(revision.graph, { assets: new Map([...ids].map((id) => [id, { status: 'available' as const }])) });
  return { validatorSchemaVersion: result.validatorSchemaVersion, problems: result.problems.map((issue) => issue.code),
    warnings: result.warnings.map((issue) => ({ rule: issue.code as `W0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`, ...(issue.nodeId ? { locationId: issue.nodeId } : {}) })) };
}
export function validatePortableRecords(records: ImportedRecords): Map<string, Issue[]> {
  try { assertImportedReferences(records); records.procedures.forEach((procedure) => metadataSchema.shape.ribbon.parse(procedure.ribbon)); }
  catch { throw new PackageError('references'); }
  const assets = new Map(records.mediaAssets.map((asset) => [asset.id, { status: 'available' as const, bytes: asset.bytes, mime: asset.mime }]));
  const warnings = new Map<string, Issue[]>();
  for (const revision of records.revisions) {
    requirePackage(revision.graph.nodes.length <= 10_000 && revision.graph.phases.length <= 10_000, 'limit');
    try { assertEditableGraph(revision.graph); } catch { throw new PackageError('references'); }
    for (const node of revision.graph.nodes) {
      requirePackage(!(node.kind === 'decision' && node.outcomes.length > 32 || node.kind === 'multitask' && node.activities.length > 32), 'schema');
      if ('media' in node) for (const item of node.media) if (item.source.kind === 'local') {
        const asset = assets.get(item.source.assetId); requirePackage(!asset || asset.mime === item.source.mime, 'media');
      }
    }
    const result = validateGraph(revision.graph, { assets });
    requirePackage(!result.problems.some((issue) => ['P07', 'P08', 'P11', 'P12'].includes(issue.code)), 'references');
    requirePackage(revision.state !== 'ready' || result.problems.length === 0, 'ready'); warnings.set(revision.id, result.warnings);
  }
  const used = new Set(records.revisions.flatMap((revision) => assetReferences(revision.graph)));
  requirePackage(records.mediaAssets.every((asset) => used.has(asset.id)), 'references');
  return warnings;
}
export function subsetRecords(records: ImportedRecords, selected: ReadonlySet<string>, emptyGroups = false): ImportedRecords {
  const procedures = records.procedures.filter((procedure) => selected.has(procedure.id));
  const ids = new Set(procedures.map((procedure) => procedure.id)); const revisions = records.revisions.filter((revision) => ids.has(revision.procedureId));
  const groups = new Set(procedures.flatMap((procedure) => procedure.groupId ? [procedure.groupId] : [])); const assets = new Set(revisions.flatMap((revision) => assetReferences(revision.graph)));
  return { procedures, revisions, groups: records.groups.filter((group) => emptyGroups || groups.has(group.id)), mediaAssets: records.mediaAssets.filter((asset) => assets.has(asset.id)), runSessions: [] };
}
