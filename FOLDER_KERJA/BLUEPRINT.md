# SPESIFIKASI TEKNIS & BLUEPRINT SISTEM: LANJUTAN RENTAL MOTOR (RYOKOURENT)

**Versi:** 3.0.0 (Restrukturisasi & Modul Alternatif Modern)  
**Dokumen Kontrol:** BLUEPRINT.md (Disetujui Pengguna)  
**Metodologi:** Zero-Loss Context Engineering (ZLCE v3.2 - Mode LITE)

---

## 1. PARAMETER SISTEM & LINGKUNGAN

* **Nama Sistem:** Ryokourent Rental Management System
* **Profil Domain:** `booking`
* **Lingkungan Sistem:**
  - **Stack Eksisting (Baseline Teruji):** WordPress 6.x+, PHP 8.1+, MySQL/MariaDB 10.4+, Plugin `ryokourent-core`, Child Theme `generatepress-child`.
  - **Stack Alternatif Modern (Target Evaluasi):** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Modern REST API Architecture.
* **Versi Dependensi Kunci:**
  - React: 19.x
  - Tailwind CSS: v4
  - Lucide Icons: latest
  - Node.js Runtime: 20+ LTS

---

## 2. BATASAN DOMAIN BISNIS (BR-xx)

1. **Aturan Bisnis Kunci (`BR-xx` / Mengadopsi `D-01..D-31`):**
   - `BR-01 (Anti Double-Booking & Atomic Lock)`:
     - Dua pemesanan pada unit fisik yang sama tidak boleh bertabrakan jadwalnya.
     - Setiap unit fisik wajib memiliki jeda *Turnaround Buffer* 90 menit (5400 detik) di awal dan akhir rentang sewa.
     - Penguncian unit wajib bersifat atomik (`SELECT GET_LOCK` atau transaksi database `SELECT FOR UPDATE`).
   - `BR-02 (State Machine 4 Status Resmi)`:
     - Alur pesanan: `Booking` (stok belum terkunci) $\to$ `Approve Booking` (unit fisik dikunci) $\to$ `Disewa` (serah terima kunci & motor dibawa penyewa) $\to$ `Selesai` (motor kembali & unit bebas kembali).
     - Pembatalan (`Reject`/`Cancel`) hanya dapat dilakukan sebelum status `Disewa`.
   - `BR-03 (Pool Sebagai Tempat Parkir Global & CPT Lacak Unit)`:
     - Pool Malang dan Pool Batu hanya berfungsi sebagai tempat parkir fisik (armada tidak dibagi kuota kaku per pool).
     - Setiap unit armada fisik memiliki 1 entri status posisi real-time:
       1. `Parkir`: berada di Pool mana (`Pool Malang` / `Pool Batu`).
       2. `Servis`: berada di Bengkel mana (nama bengkel, kontak mekanik, estimasi selesai).
       3. `Disewa`: sedang disewa siapa (nama penyewa, nomor booking, jadwal/tenggat kembali).
   - `BR-04 (Skema Tarif 2 Kategori + Denda ShortRent Bertingkat)`:
     - Tarif Harian: 1 Hari (24 Jam — Tampilan Utama), 1 Minggu (7 Hari), 2 Minggu (14 Hari).
     - Tarif Jam (ShortRent): 12 Jam, 9 Jam, 6 Jam, 3 Jam.
     - Aturan Denda ShortRent: Keterlambatan $\ge 60$ menit otomatis naik tagihan ke kategori jam di atasnya (`3j -> 6j -> 9j -> 12j`). Untuk paket 12 Jam, denda keterlambatan sama dengan denda harian per jam.
   - `BR-05 (Kepatuhan Privasi UU PDP No. 27/2022)`:
     - Database dilarang menyimpan NIK KTP 16 digit, foto KTP, alamat lengkap KTP, atau IP address pelanggan.
     - Verifikasi identitas menggunakan jenis ID pendukung (`SIM_C`, `KTM`, `SIM_A`, `PASPOR`, `NPWP`, `ID_KARYAWAN`, `LAINNYA`).
   - `BR-06 (Proteksi Kode Lama Tanpa Konfirmasi)`:
     - Sesuai `D-31`, seluruh modul dan fitur yang sudah berjalan di `wp-content/plugins/ryokourent-core` tidak boleh dihapus atau ditimpa secara destruktif.

---

## 3. MATRIKS MODUL SISTEM

| ID Modul | Nama Modul | Fungsi Utama | Ketergantungan |
| :--- | :--- | :--- | :--- |
| `MOD-01` | Katalog & Model Motor | Manajemen tipe model motor, spesifikasi, dan multi-tier tarif (Harian & Jam). | Core DB |
| `MOD-02` | Unit Fisik Armada | Manajemen unit fisik garasi (Kode Unit permanen, plat nomor, warna, status kesiapan). | `MOD-01` |
| `MOD-03` | Lacak Posisi Unit | Monitoring real-time lokasi fisik unit (Parkir Pool, Servis Bengkel, Sedang Disewa). | `MOD-02` |
| `MOD-04` | Availability & Atomic Lock | Mesin kalkulasi ketersediaan global, buffer 90 menit, dan pencegahan double-booking. | `MOD-02`, `MOD-03` |
| `MOD-05` | Transaksi & State Machine | Alur pemesanan publik, approve booking, serah terima, tukar unit berkala, dan selesai. | `MOD-04` |
| `MOD-06` | Kalkulator Denda | Otomatisasi hitung denda harian dan denda ShortRent step-up 60 menit. | `MOD-05` |
| `MOD-07` | Dashboard Operator & Admin | Manajemen pemesanan, filter lacak unit, audit log nomor WhatsApp, dan bulk pricing. | `MOD-01` s/d `MOD-06` |
| `MOD-08` | Modul Alternatif Modern (Vite/React) | Aplikasi web modern mandiri (decoupled frontend/fullstack) di luar WordPress. | `MOD-01` s/d `MOD-07` |

---

## 4. PERBANDINGAN & ANALISIS ALTERNATIF NON-WORDPRESS

| Kriteria Evaluasi | WordPress Native (`ryokourent-core`) | Alternatif Modern (React 19 + TypeScript + REST/PostgreSQL) |
| :--- | :--- | :--- |
| **Arsitektur** | Monolitik CMS (PHP, MySQL, WP Hooks/Filter). | Decoupled / Modern SPA (React UI + Backend API terisolasi). |
| **Kecepatan & UX** | Bergantung pada caching WP dan performa shared hosting. | Instan, reaktif, SPA tanpa reload, navigasi responsif dan mulus. |
| **Pencegahan Double-Booking** | Mengandalkan MySQL `GET_LOCK()` dan transient lock PHP. | Database ACID Transaction dengan `SERIALIZABLE` / row-level lock (`SELECT FOR UPDATE`). |
| **Biaya Pemeliharaan** | Rendah di shared hosting, namun rentan konflik plugin/update core WP. | Bebas dari bloatware WordPress; kode bersih dan dapat di-containerize (Docker). |
| **Pengelolaan State** | Bergantung pada AJAX `admin-ajax.php` / REST WP API. | State management modern (React State, Zustand/TanStack Query) tipe-aman (*strict TypeScript*). |

---

## 5. NON-FUNCTIONAL REQUIREMENTS (NFR)

1. **Integritas Konkurensi:** Tidak boleh terjadi *race condition* atau alokasi ganda pada unit motor yang sama di rentang waktu yang beririsan.
2. **Kinerja Frontend:** Waktu pemuatan halaman awal (LCP) < 1.5 detik, respons interaksi dropdown filter < 100ms.
3. **Auditability:** Setiap perubahan status transaksi, pergantian unit berkala, dan update posisi unit wajib mencatat timestamp WIB dan identitas operator.
4. **Keamanan Data Pribadi:** Nol penyimpanan data sensitif KTP/NIK sesuai UU PDP.

---

## 6. MODEL DATA RINGKAS (MODE LITE)

1. **Entitas Model Motor (`motor`):**
   - Atribut: `id`, `nama_model`, `kategori` (`Matic`, `Sport`, `Trail`, `Retro`), `harga_1hari`, `harga_1minggu`, `harga_2minggu`, `harga_12jam`, `harga_9jam`, `harga_6jam`, `harga_3jam`, `denda_harian_per_jam`.
2. **Entitas Unit Armada Fisik (`ryokou_unit`):**
   - Atribut: `id`, `kode_unit` (Unik & Readonly, misal `B122`), `motor_id`, `nomor_plat`, `warna`, `pool_parkir_default`, `status_servis`.
3. **Entitas Lacak Posisi Unit (`ryokou_lacak`):**
   - Atribut (1-unit-1-baris): `unit_id`, `status_posisi` (`parkir` | `servis` | `disewa`), `pool_parkir` (`malang` | `batu`), `nama_bengkel`, `kontak_bengkel`, `estimasi_selesai`, `booking_id`, `nama_penyewa`, `tenggat_kembali`, `updated_at`, `updated_by`.
4. **Entitas Transaksi Penyewaan (`penyewaan`):**
   - Atribut: `id`, `no_booking` (`RYK-YYYYMMDD-XXX`), `nama_penyewa`, `jenis_id_pendukung`, `pool_area`, `alamat_antar`, `alamat_jemput`, `motor_id`, `unit_id`, `status` (`Booking`, `Approve`, `Disewa`, `Selesai`), `start_epoch`, `end_epoch`, `total_biaya`, `denda_akhir`, `riwayat_tukar_unit`.

---

## 7. STRATEGI PENGUJIAN (MODE LITE)

1. **Uji Validasi Ketersediaan (Anti Double-Booking):** Simulasi pemesanan bentrok pada unit yang sama di rentang overlap (termasuk buffer 90 menit) wajib menghasilkan status *Conflict/Unavailable*.
2. **Uji Transisi State Machine:** Pengujian transisi status secara sekuensial dan verifikasi sinkronisasi otomatis ke tabel Lacak Unit.
3. **Uji Step-Up Denda ShortRent:** Verifikasi keterlambatan 60 menit pada sewa 3 Jam, 6 Jam, 9 Jam, dan 12 Jam sesuai formula `BR-04`.
4. **Uji Kepatuhan Privasi (UU PDP):** Verifikasi sanitasi teks yang menolak string 16 digit angka berurutan.
