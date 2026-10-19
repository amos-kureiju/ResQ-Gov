import React, { useState } from 'react';
import { Users, HeartHandshake, ClipboardList, PackageCheck, AlertTriangle, PlusCircle, RefreshCw, Baby, Accessibility, PersonStanding } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { FINAL_STATUSES, inFlightQty, maxAllowedQty, RULES } from '../../rules/businessRules';
import { num, timeAgo } from '../../utils/format';
import { EmptyState, PageHeader, Panel, Progress, RuleTag, StatCard } from '../../components/ui';
import { RequestDetail, RequestTable } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const PoskoDashboard: React.FC = () => {
  const { state, user } = useStore();
  const [open, setOpen] = useState<AidRequest | null>(null);
  const post = state.posts.find((p) => p.id === user?.postId);
  if (!post) return <EmptyState title="Akun belum ditugaskan ke posko" text="Hubungi Kepala Dinas untuk penugasan posko." />;

  const mine = state.requests.filter((r) => r.postId === post.id);
  const active = mine.filter((r) => !FINAL_STATUSES.includes(r.status));
  const toConfirm = mine.filter((r) => r.status === 'terkirim');
  const ageH = (Date.now() - post.lastUpdate) / 3600_000;
  const v = post.vulnerable;
  const vulnerableTotal = v.balita + v.lansia + v.disabilitas + v.ibuHamil;
  const occupancy = (post.evacuees / post.capacity) * 100;

  return (
    <>
      <PageHeader
        title={post.name}
        subtitle={`${post.address} • ${post.district}`}
        actions={<>
          <a className="btn btn-outline" href="#/posko/pengungsi"><RefreshCw size={16} /> Perbarui Data</a>
          <a className="btn btn-primary" href="#/posko/ajukan"><PlusCircle size={16} /> Ajukan Bantuan</a>
        </>}
      />

      {ageH > RULES.HEADCOUNT_MAX_AGE_HOURS - 6 && (
        <div className={`alert ${ageH > RULES.HEADCOUNT_MAX_AGE_HOURS ? 'alert-danger' : 'alert-warning'}`}>
          <AlertTriangle size={18} />
          <div>
            <strong>Data pengungsi terakhir diperbarui {timeAgo(post.lastUpdate)}.</strong>
            <p>Permintaan bantuan hanya dapat diajukan bila data diperbarui dalam {RULES.HEADCOUNT_MAX_AGE_HOURS} jam terakhir. <RuleTag code="R-10" /></p>
          </div>
          <a className="btn btn-sm btn-primary" href="#/posko/pengungsi">Perbarui sekarang</a>
        </div>
      )}
      {toConfirm.length > 0 && (
        <div className="alert alert-warning">
          <PackageCheck size={18} />
          <div>
            <strong>{toConfirm.length} pengiriman telah diserahkan dan menunggu konfirmasi jumlah fisik Anda.</strong>
            <p>Hitung barang yang diterima dan catat bila ada selisih. <RuleTag code="R-06" /></p>
          </div>
          <a className="btn btn-sm btn-primary" href="#/posko/permintaan">Konfirmasi</a>
        </div>
      )}

      <div className="grid-4">
        <StatCard icon={<Users size={22} />} label="Jumlah Pengungsi" value={num(post.evacuees)} hint={`Kapasitas ${num(post.capacity)} (${occupancy.toFixed(0)}%)`} tone={occupancy > 95 ? 'danger' : 'primary'} />
        <StatCard icon={<HeartHandshake size={22} />} label="Kelompok Rentan" value={num(vulnerableTotal)} hint={`${((vulnerableTotal / Math.max(1, post.evacuees)) * 100).toFixed(0)}% dari pengungsi`} tone="warning" />
        <StatCard icon={<ClipboardList size={22} />} label="Permintaan Aktif" value={active.length} hint={`${mine.length} total permintaan`} tone="info" />
        <StatCard icon={<PackageCheck size={22} />} label="Perlu Konfirmasi" value={toConfirm.length} hint="Barang sudah diserahkan" tone={toConfirm.length ? 'danger' : 'success'} pulse={toConfirm.length > 0} />
      </div>

      <div className="grid-main">
        <Panel title="Kuota Kebutuhan Posko" subtitle={<>Batas maksimal berdasarkan {num(post.evacuees)} jiwa <RuleTag code="R-03" /></>}>
          <div className="quota-list">
            {state.items.map((it) => {
              const cap = maxAllowedQty(it, post);
              const flight = inFlightQty(state.requests, post.id, it.id);
              const pct = cap ? (flight / cap) * 100 : 0;
              return (
                <div className="quota-row" key={it.id}>
                  <div className="quota-label"><strong>{it.name}</strong><span>{num(flight)} / {num(cap)} {it.unit}</span></div>
                  <Progress value={pct} tone={pct > 90 ? 'danger' : pct > 60 ? 'warning' : 'primary'} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Komposisi Kelompok Rentan" subtitle="Prioritas penanganan khusus">
          <div className="vuln-grid">
            <div className="vuln"><Baby size={20} /><strong>{num(v.balita)}</strong><span>Balita</span></div>
            <div className="vuln"><PersonStanding size={20} /><strong>{num(v.lansia)}</strong><span>Lansia</span></div>
            <div className="vuln"><Accessibility size={20} /><strong>{num(v.disabilitas)}</strong><span>Disabilitas</span></div>
            <div className="vuln"><HeartHandshake size={20} /><strong>{num(v.ibuHamil)}</strong><span>Ibu Hamil</span></div>
          </div>
          <p className="cell-sub mt">Diperbarui {timeAgo(post.lastUpdate)}</p>
        </Panel>
      </div>

      <Panel title="Permintaan Terbaru" actions={<a className="btn btn-ghost btn-sm" href="#/posko/permintaan">Lihat semua</a>}>
        {mine.length ? <RequestTable requests={mine.slice(0, 5)} onOpen={setOpen} showPost={false} /> : <EmptyState title="Belum ada permintaan" />}
      </Panel>
      <RequestDetail request={open} onClose={() => setOpen(null)} showHandoverCode />
    </>
  );
};

export default PoskoDashboard;
