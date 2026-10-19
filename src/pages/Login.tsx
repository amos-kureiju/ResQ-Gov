import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Crown,
  Warehouse,
  Tent,
  Truck,
  ArrowRight,
  ScrollText,
  Clock,
  Fingerprint,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { RULES } from '../rules/businessRules';
import { GovEmblem } from '../components/GovEmblem';

const DEMO = [
  {
    u: 'kadis',
    p: 'kadis123',
    role: 'Kepala Dinas Sosial',
    name: 'Dr. Hj. Ratna Wulandari, M.Si',
    nip: 'NIP. 19740512 199903 2 001',
    desc: 'Otorisasi anggaran > Rp 25 Jt & penanganan selisih',
    icon: <Crown size={18} />,
  },
  {
    u: 'koordinator',
    p: 'koor123',
    role: 'Koordinator Logistik',
    name: 'Ir. Bambang Sudarsono',
    nip: 'NIP. 19800815 200501 1 004',
    desc: 'Verifikasi kelayakan stok & penugasan armada',
    icon: <Warehouse size={18} />,
  },
  {
    u: 'posko1',
    p: 'posko123',
    role: 'Petugas Posko Lapangan',
    name: 'Siti Aminah, S.Sos',
    nip: 'NIP. 19880403 201101 2 003',
    desc: 'Pencatatan pengungsi & pengajuan bantuan darurat',
    icon: <Tent size={18} />,
  },
  {
    u: 'driver1',
    p: 'driver123',
    role: 'Pengemudi Armada Logistik',
    name: 'Budi Santoso',
    nip: 'NIP. 19920110 201703 1 002',
    desc: 'Pengiriman armada & serah terima kode fisik BAST',
    icon: <Truck size={18} />,
  },
];

const Login: React.FC = () => {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) return setError('Nama pengguna dan kata sandi kedinasan wajib diisi.');
    setLoading(true);
    window.setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (!res.ok) setError(res.error);
    }, 350);
  };

  return (
    <div className="login-page">
      {/* Panel Kiri: Identitas Negara & Good Governance */}
      <section className="login-hero">
        <div className="hero-glow" />

        <div className="login-brand">
          <GovEmblem size={52} />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Pemerintah Republik Indonesia
            </div>
            <div className="brand-name" style={{ fontSize: '1.45rem', marginTop: 2 }}>
              ResQ-Gov
            </div>
            <div className="brand-sub" style={{ fontSize: '0.78rem' }}>
              Sistem Komando Logistik Darurat Bencana Terpadu
            </div>
          </div>
        </div>

        <h1 className="hero-title">
          Penyaluran Bantuan Akuntabel, <span>Bebas Manipulasi & Tepat Sasaran.</span>
        </h1>

        <p className="hero-text">
          Portal satu pintu manajemen logistik kebencanaan Dinas Sosial & BPBD. Mengintegrasikan pencatatan
          pengungsi berbasis NIK, verifikasi kebutuhan berstandar gizi, otorisasi pimpinan bertingkat, serta
          serah terima lapangan yang diawasi buku besar kriptografis.
        </p>

        <ul className="hero-points">
          <li>
            <Fingerprint size={20} />
            <div>
              <strong>Pemisahan Tugas (Segregation of Duties)</strong>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Pengaju posko, verifikator gudang, dan penyetuju anggaran tidak boleh berada pada satu aparatur yang sama.
              </div>
            </div>
          </li>
          <li>
            <Clock size={20} />
            <div>
              <strong>Kepastian SLA Respon Darurat (≤ {RULES.SLA_HOURS.darurat.verify} Jam)</strong>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Permintaan kategori darurat langsung dieskalasi dan wajib diproses dalam batas waktu ketat.
              </div>
            </div>
          </li>
          <li>
            <ScrollText size={20} />
            <div>
              <strong>Audit Trail Kriptografis Anti-Manipulasi (SHA-256)</strong>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Setiap aksi aparatur dirantai dalam buku besar digital yang tidak dapat diedit atau dihapus.
              </div>
            </div>
          </li>
        </ul>

        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 480 }}>
          <Shield size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <div style={{ fontSize: '0.73rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#ffffff' }}>Standar SPBE & Keterbukaan Publik:</strong> Seluruh penyaluran bantuan diaudit berkala sesuai regulasi tata kelola kedinasan.
          </div>
        </div>
      </section>

      {/* Panel Kanan: Form Masuk & Kartu Identitas Aparatur */}
      <section className="login-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Portal Autentikasi Aparatur (SSO)
            </span>
          </div>

          <h2>Masuk ke Sistem</h2>
          <p className="muted">Gunakan kredensial resmi kedinasan yang terdaftar pada sistem kepegawaian.</p>

          <label className="field">
            <span className="field-label">Nama Pengguna (NIP / Akun Resmi)</span>
            <div className="input-icon">
              <UserIcon size={16} />
              <input
                id="login-username"
                className="input"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mis. kadis atau koordinator"
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Kata Sandi Kedinasan</span>
            <div className="input-icon">
              <Lock size={16} />
              <input
                id="login-password"
                className="input"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="icon-btn input-suffix"
                onClick={() => setShow((v) => !v)}
                aria-label="Tampilkan kata sandi"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && <div className="alert alert-danger compact">{error}</div>}

          <button id="login-submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Memverifikasi Kredensial…' : <>Masuk Portal Resmi <ArrowRight size={16} /></>}
          </button>

          <div className="demo-head">
            <span>Simulasi Akses Cepat Aparatur</span>
          </div>

          <div className="demo-grid">
            {DEMO.map((d) => (
              <button
                type="button"
                key={d.u}
                className="demo-card"
                onClick={() => {
                  setUsername(d.u);
                  setPassword(d.p);
                  setError('');
                }}
                title={`Pilih peran ${d.role}`}
              >
                <span className="demo-icon">{d.icon}</span>
                <span className="demo-text">
                  <strong>{d.role}</strong>
                  <span style={{ fontSize: '0.67rem', color: '#1e3a8a', fontWeight: 600, display: 'block' }}>
                    {d.name.split(',')[0]}
                  </span>
                  <em>{d.desc}</em>
                  <code>{d.u}</code>
                </span>
              </button>
            ))}
          </div>

          <p className="login-note">
            Sesi aktif berakhir otomatis setelah {RULES.SESSION_TIMEOUT_MIN} menit tanpa aktivitas. Sistem mengunci akses setelah {RULES.MAX_LOGIN_ATTEMPTS}x kegagalan autentikasi.
          </p>
        </form>
      </section>
    </div>
  );
};

export default Login;
