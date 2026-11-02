import type { Transaction } from 'dexie';
const authorized = new WeakSet<Transaction>();
/** Internal capability; only the confirmed whole-data command may bypass write-once deletion guards. */
export function authorizeLocalDataRemoval(transaction: Transaction) { authorized.add(transaction); }
export function canClearLocalData(transaction: Transaction) { return authorized.has(transaction); }
