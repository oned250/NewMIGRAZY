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

* **Timestamp Audit:** 2026-10-20 01:26:00 WIB
* **Cabang Git:** `main`
* **Task Terakhir DONE:** `TASK-007`
* **Task Aktif:** `TASK-008`
* **Status Task Aktif:** `READY`
* **Task Berikutnya:** `-` (Finalisasi Handover)

---

## 2. MATRIKS TASK

| ID Task | Nama Task | Dependensi | Status | Bukti Verifikasi | Disetujui |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Restrukturisasi Repositori & Arsip Berkas Usang | - | DONE | Direktori rapi, /NEW_TASK.md duplikat dibersihkan, 4 berkas kontrol aktif | ya |
| `TASK-002` | Konsolidasi Baseline & Sinkronisasi Aturan Bisnis (D-01..D-31) | TASK-001 | DONE | Skema PostgreSQL Cloud SQL 6 tabel terverifikasi di information_schema, Drizzle ORM terpasang, baseline terisi, proteksi D-31 terjamin | ya |
| `TASK-003` | Dashboard Admin — Manajemen Model & Kategori Motor | TASK-002 | DONE | REST API `/api/motor-models` & `/[id]` (GET/POST/PUT/DELETE) terverifikasi, kalkulator multi-tier tarif ribuan otomatis, antarmuka `MotorModelManager.tsx` interaktif, simulator D-18/D-27 aktif, compile & lint 100% sukses | ya |
| `TASK-004` | Dashboard Admin — Manajemen Unit Armada Fisik | TASK-003 | DONE | REST API `/api/armada-units`, `/[id]`, & `/[id]/servis` aktif; pendaftaran unit unik teruji; immutability kode_unit readonly (AC-02) terverifikasi; sinkronisasi 1 baris lacak_units (AC-03 & D-26) otomatis; antarmuka `ArmadaUnitManager.tsx` interaktif di tab "Armada Fisik (004)" | ya |
| `TASK-005` | Dashboard Admin — Transaksi & State Machine (Accept, Reject, Cancel, Selesai) | TASK-004 | DONE | REST API `/api/penyewaan`, `/[id]`, & `/available-units` aktif; alur 4 status resmi (Booking -> Approve -> Disewa -> Selesai) terverifikasi; proteksi Anti Double-Booking + buffer 90m (AC-01) teruji; larangan pembatalan saat Disewa (AC-02) teruji; kalkulasi denda otomatis ShortRent Step-Up & harian (AC-03) teruji; sinkronisasi status posisi lacak_units terverifikasi; antarmuka `BookingStateMachineManager.tsx` aktif di tab "Transaksi & State (005)" | ya |
| `TASK-006` | Dashboard Admin — Monitoring Lacak Unit Real-Time (Parkir, Disewa, Servis) | TASK-005 | DONE | REST API `/api/lacak-units` & `/[id]` aktif; pemantauan 1 baris aktif per unit fisik tanpa duplikasi (AC-01 & Opsi 3A) terverifikasi; filter instan posisi (Parkir Malang/Batu, Servis, Disewa) (AC-02) aktif; update cepat status servis & catatan dengan sinkronisasi otomatis ke armada_units (AC-03) teruji; antarmuka `LiveUnitTrackingDashboard.tsx` aktif di tab "Lacak Real-Time (006)" | ya |
| `TASK-007` | Prototipe Arsitektur Alternatif Modern (Vite / React 19 / TypeScript) | TASK-006 | DONE | Portal pemesanan interaktif publik modern (`CustomerBookingPortal.tsx`) terintegrasi penuh di tab "Portal Publik (007)"; katalog model dengan multi-tier tarif (harian & shortrent); indikator stok biner real-time (AC-02); formulir pemesanan patuh UU PDP anti-NIK KTP (BR-05); terhubung langsung ke State Machine POST `/api/penyewaan`; kompilasi build & lint 100% lulus (AC-01) | ya |
| `TASK-008` | Verifikasi E2E & Finalisasi Handover | TASK-007 | READY | Menunggu eksekusi: pengujian menyeluruh seluruh skenario kebutuhan inti (D-01 s/d D-31), audit kepatuhan ZLCE v3.2, dan pembaruan dokumen kontrol HANDOVER.md | - |

---

## 3. WORK IN PROGRESS (WAL)

Catatan tulis-dahulu (WAL):

* **Task Selesai:** TASK-007 (Prototipe Arsitektur Alternatif Modern)
* **Langkah Sedang Dikerjakan:** Transisi ke TASK-008 (Verifikasi E2E & Finalisasi Handover)
* **Berkas Disentuh & Dibuat:**
  - `components/public/CustomerBookingPortal.tsx` (Perbaikan inisialisasi state formData dengan lazy initializer function, sinkronisasi live catalog & stock dari Cloud SQL, kalkulator durasi dinamis, formulir anti-NIK KTP UU PDP No. 27/2022, integrasi tombol WhatsApp booking & auto-redirect ke antrean operator)
  - `app/page.tsx` (Integrasi tab `portal_publik` di desktop & mobile nav, integrasi komponen CustomerBookingPortal dengan callback `onBookingSuccess`, penyelarasan styling responsif, activeTab default ke `portal_publik`)
  - `FOLDER_KERJA/SESSION_STATE.md` (Update status: TASK-007 DONE, TASK-008 READY)
* **Hasil Verifikasi:**
  - `POST /api/penyewaan` (simulasi booking dari Portal Publik): Berhasil membuat pesanan baru `RYK-20261020-990` dengan status `Booking`, tanpa menyimpan NIK KTP (hanya jenis ID pendukung `SIM_C`), tersimpan aman di Cloud SQL PostgreSQL.
  - `GET /api/penyewaan/available-units`: Mengembalikan daftar unit fisik yang siap dialokasikan dengan kalkulasi buffer 90 menit anti double-booking.
  - `compile_applet` -> Build succeeded 0 error.
  - `lint_applet` -> 0 lint error.
  - Proteksi D-31 -> 13 berkas di `wp-content/` tetap 100% utuh.

---

## 4. DAFTAR ISU & BLOKER

* *Tidak ada bloker aktif.*

---

## 5. CATATAN PEMULIHAN SESI

Jika sesi terputus atau beralih ke agen AI lain:
1. Baca `FOLDER_KERJA/SESSION_STATE.md` (file ini) untuk mengetahui status terakhir (`TASK-007` selesai, `TASK-008` siap dieksekusi).
2. Baca `FOLDER_KERJA/TASKS.md` bagian `TASK-008` untuk verifikasi menyeluruh seluruh skenario kebutuhan inti (D-01 s/d D-31), audit kepatuhan ZLCE v3.2, dan pembaruan dokumen kontrol `HANDOVER.md`.
3. Seluruh arsitektur terpadu (Katalog Model, Unit Fisik, Transaksi State Machine, Lacak Real-Time, dan Portal Pemesanan Publik) telah beroperasi penuh dan terverifikasi.
