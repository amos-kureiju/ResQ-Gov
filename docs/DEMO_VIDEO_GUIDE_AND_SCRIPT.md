# 🎬 Panduan & Naskah Rekaman Demo Video ResQ-Gov
### Dokumen Acuan Pembuatan Video Demo Lomba (Durasi: ~3-4 Menit)

---

## 📌 Ketentuan Panitia
* **Media:** Google Drive Link
* **Akses:** Wajib diatur ke **"Anyone with the link can view"** (Bukan Restricted)
* **Kualitas:** 1080p (Full HD) disarankan, audio jelas, ratio 16:9

---

## 🛠️ Alat Rekam yang Direkomendasikan
* **Pilihan 1 (Paling Mudah - Bawaan Windows):** Tekan **`Win + Alt + R`** untuk langsung merekam layar browser.
* **Pilihan 2:** Gunakan **OBS Studio** (gratis) atau **Loom** (bisa rekam wajah + layar di pojok).

---

## 📋 Urutan Akun Demo yang Digunakan
1. **Posko:** `posko1` / `posko123`
2. **Koordinator:** `koordinator` / `koor123`
3. **Kepala Dinas:** `kadis` / `kadis123`
4. **Driver:** `driver1` / `driver123`

---

## ⏱️ Storyboard & Naskah Narasi Detik-demi-Detik

### 00:00 – 00:30 | Segmen 1: Pembukaan & Latar Belakang Masalah
* **Tampilan Layar:** Tampilkan Halaman Login ResQ-Gov (`#/login`) dengan logo lambang kedinasan dan pita Merah-Putih.
* **Aksi:** Mouse menunjuk logo ResQ-Gov dan identitas SPBE.
* **Naskah Suara (Voice-Over):**
  > "Halo dewan juri yang terhormat. Indonesia berada di wilayah cincin api dengan risiko bencana yang sangat tinggi. Namun, pengelolaan logistik tanggap darurat konvensional kerap menghadapi kendala serius: disparitas bantuan antar-posko yang timpang hingga lebih dari 35%, kebocoran kargo mencapai 15 hingga 30%, serta rawan manipulasi laporan bantuan fiktif.
  > 
  > Untuk menjawab krisis tersebut, kami menghadirkan **ResQ-Gov**: Sistem Tata Kelola dan Rantai Pasok Logistik Tanggap Darurat Bencana Terpadu berbasis SPBE, dengan penegakan Segregation of Duties tingkat kode dan buku besar audit trail kriptografis SHA-256."

---

### 00:30 – 01:15 | Segmen 2: Petugas Posko (Sensus & Pengajuan Kuota Jiwa)
* **Tampilan Layar:** Login menggunakan akun `posko1` (kata sandi: `posko123`).
* **Aksi:** 
  1. Masuk ke menu **Sensus & Data Pengungsi** (`#/posko/pengungsi`). Tunjukkan data jiwa, lansia, dan balita.
  2. Klik menu **Pengajuan Bantuan Baru** (`#/posko/ajukan`).
  3. Coba masukkan kuota berlebih (tunjukkan batas kuota 3 hari otomatis sesuai Aturan R-03), lalu submit pengajuan beras dan obat.
  4. Buka menu **Permintaan Saya** dan tunjukkan kode serah terima rahasia 6-digit.
* **Naskah Suara (Voice-Over):**
  > "Kita mulai dari sudut pandang Petugas Posko di lapangan. Di sini, petugas wajib memperbarui data sensus pengungsi setiap 24 jam sesuai Aturan R-10. 
  > 
  > Saat mengajukan bantuan baru, ResQ-Gov secara otomatis menghitung plafon kebutuhan matematis berdasarkan jumlah jiwa riil pengungsi untuk maksimal 3 hari tanggap darurat sesuai Aturan R-03. Hal ini secara mutlak memotong celah penimbunan bantuan. Setelah diajukan, posko memegang kode rahasia unik 6-digit yang akan digunakan saat serah terima."

---

### 01:15 – 02:00 | Segmen 3: Koordinator Logistik (Verifikasi Stok & Dispatch)
* **Tampilan Layar:** Logout, lalu Login sebagai `koordinator` (kata sandi: `koor123`).
* **Aksi:**
  1. Masuk ke **Verifikasi Permintaan** (`#/koordinator/verifikasi`). Tunjukkan SLA timer.
  2. Buka **Manajemen Gudang** (`#/koordinator/gudang`) untuk memperlihatkan stok fisik (Aturan R-04).
  3. Klik Setujui permohonan, lalu buka menu **Dispatch Armada** (`#/koordinator/dispatch`) dan tugaskan armada mobil/truk ke `driver1`.
* **Naskah Suara (Voice-Over):**
  > "Selanjutnya, Koordinator Logistik menerima permohonan tersebut. Sistem menerapkan SLA ketat di mana verifikasi darurat wajib diselesaikan dalam waktu kurang dari 1 jam sesuai Aturan R-07. 
  > 
  > Koordinator memvalidasi ketersediaan stok fisik gudang melalui Aturan R-04. Begitu disetujui, stok terpotong otomatis dan armada beserta pengemudi ditugaskan untuk melakukan pengiriman cepat ke koordinat posko."

---

### 02:00 – 02:40 | Segmen 4: Otorisasi Pimpinan & Layar 403 Forbidden
* **Tampilan Layar:** Login sebagai `kadis` (kata sandi: `kadis123`), lalu simulasikan pengetikan rute ilegal.
* **Aksi:**
  1. Buka **Meja Persetujuan Pimpinan** (`#/admin/persetujuan`). Tunjukkan aturan otorisasi nilai > Rp 25 Juta (Aturan R-02).
  2. Coba ubah URL di address bar browser untuk mendemonstrasikan proteksi RBAC (atau tunjukkan layar **403 Forbidden**).
* **Naskah Suara (Voice-Over):**
  > "Untuk pengadaan logistik bernilai di atas 25 juta rupiah, Aturan R-02 mewajibkan otorisasi digital bertingkat langsung dari Kepala Dinas. 
  > 
  > Selain itu, ResQ-Gov menegakkan Pemisahan Tugas mutlak atau Segregation of Duties. Upaya akses lintas kewenangan akan seketika dihadang oleh layar 403 Forbidden dan insiden tersebut otomatis tercatat ke dalam sistem pengawasan."

---

### 02:40 – 03:25 | Segmen 5: Driver & Serah Terima OTP Anti-Fraud
* **Tampilan Layar:** Login sebagai `driver1` (kata sandi: `driver123`).
* **Aksi:**
  1. Buka menu **Tugas Pengiriman Armada** (`#/driver/tugas`).
  2. Klik tombol **Konfirmasi Serah Terima Barang**.
  3. Masukkan kode 6 digit dari posko tadi. Tunjukkan status sukses tervalidasi. Jelaskan jika salah 3x pengiriman terkunci otomatis (Aturan R-05).
* **Naskah Suara (Voice-Over):**
  > "Ketika armada tiba di lokasi pengungsian, pengemudi membuka modul tugas lapangan. Untuk mencegah kebocoran kargo 15-30% yang biasa terjadi di lapangan, pengemudi tidak bisa sepihak menandai barang selesai. 
  > 
  > Pengemudi wajib meminta dan memasukkan kode verifikasi 6 digit yang dipegang petugas posko penerima sah. Jika 3 kali salah, sistem otomatis mengunci pengiriman demi mitigasi fraud."

---

### 03:25 – 04:00 | Segmen 6: Audit Trail Kriptografis SHA-256 & Penutup
* **Tampilan Layar:** Kembali login sebagai `kadis`, buka menu **Audit Log Anti-Manipulasi** (`#/admin/audit`) dan **Peta Krisis GIS** (`#/peta`).
* **Aksi:**
  1. Perlihatkan rantai hash SHA-256 (setiap mutasi memiliki blok hash yang valid).
  2. Tunjukkan filter pencarian dan tombol Cetak BAST resmi.
* **Naskah Suara (Voice-Over):**
  > "Seluruh aktivitas dari hulu hingga hilir tercatat dalam buku besar audit kriptografis berantai hash SHA-256 yang append-only sesuai Aturan R-09. Perubahan data historis sekecil apapun akan langsung merusak keabsahan rantai, memberikan integritas forensik mutlak bagi BPK dan Inspektorat.
  > 
  > ResQ-Gov siap menjadi standar baru transformasi digital penanggulangan bencana di Indonesia, demi birokrasi yang bersih, akuntabel, dan keselamatan jiwa para korban bencana. Terima kasih."

---

## 📤 Langkah Upload Video ke Google Drive:
1. Setelah rekaman selesai, buka [drive.google.com](https://drive.google.com) dan unggah videonya.
2. Klik kanan file video > pilih **Share** / **Bagikan**.
3. Di bagian **General access**, ganti dari *Restricted* menjadi **"Anyone with the link" (Siapa saja yang memiliki link)** dengan peran **Viewer (Pelihat)**.
4. Klik **Copy link**, lalu tempelkan link tersebut ke kolom **Demo Video \*** pada formulir pendaftaran lomba.
