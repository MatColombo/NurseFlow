import { settingsSchema, type Settings, type Revision } from '@domain/model';
import { createRun, reduceRun, unwrap, type ExecutionRun, type RunEvent } from '@domain/runtime';
import { portableRecords } from './portable';
import { fixtureDate, multitaskGraph } from './domain';
import { validateGraph } from '@domain/validation/validator';
export const importedSettings = (): Settings => settingsSchema.parse({ locale: 'en', theme: 'dark', uiScalePt: 20, photoPreset: 'high', mediaAddSoftLimit: { enabled: false, max: 7 } });
export async function fullBackupRecords() {
  const records = await portableRecords(3); const or = records.revisions.find((revision) => revision.id === 'r-0')!;
  const and = records.revisions.find((revision) => revision.id === 'r-1')!; and.graph = multitaskGraph();
  for (const node of and.graph.nodes) if (node.kind === 'instruction') node.title = 'Cartoncino ' + node.id.slice(-1);
  const broken = records.revisions.find((revision) => revision.id === 'r-2')!;
  const decision = broken.graph.nodes.find((node) => node.kind === 'decision')!;
  if (decision.kind === 'decision') decision.outcomes[0]!.destination = { kind: 'broken', formerNodeId: 'removed-card', formerTitle: 'Carta rimossa' };
  broken.graph.nodes = broken.graph.nodes.filter((node) => node.id !== 'a-step');
  // The current Ready differs from both pinned historical revisions.
  for (const revision of [or, and]) {
    const latest = structuredClone(revision); latest.id += '-latest'; latest.revisionNumber = 3;
    const instruction = latest.graph.nodes.find((node) => node.kind === 'instruction'); if (instruction?.kind === 'instruction') instruction.text = 'Nuova revisione, non la sessione pinnata.';
    records.revisions.push(latest); records.procedures.find((procedure) => procedure.id === revision.procedureId)!.readyRevisionId = latest.id;
  }
  function route(revision: Revision, id: string, events: RunEvent[]) {
    let run = unwrap(createRun(revision, id, fixtureDate));
    for (const event of events) run = unwrap(reduceRun(run, revision, event, fixtureDate)) as ExecutionRun;
    return run;
  }
  records.runSessions = [route(or, 'run-or', [{ type: 'choose-outcome', outcomeId: 'a' }, { type: 'continue' }]),
    route(and, 'run-and', [{ type: 'finish-activity' }, { type: 'switch-activity', activityId: 'activity-3' }]),
    route(broken, 'run-broken', [{ type: 'choose-outcome', outcomeId: 'a' }])];
  for (const revision of records.revisions) if (revision.state === 'ready') { const checked = validateGraph(revision.graph); if (checked.problems.length) throw new Error(revision.id + ': ' + JSON.stringify(checked.problems)); }
  return records;
}
