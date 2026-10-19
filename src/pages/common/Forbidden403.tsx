import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock, AlertTriangle, BookOpen } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { ROLE_LABEL } from '../../utils/format';
import { ROLE_HOME } from '../../rules/businessRules';
import { navigate } from '../../router';
import type { Role } from '../../types';

interface Forbidden403Props {
  attemptedPath: string;
  allowedRoles?: Role[];
}

export const Forbidden403: React.FC<Forbidden403Props> = ({ attemptedPath, allowedRoles = [] }) => {
  const { user, logout } = useStore();

  if (!user) return null;

  const homePath = ROLE_HOME[user.role] || '/';

  const requiredRolesText = allowedRoles.length > 0
    ? allowedRoles.map((r) => ROLE_LABEL[r]).join(', ')
    : 'Peran Tertentu';

  return (
    <div style={{ maxWidth: 780, margin: '20px auto', padding: '0 16px' }}>
      <div
        className="panel border-danger"
        style={{
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-md)',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--radius-sm)',
              background: '#fef2f2',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #fecaca',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                STATUS: 403 FORBIDDEN
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                ATURAN SISTEM R-12
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.45rem', color: '#991b1b' }}>
              Akses Kedinasan Ditolak & Dibatasi Sistem
            </h2>
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 20 }}>
          Sistem keamanan <strong>ResQ-Gov</strong> mencegah perpindahan langsung ke modul peran lain tanpa otorisasi resmi.
          Berdasarkan <strong>Prinsip Pemisahan Tugas (Segregation of Duties / R-01)</strong> dan <strong>Akses Berbasis Peran (RBAC / R-12)</strong>,
          setiap aparatur negara hanya diperbolehkan mengakses halaman dan data yang berada dalam lingkup penugasannya.
        </p>

        {/* Kotak Rincian Keamanan */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 18px',
            marginBottom: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          <div>
            <span className="cell-sub" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Aparatur Sedang Masuk
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{user.name}</div>
            <div className="cell-sub">{user.jabatan}</div>
          </div>

          <div>
            <span className="cell-sub" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Peran Anda Saat Ini
            </span>
            <div style={{ marginTop: 2 }}>
              <span className="badge badge-primary">{ROLE_LABEL[user.role]}</span>
            </div>
          </div>

          <div>
            <span className="cell-sub" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Modul Rute Yang Dituju
            </span>
            <div className="mono" style={{ fontWeight: 700, color: 'var(--accent-red)', marginTop: 2 }}>
              {attemptedPath}
            </div>
          </div>

          <div>
            <span className="cell-sub" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Kewenangan Yang Dibutuhkan
            </span>
            <div style={{ fontWeight: 700, color: '#1e3a8a', marginTop: 2 }}>
              {requiredRolesText}
            </div>
          </div>
        </div>

        {/* Peringatan Audit */}
        <div
          className="alert alert-warning"
          style={{ marginBottom: 24, fontSize: '0.82rem', alignItems: 'center' }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Pencatatan Audit Trail Kriptografis:</strong>
            <p style={{ margin: 0 }}>
              Upaya pengalihan akses lintas peran ini telah dicatat secara otomatis ke dalam Buku Besar Audit Log
              berantai hash (SHA-256) untuk menjaga integritas dan akuntabilitas sistem (<a href="#/aturan" style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>Aturan R-09</a>).
            </p>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(homePath)}
          >
            <ArrowLeft size={16} /> Kembali ke Wilayah Kerja ({ROLE_LABEL[user.role]})
          </button>
          <button
            className="btn btn-outline"
            onClick={() => logout('Keluar untuk berganti akun resmi')}
          >
            <LogOut size={16} /> Keluar Sesi untuk Masuk dengan Akun Lain
          </button>
          <a
            className="btn btn-ghost"
            href="#/aturan"
          >
            <BookOpen size={16} /> Pelajari Aturan Bisnis (R-12)
          </a>
        </div>
      </div>
    </div>
  );
};

export default Forbidden403;
