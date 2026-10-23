# SPESIFIKASI TEKNIS & BLUEPRINT SISTEM: RYOKOURENT RENTAL MOTOR

Spesifikasi sistem, batasan domain, matriks modul, dan NFR. Diperbarui bila task dengan `Docs Impact: BLUEPRINT` selesai.  
Metodologi: **Zero-Loss Context Engineering (ZLCE v3.2.2 - Mode LITE)**.

---

## 1. PARAMETER SISTEM & LINGKUNGAN

* **Nama Sistem:** Ryokourent Rental Motor Management System (Malang Raya & Kota Batu)
* **Profil Domain:** `booking`
* **Lingkungan Produksi:**
  - **Runtime:** Node.js 20+ LTS, TypeScript 5.x
  - **Framework:** Next.js 15+ (App Router), React 19
  - **Database:** Google Cloud SQL (PostgreSQL 16) via Drizzle ORM (Arsitektur Modern Decoupled) & MySQL 8.0 / MariaDB (WordPress Native Co-existence)
  - **Styling & UI:** Tailwind CSS v4, Lucide React
  - **CMS / WP Co-existence:** WordPress 6.x+, PHP 8.1+, Plugin `ryokourent-core`, Theme `generatepress-child`
* **Versi Dependensi Terverifikasi:**

| Dependensi | Versi | Sumber Verifikasi | Tanggal |
| :--- | :--- | :--- | :--- |
| `next` | `15.3.x` | package.json / lockfile | 2026-10-23 |
| `react` / `react-dom` | `19.x` | package.json / lockfile | 2026-10-23 |
| `drizzle-orm` | `^0.40.0` | package.json / lockfile | 2026-10-23 |
| `@tailwindcss/postcss` | `^4.0.0` | package.json / lockfile | 2026-10-23 |
| `lucide-react` | `^1.16.0` | package.json / lockfile | 2026-10-23 |
| `@google/genai` | `^0.1.1` | package.json / lockfile | 2026-10-23 |

* **Standar Keamanan:**
  - **Transit:** HTTPS / TLS 1.3
  - **Masukan:** Validasi tipe ketat server-side, proteksi Honeypot, Signed Time Token >= 4 detik, dan dual rate-limit hash IP
  - **Injeksi:** Kueri terparameter 100% via Drizzle ORM (PostgreSQL) dan `$wpdb->prepare` (WordPress)
  - **Privasi (UU PDP No. 27/2022):** Dilarang menyimpan 16 digit NIK KTP, foto KTP, alamat KTP, atau IP address pelanggan
  - **Rahasia:** `.env` / Cloud Secrets Manager; tidak ada kredensial terekspos di client

---

## 2. BATASAN DOMAIN BISNIS

1. **Aturan Bisnis (BR-xx):**
   - `BR-01 (Anti Double-Booking & Turnaround Buffer)`:
     - Dua transaksi sewa pada satu unit fisik tidak boleh saling tumpang tindih.
     - Setiap pemesanan wajib memiliki jeda buffer 90 menit (5400 detik) di awal dan akhir rentang sewa.
     - Status `disewa` yang melewati jadwal kembali secara otomatis memperpanjang proteksi bentrok (`max(end_epoch, now)`).
   - `BR-02 (State Machine 4 Status Resmi)`:
     - Transisi siklus sewa resmi: `Booking` (draft) $\to$ `Approved` (unit fisik terkunci) $\to$ `Disewa` (serah terima motor ke pelanggan) $\to$ `Selesai` (unit kembali dan diperiksa).
     - Pembatalan (`Reject` / `Cancel`) hanya diizinkan sebelum status `Disewa`.
   - `BR-03 (Pool Sebagai Tempat Parkir Fisik Global & Lacak 1-Unit-1-Baris)`:
     - Pool Malang (Dinoyo) dan Pool Batu (Diponegoro) hanya tempat parkir fisik (ketersediaan armada dihitung global).
     - Setiap unit fisik memiliki tepat 1 baris pemantauan real-time di `lacak_units`: `parkir` (Malang/Batu), `servis` (nama bengkel & estimasi), atau `disewa` (tenggat kembali).
   - `BR-04 (Multi-Tier Tarif & Denda ShortRent Step-Up)`:
     - Kategori Harian: 1 Hari (24 Jam — Tampilan Utama), 1 Minggu (7 Hari), 2 Minggu (14 Hari).
     - Kategori ShortRent: 12 Jam, 9 Jam, 6 Jam, 3 Jam.
     - Denda ShortRent: Keterlambatan $\ge 60$ menit otomatis naik ke paket jam di atasnya (`3j -> 6j -> 9j -> 12j`). Paket 12 jam dikenakan denda sama dengan denda harian.
   - `BR-05 (Kepatuhan UU PDP No. 27/2022)`:
     - Formulir publik dan database tidak mencatat NIK KTP. Validasi menggunakan identitas pendukung non-NIK (`SIM_C`, `KTM`, `SIM_A`, `PASPOR`, `NPWP`, `ID_KARYAWAN`, `LAINNYA`).
   - `BR-06 (Immutability Kode Unit & Proteksi Kode Eksisting D-31)`:
     - Kode unit garasi (misal `B122`, `M101`) bersifat permanen (readonly) setelah dibuat pertama kali.
     - Berkas WordPress di `wp-content/` terproteksi 100% dan berjalan berdampingan tanpa saling merusak.

2. **Lingkup & Batas Operasional:**
   - **Wilayah Layanan:** Malang Raya (Kota Malang, Kabupaten Malang) dan Kota Wisata Batu.
   - **Jam Layanan Reguler:** 07.00 – 23.00 WIB. Pemesanan di luar jam reguler tetap dapat diajukan dengan penandaan khusus persetujuan operasional via WhatsApp.

3. **Out of Scope:**
   - Integrasi payment gateway otomatis dengan verifikasi NIK KTP kaku pihak ketiga.
   - Penyekatan kaku kuota armada antar pool (stok tetap global sesuai Opsi 2A).

---

## 3. MATRIKS MODUL

| ID Modul | Nama Modul | Fungsi Utama | Dependensi |
| :--- | :--- | :--- | :--- |
| `MOD-01` | Core & Schema | Skema Cloud SQL PostgreSQL, Drizzle ORM, konfigurasi lingkungan Next.js 15 | Runtime |
| `MOD-02` | Motor Models | Manajemen tipe motor, multi-tier pricing (Harian & ShortRent), simulator denda | `MOD-01` |
| `MOD-03` | Armada Units | Manajemen unit fisik garasi, kode unit readonly (D-12), sinkronisasi otomatis status servis | `MOD-02` |
| `MOD-04` | State Machine | Siklus 4 status transaksi, buffer 90 menit (D-17), atomic lock, kalkulator denda otomatis | `MOD-03` |
| `MOD-05` | Live Tracking | Monitoring live posisi fisik 1-baris-per-unit (Parkir Pool, Servis, Disewa) | `MOD-03`, `MOD-04` |
| `MOD-06` | Public Portal | Katalog interaktif, indikator stok biner (D-05), form booking patuh UU PDP (D-21) | `MOD-02`, `MOD-04` |
| `MOD-07` | Headless REST API | REST controller Next.js (`/api/*`) dan WordPress (`/wp-json/ryokourent/v1/*`) | `MOD-01` s/d `MOD-06` |
| `MOD-08` | WP Native Co-existence | Plugin `ryokourent-core` (forms, columns, metabox, WhatsApp redirect) | Runtime WP |

---

## 4. INTEGRASI EKSTERNAL

* **Notifikasi WhatsApp:** Generator format tautan `https://api.whatsapp.com/send` dengan karakter UTF-8 terenkode rapi (`rawurlencode`) mencantumkan rincian pesanan, nomor booking, durasi, dan ketentuan denda.
* **Database Relasional:** Google Cloud SQL (PostgreSQL) via connection pooling server-side.
* **Autentikasi Operator:** Firebase Auth & session management untuk dasbor admin.

---

## 5. NFR (NON-FUNCTIONAL REQUIREMENTS)

1. **Performa:** Waktu respons REST API backend p95 < 250ms; First Contentful Paint < 1.2s; LCP < 2.0s.
2. **Ketersediaan & ACID:** 99.9% uptime dengan pencegahan balapan stok (*race conditions*) melalui transaksi atomik dan turnaround buffer.
3. **Auditability:** Setiap perubahan status transaksi, pergantian unit berkala, dan penyesuaian posisi tercatat lengkap dengan timestamp ISO 8601 WIB dan penanggung jawab.

---

## 6. ASUMSI & PERTANYAAN TERBUKA AWAL

| ID | Jenis | Isi | Dampak jika salah | Status |
| :--- | :--- | :--- | :--- | :--- |
| `ASM-01` | Asumsi | Restrukturisasi ZLCE v3.2.2 dijalankan dengan Mode LITE (4 berkas kontrol di `FOLDER_KERJA/`). | Struktur direktori dan dokumentasi tetap ramping & terfokus. | CONFIRMED |
| `ASM-02` | Asumsi | Seluruh hasil kerja dari `TASK-001` s/d `TASK-008` dipertahankan utuh sebagai baseline terverifikasi. | Tidak ada penulisan ulang kode yang sudah beroperasi 100% lulus. | CONFIRMED |
| `ASM-03` | Asumsi | Skrip diagnostik ZLCE v3.2.2 ditempatkan di `scripts/zlce/` (`zlce-check.py` & `zlce-collect.py`). | Validasi kepatuhan ZLCE dapat dijalankan otomatis. | CONFIRMED |
| `Q-04` | Pertanyaan | Apakah ada fitur atau modul tambahan baru yang ingin ditambahkan ke backlog setelah restrukturisasi ini? | Menentukan apakah task berikutnya adalah penambahan task baru atau persiapan rilis/handover. | OPEN |

---

## 7. MODEL DATA RINGKAS (MODE LITE)

### 7.1 Tabel Relasional (Cloud SQL PostgreSQL via Drizzle ORM)

1. **`motor_models`:**
   - Kolom: `id` (SERIAL PK), `nama` (VARCHAR NOT NULL), `kategori` (VARCHAR), `harga_harian` (INT), `harga_1minggu` (INT), `harga_2minggu` (INT), `harga_12jam` (INT), `harga_9jam` (INT), `harga_6jam` (INT), `harga_3jam` (INT), `denda_harian` (INT), `fasilitas` (TEXT), `spesifikasi` (TEXT), `gambar_url` (TEXT), `aktif` (BOOLEAN DEFAULT TRUE).
2. **`armada_units`:**
   - Kolom: `id` (SERIAL PK), `kode_unit` (VARCHAR UNIQUE NOT NULL, Immutability D-12), `parent_motor_id` (INT FK -> motor_models.id), `nomor_plat` (VARCHAR), `warna` (VARCHAR), `status_servis` (VARCHAR 'aktif' | 'servis'), `nama_bengkel` (VARCHAR), `pool_lokasi` (VARCHAR 'malang' | 'batu'), `odometer` (INT), `created_at` (TIMESTAMP).
3. **`lacak_units`:**
   - Kolom: `id` (SERIAL PK), `unit_id` (INT UNIQUE FK -> armada_units.id, 1-Unit-1-Baris Opsi 3A), `kode_unit` (VARCHAR), `status_posisi` (VARCHAR 'parkir' | 'servis' | 'disewa'), `pool_parkir` (VARCHAR 'malang' | 'batu'), `nama_bengkel` (VARCHAR), `booking_id_aktif` (INT), `updated_at` (TIMESTAMP), `catatan` (TEXT).
4. **`penyewaan`:**
   - Kolom: `id` (SERIAL PK), `no_booking` (VARCHAR UNIQUE), `nama_penyewa` (VARCHAR NOT NULL, UU PDP), `nomor_wa` (VARCHAR NOT NULL), `tanda_pelanggan` (VARCHAR 'baru' | 'langganan'), `jenis_id_pendukung` (VARCHAR NOT NULL), `motor_id` (INT FK), `unit_id` (INT FK NULLABLE), `status` (VARCHAR 'booking' | 'approved' | 'disewa' | 'selesai' | 'dibatalkan'), `pool` (VARCHAR 'malang' | 'batu'), `alamat_pengantaran` (TEXT), `alamat_penjemputan` (TEXT), `jam_tanggal_mulai` (VARCHAR), `jam_tanggal_selesai` (VARCHAR), `start_epoch` (BIGINT), `end_epoch` (BIGINT), `total_harga_estimasi` (INT), `total_denda` (INT DEFAULT 0), `catatan_denda` (TEXT), `created_at` (TIMESTAMP).

### 7.2 State Machine Transaksi (`penyewaan.status`)

| Dari | Ke | Pemicu | Guard (Syarat) |
| :--- | :--- | :--- | :--- |
| `booking` | `approved` | Operator klik *Approve & Kunci Unit* | Unit fisik bebas dari bentrok + buffer 90 menit |
| `booking` | `dibatalkan` | Operator klik *Reject / Cancel* | Belum disetujui / stok tidak tersedia |
| `approved` | `disewa` | Operator klik *Mulai Sewa (Serah Terima)* | Pelanggan tiba & identitas pendukung diverifikasi |
| `approved` | `dibatalkan` | Pembatalan sebelum motor diserahkan | Dilarang membatalkan jika sudah disewa (AC-02) |
| `disewa` | `selesai` | Operator klik *Selesai & Hitung Denda* | Motor dikembalikan; denda otomatis dihitung jika telat |

---

## 8. STRATEGI UJI (MODE LITE)

1. **Uji Linter & Tipe:** `npm run lint` — Memastikan 0 sintaksis error dan konsistensi tipe TypeScript.
2. **Uji Kompilasi:** `npm run build` (`compile_applet`) — Memastikan bundler Next.js 15 App Router lulus kompilasi tanpa modul hilang.
3. **Uji Fungsional & E2E API:** Pengujian automated HTTP Python script terhadap 5 skenario inti:
   - Skenario 1: `GET /api/motor-models` (multi-tier pricing & kalkulator)
   - Skenario 2: `GET /api/armada-units` (unit garasi & immutability kode)
   - Skenario 3: `GET /api/lacak-units` (monitoring live 1-baris-per-unit)
   - Skenario 4: `GET /api/penyewaan/available-units` (Turnaround buffer 90m & anti double-booking)
   - Skenario 5: `POST /api/penyewaan` (Pemesanan patuh UU PDP No. 27/2022)
4. **Uji Validasi Protokol ZLCE:** `python3 scripts/zlce/zlce-check.py FOLDER_KERJA --no-git` — Wajib menghasilkan `RESULT: OK (0 error)`.
