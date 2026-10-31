# 🇮🇩 ResQ-Gov — Sistem Informasi & Komando Logistik Kebencanaan
### Portal Tata Kelola & Distribusi Logistik Tanggap Darurat Bencana Terpadu (SPBE)
**Dinas Sosial & Badan Penanggulangan Bencana Daerah (BPBD) • Republik Indonesia**

[![GitHub Repository](https://img.shields.io/badge/GitHub-amos--kureiju%2FResQ--Gov-181717?style=for-the-badge&logo=github)](https://github.com/amos-kureiju/ResQ-Gov)
[![React Version](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Security Standards](https://img.shields.io/badge/Security-RBAC%20%7C%20Hash--Chain%20Audit-057a55?style=for-the-badge&logo=shield)](https://github.com/amos-kureiju/ResQ-Gov)
[![Governance](https://img.shields.io/badge/SPBE-Good%20Governance-b45309?style=for-the-badge)](https://github.com/amos-kureiju/ResQ-Gov)

---

## 🏛️ Latar Belakang & Filosofi Sistem

Sering kali sistem pengelolaan logistik bencana menghadapi kendala akuntabilitas serius: data bantuan fiktif, ketidaksesuaian jumlah barang antara gudang dan posko, penimbunan barang tanpa batas kewajaran, serta hilangnya jejak pertanggungjawaban aparatur.

**ResQ-Gov** dibangun sebagai wujud nyata penerapan **Prinsip Good Governance** dan standar KomDi dengan sistem keamanan berlapis (*Authentication Guard, RBAC Route Guard, dan Audit Trail Kriptografis Berantai Hash SHA-256*).

---

## 🛡️ Arsitektur Keamanan & Tata Kelola (Security & Governance)

### 1. Wajib Autentikasi Kedinasan (Authentication Guard)
* Seluruh rute kedinasan (`/admin`, `/koordinator`, `/posko`, `/driver`) dilindungi secara ketat.
* Pengguna yang belum login atau sesi yang kedaluwarsa **dilarang keras** memuat atau melihat data internal apa pun dan langsung dialihkan ke portal login resmi (`#/login`).
* Sesi login otomatis berakhir (*timeout*) setelah 30 menit tanpa aktivitas (**Aturan R-11**) untuk mencegah penyalahgunaan terminal posko/kantor.

### 2. Pembatasan Lintas Peran & Layar 403 Forbidden (RBAC Route Guard)
* Setiap peran aparatur terikat secara absolut pada modul kewenangannya.
* Upaya penyerobotan atau pengetikan URL peran lain secara sepihak (misal petugas Posko mengetik `#/admin` atau `#/koordinator/gudang`):
  1. **Diblokir Seketika**: Komponen halaman terlarang tidak akan pernah dimuat ke memori.
  2. **Tampilan 403 Forbidden Resmi**: Menampilkan layar resmi *403 — Akses Kedinasan Ditolak & Dibatasi Sistem* yang menerangkan aparatur aktif, peran saat ini, rute yang dituju, dan aturan kedinasan terkait.
  3. **Pencatatan Insiden Kriptografis**: Upaya penyerobotan rute otomatis dicatat sebagai insiden `PELANGGARAN_AKSES_RUTE_ILEGAL` ke dalam buku besar audit trail SHA-256 berbendera (*flagged*).

### 3. Matriks Hak Akses Peran (Access Control Matrix)

| Modul & Rute | Kepala Dinas (`admin`) | Koordinator (`koordinator`) | Petugas Posko (`posko`) | Pengemudi (`driver`) |
| :--- | :---: | :---: | :---: | :---: |
| **Ringkasan Eksekutif** (`/admin`) | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Meja Persetujuan Pimpinan** (`/admin/persetujuan`) | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Manajemen Aparatur & RBAC** (`/admin/pengguna`) | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Audit Log Anti-Manipulasi** (`/admin/audit`) | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Laporan Resmi & Cetak BAST** (`/admin/laporan`) | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Pusat Kendali Logistik** (`/koordinator`) | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Verifikasi Permintaan** (`/koordinator/verifikasi`) | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Manajemen Gudang** (`/koordinator/gudang`) | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Penugasan Armada / Dispatch** (`/koordinator/dispatch`) | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Pemantauan Posko Wilayah** (`/koordinator/posko`) | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Dasbor Posko Lapangan** (`/posko`) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden |
| **Permintaan Logistik Posko** (`/posko/permintaan`) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden |
| **Pengajuan Bantuan Baru** (`/posko/ajukan`) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden |
| **Sensus & Data Pengungsi** (`/posko/pengungsi`) | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Otoritas Penuh | ❌ 403 Forbidden |
| **Tugas Pengiriman Armada** (`/driver/tugas`) | ❌ 403 Forbidden | ❌ 403 Forbidden | ❌ 403 Forbidden | ✅ Otoritas Penuh |
| **Peta Krisis GIS** (`/peta`) | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama |
| **Aturan Sistem & SLA** (`/aturan`) | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama |
| **Profil Aparatur** (`/profil`) | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama |
| **Pusat Pemberitahuan** (`/notifikasi`) | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama | ✅ Akses Bersama |

---

## 📜 12 Aturan Bisnis Kedinasan (Governance Rules R-01 s/d R-12)

Setiap aturan di bawah ini ditegakkan langsung oleh kode program (*code-enforced business logic*):

1. **R-01: Pemisahan Tugas (*Segregation of Duties*)**: Pengaju (Posko), pemverifikasi (Koordinator), dan penyetuju (Kadis) tidak boleh orang yang sama. Pengemudi dilarang mengonfirmasi penerimaan barang.
2. **R-02: Persetujuan Berjenjang (*Multi-Tier Approval*)**: Permintaan bernilai > Rp 25.000.000 wajib mendapat otorisasi digital Kepala Dinas setelah diverifikasi Koordinator.
3. **R-03: Batas Kebutuhan Berbasis Jumlah Jiwa (*Norm-Based Quota*)**: Kuantitas bantuan dibatasi kebutuhan riil per jiwa (maks. 3 hari cakupan per pengajuan) untuk mencegah penimbunan.
4. **R-04: Validasi Ketersediaan Stok Fisik**: Permintaan ditolak bila stok gudang tidak mencukupi. Terpotong otomatis saat dispatch armada.
5. **R-05: Bukti Serah Terima Kode Verifikasi 6 Digit**: Pengemudi wajib memasukkan kode rahasia yang hanya dimiliki petugas posko penerima. 3x salah = pengiriman terkunci otomatis (*anti-fraud*).
6. **R-06: Deteksi Selisih Fisik Lapangan**: Jika barang diterima kurang/rusak, status otomatis menjadi **SELISIH** dan wajib ditindaklanjuti dengan Berita Acara resmi oleh Kepala Dinas.
7. **R-07: Batas Waktu Layanan (*SLA*)**: Permintaan darurat wajib diverifikasi ≤ 1 jam dan terkirim ≤ 6 jam. Pelanggaran SLA memicu eskalasi merah ke pimpinan.
8. **R-08: Dokumen Wajib & Alasan Berbobot**: Penolakan wajib menyertakan alasan minimal 20 karakter; justifikasi permintaan minimal 30 karakter.
9. **R-09: Audit Log Anti-Manipulasi (*Append-Only Hash Chain*)**: Jejak aktivitas dirantai secara kriptografis menggunakan algoritma SHA-256. Perubahan 1 karakter akan merusak seluruh rantai validitas.
10. **R-10: Kewajiban Kebaruan Data Sensus**: Posko wajib memperbarui sensus minimal 1x dalam 24 jam sebelum diizinkan mengajukan logistik baru.
11. **R-11: Keamanan Sesi & Akun**: Sesi kedaluwarsa dalam 30 menit; 5x gagal login mengunci akun 15 menit.
12. **R-12: Akses Berbasis Peran (*RBAC*)**: Setiap aparatur dilarang berpindah modul peran lain tanpa otorisasi.

---

## 👥 Akun Demo Aparatur Kedinasan

Aplikasi menyediakan kredensial resmi untuk simulasi dan demonstrasi alur kerja:

| Peran Kedinasan | Nama Aparatur & NIP | Akun | Kata Sandi | Lingkup Tugas Pokok |
| :--- | :--- | :--- | :--- | :--- |
| **Kepala Dinas Sosial** | Dr. Hj. Ratna Wulandari, M.Si<br>`NIP. 19740512 199903 2 001` | `kadis` | `kadis123` | Otorisasi anggaran > Rp 25 Jt, penyelesaian berita acara selisih, audit trail, laporan resmi BPK. |
| **Koordinator Logistik** | Ir. Bambang Hartono<br>`NIP. 19800815 200501 1 004` | `koordinator` | `koor123` | Verifikasi kelayakan posko, kontrol stok minimum gudang, dispatch armada, buka kunci pengiriman. |
| **Petugas Posko 1** | Siti Aminah, S.Sos<br>`NIP. 19880403 201101 2 003` | `posko1` | `posko123` | Sensus pengungsi, pengajuan bantuan kuota jiwa, pemegang kode serah terima Posko Lapangan Adam Malik (Siantar). |
| **Petugas Posko 2** | Rudi Hermawan<br>`NIP. 19900918 201402 1 001` | `posko2` | `posko123` | Pengelolaan Posko Terpadu Lapangan Merdeka (Medan), verifikasi fisik bantuan masuk. |
| **Pengemudi Armada 1** | Budi Santoso<br>`NIP. 19920110 201703 1 002` | `driver1` | `driver123` | Truk Engkel (BK 9123 KZ), pengiriman logistik lapangan, input kode serah terima BAST. |
| **Pengemudi Armada 2** | Agus Pratama<br>`NIP. 19950722 201902 1 005` | `driver2` | `driver123` | Mobil Box Rescue (BK 9456 KZ), distribusi cepat ke daerah terisolir. |

---

## 🎨 Desain Sistem Pemerintahan & Estetika (Gov Design System)

1. **Top Identity Bar Kenegaraan**:
   - Pita mikro bendera **Merah Putih**.
   - Penanda resmi SPBE: *"Situs Resmi Komando Bencana • Republik Indonesia"*.
   - Jam operasional resmi **WIB** real-time & badge status Pusdalops 24 Jam.
2. **Lambang Vektor Resmi ([GovEmblem](src/components/GovEmblem.tsx))**:
   - Perisai segilima emas-navy, ornamen sayap merah putih, dan bintang kedaulatan.
3. **Tipografi [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)**:
   - Standar tipografi ekosistem digital Indonesia berpadu dengan *JetBrains Mono* untuk nomor BAST, NIP, nominal Rupiah, dan hash kriptografis.
4. **Palet Warna Eksekutif**:
   - *Deep Official Navy* (`#071120`, `#0a192f`), *State Crimson* (`#c51624`), dan *Minimalist Clean Canvas* (`#f8fafc`).
5. **Layout Cetak Otomatis (Print Stylesheet)**:
   - Halaman laporan resmi otomatis berformat kop surat kedinasan tanpa elemen UI web, siap dicetak atau diekspor ke PDF/CSV untuk audit BPK/Inspektorat Daerah.

---

## 💻 Panduan Instalasi & Menjalankan Proyek

### Prasyarat
- **Node.js** v18 atau yang lebih baru (disarankan Node.js v20+)
- **npm** atau **yarn** / **pnpm**
- **Git**

### Langkah Instalasi

1. **Clone Repositori dari GitHub**:
   ```bash
   git clone https://github.com/amos-kureiju/ResQ-Gov.git
   cd ResQ-Gov
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Server Pengembangan (Dev Server)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:5173/`.

4. **Kompilasi Rilis Produksi (Production Build)**:
   ```bash
   npm run build
   ```
   Hasil kompilasi siap saji akan berada di folder `dist/`.

5. **Pratinjau Hasil Build**:
   ```bash
   npm run preview
   ```

---

## 🌐 Panduan Deployment ke Cloud Hosting Gratis

Aplikasi ResQ-Gov menggunakan router berbasis hash (`#/`), sehingga **100% kompatibel di platform static hosting mana pun tanpa konfigurasi server rewrite**:

### 1. Deploy ke Vercel (Paling Direkomendasikan)
1. Buka [vercel.com](https://vercel.com) dan hubungkan akun GitHub Anda (`amos-kureiju`).
2. Klik **Add New Project** → pilih repositori **`ResQ-Gov`**.
3. Framework Preset: **Vite** (otomatis terdeteksi).
4. Klik **Deploy**. Dalam hitungan detik website telah aktif secara online.

### 2. Deploy ke GitHub Pages
Proyek ini dapat di-host langsung pada GitHub Pages menggunakan GitHub Actions:
- Masuk ke tab **Settings** repositori GitHub → **Pages**.
- Pilih **GitHub Actions** sebagai *Source*.

---

## 📂 Struktur Proyek

```
ResQ-Gov/
├── public/
│   └── favicon.svg               # Lambang resmi kedinasan
├── src/
│   ├── components/
│   │   ├── GovEmblem.tsx         # Komponen vektor lambang perisai resmi
│   │   ├── Layout.tsx            # Shell aplikasi, topbar SPBE & sidebar
│   │   ├── RequestViews.tsx      # Tabel permohonan & modal detail BAST
│   │   ├── Toast.tsx             # Notifikasi respon tindakan sistem
│   │   └── ui.tsx                # Komponen UI (Badge, Panel, StatCard, dll.)
│   ├── pages/
│   │   ├── Login.tsx             # Portal masuk SSO aparatur
│   │   ├── admin/                # Modul Kepala Dinas (Approval, Users, Audit, Reports)
│   │   ├── koordinator/          # Modul Koordinator (KoorDashboard, Verification, Warehouse, Dispatch, PoskoOverview)
│   │   ├── posko/                # Modul Petugas Posko (PoskoDashboard, MyRequests, NewRequest, Evacuees)
│   │   ├── driver/               # Modul Pengemudi Armada (DriverTasks)
│   │   └── common/               # Modul Bersama (Forbidden403, CrisisMap, RulesPage, Profile, Notifications)
│   ├── rules/
│   │   └── businessRules.ts      # Definisi 12 Aturan Bisnis, SLA & RBAC map
│   ├── store/
│   │   ├── StoreContext.tsx      # State manager, validasi aksi & audit recorder
│   │   ├── audit.ts              # Mesin kalkulasi hash chain kriptografis
│   │   └── seed.ts               # Data simulasi awal tanggap darurat
│   ├── App.tsx                   # Route Guard, autentikasi & RBAC dispatcher
│   ├── index.css                 # Desain sistem SPBE & stylesheet minimalis
│   ├── main.tsx                  # Titik masuk React
│   └── types.ts                  # Definisi antarmuka TypeScript
├── index.html                    # Meta tags & Google Fonts Plus Jakarta Sans
├── package.json                  # Dependensi proyek
├── tsconfig.json                 # Konfigurasi TypeScript
└── vite.config.js                # Konfigurasi bundler Vite
```

---

## ⚖️ Lisensi & Hak Cipta

Dikembangkan untuk keperluan **Sistem Pemerintahan Berbasis Elektronik (SPBE)** dalam penanggulangan bencana daerah dan nasional dengan prinsip transparansi publik dan integritas tata kelola aparatur negara.

© 2026 **Amos Baringbing** ([@amos-kureiju](https://github.com/amos-kureiju)) • All Rights Reserved.
