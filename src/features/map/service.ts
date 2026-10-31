import { createNurseFlowStorage } from '@storage/index';
import { invariant, uniqueIds } from '@domain/model/integrity';
import type { Revision } from '@domain/model';
import type { ExecutionRun } from '@domain/runtime';

export interface MapRequest { procedureId: string; revisionId?: string; runId?: string; previewId?: string }
export interface MapData { title: string; revision: Revision; run?: ExecutionRun; preview: boolean; returnPath: string }
/** No commands, resume/upgrade, record-open, layout saves, or session creation. */
export function createMapService(storage = createNurseFlowStorage()) {
  return { async read({ procedureId, revisionId, runId, previewId }: MapRequest): Promise<MapData> {
    await storage.open(); invariant(!(runId && previewId), 'Ambiguous map context');
    if (runId || previewId) {
      invariant(revisionId, 'Pinned revision required');
      const data = runId ? await storage.repositories.runtime.get(runId) : await storage.repositories.preview.get(revisionId);
      invariant(data.run.procedureId === procedureId && data.revision.id === revisionId &&
        data.run.id === (runId ?? previewId), 'Map run mismatch');
      return { ...data, returnPath: `/run/${encodeURIComponent(data.preview ? procedureId : data.run.id)}${data.run.status === 'ended' ? '/end' : ''}${data.preview ? `?preview=draft&revision=${encodeURIComponent(data.revision.id)}` : ''}` };
    }
    const data = await storage.repositories.map.get(procedureId, revisionId); uniqueIds(data.revision.graph.nodes);
    return { ...data, preview: false, returnPath: `/procedure/${encodeURIComponent(procedureId)}` };
  } };
}
export const mapService = createMapService();
