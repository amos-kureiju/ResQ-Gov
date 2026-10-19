import React, { useState } from 'react';
import { Truck, Send, Lock, Unlock, CheckCircle2, PlusCircle, Wrench } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { dateTime, num, SHIPMENT_LABEL, VEHICLE_LABEL } from '../../utils/format';
import { EmptyState, Field, Modal, PageHeader, Panel, PriorityBadge, RuleTag } from '../../components/ui';
import { RequestDetail } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const Dispatch: React.FC = () => {
  const { state, dispatch, unlockShipment, setVehicleStatus, addVehicle } = useStore();
  const toast = useToast();
  const [selectedReq, setSelectedReq] = useState<AidRequest | null>(null);
  const [chosenDrivers, setChosenDrivers] = useState<Record<string, string>>({});
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newType, setNewType] = useState('Truk Logistik Engkel');
  const [newCapacity, setNewCapacity] = useState(3000);

  const readyRequests = state.requests.filter((r) => r.status === 'disetujui');
  const availableDrivers = state.users.filter(
    (u) =>
      u.role === 'driver' &&
      u.active &&
      !state.shipments.some(
        (s) => s.driverId === u.id && (s.status === 'ditugaskan' || s.status === 'dalam_perjalanan')
      )
  );

  const handleDispatch = (reqId: string) => {
    const driverId = chosenDrivers[reqId];
    if (!driverId) {
      toast({ ok: false, error: 'Pilih pengemudi armada terlebih dahulu.' });
      return;
    }
    if (toast(dispatch(reqId, driverId))) {
      setChosenDrivers((prev) => {
        const next = { ...prev };
        delete next[reqId];
        return next;
      });
      setSelectedReq(null);
    }
  };

  const handleUnlock = (shipmentId: string) => {
    toast(unlockShipment(shipmentId));
  };

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addVehicle({
      plate: newPlate,
      type: newType,
      capacityKg: newCapacity,
    });
    if (toast(res)) {
      setShowAddVehicle(false);
      setNewPlate('');
    }
  };

  const handleToggleVehicleStatus = (vehicleId: string, currentStatus: string) => {
    if (currentStatus === 'bertugas') {
      toast({ ok: false, error: 'Kendaraan sedang dalam penugasan pengiriman aktif.' });
      return;
    }
    const targetStatus = currentStatus === 'tersedia' ? 'perawatan' : 'tersedia';
    toast(setVehicleStatus(vehicleId, targetStatus));
  };

  return (
    <>
      <PageHeader
        title="Penugasan & Pengiriman Armada (Fleet Dispatch)"
        subtitle="Alokasi kendaraan operasional, pemantauan pengiriman langsung, dan pembukaan kunci verifikasi (R-04, R-05)"
        actions={
          <button className="btn btn-outline" onClick={() => setShowAddVehicle(true)}>
            <PlusCircle size={16} /> Tambah Armada Kendaraan
          </button>
        }
      />

      <div className="grid-main">
        <Panel
          title="Permintaan Siap Dikirim"
          subtitle="Telah disetujui dan stok gudang sudah dialokasikan"
        >
          {readyRequests.length === 0 ? (
            <EmptyState
              title="Tidak ada permintaan siap kirim"
              text="Semua permintaan yang disetujui sudah ditugaskan armadanya."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Permintaan</th>
                    <th>Posko Tujuan</th>
                    <th>Prioritas</th>
                    <th>Pilih Pengemudi & Armada</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {readyRequests.map((r) => {
                    const post = state.posts.find((p) => p.id === r.postId);
                    const selectedDriver = chosenDrivers[r.id] || '';
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="cell-strong mono">{r.id}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedReq(r)}
                          >
                            Lihat Muatan
                          </button>
                        </td>
                        <td>
                          <div className="cell-strong">{post?.name}</div>
                          <div className="cell-sub">{post?.district}</div>
                        </td>
                        <td>
                          <PriorityBadge priority={r.priority} />
                        </td>
                        <td>
                          <select
                            className="input"
                            value={selectedDriver}
                            onChange={(e) =>
                              setChosenDrivers((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                          >
                            <option value="">-- Pilih Pengemudi Tersedia --</option>
                            {availableDrivers.map((d) => {
                              const v = state.vehicles.find((veh) => veh.id === d.vehicleId);
                              return (
                                <option key={d.id} value={d.id}>
                                  {d.name} ({v?.plate} • {v?.type})
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!selectedDriver}
                            onClick={() => handleDispatch(r.id)}
                          >
                            <Send size={14} /> Dispatch Armada
                          </button>
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
          title="Ketersediaan Pengemudi & Armada"
          subtitle="Status armada darat operasional"
          actions={
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddVehicle(true)}>
              <PlusCircle size={14} /> Tambah
            </button>
          }
        >
          <ul className="fleet-list">
            {state.users
              .filter((u) => u.role === 'driver')
              .map((d) => {
                const v = state.vehicles.find((veh) => veh.id === d.vehicleId);
                const activeShipment = state.shipments.find(
                  (s) =>
                    s.driverId === d.id &&
                    (s.status === 'ditugaskan' || s.status === 'dalam_perjalanan')
                );
                const isBusy = !!activeShipment;

                return (
                  <li key={d.id}>
                    <div className={`fleet-icon ${isBusy ? 'st-bertugas' : 'st-tersedia'}`}>
                      <Truck size={16} />
                    </div>
                    <div className="fleet-body">
                      <strong>{d.name}</strong>
                      <div className="cell-sub">
                        {v ? `${v.plate} • ${v.type} (${num(v.capacityKg)} kg)` : 'Belum ada kendaraan'}
                      </div>
                      {activeShipment && (
                        <span className="badge badge-warning" style={{ marginTop: 4 }}>
                          Sedang Mengirim {activeShipment.id}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className={`badge badge-${isBusy ? 'warning' : 'success'}`}>
                        {isBusy ? 'Bertugas' : 'Siap Jalan'}
                      </span>
                      {v && !isBusy && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                          onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                          title={`Ubah status kendaraan (${VEHICLE_LABEL[v.status]})`}
                        >
                          <Wrench size={11} /> {v.status === 'tersedia' ? 'Servis' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Daftar Pengiriman Aktif & Status Gembok (Anti-Fraud)"
        subtitle="Pengiriman yang salah kode 3x dikunci otomatis (R-05)"
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Pengiriman</th>
                <th>Permintaan</th>
                <th>Pengemudi & Armada</th>
                <th>Status Perjalanan</th>
                <th>Status Keamanan</th>
                <th>Waktu Berangkat</th>
                <th>Aksi Khusus</th>
              </tr>
            </thead>
            <tbody>
              {state.shipments.map((s) => {
                const driver = state.users.find((u) => u.id === s.driverId);
                const veh = state.vehicles.find((v) => v.id === s.vehicleId);
                const req = state.requests.find((r) => r.id === s.requestId);
                const post = req && state.posts.find((p) => p.id === req.postId);

                return (
                  <tr key={s.id} className={s.locked ? 'row-error' : ''}>
                    <td className="cell-strong mono">{s.id}</td>
                    <td>
                      <div className="cell-strong mono">{req?.id}</div>
                      <div className="cell-sub">{post?.name}</div>
                    </td>
                    <td>
                      <div>
                        <strong>{driver?.name}</strong>
                      </div>
                      <div className="cell-sub">
                        {veh?.plate} ({veh?.type})
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          s.status === 'diterima'
                            ? 'success'
                            : s.status === 'terkirim'
                            ? 'teal'
                            : 'primary'
                        }`}
                      >
                        {SHIPMENT_LABEL[s.status]}
                      </span>
                    </td>
                    <td>
                      {s.locked ? (
                        <span
                          className="text-danger"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontWeight: 700,
                          }}
                        >
                          <Lock size={14} /> TERKUNCI (3x Gagal) <RuleTag code="R-05" />
                        </span>
                      ) : s.failedAttempts > 0 ? (
                        <span className="text-warning" style={{ fontSize: '0.8rem' }}>
                          Percobaan gagal: {s.failedAttempts}/3
                        </span>
                      ) : (
                        <span
                          className="text-success"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.8rem',
                          }}
                        >
                          <CheckCircle2 size={14} /> Normal
                        </span>
                      )}
                    </td>
                    <td className="cell-sub">
                      {s.departedAt ? dateTime(s.departedAt) : 'Belum jalan'}
                    </td>
                    <td>
                      {s.locked && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleUnlock(s.id)}
                          title="Buka kunci dan buat kode serah terima baru"
                        >
                          <Unlock size={14} /> Buka Kunci
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal Tambah Kendaraan Baru */}
      <Modal open={showAddVehicle} onClose={() => setShowAddVehicle(false)} title="Tambah Armada Kendaraan Baru">
        <form onSubmit={handleAddVehicleSubmit} className="form">
          <Field label="Nomor Polisi / Plat Kendaraan">
            <input
              className="input mono"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="mis. B 9999 KZ"
              required
            />
          </Field>
          <Field label="Tipe Kendaraan">
            <input
              className="input"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="mis. Truk Box Pendingin"
              required
            />
          </Field>
          <Field label="Kapasitas Muatan (kg)">
            <input
              className="input"
              type="number"
              min={200}
              step={100}
              value={newCapacity}
              onChange={(e) => setNewCapacity(Math.max(100, Number(e.target.value)))}
              required
            />
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddVehicle(false)}>
              Batal
            </button>
            <button className="btn btn-primary" disabled={!newPlate.trim()}>
              Daftarkan Kendaraan
            </button>
          </div>
        </form>
      </Modal>

      <RequestDetail request={selectedReq} onClose={() => setSelectedReq(null)} />
    </>
  );
};

export default Dispatch;
