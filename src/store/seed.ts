import type { AidRequest, AppState, Item, Post, Shipment, StockMovement, User, Vehicle } from '../types';
import { estimateValue, RULES } from '../rules/businessRules';
import { appendAudit } from './audit';

export const STATE_VERSION = 4;

const H = 3600_000;
const M = 60_000;

export function createSeedState(now = Date.now()): AppState {
  const users: User[] = [
    { id: 'U01', username: 'kadis', password: 'kadis123', name: 'Dr. Hj. Ratna Wulandari, M.Si', role: 'admin', nip: '197205121998032004', jabatan: 'Kepala Dinas Sosial', phone: '0812-1100-2200', active: true },
    { id: 'U02', username: 'koordinator', password: 'koor123', name: 'Ir. Bambang Hartono', role: 'koordinator', nip: '198011232005011003', jabatan: 'Koordinator Pusdalops Logistik', phone: '0813-2200-3300', active: true },
    { id: 'U03', username: 'posko1', password: 'posko123', name: 'Siti Aminah', role: 'posko', nip: '199003152015032001', jabatan: 'Petugas Posko', phone: '0815-3300-4400', active: true, postId: 'P01' },
    { id: 'U04', username: 'posko2', password: 'posko123', name: 'Rudi Hermawan', role: 'posko', nip: '198807082014031002', jabatan: 'Petugas Posko', phone: '0816-4400-5500', active: true, postId: 'P03' },
    { id: 'U05', username: 'driver1', password: 'driver123', name: 'Budi Santoso', role: 'driver', nip: '-', jabatan: 'Pengemudi (Tenaga Kontrak)', phone: '0817-5500-6600', active: true, vehicleId: 'V01' },
    { id: 'U06', username: 'driver2', password: 'driver123', name: 'Agus Pratama', role: 'driver', nip: '-', jabatan: 'Pengemudi (Tenaga Kontrak)', phone: '0818-6600-7700', active: true, vehicleId: 'V02' },
  ];

  const posts: Post[] = [
    { id: 'P01', name: 'Posko Balai Desa Suka Maju', address: 'Jl. Raya Suka Maju No. 12', district: 'Kec. Cibeber', capacity: 500, evacuees: 450, vulnerable: { balita: 38, lansia: 52, disabilitas: 6, ibuHamil: 9 }, lastUpdate: now - 2 * H, coords: { x: 26, y: 35, lat: -6.845, lng: 107.132 } },
    { id: 'P02', name: 'Posko SD Negeri 1 Pulo', address: 'Jl. Pendidikan No. 3', district: 'Kec. Pulo', capacity: 400, evacuees: 320, vulnerable: { balita: 25, lansia: 30, disabilitas: 3, ibuHamil: 5 }, lastUpdate: now - 7 * H, coords: { x: 74, y: 28, lat: -6.790, lng: 107.240 } },
    { id: 'P03', name: 'Posko GOR Serbaguna', address: 'Jl. Olahraga No. 1', district: 'Kec. Kota', capacity: 1000, evacuees: 890, vulnerable: { balita: 74, lansia: 96, disabilitas: 11, ibuHamil: 17 }, lastUpdate: now - 1 * H, coords: { x: 58, y: 68, lat: -6.820, lng: 107.180 } },
    { id: 'P04', name: 'Posko Masjid Raya Al-Ikhlas', address: 'Jl. Masjid Raya No. 7', district: 'Kec. Kota', capacity: 300, evacuees: 210, vulnerable: { balita: 15, lansia: 22, disabilitas: 2, ibuHamil: 3 }, lastUpdate: now - 10 * H, coords: { x: 42, y: 52, lat: -6.812, lng: 107.155 } },
  ];

  const items: Item[] = [
    { id: 'I01', name: 'Beras', unit: 'kg', category: 'pangan', stock: 2200, minStock: 1000, unitPrice: 14_000, norm: 0.4, normBasis: 'hari' },
    { id: 'I02', name: 'Air Mineral', unit: 'liter', category: 'pangan', stock: 5200, minStock: 3000, unitPrice: 4_000, norm: 2.5, normBasis: 'hari' },
    { id: 'I03', name: 'Mi Instan', unit: 'bungkus', category: 'pangan', stock: 1400, minStock: 1500, unitPrice: 3_500, norm: 2, normBasis: 'hari' },
    { id: 'I04', name: 'Paket Obat & P3K', unit: 'paket', category: 'medis', stock: 260, minStock: 100, unitPrice: 150_000, norm: 0.05, normBasis: 'jiwa' },
    { id: 'I05', name: 'Masker Medis (box 50)', unit: 'box', category: 'medis', stock: 180, minStock: 80, unitPrice: 45_000, norm: 0.05, normBasis: 'jiwa' },
    { id: 'I06', name: 'Tenda Pengungsi', unit: 'unit', category: 'hunian', stock: 40, minStock: 20, unitPrice: 3_500_000, norm: 0.1, normBasis: 'jiwa' },
    { id: 'I07', name: 'Selimut', unit: 'lembar', category: 'hunian', stock: 1300, minStock: 500, unitPrice: 75_000, norm: 1, normBasis: 'jiwa' },
    { id: 'I08', name: 'Paket Kebersihan (Hygiene Kit)', unit: 'paket', category: 'sanitasi', stock: 600, minStock: 300, unitPrice: 85_000, norm: 0.25, normBasis: 'jiwa' },
    { id: 'I09', name: 'Susu & MP-ASI Balita', unit: 'paket', category: 'pangan', stock: 220, minStock: 150, unitPrice: 55_000, norm: 0.1, normBasis: 'hari' },
  ];

  const vehicles: Vehicle[] = [
    { id: 'V01', plate: 'B 9123 KZ', type: 'Truk Engkel', capacityKg: 4000, status: 'bertugas' },
    { id: 'V02', plate: 'B 9456 KZ', type: 'Pick-up', capacityKg: 1000, status: 'tersedia' },
    { id: 'V03', plate: 'B 9789 KZ', type: 'Truk Fuso', capacityKg: 8000, status: 'perawatan' },
  ];

  const mk = (r: Omit<AidRequest, 'estimatedValue' | 'needsApproval'>): AidRequest => {
    const estimatedValue = estimateValue(r.lines, items);
    return { ...r, estimatedValue, needsApproval: estimatedValue > RULES.APPROVAL_VALUE_THRESHOLD };
  };

  const requests: AidRequest[] = [
    mk({
      id: 'REQ-0001', postId: 'P01', requestedBy: 'U03', priority: 'darurat', status: 'diajukan', createdAt: now - 50 * M,
      lines: [{ itemId: 'I01', qty: 400 }, { itemId: 'I02', qty: 1000 }, { itemId: 'I04', qty: 15 }],
      justification: 'Stok beras dan air posko tersisa untuk 1 hari. Terdapat 38 balita dan 52 lansia yang membutuhkan asupan segera.',
      history: [{ status: 'diajukan', at: now - 50 * M, by: 'U03' }],
    }),
    mk({
      id: 'REQ-0002', postId: 'P03', requestedBy: 'U04', priority: 'tinggi', status: 'menunggu_persetujuan', createdAt: now - 3 * H, verifiedBy: 'U02',
      lines: [{ itemId: 'I06', qty: 10 }, { itemId: 'I07', qty: 300 }],
      justification: 'Pengungsi baru dari Desa Sukaresmi bertambah 140 jiwa, area aula GOR penuh sehingga dibutuhkan tenda tambahan di halaman.',
      history: [
        { status: 'diajukan', at: now - 3 * H, by: 'U04' },
        { status: 'menunggu_persetujuan', at: now - 2 * H - 20 * M, by: 'U02', note: 'Diverifikasi. Nilai melebihi ambang, diteruskan ke Kepala Dinas.' },
      ],
    }),
    mk({
      id: 'REQ-0003', postId: 'P01', requestedBy: 'U03', priority: 'normal', status: 'disetujui', createdAt: now - 5 * H, verifiedBy: 'U02',
      lines: [{ itemId: 'I08', qty: 100 }],
      justification: 'Kebutuhan sanitasi pengungsi meningkat, mulai muncul keluhan gatal-gatal pada anak-anak di posko.',
      history: [
        { status: 'diajukan', at: now - 5 * H, by: 'U03' },
        { status: 'disetujui', at: now - 4 * H, by: 'U02', note: 'Stok tersedia, siap dikirim.' },
      ],
    }),
    mk({
      id: 'REQ-0004', postId: 'P03', requestedBy: 'U04', priority: 'darurat', status: 'dalam_perjalanan', createdAt: now - 4 * H, verifiedBy: 'U02', shipmentId: 'SHP-0002',
      lines: [{ itemId: 'I01', qty: 300 }, { itemId: 'I03', qty: 800 }],
      justification: 'Dapur umum kehabisan bahan makanan untuk makan malam 890 pengungsi, perlu pasokan sebelum pukul 17.00.',
      history: [
        { status: 'diajukan', at: now - 4 * H, by: 'U04' },
        { status: 'disetujui', at: now - 3 * H - 30 * M, by: 'U02' },
        { status: 'dikirim', at: now - 3 * H, by: 'U02', note: 'Armada B 9123 KZ — Budi Santoso' },
        { status: 'dalam_perjalanan', at: now - 2 * H - 40 * M, by: 'U05' },
      ],
    }),
    mk({
      id: 'REQ-0005', postId: 'P01', requestedBy: 'U03', priority: 'tinggi', status: 'diterima', createdAt: now - 28 * H, verifiedBy: 'U02', shipmentId: 'SHP-0001',
      lines: [{ itemId: 'I07', qty: 200, receivedQty: 200 }],
      justification: 'Suhu malam turun drastis, banyak pengungsi lansia tidur tanpa alas dan selimut.',
      history: [
        { status: 'diajukan', at: now - 28 * H, by: 'U03' },
        { status: 'disetujui', at: now - 27 * H, by: 'U02' },
        { status: 'dikirim', at: now - 26 * H, by: 'U02', note: 'Armada B 9456 KZ — Agus Pratama' },
        { status: 'dalam_perjalanan', at: now - 25 * H - 40 * M, by: 'U06' },
        { status: 'terkirim', at: now - 25 * H, by: 'U06', note: 'Diterima oleh: Siti Aminah' },
        { status: 'diterima', at: now - 24 * H - 50 * M, by: 'U03', note: 'Jumlah sesuai.' },
      ],
    }),
    mk({
      id: 'REQ-0006', postId: 'P03', requestedBy: 'U04', priority: 'normal', status: 'terkirim', createdAt: now - 9 * H, verifiedBy: 'U02', shipmentId: 'SHP-0003',
      lines: [{ itemId: 'I05', qty: 20 }, { itemId: 'I09', qty: 60 }],
      justification: 'Persediaan masker untuk petugas kesehatan dan susu balita di posko menipis, tersisa untuk 1 hari.',
      history: [
        { status: 'diajukan', at: now - 9 * H, by: 'U04' },
        { status: 'disetujui', at: now - 8 * H, by: 'U02' },
        { status: 'dikirim', at: now - 7 * H, by: 'U02', note: 'Armada B 9456 KZ — Agus Pratama' },
        { status: 'dalam_perjalanan', at: now - 6 * H - 30 * M, by: 'U06' },
        { status: 'terkirim', at: now - 6 * H, by: 'U06', note: 'Diterima oleh: Rudi Hermawan' },
      ],
    }),
    mk({
      id: 'REQ-0007', postId: 'P01', requestedBy: 'U03', priority: 'normal', status: 'ditolak', createdAt: now - 20 * H,
      rejectReason: 'Permintaan tenda duplikat dengan pengiriman sebelumnya, kapasitas posko masih mencukupi berdasarkan data terakhir.',
      lines: [{ itemId: 'I06', qty: 5 }],
      justification: 'Antisipasi penambahan pengungsi apabila hujan deras kembali turun malam ini di wilayah hulu.',
      history: [
        { status: 'diajukan', at: now - 20 * H, by: 'U03' },
        { status: 'ditolak', at: now - 19 * H, by: 'U02', note: 'Permintaan tenda duplikat dengan pengiriman sebelumnya, kapasitas posko masih mencukupi berdasarkan data terakhir.' },
      ],
    }),
  ];

  const shipments: Shipment[] = [
    { id: 'SHP-0001', requestId: 'REQ-0005', driverId: 'U06', vehicleId: 'V02', handoverCode: '730215', status: 'diterima', createdAt: now - 26 * H, departedAt: now - 25 * H - 40 * M, deliveredAt: now - 25 * H, receivedAt: now - 24 * H - 50 * M, recipientName: 'Siti Aminah', failedAttempts: 0, locked: false, progress: 100, currentEta: 'Tiba' },
    { id: 'SHP-0002', requestId: 'REQ-0004', driverId: 'U05', vehicleId: 'V01', handoverCode: '482913', status: 'dalam_perjalanan', createdAt: now - 3 * H, departedAt: now - 2 * H - 40 * M, failedAttempts: 0, locked: false, progress: 68, currentEta: '10 menit' },
    { id: 'SHP-0003', requestId: 'REQ-0006', driverId: 'U06', vehicleId: 'V02', handoverCode: '119384', status: 'terkirim', createdAt: now - 7 * H, departedAt: now - 6 * H - 30 * M, deliveredAt: now - 6 * H, recipientName: 'Rudi Hermawan', failedAttempts: 0, locked: false, progress: 100, currentEta: 'Tiba' },
  ];

  const movements: StockMovement[] = [
    { id: 'MOV-0001', itemId: 'I01', type: 'masuk', qty: 2500, at: now - 48 * H, by: 'U02', ref: 'BAST/BNPB/IX/2026/118', note: 'Bantuan BNPB tahap I' },
    { id: 'MOV-0002', itemId: 'I07', type: 'masuk', qty: 1500, at: now - 48 * H, by: 'U02', ref: 'BAST/KEMENSOS/IX/2026/045', note: 'Bantuan Kemensos' },
    { id: 'MOV-0003', itemId: 'I07', type: 'keluar', qty: 200, at: now - 26 * H, by: 'U02', ref: 'REQ-0005', note: 'Dispatch SHP-0001' },
    { id: 'MOV-0004', itemId: 'I05', type: 'keluar', qty: 20, at: now - 7 * H, by: 'U02', ref: 'REQ-0006', note: 'Dispatch SHP-0003' },
    { id: 'MOV-0005', itemId: 'I09', type: 'keluar', qty: 60, at: now - 7 * H, by: 'U02', ref: 'REQ-0006', note: 'Dispatch SHP-0003' },
    { id: 'MOV-0006', itemId: 'I01', type: 'keluar', qty: 300, at: now - 3 * H, by: 'U02', ref: 'REQ-0004', note: 'Dispatch SHP-0002' },
    { id: 'MOV-0007', itemId: 'I03', type: 'keluar', qty: 800, at: now - 3 * H, by: 'U02', ref: 'REQ-0004', note: 'Dispatch SHP-0002' },
  ];

  const state: AppState = {
    version: STATE_VERSION,
    users, items, posts, vehicles, requests, shipments, movements,
    audit: [],
    notifications: [
      { id: 'N-0001', toRole: 'koordinator', message: 'Permintaan DARURAT REQ-0001 dari Posko Balai Desa Suka Maju menunggu verifikasi.', at: now - 50 * M, link: '/koordinator/verifikasi', level: 'critical', readBy: [] },
      { id: 'N-0002', toRole: 'admin', message: 'REQ-0002 (Rp 57.500.000) menunggu persetujuan Anda.', at: now - 2 * H - 20 * M, link: '/admin/persetujuan', level: 'warning', readBy: [] },
      { id: 'N-0003', toUserId: 'U04', message: 'Pengiriman REQ-0006 telah tiba. Mohon konfirmasi jumlah fisik yang diterima.', at: now - 6 * H, link: '/posko/permintaan', level: 'warning', readBy: [] },
      { id: 'N-0004', toUserId: 'U05', message: 'Tugas baru SHP-0002 ke Posko GOR Serbaguna.', at: now - 3 * H, link: '/driver/tugas', level: 'info', readBy: ['U05'] },
    ],
    counters: { REQ: 7, SHP: 3, MOV: 7, N: 4, U: 6, P: 4, I: 9, V: 3 },
    liveSimulation: true,
    disasterAlert: {
      level: 'siaga1',
      title: 'STATUS SIAGA I TANGGAP DARURAT BENCANA (BMKG & PUSDALOPS)',
      desc: 'Peringatan dini curah hujan ekstrem & potensi luapan sungai di DAS Kec. Cibeber. Seluruh posko dan armada diinstruksikan bersiaga.',
      source: 'BMKG Stasiun Klimatologi Jawa Barat & Pusdalops BPBD',
      updatedAt: now - 15 * M,
    },
  };

  // Bangun audit log awal dari riwayat yang ada (urut kronologis)
  const events: { at: number; actorId: string; action: string; target: string; detail: string }[] = [];
  movements.filter((m) => m.type === 'masuk').forEach((m) =>
    events.push({ at: m.at, actorId: m.by, action: 'STOK_MASUK', target: m.itemId, detail: `+${m.qty} (${m.ref})` }),
  );
  requests.forEach((r) =>
    r.history.forEach((h) =>
      events.push({ at: h.at, actorId: h.by, action: `PERMINTAAN_${h.status.toUpperCase()}`, target: r.id, detail: h.note ?? '' }),
    ),
  );
  events.sort((a, b) => a.at - b.at).forEach((e) => {
    const u = users.find((x) => x.id === e.actorId)!;
    appendAudit(state, { at: e.at, actorId: u.id, actorName: u.name, role: u.role, action: e.action, target: e.target, detail: e.detail });
  });

  return state;
}
