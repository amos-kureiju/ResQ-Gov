import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useStore, availableQty } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { RULES } from '../../rules/businessRules';
import { num, rupiah } from '../../utils/format';
import { EmptyState, Field, PageHeader, Panel, PriorityBadge, RuleTag, SlaChip, useNow } from '../../components/ui';
import { RequestDetail } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const Verification: React.FC = () => {
  const { state, verifyRequest } = useStore();
  const toast = useToast();
  const now = useNow();
  const [selected, setSelected] = useState<AidRequest | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pending = state.requests.filter((r) => r.status === 'diajukan');

  const handleApprove = (req: AidRequest) => {
    toast(verifyRequest(req.id, true, 'Diverifikasi oleh Koordinator Logistik.'));
    setSelected(null);
  };

  const handleReject = (id: string) => {
    if (toast(verifyRequest(id, false, rejectReason))) {
      setRejecting(null);
      setRejectReason('');
      setSelected(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Antrean Verifikasi Permintaan"
        subtitle="Verifikasi ketersediaan stok fisik gudang dan validasi kewajaran kebutuhan (R-01, R-04)"
      />

      {pending.length === 0 ? (
        <Panel>
          <EmptyState
            title="Tidak ada permintaan yang menunggu verifikasi"
            text="Semua permintaan bantuan posko telah diproses."
          />
        </Panel>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Permintaan</th>
                <th>Posko</th>
                <th>Prioritas</th>
                <th>Estimasi Nilai</th>
                <th>Kesiapan Stok Gudang</th>
                <th>SLA Verifikasi</th>
                <th>Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => {
                const post = state.posts.find((p) => p.id === r.postId);
                const stockCheck = r.lines.map((l) => {
                  const it = state.items.find((i) => i.id === l.itemId);
                  const avail = availableQty(state, l.itemId, r.id);
                  const ok = avail >= l.qty;
                  return { it, needed: l.qty, avail, ok };
                });
                const allStockOk = stockCheck.every((s) => s.ok);

                return (
                  <tr key={r.id}>
                    <td>
                      <div className="cell-strong mono">{r.id}</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(r)}>Lihat Detail</button>
                    </td>
                    <td>
                      <div className="cell-strong">{post?.name}</div>
                      <div className="cell-sub">{num(post?.evacuees ?? 0)} jiwa</div>
                    </td>
                    <td>
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td>
                      <div className="cell-strong">{rupiah(r.estimatedValue)}</div>
                      {r.needsApproval && (
                        <span className="badge badge-warning" title="Wajib persetujuan Kepala Dinas">
                          Kepala Dinas <RuleTag code="R-02" />
                        </span>
                      )}
                    </td>
                    <td>
                      {allStockOk ? (
                        <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
                          <CheckCircle2 size={16} /> Stok Mencukupi
                        </span>
                      ) : (
                        <div className="text-danger" style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <AlertTriangle size={14} /> Stok Kurang
                          </div>
                          {stockCheck.filter((s) => !s.ok).map((s) => (
                            <div key={s.it?.id} className="cell-sub text-danger">
                              {s.it?.name}: ada {num(s.avail)}, butuh {num(s.needed)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <SlaChip req={r} now={now} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!allStockOk}
                          title={!allStockOk ? 'Stok gudang tidak mencukupi (R-04)' : undefined}
                          onClick={() => handleApprove(r)}
                        >
                          <CheckCircle2 size={14} /> Setujui
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => { setRejecting(r.id); setSelected(null); }}
                        >
                          <XCircle size={14} /> Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="modal-backdrop" onMouseDown={() => { setRejecting(null); setRejectReason(''); }}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-head">
              <h3>Tolak Permintaan {rejecting}</h3>
            </header>
            <div className="modal-body">
              <div className="alert alert-warning">
                <ShieldAlert size={18} />
                <span>
                  Penolakan resmi wajib mencantumkan alasan minimal {RULES.REJECT_REASON_MIN} karakter agar transparan kepada posko (R-08).
                </span>
              </div>
              <Field label="Alasan Penolakan" hint={`${rejectReason.trim().length}/${RULES.REJECT_REASON_MIN} karakter`}>
                <textarea
                  className="input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Stok di posko masih mencukupi untuk 2 hari kedepan berdasarkan data logistik terakhir..."
                />
              </Field>
            </div>
            <footer className="modal-foot">
              <button className="btn btn-ghost" onClick={() => { setRejecting(null); setRejectReason(''); }}>Batal</button>
              <button
                className="btn btn-danger"
                disabled={rejectReason.trim().length < RULES.REJECT_REASON_MIN}
                onClick={() => handleReject(rejecting)}
              >
                Konfirmasi Penolakan
              </button>
            </footer>
          </div>
        </div>
      )}

      <RequestDetail request={selected} onClose={() => setSelected(null)} />
    </>
  );
};

export default Verification;
