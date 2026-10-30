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

export type { ReadyValidator, ReadyValidation, CommandEnvironment } from './context';
export function createCommands(db: NurseFlowDatabase, environment: CommandEnvironment = defaultEnvironment) {
  return { ...draftCommands(db, environment), ...readyCommands(db, environment), ...runCommands(db),
    ...importCommands(db, environment), ...appearanceCommands(db), ...libraryCommands(db, environment), ...procedureCommands(db, environment), ...builderCommands(db, environment) };
}
