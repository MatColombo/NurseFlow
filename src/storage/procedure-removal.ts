import type { Transaction } from 'dexie';

// Internal capability scoped to one checked transaction, never exposed by repositories.
const removals = new WeakMap<Transaction, string>();
export function authorizeProcedureRemoval(transaction: Transaction, procedureId: string) { removals.set(transaction, procedureId); }
export function canRemoveRevision(transaction: Transaction, procedureId: string) { return removals.get(transaction) === procedureId; }
