import React, { useState } from 'react';
import { ClipboardCheck, Truck, PackageX, Timer, ArrowRight, Map as MapIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts';
import { useStore, availableQty } from '../../store/StoreContext';
import { getSla } from '../../rules/businessRules';
import { num, VEHICLE_LABEL } from '../../utils/format';
import { Badge, EmptyState, PageHeader, Panel, PriorityBadge, SlaChip, StatCard, useNow } from '../../components/ui';
import { RequestDetail } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const KoorDashboard: React.FC = () => {
  const { state } = useStore();
  const now = useNow();
  const [open, setOpen] = useState<AidRequest | null>(null);

  const pending = state.requests.filter((r) => r.status === 'diajukan');
  const overdue = state.requests.filter((r) => getSla(r, now).overdue);
  const ready = state.requests.filter((r) => r.status === 'disetujui');
  const onRoad = state.shipments.filter((s) => s.status === 'ditugaskan' || s.status === 'dalam_perjalanan');
  const lowStock = state.items.filter((i) => i.stock <= i.minStock);
  const queue = state.requests
    .filter((r) => getSla(r, now).stage)
    .sort((a, b) => getSla(a, now).deadline - getSla(b, now).deadline)
    .slice(0, 6);

  const chart = state.items.map((i) => ({
    name: i.name.split(' ')[0],
    full: i.name,
    ratio: Math.round((availableQty(state, i.id) / i.minStock) * 100),
    low: i.stock <= i.minStock,
  }));

  return (
    <>
      <PageHeader
        title="Pusat Kendali Logistik"
        subtitle="Ringkasan operasional distribusi bantuan secara real-time"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <a className="btn btn-outline" href="#/peta">
              <MapIcon size={16} /> Buka Peta Krisis GIS
            </a>
            <a className="btn btn-primary" href="#/koordinator/verifikasi">
              <ClipboardCheck size={16} /> Antrean Verifikasi
            </a>
          </div>
        }
      />
      <div className="grid-4">
        <StatCard icon={<ClipboardCheck size={22} />} label="Menunggu Verifikasi" value={pending.length} hint={`${pending.filter((r) => r.priority === 'darurat').length} darurat`} tone="info" pulse={pending.some((r) => r.priority === 'darurat')} />
        <StatCard icon={<Timer size={22} />} label="Melewati SLA" value={overdue.length} hint="Dieskalasi ke Kepala Dinas" tone={overdue.length ? 'danger' : 'success'} />
        <StatCard icon={<Truck size={22} />} label="Armada di Lapangan" value={`${onRoad.length} / ${state.vehicles.length}`} hint={`${ready.length} permintaan siap dikirim`} tone="primary" />
        <StatCard icon={<PackageX size={22} />} label="Stok di Bawah Minimum" value={lowStock.length} hint={lowStock.map((i) => i.name).join(', ') || 'Semua aman'} tone={lowStock.length ? 'warning' : 'success'} />
      </div>

      <div className="grid-main">
        <Panel title="Ketersediaan Stok vs Batas Minimum" subtitle="100% = tepat di batas minimum (setelah dikurangi alokasi)">
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, 'Rasio']} labelFormatter={(_l, p) => p?.[0]?.payload?.full ?? ''} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <ReferenceLine y={100} stroke="#dc2626" strokeDasharray="4 4" />
                <Bar dataKey="ratio" radius={[6, 6, 0, 0]}>
                  {chart.map((c) => <Cell key={c.name} fill={c.ratio <= 100 ? '#dc2626' : c.ratio < 160 ? '#d97706' : '#1d4ed8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Status Armada" actions={<a className="btn btn-ghost btn-sm" href="#/koordinator/dispatch">Kelola</a>}>
          <ul className="fleet-list">
            {state.vehicles.map((v) => {
              const driver = state.users.find((u) => u.vehicleId === v.id && u.active);
              const shp = state.shipments.find((s) => s.vehicleId === v.id && (s.status === 'ditugaskan' || s.status === 'dalam_perjalanan'));
              const post = shp && state.posts.find((p) => p.id === state.requests.find((r) => r.id === shp.requestId)?.postId);
              return (
                <li key={v.id}>
                  <div className={`fleet-icon st-${v.status}`}><Truck size={16} /></div>
                  <div className="fleet-body">
                    <strong>{v.plate}</strong> <span className="cell-sub">{v.type}</span>
                    <div className="cell-sub">{driver?.name ?? 'Tanpa pengemudi'}{post && <> <ArrowRight size={11} /> {post.name}</>}</div>
                  </div>
                  <Badge tone={v.status === 'tersedia' ? 'success' : v.status === 'bertugas' ? 'primary' : 'neutral'}>{VEHICLE_LABEL[v.status]}</Badge>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Antrean Prioritas Berdasarkan Tenggat SLA" subtitle="Diurutkan dari tenggat terdekat">
        {queue.length === 0 ? <EmptyState title="Tidak ada permintaan aktif" /> : (
          <div className="queue">
            {queue.map((r) => {
              const post = state.posts.find((p) => p.id === r.postId);
              return (
                <button key={r.id} className="queue-row" onClick={() => setOpen(r)}>
                  <span className="mono cell-strong">{r.id}</span>
                  <PriorityBadge priority={r.priority} />
                  <span className="queue-post">{post?.name}<em>{num(post?.evacuees ?? 0)} jiwa</em></span>
                  <Badge tone="neutral">{r.status === 'diajukan' ? 'Verifikasi' : r.status === 'menunggu_persetujuan' ? 'Persetujuan' : r.status === 'disetujui' ? 'Dispatch' : 'Pengiriman'}</Badge>
                  <SlaChip req={r} now={now} />
                </button>
              );
            })}
          </div>
        )}
      </Panel>
      <RequestDetail request={open} onClose={() => setOpen(null)} />
    </>
  );
};

export default KoorDashboard;
