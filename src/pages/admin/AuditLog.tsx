import React, { useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, Download } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { verifyAuditChain } from '../../store/audit';
import { dateTime, downloadCsv, ROLE_LABEL } from '../../utils/format';
import { EmptyState, PageHeader, Panel, RuleTag } from '../../components/ui';

const AuditLogPage: React.FC = () => {
  const { state } = useStore();
  const [filter, setFilter] = useState('');
  const [manualCheckNonce, setManualCheckNonce] = useState(0);

  const verification = useMemo(() => {
    // Re-verify whenever audit changes or manual re-test is triggered
    return verifyAuditChain(state.audit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.audit, manualCheckNonce]);

  const runVerification = () => {
    setManualCheckNonce((v) => v + 1);
  };

  const handleExport = () => {
    const rows = [
      ['No Urut', 'Waktu', 'Aktor', 'Peran', 'Aksi', 'Target', 'Rincian', 'Flagged', 'Prev Hash', 'Hash'],
      ...state.audit.map((e) => [
        e.seq,
        dateTime(e.at),
        e.actorName,
        e.role,
        e.action,
        e.target,
        e.detail,
        e.flagged ? 'YA' : 'TIDAK',
        e.prevHash,
        e.hash,
      ]),
    ];
    downloadCsv(`audit_log_resq_gov_${Date.now()}.csv`, rows);
  };

  const filteredLogs = useMemo(() => {
    const q = filter.toLowerCase().trim();
    return state.audit
      .filter(
        (e) =>
          !q ||
          e.action.toLowerCase().includes(q) ||
          e.actorName.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q)
      )
      .slice()
      .reverse();
  }, [state.audit, filter]);

  return (
    <>
      <PageHeader
        title="Audit Log Anti-Manipulasi & Integritas Sistem"
        subtitle="Catatan jejak aktivitas append-only berantai hash (hash chain) yang tidak dapat diedit atau dihapus (R-09)"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={runVerification}>
              <RefreshCw size={16} /> Uji Integritas Rantai
            </button>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} /> Unduh Berkas Audit (.csv)
            </button>
          </div>
        }
      />

      <div className={`alert ${verification.valid ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 20 }}>
        {verification.valid ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
        <div>
          <strong>
            {verification.valid
              ? `Integritas Rantai Valid: Seluruh ${verification.checked} entri log sah dan terhubung utuh.`
              : `PERINGATAN: Integritas log TERPUTUS pada urutan ke-${verification.brokenAt}!`}
          </strong>
          <p>
            {verification.valid
              ? 'Setiap entri diverifikasi terhadap hash entri sebelumnya. Tidak ditemukan indikasi manipulasi atau penghapusan data.'
              : verification.reason}
          </p>
        </div>
      </div>

      <Panel
        title="Buku Besar Jejak Digital (Audit Trail)"
        subtitle="Mencatat seluruh aksi, waktu, aktor, NIP, serta peringatan anomali sistem"
        actions={
          <div style={{ position: 'relative', width: 260 }}>
            <input
              className="input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Cari aksi, aktor, atau rincian..."
            />
          </div>
        }
      >
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="Tidak ditemukan catatan log"
            text={filter ? `Tidak ada entri audit yang cocok dengan kata kunci "${filter}".` : 'Belum ada catatan aktivitas.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seq #</th>
                  <th>Waktu Kejadian</th>
                  <th>Aparatur / Aktor</th>
                  <th>Peran</th>
                  <th>Aksi Sistem</th>
                  <th>Rincian Catatan</th>
                  <th>Hash Integritas (cyrb53)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((e) => (
                  <tr key={e.seq} className={e.flagged ? 'row-warning' : ''}>
                    <td className="mono cell-strong">#{e.seq}</td>
                    <td className="cell-sub">{dateTime(e.at)}</td>
                    <td>
                      <strong>{e.actorName}</strong>
                      <div className="cell-sub mono">{e.actorId}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {e.role === 'sistem' ? 'Sistem Otomatis' : ROLE_LABEL[e.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${e.flagged ? 'warning' : 'info'}`}>
                        {e.action}
                      </span>
                      {e.flagged && (
                        <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                          Anomali <RuleTag code="R-09" />
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: '0.85rem' }}>{e.detail}</div>
                      {e.target !== '-' && <div className="cell-sub">Target: {e.target}</div>}
                    </td>
                    <td className="mono cell-sub" style={{ fontSize: '0.75rem' }} title={`Prev: ${e.prevHash}`}>
                      {e.hash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

export default AuditLogPage;
