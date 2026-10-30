import { procedureSchema, draftRevisionSchema, readyRevisionSchema, type Procedure, type Revision } from '@domain/model';
import { convergenceGraph, fixtureDate } from './domain';

/** Synthetic local data, bundled only by tests; never inserted by the application. */
export function libraryFixture() {
  const groups = [
    { id: 'materials', name: 'Materiali', order: 0, createdAt: fixtureDate },
    { id: 'exercises', name: 'Esercizi', order: 1, createdAt: fixtureDate },
    { id: 'empty', name: 'Vuoto', order: 2, createdAt: fixtureDate },
  ];
  const procedures: Procedure[] = []; const revisions: Revision[] = [];
  for (let index = 0; index < 26; index++) {
    const id = `fixture-${index}`; const ready = index % 3 === 0;
    const title = index === 0 ? 'Cartoncini àlfa' : index === 1 ? 'Scatole beta' : index === 2 ? 'Esempio gamma'
      : index === 23 ? `Titolo fittizio molto lungo ${'cartoncino '.repeat(14)}` : `Procedura fittizia ${String(index).padStart(2, '0')}`;
    procedures.push(procedureSchema.parse({ id, title, groupId: index % 2 ? 'exercises' : 'materials',
      tags: index % 2 ? ['rosso'] : ['blu', 'esempio'], aliases: index === 0 ? ['sinonimo speciale'] : [],
      description: index === 1 ? 'Descrizione contenitore' : 'Esempio senza contenuto clinico',
      priority: index % 3, favorite: index === 0, ribbon: { colorKey: index % 2 ? 'blue' : 'purple', iconKey: 'procedure' },
      createdAt: fixtureDate, updatedAt: fixtureDate, workingDraftId: `${id}-draft`,
      ...(ready ? { readyRevisionId: `${id}-ready` } : {}),
      ...(index < 22 || index === 25 ? { lastOpenedAt: `2026-10-29T10:${String(index).padStart(2, '0')}:00.000Z` } : {}),
      ...(index === 25 ? { archived: true } : {}),
    }));
    revisions.push(draftRevisionSchema.parse({ id: `${id}-draft`, procedureId: id, state: 'working-draft', revisionNumber: 1,
      editVersion: 1, graph: convergenceGraph(), createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 0 }));
    if (ready) revisions.push(readyRevisionSchema.parse({ id: `${id}-ready`, procedureId: id, state: 'ready', revisionNumber: 1,
      editVersion: 1, graph: convergenceGraph(), createdAt: fixtureDate, updatedAt: fixtureDate, validatorSchemaVersion: 1,
      confirmedForPersonalUseAt: fixtureDate, warningsAtConfirmation: [] }));
  }
  return { groups, procedures, revisions };
}
