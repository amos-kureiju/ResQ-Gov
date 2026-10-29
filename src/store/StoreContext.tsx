// ============================================================
// ResQ-Gov — Store (state + lapisan penegakan aturan bisnis)
// ------------------------------------------------------------
// Semua perubahan data WAJIB melewati fungsi aksi di file ini.
// Setiap aksi memeriksa: (1) peran/kewenangan, (2) aturan bisnis,
// (3) mencatat audit log berantai hash. Data disimpan di
// localStorage agar dapat di-hosting statis (mode prototipe).
// ============================================================

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActionResult, AidRequest, AppNotification, AppState, Item, Post, Priority, Role, User, Vehicle, VehicleStatus, VulnerableGroups,
} from '../types';
import {
  estimateValue, generateHandoverCode, inFlightQty, maxAllowedQty, RULES,
} from '../rules/businessRules';
import { appendAudit } from './audit';
import { createSeedState, STATE_VERSION } from './seed';
import { num, ROLE_LABEL, rupiah } from '../utils/format';

const STORAGE_KEY = 'resq-gov:state';
const SESSION_KEY = 'resq-gov:session';

// ------------------------------------------------------------
// Helper murni
// ------------------------------------------------------------

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* data rusak → buat ulang */
  }
  const seed = createSeedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function nextId(s: AppState, prefix: string): string {
  s.counters[prefix] = (s.counters[prefix] ?? 0) + 1;
  return `${prefix}-${String(s.counters[prefix]).padStart(4, '0')}`;
}

function notify(s: AppState, n: Omit<AppNotification, 'id' | 'at' | 'readBy'>) {
  s.notifications.unshift({ ...n, id: nextId(s, 'N'), at: Date.now(), readBy: [] });
  if (s.notifications.length > 200) s.notifications.length = 200;
}

/** Jumlah stok yang sudah dialokasikan untuk permintaan disetujui yang belum di-dispatch */
export function reservedQty(s: AppState, itemId: string, excludeReqId?: string): number {
  return s.requests
    .filter((r) => r.id !== excludeReqId && (r.status === 'menunggu_persetujuan' || r.status === 'disetujui'))
    .reduce((sum, r) => sum + (r.lines.find((l) => l.itemId === itemId)?.qty ?? 0), 0);
}

export function availableQty(s: AppState, itemId: string, excludeReqId?: string): number {
  const it = s.items.find((i) => i.id === itemId);
  return it ? it.stock - reservedQty(s, itemId, excludeReqId) : 0;
}

const isInt = (n: number) => Number.isInteger(n) && n >= 0;
const fail = (error: string): ActionResult => ({ ok: false, error });
const ok = (message?: string): ActionResult => ({ ok: true, message });

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------

interface Ctx {
  violation: (action: string, target: string, msg: string) => ActionResult;
  audit: (action: string, target: string, detail: string, flagged?: boolean) => void;
}

export interface NewUserInput {
  username: string; password: string; name: string; role: Role; nip: string; jabatan: string; phone: string; postId?: string; vehicleId?: string;
}

interface Store {
  state: AppState;
  user: User | null;
  login: (username: string, password: string) => ActionResult;
  logout: (reason?: string) => void;
  createRequest: (input: { priority: Priority; lines: { itemId: string; qty: number }[]; justification: string }) => ActionResult;
  verifyRequest: (id: string, approve: boolean, note: string) => ActionResult;
  approveRequest: (id: string, approve: boolean, note: string) => ActionResult;
  dispatch: (requestId: string, driverId: string) => ActionResult;
  startTrip: (shipmentId: string) => ActionResult;
  deliver: (shipmentId: string, code: string, recipientName: string) => ActionResult;
  unlockShipment: (shipmentId: string) => ActionResult;
  confirmReceipt: (requestId: string, received: Record<string, number>, note: string) => ActionResult;
  resolveDiscrepancy: (requestId: string, note: string) => ActionResult;
  updatePost: (input: { evacuees: number; vulnerable: VulnerableGroups; reason: string }) => ActionResult;
  stockIn: (itemId: string, qty: number, ref: string, note: string) => ActionResult;
  addUser: (input: NewUserInput) => ActionResult;
  toggleUser: (id: string) => ActionResult;
  setVehicleStatus: (vehicleId: string, status: VehicleStatus) => ActionResult;
  markRead: (ids: string[]) => void;
  resetDemo: () => void;
  switchUser: (userId: string) => ActionResult;
  toggleSimulation: (active?: boolean) => void;
  triggerRandomEvent: () => string;
  addPost: (input: { name: string; address: string; district: string; capacity: number; evacuees: number; coords?: { x: number; y: number; lat: number; lng: number } }) => ActionResult;
  addItem: (input: { name: string; unit: string; category: any; stock: number; minStock: number; unitPrice: number; norm: number; normBasis: 'hari' | 'jiwa' }) => ActionResult;
  addVehicle: (input: { plate: string; type: string; capacityKg: number }) => ActionResult;
  recordSecurityIncident: (action: string, target: string, detail: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);
  const stateRef = useRef(state);
  const [userId, setUserId] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));

  const commit = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  // Sinkronisasi antar-tab (mis. login peran berbeda di tab berbeda)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = JSON.parse(e.newValue) as AppState;
        stateRef.current = parsed;
        setState(parsed);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const user = useMemo(() => state.users.find((u) => u.id === userId && u.active) ?? null, [state.users, userId]);

  /** Menjalankan aksi dengan pemeriksaan peran + audit. */
  const run = useCallback(
    (roles: Role[], fn: (draft: AppState, actor: User, ctx: Ctx) => ActionResult): ActionResult => {
      const actor = stateRef.current.users.find((u) => u.id === userId && u.active);
      if (!actor) return fail('Sesi tidak valid. Silakan masuk kembali.');
      const draft: AppState = structuredClone(stateRef.current);
      let dirty = false;
      const ctx: Ctx = {
        audit: (action, target, detail, flagged) => {
          appendAudit(draft, { at: Date.now(), actorId: actor.id, actorName: actor.name, role: actor.role, action, target, detail, flagged });
        },
        violation: (action, target, msg) => {
          dirty = true;
          appendAudit(draft, { at: Date.now(), actorId: actor.id, actorName: actor.name, role: actor.role, action: `PELANGGARAN_${action}`, target, detail: msg, flagged: true });
          return fail(msg);
        },
      };
      if (!roles.includes(actor.role)) {
        const res = ctx.violation('AKSES', '-', `Peran ${ROLE_LABEL[actor.role]} tidak berwenang melakukan aksi ini (R-12).`);
        commit(draft);
        return res;
      }
      const res = fn(draft, actor, ctx);
      if (res.ok || dirty) commit(draft);
      return res;
    },
    [userId, commit],
  );

  // ------------------------------------------------------------
  // Autentikasi
  // ------------------------------------------------------------
  const login = useCallback((username: string, password: string): ActionResult => {
    const draft: AppState = structuredClone(stateRef.current);
    const uname = username.trim().toLowerCase();
    const u = draft.users.find((x) => x.username === uname);
    const lockKey = `lock:${uname}`;
    const failKey = `fail:${uname}`;
    const now = Date.now();
    const sys = (action: string, detail: string, flagged = false, actor?: User) =>
      appendAudit(draft, { at: now, actorId: actor?.id ?? '-', actorName: actor?.name ?? uname, role: actor?.role ?? 'sistem', action, target: uname, detail, flagged });

    if ((draft.counters[lockKey] ?? 0) > now) {
      const mins = Math.ceil((draft.counters[lockKey] - now) / 60_000);
      return fail(`Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${mins} menit (R-11).`);
    }
    if (!u || u.password !== password) {
      draft.counters[failKey] = (draft.counters[failKey] ?? 0) + 1;
      const attempts = draft.counters[failKey];
      sys('LOGIN_GAGAL', `Percobaan ke-${attempts}`, attempts >= 3);
      if (attempts >= RULES.MAX_LOGIN_ATTEMPTS) {
        draft.counters[lockKey] = now + RULES.LOGIN_LOCK_MIN * 60_000;
        draft.counters[failKey] = 0;
        sys('AKUN_DIKUNCI', `Dikunci ${RULES.LOGIN_LOCK_MIN} menit setelah ${RULES.MAX_LOGIN_ATTEMPTS}x gagal login`, true);
        notify(draft, { toRole: 'admin', level: 'critical', message: `Akun "${uname}" dikunci otomatis setelah ${RULES.MAX_LOGIN_ATTEMPTS}x gagal login.`, link: '/admin/audit' });
      }
      commit(draft);
      const left = RULES.MAX_LOGIN_ATTEMPTS - attempts;
      return fail(left > 0 ? `Nama pengguna atau kata sandi salah. Sisa percobaan: ${left}.` : `Akun dikunci ${RULES.LOGIN_LOCK_MIN} menit.`);
    }
    if (!u.active) {
      sys('LOGIN_DITOLAK', 'Akun nonaktif mencoba masuk', true, u);
      commit(draft);
      return fail('Akun Anda dinonaktifkan. Hubungi Kepala Dinas.');
    }
    draft.counters[failKey] = 0;
    sys('LOGIN', `Masuk sebagai ${ROLE_LABEL[u.role]}`, false, u);
    commit(draft);
    sessionStorage.setItem(SESSION_KEY, u.id);
    setUserId(u.id);
    return ok();
  }, [commit]);

  const logout = useCallback((reason = 'Keluar') => {
    const actor = stateRef.current.users.find((u) => u.id === userId);
    if (actor) {
      const draft: AppState = structuredClone(stateRef.current);
      appendAudit(draft, { at: Date.now(), actorId: actor.id, actorName: actor.name, role: actor.role, action: 'LOGOUT', target: actor.username, detail: reason });
      commit(draft);
    }
    sessionStorage.removeItem(SESSION_KEY);
    setUserId(null);
    window.location.hash = '#/login';
  }, [userId, commit]);

  // Sesi berakhir otomatis (R-11)
  useEffect(() => {
    if (!userId) return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = window.setInterval(() => {
      if (Date.now() - last > RULES.SESSION_TIMEOUT_MIN * 60_000) logout(`Sesi berakhir otomatis (${RULES.SESSION_TIMEOUT_MIN} menit tanpa aktivitas)`);
    }, 20_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(t);
    };
  }, [userId, logout]);

  // ------------------------------------------------------------
  // Petugas Posko
  // ------------------------------------------------------------
  const createRequest: Store['createRequest'] = (input) =>
    run(['posko'], (s, actor, ctx) => {
      const post = s.posts.find((p) => p.id === actor.postId);
      if (!post) return fail('Akun Anda belum ditugaskan ke posko mana pun.');
      const ageH = (Date.now() - post.lastUpdate) / 3600_000;
      if (ageH > RULES.HEADCOUNT_MAX_AGE_HOURS)
        return fail(`Data pengungsi terakhir diperbarui ${Math.floor(ageH)} jam lalu. Perbarui data pengungsi terlebih dahulu (R-10).`);
      const lines = input.lines.filter((l) => l.qty > 0);
      if (lines.length === 0) return fail('Minimal satu barang harus diisi.');
      if (input.justification.trim().length < RULES.JUSTIFICATION_MIN)
        return fail(`Justifikasi minimal ${RULES.JUSTIFICATION_MIN} karakter (R-08).`);
      for (const l of lines) {
        const item = s.items.find((i) => i.id === l.itemId);
        if (!item) return fail('Barang tidak dikenal.');
        if (!Number.isInteger(l.qty)) return fail(`Jumlah ${item.name} harus bilangan bulat.`);
        const cap = maxAllowedQty(item, post);
        const flight = inFlightQty(s.requests, post.id, item.id);
        if (flight + l.qty > cap)
          return fail(`${item.name}: maksimal ${num(cap)} ${item.unit} untuk ${num(post.evacuees)} jiwa; ${num(flight)} ${item.unit} masih dalam proses. Sisa kuota: ${num(Math.max(0, cap - flight))} (R-03).`);
      }
      const estimatedValue = estimateValue(lines, s.items);
      const needsApproval = estimatedValue > RULES.APPROVAL_VALUE_THRESHOLD;
      const now = Date.now();
      const req: AidRequest = {
        id: nextId(s, 'REQ'), postId: post.id, requestedBy: actor.id, priority: input.priority,
        lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })), justification: input.justification.trim(),
        status: 'diajukan', createdAt: now, estimatedValue, needsApproval,
        history: [{ status: 'diajukan', at: now, by: actor.id }],
      };
      s.requests.unshift(req);
      ctx.audit('PERMINTAAN_DIAJUKAN', req.id, `${post.name} • ${input.priority} • ${rupiah(estimatedValue)}`);
      notify(s, {
        toRole: 'koordinator', link: '/koordinator/verifikasi',
        level: input.priority === 'darurat' ? 'critical' : input.priority === 'tinggi' ? 'warning' : 'info',
        message: `Permintaan ${input.priority.toUpperCase()} ${req.id} dari ${post.name} menunggu verifikasi.`,
      });
      return ok(`Permintaan ${req.id} berhasil diajukan.`);
    });

  const updatePost: Store['updatePost'] = ({ evacuees, vulnerable, reason }) =>
    run(['posko'], (s, actor, ctx) => {
      const post = s.posts.find((p) => p.id === actor.postId);
      if (!post) return fail('Akun Anda belum ditugaskan ke posko mana pun.');
      if (!isInt(evacuees)) return fail('Jumlah pengungsi harus bilangan bulat ≥ 0.');
      const vals = Object.values(vulnerable);
      if (vals.some((v) => !isInt(v))) return fail('Data kelompok rentan harus bilangan bulat ≥ 0.');
      if (vulnerable.balita + vulnerable.lansia + vulnerable.disabilitas + vulnerable.ibuHamil > evacuees)
        return fail('Total kelompok rentan tidak boleh melebihi jumlah pengungsi.');
      if (reason.trim().length < 10) return fail('Keterangan perubahan minimal 10 karakter (R-10).');
      const prev = post.evacuees;
      const pct = prev === 0 ? 100 : Math.abs(evacuees - prev) / prev * 100;
      const overCap = evacuees > post.capacity;
      const flagged = pct > RULES.HEADCOUNT_CHANGE_FLAG_PCT || overCap;
      post.evacuees = evacuees;
      post.vulnerable = vulnerable;
      post.lastUpdate = Date.now();
      ctx.audit('DATA_PENGUNGSI_DIPERBARUI', post.id, `${num(prev)} → ${num(evacuees)} jiwa (${pct.toFixed(0)}%). ${reason.trim()}`, flagged);
      if (flagged) {
        notify(s, {
          toRole: 'koordinator', level: 'warning', link: '/koordinator/posko',
          message: `Perubahan data pengungsi ${post.name} perlu diperiksa: ${num(prev)} → ${num(evacuees)} jiwa${overCap ? ' (melebihi kapasitas)' : ''}.`,
        });
      }
      return ok(flagged ? 'Data tersimpan dan ditandai untuk diperiksa Koordinator (R-10).' : 'Data pengungsi berhasil diperbarui.');
    });

  const confirmReceipt: Store['confirmReceipt'] = (requestId, received, note) =>
    run(['posko'], (s, actor, ctx) => {
      const req = s.requests.find((r) => r.id === requestId);
      if (!req) return fail('Permintaan tidak ditemukan.');
      if (req.postId !== actor.postId) return ctx.violation('LINTAS_POSKO', requestId, 'Anda hanya dapat mengonfirmasi penerimaan untuk posko Anda sendiri (R-12).');
      if (req.status !== 'terkirim') return fail('Barang belum diserahkan oleh pengemudi.');
      const shp = s.shipments.find((x) => x.id === req.shipmentId);
      if (shp && shp.driverId === actor.id) return ctx.violation('SOD', requestId, 'Pengemudi tidak boleh mengonfirmasi penerimaan (R-01).');
      let short = false;
      for (const l of req.lines) {
        const v = received[l.itemId];
        if (v === undefined || !isInt(v)) return fail('Isi jumlah diterima untuk setiap barang (bilangan bulat ≥ 0).');
        if (v > l.qty) return fail('Jumlah diterima tidak boleh melebihi jumlah yang dikirim.');
        if (v < l.qty) short = true;
      }
      if (short && note.trim().length < RULES.REJECT_REASON_MIN)
        return fail(`Terdapat selisih. Jelaskan kondisi barang minimal ${RULES.REJECT_REASON_MIN} karakter (R-06).`);
      req.lines.forEach((l) => { l.receivedQty = received[l.itemId]; });
      const now = Date.now();
      req.status = short ? 'selisih' : 'diterima';
      req.history.push({ status: req.status, at: now, by: actor.id, note: note.trim() || (short ? undefined : 'Jumlah sesuai.') });
      if (shp) { shp.status = 'diterima'; shp.receivedAt = now; }
      ctx.audit(short ? 'PENERIMAAN_SELISIH' : 'PENERIMAAN_DIKONFIRMASI', req.id, short ? note.trim() : 'Jumlah sesuai', short);
      if (short) {
        const detail = req.lines.filter((l) => (l.receivedQty ?? 0) < l.qty).map((l) => {
          const it = s.items.find((i) => i.id === l.itemId);
          return `${it?.name} kurang ${l.qty - (l.receivedQty ?? 0)}`;
        }).join(', ');
        notify(s, { toRole: 'admin', level: 'critical', link: '/admin/persetujuan', message: `SELISIH penerimaan ${req.id}: ${detail}. Wajib ditindaklanjuti.` });
        notify(s, { toRole: 'koordinator', level: 'warning', link: '/koordinator/dispatch', message: `Selisih penerimaan pada ${req.id}: ${detail}.` });
      }
      return ok(short ? 'Penerimaan dicatat dengan SELISIH dan dilaporkan ke Kepala Dinas.' : 'Penerimaan barang berhasil dikonfirmasi.');
    });

  // ------------------------------------------------------------
  // Koordinator Logistik
  // ------------------------------------------------------------
  const verifyRequest: Store['verifyRequest'] = (id, approve, note) =>
    run(['koordinator'], (s, actor, ctx) => {
      const req = s.requests.find((r) => r.id === id);
      if (!req) return fail('Permintaan tidak ditemukan.');
      if (req.status !== 'diajukan') return fail('Permintaan ini sudah diproses.');
      if (req.requestedBy === actor.id) return ctx.violation('SOD', id, 'Anda tidak dapat memverifikasi permintaan yang Anda ajukan sendiri (R-01).');
      const now = Date.now();
      const post = s.posts.find((p) => p.id === req.postId);
      if (!approve) {
        if (note.trim().length < RULES.REJECT_REASON_MIN) return fail(`Alasan penolakan minimal ${RULES.REJECT_REASON_MIN} karakter (R-08).`);
        req.status = 'ditolak';
        req.rejectReason = note.trim();
        req.history.push({ status: 'ditolak', at: now, by: actor.id, note: note.trim() });
        ctx.audit('PERMINTAAN_DITOLAK', id, note.trim());
        notify(s, { toUserId: req.requestedBy, level: 'warning', link: '/posko/permintaan', message: `Permintaan ${id} ditolak Koordinator: ${note.trim()}` });
        return ok(`Permintaan ${id} ditolak.`);
      }
      const short = req.lines.filter((l) => availableQty(s, l.itemId, req.id) < l.qty).map((l) => {
        const it = s.items.find((i) => i.id === l.itemId)!;
        return `${it.name} (tersedia ${num(availableQty(s, l.itemId, req.id))}, diminta ${num(l.qty)})`;
      });
      if (short.length) return fail(`Stok tidak mencukupi: ${short.join('; ')} (R-04). Lakukan pengadaan/penerimaan stok terlebih dahulu.`);
      req.verifiedBy = actor.id;
      req.status = req.needsApproval ? 'menunggu_persetujuan' : 'disetujui';
      const msg = req.needsApproval ? `Diverifikasi. Nilai ${rupiah(req.estimatedValue)} melebihi ambang, diteruskan ke Kepala Dinas.` : (note.trim() || 'Diverifikasi, siap dikirim.');
      req.history.push({ status: req.status, at: now, by: actor.id, note: msg });
      ctx.audit('PERMINTAAN_DIVERIFIKASI', id, msg);
      if (req.needsApproval) {
        notify(s, { toRole: 'admin', level: req.priority === 'darurat' ? 'critical' : 'warning', link: '/admin/persetujuan', message: `${id} dari ${post?.name} (${rupiah(req.estimatedValue)}) menunggu persetujuan Anda.` });
      }
      notify(s, { toUserId: req.requestedBy, level: 'info', link: '/posko/permintaan', message: `Permintaan ${id} telah diverifikasi${req.needsApproval ? ' dan menunggu persetujuan Kepala Dinas' : ', segera dikirim'}.` });
      return ok(req.needsApproval ? `${id} diverifikasi & diteruskan ke Kepala Dinas (R-02).` : `${id} diverifikasi dan siap di-dispatch.`);
    });

  const dispatch: Store['dispatch'] = (requestId, driverId) =>
    run(['koordinator'], (s, actor, ctx) => {
      const req = s.requests.find((r) => r.id === requestId);
      if (!req) return fail('Permintaan tidak ditemukan.');
      if (req.status === 'menunggu_persetujuan') return ctx.violation('DISPATCH_TANPA_PERSETUJUAN', requestId, 'Permintaan belum disetujui Kepala Dinas (R-02).');
      if (req.status !== 'disetujui') return fail('Permintaan tidak dalam status siap kirim.');
      const driver = s.users.find((u) => u.id === driverId && u.role === 'driver');
      if (!driver || !driver.active) return fail('Pengemudi tidak valid atau nonaktif.');
      const vehicle = s.vehicles.find((v) => v.id === driver.vehicleId);
      if (!vehicle) return fail('Pengemudi belum memiliki kendaraan.');
      if (vehicle.status !== 'tersedia') return fail(`Kendaraan ${vehicle.plate} sedang ${vehicle.status}.`);
      if (s.shipments.some((x) => x.driverId === driverId && (x.status === 'ditugaskan' || x.status === 'dalam_perjalanan')))
        return fail('Pengemudi masih memiliki tugas aktif.');
      for (const l of req.lines) {
        const it = s.items.find((i) => i.id === l.itemId)!;
        if (it.stock < l.qty) return fail(`Stok ${it.name} tidak mencukupi (${num(it.stock)} < ${num(l.qty)}) (R-04).`);
      }
      const now = Date.now();
      const shipment = {
        id: nextId(s, 'SHP'), requestId, driverId, vehicleId: vehicle.id, handoverCode: generateHandoverCode(),
        status: 'ditugaskan' as const, createdAt: now, failedAttempts: 0, locked: false,
      };
      s.shipments.unshift(shipment);
      req.lines.forEach((l) => {
        const it = s.items.find((i) => i.id === l.itemId)!;
        it.stock -= l.qty;
        s.movements.unshift({ id: nextId(s, 'MOV'), itemId: it.id, type: 'keluar', qty: l.qty, at: now, by: actor.id, ref: requestId, note: `Dispatch ${shipment.id}` });
      });
      vehicle.status = 'bertugas';
      req.status = 'dikirim';
      req.shipmentId = shipment.id;
      req.history.push({ status: 'dikirim', at: now, by: actor.id, note: `Armada ${vehicle.plate} — ${driver.name}` });
      ctx.audit('DISPATCH', requestId, `${shipment.id} • ${vehicle.plate} • ${driver.name}`);
      const post = s.posts.find((p) => p.id === req.postId);
      notify(s, { toUserId: driverId, level: 'warning', link: '/driver/tugas', message: `Tugas baru ${shipment.id}: antar ${req.id} ke ${post?.name}.` });
      s.users.filter((u) => u.role === 'posko' && u.postId === req.postId).forEach((u) =>
        notify(s, { toUserId: u.id, level: 'info', link: '/posko/permintaan', message: `${req.id} sedang dikirim oleh ${driver.name}. Kode serah terima tersedia di menu Permintaan.` }),
      );
      return ok(`${shipment.id} dibuat. Stok dikurangi otomatis.`);
    });

  const unlockShipment: Store['unlockShipment'] = (shipmentId) =>
    run(['koordinator'], (s, _actor, ctx) => {
      const shp = s.shipments.find((x) => x.id === shipmentId);
      if (!shp) return fail('Pengiriman tidak ditemukan.');
      if (!shp.locked) return fail('Pengiriman tidak dalam kondisi terkunci.');
      shp.locked = false;
      shp.failedAttempts = 0;
      shp.handoverCode = generateHandoverCode();
      ctx.audit('PENGIRIMAN_DIBUKA', shipmentId, 'Kunci dibuka dan kode serah terima diterbitkan ulang', true);
      const req = s.requests.find((r) => r.id === shp.requestId);
      s.users.filter((u) => u.role === 'posko' && u.postId === req?.postId).forEach((u) =>
        notify(s, { toUserId: u.id, level: 'warning', link: '/posko/permintaan', message: `Kode serah terima ${req?.id} diterbitkan ulang. Kode lama tidak berlaku.` }),
      );
      notify(s, { toUserId: shp.driverId, level: 'info', link: '/driver/tugas', message: `${shipmentId} dibuka kembali. Minta kode baru dari petugas posko.` });
      return ok('Kunci dibuka dan kode baru diterbitkan.');
    });

  const stockIn: Store['stockIn'] = (itemId, qty, ref, note) =>
    run(['koordinator'], (s, actor, ctx) => {
      const it = s.items.find((i) => i.id === itemId);
      if (!it) return fail('Barang tidak ditemukan.');
      if (!Number.isInteger(qty) || qty <= 0) return fail('Jumlah harus bilangan bulat > 0.');
      if (ref.trim().length < 5) return fail('Nomor dokumen (BAST/Surat Jalan) wajib diisi (R-08).');
      if (s.movements.some((m) => m.type === 'masuk' && m.ref.toLowerCase() === ref.trim().toLowerCase() && m.itemId === itemId))
        return fail('Nomor dokumen ini sudah pernah dicatat untuk barang yang sama (mencegah pencatatan ganda).');
      it.stock += qty;
      s.movements.unshift({ id: nextId(s, 'MOV'), itemId, type: 'masuk', qty, at: Date.now(), by: actor.id, ref: ref.trim(), note: note.trim() });
      ctx.audit('STOK_MASUK', itemId, `+${qty} ${it.unit} ${it.name} (${ref.trim()})`);
      return ok(`Stok ${it.name} bertambah ${num(qty)} ${it.unit}.`);
    });

  const setVehicleStatus: Store['setVehicleStatus'] = (vehicleId, status) =>
    run(['koordinator'], (s, _a, ctx) => {
      const v = s.vehicles.find((x) => x.id === vehicleId);
      if (!v) return fail('Kendaraan tidak ditemukan.');
      if (v.status === 'bertugas' || status === 'bertugas') return fail('Status "bertugas" hanya diatur otomatis oleh sistem dispatch.');
      v.status = status;
      ctx.audit('STATUS_KENDARAAN', v.plate, status);
      return ok(`Status ${v.plate} diubah menjadi ${status}.`);
    });

  // ------------------------------------------------------------
  // Kepala Dinas
  // ------------------------------------------------------------
  const approveRequest: Store['approveRequest'] = (id, approve, note) =>
    run(['admin'], (s, actor, ctx) => {
      const req = s.requests.find((r) => r.id === id);
      if (!req) return fail('Permintaan tidak ditemukan.');
      if (req.status !== 'menunggu_persetujuan') return fail('Permintaan tidak menunggu persetujuan.');
      if (req.verifiedBy === actor.id || req.requestedBy === actor.id) return ctx.violation('SOD', id, 'Penyetuju harus berbeda dengan pengaju & pemverifikasi (R-01).');
      const now = Date.now();
      if (!approve) {
        if (note.trim().length < RULES.REJECT_REASON_MIN) return fail(`Alasan penolakan minimal ${RULES.REJECT_REASON_MIN} karakter (R-08).`);
        req.status = 'ditolak';
        req.rejectReason = note.trim();
        req.history.push({ status: 'ditolak', at: now, by: actor.id, note: note.trim() });
        ctx.audit('PERSETUJUAN_DITOLAK', id, note.trim());
        notify(s, { toUserId: req.requestedBy, level: 'warning', link: '/posko/permintaan', message: `Permintaan ${id} ditolak Kepala Dinas: ${note.trim()}` });
        notify(s, { toRole: 'koordinator', level: 'info', message: `${id} ditolak Kepala Dinas.` });
        return ok(`${id} ditolak.`);
      }
      req.status = 'disetujui';
      req.approvedBy = actor.id;
      req.history.push({ status: 'disetujui', at: now, by: actor.id, note: note.trim() || 'Disetujui Kepala Dinas.' });
      ctx.audit('PERSETUJUAN_DISETUJUI', id, `${rupiah(req.estimatedValue)} ${note.trim()}`);
      notify(s, { toRole: 'koordinator', level: 'warning', link: '/koordinator/dispatch', message: `${id} telah disetujui Kepala Dinas. Segera dispatch armada.` });
      notify(s, { toUserId: req.requestedBy, level: 'info', link: '/posko/permintaan', message: `Permintaan ${id} disetujui Kepala Dinas.` });
      return ok(`${id} disetujui.`);
    });

  const resolveDiscrepancy: Store['resolveDiscrepancy'] = (requestId, note) =>
    run(['admin'], (s, _a, ctx) => {
      const req = s.requests.find((r) => r.id === requestId);
      if (!req || req.status !== 'selisih') return fail('Permintaan tidak dalam status selisih.');
      if (req.discrepancyResolved) return fail('Selisih sudah ditindaklanjuti.');
      if (note.trim().length < RULES.REJECT_REASON_MIN) return fail(`Catatan tindak lanjut minimal ${RULES.REJECT_REASON_MIN} karakter.`);
      req.discrepancyResolved = true;
      req.discrepancyNote = note.trim();
      ctx.audit('SELISIH_DITINDAKLANJUTI', requestId, note.trim());
      return ok('Tindak lanjut selisih tercatat.');
    });

  const addUser: Store['addUser'] = (input) =>
    run(['admin'], (s, _a, ctx) => {
      const username = input.username.trim().toLowerCase();
      if (!/^[a-z0-9._]{4,20}$/.test(username)) return fail('Username 4–20 karakter: huruf kecil, angka, titik, garis bawah.');
      if (s.users.some((u) => u.username === username)) return fail('Username sudah digunakan.');
      if (input.password.length < 8 || !/\d/.test(input.password) || !/[a-zA-Z]/.test(input.password))
        return fail('Kata sandi minimal 8 karakter dan mengandung huruf & angka.');
      if (input.name.trim().length < 3) return fail('Nama lengkap wajib diisi.');
      if (input.role === 'posko' && !s.posts.some((p) => p.id === input.postId)) return fail('Petugas Posko wajib ditugaskan ke satu posko.');
      if (input.role === 'driver') {
        if (!s.vehicles.some((v) => v.id === input.vehicleId)) return fail('Pengemudi wajib ditugaskan ke satu kendaraan.');
        if (s.users.some((u) => u.active && u.role === 'driver' && u.vehicleId === input.vehicleId)) return fail('Kendaraan sudah dipegang pengemudi aktif lain.');
      }
      const id = nextId(s, 'U');
      s.users.push({
        id, username, password: input.password, name: input.name.trim(), role: input.role, nip: input.nip.trim() || '-',
        jabatan: input.jabatan.trim() || ROLE_LABEL[input.role], phone: input.phone.trim(), active: true,
        postId: input.role === 'posko' ? input.postId : undefined, vehicleId: input.role === 'driver' ? input.vehicleId : undefined,
      });
      ctx.audit('PENGGUNA_DITAMBAHKAN', username, `${input.name.trim()} • ${ROLE_LABEL[input.role]}`);
      return ok(`Pengguna ${username} berhasil dibuat.`);
    });

  const toggleUser: Store['toggleUser'] = (id) =>
    run(['admin'], (s, actor, ctx) => {
      const u = s.users.find((x) => x.id === id);
      if (!u) return fail('Pengguna tidak ditemukan.');
      if (u.id === actor.id) return fail('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      if (u.active) {
        if (u.role === 'admin' && s.users.filter((x) => x.role === 'admin' && x.active).length <= 1) return fail('Minimal harus ada 1 Kepala Dinas aktif (R-11).');
        if (u.role === 'driver' && s.shipments.some((x) => x.driverId === u.id && (x.status === 'ditugaskan' || x.status === 'dalam_perjalanan')))
          return fail('Pengemudi masih memiliki tugas pengiriman aktif.');
      } else if (u.role === 'driver' && s.users.some((x) => x.active && x.id !== u.id && x.role === 'driver' && x.vehicleId === u.vehicleId)) {
        return fail('Kendaraan pengemudi ini sudah dipegang pengemudi aktif lain.');
      }
      u.active = !u.active;
      ctx.audit(u.active ? 'PENGGUNA_DIAKTIFKAN' : 'PENGGUNA_DINONAKTIFKAN', u.username, u.name, !u.active);
      return ok(`${u.name} ${u.active ? 'diaktifkan' : 'dinonaktifkan'}.`);
    });

  // ------------------------------------------------------------
  // Pengemudi
  // ------------------------------------------------------------
  const startTrip: Store['startTrip'] = (shipmentId) =>
    run(['driver'], (s, actor, ctx) => {
      const shp = s.shipments.find((x) => x.id === shipmentId);
      if (!shp) return fail('Pengiriman tidak ditemukan.');
      if (shp.driverId !== actor.id) return ctx.violation('TUGAS_ORANG_LAIN', shipmentId, 'Pengiriman ini bukan tugas Anda (R-12).');
      if (shp.status !== 'ditugaskan') return fail('Perjalanan sudah dimulai.');
      const now = Date.now();
      shp.status = 'dalam_perjalanan';
      shp.departedAt = now;
      const req = s.requests.find((r) => r.id === shp.requestId)!;
      req.status = 'dalam_perjalanan';
      req.history.push({ status: 'dalam_perjalanan', at: now, by: actor.id });
      ctx.audit('PERJALANAN_DIMULAI', shipmentId, req.id);
      s.users.filter((u) => u.role === 'posko' && u.postId === req.postId).forEach((u) =>
        notify(s, { toUserId: u.id, level: 'info', link: '/posko/permintaan', message: `Armada untuk ${req.id} telah berangkat menuju posko Anda.` }),
      );
      return ok('Perjalanan dimulai. Hati-hati di jalan.');
    });

  const deliver: Store['deliver'] = (shipmentId, code, recipientName) =>
    run(['driver'], (s, actor, ctx) => {
      const shp = s.shipments.find((x) => x.id === shipmentId);
      if (!shp) return fail('Pengiriman tidak ditemukan.');
      if (shp.driverId !== actor.id) return ctx.violation('TUGAS_ORANG_LAIN', shipmentId, 'Pengiriman ini bukan tugas Anda (R-12).');
      if (shp.status !== 'dalam_perjalanan') return fail('Mulai perjalanan terlebih dahulu.');
      if (shp.locked) return fail('Pengiriman dikunci karena kode salah berulang. Hubungi Koordinator (R-05).');
      if (recipientName.trim().length < 3) return fail('Nama penerima wajib diisi.');
      const req = s.requests.find((r) => r.id === shp.requestId)!;
      if (code.trim() !== shp.handoverCode) {
        shp.failedAttempts += 1;
        if (shp.failedAttempts >= RULES.MAX_HANDOVER_ATTEMPTS) {
          shp.locked = true;
          notify(s, { toRole: 'koordinator', level: 'critical', link: '/koordinator/dispatch', message: `${shipmentId} DIKUNCI: ${RULES.MAX_HANDOVER_ATTEMPTS}x kode serah terima salah oleh ${actor.name}.` });
          notify(s, { toRole: 'admin', level: 'critical', link: '/admin/audit', message: `Indikasi masalah serah terima ${shipmentId} (${req.id}). Pengiriman dikunci.` });
        }
        return ctx.violation('KODE_SERAH_TERIMA', shipmentId, `Kode serah terima salah (percobaan ${shp.failedAttempts}/${RULES.MAX_HANDOVER_ATTEMPTS})${shp.locked ? '. Pengiriman DIKUNCI' : ''} (R-05).`);
      }
      const now = Date.now();
      shp.status = 'terkirim';
      shp.deliveredAt = now;
      shp.recipientName = recipientName.trim();
      const vehicle = s.vehicles.find((v) => v.id === shp.vehicleId);
      if (vehicle) vehicle.status = 'tersedia';
      req.status = 'terkirim';
      req.history.push({ status: 'terkirim', at: now, by: actor.id, note: `Diterima oleh: ${recipientName.trim()}` });
      ctx.audit('SERAH_TERIMA', shipmentId, `${req.id} • penerima ${recipientName.trim()}`);
      s.users.filter((u) => u.role === 'posko' && u.postId === req.postId).forEach((u) =>
        notify(s, { toUserId: u.id, level: 'warning', link: '/posko/permintaan', message: `Barang ${req.id} telah diserahkan. Mohon hitung & konfirmasi jumlah fisik (R-06).` }),
      );
      return ok('Serah terima berhasil diverifikasi.');
    });

  // ------------------------------------------------------------
  // Umum
  // ------------------------------------------------------------
  const markRead = (ids: string[]) => {
    if (!user) return;
    const draft: AppState = structuredClone(stateRef.current);
    let changed = false;
    draft.notifications.forEach((n) => {
      if (ids.includes(n.id) && !n.readBy.includes(user.id)) { n.readBy.push(user.id); changed = true; }
    });
    if (changed) commit(draft);
  };

  const resetDemo = () => {
    if (!user || user.role !== 'admin') return;
    const fresh = createSeedState();
    appendAudit(fresh, { at: Date.now(), actorId: user.id, actorName: user.name, role: user.role, action: 'RESET_DATA_DEMO', target: '-', detail: 'Seluruh data dikembalikan ke kondisi awal', flagged: true });
    commit(fresh);
  };

  // ------------------------------------------------------------
  // Fitur Dinamis & Simulasi Real-time
  // ------------------------------------------------------------
  const switchUser = useCallback((targetUserId: string): ActionResult => {
    const target = stateRef.current.users.find((u) => u.id === targetUserId && u.active);
    if (!target) return fail('Pengguna tidak ditemukan atau nonaktif.');
    sessionStorage.setItem(SESSION_KEY, target.id);
    setUserId(target.id);
    const draft: AppState = structuredClone(stateRef.current);
    appendAudit(draft, {
      at: Date.now(),
      actorId: target.id,
      actorName: target.name,
      role: target.role,
      action: 'PINDAH_PERAN_CEPAT',
      target: target.username,
      detail: `Beralih ke peran ${ROLE_LABEL[target.role]} (Simulasi Cepat)`,
    });
    commit(draft);
    return ok(`Beralih ke ${target.name} (${ROLE_LABEL[target.role]})`);
  }, [commit]);

  const toggleSimulation = useCallback((active?: boolean) => {
    const draft: AppState = structuredClone(stateRef.current);
    draft.liveSimulation = active !== undefined ? active : !draft.liveSimulation;
    commit(draft);
  }, [commit]);

  const triggerRandomEvent = useCallback((): string => {
    const draft: AppState = structuredClone(stateRef.current);
    const now = Date.now();
    const eventTypes = ['evacuee_surge', 'weather_alert', 'trip_progress', 'supply_alert'];
    const pick = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    let message = '';

    if (pick === 'evacuee_surge') {
      const p = draft.posts[Math.floor(Math.random() * draft.posts.length)];
      const surge = Math.floor(15 + Math.random() * 30);
      p.evacuees += surge;
      p.vulnerable.balita += Math.floor(surge * 0.15);
      p.vulnerable.lansia += Math.floor(surge * 0.2);
      p.lastUpdate = now;
      message = `[LAPORAN EVAKUASI] +${surge} pengungsi tiba di ${p.name}! (Total: ${num(p.evacuees)} jiwa)`;
      notify(draft, {
        toRole: 'koordinator',
        level: 'warning',
        link: '/koordinator/posko',
        message: `Pembaruan Lapangan: +${surge} pengungsi baru tiba di ${p.name}. Total sekarang ${num(p.evacuees)} jiwa.`,
      });
      appendAudit(draft, {
        at: now,
        actorId: 'SATGAS-LAPANGAN',
        actorName: 'Satgas Tanggap Bencana',
        role: 'sistem',
        action: 'SIMULASI_LONJAKAN_PENGUNGSI',
        target: p.id,
        detail: `+${surge} jiwa di ${p.name}`,
        flagged: true,
      });
    } else if (pick === 'weather_alert') {
      const weathers = [
        {
          level: 'siaga1' as const,
          title: 'PERINGATAN DINI CUACA EKSTREM BMKG',
          desc: 'Curah hujan ekstrem >150 mm/hari berpotensi memicu banjir luapan di jalur distribusi Medan–Siantar.',
        },
        {
          level: 'siaga2' as const,
          title: 'KENAIKAN DEBIT AIR SUNGAI DELI MEDAN',
          desc: 'Tinggi Muka Air (TMA) Sungai Deli 190 cm (Siaga II). Daerah Medan Maimun & Medan Labuhan diinstruksikan waspada banjir kiriman.',
        },
        {
          level: 'waspada' as const,
          title: 'PEMANTAUAN KETINGGIAN AIR SUNGAI BAH BOLON (PUSDALOPS SIANTAR)',
          desc: 'Tinggi Muka Air (TMA) Sungai Bah Bolon berada pada status Waspada (180 cm).',
        },
      ];
      const w = weathers[Math.floor(Math.random() * weathers.length)];
      draft.disasterAlert = { ...w, source: 'BMKG Stasiun Klimatologi Sumatera Utara & Pusdalops BPBD', updatedAt: now };
      message = `[PERINGATAN RESMI] ${w.title}: ${w.desc}`;
      notify(draft, { toRole: 'admin', level: 'critical', message: `${w.title} — ${w.desc}` });
      notify(draft, { toRole: 'koordinator', level: 'warning', message: `${w.title} — ${w.desc}` });
      appendAudit(draft, {
        at: now,
        actorId: 'BMKG-FEED',
        actorName: 'Stasiun BMKG / Pusdalops',
        role: 'sistem',
        action: 'UPDATE_ALERT_BENCANA',
        target: 'STATUS_DARURAT',
        detail: w.title,
      });
    } else if (pick === 'trip_progress') {
      const activeShp = draft.shipments.find((s) => s.status === 'dalam_perjalanan');
      if (activeShp) {
        const currentProg = activeShp.progress ?? 50;
        const nextProg = Math.min(100, currentProg + 25);
        activeShp.progress = nextProg;
        activeShp.currentEta = nextProg >= 100 ? 'Tiba di Posko' : `${Math.max(2, Math.round((100 - nextProg) * 0.4))} menit`;
        const req = draft.requests.find((r) => r.id === activeShp.requestId);
        const post = req && draft.posts.find((p) => p.id === req.postId);
        const driver = draft.users.find((u) => u.id === activeShp.driverId);
        message = `[TELEMETRI ARMADA] ${activeShp.id} (${driver?.name}) mencapai ${nextProg}% menuju ${post?.name || 'posko'}.`;
        if (nextProg >= 100) {
          notify(draft, {
            toRole: 'posko',
            level: 'warning',
            link: '/posko/permintaan',
            message: `Armada ${activeShp.id} (${driver?.name}) telah tiba di ${post?.name}. Mohon siapkan kode serah terima.`,
          });
        }
      } else {
        const p = draft.posts[Math.floor(Math.random() * draft.posts.length)];
        message = `[STATUS POSKO] ${p.name} berkapasitas ${num(p.capacity)} jiwa terisi ${num(p.evacuees)} jiwa.`;
      }
    } else {
      const it = draft.items[Math.floor(Math.random() * draft.items.length)];
      message = `[CADANGAN LOGISTIK] Ketersediaan ${it.name} di gudang induk adalah ${num(it.stock)} ${it.unit}.`;
    }

    commit(draft);
    return message;
  }, [commit]);

  // Timer simulasi otomatis latar belakang
  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      if (!current.liveSimulation) return;
      let dirty = false;
      const draft: AppState = structuredClone(current);

      draft.shipments.forEach((shp) => {
        if (shp.status === 'dalam_perjalanan') {
          const p = shp.progress ?? 35;
          if (p < 100) {
            shp.progress = Math.min(100, p + 5);
            shp.currentEta = shp.progress >= 100 ? 'Tiba di Posko' : `${Math.max(1, Math.round((100 - shp.progress) * 0.35))} mnt`;
            dirty = true;
          }
        }
      });

      if (dirty) commit(draft);
    }, 12000);

    return () => clearInterval(timer);
  }, [commit]);

  // CRUD Tambah Master Data
  const addPost: Store['addPost'] = (input) =>
    run(['admin', 'koordinator'], (s, _a, ctx) => {
      if (input.name.trim().length < 4) return fail('Nama posko minimal 4 karakter.');
      if (input.capacity <= 0) return fail('Kapasitas posko harus lebih dari 0.');
      const id = nextId(s, 'P');
      const now = Date.now();
      const newPost: Post = {
        id,
        name: input.name.trim(),
        address: input.address.trim() || 'Jl. Raya Wilayah Bencana',
        district: input.district.trim() || 'Kec. Terkait',
        capacity: input.capacity,
        evacuees: input.evacuees,
        vulnerable: {
          balita: Math.round(input.evacuees * 0.1),
          lansia: Math.round(input.evacuees * 0.15),
          disabilitas: Math.round(input.evacuees * 0.02),
          ibuHamil: Math.round(input.evacuees * 0.03),
        },
        lastUpdate: now,
        coords: input.coords || {
          x: Math.floor(20 + Math.random() * 60),
          y: Math.floor(20 + Math.random() * 60),
          lat: -6.82 + (Math.random() - 0.5) * 0.08,
          lng: 107.16 + (Math.random() - 0.5) * 0.08,
        },
      };
      s.posts.push(newPost);
      ctx.audit('TAMBAH_POSKO', id, `${newPost.name} (Kapasitas ${num(newPost.capacity)} jiwa)`);
      return ok(`Posko ${newPost.name} (${id}) berhasil didaftarkan.`);
    });

  const addItem: Store['addItem'] = (input) =>
    run(['admin', 'koordinator'], (s, _a, ctx) => {
      if (input.name.trim().length < 3) return fail('Nama barang minimal 3 karakter.');
      if (input.stock < 0 || input.minStock < 0) return fail('Stok tidak boleh negatif.');
      const id = nextId(s, 'I');
      const newItem: Item = {
        id,
        name: input.name.trim(),
        unit: input.unit.trim() || 'unit',
        category: input.category,
        stock: input.stock,
        minStock: input.minStock,
        unitPrice: input.unitPrice,
        norm: input.norm,
        normBasis: input.normBasis,
      };
      s.items.push(newItem);
      ctx.audit('TAMBAH_BARANG_MASTER', id, `${newItem.name} • ${newItem.category} • Stok awal: ${num(newItem.stock)}`);
      return ok(`Barang master ${newItem.name} (${id}) berhasil ditambahkan.`);
    });

  const addVehicle: Store['addVehicle'] = (input) =>
    run(['admin', 'koordinator'], (s, _a, ctx) => {
      if (input.plate.trim().length < 4) return fail('Nomor plat nomor kendaraan tidak valid.');
      const id = nextId(s, 'V');
      const newVeh: Vehicle = {
        id,
        plate: input.plate.trim().toUpperCase(),
        type: input.type.trim() || 'Truk Logistik',
        capacityKg: input.capacityKg || 2000,
        status: 'tersedia',
      };
      s.vehicles.push(newVeh);
      ctx.audit('TAMBAH_KENDARAAN', id, `${newVeh.plate} (${newVeh.type})`);
      return ok(`Kendaraan armada ${newVeh.plate} (${id}) siap beroperasi.`);
    });

  const recordSecurityIncident = useCallback((action: string, target: string, detail: string) => {
    const actor = stateRef.current.users.find((u) => u.id === userId && u.active);
    const draft: AppState = structuredClone(stateRef.current);
    appendAudit(draft, {
      at: Date.now(),
      actorId: actor?.id ?? '-',
      actorName: actor?.name ?? 'Anonim',
      role: actor?.role ?? 'sistem',
      action: `PELANGGARAN_${action}`,
      target,
      detail,
      flagged: true,
    });
    commit(draft);
  }, [userId, commit]);

  const value: Store = {
    state, user, login, logout, createRequest, verifyRequest, approveRequest, dispatch, startTrip, deliver,
    unlockShipment, confirmReceipt, resolveDiscrepancy, updatePost, stockIn, addUser, toggleUser, setVehicleStatus, markRead, resetDemo,
    switchUser, toggleSimulation, triggerRandomEvent, addPost, addItem, addVehicle, recordSecurityIncident,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore harus dipakai di dalam StoreProvider');
  return ctx;
}
