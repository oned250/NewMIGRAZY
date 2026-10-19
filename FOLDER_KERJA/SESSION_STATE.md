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

* **Timestamp Audit:** 2026-10-19 00:52:00 WIB
* **Cabang Git:** `main`
* **Task Terakhir DONE:** `TASK-004`
* **Task Aktif:** `TASK-005`
* **Status Task Aktif:** `READY`
* **Task Berikutnya:** `TASK-006`

---

## 2. MATRIKS TASK

| ID Task | Nama Task | Dependensi | Status | Bukti Verifikasi | Disetujui |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Restrukturisasi Repositori & Arsip Berkas Usang | - | DONE | Direktori rapi, /NEW_TASK.md duplikat dibersihkan, 4 berkas kontrol aktif | ya |
| `TASK-002` | Konsolidasi Baseline & Sinkronisasi Aturan Bisnis (D-01..D-31) | TASK-001 | DONE | Skema PostgreSQL Cloud SQL 6 tabel terverifikasi di information_schema, Drizzle ORM terpasang, baseline terisi, proteksi D-31 terjamin | ya |
| `TASK-003` | Dashboard Admin — Manajemen Model & Kategori Motor | TASK-002 | DONE | REST API `/api/motor-models` & `/[id]` (GET/POST/PUT/DELETE) terverifikasi, kalkulator multi-tier tarif ribuan otomatis, antarmuka `MotorModelManager.tsx` interaktif, simulator D-18/D-27 aktif, compile & lint 100% sukses | ya |
| `TASK-004` | Dashboard Admin — Manajemen Unit Armada Fisik | TASK-003 | DONE | REST API `/api/armada-units`, `/[id]`, & `/[id]/servis` aktif; pendaftaran unit unik teruji; immutability kode_unit readonly (AC-02) terverifikasi; sinkronisasi 1 baris lacak_units (AC-03 & D-26) otomatis; antarmuka `ArmadaUnitManager.tsx` interaktif di tab "Armada Fisik (004)" | ya |
| `TASK-005` | Dashboard Admin — Transaksi & State Machine (Accept, Reject, Cancel) | TASK-004 | READY | Menunggu eksekusi: alur pemesanan 4 status (Booking -> Approve -> Disewa -> Selesai), penguncian unit anti-double booking, batas pembatalan, dan kalkulasi denda otomatis saat selesai | - |
| `TASK-006` | Dashboard Admin — Monitoring Lacak Unit Real-Time (Parkir, Disewa, Servis) | TASK-005 | PENDING | - | - |
| `TASK-007` | Prototipe Arsitektur Alternatif Modern (Vite / React 19 / TypeScript) | TASK-006 | PENDING | - | - |
| `TASK-008` | Verifikasi E2E & Finalisasi Handover | TASK-007 | PENDING | - | - |

---

## 3. WORK IN PROGRESS (WAL)

Catatan tulis-dahulu (WAL):

* **Task Selesai:** TASK-004 (Dashboard Admin — Manajemen Unit Armada Fisik)
* **Langkah Sedang Dikerjakan:** Transisi ke TASK-005 (Dashboard Admin — Transaksi & State Machine)
* **Berkas Disentuh & Dibuat:**
  - `app/api/armada-units/route.ts` (REST API: GET daftar armada + info model & lacak real-time, POST pendaftaran unit baru dengan validasi kode_unit unik dan auto-sync 1 baris ke `lacak_units`)
  - `app/api/armada-units/[id]/route.ts` (REST API: GET detail, PUT update field plat/warna/pool/odometer dengan proteksi immutability readonly `kode_unit` (AC-02), DELETE dengan proteksi transaksi aktif sewa)
  - `app/api/armada-units/[id]/servis/route.ts` (REST API: Aksi cepat masuk bengkel / selesai servis dengan update status `armada_units` dan sinkronisasi otomatis status posisi `lacak_units`)
  - `components/admin/ArmadaUnitManager.tsx` (Komponen antarmuka admin armada fisik: metric card, search & multi-filter, grid & table view, modal pendaftaran dengan live preview, modal edit dengan readonly locked code, modal aksi bengkel cepat, modal konfirmasi hapus aman)
  - `app/page.tsx` (Integrasi tab "Armada Fisik (004)" pada desktop dan mobile navigation)
  - `FOLDER_KERJA/SESSION_STATE.md` (Update checkpoint status: TASK-004 DONE, TASK-005 READY)
* **Hasil Verifikasi:**
  - `curl GET /api/armada-units` -> HTTP 200 dengan data lengkap unit armada fisik dari Cloud SQL PostgreSQL.
  - `curl POST /api/armada-units` (Unit B151, Yamaha R15 V4, plat N 1551 R) -> HTTP 201 sukses terdaftar.
  - Query Cloud SQL `lacak_units` -> Terbukti 1 baris data lacak otomatis dibuat untuk B151 di Pool MALANG.
  - Test Duplikasi `B151` -> HTTP 400 "Kode unit 'B151' sudah terdaftar. Kode unit harus unik!".
  - Test AC-02 Immutability (PUT B999 ke unit B151) -> HTTP 400 ditolak tegas: "Pelanggaran Aturan AC-02: Kode Unit ('B151') bersifat permanen & readonly setelah dibuat, tidak dapat diubah!".
  - Test Aksi Servis (`/servis`) -> Unit B151 sukses dipindahkan ke servis di Yamaha Surya Agung Malang dan `lacak_units.status_posisi` berubah menjadi `servis`. Selesai servis mengembalikan posisi menjadi `parkir`.
  - `compile_applet` -> Build succeeded 0 error.
  - `lint_applet` -> 0 lint error.
  - Proteksi D-31 -> 13 berkas di `wp-content` tetap utuh 100%.

---

## 4. DAFTAR ISU & BLOKER

* *Tidak ada bloker aktif.*

---

## 5. CATATAN PEMULIHAN SESI

Jika sesi terputus atau beralih ke agen AI lain:
1. Baca `FOLDER_KERJA/SESSION_STATE.md` (file ini) untuk mengetahui status terakhir (`TASK-004` selesai, `TASK-005` siap dieksekusi).
2. Baca `FOLDER_KERJA/TASKS.md` bagian `TASK-005` untuk rincian state machine 4 status transaksi booking (`Booking` -> `Approve` -> `Disewa` -> `Selesai`), anti double-booking, reject/cancel, dan kalkulasi denda ShortRent bertingkat saat selesai.
3. Seluruh tabel PostgreSQL telah siap: `penyewaan`, `lacak_units`, `armada_units`, `motor_models`.
