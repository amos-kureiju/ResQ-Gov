import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileCheck, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { RULES } from '../../rules/businessRules';
import { num, rupiah } from '../../utils/format';
import { EmptyState, Field, PageHeader, Panel, PriorityBadge, RuleTag, SlaChip, useNow } from '../../components/ui';
import { RequestDetail } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const Approval: React.FC = () => {
  const { state, approveRequest, resolveDiscrepancy } = useStore();
  const toast = useToast();
  const now = useNow();

  const [selectedReq, setSelectedReq] = useState<AidRequest | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const pendingApprovals = state.requests.filter((r) => r.status === 'menunggu_persetujuan');
  const discrepancies = state.requests.filter((r) => r.status === 'selisih');

  const handleApprove = (reqId: string) => {
    toast(approveRequest(reqId, true, 'Disetujui oleh Kepala Dinas Sosial.'));
    setSelectedReq(null);
  };

  const handleReject = (reqId: string) => {
    if (toast(approveRequest(reqId, false, rejectReason))) {
      setRejectingId(null);
      setRejectReason('');
      setSelectedReq(null);
    }
  };

  const handleResolveDiscrepancy = (reqId: string) => {
    if (toast(resolveDiscrepancy(reqId, resolutionNote))) {
      setResolvingId(null);
      setResolutionNote('');
      setSelectedReq(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Meja Persetujuan Pimpinan & Penanganan Selisih"
        subtitle="Otorisasi pengeluaran logistik bernilai tinggi (> Rp 25 Juta) dan penyelesaian Berita Acara Selisih (R-02, R-06)"
      />

      <div className="stack">
        <Panel
          title="Permohonan Menunggu Persetujuan Kepala Dinas"
          subtitle={`Nilai bantuan melebihi batas desentralisasi (Rp ${RULES.APPROVAL_VALUE_THRESHOLD.toLocaleString('id-ID')})`}
        >
          {pendingApprovals.length === 0 ? (
            <EmptyState
              title="Tidak ada permohonan yang menunggu persetujuan"
              text="Semua permohonan telah ditandatangani secara digital."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Permintaan</th>
                    <th>Posko Pengungsian</th>
                    <th>Prioritas</th>
                    <th>Diverifikasi Oleh</th>
                    <th>Estimasi Nilai</th>
                    <th>SLA Penanganan</th>
                    <th>Keputusan Pimpinan</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((r) => {
                    const post = state.posts.find((p) => p.id === r.postId);
                    const verifier = state.users.find((u) => u.id === r.verifiedBy);

                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="cell-strong mono">{r.id}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedReq(r)}
                          >
                            Periksa Rincian
                          </button>
                        </td>
                        <td>
                          <div className="cell-strong">{post?.name}</div>
                          <div className="cell-sub">{num(post?.evacuees ?? 0)} jiwa pengungsi</div>
                        </td>
                        <td>
                          <PriorityBadge priority={r.priority} />
                        </td>
                        <td>
                          <div className="cell-strong">{verifier?.name ?? 'Koordinator Logistik'}</div>
                          <div className="cell-sub">Pusdalops Logistik</div>
                        </td>
                        <td>
                          <div className="cell-strong text-primary">{rupiah(r.estimatedValue)}</div>
                          <span className="badge badge-warning">Wajib Kadis <RuleTag code="R-02" /></span>
                        </td>
                        <td>
                          <SlaChip req={r} now={now} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(r.id)}
                            >
                              <CheckCircle2 size={14} /> Beri Persetujuan
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => { setRejectingId(r.id); setSelectedReq(null); }}
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
        </Panel>

        <Panel
          title="Audit Selisih Penerimaan Fisik di Posko"
          subtitle="Posko melaporkan barang yang diterima kurang dari yang dikirim (R-06)"
        >
          {discrepancies.length === 0 ? (
            <EmptyState
              title="Tidak ada laporan selisih penerimaan"
              text="Seluruh barang tersalurkan secara utuh sesuai surat jalan."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Permintaan</th>
                    <th>Posko Pelapor</th>
                    <th>Rincian Barang Kurang</th>
                    <th>Status Kasus</th>
                    <th>Catatan Penyelesaian</th>
                    <th>Tindakan Pimpinan</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((r) => {
                    const post = state.posts.find((p) => p.id === r.postId);
                    const missingItems = r.lines.filter((l) => (l.receivedQty ?? 0) < l.qty);

                    return (
                      <tr key={r.id} className={!r.discrepancyResolved ? 'row-error' : ''}>
                        <td>
                          <div className="cell-strong mono">{r.id}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedReq(r)}
                          >
                            Detail
                          </button>
                        </td>
                        <td>
                          <div className="cell-strong">{post?.name}</div>
                          <div className="cell-sub">{post?.district}</div>
                        </td>
                        <td>
                          <div className="text-danger" style={{ fontSize: '0.85rem' }}>
                            {missingItems.map((l) => {
                              const it = state.items.find((i) => i.id === l.itemId);
                              return (
                                <div key={l.itemId}>
                                  <strong>{it?.name}</strong>: kirim {l.qty}, sampai {l.receivedQty} (kurang {l.qty - (l.receivedQty ?? 0)} {it?.unit})
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          {r.discrepancyResolved ? (
                            <span className="badge badge-success">Selesai Ditindaklanjuti</span>
                          ) : (
                            <span className="badge badge-danger">MENUNGGU PENETAPAN <RuleTag code="R-06" /></span>
                          )}
                        </td>
                        <td className="cell-sub" style={{ maxWidth: 220 }}>
                          {r.discrepancyNote ? r.discrepancyNote : 'Belum ada penetapan berita acara'}
                        </td>
                        <td>
                          {!r.discrepancyResolved && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => { setResolvingId(r.id); setSelectedReq(null); }}
                            >
                              <FileCheck size={14} /> Tindak Lanjuti
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {rejectingId && (
        <div className="modal-backdrop" onMouseDown={() => { setRejectingId(null); setRejectReason(''); }}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-head">
              <h3>Tolak Persetujuan {rejectingId}</h3>
            </header>
            <div className="modal-body">
              <div className="alert alert-warning">
                <ShieldAlert size={18} />
                <span>
                  Penolakan tingkat pimpinan wajib memiliki dasar yang jelas (minimal {RULES.REJECT_REASON_MIN} karakter) dan akan terekam dalam audit trail (R-08).
                </span>
              </div>
              <Field label="Alasan Penolakan Kadis" hint={`${rejectReason.trim().length}/${RULES.REJECT_REASON_MIN} karakter`}>
                <textarea
                  className="input"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Alokasi anggaran untuk kebutuhan hunian darurat pada posko ini melebihi pagu cadangan darurat..."
                />
              </Field>
            </div>
            <footer className="modal-foot">
              <button className="btn btn-ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Batal</button>
              <button
                className="btn btn-danger"
                disabled={rejectReason.trim().length < RULES.REJECT_REASON_MIN}
                onClick={() => handleReject(rejectingId)}
              >
                Kirim Keputusan Penolakan
              </button>
            </footer>
          </div>
        </div>
      )}

      {resolvingId && (
        <div className="modal-backdrop" onMouseDown={() => { setResolvingId(null); setResolutionNote(''); }}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-head">
              <h3>Tindak Lanjut Berita Acara Selisih {resolvingId}</h3>
            </header>
            <div className="modal-body">
              <p className="cell-sub" style={{ marginBottom: 12 }}>
                Tuliskan instruksi penyelesaian resmi Kepala Dinas (misal: penggantian oleh rekanan armada, pembebanan susut bencana alam, atau teguran inspektorat).
              </p>
              <Field label="Berita Acara Keputusan" hint={`${resolutionNote.trim().length}/${RULES.REJECT_REASON_MIN} karakter`}>
                <textarea
                  className="input"
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Contoh: Diterbitkan BAST Susut Kerusakan Pengangkutan No. 44/BA-DS/X/2026. Kerusakan diganti oleh gudang logistik..."
                />
              </Field>
            </div>
            <footer className="modal-foot">
              <button className="btn btn-ghost" onClick={() => { setResolvingId(null); setResolutionNote(''); }}>Batal</button>
              <button
                className="btn btn-primary"
                disabled={resolutionNote.trim().length < RULES.REJECT_REASON_MIN}
                onClick={() => handleResolveDiscrepancy(resolvingId)}
              >
                Tetapkan Tindak Lanjut
              </button>
            </footer>
          </div>
        </div>
      )}

      <RequestDetail request={selectedReq} onClose={() => setSelectedReq(null)} />
    </>
  );
};

export default Approval;
