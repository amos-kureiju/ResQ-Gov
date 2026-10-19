import type { AppState, AuditEntry } from '../types';
import { hash } from '../utils/format';

export const GENESIS_HASH = '00000000000000';

type AuditInput = Omit<AuditEntry, 'seq' | 'prevHash' | 'hash'>;

function payload(e: Omit<AuditEntry, 'hash'>): string {
  return [e.seq, e.at, e.actorId, e.role, e.action, e.target, e.detail, e.flagged ? 1 : 0, e.prevHash].join('|');
}

/** Menambahkan entri audit (append-only) dengan rantai hash. Mutasi in-place pada draft state. */
export function appendAudit(state: AppState, input: AuditInput): AuditEntry {
  const prev = state.audit[state.audit.length - 1];
  const base: Omit<AuditEntry, 'hash'> = {
    ...input,
    seq: prev ? prev.seq + 1 : 1,
    prevHash: prev ? prev.hash : GENESIS_HASH,
  };
  const entry: AuditEntry = { ...base, hash: hash(payload(base)) };
  state.audit.push(entry);
  return entry;
}

export interface IntegrityResult {
  valid: boolean;
  checked: number;
  brokenAt?: number;
  reason?: string;
}

/** Memverifikasi seluruh rantai hash audit log (R-09). */
export function verifyAuditChain(audit: AuditEntry[]): IntegrityResult {
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < audit.length; i++) {
    const e = audit[i];
    if (e.seq !== i + 1) return { valid: false, checked: i, brokenAt: e.seq, reason: 'Nomor urut terputus (ada entri yang dihapus/disisipkan).' };
    if (e.prevHash !== prevHash) return { valid: false, checked: i, brokenAt: e.seq, reason: 'Hash sebelumnya tidak cocok.' };
    const { hash: h, ...rest } = e;
    if (hash(payload(rest)) !== h) return { valid: false, checked: i, brokenAt: e.seq, reason: 'Isi entri telah diubah.' };
    prevHash = h;
  }
  return { valid: true, checked: audit.length };
}
