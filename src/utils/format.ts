import type { ItemCategory, Priority, RequestStatus, Role, ShipmentStatus, VehicleStatus } from '../types';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Kepala Dinas',
  koordinator: 'Koordinator Logistik',
  posko: 'Petugas Posko',
  driver: 'Pengemudi Armada',
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  diajukan: 'Diajukan',
  menunggu_persetujuan: 'Menunggu Persetujuan',
  disetujui: 'Siap Dikirim',
  ditolak: 'Ditolak',
  dikirim: 'Armada Ditugaskan',
  dalam_perjalanan: 'Dalam Perjalanan',
  terkirim: 'Terkirim',
  diterima: 'Diterima',
  selisih: 'Selisih',
};

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  diajukan: 'info',
  menunggu_persetujuan: 'warning',
  disetujui: 'primary',
  ditolak: 'danger',
  dikirim: 'primary',
  dalam_perjalanan: 'primary',
  terkirim: 'teal',
  diterima: 'success',
  selisih: 'danger',
};

export const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  ditugaskan: 'Ditugaskan',
  dalam_perjalanan: 'Dalam Perjalanan',
  terkirim: 'Terkirim',
  diterima: 'Diterima Posko',
};

export const VEHICLE_LABEL: Record<VehicleStatus, string> = {
  tersedia: 'Tersedia',
  bertugas: 'Bertugas',
  perawatan: 'Perawatan',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  darurat: 'Darurat',
  tinggi: 'Tinggi',
  normal: 'Normal',
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  darurat: 'danger',
  tinggi: 'warning',
  normal: 'neutral',
};

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  pangan: 'Pangan',
  medis: 'Medis',
  hunian: 'Hunian',
  sanitasi: 'Sanitasi',
};

export type Tone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'teal';

export const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const num = (n: number) => new Intl.NumberFormat('id-ID').format(n);

export const dateTime = (ts: number) =>
  new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(ts);

export const timeOnly = (ts: number) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(ts);

export function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.round((now - ts) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

export function duration(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  if (h === 0) return `${m} mnt`;
  return `${h} j ${m} mnt`;
}

/** Hash sinkron 53-bit (cyrb53) — cukup untuk rantai integritas audit di sisi klien */
export function hash(str: string, seed = 0x5eed): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
