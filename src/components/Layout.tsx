import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  BookOpen,
  UserCircle2,
  X,
  CheckCheck,
  Search,
  Zap,
  Map as MapIcon,
  Shield,
  Clock,
  Radio,
  FileCheck,
  CheckCircle,
  Pause,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { navigate, usePath } from '../router';
import { ROLE_LABEL, timeAgo, num, rupiah } from '../utils/format';
import type { AppState, User } from '../types';
import { GovEmblem } from './GovEmblem';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: (s: AppState, u: User) => number;
}

export function visibleNotifications(s: AppState, u: User) {
  return s.notifications.filter((n) => n.toUserId === u.id || n.toRole === u.role);
}

export const Layout: React.FC<{ nav: NavItem[]; title: string; children: React.ReactNode }> = ({ nav, title, children }) => {
  const { state, user, logout, markRead, switchUser, triggerRandomEvent, toggleSimulation } = useStore();
  const path = usePath();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveClock, setLiveClock] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  // Jam operasional resmi (WIB)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta',
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => setMobileOpen(false), [path]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Shortcut keyboard Ctrl+K / Cmd+K untuk pencarian global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) return null;
  const notifs = visibleNotifications(state, user);
  const unread = notifs.filter((n) => !n.readBy.includes(user.id));
  const post = user.postId ? state.posts.find((p) => p.id === user.postId) : null;
  const vehicle = user.vehicleId ? state.vehicles.find((v) => v.id === user.vehicleId) : null;
  const initials = user.name.replace(/^(Dr\.|Ir\.|Hj\.)\s*/g, '').split(' ').map((w) => w[0]).slice(0, 2).join('');

  const extra: NavItem[] = [
    { path: '/peta', label: 'Peta Krisis GIS', icon: <MapIcon size={18} /> },
    { path: '/notifikasi', label: 'Notifikasi', icon: <Bell size={18} />, badge: () => unread.length },
    { path: '/aturan', label: 'Aturan Bisnis (SLA)', icon: <BookOpen size={18} /> },
    { path: '/profil', label: 'Profil Aparatur', icon: <UserCircle2 size={18} /> },
  ];

  const handleSimulate = () => {
    triggerRandomEvent();
  };

  // Hasil Pencarian Global
  const q = searchQuery.toLowerCase().trim();
  const searchResults = {
    requests: q ? state.requests.filter((r) => r.id.toLowerCase().includes(q) || r.justification.toLowerCase().includes(q)) : [],
    posts: q ? state.posts.filter((p) => p.name.toLowerCase().includes(q) || p.district.toLowerCase().includes(q)) : [],
    items: q ? state.items.filter((i) => i.name.toLowerCase().includes(q)) : [],
    vehicles: q ? state.vehicles.filter((v) => v.plate.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)) : [],
  };
  const totalResults = searchResults.requests.length + searchResults.posts.length + searchResults.items.length + searchResults.vehicles.length;

  const renderNav = (items: NavItem[]) =>
    items.map((n) => {
      const count = n.badge ? n.badge(state, user) : 0;
      const active = path === n.path;
      return (
        <a key={n.path} href={`#${n.path}`} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
          {n.icon}
          <span>{n.label}</span>
          {count > 0 && <span className="nav-badge">{count}</span>}
        </a>
      );
    });

  return (
    <div className={`app-shell role-${user.role}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-emblem-wrap">
            <GovEmblem size={38} />
          </div>
          <div>
            <div className="brand-name">ResQ-Gov</div>
            <div className="brand-sub">Sistem Logistik Bencana</div>
            <span className="brand-tag-gov">DINAS SOSIAL & BPBD</span>
          </div>
          <button className="icon-btn sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>

        <div className="role-card">
          <span className="role-chip">{ROLE_LABEL[user.role]}</span>
          <div className="role-scope" title={post ? post.name : vehicle ? `${vehicle.plate} • ${vehicle.type}` : user.jabatan}>
            {post ? post.name : vehicle ? `${vehicle.plate} • ${vehicle.type}` : user.jabatan}
          </div>
        </div>

        <nav className="nav">
          <div className="nav-section">Menu Operasional</div>
          {renderNav(nav)}
          <div className="nav-section">Sistem & Rujukan</div>
          {renderNav(extra)}
        </nav>

        <button className="nav-item logout" onClick={() => logout()}>
          <LogOut size={18} /><span>Keluar Sesi</span>
        </button>
      </aside>
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}

      <main className="main">
        {/* Official SPBE Government Top Banner */}
        <div className="gov-top-banner">
          <div className="gov-flag-stripe" />
          <div className="gov-banner-content">
            <div className="gov-banner-left">
              <div className="gov-micro-flag" aria-hidden="true">
                <span />
                <span />
              </div>
              <span className="gov-banner-title">
                Situs Resmi Komando Bencana • Republik Indonesia
              </span>
            </div>
            <div className="gov-banner-right">
              <span className="gov-badge-spbe">
                <Shield size={11} /> SPBE Terakreditasi SHA-256
              </span>
              <span>Pusdalops 24 Jam</span>
              <span className="mono" style={{ color: '#f8fafc', fontWeight: 600 }}>
                {liveClock || 'WIB'}
              </span>
            </div>
          </div>
        </div>

        {/* Ticker Live Alert Bencana & Simulasi */}
        {state.disasterAlert && (
          <div className="live-ticker-bar">
            <div className="ticker-pulse">
              <span className="pulse-dot" />
              <span className="ticker-badge-live">SIAGA I DARURAT</span>
              <strong>{state.disasterAlert.title}</strong>
            </div>
            <div className="ticker-text">
              {state.disasterAlert.desc}
            </div>
            <div className="ticker-actions">
              <button
                className="ticker-btn"
                onClick={handleSimulate}
                title="Picu simulasi kejadian darurat secara acak"
              >
                <Zap size={12} /> <span>Picu Simulasi</span>
              </button>
              <button
                className={`ticker-status ${state.liveSimulation ? 'active' : ''}`}
                onClick={() => toggleSimulation()}
                title="Status timer simulasi otomatis latar belakang"
              >
                {state.liveSimulation ? (
                  <>
                    <span className="ticker-live-dot" />
                    <span>SINKRONISASI AKTIF</span>
                  </>
                ) : (
                  <>
                    <Pause size={11} />
                    <span>DIJEDA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Menu size={20} /></button>
          <div className="topbar-title">
            <span className="crumb">
              Portal Komando Bencana • Dinas Sosial / {ROLE_LABEL[user.role]}
            </span>
            <strong>{title}</strong>
          </div>

          <div className="topbar-actions">
            {/* Quick Search Trigger */}
            <button className="search-bar-trigger" onClick={() => setSearchOpen(true)}>
              <Search size={15} />
              <span>Cari permohonan, posko...</span>
              <kbd>Ctrl+K</kbd>
            </button>

            {/* Lencana Otoritas Keamanan Aparatur (RBAC Terkunci) */}
            <div
              className="gov-auth-badge"
              title={`Sesi Otorisasi Kedinasan Terkunci untuk peran: ${ROLE_LABEL[user.role]}. Berpindah peran wajib keluar sesi terlebih dahulu (Aturan R-12).`}
            >
              <Shield size={13} style={{ color: 'var(--accent-primary)' }} />
              <span className="gov-auth-role">{ROLE_LABEL[user.role]}</span>
              <span className="gov-auth-dot" title="Sesi Terverifikasi" />
            </div>

            {/* Notifikasi Dropdown */}
            <div className="notif-wrap" ref={notifRef}>
              <button className="bell" aria-label="Notifikasi" onClick={() => setNotifOpen((v) => !v)}>
                <Bell size={18} />
                {unread.length > 0 && <span className="bell-count">{unread.length > 9 ? '9+' : unread.length}</span>}
              </button>
              {notifOpen && (
                <div className="notif-pop">
                  <div className="notif-pop-head">
                    <strong>Pemberitahuan Kedinasan</strong>
                    {unread.length > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markRead(unread.map((n) => n.id))}><CheckCheck size={14} /> Tandai dibaca</button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifs.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        className={`notif-row lvl-${n.level} ${n.readBy.includes(user.id) ? '' : 'unread'}`}
                        onClick={() => { markRead([n.id]); setNotifOpen(false); if (n.link) navigate(n.link); }}
                      >
                        <span className="notif-dot" />
                        <span className="notif-text">{n.message}<em>{timeAgo(n.at)}</em></span>
                      </button>
                    ))}
                    {notifs.length === 0 && <p className="cell-sub pad" style={{ padding: 14 }}>Belum ada notifikasi.</p>}
                  </div>
                  <a className="notif-all" href="#/notifikasi" onClick={() => setNotifOpen(false)}>Lihat seluruh notifikasi</a>
                </div>
              )}
            </div>

            {/* Profil Chip */}
            <a className="user-chip" href="#/profil" title="Buka profil dan mandat kedinasan">
              <span className="avatar">{initials}</span>
              <span className="user-meta">
                <strong>{user.name}</strong>
                <em>{user.jabatan}</em>
              </span>
            </a>
          </div>
        </header>

        {/* Konten Halaman */}
        <div className="content">{children}</div>

        <footer className="app-foot">
          <div>
            <strong>ResQ-Gov</strong> © {new Date().getFullYear()} • Sistem Informasi & Logistik Tanggap Darurat Bencana
          </div>
          <div>
            Diawasi Audit Trail Kriptografis Berantai Hash Sesuai Regulasi (<a href="#/aturan">Aturan R-09</a>)
          </div>
        </footer>
      </main>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <div className="modal modal-wide search-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="search-modal-head">
              <Search size={20} className="text-primary" />
              <input
                autoFocus
                className="search-modal-input"
                placeholder="Cari nomor dokumen (mis. REQ-0001), posko, beras, armada..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="icon-btn" onClick={() => setSearchOpen(false)} aria-label="Tutup"><X size={18} /></button>
            </div>

            <div className="search-modal-body">
              {!q ? (
                <div className="search-hint">
                  <span>Pencarian Cepat Data Terpadu:</span>
                  <div className="search-tags">
                    <button onClick={() => setSearchQuery('REQ-0001')}>REQ-0001</button>
                    <button onClick={() => setSearchQuery('Adam Malik')}>Posko Adam Malik</button>
                    <button onClick={() => setSearchQuery('Medan')}>Posko Medan</button>
                    <button onClick={() => setSearchQuery('Beras')}>Beras</button>
                    <button onClick={() => setSearchQuery('Truk')}>Armada Truk</button>
                    <button onClick={() => setSearchQuery('darurat')}>Darurat</button>
                  </div>
                </div>
              ) : totalResults === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>
                  Tidak ditemukan hasil untuk "<strong>{searchQuery}</strong>"
                </div>
              ) : (
                <div className="search-results-list">
                  {/* Permintaan */}
                  {searchResults.requests.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">Permintaan Logistik ({searchResults.requests.length})</div>
                      {searchResults.requests.map((r) => {
                        const p = state.posts.find((item) => item.id === r.postId);
                        return (
                          <div
                            key={r.id}
                            className="search-row"
                            onClick={() => {
                              setSearchOpen(false);
                              if (user.role === 'admin') navigate('/admin/persetujuan');
                              else if (user.role === 'koordinator') navigate('/koordinator/verifikasi');
                              else if (user.role === 'posko') navigate('/posko/permintaan');
                              else if (user.role === 'driver') navigate('/driver/tugas');
                            }}
                          >
                            <span className="mono text-primary" style={{ fontWeight: 700 }}>{r.id}</span>
                            <span>{p?.name} — {rupiah(r.estimatedValue)}</span>
                            <span className="badge badge-neutral">{r.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Posko */}
                  {searchResults.posts.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">Posko Pengungsian ({searchResults.posts.length})</div>
                      {searchResults.posts.map((p) => (
                        <div
                          key={p.id}
                          className="search-row"
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/peta');
                          }}
                        >
                          <strong>{p.name}</strong>
                          <span className="cell-sub">{p.district} • {num(p.evacuees)} / {num(p.capacity)} jiwa</span>
                          <span className="badge badge-info">Peta GIS</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Barang Master */}
                  {searchResults.items.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">Barang Logistik ({searchResults.items.length})</div>
                      {searchResults.items.map((i) => (
                        <div
                          key={i.id}
                          className="search-row"
                          onClick={() => {
                            setSearchOpen(false);
                            if (user.role === 'koordinator') navigate('/koordinator/gudang');
                            else if (user.role === 'posko') navigate('/posko/ajukan');
                            else navigate('/peta');
                          }}
                        >
                          <strong>{i.name}</strong>
                          <span className="cell-sub">Stok: {num(i.stock)} {i.unit} (Min: {num(i.minStock)})</span>
                          <span className="badge badge-neutral">{i.category}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Armada */}
                  {searchResults.vehicles.length > 0 && (
                    <div className="search-group">
                      <div className="search-group-title">Armada Kendaraan ({searchResults.vehicles.length})</div>
                      {searchResults.vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="search-row"
                          onClick={() => {
                            setSearchOpen(false);
                            if (user.role === 'koordinator') navigate('/koordinator/dispatch');
                            else if (user.role === 'driver') navigate('/driver/tugas');
                            else navigate('/peta');
                          }}
                        >
                          <strong className="mono">{v.plate}</strong>
                          <span className="cell-sub">{v.type} ({num(v.capacityKg)} kg)</span>
                          <span className="badge badge-success">{v.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
