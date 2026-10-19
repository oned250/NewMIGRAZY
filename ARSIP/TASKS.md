# DAFTAR TASK IMPLEMENTASI (TASKS.md)

Dokumen ini berisi rincian urutan seluruh task proyek **Ryokourent** dari FASE 0 hingga FASE 5 (termasuk revisi terbaru `D-26` & `D-27`).

---

## FASE 0: Analisis Blueprint, Tata Kelola AI, & Keputusan Bisnis (`TASK-001` .. `TASK-004`)

### TASK-001: Analisis Blueprint dan Dokumentasi Proyek
- **Tujuan:** Menyelaraskan identitas bisnis Ryokourent (Malang Raya & Kota Wisata Batu) ke dalam dokumen teknis.
- **File:** `PROJECT_OVERVIEW.md`, `BLUEPRINT.md`, `README.md`.
- **Status:** `DONE`

### TASK-002: Inisialisasi Struktur Repo & Standar Git/Koding
- **Tujuan:** Menetapkan aturan kerja AI (`AI_RULES.md`, `AI_WORKFLOW.md`), standar koding WordPress (`docs/CODING_STANDARDS.md`), dan Git Flow (`docs/GIT_WORKFLOW.md`).
- **Status:** `DONE`

### TASK-003: Penetapan ADR Awal (`D-01..D-14`) & Resolusi Konflik
- **Tujuan:** Mengunci keputusan platform WordPress, RBAC Operator, jam layanan 07.00–23.00 WIB, dan alur status dasar.
- **File:** `DECISIONS.md`, `OPEN_QUESTIONS.md`.
- **Status:** `DONE`

### TASK-004: Penyelesaian Konflik Sisa (`D-15..D-25`) & Skema UU PDP
- **Tujuan:** Mengunci aturan jeda 90 menit, tukar unit berkala, minimasi data pribadi UU PDP (tanpa NIK 16 digit/foto KTP/IP), serta audit nomor WA.
- **File:** `DECISIONS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `TESTING.md`.
- **Status:** `DONE`

---

## FASE 1: Skema Data, CPT, Meta Fields, & RBAC (`TASK-005` .. `TASK-011`)

### TASK-005 s/d TASK-011: Fondasi Plugin `ryokourent-core`
- **Cakupan:** Bootstrap plugin (`ryokourent-core.php`), registrasi CPT (`motor`, `ryokou_unit`, `penyewaan`, `ryokou_paket`), custom post status (`ryokou_booking`, `ryokou_approved`, `ryokou_disewa`, `ryokou_selesai`, `ryokou_servis`), sanitasi anti-NIK 16 digit (`includes/meta-fields.php`), role `ryokou_operator` (`includes/user-roles.php`), dan `uninstall.php`.
- **Status:** `DONE`

---

## FASE 2: Mesin Ketersediaan & Kunci Atomik (`TASK-012` .. `TASK-015`)

### TASK-012 s/d TASK-015: Core Availability Engine
- **Cakupan:** Helper waktu WIB & epoch UTC (`includes/helpers.php`), perhitungan stok bebas dengan jeda 90 menit & proteksi overtime $\max(\text{tenggat}, \text{sekarang})$ (`includes/availability.php`), kunci atomik MySQL `GET_LOCK` dengan pelepasan aman di blok `finally`, serta endpoint AJAX `ryokourent_check_stock`.
- **Status:** `DONE`

---

## FASE 3: State Machine Booking & Panel Operasional Admin (`TASK-016` .. `TASK-020`)

### TASK-016 s/d TASK-020: Alur Transaksi & Tindakan Staf
- **Cakupan:** Generator nomor booking atomik `RYK-YYYYMMDD-XXX`, transisi status (`Approve`, `Serah Terima`, `Selesai`, `Tukar Unit`, `Ubah Jadwal`), hapus 2 langkah untuk `Reject`/`Cancel` (blokir cancel setelah `Disewa`), WP-Cron & Lazy Purge 48 jam, serta kolom admin penyewaan (`admin/booking-columns.php`).
- **Status:** `DONE`

---

## FASE 4: Form Publik, Integrasi WhatsApp, Pengaturan, Tema, & QA (`TASK-021` .. `TASK-030`)

### TASK-021 s/d TASK-030: Frontend, WhatsApp, Settings Audit, Child Theme, & Rilis
- **Cakupan:** Form booking publik anti-bot (`public/forms.php`), generator pesan WhatsApp UTF-8 (`includes/whatsapp.php`), shortcodes katalog & paket, halaman pengaturan dengan audit log nomor WA & bulk pricing (`-50%` s/d `+200%`), child theme `generatepress-child` Hijau Ryokou, matriks QA, dan i18n gettext.
- **Status:** `DONE`

---

## FASE 5: Pembaruan Pasca-Rilis & Revisi Operasional (`TASK-031` .. `TASK-034`)

### TASK-031: Implementasi 2 Kategori Tarif (Harian & ShortRent) + Cascading Dropdown (`D-18`)
- **Tujuan:** Menampilkan harga 1 Hari sebagai harga utama pelanggan dan menyediakan dropdown bertingkat Kategori (`Harian` / `Jam ShortRent` / `Paket`) → Sub-durasi (`1 Hari`, `1 Minggu`, `2 Minggu`, `12 Jam`, `9 Jam`, `6 Jam`, `3 Jam`).
- **File:** `includes/meta-fields.php`, `public/templates.php`, `public/forms.php`, `assets/js/ryokourent-booking.js`, `assets/css/ryokourent-public.css`.
- **Status:** `DONE`

### TASK-032: Indikator Stok Biner (`Tersedia` / `Habis`) & Panduan XAMPP Win 11 (`D-05`)
- **Tujuan:** Menyederhanakan indikator stok menjadi 2 status tegas (`Tersedia` dan `Habis`) untuk kejelasan kategori motor berarmada 1 unit, serta menyusun panduan simulasi lokal Windows 11.
- **File:** `includes/availability.php`, `docs/PANDUAN_XAMPP_WIN11_SIMULASI.md`.
- **Status:** `DONE`

### TASK-033: Pool Sebagai Tempat Parkir Global & Penambahan CPT Lacak Unit `ryokou_lacak` (`D-26`)
- **Tujuan:**
  1. Menghapus pembagian kaku kuota armada Pool Malang vs Pool Batu karena Pool hanya berfungsi sebagai tempat parkir fisik.
  2. Menambahkan CPT `ryokou_lacak` (**Lacak Unit**) untuk melacak posisi setiap unit fisik: berada di pool parkir mana (`Pool Malang` / `Pool Batu`), jika servis berada di bengkel mana (nama bengkel, kontak, estimasi selesai), dan jika disewa berada di tangan siapa (nama penyewa, no booking, jadwal kembali).
- **File:** `includes/post-types.php`, `includes/meta-fields.php`, `includes/availability.php`, `admin/lacak-columns.php`, `DECISIONS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`.
- **Kriteria Selesai:**
  - `ryokourent_get_available_units()` menghitung seluruh unit bebas secara global per tipe motor dan menyertakan label posisi parkir saat ini.
  - CPT `ryokou_lacak` tampil di menu admin dengan kolom Pool Parkir, Bengkel Servis, dan Penyewa Aktif, serta otomatis tersinkronisasi melalui `ryokourent_sync_unit_tracking()`.
- **Status:** `DONE`

### TASK-034: Aturan Denda ShortRent Step-Up 60 Menit & 12 Jam = Denda Harian (`D-27`)
- **Tujuan:**
  1. Untuk sewa ShortRent (`3 Jam`, `6 Jam`, `9 Jam`), keterlambatan **60 menit** otomatis menaikkan tagihan ke **kategori jam di atasnya** (contoh: sewa 3 jam terlambat $\ge 60$ menit masuk kategori 6 jam; 6 jam $\to$ 9 jam; 9 jam $\to$ 12 jam).
  2. Untuk sewa ShortRent **12 Jam**, denda keterlambatan yang dikenakan **sama dengan denda harian** (`_ryokou_denda_harian`, default Rp20.000/jam).
- **File:** `includes/booking.php`, `admin/booking-columns.php`, `public/forms.php`, `includes/whatsapp.php`, `assets/js/ryokourent-booking.js`, `DECISIONS.md`, `DATA_MODEL.md`, `TESTING.md`.
- **Kriteria Selesai:**
  - Fungsi `ryokourent_calculate_overtime_penalty()` menghitung otomatis kenaikan jenjang jam saat keterlambatan $\ge 60$ menit dan menerapkan denda harian pada paket 12 jam.
  - Elemen `#ryokou_denda_shortrent_note` tampil di form pemesanan saat kategori Jam (ShortRent) dipilih dan klausulnya tercantum di pesan WhatsApp.
- **Status:** `DONE`

---

## FASE 6: Uji Manual (UAT), Update Penyesuaian Operasional, & Permintaan Baru (`TASK-035` .. dst.)

### TASK-035: Audit Menyeluruh 19 Dokumen MD & Penetapan Alur Kerja Baru Fase Uji Manual / Penyesuaian (`D-28`)
- **Tujuan:**
  1. Memeriksa dari awal kelengkapan dan konsistensi seluruh 19 berkas Markdown proyek terhadap kondisi sistem terkini (`D-01..D-28`).
  2. Menetapkan **Alur Kerja 4 Jalur (`D-28`)** yang dirancang khusus untuk tahap **Uji Manual (UAT), Update Penyesuaian Aturan, dan Permintaan Fitur Baru (Change Request)** melalui baris `Permintaan User` di `docs/HANDOVER.md`.
- **File:** `AI_WORKFLOW.md`, `AI_RULES.md`, `DECISIONS.md`, `SESSION_STATE.md`, `TASKS.md`, `CHANGELOG.md`, `docs/HANDOVER.md`, `docs/ADMIN_GUIDE.md`, `docs/DEPLOYMENT_GUIDE.md`.
- **Status:** `DONE`
