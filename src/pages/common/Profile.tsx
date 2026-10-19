import React, { useState } from 'react';
import { Shield, Phone, Briefcase, FileBadge, LogOut, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { ROLE_LABEL } from '../../utils/format';
import { Modal, PageHeader, Panel } from '../../components/ui';

const Profile: React.FC = () => {
  const { user, state, logout, resetDemo } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!user) return null;

  const assignedPost = user.postId ? state.posts.find((p) => p.id === user.postId) : null;
  const assignedVeh = user.vehicleId ? state.vehicles.find((v) => v.id === user.vehicleId) : null;

  const handleExecuteReset = () => {
    resetDemo();
    setConfirmReset(false);
  };

  return (
    <>
      <PageHeader
        title="Profil Pengguna & Penugasan Resmi"
        subtitle="Informasi aparatur sipil negara dan tugas pokok fungsi dalam operasi tanggap darurat"
      />

      <div className="grid-main">
        <Panel title="Identitas Pegawai" subtitle="Terdaftar di pangkalan data kepegawaian dinas">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--accent-blue)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
              }}
            >
              {user.name[0]}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{user.name}</h2>
              <div className="cell-sub" style={{ fontSize: '0.9rem' }}>@{user.username}</div>
              <span className="badge badge-primary" style={{ marginTop: 6 }}>
                {ROLE_LABEL[user.role]}
              </span>
            </div>
          </div>

          <div className="stack" style={{ gap: 12 }}>
            <div className="detail-item">
              <FileBadge size={16} />
              <div>
                <span>Nomor Induk Pegawai (NIP)</span>
                <strong>{user.nip}</strong>
              </div>
            </div>

            <div className="detail-item">
              <Briefcase size={16} />
              <div>
                <span>Jabatan Kedinasan</span>
                <strong>{user.jabatan}</strong>
              </div>
            </div>

            <div className="detail-item">
              <Phone size={16} />
              <div>
                <span>Nomor Telepon / Hotline</span>
                <strong>{user.phone}</strong>
              </div>
            </div>

            {assignedPost && (
              <div className="detail-item">
                <Shield size={16} />
                <div>
                  <span>Posko Penugasan</span>
                  <strong>{assignedPost.name}</strong>
                  <div className="cell-sub">{assignedPost.address}, {assignedPost.district}</div>
                </div>
              </div>
            )}

            {assignedVeh && (
              <div className="detail-item">
                <Shield size={16} />
                <div>
                  <span>Armada Kendaraan Penugasan</span>
                  <strong>{assignedVeh.plate} — {assignedVeh.type}</strong>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Tindakan Akun & Pengaturan Sesi" subtitle="Opsi keamanan dan demonstrasi">
          <div className="stack">
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
              <h4>Keluar Sesi (Logout)</h4>
              <p className="cell-sub" style={{ margin: '4px 0 12px 0' }}>
                Mengakhiri sesi aktif Anda pada peramban ini dan mencatat riwayat keluar di audit log.
              </p>
              <button className="btn btn-outline" onClick={() => logout()}>
                <LogOut size={16} /> Keluar dari Sistem
              </button>
            </div>

            {user.role === 'admin' && (
              <div style={{ padding: 16, background: '#fff1f2', borderRadius: 8, border: '1px solid #fecdd3' }}>
                <h4 className="text-danger">Reset Data Simulasi (Kepala Dinas)</h4>
                <p className="cell-sub text-danger" style={{ margin: '4px 0 12px 0' }}>
                  Mengembalikan seluruh database lokal (localStorage) ke kondisi awal simulasi demo.
                </p>
                <button className="btn btn-outline-danger" onClick={() => setConfirmReset(true)}>
                  <RotateCcw size={16} /> Kembalikan Data Demo Awal
                </button>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Modal Konfirmasi Reset Demo */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Konfirmasi Pengaturan Ulang Data">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', marginBottom: 12 }}>
            <AlertTriangle size={32} />
          </div>
          <h4>Kembalikan Seluruh Data ke Kondisi Awal?</h4>
          <p className="cell-sub" style={{ margin: '8px 0 20px 0', lineHeight: 1.5 }}>
            Tindakan ini akan menghapus seluruh permohonan baru, mutasi gudang, dan riwayat yang Anda buat selama simulasi ini, serta mengembalikannya ke data benih (seed) standar. Tindakan ini tidak dapat dibatalkan.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Batal
            </button>
            <button className="btn btn-danger" onClick={handleExecuteReset}>
              Ya, Reset Data Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Profile;
