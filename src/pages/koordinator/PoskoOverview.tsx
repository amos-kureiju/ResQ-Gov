import React, { useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  Clock,
  Eye,
  Users,
  Tent,
  HeartHandshake,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { RULES } from '../../rules/businessRules';
import { num, rupiah, timeAgo } from '../../utils/format';
import { Modal, PageHeader, Panel, Progress, RuleTag, StatCard, PriorityBadge, StatusBadge } from '../../components/ui';
import type { Post } from '../../types';

const PoskoOverview: React.FC = () => {
  const { state } = useStore();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'stale' | 'active_req'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Perhitungan Agregat KPI Wilayah
  const totalPosts = state.posts.length;
  const totalEvacuees = state.posts.reduce((s, p) => s + p.evacuees, 0);
  const totalCapacity = state.posts.reduce((s, p) => s + p.capacity, 0);
  const avgOccupancy = totalCapacity > 0 ? Math.round((totalEvacuees / totalCapacity) * 100) : 0;
  const totalVulnerable = state.posts.reduce(
    (s, p) => s + p.vulnerable.balita + p.vulnerable.lansia + p.vulnerable.disabilitas + p.vulnerable.ibuHamil,
    0
  );
  const stalePostsCount = state.posts.filter(
    (p) => (Date.now() - p.lastUpdate) / 3600_000 > RULES.HEADCOUNT_MAX_AGE_HOURS
  ).length;

  // Filter List
  const filteredPosts = state.posts.filter((p) => {
    const ageH = (Date.now() - p.lastUpdate) / 3600_000;
    const isStale = ageH > RULES.HEADCOUNT_MAX_AGE_HOURS;
    const occupancy = Math.round((p.evacuees / p.capacity) * 100);
    const hasActiveReq = state.requests.some(
      (r) => r.postId === p.id && !['diterima', 'ditolak', 'selisih'].includes(r.status)
    );

    if (filterMode === 'critical' && occupancy < 80) return false;
    if (filterMode === 'stale' && !isStale) return false;
    if (filterMode === 'active_req' && !hasActiveReq) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedPostReqs = selectedPost
    ? state.requests.filter((r) => r.postId === selectedPost.id)
    : [];

  return (
    <>
      <PageHeader
        title="Pemantauan Posko Pengungsian Wilayah"
        subtitle="Monitoring real-time kapasitas daya tampung, sensus kelompok rentan, dan kepatuhan pembaruan data lapangan (R-10)"
      />

      {/* KPI Summary Cards */}
      <div className="grid-4">
        <StatCard
          icon={<Tent size={22} />}
          label="Total Posko Wilayah"
          value={totalPosts}
          hint="Tersebar di wilayah terdampak"
          tone="primary"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Total Jiwa Pengungsi"
          value={num(totalEvacuees)}
          hint={`Kapasitas: ${num(totalCapacity)} jiwa (${avgOccupancy}% terisi)`}
          tone={avgOccupancy > 85 ? 'warning' : 'info'}
        />
        <StatCard
          icon={<HeartHandshake size={22} />}
          label="Kelompok Rentan"
          value={num(totalVulnerable)}
          hint="Balita, Lansia, Difabel & Ibu Hamil"
          tone="warning"
        />
        <StatCard
          icon={<ShieldCheck size={22} />}
          label="Kepatuhan Sensus (R-10)"
          value={stalePostsCount === 0 ? '100%' : `${totalPosts - stalePostsCount}/${totalPosts}`}
          hint={stalePostsCount === 0 ? 'Semua data posko terkini' : `${stalePostsCount} posko perlu pembaruan`}
          tone={stalePostsCount > 0 ? 'danger' : 'success'}
          pulse={stalePostsCount > 0}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button
            className={`tab ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => setFilterMode('all')}
          >
            Semua Posko <span className="tab-count">{totalPosts}</span>
          </button>
          <button
            className={`tab ${filterMode === 'critical' ? 'active' : ''}`}
            onClick={() => setFilterMode('critical')}
          >
            Kapasitas Kritis (≥80%)
          </button>
          <button
            className={`tab ${filterMode === 'stale' ? 'active' : ''}`}
            onClick={() => setFilterMode('stale')}
          >
            Data Kedaluwarsa {stalePostsCount > 0 && <span className="tab-count" style={{ background: '#fee2e2', color: '#b91c1c' }}>{stalePostsCount}</span>}
          </button>
          <button
            className={`tab ${filterMode === 'active_req' ? 'active' : ''}`}
            onClick={() => setFilterMode('active_req')}
          >
            Ada Permintaan Berjalan
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="input-icon" style={{ width: 220 }}>
            <Search size={15} />
            <input
              className="input input-sm"
              placeholder="Cari nama posko / distrik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid of Posko Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18, marginBottom: 24 }}>
        {filteredPosts.map((p) => {
          const ageH = (Date.now() - p.lastUpdate) / 3600_000;
          const isStale = ageH > RULES.HEADCOUNT_MAX_AGE_HOURS;
          const occupancy = Math.round((p.evacuees / p.capacity) * 100);
          const reqs = state.requests.filter((r) => r.postId === p.id);
          const activeReqs = reqs.filter((r) => !['diterima', 'ditolak', 'selisih'].includes(r.status));
          const v = p.vulnerable;

          return (
            <Panel
              key={p.id}
              className={isStale ? 'border-danger' : occupancy >= 85 ? 'border-warning' : 'border-primary'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{p.name}</h3>
                  <div className="cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <MapPin size={13} style={{ color: 'var(--accent-primary)' }} /> {p.address}, {p.district}
                  </div>
                </div>
                <span className={`badge badge-${isStale ? 'danger' : 'success'}`}>
                  {isStale ? 'Sensus Kedaluwarsa' : 'Sensus Terkini'}
                </span>
              </div>

              {/* Meteran Kepadatan & Daya Tampung */}
              <div style={{ margin: '14px 0', background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span>Kepadatan Hunian ({num(p.evacuees)} / {num(p.capacity)} jiwa)</span>
                  <strong className="mono" style={{ color: occupancy >= 90 ? 'var(--accent-red)' : occupancy >= 75 ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                    {occupancy}%
                  </strong>
                </div>
                <Progress
                  value={occupancy}
                  tone={occupancy >= 90 ? 'danger' : occupancy >= 75 ? 'warning' : 'primary'}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>Tersedia: {Math.max(0, p.capacity - p.evacuees)} jiwa</span>
                  <span>Maksimum: {num(p.capacity)} jiwa</span>
                </div>
              </div>

              {/* Kelompok Rentan */}
              <div className="vuln-grid" style={{ marginBottom: 14 }}>
                <div className="vuln">
                  <strong>{num(v.balita)}</strong>
                  <span>Balita</span>
                </div>
                <div className="vuln">
                  <strong>{num(v.lansia)}</strong>
                  <span>Lansia</span>
                </div>
                <div className="vuln">
                  <strong>{num(v.disabilitas)}</strong>
                  <span>Disabilitas</span>
                </div>
                <div className="vuln">
                  <strong>{num(v.ibuHamil)}</strong>
                  <span>Ibu Hamil</span>
                </div>
              </div>

              {/* Action & Status Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid var(--card-border)',
                  fontSize: '0.78rem',
                }}
              >
                <span className="cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Sensus {timeAgo(p.lastUpdate)}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activeReqs.length > 0 && (
                    <span className="badge badge-info" title="Permintaan logistik sedang diproses">
                      {activeReqs.length} Permintaan
                    </span>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedPost(p)}
                    title="Buka rincian lengkap posko"
                  >
                    <Eye size={13} /> Rincian
                  </button>
                </div>
              </div>

              {isStale && (
                <div className="alert alert-danger compact" style={{ marginTop: 12 }}>
                  <AlertTriangle size={14} />
                  <span>
                    Posko belum memperbarui data selama {Math.floor(ageH)} jam. Pengajuan bantuan diblokir sementara sampai data disahkan. <RuleTag code="R-10" />
                  </span>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <p className="cell-sub">Tidak ada posko yang sesuai dengan kriteria penyaringan saat ini.</p>
        </div>
      )}

      {/* Modal Detail Posko */}
      {selectedPost && (
        <Modal
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          wide
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tent size={18} className="text-primary" />
              <span>{selectedPost.name}</span>
            </div>
          }
        >
          <div className="stack" style={{ gap: 16 }}>
            <div className="detail-grid">
              <div className="detail-item">
                <MapPin size={16} />
                <div>
                  <span>Lokasi & Wilayah</span>
                  <strong>{selectedPost.address}</strong>
                  <em>{selectedPost.district}</em>
                </div>
              </div>
              <div className="detail-item">
                <Clock size={16} />
                <div>
                  <span>Pembaruan Sensus Terakhir</span>
                  <strong>{timeAgo(selectedPost.lastUpdate)}</strong>
                  <em>
                    Status:{' '}
                    {(Date.now() - selectedPost.lastUpdate) / 3600_000 > RULES.HEADCOUNT_MAX_AGE_HOURS
                      ? 'Kedaluwarsa (> 24 Jam)'
                      : 'Sah & Terverifikasi'}
                  </em>
                </div>
              </div>
              <div className="detail-item">
                <Users size={16} />
                <div>
                  <span>Daya Tampung Posko</span>
                  <strong>{num(selectedPost.evacuees)} / {num(selectedPost.capacity)} jiwa</strong>
                  <em>{Math.round((selectedPost.evacuees / selectedPost.capacity) * 100)}% Kepadatan</em>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid var(--card-border)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.04em' }}>
                Rincian Kelompok Rentan Terdata
              </h4>
              <div className="vuln-grid">
                <div className="vuln">
                  <strong>{num(selectedPost.vulnerable.balita)}</strong>
                  <span>Balita</span>
                </div>
                <div className="vuln">
                  <strong>{num(selectedPost.vulnerable.lansia)}</strong>
                  <span>Lansia</span>
                </div>
                <div className="vuln">
                  <strong>{num(selectedPost.vulnerable.disabilitas)}</strong>
                  <span>Disabilitas</span>
                </div>
                <div className="vuln">
                  <strong>{num(selectedPost.vulnerable.ibuHamil)}</strong>
                  <span>Ibu Hamil</span>
                </div>
              </div>
            </div>

            <h4 className="section-label">Riwayat & Daftar Permintaan Bantuan Posko</h4>
            {selectedPostReqs.length === 0 ? (
              <p className="cell-sub pad" style={{ padding: 16, background: '#f8fafc', borderRadius: 6, textAlign: 'center' }}>
                Belum ada riwayat permohonan logistik untuk posko ini.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>No. Permintaan</th>
                      <th>Prioritas</th>
                      <th>Nilai Bantuan</th>
                      <th>Status Pengesahan</th>
                      <th>Komoditas Diminta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPostReqs.map((r) => (
                      <tr key={r.id}>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{r.id}</td>
                        <td><PriorityBadge priority={r.priority} /></td>
                        <td className="mono">{rupiah(r.estimatedValue)}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="cell-sub">
                          {r.lines
                            .map((l) => state.items.find((i) => i.id === l.itemId)?.name)
                            .join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default PoskoOverview;
