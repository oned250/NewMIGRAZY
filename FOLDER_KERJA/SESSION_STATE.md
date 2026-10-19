# STATUS SESI (SESSION_STATE.md): LANJUTAN RENTAL MOTOR

**Sumber kebenaran tunggal status task dan titik pemulihan sesi.**  
Enum Status: `PENDING | READY | IN_PROGRESS | BLOCKED | DONE`.

---

## 0. KONTEKS PROYEK (statis)

* **Proyek:** Lanjutan Rental Motor Ryokourent (Malang Raya & Kota Batu)
* **Target:** Migrasi & Modernisasi Alternatif Decoupled (React 19 + TypeScript + REST/PostgreSQL) tanpa merusak WordPress Native
* **Aturan Utama:** Mode LITE (4 berkas kontrol di `FOLDER_KERJA/`), Proteksi Kode Eksisting `D-31` (100% aman)
* **Stack:** Next.js 15+ App Router, React 19, TypeScript, Tailwind CSS, Google Cloud SQL (PostgreSQL), Drizzle ORM, Firebase Auth
* **Prinsip Operasional:** Checkpoint-First & Kode-Dulu, verifikasi `compile_applet` & `lint_applet`

---

## 1. STATUS AKTIF

* **Timestamp Audit:** 2026-10-19 01:18:00 WIB
* **Cabang Git:** `main`
* **Task Terakhir DONE:** `TASK-005`
* **Task Aktif:** `TASK-006`
* **Status Task Aktif:** `READY`
* **Task Berikutnya:** `TASK-007`

---

## 2. MATRIKS TASK

| ID Task | Nama Task | Dependensi | Status | Bukti Verifikasi | Disetujui |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Restrukturisasi Repositori & Arsip Berkas Usang | - | DONE | Direktori rapi, /NEW_TASK.md duplikat dibersihkan, 4 berkas kontrol aktif | ya |
| `TASK-002` | Konsolidasi Baseline & Sinkronisasi Aturan Bisnis (D-01..D-31) | TASK-001 | DONE | Skema PostgreSQL Cloud SQL 6 tabel terverifikasi di information_schema, Drizzle ORM terpasang, baseline terisi, proteksi D-31 terjamin | ya |
| `TASK-003` | Dashboard Admin — Manajemen Model & Kategori Motor | TASK-002 | DONE | REST API `/api/motor-models` & `/[id]` (GET/POST/PUT/DELETE) terverifikasi, kalkulator multi-tier tarif ribuan otomatis, antarmuka `MotorModelManager.tsx` interaktif, simulator D-18/D-27 aktif, compile & lint 100% sukses | ya |
| `TASK-004` | Dashboard Admin — Manajemen Unit Armada Fisik | TASK-003 | DONE | REST API `/api/armada-units`, `/[id]`, & `/[id]/servis` aktif; pendaftaran unit unik teruji; immutability kode_unit readonly (AC-02) terverifikasi; sinkronisasi 1 baris lacak_units (AC-03 & D-26) otomatis; antarmuka `ArmadaUnitManager.tsx` interaktif di tab "Armada Fisik (004)" | ya |
| `TASK-005` | Dashboard Admin — Transaksi & State Machine (Accept, Reject, Cancel, Selesai) | TASK-004 | DONE | REST API `/api/penyewaan`, `/[id]`, & `/available-units` aktif; alur 4 status resmi (Booking -> Approve -> Disewa -> Selesai) terverifikasi; proteksi Anti Double-Booking + buffer 90m (AC-01) teruji; larangan pembatalan saat Disewa (AC-02) teruji; kalkulasi denda otomatis ShortRent Step-Up & harian (AC-03) teruji; sinkronisasi status posisi lacak_units terverifikasi; antarmuka `BookingStateMachineManager.tsx` aktif di tab "Transaksi & State (005)" | ya |
| `TASK-006` | Dashboard Admin — Monitoring Lacak Unit Real-Time (Parkir, Disewa, Servis) | TASK-005 | READY | Menunggu eksekusi: monitoring terpadu 1 baris aktif per unit fisik (Opsi 3A), filter instan (Parkir Pool Malang/Batu, Servis Bengkel, Disewa), update cepat status servis & catatan | - |
| `TASK-007` | Prototipe Arsitektur Alternatif Modern (Vite / React 19 / TypeScript) | TASK-006 | PENDING | - | - |
| `TASK-008` | Verifikasi E2E & Finalisasi Handover | TASK-007 | PENDING | - | - |

---

## 3. WORK IN PROGRESS (WAL)

Catatan tulis-dahulu (WAL):

* **Task Selesai:** TASK-005 (Dashboard Admin — Transaksi & State Machine)
* **Langkah Sedang Dikerjakan:** Transisi ke TASK-006 (Dashboard Admin — Monitoring Lacak Unit Real-Time)
* **Berkas Disentuh & Dibuat:**
  - `app/api/penyewaan/route.ts` (REST API: GET daftar transaksi sewa + relasi model & armada, POST buat booking baru berstatus 'Booking' dengan kepatuhan UU PDP tanpa NIK KTP)
  - `app/api/penyewaan/available-units/route.ts` (REST API: Kalkulasi ketersediaan armada fisik per model dengan buffer jeda 90 menit / 5400 detik sesuai BR-01)
  - `app/api/penyewaan/[id]/route.ts` (REST API: Transisi State Machine: Approve dengan kunci unit, Serah Terima Disewa & sinkronisasi lacak, Selesai dengan kalkulasi denda otomatis ShortRent Step-Up / Harian & pelepasan unit, Reject/Cancel dengan proteksi AC-02, serta Tukar Unit)
  - `components/admin/BookingStateMachineManager.tsx` (Komponen antarmuka admin transaksi: ringkasan metrik 4 status, filter pool & pencarian no booking, kartu detail pesanan, modal approve dengan deteksi bentrok jadwal atomik, modal selesaikan sewa dengan komputasi denda real-time, modal konfirmasi 2 langkah batal/tolak, dan modal buat pesanan baru)
  - `app/page.tsx` (Integrasi tab "Transaksi & State (005)" pada desktop header dan mobile navigation bar)
  - `FOLDER_KERJA/SESSION_STATE.md` (Update checkpoint status: TASK-005 DONE, TASK-006 READY)
* **Hasil Verifikasi:**
  - `curl POST /api/penyewaan` (Budi Santoso) -> HTTP 201 no booking `RYK-20261019-231` dibuat (status `Booking`).
  - `curl PUT /api/penyewaan/1` (action: approve, unitId: 1) -> HTTP 200 unit `B101` terkunci ke pesanan 1.
  - Test Anti Double-Booking (AC-01): Percobaan mengalokasikan unit `B101` ke pesanan 2 yang berbenturan jadwal -> DITOLAK HTTP 400: *"ANTI DOUBLE-BOOKING (AC-01): Unit B101 bertabrakan jadwal (+ buffer 90 menit) dengan pesanan RYK-20261019-231 atas nama Budi Santoso"*.
  - Transisi Disewa: Kunci diserahterimakan -> `lacak_units` unit `B101` otomatis berubah ke `status_posisi = 'disewa'`, mencatat penyewa Budi Santoso dan nomor booking.
  - Test Pembatalan Saat Disewa (AC-02): Percobaan pembatalan saat status Disewa -> DITOLAK HTTP 400: *"PELANGGARAN ATURAN (AC-02): Pesanan berstatus 'Disewa' TIDAK DAPAT dibatalkan atau ditolak! Unit motor sedang berada di tangan pelanggan"*.
  - Test Selesai & Denda (AC-03): Selesai 2 jam terlambat -> Denda otomatis Rp 40.000 (2 jam x Rp 20.000) tercatat di `dendaAkhir`, dan unit `B101` otomatis dibebaskan kembali ke `status_posisi = 'parkir'` di Pool Malang.
  - Test ShortRent Step-Up (BR-04 & D-27): Pesanan 3 Jam NMAX selesai terlambat 75 menit (>=60m) -> Tagihan otomatis step-up naik ke paket 6 Jam (+Rp 20.000).
  - Test Pembatalan Sebelum Disewa: Pesanan 2 (status Booking) sukses dibatalkan dengan alasan terdokumentasi.
  - `compile_applet` -> Build succeeded 0 error.
  - `lint_applet` -> 0 lint error.
  - Proteksi D-31 -> 13 berkas di `wp-content/` tetap 100% utuh.

---

## 4. DAFTAR ISU & BLOKER

* *Tidak ada bloker aktif.*

---

## 5. CATATAN PEMULIHAN SESI

Jika sesi terputus atau beralih ke agen AI lain:
1. Baca `FOLDER_KERJA/SESSION_STATE.md` (file ini) untuk mengetahui status terakhir (`TASK-005` selesai, `TASK-006` siap dieksekusi).
2. Baca `FOLDER_KERJA/TASKS.md` bagian `TASK-006` untuk rincian monitoring lacak unit real-time (tabel 1 baris per unit fisik, filter cepat posisi Parkir/Servis/Disewa, dan integrasi dengan tabel `lacak_units` yang sudah terisi).
3. Seluruh tabel PostgreSQL dan API terkait telah aktif dan tersinkronisasi.
