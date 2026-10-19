import React, { useState } from 'react';
import { Truck, Navigation, KeyRound, CheckCircle2, Lock, MapPin, Phone, User } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { dateTime, num, SHIPMENT_LABEL } from '../../utils/format';
import { EmptyState, Field, PageHeader, Panel, RuleTag } from '../../components/ui';

const DriverTasks: React.FC = () => {
  const { state, user, startTrip, deliver } = useStore();
  const toast = useToast();

  const [handoverCode, setHandoverCode] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const vehicle = user?.vehicleId ? state.vehicles.find((v) => v.id === user.vehicleId) : null;
  const myShipments = state.shipments.filter((s) => s.driverId === user?.id);

  const activeShipment = myShipments.find(
    (s) => s.status === 'ditugaskan' || s.status === 'dalam_perjalanan'
  );
  const activeReq = activeShipment ? state.requests.find((r) => r.id === activeShipment.requestId) : null;
  const activePost = activeReq ? state.posts.find((p) => p.id === activeReq.postId) : null;
  const postOfficers = activePost
    ? state.users.filter((u) => u.role === 'posko' && u.postId === activePost.id && u.active)
    : [];

  const handleStartTrip = (id: string) => {
    toast(startTrip(id));
  };

  const handleDeliver = (e: React.FormEvent, shipmentId: string) => {
    e.preventDefault();
    if (toast(deliver(shipmentId, handoverCode, recipientName))) {
      setHandoverCode('');
      setRecipientName('');
    }
  };

  return (
    <>
      <PageHeader
        title="Tugas Pengiriman & Penyerahan Lapangan"
        subtitle={`Armada: ${vehicle?.plate ?? '-'} • ${vehicle?.type ?? '-'} (Kapasitas: ${num(vehicle?.capacityKg ?? 0)} kg)`}
      />

      {activeShipment ? (
        <div className="stack" style={{ marginBottom: 24 }}>
          <Panel
            className="border-primary"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={20} className="text-primary" />
                <span>Tugas Pengiriman Aktif: {activeShipment.id}</span>
              </div>
            }
            subtitle={`Permintaan: ${activeReq?.id} • Posko Tujuan: ${activePost?.name}`}
          >
            <div className="grid-main" style={{ marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 8 }}>Lokasi Tujuan Penyerahan</h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                  <MapPin size={18} className="text-danger" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <strong>{activePost?.name}</strong>
                    <div className="cell-sub">{activePost?.address}, {activePost?.district}</div>
                    <div className="cell-sub">{num(activePost?.evacuees ?? 0)} jiwa pengungsi</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', marginBottom: 8 }}>Kontak Petugas Posko</h4>
                {postOfficers.map((o) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 4 }}>
                    <User size={14} /> <span>{o.name}</span> • <Phone size={14} /> <span className="mono">{o.phone}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 8 }}>Daftar Muatan Logistik</h4>
                <div className="table-wrap">
                  <table className="data-table compact">
                    <thead>
                      <tr><th>Barang</th><th className="num">Muatan Fisik</th></tr>
                    </thead>
                    <tbody>
                      {activeReq?.lines.map((l) => {
                        const it = state.items.find((i) => i.id === l.itemId);
                        return (
                          <tr key={l.itemId}>
                            <td><strong>{it?.name}</strong></td>
                            <td className="num">{num(l.qty)} {it?.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tombol Perjalanan / Penyerahan */}
            {activeShipment.status === 'ditugaskan' && (
              <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #0f2744', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Muatan telah dimuat di gudang logistik.</strong>
                  <div className="cell-sub">Klik tombol untuk mulai perjalanan dan memberitahu petugas posko.</div>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleStartTrip(activeShipment.id)}
                >
                  <Navigation size={18} /> Berangkat Menuju Posko
                </button>
              </div>
            )}

            {activeShipment.status === 'dalam_perjalanan' && (
              <div style={{ marginTop: 16 }}>
                {activeShipment.locked ? (
                  <div className="alert alert-danger">
                    <Lock size={20} />
                    <div>
                      <strong>PENGIRIMAN DIKUNCI KARENA 3X KESALAHAN KODE!</strong>
                      <p>
                        Hubungi Koordinator Logistik di Pusdalops untuk memverifikasi dan membuka kunci sistem (R-05).
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleDeliver(e, activeShipment.id)} className="panel" style={{ background: '#f8fafc' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <KeyRound size={18} /> Konfirmasi Serah Terima di Posko <RuleTag code="R-05" />
                    </h4>
                    <p className="cell-sub" style={{ marginBottom: 16 }}>
                      Minta <strong>6 digit Kode Serah Terima</strong> dari Petugas Posko setelah barang diturunkan dan diperiksa.
                      Maksimal 3 kali percobaan sebelum terkunci.
                    </p>

                    <div className="form-grid-2">
                      <Field label="Kode Serah Terima (6 Digit)" hint={activeShipment.failedAttempts > 0 ? `Salah ${activeShipment.failedAttempts}/3 kali!` : undefined}>
                        <input
                          className={`input mono ${activeShipment.failedAttempts > 0 ? 'invalid' : ''}`}
                          style={{ fontSize: '1.2rem', letterSpacing: 4, fontWeight: 700 }}
                          maxLength={6}
                          value={handoverCode}
                          onChange={(e) => setHandoverCode(e.target.value.trim())}
                          placeholder="••••••"
                        />
                      </Field>

                      <Field label="Nama Lengkap Petugas Penerima Posko">
                        <input
                          className="input"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="mis. Siti Aminah"
                        />
                      </Field>
                    </div>

                    <button
                      className="btn btn-success btn-lg"
                      style={{ marginTop: 12 }}
                      disabled={handoverCode.length !== 6 || recipientName.trim().length < 3}
                    >
                      <CheckCircle2 size={18} /> Verifikasi & Selesaikan Serah Terima
                    </button>
                  </form>
                )}
              </div>
            )}
          </Panel>
        </div>
      ) : (
        <Panel style={{ marginBottom: 24 }}>
          <EmptyState
            title="Tidak ada tugas pengiriman aktif saat ini"
            text="Armada Anda dalam status siaga di pangkalan / gudang logistik."
            icon={<Truck size={32} />}
          />
        </Panel>
      )}

      <Panel title="Riwayat Tugas Pengiriman Anda" subtitle="Semua pengiriman yang telah Anda selesaikan">
        {myShipments.length === 0 ? (
          <EmptyState title="Belum ada riwayat pengiriman" />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Tugas</th>
                  <th>Permintaan</th>
                  <th>Posko Tujuan</th>
                  <th>Status</th>
                  <th>Nama Penerima</th>
                  <th>Waktu Tiba</th>
                </tr>
              </thead>
              <tbody>
                {myShipments.map((s) => {
                  const req = state.requests.find((r) => r.id === s.requestId);
                  const post = req && state.posts.find((p) => p.id === req.postId);

                  return (
                    <tr key={s.id}>
                      <td className="cell-strong mono">{s.id}</td>
                      <td className="mono">{req?.id}</td>
                      <td>{post?.name}</td>
                      <td>
                        <span className={`badge badge-${s.status === 'diterima' ? 'success' : s.status === 'terkirim' ? 'teal' : 'primary'}`}>
                          {SHIPMENT_LABEL[s.status]}
                        </span>
                      </td>
                      <td>{s.recipientName ?? '—'}</td>
                      <td className="cell-sub">{s.deliveredAt ? dateTime(s.deliveredAt) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
};

export default DriverTasks;
