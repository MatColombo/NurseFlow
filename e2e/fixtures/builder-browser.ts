import { NurseFlowDatabase } from '../../src/storage/db';
import { createCommands } from '../../src/storage/commands';
import { createRepositories } from '../../src/storage/repositories';
import { exampleRecords } from '../../src/test/fixtures/domain';
import { activitiesGraph, outlineGraph, outcomesGraph } from '../../src/test/fixtures/builder';
import type { Graph } from '../../src/domain/model';
export async function seedBuilder() {
  const db = new NurseFlowDatabase(); await db.open();
  try {
    const commands = createCommands(db); await commands.completeFirstLaunch();
    const graphs: [string, Graph, boolean][] = [['procedure', outlineGraph(), true], ['ready-only', outlineGraph(), false],
      ['multi', activitiesGraph(), true], ['many', activitiesGraph(32), true]];
    await db.groups.bulkAdd(exampleRecords().groups);
    for (const [id, graph, working] of graphs) {
      const records = exampleRecords(graph); const procedure = records.procedures[0]!; const ready = records.revisions[0]!;
      procedure.id = id; procedure.title = 'Esempio ' + id; procedure.readyRevisionId = id + '-ready';
      ready.procedureId = id; ready.id = procedure.readyRevisionId;
      await db.revisions.add(ready); await db.procedures.add(procedure);
      if (working) await commands.createDraft({ procedureId: id });
    }
    const decisionDraft = await commands.createDraft({ metadata: { title: '32 esiti fittizi' }, graph: outcomesGraph() });
    const blank = await commands.createDraft({ metadata: { title: 'Vuota' } }); return { blankId: blank.procedure.id, decisionsId: decisionDraft.procedure.id };
  } finally { db.close(); }
}
export async function readBuilder(id: string) {
  const db = new NurseFlowDatabase(); await db.open();
  try { const loaded = await createRepositories(db).builder.get(id);
    return { ...loaded, ready: loaded.procedure.readyRevisionId ? await db.revisions.get(loaded.procedure.readyRevisionId) : undefined,
      runs: await db.runSessions.where('procedureId').equals(id).toArray(), version: db.verno };
  } finally { db.close(); }
}
