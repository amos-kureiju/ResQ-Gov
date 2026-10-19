import React, { useState } from 'react';
import {
  MapPin,
  Radio,
  Layers,
  Zap,
  Compass,
  PlusCircle,
  Truck,
  Navigation,
} from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { num } from '../../utils/format';
import { EmptyState, Field, Modal, PageHeader, Panel, Progress } from '../../components/ui';
import type { Post, Shipment } from '../../types';

export const CrisisMap: React.FC = () => {
  const { state, user, triggerRandomEvent, addPost } = useStore();
  const toast = useToast();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showHazardLayer, setShowHazardLayer] = useState(true);
  const [showRoutesLayer, setShowRoutesLayer] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form tambah posko baru
  const [newPostName, setNewPostName] = useState('');
  const [newPostDistrict, setNewPostDistrict] = useState('Kec. Cibeber');
  const [newPostAddress, setNewPostAddress] = useState('');
  const [newPostCapacity, setNewPostCapacity] = useState(400);
  const [newPostEvacuees, setNewPostEvacuees] = useState(150);

  const activeShipments = state.shipments.filter(
    (s) => s.status === 'dalam_perjalanan' || s.status === 'ditugaskan'
  );

  const handleSimulate = () => {
    const msg = triggerRandomEvent();
    toast({ ok: true, message: msg });
  };

  const handleAddPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addPost({
      name: newPostName,
      address: newPostAddress,
      district: newPostDistrict,
      capacity: newPostCapacity,
      evacuees: newPostEvacuees,
      coords: {
        x: Math.floor(25 + Math.random() * 50),
        y: Math.floor(25 + Math.random() * 50),
        lat: -6.82 + (Math.random() - 0.5) * 0.06,
        lng: 107.16 + (Math.random() - 0.5) * 0.06,
      },
    });
    if (toast(res)) {
      setShowAddModal(false);
      setNewPostName('');
      setNewPostAddress('');
    }
  };

  // Titik koordinat Gudang Induk (Central Depot) di tengah peta
  const centralDepot = { x: 50, y: 50 };

  const renderPostActions = () => {
    if (user?.role === 'admin') {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-primary btn-sm btn-block" href="#/admin/persetujuan">
            Meja Persetujuan
          </a>
          <a className="btn btn-outline btn-sm" href="#/admin/laporan">
            Laporan
          </a>
        </div>
      );
    }
    if (user?.role === 'koordinator') {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-primary btn-sm btn-block" href="#/koordinator/dispatch">
            Dispatch Armada
          </a>
          <a className="btn btn-outline btn-sm" href="#/koordinator/posko">
            Posko Wilayah
          </a>
        </div>
      );
    }
    if (user?.role === 'posko') {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-primary btn-sm btn-block" href="#/posko/ajukan">
            Ajukan Bantuan
          </a>
          <a className="btn btn-outline btn-sm" href="#/posko/pengungsi">
            Data Pengungsi
          </a>
        </div>
      );
    }
    return (
      <a className="btn btn-primary btn-sm btn-block" href="#/driver/tugas">
        Tugas Pengiriman
      </a>
    );
  };

  return (
    <>
      <PageHeader
        title="Peta Situasi Krisis & Radar Logistik (GIS Command Center)"
        subtitle="Visualisasi real-time sebaran posko bencana, pergerakan armada GPS, dan pemantauan zona bahaya"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handleSimulate}>
              <Zap size={16} className="text-warning" /> ⚡ Picu Kejadian Lapangan
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <PlusCircle size={16} /> Daftarkan Posko Baru
            </button>
          </div>
        }
      />

      {state.disasterAlert && (
        <div className={`alert ${state.disasterAlert.level === 'siaga1' ? 'alert-danger' : 'alert-warning'}`} style={{ marginBottom: 16 }}>
          <Radio size={20} className="pulse-dot" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{state.disasterAlert.title}</strong>
              <span className="cell-sub">{state.disasterAlert.source}</span>
            </div>
            <p>{state.disasterAlert.desc}</p>
          </div>
        </div>
      )}

      <div className="grid-main" style={{ gridTemplateColumns: '1fr 340px' }}>
        {/* Peta Interaktif SVG */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', position: 'relative', background: '#0b1329', minHeight: 520, borderRadius: 12 }}>
          {/* Layer Control Bar */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: '6px 12px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              color: '#fff',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <Layers size={14} /> Layer:
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showHazardLayer}
                onChange={(e) => setShowHazardLayer(e.target.checked)}
              />
              <span style={{ color: '#fca5a5' }}>Zona Bahaya</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showRoutesLayer}
                onChange={(e) => setShowRoutesLayer(e.target.checked)}
              />
              <span style={{ color: '#93c5fd' }}>Rute Armada</span>
            </label>
          </div>

          {/* Compass & Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 14,
              zIndex: 10,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#fff',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span>Posko Kritis (&gt;85%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', display: 'inline-block' }} />
                <span>Posko Waspada</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span>Posko Aman</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                <span>Gudang Induk</span>
              </div>
            </div>
          </div>

          {/* Canvas SVG Map */}
          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%', minHeight: 520, display: 'block' }}
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
              <radialGradient id="hazardGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#ef4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid latar belakang */}
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Garis-garis kontur sungai / jalur DAS */}
            <path
              d="M 10 10 Q 30 40 50 50 T 90 90"
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1.2"
              strokeDasharray="2 1"
            />
            <path
              d="M 5 60 Q 35 65 50 50 T 95 30"
              fill="none"
              stroke="rgba(56, 189, 248, 0.18)"
              strokeWidth="0.8"
            />

            {/* Zona Bahaya (Hazard Radius) */}
            {showHazardLayer && (
              <>
                <circle cx="35" cy="40" r="22" fill="url(#hazardGrad)" />
                <circle cx="35" cy="40" r="22" fill="none" stroke="rgba(239, 68, 68, 0.4)" strokeWidth="0.4" strokeDasharray="1 1" />
                <text x="35" y="24" fill="#fca5a5" fontSize="2.2" textAnchor="middle" fontWeight="bold">
                  ZONA BAHAYA LONGSOR & BANJIR DAS
                </text>
              </>
            )}

            {/* Rute Jalan dari Depot ke Posko */}
            {state.posts.map((p) => {
              const x = p.coords?.x ?? 30;
              const y = p.coords?.y ?? 30;
              return (
                <line
                  key={`route-${p.id}`}
                  x1={centralDepot.x}
                  y1={centralDepot.y}
                  x2={x}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="0.6"
                  strokeDasharray="1.5 1.5"
                />
              );
            })}

            {/* Rute aktif pengiriman yang sedang jalan */}
            {showRoutesLayer &&
              activeShipments.map((shp) => {
                const req = state.requests.find((r) => r.id === shp.requestId);
                const post = req && state.posts.find((p) => p.id === req.postId);
                if (!post) return null;
                const px = post.coords?.x ?? 50;
                const py = post.coords?.y ?? 50;
                const prog = (shp.progress ?? 50) / 100;
                const curX = centralDepot.x + (px - centralDepot.x) * prog;
                const curY = centralDepot.y + (py - centralDepot.y) * prog;
                const isSelected = selectedShipment?.id === shp.id;

                return (
                  <g
                    key={`active-ship-${shp.id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedShipment(shp);
                      setSelectedPost(null);
                    }}
                  >
                    <line
                      x1={centralDepot.x}
                      y1={centralDepot.y}
                      x2={px}
                      y2={py}
                      stroke={isSelected ? '#38bdf8' : '#60a5fa'}
                      strokeWidth={isSelected ? 1.8 : 1.2}
                      strokeDasharray="2 2"
                    />
                    {/* Truk posisi GPS berjalan */}
                    <circle cx={curX} cy={curY} r={isSelected ? 3.5 : 2.8} fill={isSelected ? '#2563eb' : '#1d4ed8'} stroke="#fff" strokeWidth={0.8} />
                    <circle cx={curX} cy={curY} r="4" fill="none" stroke="#60a5fa" strokeWidth="0.4" opacity="0.8">
                      <animate attributeName="r" values="2.8;5.5;2.8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <text x={curX} y={curY - 4} fill="#93c5fd" fontSize="2.2" textAnchor="middle" fontWeight="bold">
                      🚚 {shp.id} ({shp.progress || 50}%)
                    </text>
                  </g>
                );
              })}

            {/* Titik Gudang Induk Logistik */}
            <g
              transform={`translate(${centralDepot.x}, ${centralDepot.y})`}
              style={{ cursor: 'pointer' }}
            >
              <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#2563eb" stroke="#fff" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="5" fill="none" stroke="#3b82f6" strokeWidth="0.4">
                <animate attributeName="r" values="3;7;3" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <text x="0" y="5.5" fill="#e2e8f0" fontSize="2" textAnchor="middle" fontWeight="bold">
                PUSDALOPS LOGISTIK
              </text>
            </g>

            {/* Titik-titik Posko Pengungsian */}
            {state.posts.map((p) => {
              const x = p.coords?.x ?? 30;
              const y = p.coords?.y ?? 30;
              const ratio = p.evacuees / p.capacity;
              const color = ratio > 0.85 ? '#ef4444' : ratio > 0.65 ? '#eab308' : '#22c55e';
              const isSelected = selectedPost?.id === p.id;

              return (
                <g
                  key={p.id}
                  transform={`translate(${x}, ${y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPost(p);
                    setSelectedShipment(null);
                  }}
                >
                  <circle cx="0" cy="0" r={isSelected ? 3.5 : 2.5} fill={color} stroke="#ffffff" strokeWidth={isSelected ? 0.9 : 0.6} />
                  {ratio > 0.85 && (
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke={color} strokeWidth="0.4">
                      <animate attributeName="r" values="2.5;6;2.5" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <text
                    x="0"
                    y="4.5"
                    fill="#ffffff"
                    fontSize="1.9"
                    textAnchor="middle"
                    fontWeight="600"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    {p.name.replace('Posko ', '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Panel Informasi Sebelah Kanan Peta */}
        <div className="stack" style={{ gap: 14 }}>
          {selectedPost ? (
            <Panel
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} className="text-primary" />
                  <span>{selectedPost.name}</span>
                </div>
              }
              subtitle={`${selectedPost.address}, ${selectedPost.district}`}
              actions={
                <button className="icon-btn" onClick={() => setSelectedPost(null)}>
                  ×
                </button>
              }
            >
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>Kepadatan ({num(selectedPost.evacuees)} / {num(selectedPost.capacity)} jiwa)</span>
                  <strong>{Math.round((selectedPost.evacuees / selectedPost.capacity) * 100)}%</strong>
                </div>
                <Progress
                  value={Math.round((selectedPost.evacuees / selectedPost.capacity) * 100)}
                  tone={selectedPost.evacuees / selectedPost.capacity > 0.85 ? 'danger' : 'primary'}
                />
              </div>

              <h4 className="section-label">Kelompok Rentan</h4>
              <div className="vuln-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div className="vuln"><strong>{num(selectedPost.vulnerable.balita)}</strong><span>Balita</span></div>
                <div className="vuln"><strong>{num(selectedPost.vulnerable.lansia)}</strong><span>Lansia</span></div>
                <div className="vuln"><strong>{num(selectedPost.vulnerable.disabilitas)}</strong><span>Disabilitas</span></div>
                <div className="vuln"><strong>{num(selectedPost.vulnerable.ibuHamil)}</strong><span>Ibu Hamil</span></div>
              </div>

              {renderPostActions()}
            </Panel>
          ) : selectedShipment ? (
            <Panel
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} className="text-primary" />
                  <span>Armada {selectedShipment.id}</span>
                </div>
              }
              subtitle="Detail Pelacakan Rute Pengiriman"
              actions={
                <button className="icon-btn" onClick={() => setSelectedShipment(null)}>
                  ×
                </button>
              }
            >
              {(() => {
                const driver = state.users.find((u) => u.id === selectedShipment.driverId);
                const veh = state.vehicles.find((v) => v.id === selectedShipment.vehicleId);
                const req = state.requests.find((r) => r.id === selectedShipment.requestId);
                const post = req && state.posts.find((p) => p.id === req.postId);

                return (
                  <div className="stack" style={{ gap: 10 }}>
                    <div>
                      <div className="cell-sub">Pengemudi & Armada</div>
                      <strong>{driver?.name}</strong> • <span className="mono">{veh?.plate}</span>
                      <div className="cell-sub">{veh?.type}</div>
                    </div>
                    <div>
                      <div className="cell-sub">Tujuan Pengiriman</div>
                      <strong>{post?.name}</strong>
                      <div className="cell-sub">{post?.address}</div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                        <span>Progres Perjalanan</span>
                        <strong className="text-primary">{selectedShipment.currentEta || '10 mnt'}</strong>
                      </div>
                      <Progress value={selectedShipment.progress || 50} tone="primary" />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                        Status: <strong>{selectedShipment.status}</strong> ({selectedShipment.progress || 50}%)
                      </div>
                    </div>
                    <div style={{ paddingTop: 8, borderTop: '1px solid var(--card-border)' }}>
                      <a className="btn btn-outline btn-sm btn-block" href="#/driver/tugas">
                        <Navigation size={14} /> Lihat Tugas Armada
                      </a>
                    </div>
                  </div>
                );
              })()}
            </Panel>
          ) : (
            <Panel title="Pusat Kendali Satelit Aktif" subtitle="Pilih titik posko atau truk untuk rincian">
              <EmptyState
                icon={<Compass size={28} />}
                title="Sistem Radar Bencana"
                text="Klik salah satu posko pengungsian atau armada pengiriman di peta untuk memeriksa status operasional."
              />
            </Panel>
          )}

          {/* Daftar Armada Sedang Berjalan */}
          <Panel title="Armada Bergerak di Jalan" subtitle="Live tracking GPS & estimasi tiba">
            {activeShipments.length === 0 ? (
              <EmptyState title="Tidak ada armada di perjalanan" text="Semua pengiriman telah tiba di posko." />
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {activeShipments.map((s) => {
                  const driver = state.users.find((u) => u.id === s.driverId);
                  const veh = state.vehicles.find((v) => v.id === s.vehicleId);
                  const req = state.requests.find((r) => r.id === s.requestId);
                  const post = req && state.posts.find((p) => p.id === req.postId);
                  const isSelected = selectedShipment?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedShipment(s);
                        setSelectedPost(null);
                      }}
                      style={{
                        padding: 10,
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        borderRadius: 8,
                        border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--card-border)',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong>{veh?.plate} ({driver?.name})</strong>
                        <span className="text-primary font-bold">{s.currentEta || '15 mnt'}</span>
                      </div>
                      <div className="cell-sub" style={{ marginBottom: 6 }}>
                        Menuju: <strong>{post?.name}</strong>
                      </div>
                      <Progress value={s.progress || 50} tone="primary" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.72rem' }}>
                        <span>Progres Rute: {s.progress || 50}%</span>
                        <span className="mono">{s.id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Modal Tambah Posko Baru */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Pendaftaran Posko Bencana Baru">
        <form onSubmit={handleAddPostSubmit} className="form">
          <Field label="Nama Posko Pengungsian">
            <input
              className="input"
              value={newPostName}
              onChange={(e) => setNewPostName(e.target.value)}
              placeholder="mis. Posko Lapangan Desa Sukamulya"
              required
            />
          </Field>
          <Field label="Kecamatan">
            <input
              className="input"
              value={newPostDistrict}
              onChange={(e) => setNewPostDistrict(e.target.value)}
              placeholder="mis. Kec. Cibeber"
              required
            />
          </Field>
          <Field label="Alamat / Lokasi Lengkap">
            <input
              className="input"
              value={newPostAddress}
              onChange={(e) => setNewPostAddress(e.target.value)}
              placeholder="mis. Balai Dusun II, RT 03/RW 04"
              required
            />
          </Field>
          <div className="form-grid-2">
            <Field label="Kapasitas Maksimal (Jiwa)">
              <input
                className="input"
                type="number"
                min={50}
                value={newPostCapacity}
                onChange={(e) => setNewPostCapacity(Math.max(10, Number(e.target.value)))}
                required
              />
            </Field>
            <Field label="Jumlah Pengungsi Terdata Awal (Jiwa)">
              <input
                className="input"
                type="number"
                min={0}
                value={newPostEvacuees}
                onChange={(e) => setNewPostEvacuees(Math.max(0, Number(e.target.value)))}
                required
              />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
              Batal
            </button>
            <button className="btn btn-primary" disabled={newPostName.trim().length < 4}>
              Daftarkan Posko
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CrisisMap;
