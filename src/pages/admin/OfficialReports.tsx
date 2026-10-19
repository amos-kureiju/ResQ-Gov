import React from 'react';
import { Download, Printer } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { dateTime, downloadCsv, num, rupiah, STATUS_LABEL } from '../../utils/format';
import { PageHeader, Panel } from '../../components/ui';

const OfficialReports: React.FC = () => {
  const { state } = useStore();

  const handleExportCsv = () => {
    const rows = [
      ['ID Permintaan', 'Tanggal', 'Posko', 'Kecamatan', 'Jumlah Jiwa', 'Nilai (Rp)', 'Status', 'Catatan Penyelesaian'],
      ...state.requests.map((r) => {
        const post = state.posts.find((p) => p.id === r.postId);
        return [
          r.id,
          dateTime(r.createdAt),
          post?.name ?? '-',
          post?.district ?? '-',
          post?.evacuees ?? 0,
          r.estimatedValue,
          STATUS_LABEL[r.status],
          r.rejectReason || r.discrepancyNote || '-',
        ];
      }),
    ];
    downloadCsv(`laporan_resmi_resq_gov_${Date.now()}.csv`, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalValue = state.requests.reduce((sum, r) => sum + r.estimatedValue, 0);
  const totalEvacuees = state.posts.reduce((sum, p) => sum + p.evacuees, 0);

  return (
    <>
      <PageHeader
        title="Laporan Resmi Penyaluran Bantuan Bencana"
        subtitle="Dokumen akuntabilitas pertanggungjawaban publik dan audit BPK/Inspektorat Daerah"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handlePrint}>
              <Printer size={16} /> Cetak Dokumen (PDF)
            </button>
            <button className="btn btn-primary" onClick={handleExportCsv}>
              <Download size={16} /> Ekspor Data (.csv)
            </button>
          </div>
        }
      />

      <Panel className="report-doc" style={{ padding: 32, marginBottom: 40 }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.3rem', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            PEMERINTAH DAERAH • DINAS SOSIAL
          </h2>
          <h3 style={{ fontSize: '1.1rem', margin: '4px 0', fontWeight: 600 }}>
            Laporan Realisasi Penyaluran Bantuan Logistik Tanggap Darurat Bencana
          </h3>
          <div className="cell-sub">
            Nomor Dokumen: 400.9/BA-LOG/{new Date().getFullYear()} • Terbit per: {dateTime(Date.now())}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          <div>
            <div className="cell-sub">Total Posko Terdaftar</div>
            <strong style={{ fontSize: '1.2rem' }}>{state.posts.length} Posko</strong>
          </div>
          <div>
            <div className="cell-sub">Total Jiwa Pengungsi Terlayani</div>
            <strong style={{ fontSize: '1.2rem' }}>{num(totalEvacuees)} Jiwa</strong>
          </div>
          <div>
            <div className="cell-sub">Total Nilai Alokasi Logistik</div>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}>{rupiah(totalValue)}</strong>
          </div>
        </div>

        <h4 style={{ marginBottom: 12, fontSize: '1rem' }}>Rekapitulasi Permohonan Logistik Posko</h4>
        <div className="table-wrap" style={{ marginBottom: 32 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Permintaan</th>
                <th>Posko Wilayah</th>
                <th>Tanggal Pengajuan</th>
                <th>Jumlah Jiwa</th>
                <th>Nilai Logistik</th>
                <th>Status Akhir</th>
              </tr>
            </thead>
            <tbody>
              {state.requests.map((r) => {
                const post = state.posts.find((p) => p.id === r.postId);
                return (
                  <tr key={r.id}>
                    <td className="mono cell-strong">{r.id}</td>
                    <td>{post?.name}</td>
                    <td>{dateTime(r.createdAt)}</td>
                    <td className="num">{num(post?.evacuees ?? 0)}</td>
                    <td className="num">{rupiah(r.estimatedValue)}</td>
                    <td>
                      <span className="badge badge-neutral">{STATUS_LABEL[r.status]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ textAlign: 'center', width: 240 }}>
            <div className="cell-sub">Diverifikasi Oleh,</div>
            <div style={{ height: 60 }} />
            <strong>Ir. Bambang Hartono</strong>
            <div className="cell-sub">Koordinator Logistik Pusdalops</div>
          </div>
          <div style={{ textAlign: 'center', width: 240 }}>
            <div className="cell-sub">Mengetahui & Menyetujui,</div>
            <div style={{ height: 60 }} />
            <strong>Dr. Hj. Ratna Wulandari, M.Si</strong>
            <div className="cell-sub">Kepala Dinas Sosial</div>
          </div>
        </div>
      </Panel>
    </>
  );
};

export default OfficialReports;
