import { Dexie, type Table } from 'dexie';
import type { Group, LibraryViewState, MediaAsset, Procedure, Revision, RunSession, Settings } from '@domain/model';
import { settingsSchema, uiPreferencesSchema } from '@domain/model';
import { ImmutableRecordError } from '@domain/model/errors';
import { configureMigrations } from './migrations/schema';
import { canRemoveRevision } from './procedure-removal';
import type { BuilderState } from '@domain/builder/model';

/** Internal persistence implementation. Features import storage/index instead. */
export class NurseFlowDatabase extends Dexie {
  declare procedures: Table<Procedure, string>;
  declare groups: Table<Group, string>;
  declare revisions: Table<Revision, string>;
  declare mediaAssets: Table<MediaAsset, string>;
  declare runSessions: Table<RunSession, string>;
  declare settings: Table<Settings, string>;
  declare uiPreferences: Table<LibraryViewState, string>;
  declare builderStates: Table<BuilderState, string>;

  constructor(name = 'NurseFlowDB') {
    super(name);
    configureMigrations(this);
    this.on('populate', async () => {
      await this.settings.add(settingsSchema.parse({}));
      await this.uiPreferences.add(uiPreferencesSchema.parse({}));
    });
    // Install write guards after the versionchange transaction has completed.
    // Migrations are reviewed DB code; ordinary transactions never bypass guards.
    this.on('ready', () => {
      this.revisions.hook('updating', (_changes, _id, revision) => {
        if (revision.state === 'ready') throw new ImmutableRecordError('Ready snapshots are write-once');
      });
      this.revisions.hook('deleting', (_id, revision, transaction) => {
        if (revision.state === 'ready' && !canRemoveRevision(transaction, revision.procedureId)) throw new ImmutableRecordError('Ready snapshots cannot be deleted');
      });
      this.mediaAssets.hook('updating', () => { throw new ImmutableRecordError('Media assets are write-once'); });
      this.mediaAssets.hook('deleting', () => { throw new ImmutableRecordError('Asset GC is not enabled in F01'); });
    });
    this.on('versionchange', () => this.close());
  }
}
