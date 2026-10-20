# BACKLOG TASK PENGEMBANGAN (TASKS.md): LANJUTAN RENTAL MOTOR

Status task dicatat di `SESSION_STATE.md`. Definisi status: `PENDING | READY | IN_PROGRESS | BLOCKED | DONE`.

---

## 1. PETA FASE

* **FASE 0: Konsolidasi & Restrukturisasi Berkas Kontrol** (`TASK-001` s/d `TASK-002`)
* **FASE 1: Dashboard Admin — Manajemen Model & Kategori Motor** (`TASK-003`)
* **FASE 2: Dashboard Admin — Manajemen Unit Armada Fisik** (`TASK-004`)
* **FASE 3: Dashboard Admin — Transaksi & State Machine (Accept, Reject, Cancel)** (`TASK-005`)
* **FASE 4: Dashboard Admin — Monitoring Lacak Unit Real-Time (Parkir, Disewa, Servis)** (`TASK-006`)
* **FASE 5: Prototipe Arsitektur Alternatif Modern (Vite / React 19 / TypeScript)** (`TASK-007`)
* **FASE 6: Verifikasi E2E & Finalisasi Handover** (`TASK-008`)

---

## 2. FORMAT TASK DETAIL

### TASK-001: Restrukturisasi Repositori & Arsip Berkas Usang
* **Fase:** FASE 0
* **Deskripsi:** Merapikan direktori kerja, mengarsipkan berkas lama yang tidak digunakan ke `/ARSIP/`, dan mengaktifkan 4 berkas kontrol ZLCE v3.2 Mode LITE (`BLUEPRINT.md`, `TASKS.md`, `SESSION_STATE.md`, `HANDOVER.md`).
* **Dependensi:** -
* **File:** `FOLDER_KERJA/*`, `ARSIP/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md`
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Direktori `/FOLDER_KERJA/` hanya memuat berkas aktif terkini.
  2. Berkas lama tersimpan rapi di `/ARSIP/` tanpa ada file duplikat membingungkan.
* **Test Case:** Validasi struktur direktori bersih.
* **Metode Verifikasi:** `list_dir` dan verifikasi integritas berkas kontrol.

---

### TASK-002: Konsolidasi Baseline & Sinkronisasi Aturan Bisnis (`D-01..D-31`)
* **Fase:** FASE 0
* **Deskripsi:** Memvalidasi seluruh aturan operasional rental (`D-01` s/d `D-31`) terintegrasi ke dalam spesifikasi sistem tanpa merusak kode WordPress native eksisting (`D-31`).
* **Dependensi:** `TASK-001`
* **File:** `FOLDER_KERJA/SPEC_AND_DECISIONS.md`, `FOLDER_KERJA/SESSION_STATE.md`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md`
* **Docs Impact:** `SPEC_AND_DECISIONS.md`
* **Acceptance Criteria:**
  1. Aturan D-01 s/d D-31 terpetakan konsisten ke `BR-01` s/d `BR-06`.
  2. Kode eksisting `wp-content/` terproteksi 100%.
* **Test Case:** Review konsistensi aturan.
* **Metode Verifikasi:** Peninjauan silang tabel keputusan.

---

### TASK-003: Dashboard Admin — Manajemen Model & Kategori Motor
* **Fase:** FASE 1
* **Deskripsi:** Implementasi antarmuka dan logika tambah/edit model motor, kategori motor (Matic, Sport, Trail, Retro), serta penetapan multi-tier tarif (1 Hari, 1 Minggu, 2 Minggu, 12 Jam, 9 Jam, 6 Jam, 3 Jam) dan denda harian.
* **Dependensi:** `TASK-002`
* **File:** `app/page.tsx`, `components/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md` (MOD-01)
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Admin dapat menambah dan mengubah data model motor beserta kategori.
  2. Multi-tier tarif tersimpan dan terhitung secara otomatis dengan pembulatan ribuan.
* **Test Case:** Input model motor baru dan verifikasi perubahan tarif harian/jam.
* **Metode Verifikasi:** Pengujian UI form & inspeksi state management.

---

### TASK-004: Dashboard Admin — Manajemen Unit Armada Fisik
* **Fase:** FASE 2
* **Deskripsi:** Implementasi antarmuka dan logika kelola unit fisik garasi (`ryokou_unit`): kode unit unik readonly (misal: B122), plat nomor, warna, relasi ke model induk, dan pool parkir fisik (Pool Malang / Pool Batu).
* **Dependensi:** `TASK-003`
* **File:** `app/page.tsx`, `components/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md` (MOD-02)
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Admin dapat mendaftarkan unit fisik baru dengan `kode_unit` unik.
  2. `kode_unit` terkunci (readonly) setelah dibuat.
  3. Lokasi parkir fisik tersinkronisasi ke modul pelacakan.
* **Test Case:** Pendaftaran unit baru dan verifikasi immutability kode unit.
* **Metode Verifikasi:** Uji interaksi form unit fisik & validasi state.

---

### TASK-005: Dashboard Admin — Transaksi & State Machine (Accept, Reject, Cancel, Selesai)
* **Fase:** FASE 3
* **Deskripsi:** Implementasi antarmuka pengelolaan pesanan pelanggan dengan State Machine 4 status (`Booking` -> `Approve Booking` -> `Disewa` -> `Selesai`), aksi konfirmasi (Accept/Approve), tolak/batal (Reject/Cancel dengan konfirmasi 2 langkah), dan kalkulasi otomatis denda ShortRent bertingkat saat Selesai.
* **Dependensi:** `TASK-004`
* **File:** `app/page.tsx`, `components/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md` (MOD-05, MOD-06)
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Aksi Approve mengunci unit fisik yang tersedia (anti double-booking).
  2. Aksi Reject/Cancel hanya dapat dilakukan sebelum status Disewa.
  3. Aksi Selesai menghitung denda keterlambatan jika melebihi jadwal kembali.
* **Test Case:** Alur siklus pemesanan lengkap dan pengujian batas pembatalan saat Disewa.
* **Metode Verifikasi:** Eksekusi skenario state transition pada UI dashboard.

---

### TASK-006: Dashboard Admin — Monitoring Lacak Unit Real-Time (Parkir, Disewa, Servis)
* **Fase:** FASE 4
* **Deskripsi:** Implementasi tabel monitoring dan filter cepat status posisi seluruh unit armada fisik: Parkir di Pool (Malang/Batu), Servis di Bengkel (nama bengkel, kontak, estimasi selesai), atau Sedang Disewa (nama penyewa, no booking, tenggat kembali).
* **Dependensi:** `TASK-005`
* **File:** `app/page.tsx`, `components/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md` (MOD-03)
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Menampilkan 1 baris aktif per unit fisik tanpa duplikasi.
  2. Filter instan berdasarkan status posisi (Parkir, Servis, Disewa) dan Pool.
  3. Admin dapat memperbarui status servis bengkel secara cepat.
* **Test Case:** Filter pencarian unit dan transisi posisi dari Parkir -> Disewa -> Parkir.
* **Metode Verifikasi:** Pengujian filter UI dan update posisi unit.

---

### TASK-007: Prototipe Arsitektur Alternatif Modern (Vite / React 19 / TypeScript)
* **Fase:** FASE 5
* **Deskripsi:** Membangun antarmuka modern mandiri (portal pemesanan interaktif + dashboard admin terpadu) berbasis React 19 / TypeScript / Tailwind CSS dengan state management reaktif dan arsitektur anti double-booking yang siap dihubungkan ke backend REST API.
* **Dependensi:** `TASK-006`
* **File:** `app/*`, `components/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md` (MOD-08, Bagian 4)
* **Docs Impact:** `SESSION_STATE.md`
* **Acceptance Criteria:**
  1. Aplikasi berjalan lancar, responsif, dan bebas error kompilasi/build.
  2. Mendukung katalog model, indikator stok biner, formulir booking anti-NIK, dashboard state machine, dan lacak unit.
* **Test Case:** Kompilasi aplikasi (`compile_applet`) lulus 0 error.
* **Metode Verifikasi:** Eksekusi build & validasi UI interaktif.

---

### TASK-008: Verifikasi E2E & Finalisasi Handover
* **Fase:** FASE 6
* **Deskripsi:** Pengujian menyeluruh seluruh skenario kebutuhan inti, sinkronisasi dokumen kontrol ZLCE, dan penyiapan berkas `HANDOVER.md` siap pakai.
* **Dependensi:** `TASK-007`
* **File:** `FOLDER_KERJA/*`
* **Docs Terkait (Tier 1):** `BLUEPRINT.md`, `TASKS.md`
* **Docs Impact:** `SESSION_STATE.md`, `HANDOVER.md`
* **Acceptance Criteria:**
  1. Seluruh task 001 s/d 007 berstatus DONE dengan bukti verifikasi konkret.
  2. Checkpoint dan log audit mutakhir.
* **Test Case:** Audit kualitas akhir ZLCE.
* **Metode Verifikasi:** `compile_applet` dan peninjauan berkas kontrol.
* **Status:** `DONE` (100% Terverifikasi E2E otomatis, compile 0 error, lint 0 error, D-31 utuh).
