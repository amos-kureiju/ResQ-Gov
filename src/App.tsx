import React, { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Package,
  Truck,
  FileText,
  ShieldAlert,
  Users,
  MapPin,
  PlusCircle,
  ClipboardList,
  Navigation,
} from 'lucide-react';
import { StoreProvider, useStore } from './store/StoreContext';
import { ToastProvider } from './components/Toast';
import { usePath, navigate } from './router';
import { Layout, NavItem } from './components/Layout';
import { ROLE_HOME, isRouteAllowed } from './rules/businessRules';

// Halaman Keamanan & Umum
import Login from './pages/Login';
import Forbidden403 from './pages/common/Forbidden403';
import RulesPage from './pages/common/RulesPage';
import Profile from './pages/common/Profile';
import Notifications from './pages/common/Notifications';
import CrisisMap from './pages/common/CrisisMap';

// Posko
import PoskoDashboard from './pages/posko/PoskoDashboard';
import MyRequests from './pages/posko/MyRequests';
import NewRequest from './pages/posko/NewRequest';
import Evacuees from './pages/posko/Evacuees';

// Koordinator
import KoorDashboard from './pages/koordinator/KoorDashboard';
import Verification from './pages/koordinator/Verification';
import Warehouse from './pages/koordinator/Warehouse';
import Dispatch from './pages/koordinator/Dispatch';
import PoskoOverview from './pages/koordinator/PoskoOverview';

// Admin (Kepala Dinas)
import AdminDashboard from './pages/admin/AdminDashboard';
import Approval from './pages/admin/Approval';
import UsersPage from './pages/admin/Users';
import AuditLogPage from './pages/admin/AuditLog';
import OfficialReports from './pages/admin/OfficialReports';

// Driver
import DriverTasks from './pages/driver/DriverTasks';

const AppContent: React.FC = () => {
  const { user, recordSecurityIncident } = useStore();
  const path = usePath();
  const reportedIncidentRef = useRef<string | null>(null);

  // ------------------------------------------------------------
  // Route Guard: Wajib Login untuk Mengakses Sistem
  // ------------------------------------------------------------
  useEffect(() => {
    if (!user && path !== '/login') {
      navigate('/login');
    } else if (user && (path === '/login' || path === '/')) {
      // Pengguna sudah login diarahkan otomatis ke beranda peran resminya
      navigate(ROLE_HOME[user.role]);
    }
  }, [user, path]);

  // ------------------------------------------------------------
  // Route Guard: Pemeriksaan Otoritas Hak Akses Peran (RBAC / R-12)
  // ------------------------------------------------------------
  const routeCheck = isRouteAllowed(path, user?.role);

  // Catat pelanggaran ke audit log jika aparatur mencoba berpindah ke rute yang dilarang
  useEffect(() => {
    if (user && !routeCheck.allowed && reportedIncidentRef.current !== path) {
      reportedIncidentRef.current = path;
      recordSecurityIncident(
        'AKSES_RUTE_ILEGAL',
        path,
        `Upaya akses lintas peran tidak sah ke rute "${path}" oleh aparatur ${user.name} (${user.role}) berhasil dicegah sistem keamanan (R-12).`
      );
    }
  }, [routeCheck.allowed, path, user, recordSecurityIncident]);

  // Jika belum login, hanya halaman Login yang dapat dimuat
  if (!user || path === '/login') {
    return <Login />;
  }

  // Tentukan item navigasi resmi berdasarkan peran aparatur yang sedang aktif
  let navItems: NavItem[] = [];
  if (user.role === 'admin') {
    navItems = [
      { path: '/admin', label: 'Ringkasan Eksekutif', icon: <LayoutDashboard size={18} /> },
      {
        path: '/admin/persetujuan',
        label: 'Meja Persetujuan',
        icon: <CheckCircle2 size={18} />,
        badge: (s) => s.requests.filter((r) => r.status === 'menunggu_persetujuan').length,
      },
      { path: '/admin/pengguna', label: 'Manajemen Aparatur & RBAC', icon: <Users size={18} /> },
      { path: '/admin/audit', label: 'Audit Log & Integritas', icon: <ShieldAlert size={18} /> },
      { path: '/admin/laporan', label: 'Laporan Resmi', icon: <FileText size={18} /> },
    ];
  } else if (user.role === 'koordinator') {
    navItems = [
      { path: '/koordinator', label: 'Pusat Kendali', icon: <LayoutDashboard size={18} /> },
      {
        path: '/koordinator/verifikasi',
        label: 'Verifikasi Permintaan',
        icon: <ClipboardList size={18} />,
        badge: (s) => s.requests.filter((r) => r.status === 'diajukan').length,
      },
      { path: '/koordinator/gudang', label: 'Manajemen Gudang', icon: <Package size={18} /> },
      {
        path: '/koordinator/dispatch',
        label: 'Penugasan Armada',
        icon: <Truck size={18} />,
        badge: (s) => s.requests.filter((r) => r.status === 'disetujui').length,
      },
      { path: '/koordinator/posko', label: 'Posko Wilayah', icon: <MapPin size={18} /> },
    ];
  } else if (user.role === 'posko') {
    navItems = [
      { path: '/posko', label: 'Dasbor Posko', icon: <LayoutDashboard size={18} /> },
      {
        path: '/posko/permintaan',
        label: 'Permintaan Saya',
        icon: <ClipboardList size={18} />,
        badge: (s) => s.requests.filter((r) => r.postId === user.postId && r.status === 'terkirim').length,
      },
      { path: '/posko/ajukan', label: 'Ajukan Bantuan', icon: <PlusCircle size={18} /> },
      { path: '/posko/pengungsi', label: 'Data Pengungsi', icon: <Users size={18} /> },
    ];
  } else if (user.role === 'driver') {
    navItems = [
      {
        path: '/driver/tugas',
        label: 'Tugas Pengiriman',
        icon: <Navigation size={18} />,
        badge: (s) => s.shipments.filter((x) => x.driverId === user.id && (x.status === 'ditugaskan' || x.status === 'dalam_perjalanan')).length,
      },
    ];
  }

  if (!routeCheck.allowed) {
    return (
      <Layout nav={navItems} title="403 — Akses Kedinasan Ditolak">
        <Forbidden403 attemptedPath={path} allowedRoles={routeCheck.requiredRoles} />
      </Layout>
    );
  }

  // ------------------------------------------------------------
  // Render Halaman yang Diotorisasi
  // ------------------------------------------------------------
  let pageTitle = 'ResQ-Gov';
  let pageComponent: React.ReactNode = null;

  if (user.role === 'admin') {
    if (path === '/admin') {
      pageTitle = 'Ringkasan Eksekutif';
      pageComponent = <AdminDashboard />;
    } else if (path === '/admin/persetujuan') {
      pageTitle = 'Meja Persetujuan Pimpinan';
      pageComponent = <Approval />;
    } else if (path === '/admin/pengguna') {
      pageTitle = 'Manajemen Aparatur & RBAC';
      pageComponent = <UsersPage />;
    } else if (path === '/admin/audit') {
      pageTitle = 'Audit Trail Anti-Manipulasi';
      pageComponent = <AuditLogPage />;
    } else if (path === '/admin/laporan') {
      pageTitle = 'Laporan Realisasi Resmi';
      pageComponent = <OfficialReports />;
    }
  } else if (user.role === 'koordinator') {
    if (path === '/koordinator') {
      pageTitle = 'Pusat Kendali Logistik';
      pageComponent = <KoorDashboard />;
    } else if (path === '/koordinator/verifikasi') {
      pageTitle = 'Antrean Verifikasi Stok';
      pageComponent = <Verification />;
    } else if (path === '/koordinator/gudang') {
      pageTitle = 'Manajemen Gudang Logistik';
      pageComponent = <Warehouse />;
    } else if (path === '/koordinator/dispatch') {
      pageTitle = 'Penugasan Armada (Dispatch)';
      pageComponent = <Dispatch />;
    } else if (path === '/koordinator/posko') {
      pageTitle = 'Pemantauan Posko Wilayah';
      pageComponent = <PoskoOverview />;
    }
  } else if (user.role === 'posko') {
    if (path === '/posko') {
      pageTitle = 'Dasbor Posko Pengungsian';
      pageComponent = <PoskoDashboard />;
    } else if (path === '/posko/permintaan') {
      pageTitle = 'Status Permintaan Bantuan';
      pageComponent = <MyRequests />;
    } else if (path === '/posko/ajukan') {
      pageTitle = 'Pengajuan Bantuan Logistik';
      pageComponent = <NewRequest />;
    } else if (path === '/posko/pengungsi') {
      pageTitle = 'Pembaruan Data Pengungsi';
      pageComponent = <Evacuees />;
    }
  } else if (user.role === 'driver') {
    if (path === '/driver' || path === '/driver/tugas') {
      pageTitle = 'Tugas Pengiriman Armada';
      pageComponent = <DriverTasks />;
    }
  }

  // Modul Bersama Lintas Peran Terotentikasi
  if (path === '/peta') {
    pageTitle = 'Peta Situasi Krisis & GIS';
    pageComponent = <CrisisMap />;
  } else if (path === '/aturan') {
    pageTitle = 'Aturan & Tata Kelola Sistem';
    pageComponent = <RulesPage />;
  } else if (path === '/profil') {
    pageTitle = 'Profil Aparatur';
    pageComponent = <Profile />;
  } else if (path === '/notifikasi') {
    pageTitle = 'Pusat Pemberitahuan';
    pageComponent = <Notifications />;
  }

  // Fallback ke beranda peran resmi jika rute tidak dikenali
  if (!pageComponent) {
    if (user.role === 'admin') pageComponent = <AdminDashboard />;
    else if (user.role === 'koordinator') pageComponent = <KoorDashboard />;
    else if (user.role === 'posko') pageComponent = <PoskoDashboard />;
    else if (user.role === 'driver') pageComponent = <DriverTasks />;
  }

  return (
    <Layout nav={navItems} title={pageTitle}>
      {pageComponent}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </StoreProvider>
  );
};

export default App;
