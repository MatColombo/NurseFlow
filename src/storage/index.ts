import { NurseFlowDatabase } from './db';
import { createCommands } from './commands';
import { createRepositories } from './repositories';

export type { ReadyValidator, ReadyValidation } from './commands';
export { assertDecodable } from './media-validation';
/** Composition root; no DB is opened or seeded on module import. */
export function createNurseFlowStorage(name = 'NurseFlowDB') {
  const db = new NurseFlowDatabase(name);
  return {
    commands: createCommands(db), repositories: createRepositories(db),
    async open() { await db.open(); }, close() { db.close(); },
  };
}
