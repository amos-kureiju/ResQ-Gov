import React, { useState } from 'react';
import { Crown, CheckCircle2, AlertOctagon, Users, FileText, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/StoreContext';
import { num, rupiah } from '../../utils/format';
import { EmptyState, PageHeader, Panel, PriorityBadge, RuleTag, SlaChip, StatCard, useNow } from '../../components/ui';
import { RequestDetail } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const AdminDashboard: React.FC = () => {
  const { state } = useStore();
  const now = useNow();
  const [selectedReq, setSelectedReq] = useState<AidRequest | null>(null);

  const pendingApproval = state.requests.filter((r) => r.status === 'menunggu_persetujuan');
  const discrepancies = state.requests.filter((r) => r.status === 'selisih' && !r.discrepancyResolved);
  const totalEvacuees = state.posts.reduce((sum, p) => sum + p.evacuees, 0);
  const totalValueDistributed = state.requests
    .filter((r) => r.status === 'diterima' || r.status === 'selisih' || r.status === 'terkirim')
    .reduce((sum, r) => sum + r.estimatedValue, 0);

  // Data trend agregat untuk grafik
  const chartData = [
    { time: '08:00', pangan: 80, medis: 60, hunian: 90 },
    { time: '11:00', pangan: 65, medis: 50, hunian: 90 },
    { time: '14:00', pangan: 45, medis: 30, hunian: 85 },
    { time: '17:00', pangan: 75, medis: 65, hunian: 95 },
    { time: '20:00', pangan: 68, medis: 58, hunian: 90 },
  ];

  return (
    <>
      <PageHeader
        title="Ringkasan Eksekutif & Komando Kebijakan"
        subtitle="Pengawasan tertinggi akuntabilitas logistik bencana dan persetujuan pengeluaran anggaran (R-01, R-02)"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <a className="btn btn-outline" href="#/peta">
              <MapPin size={16} /> Peta Situasi GIS
            </a>
            <a className="btn btn-outline" href="#/admin/laporan">
              <FileText size={16} /> Laporan Resmi
            </a>
            <a className="btn btn-primary" href="#/admin/persetujuan">
              <CheckCircle2 size={16} /> Meja Persetujuan ({pendingApproval.length})
            </a>
          </div>
        }
      />

      {discrepancies.length > 0 && (
        <div className="alert alert-danger">
          <AlertOctagon size={20} />
          <div>
            <strong>PERINGATAN: Terdapat {discrepancies.length} kasus SELISIH penerimaan barang di lapangan!</strong>
            <p>
              Barang yang diterima posko tidak sesuai dengan surat jalan. Wajib ditindaklanjuti untuk pertanggungjawaban BAST. <RuleTag code="R-06" />
            </p>
          </div>
          <a className="btn btn-sm btn-primary" href="#/admin/persetujuan">Tindak Lanjuti</a>
        </div>
      )}

      <div className="grid-4">
        <StatCard
          icon={<Crown size={22} />}
          label="Menunggu Persetujuan Anda"
          value={pendingApproval.length}
          hint="Nilai > Rp 25 Juta"
          tone={pendingApproval.length ? 'warning' : 'success'}
          pulse={pendingApproval.length > 0}
        />
        <StatCard
          icon={<AlertOctagon size={22} />}
          label="Kasus Selisih Fisik"
          value={discrepancies.length}
          hint="Perlu Berita Acara Khusus"
          tone={discrepancies.length ? 'danger' : 'success'}
        />
        <StatCard
          icon={<Users size={22} />}
          label="Total Pengungsi Terdata"
          value={num(totalEvacuees)}
          hint={`Tersebar di ${state.posts.length} Posko`}
          tone="primary"
        />
        <StatCard
          icon={<FileText size={22} />}
          label="Bantuan Tersalurkan"
          value={rupiah(totalValueDistributed)}
          hint="Realisasi Anggaran Lapangan"
          tone="info"
        />
      </div>

      <div className="grid-main">
        <Panel title="Tren Ketahanan Cadangan Logistik Daerah" subtitle="Monitoring ketersediaan agregat logistik dinas">
          <div className="chart" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFoodAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMedAdm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf5" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip />
                <Area type="monotone" dataKey="pangan" name="Ketahanan Pangan (%)" stroke="#d97706" strokeWidth={2} fill="url(#colorFoodAdm)" />
                <Area type="monotone" dataKey="medis" name="Obat & Medis (%)" stroke="#2563eb" strokeWidth={2} fill="url(#colorMedAdm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Berkas Penting Menunggu Tindakan" actions={<a className="btn btn-ghost btn-sm" href="#/admin/persetujuan">Lihat Semua</a>}>
          {pendingApproval.length === 0 ? (
            <EmptyState title="Tidak ada berkas tertunda" text="Semua permohonan telah diverifikasi dan disetujui." />
          ) : (
            <div className="queue">
              {pendingApproval.map((r) => {
                const post = state.posts.find((p) => p.id === r.postId);
                return (
                  <button key={r.id} className="queue-row" onClick={() => setSelectedReq(r)}>
                    <span className="mono cell-strong">{r.id}</span>
                    <PriorityBadge priority={r.priority} />
                    <span className="queue-post">
                      {post?.name}
                      <em>{rupiah(r.estimatedValue)}</em>
                    </span>
                    <SlaChip req={r} now={now} />
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <RequestDetail request={selectedReq} onClose={() => setSelectedReq(null)} />
    </>
  );
};

export default AdminDashboard;
