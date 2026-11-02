import type { NurseFlowDatabase } from '../db';
import { defaultEnvironment, type CommandEnvironment } from './context';
import { draftCommands } from './drafts';
import { readyCommands } from './ready';
import { runCommands } from './runs';
import { importCommands } from './imports';
import { appearanceCommands } from './appearance';
import { libraryCommands } from './library';
import { procedureCommands } from './procedures';
import { builderCommands } from './builder';
import { checkCommands } from './check';
import { previewCommands } from './preview';
import { settingsCommands } from './settings';
import { trackCommands } from '../activity';
export type { CheckedDraft } from './check';

export type { ReadyValidator, ReadyValidation, CommandEnvironment } from './context';
export function createCommands(db: NurseFlowDatabase, environment: CommandEnvironment = defaultEnvironment) {
  return trackCommands({ ...draftCommands(db, environment), ...readyCommands(db, environment), ...runCommands(db, environment), ...previewCommands(db, environment),
    ...importCommands(db, environment), ...appearanceCommands(db), ...libraryCommands(db, environment), ...procedureCommands(db, environment), ...builderCommands(db, environment), ...checkCommands(db, environment), ...settingsCommands(db) });
}
