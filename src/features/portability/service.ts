import { createNurseFlowStorage } from '@storage/index';
import { version } from '../../../package.json';
import { importedReadyValidation, subsetRecords, validatePortableRecords } from '@domain/portability/validation';
import { candidateKey, candidates } from '@domain/portability/selection';
import { PackageError, PACKAGE_LIMITS, requirePackage } from '@domain/portability/zip';
import { createPackage, parsePackage, type ParsedPackage } from './codec';
export type StagedFile = { id: string; name: string; bytes: number; parsed: ParsedPackage };
export type FileFailure = { id: string; name: string; code: PackageError['code']; kind?: string };
export function createPortabilityService(storage = createNurseFlowStorage()) {
  return {
    async list() { await storage.open(); return storage.repositories.portability.list(); },
    async preview(id: string) { await storage.open(); return storage.repositories.portability.snapshot([id]); },
    async prepareExport(selected?: readonly string[]) {
      await storage.open(); const records = await storage.repositories.portability.snapshot(selected);
      const kind = selected && records.procedures.length === 1 ? 'procedure' : 'library';
      const blob = await createPackage(records, kind, { packageId: crypto.randomUUID(), exportedAt: new Date().toISOString(), appVersion: version });
      return { blob, kind, name: 'NurseFlow-' + new Date().toISOString().slice(0, 10) + (kind === 'procedure' ? '.nfproc' : '.nflib'), count: records.procedures.length,
        warnings: [...validatePortableRecords(records).values()].flat() };
    },
    async stage(files: readonly File[], previousBytes: number, previousCount: number) {
      const valid: StagedFile[] = []; const rejected: FileFailure[] = []; let total = previousBytes;
      for (const [index, file] of files.entries()) {
        const id = crypto.randomUUID();
        try {
          requirePackage(previousCount + index < PACKAGE_LIMITS.files && total + file.size <= PACKAGE_LIMITS.batchBytes, 'limit');
          const parsed = await parsePackage(file); total += file.size; valid.push({ id, name: file.name, bytes: file.size, parsed });
        } catch (error) { const failure = error instanceof PackageError ? error : new PackageError('schema'); rejected.push({ id, name: file.name, code: failure.code, ...(failure.kind ? { kind: failure.kind } : {}) }); }
      } return { valid, rejected };
    },
    async importSelected(files: readonly StagedFile[], selected: ReadonlySet<string>, confirmed: boolean) {
      requirePackage(confirmed && selected.size > 0, 'references');
      const known = new Set(files.flatMap((file) => file.parsed.records.procedures.map((procedure) => candidateKey(file.id, procedure.id))));
      requirePackage([...selected].every((key) => known.has(key)), 'references');
      const batches = files.map((file) => subsetRecords(file.parsed.records, new Set(file.parsed.records.procedures.filter((procedure) => selected.has(candidateKey(file.id, procedure.id))).map((procedure) => procedure.id))))
        .filter((records) => records.procedures.length);
      batches.forEach(validatePortableRecords); await storage.open(); return storage.commands.addImportedRecords(batches, importedReadyValidation);
    },
  };
}
export const portabilityService = createPortabilityService();
export const stagedCandidates = (files: readonly StagedFile[]) => files.flatMap((file) => candidates(file.parsed.records, file.id, file.name, file.parsed.warnings));
export type PortableLibrary = Awaited<ReturnType<typeof portabilityService.list>>;
