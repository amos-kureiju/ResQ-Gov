import React from 'react';
import { MapPin, User as UserIcon, Truck, FileText, ShieldAlert, KeyRound } from 'lucide-react';
import type { AidRequest } from '../types';
import { useStore } from '../store/StoreContext';
import { dateTime, num, ROLE_LABEL, rupiah, SHIPMENT_LABEL, STATUS_LABEL, timeAgo } from '../utils/format';
import { Badge, Modal, PriorityBadge, SlaChip, StatusBadge, useNow, RuleTag } from './ui';

/** Tabel ringkas daftar permintaan, dipakai lintas peran */
export const RequestTable: React.FC<{
  requests: AidRequest[];
  onOpen: (r: AidRequest) => void;
  showPost?: boolean;
  action?: (r: AidRequest) => React.ReactNode;
}> = ({ requests, onOpen, showPost = true, action }) => {
  const { state } = useStore();
  const now = useNow();
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>No. Permintaan</th>
            {showPost && <th>Posko</th>}
            <th>Prioritas</th>
            <th>Barang</th>
            <th>Nilai</th>
            <th>Status</th>
            <th>SLA</th>
            <th aria-label="Aksi" />
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const post = state.posts.find((p) => p.id === r.postId);
            return (
              <tr key={r.id} className="row-click" onClick={() => onOpen(r)}>
                <td>
                  <div className="cell-strong mono">{r.id}</div>
                  <div className="cell-sub">{timeAgo(r.createdAt, now)}</div>
                </td>
                {showPost && <td><div className="cell-strong">{post?.name}</div><div className="cell-sub">{post?.district}</div></td>}
                <td><PriorityBadge priority={r.priority} /></td>
                <td className="cell-sub">
                  {r.lines.map((l) => state.items.find((i) => i.id === l.itemId)?.name).join(', ')}
                </td>
                <td>
                  <div className="cell-strong">{rupiah(r.estimatedValue)}</div>
                  {r.needsApproval && <div className="cell-sub">Perlu persetujuan</div>}
                </td>
                <td><StatusBadge status={r.status} /></td>
                <td><SlaChip req={r} now={now} /></td>
                <td onClick={(e) => e.stopPropagation()} className="cell-actions">
                  {action ? action(r) : <button className="btn btn-ghost btn-sm" onClick={() => onOpen(r)}>Detail</button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Modal detail permintaan lengkap dengan jejak (timeline) & info pengiriman */
export const RequestDetail: React.FC<{
  request: AidRequest | null;
  onClose: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  showHandoverCode?: boolean;
}> = ({ request, onClose, footer, children, showHandoverCode }) => {
  const { state } = useStore();
  const now = useNow();
  if (!request) return null;
  // Ambil versi terbaru dari state (agar detail selalu sinkron setelah aksi)
  const r = state.requests.find((x) => x.id === request.id) ?? request;
  const post = state.posts.find((p) => p.id === r.postId);
  const requester = state.users.find((u) => u.id === r.requestedBy);
  const shp = state.shipments.find((s) => s.id === r.shipmentId);
  const driver = shp && state.users.find((u) => u.id === shp.driverId);
  const vehicle = shp && state.vehicles.find((v) => v.id === shp.vehicleId);
  const showReceived = r.lines.some((l) => l.receivedQty !== undefined);

  return (
    <Modal open onClose={onClose} wide title={<span className="mono">{r.id}</span>} footer={footer}>
      <div className="detail-top">
        <StatusBadge status={r.status} />
        <PriorityBadge priority={r.priority} />
        <SlaChip req={r} now={now} />
        {r.needsApproval && <Badge tone="warning">Persetujuan berjenjang <RuleTag code="R-02" /></Badge>}
      </div>

      <div className="detail-grid">
        <div className="detail-item"><MapPin size={16} /><div><span>Posko</span><strong>{post?.name}</strong><em>{post?.address}, {post?.district}</em></div></div>
        <div className="detail-item"><UserIcon size={16} /><div><span>Diajukan oleh</span><strong>{requester?.name}</strong><em>{dateTime(r.createdAt)}</em></div></div>
        <div className="detail-item"><FileText size={16} /><div><span>Estimasi nilai</span><strong>{rupiah(r.estimatedValue)}</strong><em>{num(post?.evacuees ?? 0)} jiwa pengungsi</em></div></div>
      </div>

      <h4 className="section-label">Rincian Barang</h4>
      <div className="table-wrap">
        <table className="data-table compact">
          <thead>
            <tr><th>Barang</th><th className="num">Diminta</th>{showReceived && <th className="num">Diterima</th>}<th className="num">Harga Satuan</th><th className="num">Subtotal</th></tr>
          </thead>
          <tbody>
            {r.lines.map((l) => {
              const it = state.items.find((i) => i.id === l.itemId)!;
              const diff = l.receivedQty !== undefined && l.receivedQty < l.qty;
              return (
                <tr key={l.itemId}>
                  <td className="cell-strong">{it.name}</td>
                  <td className="num">{num(l.qty)} {it.unit}</td>
                  {showReceived && <td className={`num ${diff ? 'text-danger' : 'text-success'}`}>{num(l.receivedQty ?? 0)} {it.unit}{diff && ` (−${num(l.qty - (l.receivedQty ?? 0))})`}</td>}
                  <td className="num">{rupiah(it.unitPrice)}</td>
                  <td className="num">{rupiah(it.unitPrice * l.qty)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h4 className="section-label">Justifikasi Kebutuhan</h4>
      <p className="quote">{r.justification}</p>

      {r.rejectReason && (
        <div className="alert alert-danger"><ShieldAlert size={16} /><div><strong>Alasan penolakan</strong><p>{r.rejectReason}</p></div></div>
      )}
      {r.status === 'selisih' && (
        <div className={`alert ${r.discrepancyResolved ? 'alert-info' : 'alert-danger'}`}>
          <ShieldAlert size={16} />
          <div>
            <strong>{r.discrepancyResolved ? 'Selisih telah ditindaklanjuti' : 'Selisih penerimaan belum ditindaklanjuti'} <RuleTag code="R-06" /></strong>
            {r.discrepancyNote && <p>{r.discrepancyNote}</p>}
          </div>
        </div>
      )}

      {shp && (
        <>
          <h4 className="section-label">Pengiriman</h4>
          <div className="shipment-box">
            <div className="detail-item"><Truck size={16} /><div><span>{shp.id}</span><strong>{vehicle?.plate} • {vehicle?.type}</strong><em>{driver?.name} • {driver?.phone}</em></div></div>
            <div><Badge tone={shp.status === 'diterima' ? 'success' : 'primary'}>{SHIPMENT_LABEL[shp.status]}</Badge>{shp.locked && <Badge tone="danger">Terkunci</Badge>}</div>
            {shp.recipientName && <div className="cell-sub">Penerima: <strong>{shp.recipientName}</strong></div>}
          </div>
          {showHandoverCode && (shp.status === 'ditugaskan' || shp.status === 'dalam_perjalanan') && (
            <div className="handover">
              <KeyRound size={20} />
              <div>
                <span>Kode Serah Terima <RuleTag code="R-05" /></span>
                <strong className="mono">{shp.locked ? '— terkunci —' : shp.handoverCode}</strong>
                <em>Berikan kode ini kepada pengemudi HANYA setelah barang diterima secara fisik.</em>
              </div>
            </div>
          )}
        </>
      )}

      {children}

      <h4 className="section-label">Jejak Proses</h4>
      <ol className="timeline">
        {r.history.map((h, i) => {
          const u = state.users.find((x) => x.id === h.by);
          return (
            <li key={i} className={`tl-item tl-${h.status}`}>
              <div className="tl-dot" />
              <div className="tl-body">
                <div className="tl-head"><strong>{STATUS_LABEL[h.status]}</strong><span>{dateTime(h.at)}</span></div>
                <div className="cell-sub">{u?.name} • {u ? ROLE_LABEL[u.role] : ''}</div>
                {h.note && <p className="tl-note">{h.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Modal>
  );
};
