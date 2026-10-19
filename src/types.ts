// ============================================================
// ResQ-Gov — Domain Types
// ============================================================

export type Role = 'admin' | 'koordinator' | 'posko' | 'driver';

export interface User {
  id: string;
  username: string;
  password: string; // DEMO ONLY — pada produksi wajib di-hash di sisi server
  name: string;
  role: Role;
  nip: string;
  jabatan: string;
  phone: string;
  active: boolean;
  postId?: string;     // khusus role posko
  vehicleId?: string;  // khusus role driver
}

export type ItemCategory = 'pangan' | 'medis' | 'hunian' | 'sanitasi';

export interface Item {
  id: string;
  name: string;
  unit: string;
  category: ItemCategory;
  stock: number;
  minStock: number;
  unitPrice: number;
  /** Standar kebutuhan per jiwa */
  norm: number;
  /** 'hari' = per jiwa per hari, 'jiwa' = per jiwa (sekali pakai / tahan lama) */
  normBasis: 'hari' | 'jiwa';
}

export interface VulnerableGroups {
  balita: number;
  lansia: number;
  disabilitas: number;
  ibuHamil: number;
}

export interface PostCoords {
  x: number; // persentase peta (0-100)
  y: number; // persentase peta (0-100)
  lat: number;
  lng: number;
}

export interface Post {
  id: string;
  name: string;
  address: string;
  district: string;
  capacity: number;
  evacuees: number;
  vulnerable: VulnerableGroups;
  lastUpdate: number;
  coords?: PostCoords;
}

export type Priority = 'darurat' | 'tinggi' | 'normal';

export type RequestStatus =
  | 'diajukan'
  | 'menunggu_persetujuan'
  | 'disetujui'
  | 'ditolak'
  | 'dikirim'
  | 'dalam_perjalanan'
  | 'terkirim'
  | 'diterima'
  | 'selisih';

export interface RequestLine {
  itemId: string;
  qty: number;
  receivedQty?: number;
}

export interface StatusEvent {
  status: RequestStatus;
  at: number;
  by: string; // user id
  note?: string;
}

export interface AidRequest {
  id: string;
  postId: string;
  requestedBy: string;
  priority: Priority;
  lines: RequestLine[];
  justification: string;
  status: RequestStatus;
  createdAt: number;
  estimatedValue: number;
  needsApproval: boolean;
  verifiedBy?: string;
  approvedBy?: string;
  rejectReason?: string;
  shipmentId?: string;
  discrepancyNote?: string;
  discrepancyResolved?: boolean;
  history: StatusEvent[];
}

export type ShipmentStatus = 'ditugaskan' | 'dalam_perjalanan' | 'terkirim' | 'diterima';

export interface Shipment {
  id: string;
  requestId: string;
  driverId: string;
  vehicleId: string;
  handoverCode: string;
  status: ShipmentStatus;
  createdAt: number;
  departedAt?: number;
  deliveredAt?: number;
  receivedAt?: number;
  recipientName?: string;
  failedAttempts: number;
  locked: boolean;
  progress?: number; // 0 - 100%
  currentEta?: string;
}

export type VehicleStatus = 'tersedia' | 'bertugas' | 'perawatan';

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacityKg: number;
  status: VehicleStatus;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'masuk' | 'keluar';
  qty: number;
  at: number;
  by: string;
  ref: string;
  note: string;
}

export interface AuditEntry {
  seq: number;
  at: number;
  actorId: string;
  actorName: string;
  role: Role | 'sistem';
  action: string;
  target: string;
  detail: string;
  flagged?: boolean;
  prevHash: string;
  hash: string;
}

export interface AppNotification {
  id: string;
  toRole?: Role;
  toUserId?: string;
  message: string;
  at: number;
  link?: string;
  level: 'info' | 'warning' | 'critical';
  readBy: string[];
}

export interface DisasterAlert {
  level: 'siaga1' | 'siaga2' | 'waspada';
  title: string;
  desc: string;
  source: string;
  updatedAt: number;
}

export interface AppState {
  version: number;
  users: User[];
  items: Item[];
  posts: Post[];
  vehicles: Vehicle[];
  requests: AidRequest[];
  shipments: Shipment[];
  movements: StockMovement[];
  audit: AuditEntry[];
  notifications: AppNotification[];
  counters: Record<string, number>;
  liveSimulation?: boolean;
  disasterAlert?: DisasterAlert;
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
