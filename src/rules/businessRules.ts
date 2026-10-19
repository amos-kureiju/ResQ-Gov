// ============================================================
// ResQ-Gov — Aturan Bisnis (Business Rules)
// ------------------------------------------------------------
// Seluruh aturan di file ini DITEGAKKAN oleh sistem (lihat
// src/store/StoreContext.tsx). Aturan bukan sekadar teks:
// setiap aksi yang melanggar akan DITOLAK dan dicatat di audit log.
// ============================================================

import type { AidRequest, Item, Post, Priority, RequestStatus, Role } from '../types';

export const RULES = {
  /** Nilai permintaan (Rp) di atas angka ini wajib disetujui Kepala Dinas */
  APPROVAL_VALUE_THRESHOLD: 25_000_000,
  /** SLA dalam jam sejak permintaan diajukan */
  SLA_HOURS: {
    darurat: { verify: 1, deliver: 6 },
    tinggi: { verify: 3, deliver: 12 },
    normal: { verify: 6, deliver: 24 },
  } as Record<Priority, { verify: number; deliver: number }>,
  /** Maksimal cakupan hari untuk barang konsumsi harian per permintaan */
  MAX_DAYS_COVERAGE: 3,
  /** Panjang minimal alasan penolakan */
  REJECT_REASON_MIN: 20,
  /** Panjang minimal justifikasi permintaan */
  JUSTIFICATION_MIN: 30,
  /** Perubahan jumlah pengungsi di atas persentase ini ditandai untuk diperiksa */
  HEADCOUNT_CHANGE_FLAG_PCT: 30,
  /** Maksimal kesalahan kode serah terima sebelum pengiriman dikunci */
  MAX_HANDOVER_ATTEMPTS: 3,
  /** Logout otomatis setelah tidak ada aktivitas (menit) */
  SESSION_TIMEOUT_MIN: 30,
  /** Maksimal gagal login sebelum akun dikunci sementara */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Lama penguncian akun (menit) */
  LOGIN_LOCK_MIN: 15,
  /** Data pengungsi harus diperbarui dalam rentang jam ini sebelum boleh mengajukan permintaan */
  HEADCOUNT_MAX_AGE_HOURS: 24,
} as const;

export interface RuleDoc {
  code: string;
  title: string;
  description: string;
  enforcement: string;
  roles: (Role | 'semua')[];
}

export const RULE_DOCS: RuleDoc[] = [
  {
    code: 'R-01',
    title: 'Pemisahan Tugas (Segregation of Duties)',
    description:
      'Pengaju, pemverifikasi, dan penyetuju permintaan harus orang yang berbeda. Pengemudi tidak dapat mengonfirmasi penerimaan barang; konfirmasi hanya oleh Petugas Posko tujuan.',
    enforcement: 'Sistem menolak aksi bila pelaku sama dengan pelaku tahap sebelumnya.',
    roles: ['semua'],
  },
  {
    code: 'R-02',
    title: 'Persetujuan Berjenjang',
    description: `Permintaan dengan estimasi nilai di atas Rp ${RULES.APPROVAL_VALUE_THRESHOLD.toLocaleString('id-ID')} wajib mendapat persetujuan Kepala Dinas setelah diverifikasi Koordinator Logistik.`,
    enforcement: 'Status otomatis menjadi "Menunggu Persetujuan" dan tidak dapat di-dispatch sebelum disetujui.',
    roles: ['admin', 'koordinator'],
  },
  {
    code: 'R-03',
    title: 'Batas Kebutuhan Berbasis Jumlah Jiwa',
    description: `Jumlah barang yang diminta dibatasi standar kebutuhan per jiwa (konsumsi harian maks. ${RULES.MAX_DAYS_COVERAGE} hari), termasuk akumulasi permintaan yang masih berjalan untuk posko yang sama.`,
    enforcement: 'Formulir menolak permintaan yang melebihi batas, mencegah penimbunan & duplikasi.',
    roles: ['posko'],
  },
  {
    code: 'R-04',
    title: 'Validasi Ketersediaan Stok',
    description: 'Permintaan tidak dapat diverifikasi atau di-dispatch bila stok gudang tidak mencukupi. Stok berkurang otomatis saat dispatch dan tercatat sebagai mutasi keluar.',
    enforcement: 'Tombol aksi ditolak sistem dengan pesan kekurangan stok per barang.',
    roles: ['koordinator'],
  },
  {
    code: 'R-05',
    title: 'Bukti Serah Terima dengan Kode Verifikasi',
    description: `Setiap pengiriman memiliki kode serah terima 6 digit yang hanya diketahui Petugas Posko tujuan. Pengemudi wajib memasukkan kode tersebut saat barang diserahkan. ${RULES.MAX_HANDOVER_ATTEMPTS}x salah = pengiriman dikunci.`,
    enforcement: 'Status "Terkirim" hanya dapat dicapai dengan kode yang valid. Kunci hanya dapat dibuka Koordinator.',
    roles: ['driver', 'posko', 'koordinator'],
  },
  {
    code: 'R-06',
    title: 'Konfirmasi Penerimaan & Deteksi Selisih',
    description: 'Petugas Posko wajib mencatat jumlah fisik yang diterima per barang. Bila lebih kecil dari jumlah kirim, status menjadi "Selisih" dan wajib ditindaklanjuti Kepala Dinas.',
    enforcement: 'Selisih otomatis dilaporkan ke Kepala Dinas dan muncul di dasbor hingga diselesaikan.',
    roles: ['posko', 'admin'],
  },
  {
    code: 'R-07',
    title: 'Batas Waktu Layanan (SLA)',
    description: `Darurat: verifikasi ≤ ${RULES.SLA_HOURS.darurat.verify} jam, terkirim ≤ ${RULES.SLA_HOURS.darurat.deliver} jam. Tinggi: ≤ ${RULES.SLA_HOURS.tinggi.verify} jam / ≤ ${RULES.SLA_HOURS.tinggi.deliver} jam. Normal: ≤ ${RULES.SLA_HOURS.normal.verify} jam / ≤ ${RULES.SLA_HOURS.normal.deliver} jam.`,
    enforcement: 'Permintaan yang melewati SLA ditandai merah dan dieskalasi ke dasbor Kepala Dinas.',
    roles: ['koordinator', 'admin'],
  },
  {
    code: 'R-08',
    title: 'Alasan Wajib & Terdokumentasi',
    description: `Penolakan wajib disertai alasan minimal ${RULES.REJECT_REASON_MIN} karakter. Justifikasi permintaan minimal ${RULES.JUSTIFICATION_MIN} karakter. Penerimaan stok masuk wajib mencantumkan nomor dokumen (BAST/Surat Jalan).`,
    enforcement: 'Formulir tidak dapat dikirim tanpa isian yang memenuhi syarat.',
    roles: ['semua'],
  },
  {
    code: 'R-09',
    title: 'Audit Log Anti-Manipulasi',
    description: 'Setiap aksi dicatat secara append-only dengan rantai hash (hash chain). Perubahan atau penghapusan satu entri akan memutus rantai dan terdeteksi saat verifikasi integritas.',
    enforcement: 'Tidak ada fitur hapus/edit log. Integritas dapat diverifikasi kapan saja oleh Kepala Dinas.',
    roles: ['admin'],
  },
  {
    code: 'R-10',
    title: 'Pemantauan Perubahan Data Pengungsi',
    description: `Pembaruan jumlah pengungsi wajib disertai keterangan. Perubahan > ${RULES.HEADCOUNT_CHANGE_FLAG_PCT}% atau melebihi kapasitas posko ditandai untuk diperiksa Koordinator. Permintaan bantuan hanya dapat diajukan bila data pengungsi diperbarui dalam ${RULES.HEADCOUNT_MAX_AGE_HOURS} jam terakhir.`,
    enforcement: 'Entri audit diberi tanda (flag) dan notifikasi dikirim ke Koordinator Logistik.',
    roles: ['posko', 'koordinator'],
  },
  {
    code: 'R-11',
    title: 'Keamanan Sesi & Akun',
    description: `Sesi berakhir otomatis setelah ${RULES.SESSION_TIMEOUT_MIN} menit tanpa aktivitas. ${RULES.MAX_LOGIN_ATTEMPTS}x gagal login berturut-turut mengunci akun selama ${RULES.LOGIN_LOCK_MIN} menit dan dicatat sebagai insiden. Akun nonaktif tidak dapat masuk. Minimal harus ada 1 Kepala Dinas aktif.`,
    enforcement: 'Diterapkan otomatis oleh sistem autentikasi.',
    roles: ['semua'],
  },
  {
    code: 'R-12',
    title: 'Akses Berbasis Peran (RBAC)',
    description: 'Setiap peran hanya dapat membuka halaman & melakukan aksi sesuai kewenangannya. Petugas Posko hanya melihat data posko-nya sendiri; Pengemudi hanya melihat tugasnya sendiri.',
    enforcement: 'Akses URL di luar kewenangan dialihkan otomatis dan setiap aksi diverifikasi ulang di lapisan data.',
    roles: ['semua'],
  },
];

// ------------------------------------------------------------
// Helper aturan
// ------------------------------------------------------------

export const FINAL_STATUSES: RequestStatus[] = ['ditolak', 'diterima', 'selisih'];

/** Batas maksimal kuantitas suatu barang untuk posko (R-03) */
export function maxAllowedQty(item: Item, post: Post): number {
  const days = item.normBasis === 'hari' ? RULES.MAX_DAYS_COVERAGE : 1;
  return Math.ceil(post.evacuees * item.norm * days);
}

/** Jumlah barang yang masih dalam proses (belum final) untuk posko */
export function inFlightQty(requests: AidRequest[], postId: string, itemId: string, excludeId?: string): number {
  return requests
    .filter((r) => r.postId === postId && r.id !== excludeId && !FINAL_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + (r.lines.find((l) => l.itemId === itemId)?.qty ?? 0), 0);
}

export function estimateValue(lines: { itemId: string; qty: number }[], items: Item[]): number {
  return lines.reduce((sum, l) => {
    const it = items.find((i) => i.id === l.itemId);
    return sum + (it ? it.unitPrice * l.qty : 0);
  }, 0);
}

export interface SlaInfo {
  stage: 'verifikasi' | 'pengiriman' | null;
  deadline: number;
  remainingMs: number;
  overdue: boolean;
  /** true bila sudah selesai namun pernah melewati SLA */
  breachedHistorically: boolean;
}

export function getSla(req: AidRequest, now = Date.now()): SlaInfo {
  const h = RULES.SLA_HOURS[req.priority];
  const verifyDeadline = req.createdAt + h.verify * 3600_000;
  const deliverDeadline = req.createdAt + h.deliver * 3600_000;

  if (req.status === 'diajukan') {
    return { stage: 'verifikasi', deadline: verifyDeadline, remainingMs: verifyDeadline - now, overdue: now > verifyDeadline, breachedHistorically: false };
  }
  if (['menunggu_persetujuan', 'disetujui', 'dikirim', 'dalam_perjalanan'].includes(req.status)) {
    return { stage: 'pengiriman', deadline: deliverDeadline, remainingMs: deliverDeadline - now, overdue: now > deliverDeadline, breachedHistorically: false };
  }
  const delivered = req.history.find((e) => e.status === 'terkirim');
  return {
    stage: null,
    deadline: deliverDeadline,
    remainingMs: 0,
    overdue: false,
    breachedHistorically: !!delivered && delivered.at > deliverDeadline,
  };
}

export function generateHandoverCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ------------------------------------------------------------
// Pemetaan Hak Akses Halaman & RBAC Keamanan (R-12)
// ------------------------------------------------------------

export const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  koordinator: '/koordinator',
  posko: '/posko',
  driver: '/driver/tugas',
};

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Admin (Kepala Dinas)
  '/admin': ['admin'],
  '/admin/persetujuan': ['admin'],
  '/admin/pengguna': ['admin'],
  '/admin/audit': ['admin'],
  '/admin/laporan': ['admin'],

  // Koordinator Logistik
  '/koordinator': ['koordinator'],
  '/koordinator/verifikasi': ['koordinator'],
  '/koordinator/gudang': ['koordinator'],
  '/koordinator/dispatch': ['koordinator'],
  '/koordinator/posko': ['koordinator'],

  // Petugas Posko
  '/posko': ['posko'],
  '/posko/permintaan': ['posko'],
  '/posko/ajukan': ['posko'],
  '/posko/pengungsi': ['posko'],

  // Driver Armada
  '/driver': ['driver'],
  '/driver/tugas': ['driver'],

  // Modul Bersama (Bisa diakses seluruh peran terotentikasi)
  '/peta': ['admin', 'koordinator', 'posko', 'driver'],
  '/aturan': ['admin', 'koordinator', 'posko', 'driver'],
  '/profil': ['admin', 'koordinator', 'posko', 'driver'],
  '/notifikasi': ['admin', 'koordinator', 'posko', 'driver'],
};

/** Mengecek apakah rute diizinkan untuk peran pengguna aktif */
export function isRouteAllowed(path: string, role: Role): { allowed: boolean; requiredRoles: Role[] } {
  if (path === '/') return { allowed: true, requiredRoles: [role] };

  const allowed = ROUTE_PERMISSIONS[path];
  if (!allowed) {
    if (path.startsWith('/admin')) return { allowed: role === 'admin', requiredRoles: ['admin'] };
    if (path.startsWith('/koordinator')) return { allowed: role === 'koordinator', requiredRoles: ['koordinator'] };
    if (path.startsWith('/posko')) return { allowed: role === 'posko', requiredRoles: ['posko'] };
    if (path.startsWith('/driver')) return { allowed: role === 'driver', requiredRoles: ['driver'] };
    return { allowed: true, requiredRoles: [] };
  }

  return {
    allowed: allowed.includes(role),
    requiredRoles: allowed,
  };
}
