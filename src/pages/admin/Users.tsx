import React, { useState } from 'react';
import { UserPlus, CheckCircle2, XCircle } from 'lucide-react';
import { useStore, NewUserInput } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { ROLE_LABEL } from '../../utils/format';
import { Field, PageHeader, Panel } from '../../components/ui';
import type { Role } from '../../types';

const UsersPage: React.FC = () => {
  const { state, user, addUser, toggleUser } = useStore();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<NewUserInput>({
    username: '',
    password: '',
    name: '',
    role: 'posko',
    nip: '',
    jabatan: '',
    phone: '',
    postId: state.posts[0]?.id || '',
    vehicleId: state.vehicles[0]?.id || '',
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (toast(addUser(formData))) {
      setFormOpen(false);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'posko',
        nip: '',
        jabatan: '',
        phone: '',
        postId: state.posts[0]?.id || '',
        vehicleId: state.vehicles[0]?.id || '',
      });
    }
  };

  const handleToggle = (id: string) => {
    if (id === user?.id) {
      toast({ ok: false, error: 'Anda tidak dapat menonaktifkan akun Anda sendiri (Super Admin aktif).' });
      return;
    }
    toast(toggleUser(id));
  };

  return (
    <>
      <PageHeader
        title="Manajemen Pengguna & Otoritas Akses (RBAC)"
        subtitle="Pengelolaan akun aparatur sipil negara dan petugas lapangan sesuai prinsip pemisahan wewenang (R-01, R-12)"
        actions={
          <button className="btn btn-primary" onClick={() => setFormOpen((v) => !v)}>
            <UserPlus size={16} /> Tambah Aparatur Baru
          </button>
        }
      />

      {formOpen && (
        <Panel title="Formulir Pendaftaran Akun Aparatur" subtitle="Kata sandi minimal 8 karakter dengan kombinasi angka">
          <form onSubmit={handleAddUser} className="form">
            <div className="form-grid-3">
              <Field label="Peran Wewenang (Role)">
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  <option value="admin">Kepala Dinas (Super Admin)</option>
                  <option value="koordinator">Koordinator Logistik (Pusdalops)</option>
                  <option value="posko">Petugas Posko Pengungsian</option>
                  <option value="driver">Pengemudi Armada Distribusi</option>
                </select>
              </Field>

              <Field label="Username (Login)">
                <input
                  className="input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="mis. petugas_cibeber"
                  required
                />
              </Field>

              <Field label="Kata Sandi Awal">
                <input
                  className="input"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter huruf & angka"
                  required
                />
              </Field>
            </div>

            <div className="form-grid-3">
              <Field label="Nama Lengkap & Gelar">
                <input
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="mis. Siti Aminah, S.Sos"
                  required
                />
              </Field>

              <Field label="NIP / Identitas Pegawai">
                <input
                  className="input"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="mis. 199003152015032001"
                />
              </Field>

              <Field label="Jabatan Resmi">
                <input
                  className="input"
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="mis. Petugas Posko Bencana"
                />
              </Field>
            </div>

            <div className="form-grid-3">
              <Field label="Nomor Telepon / WhatsApp">
                <input
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="mis. 0812-3456-7890"
                />
              </Field>

              {formData.role === 'posko' && (
                <Field label="Penugasan Posko Pengungsian">
                  <select
                    className="input"
                    value={formData.postId}
                    onChange={(e) => setFormData({ ...formData, postId: e.target.value })}
                  >
                    {state.posts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.district})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {formData.role === 'driver' && (
                <Field label="Penugasan Kendaraan Armada">
                  <select
                    className="input"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  >
                    {state.vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} — {v.type}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="btn btn-primary">Simpan Akun Aparatur</button>
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Batal</button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Daftar Aparatur & Hak Akses Terdaftar" subtitle="Setiap peran dibatasi menu dan fungsi sesuai tugas pokoknya">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Pegawai / Aparatur</th>
                <th>Peran Sistem</th>
                <th>NIP / Identitas</th>
                <th>Jabatan / Unit Kerja</th>
                <th>Penugasan Khusus</th>
                <th>Kontak</th>
                <th>Status Akun</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {state.users.map((u) => {
                const assignedPost = u.postId ? state.posts.find((p) => p.id === u.postId) : null;
                const assignedVeh = u.vehicleId ? state.vehicles.find((v) => v.id === u.vehicleId) : null;
                const isSelf = u.id === user?.id;

                return (
                  <tr key={u.id} className={!u.active ? 'row-inactive' : ''}>
                    <td>
                      <div className="cell-strong">{u.name}</div>
                      <div className="cell-sub mono">@{u.username}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'warning' : u.role === 'koordinator' ? 'primary' : u.role === 'posko' ? 'info' : 'neutral'}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="cell-sub mono">{u.nip}</td>
                    <td>{u.jabatan}</td>
                    <td>
                      {assignedPost && (
                        <div className="cell-sub">
                          Posko: <strong>{assignedPost.name}</strong>
                        </div>
                      )}
                      {assignedVeh && (
                        <div className="cell-sub">
                          Armada: <strong>{assignedVeh.plate}</strong>
                        </div>
                      )}
                      {!assignedPost && !assignedVeh && <span className="cell-sub">Kantor Induk Dinas</span>}
                    </td>
                    <td className="cell-sub">{u.phone}</td>
                    <td>
                      {u.active ? (
                        <span className="text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                          <CheckCircle2 size={14} /> Aktif
                        </span>
                      ) : (
                        <span className="text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                          <XCircle size={14} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td>
                      {isSelf ? (
                        <span className="badge badge-neutral" title="Akun Anda yang sedang aktif">
                          Akun Anda
                        </span>
                      ) : (
                        <button
                          className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline'}`}
                          onClick={() => handleToggle(u.id)}
                        >
                          {u.active ? 'Nonaktifkan' : 'Aktifkan'}
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
    </>
  );
};

export default UsersPage;
